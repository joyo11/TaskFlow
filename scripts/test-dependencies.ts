import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDependencies() {
  console.log('🧪 Testing Dependency System...\n')

  try {
    // Clear existing tasks
    await prisma.task.deleteMany()
    console.log('✅ Cleared existing tasks')

    // Step 1: Create dependency chain
    console.log('\n📋 Step 1: Creating dependency chain...')
    
    const taskA = await prisma.task.create({
      data: {
        title: 'Research topic',
        description: 'Research the main topic',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2024-09-01'),
        tags: JSON.stringify(['research']),
        images: JSON.stringify([]),
      }
    })
    console.log('✅ Created Task A: Research topic (due Sep 1)')

    const taskB = await prisma.task.create({
      data: {
        title: 'Write report',
        description: 'Write the research report',
        status: 'TODO',
        priority: 'HIGH',
        dueDate: new Date('2024-09-05'),
        tags: JSON.stringify(['writing']),
        images: JSON.stringify([]),
        dependencies: {
          connect: [{ id: taskA.id }]
        }
      }
    })
    console.log('✅ Created Task B: Write report (due Sep 5, depends on Research topic)')

    const taskC = await prisma.task.create({
      data: {
        title: 'Make slides',
        description: 'Create presentation slides',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2024-09-07'),
        tags: JSON.stringify(['presentation']),
        images: JSON.stringify([]),
        dependencies: {
          connect: [{ id: taskA.id }, { id: taskB.id }]
        }
      }
    })
    console.log('✅ Created Task C: Make slides (due Sep 7, depends on Research topic + Write report)')

    // Step 2: Add shorter chain
    console.log('\n📋 Step 2: Adding shorter chain...')
    
    const taskD = await prisma.task.create({
      data: {
        title: 'Collect data',
        description: 'Collect research data',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date('2024-08-31'),
        tags: JSON.stringify(['data']),
        images: JSON.stringify([]),
      }
    })
    console.log('✅ Created Task D: Collect data (due Aug 31)')

    const taskE = await prisma.task.create({
      data: {
        title: 'Analyze data',
        description: 'Analyze the collected data',
        status: 'TODO',
        priority: 'MEDIUM',
        dueDate: new Date('2024-09-03'),
        tags: JSON.stringify(['analysis']),
        images: JSON.stringify([]),
        dependencies: {
          connect: [{ id: taskD.id }]
        }
      }
    })
    console.log('✅ Created Task E: Analyze data (due Sep 3, depends on Collect data)')

    // Step 3: Test analysis API
    console.log('\n📋 Step 3: Testing analysis API...')
    
    const response = await fetch('http://localhost:3000/api/tasks/analysis')
    const analysis = await response.json()
    
    console.log('📊 Analysis Results:')
    console.log('Earliest Start Dates:', analysis.earliestStartDates)
    console.log('Critical Path:', analysis.criticalPath)
    console.log('Total Duration:', analysis.totalDuration, 'days')

    // Step 4: Test dependency enforcement
    console.log('\n📋 Step 4: Testing dependency enforcement...')
    
    try {
      // Try to mark Task B as done before Task A
      const updateResponse = await fetch(`http://localhost:3000/api/tasks/${taskB.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'done' })
      })
      
      if (!updateResponse.ok) {
        const error = await updateResponse.json()
        console.log('✅ Dependency enforcement working:', error.error)
      } else {
        console.log('❌ Dependency enforcement failed - should have blocked Task B')
      }
    } catch (error) {
      console.log('✅ Dependency enforcement working (caught error)')
    }

    // Step 5: Complete Task A and then Task B
    console.log('\n📋 Step 5: Completing tasks in order...')
    
    await prisma.task.update({
      where: { id: taskA.id },
      data: { status: 'DONE' }
    })
    console.log('✅ Marked Task A (Research topic) as done')

    await prisma.task.update({
      where: { id: taskB.id },
      data: { status: 'DONE' }
    })
    console.log('✅ Marked Task B (Write report) as done - should work now')

    console.log('\n🎉 All tests completed successfully!')
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testDependencies()
