/**
 * Task Card Component
 * 
 * Displays individual task information in a card format.
 * Shows task details, due dates, images, and provides actions like
 * status changes and deletion.
 * 
 * @author Mohammad Shafay Joyo
 * @copyright 2025 Mohammad Shafay Joyo
 */

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TaskDetailDialog } from "./task-detail-dialog"
import { MoreHorizontal, Calendar, User, Link2, ImageIcon, Loader2, Trash2 } from "lucide-react"
import type { Task, TaskStatus } from "@/types/task"

/**
 * Helper function to format dates consistently
 * @param date - Date to format (can be Date object, string, or undefined)
 * @returns Formatted date string or fallback text
 */
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

/**
 * Image component with loading state
 * Handles image loading, error states, and fallbacks
 */
function TaskImage({ src, alt }: { src: string; alt: string }) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div className="w-full h-20 bg-gray-800 rounded-md flex items-center justify-center">
        <ImageIcon className="h-4 w-4 text-gray-500" />
      </div>
    )
  }

  return (
    <div className="relative w-full h-20 bg-gray-800 rounded-md overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />
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
  )
}

/**
 * Props for the TaskCard component
 */
interface TaskCardProps {
  task: Task
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void
  onDelete: (taskId: string) => void
  allTasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
}

/**
 * Task Card Component
 * 
 * Renders a single task as a card with all its details and actions.
 * Includes due date status, image preview, dependencies, and action buttons.
 * 
 * @param task - The task data to display
 * @param onStatusChange - Callback for changing task status
 * @param onDelete - Callback for deleting the task
 * @param allTasks - Array of all tasks (for dependency display)
 * @param onTaskUpdate - Callback for updating task details
 */
export function TaskCard({ task, onStatusChange, onDelete, allTasks = [], onTaskUpdate }: TaskCardProps) {
  const [showDetails, setShowDetails] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  /**
   * Returns the appropriate color class for priority badges
   */
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

  /**
   * Enhanced due date status checking
   * Determines if a task is overdue, due today, due soon, or in the future
   */
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

  /**
   * Handles the delete action for the task
   */
  const handleDelete = () => {
    onDelete(task.id)
    setShowDeleteDialog(false)
  }

  return (
    <>
      <Card
        className="bg-gray-900 border-gray-700 hover:bg-gray-800 transition-colors cursor-pointer"
        onClick={() => setShowDetails(true)}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-white text-sm leading-tight">{task.title}</h4>
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-gray-400 hover:text-white">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(task.id, "todo")
                  }}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  Move to To Do
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(task.id, "in-progress")
                  }}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  Move to In Progress
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onStatusChange(task.id, "done")
                  }}
                  className="text-gray-300 hover:bg-gray-700"
                >
                  Move to Done
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowDeleteDialog(true)
                  }}
                  className="text-red-400 hover:bg-red-900/20"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {task.description && <p className="text-xs text-gray-400 line-clamp-2">{task.description}</p>}
        </CardHeader>

        <CardContent className="pt-0 space-y-3">
          {/* Image Preview */}
          {task.images && task.images.length > 0 && (
            <div className="space-y-2">
              {task.images.slice(0, 1).map((image, index) => (
                <TaskImage 
                  key={index} 
                  src={image} 
                  alt={`Task image for ${task.title}`} 
                />
              ))}
              {task.images.length > 1 && (
                <div className="flex items-center space-x-2">
                  <ImageIcon className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-400">
                    +{task.images.length - 1} more image{task.images.length - 1 > 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Dependencies */}
          {task.dependencies && task.dependencies.length > 0 && (
            <div className="flex items-center space-x-2">
              <Link2 className="h-3 w-3 text-gray-400" />
              <span className="text-xs text-gray-400">{task.dependencies.length} dependencies</span>
            </div>
          )}

          {/* Due Date */}
          {task.dueDate && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <Calendar className="h-3 w-3 text-gray-400" />
                <span className={`text-xs ${dueDateStatus?.color || 'text-gray-400'}`}>
                  {formatDate(task.dueDate)}
                </span>
              </div>
              {dueDateStatus?.badge && (
                <Badge 
                  variant={dueDateStatus.status === 'overdue' ? 'destructive' : 'secondary'} 
                  className={`text-xs px-1 py-0 ${
                    dueDateStatus.status === 'today' ? 'bg-yellow-900 text-yellow-300 border-yellow-700' :
                    dueDateStatus.status === 'soon' ? 'bg-orange-900 text-orange-300 border-orange-700' :
                    ''
                  }`}
                >
                  {dueDateStatus.badge}
                </Badge>
              )}
            </div>
          )}

          {/* Priority and Tags */}
          <div className="flex items-center justify-between">
            <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>{task.priority}</Badge>

            {task.assignee && (
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">{task.assignee}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {task.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                  {tag}
                </Badge>
              ))}
              {task.tags.length > 2 && (
                <Badge variant="secondary" className="text-xs bg-gray-800 text-gray-300">
                  +{task.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
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

      <TaskDetailDialog task={task} open={showDetails} onOpenChange={setShowDetails} onStatusChange={onStatusChange} onDelete={onDelete} allTasks={allTasks} onTaskUpdate={onTaskUpdate} />
    </>
  )
}
