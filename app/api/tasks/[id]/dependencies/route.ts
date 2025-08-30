import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { dependencies } = await request.json()
    const taskId = params.id

    if (!dependencies || !Array.isArray(dependencies)) {
      return NextResponse.json(
        { error: 'Dependencies must be an array' },
        { status: 400 }
      )
    }

    // Check if the task exists
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        dependencies: true,
        dependents: true
      }
    })

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      )
    }

    // Check for circular dependencies
    const hasCircularDependency = await checkCircularDependencies(taskId, dependencies)
    if (hasCircularDependency) {
      return NextResponse.json(
        { error: 'Circular dependencies detected' },
        { status: 400 }
      )
    }

    // Update task dependencies
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        dependencies: {
          connect: dependencies.map((depId: string) => ({ id: depId }))
        }
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
      tags: JSON.parse(updatedTask.tags),
      images: JSON.parse(updatedTask.images)
    }

    return NextResponse.json(parsedTask)
  } catch (error) {
    console.error('Error updating task dependencies:', error)
    return NextResponse.json(
      { error: 'Failed to update task dependencies' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { dependencies } = await request.json()
    const taskId = params.id

    if (!dependencies || !Array.isArray(dependencies)) {
      return NextResponse.json(
        { error: 'Dependencies must be an array' },
        { status: 400 }
      )
    }

    // Remove task dependencies
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: {
        dependencies: {
          disconnect: dependencies.map((depId: string) => ({ id: depId }))
        }
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
      tags: JSON.parse(updatedTask.tags),
      images: JSON.parse(updatedTask.images)
    }

    return NextResponse.json(parsedTask)
  } catch (error) {
    console.error('Error removing task dependencies:', error)
    return NextResponse.json(
      { error: 'Failed to remove task dependencies' },
      { status: 500 }
    )
  }
}

async function checkCircularDependencies(taskId: string, newDependencies: string[]): Promise<boolean> {
  const visited = new Set<string>()
  const recursionStack = new Set<string>()

  // Check if adding these dependencies would create a cycle
  // We need to simulate adding the new dependencies and then check for cycles
  for (const depId of newDependencies) {
    if (await hasCircularDependency(depId, visited, recursionStack, taskId)) {
      return true
    }
  }

  return false
}

async function hasCircularDependency(
  taskId: string,
  visited: Set<string>,
  recursionStack: Set<string>,
  originalTaskId: string
): Promise<boolean> {
  if (recursionStack.has(taskId)) {
    return true // Circular dependency detected
  }

  if (visited.has(taskId)) {
    return false // Already visited, no cycle
  }

  visited.add(taskId)
  recursionStack.add(taskId)

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    include: { dependencies: true }
  })

  if (!task) {
    recursionStack.delete(taskId)
    return false
  }

  // Check if this task depends on the original task (which would create a cycle)
  for (const dep of task.dependencies) {
    if (dep.id === originalTaskId) {
      recursionStack.delete(taskId)
      return true // This would create a cycle: originalTaskId -> taskId -> originalTaskId
    }
    
    if (await hasCircularDependency(dep.id, visited, recursionStack, originalTaskId)) {
      return true
    }
  }

  recursionStack.delete(taskId)
  return false
}
