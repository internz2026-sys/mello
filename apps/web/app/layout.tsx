import type { Metadata } from "next"
import { Inter, Fraunces } from "next/font/google"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-ui",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-voice",
  style: ["normal", "italic"],
})

export const metadata: Metadata = {
  title: "mellō",
  description: "future self — a place to think slowly",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body
        className={`${inter.variable} ${fraunces.variable} font-ui bg-vellum text-deepInk antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
