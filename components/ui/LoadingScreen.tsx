"use client"

import { useState, useEffect } from "react"
import { Sparkles, Brain, Zap, Rocket } from "lucide-react"

interface LoadingScreenProps {
  message?: string
  stage?: string
}

const funkyMessages = [
  "Brewing some AI magic...",
  "Your content is getting a brain upgrade...",
  "Spinning up the knowledge machine...",
  "Transforming your files into genius mode...",
  "Loading your learning superpowers...",
  "Preparing your content for takeoff...",
  "Adding a sprinkle of AI intelligence...",
  "Your documents are getting smarter...",
  "Almost ready to blow your mind...",
  "Crafting your personalized learning experience...",
]

export default function LoadingScreen({ message, stage }: LoadingScreenProps) {
  const [currentMessage, setCurrentMessage] = useState(message || funkyMessages[0])
  const [iconRotation, setIconRotation] = useState(0)

  useEffect(() => {
    if (!message) {
      // Rotate through funky messages every 2 seconds
      const interval = setInterval(() => {
        setCurrentMessage(funkyMessages[Math.floor(Math.random() * funkyMessages.length)])
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [message])

  useEffect(() => {
    // Rotate icon continuously
    const interval = setInterval(() => {
      setIconRotation((prev) => prev + 360)
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const Icon = stage === "uploading" ? Zap : stage === "processing" ? Brain : Sparkles

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-[#F9E5DD] via-white to-[#F9E5DD] z-50 flex flex-col items-center justify-center">
      <div className="text-center space-y-6 px-4">
        {/* Animated Icon */}
        <div className="relative">
          <div 
            className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#EFA07F] to-[#EFA07F]/70 flex items-center justify-center shadow-lg"
            style={{
              transform: `rotate(${iconRotation}deg)`,
              transition: 'transform 3s ease-in-out'
            }}
          >
            <Icon className="h-10 w-10 text-white" />
          </div>
          {/* Pulsing ring */}
          <div className="absolute inset-0 rounded-full bg-[#EFA07F]/20 animate-ping" style={{ animationDuration: '2s' }} />
          <div className="absolute inset-2 rounded-full bg-[#EFA07F]/10 animate-ping" style={{ animationDuration: '2.5s', animationDelay: '0.5s' }} />
        </div>

        {/* Funky Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black/90 animate-pulse">
            {currentMessage}
          </h2>
          {stage && (
            <p className="text-sm text-black/60 font-medium">
              {stage === "uploading" && "📤 Sending your file to the cloud..."}
              {stage === "processing" && "🧠 AI is analyzing your content..."}
              {!["uploading", "processing"].includes(stage) && "⚡ Almost there..."}
            </p>
          )}
        </div>

        {/* Animated dots */}
        <div className="flex items-center justify-center gap-2 pt-4">
          <div 
            className="h-3 w-3 rounded-full bg-[#EFA07F] animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '1s' }}
          />
          <div 
            className="h-3 w-3 rounded-full bg-[#EFA07F] animate-bounce"
            style={{ animationDelay: '200ms', animationDuration: '1s' }}
          />
          <div 
            className="h-3 w-3 rounded-full bg-[#EFA07F] animate-bounce"
            style={{ animationDelay: '400ms', animationDuration: '1s' }}
          />
        </div>

        {/* Progress indicator bar */}
        <div className="w-64 h-1 bg-white/50 rounded-full overflow-hidden mx-auto mt-6">
          <div 
            className="h-full bg-gradient-to-r from-[#EFA07F] via-[#EFA07F]/80 to-[#EFA07F] rounded-full"
            style={{
              width: '70%',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite'
            }}
          />
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  )
}

