import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Clearing all data from the database...')

  try {
    // Clear all tasks (this will also clear dependencies due to cascade)
    const deletedTasks = await prisma.task.deleteMany()
    
    console.log(`Successfully deleted ${deletedTasks.count} tasks from the database.`)
    console.log('Database is now empty and ready for fresh data.')
  } catch (error) {
    console.error('Error clearing database:', error)
    process.exit(1)
  }
}

main()
  .catch((e) => {
    console.error('Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
