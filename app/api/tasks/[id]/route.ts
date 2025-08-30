import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Parse JSON strings back to arrays for SQLite
    const parsedTask = {
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      images: task.images ? JSON.parse(task.images) : []
    }

    return NextResponse.json(parsedTask)
  } catch (error) {
    console.error('Error fetching task:', error)
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { title, description, status, priority, assignee, dueDate, tags, dependencies, images } = body

    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id },
      include: {
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Convert status to proper enum format
    const normalizedStatus = status ? convertStatusToEnum(status) : undefined

    // Check dependency enforcement when marking task as done
    if (normalizedStatus === 'DONE') {
      const incompleteDependencies = existingTask.dependencies.filter(dep => dep.status !== 'DONE')
      if (incompleteDependencies.length > 0) {
        return NextResponse.json(
          { 
            error: 'Cannot complete this task until all dependencies are finished',
            incompleteDependencies: incompleteDependencies.map(dep => ({ id: dep.id, title: dep.title }))
          },
          { status: 400 }
        )
      }
    }

    // Convert priority to uppercase enum value if provided
    const normalizedPriority = priority ? priority.toUpperCase() : undefined

    // Check for circular dependencies if dependencies are being updated
    if (dependencies && dependencies.length > 0) {
      const hasCircularDependency = await checkCircularDependencies(params.id, dependencies)
      if (hasCircularDependency) {
        return NextResponse.json(
          { error: 'Circular dependencies detected' },
          { status: 400 }
        )
      }
    }

    // Update the task with JSON stringified arrays for SQLite
    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        status: normalizedStatus,
        priority: normalizedPriority,
        assignee,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        tags: JSON.stringify(tags || []),
        images: images ? JSON.stringify(images) : undefined, // Only update if images are provided
        dependencies: dependencies ? {
          set: [], // Clear existing dependencies
          connect: dependencies.map((id: string) => ({ id }))
        } : undefined
      },
      include: {
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
          }
        }
      }
    })

    // Parse JSON strings back to arrays for response
    const parsedTask = {
      ...updatedTask,
      status: convertStatusToFrontend(updatedTask.status),
      priority: convertPriorityToFrontend(updatedTask.priority),
      tags: JSON.parse(updatedTask.tags),
      images: JSON.parse(updatedTask.images)
    }

    return NextResponse.json(parsedTask)
  } catch (error) {
    console.error('Error updating task:', error)
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if task exists
    const existingTask = await prisma.task.findUnique({
      where: { id: params.id }
    })

    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Delete the task
    await prisma.task.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ message: 'Task deleted successfully' })
  } catch (error) {
    console.error('Error deleting task:', error)
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    )
  }
}

async function checkCircularDependencies(taskId: string, dependencyIds: string[]): Promise<boolean> {
  // This is a simplified check - in production you'd want a more robust algorithm
  for (const depId of dependencyIds) {
    const visited = new Set<string>()
    if (await hasCircularDependency(depId, visited, [taskId, ...dependencyIds])) {
      return true
    }
  }
  return false
}

async function hasCircularDependency(
  taskId: string, 
  visited: Set<string>, 
  targetIds: string[]
): Promise<boolean> {
  if (visited.has(taskId)) return false
  if (targetIds.includes(taskId)) return true
  
  visited.add(taskId)
  
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { dependencies: true }
  })
  
  if (!task) return false
  
  for (const dep of task.dependencies) {
    if (await hasCircularDependency(dep.id, visited, targetIds)) {
      return true
    }
  }
  
  return false
}

// Helper function to convert frontend status values to enum values
function convertStatusToEnum(status: string): string {
  switch (status.toLowerCase()) {
    case 'todo':
      return 'TODO'
    case 'in-progress':
      return 'IN_PROGRESS'
    case 'done':
      return 'DONE'
    default:
      return 'TODO'
  }
}

// Helper function to convert backend status to frontend format
function convertStatusToFrontend(status: string): string {
  switch (status) {
    case 'TODO':
      return 'todo'
    case 'IN_PROGRESS':
      return 'in-progress'
    case 'DONE':
      return 'done'
    default:
      return 'todo'
  }
}

// Helper function to convert backend priority to frontend format
function convertPriorityToFrontend(priority: string): string {
  switch (priority) {
    case 'LOW':
      return 'low'
    case 'MEDIUM':
      return 'medium'
    case 'HIGH':
      return 'high'
    default:
      return 'medium'
  }
}
