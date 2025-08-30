"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TaskCard } from "./task-card"
import { Inbox, Clock, CheckCircle, Trash2 } from "lucide-react"
import type { Task, TaskStatus } from "@/types/task"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"

interface TaskColumnProps {
  title: string
  status: TaskStatus
  tasks: Task[]
  onTaskMove: (taskId: string, newStatus: TaskStatus) => void
  onTaskDelete: (taskId: string) => void
  allTasks?: Task[]
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => Promise<void>
  onDeleteAll?: (taskIds: string[]) => void
}

export function TaskColumn({ title, status, tasks, onTaskMove, onTaskDelete, allTasks = [], onTaskUpdate, onDeleteAll }: TaskColumnProps) {
  const getColumnColor = () => {
    switch (status) {
      case "todo":
        return "border-gray-600"
      case "in-progress":
        return "border-blue-600"
      case "done":
        return "border-green-600"
      default:
        return "border-gray-600"
    }
  }

  const getEmptyStateIcon = () => {
    switch (status) {
      case "todo":
        return <Inbox className="h-8 w-8 text-gray-500" />
      case "in-progress":
        return <Clock className="h-8 w-8 text-gray-500" />
      case "done":
        return <CheckCircle className="h-8 w-8 text-gray-500" />
      default:
        return <Inbox className="h-8 w-8 text-gray-500" />
    }
  }

  const getEmptyStateMessage = () => {
    switch (status) {
      case "todo":
        return "No tasks here yet"
      case "in-progress":
        return "No tasks in progress"
      case "done":
        return "No completed tasks"
      default:
        return "No tasks here yet"
    }
  }

  return (
    <div className={`bg-gray-950 rounded-lg border-2 ${getColumnColor()} p-4`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-white">{title}</h3>
        <div className="flex items-center space-x-2">
          <span className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">{tasks.length}</span>
          {tasks.length > 0 && onDeleteAll && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 h-6 w-6"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-gray-900 border-gray-700 text-white">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-white">Delete All Tasks</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-300">
                    Are you sure you want to delete all {tasks.length} task{tasks.length === 1 ? '' : 's'} in "{title}"? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-gray-600 text-gray-300 hover:bg-gray-800">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteAll(tasks.map(task => task.id))}
                    className="bg-red-600 text-white hover:bg-red-700"
                  >
                    Delete All
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} onStatusChange={onTaskMove} onDelete={onTaskDelete} allTasks={allTasks} onTaskUpdate={onTaskUpdate} />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            {getEmptyStateIcon()}
            <p className="text-gray-500 text-sm mt-2">{getEmptyStateMessage()}</p>
            <p className="text-gray-600 text-xs mt-1">
              {status === "todo" && "Create a new task to get started"}
              {status === "in-progress" && "Move tasks here when you start working"}
              {status === "done" && "Completed tasks will appear here"}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
