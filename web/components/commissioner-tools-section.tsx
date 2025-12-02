'use client'

import { useState } from 'react'

interface CommissionerToolsSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

export function CommissionerToolsSection({
  title,
  children,
  defaultOpen = false,
}: CommissionerToolsSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-3">
          <span className="px-2 py-1 bg-amber-500 text-white text-xs font-bold rounded uppercase">
            Commissioner Only
          </span>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        </div>
        <svg
          className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform ${
            isOpen ? 'transform rotate-180' : ''
          }`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="px-6 py-4 border-t border-amber-200 dark:border-amber-800">
          {children}
        </div>
      )}
    </div>
  )
}

