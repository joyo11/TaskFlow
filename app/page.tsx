/**
 * Task Manager - Main Application Page
 * 
 * This is the main page component that handles the task management interface.
 * It includes task board view, dependency graph view, and task creation functionality.
 * 
 * @author Mohammad Shafay Joyo
 * @copyright 2025 Mohammad Shafay Joyo
 */

"use client"

import { useState, useEffect } from "react"
import { Plus, Search, GitBranch, Kanban } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TaskBoard } from "@/components/task-board"
import { CreateTaskDialog } from "@/components/create-task-dialog"
import { DependencyGraph } from "@/components/dependency-graph"

import { useTasks } from "@/hooks/use-tasks"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { Task } from "@/types/task"

/**
 * Main Task Manager Component
 * 
 * Handles the overall application state and provides:
 * - Task board view (kanban style)
 * - Dependency graph visualization
 * - Task creation and management
 * - Search functionality
 * - View switching between board and graph
 */
export default function TaskManager() {
  // State for managing dialogs and views
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isGraphView, setIsGraphView] = useState(false)
  const [analysisData, setAnalysisData] = useState<{ criticalPath: string[], earliestStartDates: Record<string, Date> } | null>(null)
  
  // Custom hook for task management
  const { tasks, loading, error, addTask, deleteTask, moveTask, updateTask } = useTasks()

  // Fetch analysis data when switching to graph view
  useEffect(() => {
    if (isGraphView && tasks.length > 0) {
      fetchAnalysisData()
    }
  }, [isGraphView, tasks])

  /**
   * Fetches dependency analysis data for the graph view
   * Includes critical path and earliest start dates
   */
  const fetchAnalysisData = async () => {
    try {
      const response = await fetch('/api/tasks/analysis')
      if (response.ok) {
        const data = await response.json()
        setAnalysisData(data)
      }
    } catch (error) {
      console.error('Failed to fetch analysis data:', error)
    }
  }

  /**
   * Handles creating a new task
   * @param task - The task data to create
   */
  const handleCreateTask = async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addTask(task)
      setIsCreateDialogOpen(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      // Error is already handled by the hook
    }
  }

  /**
   * Handles deleting a single task
   * @param taskId - The ID of the task to delete
   */
  const handleDeleteTask = async (taskId: string) => {
    try {
      await deleteTask(taskId)
    } catch (error) {
      console.error('Failed to delete task:', error)
      // Error is already handled by the hook
    }
  }

  /**
   * Handles bulk deletion of multiple tasks
   * @param taskIds - Array of task IDs to delete
   */
  const handleDeleteAllTasks = async (taskIds: string[]) => {
    try {
      // Delete all tasks in parallel
      await Promise.all(taskIds.map(taskId => deleteTask(taskId)))
    } catch (error) {
      console.error('Failed to delete all tasks:', error)
      // Error is already handled by the hook
    }
  }

  /**
   * Handles moving a task between status columns
   * @param taskId - The ID of the task to move
   * @param newStatus - The new status for the task
   */
  const handleTaskMove = async (taskId: string, newStatus: Task['status']) => {
    try {
      await moveTask(taskId, newStatus)
    } catch (error) {
      console.error('Failed to move task:', error)
      // Error is already handled by the hook
    }
  }

  // Show loading state while tasks are being fetched
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-xl">Loading tasks...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-950">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">TaskFlow</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-64 bg-gray-900 border-gray-700 text-white placeholder-gray-400 pl-10"
                />
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-white text-black hover:bg-gray-200">
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsGraphView(!isGraphView)}
                className="flex items-center space-x-2"
              >
                {isGraphView ? <Kanban className="h-4 w-4" /> : <GitBranch className="h-4 w-4" />}
                <span>{isGraphView ? 'Task Board' : 'Dependency Graph'}</span>
              </Button>
            </div>
          </div>


        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {error && (
          <Alert className="mb-6 border-red-600 bg-red-900/20">
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {isGraphView ? (
          <DependencyGraph
            tasks={tasks}
            criticalPath={analysisData?.criticalPath || []}
            earliestStartDates={analysisData?.earliestStartDates || {}}
          />
        ) : (
          <TaskBoard
            searchQuery={searchQuery}
            tasks={tasks}
            onTaskMove={handleTaskMove}
            onTaskDelete={handleDeleteTask}
            allTasks={tasks}
            onTaskUpdate={updateTask}
            onDeleteAll={handleDeleteAllTasks}
          />
        )}
      </main>

      <CreateTaskDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onTaskCreate={handleCreateTask}
      />
    </div>
  )
}
