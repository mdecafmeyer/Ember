import { useState, useEffect } from 'react'
import { usePowerSync } from '@powersync/react'
import { Feather, PenTool, Sparkles } from 'lucide-react'
import Timeline from './Timeline'
import CaptureForm from './CaptureForm'
import ReflectionCard from './ReflectionCard'
import ReflectionEditModal from './ReflectionEditModal'

interface Moment {
  id: string
  text: string
  moment_type: string
  location_tag: string | null
  created_at: string
  updated_at: string
}

interface DashboardProps {
  powerSyncStatus: 'connecting' | 'connected' | 'failed'
  onRetrySync: () => void
}

export default function Dashboard({ powerSyncStatus, onRetrySync }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'moments' | 'reflections'>('moments')
  const [isCaptureFormOpen, setIsCaptureFormOpen] = useState(false)
  const [isGeneratingReflection, setIsGeneratingReflection] = useState(false)
  const [timelineRefreshTrigger, setTimelineRefreshTrigger] = useState(0)
  const [reflectionRefreshTrigger, setReflectionRefreshTrigger] = useState(0)
  const [moments, setMoments] = useState<Moment[]>([])
  const [momentsLoading, setMomentsLoading] = useState(true)
  const [editingMoment, setEditingMoment] = useState<Moment | null>(null)
  const [editingReflection, setEditingReflection] = useState<any | null>(null)
  const [isReflectionEditOpen, setIsReflectionEditOpen] = useState(false)
  
  const powerSync = usePowerSync()

  const loadMoments = async () => {
    try {
      setMomentsLoading(true)
      
      // Check if PowerSync is available
      if (!powerSync) {
        console.log('PowerSync not available yet, showing empty state')
        setMoments([])
        return
      }

      const result = await powerSync.getAll(
        'SELECT * FROM moments ORDER BY created_at DESC'
      )
      setMoments(result as Moment[])
    } catch (error) {
      console.error('Failed to load moments:', error)
      // Don't fail completely - just show empty state
      setMoments([])
    } finally {
      setMomentsLoading(false)
    }
  }

  useEffect(() => {
    // Load moments immediately, don't wait
    loadMoments()
  }, [timelineRefreshTrigger, powerSync]) // Also reload when PowerSync becomes available

  const handleMomentSaved = () => {
    setTimelineRefreshTrigger(prev => prev + 1)
  }

  const handleReflectionUpdated = () => {
    setReflectionRefreshTrigger(prev => prev + 1)
  }

  const handleEditMoment = (moment: Moment) => {
    setEditingMoment(moment)
    setIsCaptureFormOpen(true)
  }

  const handleEditReflection = (reflection: any) => {
    setEditingReflection(reflection)
    setIsReflectionEditOpen(true)
  }

  const handleCaptureFormClose = () => {
    setIsCaptureFormOpen(false)
    setEditingMoment(null)
  }

  const handleReflectionEditClose = () => {
    setIsReflectionEditOpen(false)
    setEditingReflection(null)
  }

  const getSyncStatusIndicator = () => {
    switch (powerSyncStatus) {
      case 'connecting':
        return (
          <div className="bg-rose-pale border border-rose-soft rounded-2xl p-4 mb-8">
            <div className="flex items-center justify-center space-x-3 text-journal-dark">
              <div className="animate-spin h-4 w-4 border-2 border-rose-soft border-t-rose-dusty rounded-full"></div>
              <span className="text-sm font-body">Syncing in background...</span>
            </div>
          </div>
        )
      case 'failed':
        return (
          <div className="bg-linen-cream border border-journal-light rounded-2xl p-4 mb-8">
            <div className="flex items-center justify-between text-journal-medium">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-body">Offline - changes saved locally</span>
              </div>
              <button
                onClick={onRetrySync}
                className="text-xs font-body text-rose-dusty hover:text-journal-dark transition-colors duration-300"
              >
                Retry
              </button>
            </div>
          </div>
        )
      case 'connected':
        return null // Don't show anything when connected
      default:
        return null
    }
  }

  return (
    <div className="space-y-8">
      {/* Sync Status */}
      {getSyncStatusIndicator()}
      
      {/* Welcome Section */}
      <div className="text-center space-y-6 mb-12">
        <div className="flex justify-center mb-8">
          <Feather size={48} className="text-rose-dusty" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-heading text-journal-dark mb-4">Your Journey of Remembrance</h1>
        <p className="text-journal-medium font-body text-lg max-w-2xl mx-auto leading-relaxed">
          This is your safe space to capture, preserve, and cherish the moments that matter most to you.
          Each memory, feeling, and connection you save here becomes part of your healing journey.
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-linen-cream rounded-2xl p-2 shadow-journal">
          <button
            onClick={() => setActiveTab('moments')}
            className={`px-6 py-3 rounded-xl font-body font-medium transition-all duration-300 relative ${
              activeTab === 'moments' 
                ? 'text-journal-dark bg-white shadow-journal' 
                : 'text-journal-light hover:text-journal-medium'
            }`}
          >
            Moments
            {activeTab === 'moments' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-rose-dusty rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('reflections')}
            className={`px-6 py-3 rounded-xl font-body font-medium transition-all duration-300 relative ${
              activeTab === 'reflections' 
                ? 'text-journal-dark bg-white shadow-journal' 
                : 'text-journal-light hover:text-journal-medium'
            }`}
          >
            Reflections
            {activeTab === 'reflections' && (
              <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-rose-dusty rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'moments' ? (
        <div className="space-y-8">
          {/* New Moment Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setIsCaptureFormOpen(true)}
              className="btn-understated text-base flex items-center space-x-3 px-8 py-3"
            >
              <PenTool size={18} strokeWidth={1.5} />
              <span>New Moment</span>
            </button>
          </div>

          {/* Timeline */}
          <Timeline 
            moments={moments} 
            loading={momentsLoading}
            onEditMoment={handleEditMoment}
            onRefresh={handleMomentSaved}
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* New Reflection Button */}
          <div className="flex justify-center mb-8">
            <button
              onClick={() => setIsGeneratingReflection(true)}
              disabled={moments.length === 0}
              className="btn-understated text-base flex items-center space-x-3 px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
              title={moments.length === 0 ? "Capture some moments first to generate reflections" : "Generate a new AI reflection"}
            >
              <Sparkles size={18} strokeWidth={1.5} />
              <span>New Reflection</span>
            </button>
          </div>

          {/* Reflections */}
          <ReflectionCard 
            moments={moments} 
            triggerGeneration={isGeneratingReflection}
            onGenerationComplete={() => setIsGeneratingReflection(false)}
            onEditReflection={handleEditReflection}
            onRefresh={handleReflectionUpdated}
            refreshTrigger={reflectionRefreshTrigger}
          />
        </div>
      )}

      {/* Capture Form Modal */}
      <CaptureForm
        isOpen={isCaptureFormOpen}
        onClose={handleCaptureFormClose}
        onMomentSaved={handleMomentSaved}
        editingMoment={editingMoment}
      />

      {/* Reflection Edit Modal */}
      <ReflectionEditModal
        isOpen={isReflectionEditOpen}
        onClose={handleReflectionEditClose}
        onReflectionUpdated={handleReflectionUpdated}
        editingReflection={editingReflection}
      />
    </div>
  )
}