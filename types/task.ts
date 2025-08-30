export type TaskStatus = "todo" | "in-progress" | "done"

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  priority: "low" | "medium" | "high"
  dueDate?: Date
  assignee?: string
  tags: string[]
  images: string[]
  dependencies: string[]
  createdAt: Date
  updatedAt: Date
}
