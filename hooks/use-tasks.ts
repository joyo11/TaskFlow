/**
 * useTasks Hook
 * 
 * Custom React hook for managing task state and API operations.
 * Provides functions for fetching, creating, updating, and deleting tasks.
 * Handles loading states, error states, and optimistic updates.
 * 
 * @author Mohammad Shafay Joyo
 * @copyright 2025 Mohammad Shafay Joyo
 */

import { useState, useCallback, useEffect } from 'react'
import type { Task } from '@/types/task'

/**
 * Custom hook for managing tasks
 * 
 * Provides a centralized way to manage task state and operations.
 * Includes loading states, error handling, and optimistic updates.
 * 
 * @returns Object containing tasks state and operation functions
 */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  /**
   * Fetches all tasks from the API
   * Updates the tasks state and handles loading/error states
   */
  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/tasks')
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks')
      }
      
      const data = await response.json()
      setTasks(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tasks')
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Adds a new task to the system
   * Includes automatic image fetching from Pexels API
   * 
   * @param task - The task data to create (without id, createdAt, updatedAt)
   */
  const addTask = useCallback(async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setError(null)
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const newTask = await response.json()
      console.log('New task created:', newTask)
      console.log('Current tasks before update:', tasks)
      
      setTasks(prev => {
        const updatedTasks = [...prev, newTask]
        console.log('Updated tasks:', updatedTasks)
        return updatedTasks
      })
      
      console.log('Task added to state successfully')
    } catch (err) {
      console.error('Error in addTask:', err)
      setError(err instanceof Error ? err.message : 'Failed to create task')
      throw err
    }
  }, [tasks])

  /**
   * Updates an existing task
   * Preserves existing data and only updates provided fields
   * 
   * @param id - The ID of the task to update
   * @param updates - Partial task data to update
   */
  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    try {
      setError(null)
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Failed to update task'
        
        // Handle dependency enforcement error specifically
        if (errorData.incompleteDependencies) {
          const depNames = errorData.incompleteDependencies.map((dep: any) => dep.title).join(', ')
          throw new Error(`Cannot complete this task. Please finish these dependencies first: ${depNames}`)
        }
        
        throw new Error(errorMessage)
      }

      const updatedTask = await response.json()
      
      // Preserve existing task data and only update the changed fields
      setTasks(prev => prev.map(task => {
        if (task.id === id) {
          return {
            ...task,           // Keep existing data (including images)
            ...updatedTask,    // Override with updated fields
            images: task.images // Preserve the original images array to maintain loading state
          }
        }
        return task
      }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task')
      throw err
    }
  }, [])

  /**
   * Deletes a task from the system
   * 
   * @param id - The ID of the task to delete
   */
  const deleteTask = useCallback(async (id: string) => {
    try {
      setError(null)
      const response = await fetch(`/api/tasks/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete task')
      }

      setTasks(prev => prev.filter(task => task.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete task')
      throw err
    }
  }, [])

  /**
   * Moves a task to a different status
   * Wrapper around updateTask for status changes
   * 
   * @param id - The ID of the task to move
   * @param newStatus - The new status for the task
   */
  const moveTask = useCallback(async (id: string, newStatus: Task['status']) => {
    try {
      await updateTask(id, { status: newStatus })
    } catch (err) {
      // Error is already set by updateTask
      throw err
    }
  }, [updateTask])

  /**
   * Refreshes the tasks list from the API
   * Useful for syncing with external changes
   */
  const refreshTasks = useCallback(async () => {
    await fetchTasks()
  }, [fetchTasks])

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    moveTask,
    refreshTasks,
  }
}
