import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Fetch all tasks with their dependencies and dependents
    const tasks = await prisma.task.findMany({
      include: {
        dependencies: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          }
        },
        dependents: {
          select: {
            id: true,
            title: true,
            status: true,
            dueDate: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse JSON strings back to arrays for SQLite
    const parsedTasks = tasks.map(task => ({
      ...task,
      tags: task.tags ? JSON.parse(task.tags) : [],
      images: task.images ? JSON.parse(task.images) : []
    }))

    // Calculate earliest start dates
    const earliestStartDates = calculateEarliestStartDates(parsedTasks)
    
    // Find critical path
    const criticalPath = findCriticalPath(parsedTasks)
    
    // Calculate total duration
    const totalDuration = calculateTotalDuration(parsedTasks, criticalPath)

    return NextResponse.json({
      earliestStartDates,
      criticalPath,
      totalDuration
    })
  } catch (error) {
    console.error('Error analyzing tasks:', error)
    return NextResponse.json(
      { error: 'Failed to analyze tasks' },
      { status: 500 }
    )
  }
}

// Calculate earliest start dates for all tasks
function calculateEarliestStartDates(tasks: any[]) {
  const earliestStartDates: Record<string, string> = {}
  
  // Create a map for quick lookup
  const taskMap = new Map(tasks.map(task => [task.id, task]))
  
  // Calculate earliest start date for each task
  tasks.forEach(task => {
    const earliestStart = calculateEarliestStartDate(task, taskMap, earliestStartDates)
    earliestStartDates[task.title] = earliestStart.toISOString()
  })
  
  return earliestStartDates
}

// Calculate earliest start date for a single task
function calculateEarliestStartDate(task: any, taskMap: Map<string, any>, earliestStartDates: Record<string, string>): Date {
  // If no dependencies, can start immediately
  if (!task.dependencies || task.dependencies.length === 0) {
    return new Date() // Start today
  }
  
  // Find the latest completion date among dependencies
  let latestCompletionDate = new Date(0) // Start with earliest possible date
  
  task.dependencies.forEach((dep: any) => {
    const dependency = taskMap.get(dep.id)
    if (dependency) {
      // Use the dependency's due date as completion date
      const dependencyCompletionDate = new Date(dependency.dueDate)
      
      // If dependency is completed, use completion date
      if (dependency.status === 'DONE') {
        const completionDate = dependency.completedAt ? new Date(dependency.completedAt) : dependencyCompletionDate
        if (completionDate > latestCompletionDate) {
          latestCompletionDate = completionDate
        }
      } else {
        // If dependency is not completed, use its due date
        if (dependencyCompletionDate > latestCompletionDate) {
          latestCompletionDate = dependencyCompletionDate
        }
      }
    }
  })
  
  return latestCompletionDate
}

// Find the critical path (longest chain of dependent tasks)
function findCriticalPath(tasks: any[]): string[] {
  const taskMap = new Map(tasks.map(task => [task.id, task]))
  const visited = new Set<string>()
  const pathLengths = new Map<string, number>()
  
  let maxLength = 0
  let criticalPath: string[] = []
  
  // Find the longest path starting from each task
  tasks.forEach(task => {
    if (!visited.has(task.id)) {
      const path = dfs(task.id, taskMap, visited, pathLengths)
      if (path.length > maxLength) {
        maxLength = path.length
        criticalPath = [...path]
      }
    }
  })
  
  // Convert task IDs to task titles
  return criticalPath.map(taskId => {
    const task = taskMap.get(taskId)
    return task ? task.title : taskId
  })
}

// Depth-first search to find longest path
function dfs(taskId: string, taskMap: Map<string, any>, visited: Set<string>, pathLengths: Map<string, number>): string[] {
  if (visited.has(taskId)) {
    return pathLengths.has(taskId) ? [taskId] : []
  }
  
  visited.add(taskId)
  const task = taskMap.get(taskId)
  
  if (!task || !task.dependencies || task.dependencies.length === 0) {
    pathLengths.set(taskId, 1)
    return [taskId]
  }
  
  let maxLength = 0
  let longestPath: string[] = []
  
  // Check all dependencies
  task.dependencies.forEach((dep: any) => {
    const depPath = dfs(dep.id, taskMap, visited, pathLengths)
    if (depPath.length > maxLength) {
      maxLength = depPath.length
      longestPath = [...depPath]
    }
  })
  
  const currentPath = [...longestPath, taskId]
  pathLengths.set(taskId, currentPath.length)
  
  return currentPath
}

// Calculate total duration of the critical path
function calculateTotalDuration(tasks: any[], criticalPath: string[]): number {
  if (criticalPath.length === 0) return 0
  
  const taskMap = new Map(tasks.map(task => [task.title, task]))
  let totalDays = 0
  
  // Calculate duration based on due dates
  for (let i = 0; i < criticalPath.length; i++) {
    const task = taskMap.get(criticalPath[i])
    if (task && task.dueDate) {
      const dueDate = new Date(task.dueDate)
      const now = new Date()
      const daysDiff = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // If due date is in the past, count it as 1 day (minimum)
      // If due date is in the future, use the actual difference
      totalDays += Math.max(1, daysDiff)
    }
  }
  
  return totalDays
}
