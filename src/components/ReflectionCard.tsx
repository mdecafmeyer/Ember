import { useState, useEffect } from 'react'
import { usePowerSync } from '@powersync/react'
import { Feather, Trash2, Edit3 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { generateReflection } from '../lib/ai'

interface Moment {
  id: string
  text: string
  moment_type: string
  location_tag: string | null
  created_at: string
}

interface SavedReflection {
  id: string
  content: string
  moment_ids: string
  created_at: string
}

interface ReflectionCardProps {
  moments: Moment[]
  triggerGeneration?: boolean
  onGenerationComplete?: () => void
  onEditReflection?: (reflection: SavedReflection) => void
  onRefresh?: () => void
  refreshTrigger?: number
}

export default function ReflectionCard({ moments, triggerGeneration, onGenerationComplete, onEditReflection, onRefresh, refreshTrigger }: ReflectionCardProps) {
  const [reflection, setReflection] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [pastReflections, setPastReflections] = useState<SavedReflection[]>([])
  const [loadingReflections, setLoadingReflections] = useState(true)
  const [deletingReflection, setDeletingReflection] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [expandedReflection, setExpandedReflection] = useState<string | null>(null)
  
  const powerSync = usePowerSync()

  const loadReflections = async () => {
    try {
      setLoadingReflections(true)
      
      if (!powerSync) {
        console.log('PowerSync not available yet for reflections')
        setPastReflections([])
        return
      }

      const result = await powerSync.getAll(
        'SELECT * FROM reflections ORDER BY created_at DESC LIMIT 5'
      )
      setPastReflections(result as SavedReflection[])
      console.log(`Loaded ${result.length} past reflections`)
    } catch (error) {
      console.error('Failed to load reflections:', error)
      setPastReflections([])
    } finally {
      setLoadingReflections(false)
    }
  }

  useEffect(() => {
    loadReflections()
  }, [powerSync])

  // Reload reflections when refresh trigger changes
  useEffect(() => {
    if (refreshTrigger !== undefined) {
      console.log('Refresh trigger changed, reloading reflections:', refreshTrigger)
      loadReflections()
    }
  }, [refreshTrigger])

  // Handle external trigger for generating new reflection
  useEffect(() => {
    if (triggerGeneration && !generating && moments.length > 0) {
      handleGenerateReflection()
    }
  }, [triggerGeneration])

  const handleGenerateReflection = async () => {
    if (moments.length === 0) {
      setError('No moments to reflect on. Capture some moments first!')
      return
    }

    setGenerating(true)
    setError(null)
    setSaved(false)
    
    try {
      // Get recent moments (last 10 or all if fewer)
      const recentMoments = moments.slice(0, 10)
      console.log(`Generating reflection based on ${recentMoments.length} recent moments`)
      const reflectionText = await generateReflection(recentMoments)
      setReflection(reflectionText)
    } catch (err) {
      console.error('Failed to generate reflection:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate reflection. Please try again.')
    } finally {
      setGenerating(false)
      onGenerationComplete?.()
    }
  }

  const handleSaveReflection = async () => {
    if (!reflection) return

    setSaving(true)
    setError(null)
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        throw new Error('User not authenticated')
      }

      const id = crypto.randomUUID()
      const userId = session.user.id
      const content = reflection
      // Use actual moment IDs from the recent moments used for reflection
      const recentMoments = moments.slice(0, 10)
      const momentIds = JSON.stringify(recentMoments.map(moment => moment.id))
      const createdAt = new Date().toISOString()
      const updatedAt = createdAt

      await powerSync.execute(
        "INSERT INTO reflections (id, user_id, content, moment_ids, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
        [id, userId, content, momentIds, createdAt, updatedAt]
      )

      console.log('Reflection saved successfully with moment IDs:', momentIds)

      // Reload reflections to show the new one
      await loadReflections()

      // Show success state briefly, then clear the reflection
      setSaved(true)
      setTimeout(() => {
        setReflection(null)
        setSaved(false)
      }, 2000)
      
    } catch (err) {
      console.error('Failed to save reflection:', err)
      setError(err instanceof Error ? err.message : 'Failed to save reflection. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteReflection = async (reflectionId: string) => {
    if (!powerSync) {
      console.error('PowerSync not available')
      return
    }

    setDeletingReflection(reflectionId)
    
    try {
      await powerSync.execute(
        "DELETE FROM reflections WHERE id = ?",
        [reflectionId]
      )
      
      console.log('Reflection deleted successfully:', reflectionId)
      // Reload reflections to update the list
      await loadReflections()
      onRefresh?.()
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete reflection:', error)
    } finally {
      setDeletingReflection(null)
    }
  }

  const formatReflectionDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) {
      return `Today at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    } else if (diffDays === 1) {
      return `Yesterday at ${date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`
    } else if (diffDays < 7) {
      return `${diffDays} days ago`
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  return (
    <div className="space-y-8">
      {/* Generation Status */}
      {generating && (
        <div className="text-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-rose-soft border-t-rose-dusty rounded-full mx-auto mb-4"></div>
          <p className="text-journal-medium font-body">Creating your reflection...</p>
          <p className="text-journal-light font-body text-sm mt-2">
            Analyzing your {Math.min(moments.length, 10)} most recent moments
          </p>
        </div>
      )}

      {error && (
        <div className="bg-linen-cream border border-journal-light rounded-2xl p-4 mb-6">
          <p className="text-journal-medium text-sm font-body">{error}</p>
        </div>
      )}

      {saved && (
        <div className="bg-rose-pale border border-rose-soft rounded-2xl p-4 mb-6">
          <p className="text-journal-dark text-sm font-body flex items-center space-x-2">
            <Feather size={16} strokeWidth={1.5} />
            <span>Reflection saved successfully</span>
          </p>
        </div>
      )}

      {reflection && (
        <div className="reflection-card mb-8">
          <div className="flex items-start space-x-4">
            <Feather size={24} className="text-rose-dusty mt-1" strokeWidth={1.5} />
            <div className="flex-1">
              <h4 className="font-heading text-lg text-journal-dark mb-3">Gentle Reflection</h4>
              <p className="text-journal-dark font-body leading-relaxed text-lg">{reflection}</p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-rose-soft">
            <button
              onClick={() => setReflection(null)}
              className="btn-secondary text-sm"
            >
              Dismiss
            </button>
            <button
              onClick={handleSaveReflection}
              disabled={saving}
              className="btn-primary text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Reflection'
              )}
            </button>
          </div>
        </div>
      )}

      {/* Past Reflections Grid */}
      {loadingReflections ? (
        <div className="text-center py-16">
          <div className="animate-spin h-8 w-8 border-2 border-rose-soft border-t-rose-dusty rounded-full mx-auto"></div>
          <p className="text-journal-medium font-body mt-6">Loading your reflections...</p>
        </div>
      ) : pastReflections.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-heading text-journal-dark">Your Reflections</h4>
            <span className="text-xs text-journal-light font-body">{pastReflections.length} reflection{pastReflections.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastReflections.map((pastReflection) => (
                <div key={pastReflection.id} className="bg-linen-cream rounded-2xl shadow-journal hover:shadow-journal-hover transition-all duration-300 group relative h-80 flex flex-col border-l-4 border-rose-soft">
                  {/* Edit and Delete Controls - appear on hover */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2 z-10">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        onEditReflection?.(pastReflection)
                      }}
                      className="p-2 rounded-full bg-white hover:bg-rose-pale text-journal-light hover:text-journal-dark transition-all duration-300 shadow-journal"
                      title="Edit reflection"
                    >
                      <Edit3 size={14} strokeWidth={1.5} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setShowDeleteConfirm(pastReflection.id)
                      }}
                      className="p-2 rounded-full bg-white hover:bg-red-50 text-journal-light hover:text-red-600 transition-all duration-300 shadow-journal"
                      title="Delete reflection"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 pr-12">
                      <div className="flex items-center space-x-2">
                        <Feather size={14} className="text-rose-dusty" strokeWidth={1.5} />
                        <span className="text-xs text-journal-light font-body font-medium">AI Reflection</span>
                      </div>
                      <span className="text-journal-light text-xs font-body">{formatReflectionDate(pastReflection.created_at)}</span>
                    </div>
                    
                    {/* Content Preview */}
                    <div className="flex-1 overflow-hidden">
                      <p className="text-journal-dark font-body leading-relaxed text-sm overflow-hidden" style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 8,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {pastReflection.content}
                      </p>
                    </div>
                    
                    {/* Footer */}
                    <div className="mt-4 pt-3 border-t border-rose-pale">
                      <div className="flex items-center justify-between">
                        {pastReflection.moment_ids && (
                          <div className="text-xs text-journal-light font-body">
                            Based on {(() => {
                              try {
                                const ids = JSON.parse(pastReflection.moment_ids)
                                return Array.isArray(ids) ? ids.length : 1
                              } catch {
                                return 1
                              }
                            })()} moments
                          </div>
                        )}
                        
                        {pastReflection.content.length > 300 && (
                          <button
                            onClick={() => setExpandedReflection(pastReflection.id)}
                            className="text-rose-dusty text-sm font-body hover:text-journal-dark transition-colors duration-300"
                          >
                            Read more
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : (
        !generating && !reflection && (
          <div className="text-center py-16">
            <Feather size={48} className="text-rose-dusty mx-auto mb-6" strokeWidth={1} />
            <h3 className="text-xl font-heading text-journal-dark mb-4">No reflections yet</h3>
            <p className="text-journal-medium font-body leading-relaxed">
              {moments.length === 0 
                ? 'Capture some moments first, then generate your first AI reflection'
                : 'Click "New Reflection" above to let AI reflect on your moments'
              }
            </p>
          </div>
        )
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-journal-dark bg-opacity-30 flex items-center justify-center p-6 z-50">
          <div className="bg-linen-cream rounded-2xl shadow-journal p-6 max-w-md w-full confirmation-dialog">
            <h3 className="text-lg font-heading text-journal-dark mb-3">Delete this reflection?</h3>
            <p className="text-journal-medium font-body mb-6 leading-relaxed">
              This will permanently remove this AI-generated reflection from your journal. This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteReflection(showDeleteConfirm)}
                disabled={deletingReflection === showDeleteConfirm}
                className="bg-red-500 hover:bg-red-600 text-white font-body font-medium px-6 py-3 rounded-2xl transition-all duration-300 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingReflection === showDeleteConfirm ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Reflection Modal */}
      {expandedReflection && (() => {
        const reflection = pastReflections.find(r => r.id === expandedReflection)
        if (!reflection) return null
        
        return (
          <div className="fixed inset-0 bg-journal-dark bg-opacity-30 flex items-center justify-center p-6 z-50">
            <div className="bg-linen-cream rounded-2xl shadow-journal p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto confirmation-dialog">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <Feather size={20} className="text-rose-dusty" strokeWidth={1.5} />
                  <h3 className="text-xl font-heading text-journal-dark">AI Reflection</h3>
                </div>
                <button
                  onClick={() => setExpandedReflection(null)}
                  className="text-journal-light hover:text-journal-dark text-2xl leading-none transition-colors duration-300"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <span className="text-journal-light text-sm font-body">{formatReflectionDate(reflection.created_at)}</span>
              </div>
              
              <div className="prose prose-journal max-w-none mb-6">
                <p className="text-journal-dark font-body leading-relaxed text-base whitespace-pre-wrap">
                  {reflection.content}
                </p>
              </div>
              
              {reflection.moment_ids && (
                <div className="bg-rose-pale rounded-2xl p-4 mb-6">
                  <div className="text-xs text-journal-light font-body">
                    This reflection was based on {(() => {
                      try {
                        const ids = JSON.parse(reflection.moment_ids)
                        return Array.isArray(ids) ? ids.length : 1
                      } catch {
                        return 1
                      }
                    })()} of your moments
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-8">
                <button
                  onClick={() => setExpandedReflection(null)}
                  className="btn-primary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}