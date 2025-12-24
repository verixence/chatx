"use client"

import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Check, Play, Upload, FileText, MessageSquare, Brain, ArrowRight } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen relative bg-white">
      {/* Background Image */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/background.jpeg"
          alt="Background"
          fill
          className="object-cover"
          priority
          quality={90}
          sizes="100vw"
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Floating Action Buttons */}
        <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
          <Link href="/login">
            <Button className="bg-white/90 backdrop-blur-md hover:bg-white text-black text-base font-medium px-6 py-3 rounded-full border border-black/10 shadow-lg">
              Sign in
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black text-base font-medium px-6 py-3 rounded-full border-0 shadow-lg">
              Get started
            </Button>
          </Link>
        </div>

        {/* Hero Section - Large with Spacing */}
        <section className="min-h-screen flex items-center px-4 sm:px-6 lg:px-8 py-24">
          <div className="container mx-auto max-w-7xl">
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              {/* Left Side - Hero Content */}
              <div>
                <div className="flex items-center mb-12">
                  <span className="text-3xl font-bold text-black mr-4">ChatX</span>
                  <span className="text-xs font-medium text-black/70 px-3 py-1.5 rounded-full border border-black/20 bg-white/80">
                    EXPERIMENT
                  </span>
                </div>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-black mb-10 leading-tight tracking-tight">
                  Re-imagining learning for every student
                </h1>
                <p className="text-xl text-black/80 mb-12 leading-relaxed max-w-xl">
                  ChatX transforms content into a dynamic and engaging learning experience tailored for you.
                </p>
                
                {/* See how it works */}
                <div className="flex items-center mb-12 cursor-pointer group">
                  <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center mr-3 group-hover:bg-black/90 transition-colors flex-shrink-0">
                    <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                  </div>
                  <span className="text-lg font-medium text-black">See how it works</span>
                </div>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/signup">
                    <Button className="bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black text-base font-medium px-8 py-4 rounded-full border-0 shadow-lg flex items-center justify-center">
                      <Upload className="h-5 w-5 mr-2" />
                      Waitlist: Upload your PDF
                    </Button>
                  </Link>
                  <Link href="/signup">
                    <Button className="bg-[#F9E5DD] hover:bg-[#F9E5DD]/80 border-2 border-[#EFA07F] text-black text-base font-medium px-8 py-4 rounded-full flex items-center justify-center shadow-lg">
                      <FileText className="h-5 w-5 mr-2" />
                      Try it now
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Right Side - Large Card */}
              <div className="hidden lg:flex justify-center items-center">
                <div className="bg-gradient-to-br from-[#F9E5DD] to-white rounded-3xl p-20 border border-[#EFA07F]/20 shadow-lg w-full max-w-md">
                  <h2 className="text-5xl font-bold text-black text-center">ChatX</h2>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid - Large Prominent Cards */}
        <section className="px-4 sm:px-6 lg:px-8 py-24">
          <div className="container mx-auto max-w-7xl">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Feature Card 1 - PDF Upload */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 border border-black/10 hover:shadow-2xl transition-all cursor-pointer group h-full flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                  <FileText className="h-10 w-10 text-red-600" />
                </div>
                <h3 className="text-3xl font-bold text-black mb-6 group-hover:text-[#EFA07F] transition-colors">PDF Documents</h3>
                <p className="text-lg text-black/70 leading-relaxed mb-4 flex-grow">
                  Upload any PDF document and instantly transform it into an interactive learning experience. Get AI-powered summaries, key concept extraction, and comprehensive study materials tailored to your learning style.
                </p>
                <div className="mt-6 pt-6 border-t border-black/10">
                  <ul className="space-y-2 text-sm text-black/60">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Instant summaries</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Key concepts extraction</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Smart highlighting</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature Card 2 - YouTube Videos */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 border border-black/10 hover:shadow-2xl transition-all cursor-pointer group h-full flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-blue-200 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                  <span className="text-5xl">🎥</span>
                </div>
                <h3 className="text-3xl font-bold text-black mb-6 group-hover:text-[#EFA07F] transition-colors">YouTube Videos</h3>
                <p className="text-lg text-black/70 leading-relaxed mb-4 flex-grow">
                  Paste any YouTube URL and watch as ChatX automatically extracts transcripts, generates comprehensive summaries, and creates interactive study materials. Perfect for educational videos, lectures, and tutorials.
                </p>
                <div className="mt-6 pt-6 border-t border-black/10">
                  <ul className="space-y-2 text-sm text-black/60">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Auto transcript extraction</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Video summaries</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Timestamp references</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature Card 3 - AI Chat */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 border border-black/10 hover:shadow-2xl transition-all cursor-pointer group h-full flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-purple-200 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                  <MessageSquare className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-3xl font-bold text-black mb-6 group-hover:text-[#EFA07F] transition-colors">AI Tutor Chat</h3>
                <p className="text-lg text-black/70 leading-relaxed mb-4 flex-grow">
                  Engage in natural conversations with your AI tutor. Ask questions, get detailed explanations with examples, and receive personalized guidance. Your AI tutor understands context and adapts to your learning pace.
                </p>
                <div className="mt-6 pt-6 border-t border-black/10">
                  <ul className="space-y-2 text-sm text-black/60">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Context-aware responses</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Personalized explanations</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Real-time assistance</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Feature Card 4 - Quizzes & Flashcards */}
              <div className="bg-white/95 backdrop-blur-sm rounded-3xl p-10 border border-black/10 hover:shadow-2xl transition-all cursor-pointer group h-full flex flex-col">
                <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-green-200 rounded-3xl flex items-center justify-center mb-8 shadow-lg">
                  <Brain className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-3xl font-bold text-black mb-6 group-hover:text-[#EFA07F] transition-colors">Smart Study Tools</h3>
                <p className="text-lg text-black/70 leading-relaxed mb-4 flex-grow">
                  Automatically generate comprehensive quizzes and interactive flashcards from your content. Practice with spaced repetition algorithms designed to maximize retention and help you master any subject efficiently.
                </p>
                <div className="mt-6 pt-6 border-t border-black/10">
                  <ul className="space-y-2 text-sm text-black/60">
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Auto-generated quizzes</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Spaced repetition</span>
                    </li>
                    <li className="flex items-center">
                      <Check className="h-4 w-4 text-[#EFA07F] mr-2 flex-shrink-0" />
                      <span>Progress tracking</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing & CTA Section - Combined */}
        <section className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
          <div className="container mx-auto max-w-7xl">
            {/* Pricing Section */}
            <div className="mb-16">
              <div className="text-center mb-10">
                <h2 className="text-4xl font-bold text-black mb-4">
                  Choose your plan
                </h2>
                <p className="text-lg text-black/70">
                  Start free, upgrade when you're ready
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-16">
                {/* Freemium */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-black/10 p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-black mb-2">Freemium</h3>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black">Free</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">5 content items (PDF, Text, YouTube)</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">AI chat & summaries</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">Limited quizzes & flashcards</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">Basic AI features</span>
                    </li>
                  </ul>
                  <Link href="/signup" className="block">
                    <Button variant="outline" className="w-full border-2 border-[#EFA07F] bg-[#F9E5DD] hover:bg-[#F9E5DD]/80 text-black font-medium text-base px-6 py-3 rounded-full">
                      Get started
                    </Button>
                  </Link>
                </div>

                {/* Pro */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl border-2 border-[#EFA07F] p-8 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-[#EFA07F] text-black px-3 py-1 rounded-full text-xs font-medium">
                      Most popular
                    </span>
                  </div>
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-black mb-2">Pro</h3>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black">$9.99</span>
                      <span className="text-black/70 ml-2">/month</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black font-medium">Unlimited content</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black font-medium">Unlimited AI chat</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black font-medium">Unlimited quizzes & flashcards</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black font-medium">Advanced AI features</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black font-medium">Priority support</span>
                    </li>
                  </ul>
                  <Link href="/signup?plan=pro" className="block">
                    <Button className="w-full bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black font-medium text-base px-6 py-3 rounded-full border-0 shadow-lg">
                      Start Pro trial
                    </Button>
                  </Link>
                </div>

                {/* Enterprise */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-black/10 p-8">
                  <div className="mb-6">
                    <h3 className="text-2xl font-bold text-black mb-2">Enterprise</h3>
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black">$49</span>
                      <span className="text-black/70 ml-2">/user/year</span>
                    </div>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">Everything in Pro</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">Team management</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">Advanced analytics</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">Dedicated support</span>
                    </li>
                    <li className="flex items-start">
                      <Check className="h-5 w-5 text-black mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black/70">Custom integrations</span>
                    </li>
                  </ul>
                  <Link href="/signup?plan=enterprise" className="block">
                    <Button variant="outline" className="w-full border-2 border-[#EFA07F] bg-[#F9E5DD] hover:bg-[#F9E5DD]/80 text-black font-medium text-base px-6 py-3 rounded-full">
                      Contact sales
                    </Button>
                  </Link>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div className="bg-[#F9E5DD] rounded-[3rem] p-8 md:p-12 border border-[#EFA07F]/30 shadow-sm">
              <div className="text-center">
                <h2 className="text-4xl font-bold text-black mb-6">
                  Ready to transform your learning?
                </h2>
                <p className="text-lg text-black/70 mb-10 leading-relaxed max-w-2xl mx-auto">
                  Join thousands of students already learning smarter with ChatX
                </p>
                <Link href="/signup">
                  <Button className="bg-[#EFA07F] hover:bg-[#EFA07F]/90 text-black text-base font-medium px-8 py-3 rounded-full border-0 shadow-sm">
                    Get started free
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-black/10 py-12 bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="flex items-center space-x-2 mb-4 md:mb-0">
                <Image
                  src="/logo.png"
                  alt="ChatX Logo"
                  width={24}
                  height={24}
                  className="h-6 w-6"
                />
                <span className="text-lg font-medium text-black">
                  ChatX
                </span>
                <span className="text-sm text-black/70">by Verixence</span>
              </div>
              <p className="text-black/70 text-sm">
                © 2024 ChatX. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
