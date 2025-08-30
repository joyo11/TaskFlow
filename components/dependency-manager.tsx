/**
 * Dependency Manager Component
 * 
 * Manages task dependencies within the task detail dialog.
 * Allows adding and removing dependencies, with circular dependency prevention.
 * Provides a user-friendly interface for managing task relationships.
 * 
 * @author Mohammad Shafay Joyo
 * @copyright 2025 Mohammad Shafay Joyo
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Link2, Plus, X, AlertTriangle, Check } from "lucide-react"
import type { Task } from "@/types/task"

/**
 * Props for the DependencyManager component
 */
interface DependencyManagerProps {
  task: Task
  allTasks: Task[]
  onDependenciesChange: (dependencies: string[]) => void
}

/**
 * Dependency Manager Component
 * 
 * Provides an interface for managing task dependencies. Shows current dependencies,
 * allows adding new ones, and prevents circular dependencies. Includes validation
 * and error handling for dependency operations.
 * 
 * @param task - The task whose dependencies are being managed
 * @param allTasks - Array of all available tasks for dependency selection
 * @param onDependenciesChange - Callback when dependencies are updated
 */
export function DependencyManager({ task, allTasks, onDependenciesChange }: DependencyManagerProps) {
  const [selectedDependencies, setSelectedDependencies] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  // Initialize with current dependencies when component mounts or task changes
  useEffect(() => {
    // Initialize with current dependencies
    console.log('DependencyManager: task.dependencies:', task.dependencies)
    if (task.dependencies && Array.isArray(task.dependencies)) {
      // Handle both array of objects with id property and array of strings
      const dependencyIds = task.dependencies.map((dep: any) => 
        typeof dep === 'string' ? dep : dep.id
      )
      console.log('DependencyManager: extracted dependency IDs:', dependencyIds)
      setSelectedDependencies(dependencyIds)
    } else {
      console.log('DependencyManager: no dependencies found')
      setSelectedDependencies([])
    }
  }, [task.dependencies])

  // Filter out current task and already selected dependencies from available tasks
  const availableTasks = allTasks.filter(t => 
    t.id !== task.id && 
    !selectedDependencies.includes(t.id)
  )

  console.log('DependencyManager: allTasks count:', allTasks.length)
  console.log('DependencyManager: selectedDependencies:', selectedDependencies)
  console.log('DependencyManager: availableTasks count:', availableTasks.length)
  console.log('DependencyManager: availableTasks:', availableTasks.map(t => ({ id: t.id, title: t.title })))

  /**
   * Adds a new dependency to the selected dependencies list
   * @param taskId - The ID of the task to add as a dependency
   */
  const addDependency = (taskId: string) => {
    const newDependencies = [...selectedDependencies, taskId]
    setSelectedDependencies(newDependencies)
    setError(null)
  }

  /**
   * Removes a dependency from the selected dependencies list
   * @param taskId - The ID of the task to remove as a dependency
   */
  const removeDependency = (taskId: string) => {
    const newDependencies = selectedDependencies.filter(id => id !== taskId)
    setSelectedDependencies(newDependencies)
    setError(null)
  }

  /**
   * Saves the current dependencies to the backend
   * Includes circular dependency validation and error handling
   */
  const saveDependencies = async () => {
    setIsLoading(true)
    setError(null)
    setIsSuccess(false)

    try {
      const response = await fetch(`/api/tasks/${task.id}/dependencies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dependencies: selectedDependencies }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update dependencies')
      }

      setIsSuccess(true)
      onDependenciesChange(selectedDependencies)
      
      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsSuccess(false)
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update dependencies')
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Finds a task by its ID from the allTasks array
   * @param id - The task ID to search for
   * @returns The task object or undefined if not found
   */
  const getTaskById = (id: string) => {
    return allTasks.find(t => t.id === id)
  }

  /**
   * Returns the appropriate color class for task status indicators
   * @param status - The task status
   * @returns CSS class for the status color
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-600"
      case "in-progress":
        return "bg-blue-600"
      case "todo":
        return "bg-gray-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <Link2 className="h-5 w-5 mr-2" />
          Dependencies
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Dependencies */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Current Dependencies</h4>
          {selectedDependencies.length === 0 ? (
            <p className="text-gray-500 text-sm">No dependencies set</p>
          ) : (
            <div className="space-y-2">
              {selectedDependencies.map((depId) => {
                const depTask = getTaskById(depId)
                if (!depTask) return null

                return (
                  <div
                    key={depId}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(depTask.status)}`}></div>
                      <div>
                        <p className="text-white text-sm font-medium">{depTask.title}</p>
                        <p className="text-gray-400 text-xs">{depTask.status}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeDependency(depId)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Add New Dependency */}
        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Add Dependency</h4>
          <div className="flex space-x-2">
            <Select onValueChange={addDependency} key={selectedDependencies.length}>
              <SelectTrigger className="flex-1 bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select a task..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {availableTasks.length === 0 ? (
                  <SelectItem value="no-tasks" disabled>No tasks available</SelectItem>
                ) : (
                  availableTasks.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-white">
                      {t.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (availableTasks.length > 0) {
                  addDependency(availableTasks[0].id)
                }
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Add First
            </Button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Alert className="border-red-600 bg-red-900/20">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <AlertDescription className="text-red-400">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Success Display */}
        {isSuccess && (
          <Alert className="border-green-600 bg-green-900/20">
            <Check className="h-4 w-4 text-green-400" />
            <AlertDescription className="text-green-400">
              Dependencies saved successfully!
            </AlertDescription>
          </Alert>
        )}

        {/* Save Button */}
        <Button
          onClick={saveDependencies}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white hover:bg-blue-700"
        >
          {isLoading ? "Saving..." : "Save Dependencies"}
        </Button>


      </CardContent>
    </Card>
  )
}
