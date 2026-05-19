"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Sanctuary } from "@/components/voice/Sanctuary"
import { Voice } from "@/components/voice/Voice"
import { Whisper } from "@/components/voice/Whisper"

const fade = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { duration: 0.6, ease: "easeInOut" },
}

export default function Room1() {
  const [step, setStep] = useState(1)
  const [name, setName] = useState("")
  const [userMessage, setUserMessage] = useState("")

  return (
    <Sanctuary>
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step-1"
            className="flex flex-col gap-8 w-full"
            {...fade}
          >
            <Voice>Welcome.</Voice>

            <div>
              <Whisper>
                Before anything else — what name do you go by?
              </Whisper>
            </div>

            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) setStep(2)
              }}
              className="bg-transparent border-b border-oat focus:border-dawn outline-none py-3 text-deepInk font-ui text-base w-full placeholder:text-deepInk/30 transition-colors duration-300"
              placeholder="your name"
              autoFocus
            />

            {name.trim() && (
              <motion.button
                onClick={() => setStep(2)}
                className="self-start text-sm font-ui text-deepInk/40 hover:text-dawn transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                continue
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            className="flex flex-col gap-8 w-full"
            {...fade}
          >
            <Voice>{name}.</Voice>

            <Voice>
              This is a place to be known slowly. Nothing said here is shared
              with anyone — you can always change, hide, or delete what you say.
            </Voice>

            <div>
              <Whisper>So — what brought you here today?</Whisper>
            </div>

            <textarea
              value={userMessage}
              onChange={(e) => setUserMessage(e.target.value)}
              rows={5}
              className="bg-transparent border-b border-oat focus:border-dawn outline-none py-3 text-deepInk font-ui text-base w-full placeholder:text-deepInk/30 transition-colors duration-300 resize-none"
              placeholder="write freely"
              autoFocus
            />

            {userMessage.trim() && (
              <motion.button
                onClick={() => setStep(3)}
                className="self-start text-sm font-ui text-deepInk/40 hover:text-dawn transition-colors duration-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                continue
              </motion.button>
            )}
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            className="flex flex-col gap-8 w-full"
            {...fade}
          >
            <Voice>What you named is held here.</Voice>

            <Voice>Nothing needs to be solved tonight.</Voice>

            <motion.button
              onClick={() => setStep(4)}
              className="self-start text-sm font-ui text-deepInk/40 hover:text-dawn transition-colors duration-300 mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              continue
            </motion.button>
          </motion.div>
        )}

        {step === 4 && (
          <motion.div
            key="step-4"
            className="flex flex-col gap-8 w-full"
            {...fade}
          >
            <Voice>That&apos;s enough for today.</Voice>

            <Whisper>mellō will be here when you return.</Whisper>
          </motion.div>
        )}
      </AnimatePresence>
    </Sanctuary>
  )
}
