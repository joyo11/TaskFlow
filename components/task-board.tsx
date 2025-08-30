/**
 * Task Board Component
 * 
 * Displays tasks in a kanban-style board with three columns:
 * - To Do
 * - In Progress  
 * - Done
 * 
 * Handles task filtering, moving, and deletion operations.
 * 
 * @author Mohammad Shafay Joyo
 * @copyright 2025 Mohammad Shafay Joyo
 */

"use client"

import { TaskColumn } from "./task-column"
import type { Task, TaskStatus } from "@/types/task"

/**
 * Props for the TaskBoard component
 */
interface TaskBoardProps {
  searchQuery?: string
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void
  onTaskDelete: (taskId: string) => void
  allTasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDeleteAll?: (taskIds: string[]) => void
}

/**
 * Task Board Component
 * 
 * Renders a kanban-style board with three columns for task management.
 * Filters tasks based on search query and groups them by status.
 * 
 * @param searchQuery - Optional search term to filter tasks
 * @param tasks - Array of all tasks to display
 * @param onTaskMove - Callback for moving tasks between columns
 * @param onTaskDelete - Callback for deleting individual tasks
 * @param allTasks - Array of all tasks (for dependency management)
 * @param onTaskUpdate - Callback for updating task details
 * @param onDeleteAll - Callback for bulk deleting tasks in a column
 */
export function TaskBoard({ searchQuery = "", tasks, onTaskMove, onTaskDelete, allTasks = [], onTaskUpdate, onDeleteAll }: TaskBoardProps) {
  // Filter tasks based on search query
  const filteredTasks = tasks.filter(
    (task) => {
      const query = searchQuery.toLowerCase()
      return (
        task.title.toLowerCase().includes(query) ||
        (task.description && task.description.toLowerCase().includes(query)) ||
        (task.tags && task.tags.some((tag) => tag.toLowerCase().includes(query)))
      )
    }
  )

  // Group tasks by their status
  const tasksByStatus = filteredTasks.reduce(
    (acc, task) => {
      acc[task.status].push(task)
      return acc
    },
    {
      todo: [] as Task[],
      "in-progress": [] as Task[],
      done: [] as Task[],
    }
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <TaskColumn title="To Do" status="todo" tasks={tasksByStatus.todo} onTaskMove={onTaskMove} onTaskDelete={onTaskDelete} allTasks={allTasks} onTaskUpdate={onTaskUpdate} onDeleteAll={onDeleteAll} />
      <TaskColumn
        title="In Progress"
        status="in-progress"
        tasks={tasksByStatus["in-progress"]}
        onTaskMove={onTaskMove}
        onTaskDelete={onTaskDelete}
        allTasks={allTasks}
        onTaskUpdate={onTaskUpdate}
        onDeleteAll={onDeleteAll}
      />
      <TaskColumn title="Done" status="done" tasks={tasksByStatus.done} onTaskMove={onTaskMove} onTaskDelete={onTaskDelete} allTasks={allTasks} onTaskUpdate={onTaskUpdate} onDeleteAll={onDeleteAll} />
    </div>
  )
}
