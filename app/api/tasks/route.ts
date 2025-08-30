import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { fetchRelevantImage } from '@/lib/pexels'

export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Parse JSON strings back to arrays for SQLite
    const parsedTasks = tasks.map(task => ({
      ...task,
      status: convertStatusToFrontend(task.status),
      priority: convertPriorityToFrontend(task.priority),
      tags: task.tags ? JSON.parse(task.tags) : [],
      images: task.images ? JSON.parse(task.images) : []
    }))

    return NextResponse.json(parsedTasks)
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, priority, assignee, dueDate, tags, dependencies, images } = body

    // Validate required fields
    if (!title || !dueDate) {
      return NextResponse.json(
        { error: 'Title and due date are required' },
        { status: 400 }
      )
    }

    // Convert priority to uppercase enum value
    const normalizedPriority = priority ? priority.toUpperCase() as 'LOW' | 'MEDIUM' | 'HIGH' : 'MEDIUM'

    // For new task creation, we don't need to check for circular dependencies
    // since the task doesn't exist yet and can't be part of a cycle

    // Auto-fetch relevant image from Pexels if no images provided
    let taskImages = images || []
    if (taskImages.length === 0) {
      try {
        // Use title and description for better image search
        const searchQuery = description ? `${title} ${description}` : title
        const pexelsImage = await fetchRelevantImage(searchQuery)
        if (pexelsImage) {
          taskImages = [pexelsImage]
          console.log('Pexels API: Fetched image for task:', title)
        } else {
          console.log('Pexels API: No image found for task:', title)
        }
      } catch (error) {
        console.warn('Failed to fetch Pexels image for task:', title, error)
      }
    }

    // Create the task with JSON stringified arrays for SQLite
    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: normalizedPriority,
        assignee,
        dueDate: new Date(dueDate),
        tags: JSON.stringify(tags || []),
        images: JSON.stringify(taskImages),
        dependencies: dependencies && dependencies.length > 0 ? {
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
      ...task,
      status: convertStatusToFrontend(task.status),
      priority: convertPriorityToFrontend(task.priority),
      tags: JSON.parse(task.tags),
      images: JSON.parse(task.images)
    }

    console.log('API: Task created successfully:', parsedTask)
    return NextResponse.json(parsedTask, { status: 201 })
  } catch (error) {
    console.error('Error creating task:', error)
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    )
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
