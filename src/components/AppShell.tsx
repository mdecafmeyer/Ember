import type { ReactNode } from 'react'
import { supabase } from '../lib/supabase'

interface AppShellProps {
  children: ReactNode
  onSignOut: () => void
}

export default function AppShell({ children, onSignOut }: AppShellProps) {
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    onSignOut()
  }

  return (
    <div className="min-h-screen bg-linen-warm">
      {/* Header */}
      <header className="bg-linen-cream border-b border-journal-light shadow-journal">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center">
              <h1 className="text-3xl font-heading italic text-journal-dark" style={{ fontWeight: 400 }}>Ember</h1>
            </div>
            
            <button
              onClick={handleSignOut}
              className="btn-understated text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 py-12">
        {children}
      </main>
    </div>
  )
}