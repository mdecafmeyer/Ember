import { useState, useEffect } from 'react'
import { usePowerSync } from '@powersync/react'
import { Feather } from 'lucide-react'

interface SavedReflection {
  id: string
  content: string
  moment_ids: string
  created_at: string
}

interface ReflectionEditModalProps {
  isOpen: boolean
  onClose: () => void
  onReflectionUpdated: () => void
  editingReflection?: SavedReflection | null
}

export default function ReflectionEditModal({ 
  isOpen, 
  onClose, 
  onReflectionUpdated, 
  editingReflection 
}: ReflectionEditModalProps) {
  const [content, setContent] = useState(editingReflection?.content || '')
  const [saving, setSaving] = useState(false)
  
  const powerSync = usePowerSync()

  // Update content when editing reflection changes
  useEffect(() => {
    if (editingReflection) {
      setContent(editingReflection.content)
    }
  }, [editingReflection])

  const handleClose = () => {
    setContent(editingReflection?.content || '')
    onClose()
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!content.trim() || !editingReflection || !powerSync) return
    
    setSaving(true)
    
    try {
      await powerSync.execute(
        "UPDATE reflections SET content = ?, updated_at = ? WHERE id = ?",
        [content.trim(), new Date().toISOString(), editingReflection.id]
      )
      
      console.log('Reflection updated successfully:', editingReflection.id)
      console.log('Calling onReflectionUpdated callback to refresh data')
      onReflectionUpdated()
      onClose()
    } catch (error) {
      console.error('Failed to update reflection:', error)
      // For now, we'll still close the form since the data might have been saved locally
      onReflectionUpdated()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen || !editingReflection) return null

  return (
    <div className="fixed inset-0 bg-journal-dark bg-opacity-30 flex items-center justify-center p-6 z-50">
      <div className="bg-linen-cream rounded-3xl shadow-journal p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <Feather size={24} className="text-rose-dusty" strokeWidth={1.5} />
              <h2 className="text-2xl font-heading text-journal-dark">Edit Reflection</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="text-journal-light hover:text-journal-dark text-2xl leading-none disabled:opacity-50 transition-colors duration-300"
            >
              ×
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Reflection Text */}
            <div>
              <label htmlFor="content" className="block text-sm font-body font-medium text-journal-dark mb-4">
                Your reflection
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="textarea-field h-64"
                placeholder="Edit your reflection..."
                required
                autoFocus
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-rose-soft">
            <button
              type="button"
              onClick={handleClose}
              disabled={saving}
              className="btn-secondary disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !content.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Updating...</span>
                </>
              ) : (
                'Update Reflection'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}