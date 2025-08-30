import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Setting up SQLite database...')

  // Clear existing tasks
  await prisma.task.deleteMany()

  // Get current date for testing due dates
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  
  const tomorrow = new Date(today)
  tomorrow.setDate(today.getDate() + 1)
  
  const nextWeek = new Date(today)
  nextWeek.setDate(today.getDate() + 7)

  // Create sample tasks with different due dates for testing
  const task1 = await prisma.task.create({
    data: {
      title: 'Submit homework (Overdue)',
      description: 'Math assignment that was due yesterday',
      status: 'TODO',
      priority: 'HIGH',
      dueDate: yesterday, // Past due date - should show red
      assignee: 'John Doe',
      tags: JSON.stringify(['homework', 'math']),
      images: JSON.stringify([]),
    },
  })

  const task2 = await prisma.task.create({
    data: {
      title: 'Team meeting (Due Today)',
      description: 'Weekly team standup meeting',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: today, // Due today - should show yellow
      assignee: 'Jane Smith',
      tags: JSON.stringify(['meeting', 'team']),
      images: JSON.stringify([]),
    },
  })

  const task3 = await prisma.task.create({
    data: {
      title: 'Code review (Due Soon)',
      description: 'Review pull request for new feature',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: tomorrow, // Due soon - should show orange
      assignee: 'Mike Johnson',
      tags: JSON.stringify(['code-review', 'frontend']),
      images: JSON.stringify([]),
      dependencies: {
        connect: [{ id: task1.id }]
      }
    },
  })

  const task4 = await prisma.task.create({
    data: {
      title: 'Project presentation (Future)',
      description: 'Present final project to stakeholders',
      status: 'TODO',
      priority: 'LOW',
      dueDate: nextWeek, // Future date - should show normal
      assignee: 'Sarah Wilson',
      tags: JSON.stringify(['presentation', 'project']),
      images: JSON.stringify([]),
    },
  })

  const task5 = await prisma.task.create({
    data: {
      title: 'Bug fix (Completed)',
      description: 'Fixed critical authentication bug',
      status: 'DONE',
      priority: 'HIGH',
      dueDate: yesterday, // Past due but completed - should show normal
      assignee: 'Alex Brown',
      tags: JSON.stringify(['bug-fix', 'backend']),
      images: JSON.stringify([]),
    },
  })

  console.log('Sample tasks created with different due dates:')
  console.log('- Task 1: Submit homework (Overdue - should be red)')
  console.log('- Task 2: Team meeting (Due Today - should be yellow)')
  console.log('- Task 3: Code review (Due Soon - should be orange)')
  console.log('- Task 4: Project presentation (Future - should be normal)')
  console.log('- Task 5: Bug fix (Completed - should be normal)')
  console.log('SQLite database setup complete!')
}

main()
  .catch((e) => {
    console.error('Error setting up database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
