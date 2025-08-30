"use client"

import { useState } from "react"
import { Calendar, ImageIcon, Link2, User, Tag, Clock, Edit, Trash2, Loader2, X, Check } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import type { Task, TaskStatus } from "@/types/task"
import { DependencyManager } from "./dependency-manager"

interface TaskDetailDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onDelete?: (taskId: string) => void
  allTasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
}

// Helper function to format dates consistently
const formatDate = (date: Date | string | undefined) => {
  if (!date) return 'No date set'
  
  // Convert string to Date object if needed
  const dateObj = typeof date === 'string' ? new Date(date) : date
  
  // Check if the date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date'
  }
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// Image component with loading state for detail dialog
function DetailImage({ src, alt, index }: { src: string; alt: string; index: number }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="w-full h-32 bg-gray-800 rounded-lg border border-gray-700 flex items-center justify-center">
        <ImageIcon className="h-6 w-6 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="relative group">
      <div className="w-full h-32 bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <Loader2 className="h-6 w-6 text-gray-400 animate-spin" />
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-200 ${
            isLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false)
            setHasError(true)
          }}
        />
      </div>
      <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
        <Button variant="outline" size="sm" className="border-gray-600 text-white bg-transparent">
          View Full
        </Button>
      </div>
    </div>
  )
}

export function TaskDetailDialog({ task, open, onOpenChange, onStatusChange, onDelete, allTasks = [], onTaskUpdate }: TaskDetailDialogProps) {
  const [currentStatus, setCurrentStatus] = useState<TaskStatus>(task.status)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDueDate, setEditedDueDate] = useState(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')

  console.log('TaskDetailDialog: task:', task)
  console.log('TaskDetailDialog: task.dependencies:', task.dependencies)
  console.log('TaskDetailDialog: allTasks:', allTasks)

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-900 text-red-300 border-red-700"
      case "medium":
        return "bg-yellow-900 text-yellow-300 border-yellow-700"
      case "low":
        return "bg-green-900 text-green-300 border-green-700"
      default:
        return "bg-gray-800 text-gray-300 border-gray-600"
    }
  }

  // Enhanced due date status checking (same as TaskCard)
  const getDueDateStatus = () => {
    if (!task.dueDate || task.status === "done") return null
    
    const today = new Date()
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    
    const dueDate = new Date(task.dueDate)
    const dueDateStart = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate())
    
    const diffTime = dueDateStart.getTime() - todayStart.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays < 0) {
      return { status: 'overdue', color: 'text-red-400', badge: 'Overdue' }
    } else if (diffDays === 0) {
      return { status: 'today', color: 'text-yellow-400', badge: 'Due Today' }
    } else if (diffDays <= 3) {
      return { status: 'soon', color: 'text-orange-400', badge: 'Due Soon' }
    } else {
      return { 
        status: 'future', 
        color: 'text-gray-400', 
        badge: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`
      }
    }
  }

  const dueDateStatus = getDueDateStatus()

  const handleStatusChange = (newStatus: TaskStatus) => {
    setCurrentStatus(newStatus)
    onStatusChange(task.id, newStatus)
  }

  const handleDelete = () => {
    if (onDelete) {
      onDelete(task.id)
      setShowDeleteDialog(false)
      onOpenChange(false)
    }
  }

  const handleSave = async () => {
    try {
      const updates: Partial<Task> = {}
      
      if (editedDueDate !== (task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '')) {
        // Fix timezone issue by creating date in local timezone
        const [year, month, day] = editedDueDate.split('-').map(Number)
        updates.dueDate = new Date(year, month - 1, day) // month is 0-indexed
      }
      
      if (Object.keys(updates).length > 0) {
        if (onTaskUpdate) {
          await onTaskUpdate(task.id, updates)
          setIsEditing(false)
        } else {
          const response = await fetch(`/api/tasks/${task.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
          })
          
          if (response.ok) {
            setIsEditing(false)
            // Refresh the task data
            window.location.reload()
          }
        }
      }
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-4xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <DialogTitle className="text-white text-xl">{task.title}</DialogTitle>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  {isEditing ? <X className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                </Button>
                {isEditing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    className="border-green-600 text-green-400 hover:bg-green-900/20 bg-transparent"
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="border-red-600 text-red-400 hover:bg-red-900/20 bg-transparent"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onOpenChange(false)}
                  className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Task Details */}
            <div className="space-y-6">
              {/* Description */}
              {task.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Description</h3>
                  <p className="text-gray-400 leading-relaxed">{task.description}</p>
                </div>
              )}

              {/* Images */}
              {task.images && task.images.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center">
                    <ImageIcon className="h-4 w-4 mr-2" />
                    Images ({task.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {task.images.map((image, index) => (
                      <DetailImage
                        key={index}
                        src={image}
                        alt={`Task image ${index + 1}`}
                        index={index}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Task Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Priority */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400 w-20">Priority:</span>
                    <Badge className={`${getPriorityColor(task.priority)}`}>{task.priority}</Badge>
                  </div>

                  {/* Assignee */}
                  {task.assignee && (
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-400 w-20">Assignee:</span>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <span className="text-white">{task.assignee}</span>
                      </div>
                    </div>
                  )}

                  {/* Due Date */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400 w-20">Due Date:</span>
                    {isEditing ? (
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <input
                          type="date"
                          value={editedDueDate}
                          onChange={(e) => setEditedDueDate(e.target.value)}
                          className="bg-gray-800 border border-gray-600 text-white px-2 py-1 rounded text-sm"
                        />
                      </div>
                    ) : task.dueDate ? (
                      <div 
                        className="space-y-1 cursor-pointer hover:bg-gray-800 p-1 rounded"
                        onClick={() => setIsEditing(true)}
                      >
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className={dueDateStatus?.color || 'text-white'}>
                            {formatDate(task.dueDate)}
                          </span>
                        </div>
                        {dueDateStatus?.badge && (
                          <Badge 
                            variant={dueDateStatus.status === 'overdue' ? 'destructive' : 'secondary'} 
                            className={`text-xs ${
                              dueDateStatus.status === 'today' ? 'bg-yellow-900 text-yellow-300 border-yellow-700' :
                              dueDateStatus.status === 'soon' ? 'bg-orange-900 text-orange-300 border-orange-700' :
                              dueDateStatus.status === 'future' ? 'bg-gray-800 text-gray-300 border-gray-600' :
                              ''
                            }`}
                          >
                            {dueDateStatus.badge}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <div 
                        className="text-gray-500 text-sm cursor-pointer hover:bg-gray-800 p-1 rounded"
                        onClick={() => setIsEditing(true)}
                      >
                        No due date set (click to add)
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Created */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400 w-20">Created:</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{formatDate(task.createdAt)}</span>
                    </div>
                  </div>

                  {/* Updated */}
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-gray-400 w-20">Updated:</span>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="text-white">{formatDate(task.updatedAt)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center">
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {task.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="bg-gray-800 text-gray-300">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Dependencies */}
              {task.dependencies && task.dependencies.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-300 flex items-center">
                    <Link2 className="h-4 w-4 mr-2" />
                    Dependencies ({task.dependencies.length})
                  </h3>
                  <div className="space-y-2">
                    {task.dependencies.map((dep: any) => {
                      const depTask = allTasks.find(t => t.id === dep.id)
                      if (!depTask) return null

                      return (
                        <div
                          key={dep.id}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                        >
                          <div className="flex items-center space-x-3">
                            <Link2 className="h-4 w-4 text-gray-400" />
                            <div>
                              <p className="text-white font-medium">{depTask.title}</p>
                              <p className="text-gray-400 text-xs">{depTask.status}</p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                            Dependency
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Dependency Manager */}
            <div>
              <DependencyManager
                task={task}
                allTasks={allTasks}
                onDependenciesChange={(dependencies) => {
                  // Handle dependency changes
                  console.log('Dependencies updated:', dependencies)
                  // Refresh the page to show updated dependencies
                  window.location.reload()
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {onDelete && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent 
            className="bg-gray-900 border-gray-700 text-white"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleDelete()
              }
            }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white">Are you sure?</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-300">
                This action cannot be undone. This will permanently delete the task "{task.title}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
