"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { ImageIcon, Link2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import type { Task, TaskStatus } from "@/types/task"

interface CreateTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskCreate: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => void
}

export function CreateTaskDialog({ open, onOpenChange, onTaskCreate }: CreateTaskDialogProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assignee: "",
    dueDate: "",
    tags: [] as string[],
    dependencies: [] as string[],
    images: [] as string[],
  })
  const [newTag, setNewTag] = useState("")
  const [availableTasks, setAvailableTasks] = useState<Task[]>([])
  const [loadingTasks, setLoadingTasks] = useState(false)

  // Fetch available tasks for dependencies
  useEffect(() => {
    if (open) {
      setLoadingTasks(true)
      fetch('/api/tasks')
        .then(res => res.json())
        .then(data => {
          setAvailableTasks(data)
          setLoadingTasks(false)
        })
        .catch(error => {
          console.error('Error fetching tasks:', error)
          setLoadingTasks(false)
        })
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create the new task
    const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
      title: formData.title,
      description: formData.description || undefined,
      status: "todo" as TaskStatus,
      priority: formData.priority,
      dueDate: formData.dueDate ? (() => {
        // Fix timezone issue by creating date in local timezone
        const [year, month, day] = formData.dueDate.split('-').map(Number)
        return new Date(year, month - 1, day) // month is 0-indexed
      })() : undefined,
      assignee: formData.assignee || undefined,
      tags: formData.tags,
      images: formData.images,
      dependencies: formData.dependencies,
    }
    
    // Call the callback to add the task
    onTaskCreate(newTask)
    
    // Close dialog and reset form
    onOpenChange(false)
    setFormData({
      title: "",
      description: "",
      priority: "medium",
      assignee: "",
      dueDate: "",
      tags: [],
      dependencies: [],
      images: [],
    })
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      // Here you'll implement actual image upload logic
      console.log("Uploading images:", files)
      // For now, just add placeholder image paths
      const imagePaths = Array.from(files).map(file => `/uploads/${file.name}`)
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...imagePaths]
      }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Task</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-gray-300">
              Title *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="Enter task title..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the task..."
              className="bg-gray-800 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
            />
          </div>

          {/* Priority and Assignee */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-300">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value as "low" | "medium" | "high" }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="low" className="text-white hover:bg-gray-700">
                    Low
                  </SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-gray-700">
                    Medium
                  </SelectItem>
                  <SelectItem value="high" className="text-white hover:bg-gray-700">
                    High
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee" className="text-gray-300">
                Assignee
              </Label>
              <Input
                id="assignee"
                value={formData.assignee}
                onChange={(e) => setFormData((prev) => ({ ...prev, assignee: e.target.value }))}
                placeholder="Assign to..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="dueDate" className="text-gray-300">
              Due Date *
            </Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData((prev) => ({ ...prev, dueDate: e.target.value }))}
              className="bg-gray-800 border-gray-600 text-white"
              required
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label className="text-gray-300">Tags</Label>
            <div className="flex space-x-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add a tag..."
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-400"
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button
                type="button"
                onClick={addTag}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
              >
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="bg-gray-800 text-gray-300">
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-white">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="images" className="text-gray-300">
              Images
            </Label>
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
              <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm mb-2">Drag and drop images here, or click to select</p>
              <Input
                id="images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="bg-gray-800 border-gray-600 text-white file:bg-gray-700 file:text-white file:border-0"
              />
            </div>
          </div>

          {/* Dependencies */}
          <div className="space-y-2">
            <Label className="text-gray-300">Dependencies</Label>
            <Select
              onValueChange={(value) => {
                if (!formData.dependencies.includes(value)) {
                  setFormData((prev) => ({ ...prev, dependencies: [...prev.dependencies, value] }))
                }
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Select dependent tasks..." />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {loadingTasks ? (
                  <SelectItem value="loading" disabled>Loading tasks...</SelectItem>
                ) : availableTasks.length === 0 ? (
                  <SelectItem value="no-tasks" disabled>No tasks found.</SelectItem>
                ) : (
                  availableTasks.map((task: Task) => (
                    <SelectItem key={task.id} value={task.id} className="text-white hover:bg-gray-700">
                      {task.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            {formData.dependencies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.dependencies.map((depId) => {
                  const depTask = availableTasks.find(task => task.id === depId)
                  return (
                    <Badge key={depId} variant="secondary" className="bg-gray-800 text-gray-300">
                      <Link2 className="h-3 w-3 mr-1" />
                      {depTask ? depTask.title : `Task ${depId}`}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({ ...prev, dependencies: prev.dependencies.filter((d) => d !== depId) }))
                        }
                        className="ml-1 hover:text-white"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-gray-600 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-white text-black hover:bg-gray-200">
              Create Task
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
