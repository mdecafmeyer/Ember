import { useState } from 'react'
import { Feather, MapPin, Edit3, Trash2 } from 'lucide-react'
import { usePowerSync } from '@powersync/react'

type MomentType = 'memory' | 'mention' | 'found_object' | 'dream' | 'feeling' | 'other'

interface Moment {
  id: string
  text: string
  moment_type: string
  location_tag: string | null
  created_at: string
  updated_at: string
}

const momentTypeConfig: Record<MomentType, { label: string; color: string }> = {
  memory: { label: 'Memory', color: 'bg-rose-pale text-journal-dark border-rose-soft' },
  mention: { label: 'Mention', color: 'bg-linen-cream text-journal-medium border-journal-light' },
  found_object: { label: 'Found Object', color: 'bg-rose-soft text-journal-dark border-rose-dusty' },
  dream: { label: 'Dream', color: 'bg-linen-cream text-journal-medium border-journal-light' },
  feeling: { label: 'Feeling', color: 'bg-rose-pale text-journal-dark border-rose-soft' },
  other: { label: 'Other', color: 'bg-linen-cream text-journal-medium border-journal-light' },
}

interface TimelineProps {
  moments: Moment[]
  loading: boolean
  onEditMoment: (moment: Moment) => void
  onRefresh: () => void
}

export default function Timeline({ moments, loading, onEditMoment, onRefresh }: TimelineProps) {
  const [filterType, setFilterType] = useState<MomentType | 'all'>('all')
  const [expandedMoment, setExpandedMoment] = useState<string | null>(null)
  const [deletingMoment, setDeletingMoment] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  
  const powerSync = usePowerSync()

  const getFilteredMoments = () => {
    if (filterType === 'all') return moments
    
    return moments.filter(moment => {
      return moment.moment_type === filterType
    })
  }

  const getMomentType = (moment: Moment): MomentType => {
    return (moment.moment_type as MomentType) || 'other'
  }

  const handleDeleteMoment = async (momentId: string) => {
    if (!powerSync) {
      console.error('PowerSync not available')
      return
    }

    setDeletingMoment(momentId)
    
    try {
      await powerSync.execute(
        "DELETE FROM moments WHERE id = ?",
        [momentId]
      )
      
      console.log('Moment deleted successfully:', momentId)
      onRefresh() // Refresh the moments list
      setShowDeleteConfirm(null)
    } catch (error) {
      console.error('Failed to delete moment:', error)
    } finally {
      setDeletingMoment(null)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const filteredMoments = getFilteredMoments()

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-rose-soft border-t-rose-dusty rounded-full mx-auto"></div>
        <p className="text-journal-medium font-body mt-6">Loading your moments...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-3 bg-linen-cream p-6 rounded-3xl mb-8">
        <button
          onClick={() => setFilterType('all')}
          className={`px-5 py-3 rounded-full text-sm font-body font-medium transition-all duration-300 ${
            filterType === 'all'
              ? 'bg-white text-journal-dark shadow-journal border border-rose-soft'
              : 'text-journal-medium hover:text-journal-dark hover:bg-white'
          }`}
        >
          All ({moments.length})
        </button>
        {Object.entries(momentTypeConfig).map(([type, config]) => {
          const count = moments.filter(m => getMomentType(m) === type).length
          if (count === 0) return null
          
          return (
            <button
              key={type}
              onClick={() => setFilterType(type as MomentType)}
              className={`px-5 py-3 rounded-full text-sm font-body font-medium transition-all duration-300 ${
                filterType === type
                  ? 'bg-white text-journal-dark shadow-journal border border-rose-soft'
                  : 'text-journal-medium hover:text-journal-dark hover:bg-white'
              }`}
            >
              {config.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Timeline */}
      {filteredMoments.length === 0 ? (
        <div className="text-center py-16">
          <Feather size={48} className="text-rose-dusty mx-auto mb-6" strokeWidth={1} />
          <h3 className="text-xl font-heading text-journal-dark mb-4">
            {filterType === 'all' ? 'No moments yet' : `No ${momentTypeConfig[filterType as MomentType]?.label.toLowerCase()} moments yet`}
          </h3>
          <p className="text-journal-medium font-body leading-relaxed">
            {filterType === 'all' 
              ? 'Click "New Moment" to capture your first memory'
              : `Try capturing a ${momentTypeConfig[filterType as MomentType]?.label.toLowerCase()} or view all moments`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMoments.map((moment) => {
            const momentType = getMomentType(moment)
            const config = momentTypeConfig[momentType]
            const isExpanded = expandedMoment === moment.id
            
            return (
              <div key={moment.id} className="bg-linen-cream rounded-2xl shadow-journal hover:shadow-journal-hover transition-all duration-300 group relative h-80 flex flex-col">
                {/* Edit and Delete Controls - appear on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex space-x-2 z-10">
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditMoment(moment)
                    }}
                    className="p-2 rounded-full bg-white hover:bg-rose-pale text-journal-light hover:text-journal-dark transition-all duration-300 shadow-journal"
                    title="Edit moment"
                  >
                    <Edit3 size={14} strokeWidth={1.5} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowDeleteConfirm(moment.id)
                    }}
                    className="p-2 rounded-full bg-white hover:bg-red-50 text-journal-light hover:text-red-600 transition-all duration-300 shadow-journal"
                    title="Delete moment"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </div>

                {/* Card Content */}
                <div className="p-6 flex flex-col h-full">
                  {/* Header - Type and Date */}
                  <div className="flex items-center justify-between mb-4 pr-12">
                    <span className={`moment-tag ${config.color} border text-xs px-3 py-1 rounded-full font-medium`}>
                      {config.label}
                    </span>
                    <span className="text-journal-light text-xs font-body">{formatDate(moment.created_at)}</span>
                  </div>
                  
                  {/* Location */}
                  {moment.location_tag && (
                    <div className="flex items-center space-x-1 text-journal-light text-sm mb-3">
                      <MapPin size={12} strokeWidth={1.5} />
                      <span className="truncate">{moment.location_tag}</span>
                    </div>
                  )}
                  
                  {/* Content Preview */}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-journal-dark font-body leading-relaxed text-sm overflow-hidden" style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: 'vertical'
                    }}>
                      {moment.text}
                    </p>
                  </div>
                  
                  {/* Read More Button */}
                  {moment.text.length > 150 && (
                    <div className="mt-4 pt-3 border-t border-rose-pale">
                      <button
                        onClick={() => setExpandedMoment(isExpanded ? null : moment.id)}
                        className="text-rose-dusty text-sm font-body hover:text-journal-dark transition-colors duration-300"
                      >
                        {isExpanded ? 'Show less' : 'Read more'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Delete Confirmation Dialog */}
                {showDeleteConfirm === moment.id && (
                  <div className="fixed inset-0 bg-journal-dark bg-opacity-30 flex items-center justify-center p-6 z-50">
                    <div className="bg-linen-cream rounded-2xl shadow-journal p-6 max-w-md w-full confirmation-dialog">
                      <h3 className="text-lg font-heading text-journal-dark mb-3">Delete this moment?</h3>
                      <p className="text-journal-medium font-body mb-6 leading-relaxed">
                        This will permanently remove this moment from your journal. This action cannot be undone.
                      </p>
                      <div className="flex space-x-3">
                        <button
                          onClick={() => setShowDeleteConfirm(null)}
                          className="btn-secondary flex-1"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteMoment(moment.id)}
                          disabled={deletingMoment === moment.id}
                          className="bg-red-500 hover:bg-red-600 text-white font-body font-medium px-6 py-3 rounded-2xl transition-all duration-300 flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingMoment === moment.id ? (
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
              </div>
            )
          }          )}
        </div>
      )}

      {/* Expanded Moment Modal */}
      {expandedMoment && (() => {
        const moment = filteredMoments.find(m => m.id === expandedMoment)
        if (!moment) return null
        
        const momentType = getMomentType(moment)
        const config = momentTypeConfig[momentType]
        
        return (
          <div className="fixed inset-0 bg-journal-dark bg-opacity-30 flex items-center justify-center p-6 z-50">
            <div className="bg-linen-cream rounded-2xl shadow-journal p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto confirmation-dialog">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <span className={`moment-tag ${config.color} border text-sm px-4 py-2 rounded-full font-medium`}>
                    {config.label}
                  </span>
                  {moment.location_tag && (
                    <div className="flex items-center space-x-2 text-journal-light">
                      <MapPin size={16} strokeWidth={1.5} />
                      <span className="text-sm">{moment.location_tag}</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setExpandedMoment(null)}
                  className="text-journal-light hover:text-journal-dark text-2xl leading-none transition-colors duration-300"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <span className="text-journal-light text-sm font-body">{formatDate(moment.created_at)}</span>
              </div>
              
              <div className="prose prose-journal max-w-none">
                <p className="text-journal-dark font-body leading-relaxed text-base whitespace-pre-wrap">
                  {moment.text}
                </p>
              </div>
              
              <div className="flex justify-end mt-8 space-x-3">
                <button
                  onClick={() => {
                    setExpandedMoment(null)
                    onEditMoment(moment)
                  }}
                  className="btn-secondary flex items-center space-x-2"
                >
                  <Edit3 size={16} strokeWidth={1.5} />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => setExpandedMoment(null)}
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