import Link from "next/link"
import { Sanctuary } from "@/components/voice/Sanctuary"
import { Voice } from "@/components/voice/Voice"
import { Whisper } from "@/components/voice/Whisper"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <Sanctuary>
      <div className="flex flex-col items-center gap-6 text-center">
        <Voice className="text-4xl font-light tracking-widest">mellō</Voice>

        <div>
          <Whisper>future self — a place to think slowly</Whisper>
        </div>

        <div className="mt-8">
          <Whisper>
            Take as long as you&apos;d like. Pause anytime.
          </Whisper>
        </div>

        <div className="mt-10">
          <Button asChild variant="ghost">
            <Link href="/onboarding/room-1">Begin</Link>
          </Button>
        </div>
      </div>
    </Sanctuary>
  )
}
