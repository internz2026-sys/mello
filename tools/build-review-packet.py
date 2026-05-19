#!/usr/bin/env python3
"""
Build the counsel-ready 4D review packet.

Reads the canonical per-topic docs in docs/legal-clinical-review/ (those
files remain the source of truth) and emits two BUILD OUTPUTS:

  docs/legal-clinical-review/mello-4D-review-packet.md   (concatenated)
  docs/legal-clinical-review/mello-4D-review-packet.pdf  (Chrome render)

No third-party Python deps (offline-safe). PDF step uses the local
Chrome in --headless --print-to-pdf mode; if Chrome is absent the .md is
still authoritative and self-contained.

Run:  python tools/build-review-packet.py
"""
from __future__ import annotations

import html
import os
import re
import subprocess
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[1]
LCR = REPO / "docs" / "legal-clinical-review"

# Reading order (matches review-packet-index.md). Canonical sources.
ORDER = [
    "README.md",
    "safety-system-summary.md",
    "crisis-flow.md",
    "classifier-baseline-summary.md",
    "review-scenarios.md",
    "open-questions.md",
    "data-retention-questions.md",
    "abuse-disclosure-questions.md",
    "terms-disclaimer-draft.md",
]

OUT_MD = LCR / "mello-4D-review-packet.md"
OUT_HTML = LCR / "mello-4D-review-packet.html"
OUT_PDF = LCR / "mello-4D-review-packet.pdf"


# ── minimal, deterministic Markdown → HTML for our controlled subset ──
# Handles: # .. #### headings, ``` fenced code, GFM tables, > blockquotes,
# -/* and 1. lists (one nesting level), --- hr, and inline
# **bold** *italic* `code` [text](url). Inline is NOT applied inside code.

def _inline(text: str) -> str:
    out, i, n = [], 0, len(text)
    while i < n:
        c = text[i]
        if c == "`":
            j = text.find("`", i + 1)
            if j != -1:
                out.append("<code>" + html.escape(text[i + 1 : j]) + "</code>")
                i = j + 1
                continue
        if text.startswith("**", i):
            j = text.find("**", i + 2)
            if j != -1:
                out.append("<strong>" + _inline(text[i + 2 : j]) + "</strong>")
                i = j + 2
                continue
        if c == "*":
            j = text.find("*", i + 1)
            if j != -1:
                out.append("<em>" + _inline(text[i + 1 : j]) + "</em>")
                i = j + 1
                continue
        m = re.match(r"\[([^\]]+)\]\(([^)]+)\)", text[i:])
        if m:
            out.append(
                '<a href="%s">%s</a>'
                % (html.escape(m.group(2)), _inline(m.group(1)))
            )
            i += m.end()
            continue
        out.append(html.escape(c))
        i += 1
    return "".join(out)


def md_to_html(md: str) -> str:
    lines = md.split("\n")
    htmlout: list[str] = []
    i, n = 0, len(lines)

    def flush_para(buf: list[str]) -> None:
        if buf:
            htmlout.append("<p>" + _inline(" ".join(buf).strip()) + "</p>")
            buf.clear()

    para: list[str] = []
    while i < n:
        line = lines[i]

        # fenced code
        if line.lstrip().startswith("```"):
            flush_para(para)
            i += 1
            code: list[str] = []
            while i < n and not lines[i].lstrip().startswith("```"):
                code.append(lines[i])
                i += 1
            i += 1  # closing fence
            htmlout.append(
                "<pre><code>" + html.escape("\n".join(code)) + "</code></pre>"
            )
            continue

        # heading
        m = re.match(r"^(#{1,4})\s+(.*)$", line)
        if m:
            flush_para(para)
            lvl = len(m.group(1))
            htmlout.append("<h%d>%s</h%d>" % (lvl, _inline(m.group(2)), lvl))
            i += 1
            continue

        # hr (exactly ---)
        if re.match(r"^-{3,}\s*$", line):
            flush_para(para)
            htmlout.append("<hr/>")
            i += 1
            continue

        # table: header row + |---| separator
        if "|" in line and i + 1 < n and re.match(
            r"^\s*\|?\s*:?-{2,}.*", lines[i + 1]
        ):
            flush_para(para)

            def cells(row: str) -> list[str]:
                row = row.strip()
                if row.startswith("|"):
                    row = row[1:]
                if row.endswith("|"):
                    row = row[:-1]
                return [c.strip() for c in row.split("|")]

            head = cells(line)
            i += 2  # skip header + separator
            htmlout.append("<table><thead><tr>")
            htmlout += ["<th>%s</th>" % _inline(c) for c in head]
            htmlout.append("</tr></thead><tbody>")
            while i < n and "|" in lines[i] and lines[i].strip():
                htmlout.append("<tr>")
                htmlout += ["<td>%s</td>" % _inline(c) for c in cells(lines[i])]
                htmlout.append("</tr>")
                i += 1
            htmlout.append("</tbody></table>")
            continue

        # blockquote (consecutive > lines)
        if line.lstrip().startswith(">"):
            flush_para(para)
            quote: list[str] = []
            while i < n and lines[i].lstrip().startswith(">"):
                quote.append(re.sub(r"^\s*>\s?", "", lines[i]))
                i += 1
            htmlout.append(
                "<blockquote>" + _inline(" ".join(quote).strip())
                + "</blockquote>"
            )
            continue

        # lists (one nesting level via >=2 leading spaces)
        if re.match(r"^\s*([-*]|\d+\.)\s+", line):
            flush_para(para)
            ordered = bool(re.match(r"^\s*\d+\.\s+", line))
            tag = "ol" if ordered else "ul"
            htmlout.append("<%s>" % tag)
            cur_nested = False
            while i < n and re.match(r"^\s*([-*]|\d+\.)\s+", lines[i]):
                raw = lines[i]
                indent = len(raw) - len(raw.lstrip(" "))
                item = re.sub(r"^\s*([-*]|\d+\.)\s+", "", raw)
                if indent >= 2:
                    if not cur_nested:
                        htmlout.append("<ul>")
                        cur_nested = True
                    htmlout.append("<li>" + _inline(item) + "</li>")
                else:
                    if cur_nested:
                        htmlout.append("</ul>")
                        cur_nested = False
                    htmlout.append("<li>" + _inline(item) + "</li>")
                i += 1
            if cur_nested:
                htmlout.append("</ul>")
            htmlout.append("</%s>" % tag)
            continue

        # blank line ends a paragraph
        if not line.strip():
            flush_para(para)
            i += 1
            continue

        para.append(line)
        i += 1

    flush_para(para)
    return "\n".join(htmlout)


CSS = """
@page { margin: 18mm 16mm; }
body { font: 11pt/1.5 Georgia,'Times New Roman',serif; color:#1a1a1a;
       max-width: 760px; margin: 0 auto; }
h1 { font-size: 19pt; border-bottom: 2px solid #333; padding-bottom:4px;
     margin-top: 0; }
h2 { font-size: 14.5pt; margin-top: 1.4em; border-bottom:1px solid #ccc; }
h3 { font-size: 12.5pt; margin-top: 1.2em; }
h4 { font-size: 11pt; text-transform: uppercase; letter-spacing:.04em;
     color:#444; }
code { font-family: 'Consolas','Courier New',monospace; font-size: 9.5pt;
       background:#f3f3f3; padding:1px 3px; border-radius:3px; }
pre { background:#f6f6f6; border:1px solid #ddd; padding:10px;
      overflow:auto; }
pre code { background:none; font-size: 8.7pt; line-height:1.35;
           white-space: pre; }
table { border-collapse: collapse; width:100%; margin:1em 0;
        font-size: 9.7pt; }
th,td { border:1px solid #bbb; padding:5px 7px; text-align:left;
        vertical-align: top; }
th { background:#eee; }
blockquote { border-left:4px solid #888; margin:1em 0; padding:.3em 1em;
             background:#fafafa; color:#333; }
hr { border:none; border-top:1px solid #ddd; margin:1.5em 0; }
section.doc { page-break-before: always; }
section.cover { page-break-after: always; }
.cover h1 { border:none; font-size: 26pt; }
.cover .sub { color:#555; font-size: 12pt; }
a { color:#234; text-decoration: underline; }
"""


def build_md() -> str:
    parts: list[str] = []
    parts.append(
        "# mellō — 4D Legal / Clinical Review Packet\n\n"
        "**Consolidated review document — BUILD OUTPUT.** The per-topic "
        "files in `docs/legal-clinical-review/` are canonical if they ever "
        "disagree with this concatenation.\n\n"
        "Prepared by engineering, 2026-05-19. Not an internal sign-off — a "
        "structured handoff for external legal/clinical review.\n\n"
        "**The ask:** *Here is exactly what mellō does in a crisis, and "
        "exactly what data does and does not move. What must change before "
        "launch?*\n"
    )
    toc = ["\n## Contents\n"]
    for idx, name in enumerate(ORDER, 1):
        title = name.replace(".md", "").replace("-", " ")
        toc.append(f"{idx}. {title}")
    parts.append("\n".join(toc) + "\n")
    for name in ORDER:
        src = (LCR / name).read_text(encoding="utf-8").strip()
        parts.append("\n\n<!-- ===== %s ===== -->\n\n" % name + src)
    return "\n".join(parts).strip() + "\n"


def build_html(md_full: str) -> str:
    # Split cover/toc (first doc marker) from the rest for page-break CSS.
    chunks = re.split(r"<!-- ===== (.+?) ===== -->", md_full)
    head = chunks[0]
    body_html = ['<section class="cover">', md_to_html(head), "</section>"]
    # chunks: [head, name1, body1, name2, body2, ...]
    for k in range(1, len(chunks), 2):
        doc_md = chunks[k + 1]
        body_html.append('<section class="doc">')
        body_html.append(md_to_html(doc_md))
        body_html.append("</section>")
    return (
        "<!doctype html><html><head><meta charset='utf-8'>"
        "<title>mellō — 4D Review Packet</title><style>%s</style></head>"
        "<body>%s</body></html>" % (CSS, "\n".join(body_html))
    )


def find_chrome() -> str | None:
    candidates = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    for c in candidates:
        if Path(c).exists():
            return c
    return None


def main() -> int:
    missing = [n for n in ORDER if not (LCR / n).exists()]
    if missing:
        print("MISSING canonical docs:", missing, file=sys.stderr)
        return 2

    md_full = build_md()
    OUT_MD.write_text(md_full, encoding="utf-8")
    print("wrote", OUT_MD.relative_to(REPO))

    OUT_HTML.write_text(build_html(md_full), encoding="utf-8")
    print("wrote", OUT_HTML.relative_to(REPO))

    chrome = find_chrome()
    if not chrome:
        print(
            "Chrome/Edge not found — PDF skipped. The .md/.html are "
            "authoritative; print either to PDF from any browser.",
            file=sys.stderr,
        )
        return 0

    if OUT_PDF.exists():
        OUT_PDF.unlink()
    cmd = [
        chrome,
        "--headless=new",
        "--disable-gpu",
        "--no-sandbox",
        "--print-to-pdf=%s" % str(OUT_PDF),
        "--no-pdf-header-footer",
        OUT_HTML.as_uri(),
    ]
    try:
        subprocess.run(cmd, timeout=120, check=False,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception as e:  # noqa: BLE001
        print("Chrome invocation failed:", e, file=sys.stderr)
    if OUT_PDF.exists() and OUT_PDF.stat().st_size > 1000:
        print("wrote %s (%d bytes)" % (
            OUT_PDF.relative_to(REPO), OUT_PDF.stat().st_size))
    else:
        # Older Chrome flag fallback.
        cmd[1] = "--headless"
        subprocess.run(cmd, timeout=120, check=False,
                        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        if OUT_PDF.exists() and OUT_PDF.stat().st_size > 1000:
            print("wrote %s (%d bytes, legacy headless)" % (
                OUT_PDF.relative_to(REPO), OUT_PDF.stat().st_size))
        else:
            print("PDF not produced; .md/.html remain authoritative.",
                  file=sys.stderr)
            return 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
