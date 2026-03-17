import { useState, useEffect } from 'react'
import { usePowerSync } from '@powersync/react'
import { supabase } from '../lib/supabase'

interface Moment {
  id: string
  text: string
  moment_type: string
  location_tag: string | null
  created_at: string
}

interface CaptureFormProps {
  isOpen: boolean
  onClose: () => void
  onMomentSaved: () => void
  editingMoment?: Moment | null
}

type MomentType = 'memory' | 'mention' | 'found_object' | 'dream' | 'feeling' | 'other'

const momentTypes: { value: MomentType; label: string; description: string }[] = [
  { value: 'memory', label: 'Memory', description: 'A cherished memory' },
  { value: 'mention', label: 'Mention', description: 'Someone spoke of them' },
  { value: 'found_object', label: 'Found Object', description: 'Something that reminds you' },
  { value: 'dream', label: 'Dream', description: 'They visited in a dream' },
  { value: 'feeling', label: 'Feeling', description: 'An emotion or sensation' },
  { value: 'other', label: 'Other', description: 'Something else meaningful' },
]

export default function CaptureForm({ isOpen, onClose, onMomentSaved, editingMoment }: CaptureFormProps) {
  const [description, setDescription] = useState('')
  const [selectedType, setSelectedType] = useState<MomentType>('memory')
  const [location, setLocation] = useState('')
  const [momentDate, setMomentDate] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // Format for datetime-local input
  })
  const [saving, setSaving] = useState(false)
  
  const powerSync = usePowerSync()
  const isEditing = !!editingMoment

  // Populate form when editing a moment
  useEffect(() => {
    if (editingMoment) {
      setDescription(editingMoment.text)
      setSelectedType(editingMoment.moment_type as MomentType)
      setLocation(editingMoment.location_tag || '')
      setMomentDate(new Date(editingMoment.created_at).toISOString().slice(0, 16))
    } else {
      resetForm()
    }
  }, [editingMoment])

  const resetForm = () => {
    setDescription('')
    setSelectedType('memory')
    setLocation('')
    const now = new Date()
    setMomentDate(now.toISOString().slice(0, 16))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!description.trim()) return
    
    setSaving(true)
    
    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user?.id) {
        throw new Error('User not authenticated')
      }

      const userId = session.user.id
      const text = description.trim()
      const momentType = selectedType
      const locationTag = location.trim() || null
      const selectedDate = new Date(momentDate).toISOString()
      const updatedAt = new Date().toISOString()

      if (isEditing && editingMoment) {
        // Update existing moment
        await powerSync.execute(
          "UPDATE moments SET text = ?, moment_type = ?, location_tag = ?, created_at = ?, updated_at = ? WHERE id = ?",
          [text, momentType, locationTag, selectedDate, updatedAt, editingMoment.id]
        )
        console.log('Moment updated successfully:', editingMoment.id)
      } else {
        // Create new moment
        const id = crypto.randomUUID()
        await powerSync.execute(
          "INSERT INTO moments (id, user_id, text, moment_type, location_tag, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [id, userId, text, momentType, locationTag, selectedDate, updatedAt]
        )
        console.log('New moment created successfully:', id)
      }

      resetForm()
      onMomentSaved()
      onClose()
    } catch (error) {
      console.error('Failed to save moment:', error)
      // For now, we'll still close the form since the data might have been saved locally
      // In a production app, you'd want to show a user-friendly error message
      resetForm()
      onMomentSaved() // Trigger refresh to check if it was actually saved
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      resetForm()
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-journal-dark bg-opacity-30 flex items-center justify-center p-6 z-50">
      <div className="bg-linen-cream rounded-3xl shadow-journal max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-heading text-journal-dark">
              {isEditing ? 'Edit Moment' : 'Capture a Moment'}
            </h2>
            <button
              onClick={handleClose}
              disabled={saving}
              className="text-journal-light hover:text-journal-dark text-2xl leading-none disabled:opacity-50 transition-colors duration-300"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            {/* Moment Type Selector */}
            <div>
              <label className="block text-sm font-body font-medium text-journal-dark mb-4">
                What kind of moment is this?
              </label>
              <div className="grid grid-cols-2 gap-3">
                {momentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`p-5 rounded-2xl border text-left transition-all duration-300 ${
                      selectedType === type.value
                        ? 'border-rose-dusty bg-rose-pale text-journal-dark shadow-journal'
                        : 'border-journal-light bg-white text-journal-medium hover:border-rose-soft hover:bg-rose-pale'
                    }`}
                  >
                    <div className="mb-2">
                      <span className="font-body font-medium text-base">{type.label}</span>
                    </div>
                    <p className="text-sm font-body opacity-75 leading-relaxed">{type.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-body font-medium text-journal-dark mb-4">
                Describe this moment
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="textarea-field h-40"
                placeholder="Take your time... share what feels right to you."
                required
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-body font-medium text-journal-dark mb-4">
                Where did this happen? (optional)
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="input-field"
                placeholder="A place, a room, or just a feeling of where..."
              />
            </div>

            {/* Date and Time */}
            <div>
              <label htmlFor="momentDate" className="block text-sm font-body font-medium text-journal-dark mb-4">
                When did this happen?
              </label>
              <input
                id="momentDate"
                type="datetime-local"
                value={momentDate}
                onChange={(e) => setMomentDate(e.target.value)}
                className="input-field"
                max={new Date().toISOString().slice(0, 16)} // Can't select future dates
              />
              <p className="text-xs text-journal-light font-body mt-2 leading-relaxed">
                This lets you capture moments that happened earlier
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-4 pt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={saving}
                className="btn-secondary flex-1 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || !description.trim()}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  isEditing ? 'Update Moment' : 'Save Moment'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}