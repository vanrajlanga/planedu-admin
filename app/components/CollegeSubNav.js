'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function CollegeSubNav({ collegeId, collegeName }) {
  const pathname = usePathname()

  const tabs = [
    { name: 'Overview', href: `/colleges/${collegeId}`, icon: 'info' },
    { name: 'Content', href: `/colleges/${collegeId}/content`, icon: 'document' },
    { name: 'Courses', href: `/colleges/${collegeId}/courses`, icon: 'academic' },
    { name: 'Placements', href: `/colleges/${collegeId}/placements`, icon: 'briefcase' },
    { name: 'Cutoffs', href: `/colleges/${collegeId}/cutoffs`, icon: 'chart' },
    { name: 'Rankings', href: `/colleges/${collegeId}/rankings`, icon: 'trophy' },
    { name: 'Hostels', href: `/colleges/${collegeId}/hostels`, icon: 'home' },
    { name: 'Faculty', href: `/colleges/${collegeId}/faculty`, icon: 'users' },
    { name: 'Gallery', href: `/colleges/${collegeId}/gallery`, icon: 'image' },
    { name: 'Updates', href: `/colleges/${collegeId}/updates`, icon: 'bell' },
  ]

  const isActive = (href) => {
    if (href === `/colleges/${collegeId}`) {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="bg-white border-b">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/colleges"
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </Link>
            <div className="h-6 border-l border-gray-300"></div>
            <h1 className="text-xl font-semibold text-gray-800">{collegeName || 'College Details'}</h1>
          </div>
          <a
            href={`/colleges/${collegeId}/preview`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-lg hover:bg-orange-600"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            Preview
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 overflow-x-auto">
        <nav className="flex gap-1 -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                py-3 px-4 border-b-2 text-sm font-medium transition-colors whitespace-nowrap
                ${isActive(tab.href)
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  )
}
