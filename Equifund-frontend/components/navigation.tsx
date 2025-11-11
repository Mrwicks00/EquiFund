"use client"

import { useState } from "react"
import { Menu, X } from "lucide-react"

import ConnectButton from "@/components/connect-button"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 glass-morphism border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="shrink-0">
            <div className="text-2xl font-bold gradient-text">EquiFund</div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a href="#" className="text-sm font-medium hover:text-primary transition-colors">
              Home
            </a>
            <a href="#projects" className="text-sm font-medium hover:text-primary transition-colors">
              Projects
            </a>
            <a href="#how" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </a>
            <a href="#stats" className="text-sm font-medium hover:text-primary transition-colors">
              Stats
            </a>
          </div>

          {/* Wallet Button */}
          <div className="hidden md:flex items-center space-x-4">
            <ConnectButton />
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-md hover:bg-secondary/20 transition-colors"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden pb-4 space-y-2 animate-slide-up">
            <a href="#" className="block px-3 py-2 text-sm font-medium hover:bg-secondary/20 rounded-md">
              Home
            </a>
            <a href="#projects" className="block px-3 py-2 text-sm font-medium hover:bg-secondary/20 rounded-md">
              Projects
            </a>
            <a href="#how" className="block px-3 py-2 text-sm font-medium hover:bg-secondary/20 rounded-md">
              How It Works
            </a>
            <a href="#stats" className="block px-3 py-2 text-sm font-medium hover:bg-secondary/20 rounded-md">
              Stats
            </a>
            <ConnectButton className="w-full" />
          </div>
        )}
      </div>
    </nav>
  )
}
