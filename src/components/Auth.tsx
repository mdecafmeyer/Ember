import { useState } from 'react'
import { supabase } from '../lib/supabase'

interface AuthProps {
  onAuth: () => void
}

export default function Auth({ onAuth }: AuthProps) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        
        // For development, we'll assume email confirmation is disabled
        // In production, you'd show a "check your email" message
        onAuth()
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        onAuth()
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #F5F0EB 0%, #F2DEDE 50%, #E8C4C4 100%)' }}>
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-heading italic text-journal-dark mb-3" style={{ fontWeight: 400 }}>Ember</h1>
          <p className="text-journal-medium font-body text-lg">A gentle space for your memories</p>
        </div>

        {/* Auth Form */}
        <div className="card">
          <form onSubmit={handleAuth} className="space-y-6">
            <div>
              <h2 className="text-2xl font-heading text-journal-dark mb-3">
                {isSignUp ? 'Create Your Space' : 'Welcome Back'}
              </h2>
              <p className="text-journal-medium font-body leading-relaxed">
                {isSignUp 
                  ? 'Begin your journey of remembrance' 
                  : 'Continue your journey of healing'
                }
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-body font-medium text-journal-dark mb-3">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-body font-medium text-journal-dark mb-3">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading 
                ? (isSignUp ? 'Creating...' : 'Signing in...') 
                : (isSignUp ? 'Create Account' : 'Sign In')
              }
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp)
                  setError(null)
                }}
                className="text-rose-dusty hover:text-journal-dark text-sm font-body font-medium transition-colors duration-300"
              >
                {isSignUp 
                  ? 'Already have an account? Sign in' 
                  : "Don't have an account? Sign up"
                }
              </button>
            </div>
          </form>
        </div>

        {/* Gentle messaging */}
        <div className="mt-12 text-center text-journal-light font-body text-sm">
          <p>Your memories are safe with us</p>
        </div>
      </div>
    </div>
  )
}