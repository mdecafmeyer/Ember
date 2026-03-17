import { useState, useEffect } from 'react'
import { PowerSyncContext } from '@powersync/react'
import { supabase } from './lib/supabase'
import { db } from './lib/powersync'
import { powerSyncConnector } from './lib/connector'
import Auth from './components/Auth'
import AppShell from './components/AppShell'
import Dashboard from './components/Dashboard'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [powerSyncStatus, setPowerSyncStatus] = useState<'connecting' | 'connected' | 'failed'>('connecting')

  useEffect(() => {
    // Check initial auth state
    const checkAuthState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setIsAuthenticated(!!session)
        
        // Initialize PowerSync in background if authenticated
        if (session) {
          initializePowerSync() // Don't await - let it run in background
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuthState()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authenticated = !!session
      setIsAuthenticated(authenticated)
      
      if (authenticated) {
        initializePowerSync() // Don't await - let it run in background
      } else {
        // Clean up PowerSync when signed out
        setPowerSyncStatus('connecting')
        db.disconnectAndClear() // Don't await - let it run in background
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const initializePowerSync = async () => {
    try {
      setPowerSyncStatus('connecting')
      
      // Connect PowerSync with the connector
      await db.connect(powerSyncConnector)
      setPowerSyncStatus('connected')
      
      console.log('PowerSync initialized successfully')
    } catch (error) {
      console.error('PowerSync initialization failed:', error)
      setPowerSyncStatus('failed')
    }
  }

  const handleAuth = () => {
    // Auth state will be handled by the auth state listener
  }

  const handleSignOut = () => {
    setIsAuthenticated(false)
    setPowerSyncStatus('connecting')
  }

  // Show loading state while checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-linen-warm flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-rose-soft border-t-rose-dusty rounded-full mx-auto mb-6"></div>
          <p className="text-journal-medium font-body text-lg">Preparing your space...</p>
        </div>
      </div>
    )
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated) {
    return <Auth onAuth={handleAuth} />
  }

  // Main authenticated app with PowerSync (show immediately, sync in background)
  return (
    <PowerSyncContext.Provider value={db}>
      <AppShell onSignOut={handleSignOut}>
        <Dashboard powerSyncStatus={powerSyncStatus} onRetrySync={initializePowerSync} />
      </AppShell>
    </PowerSyncContext.Provider>
  )
}

export default App
