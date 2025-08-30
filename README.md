# TaskFlow - Task Management Application

A modern, feature-rich task management application built with Next.js, React, and TypeScript. This project demonstrates advanced task management capabilities including due dates, automatic image generation, and complex dependency management.

## 🚀 Features

- **Kanban-style Task Board**: Organize tasks in To Do, In Progress, and Done columns
- **Due Date Management**: Set and track due dates with visual indicators
- **Automatic Image Generation**: Relevant images fetched from Pexels API
- **Task Dependencies**: Complex dependency management with circular prevention
- **Dependency Visualization**: Visual graph showing task relationships
- **Critical Path Analysis**: Identify the longest dependency chain
- **Bulk Operations**: Delete all tasks in a column with one click
- **Search Functionality**: Find tasks by title, description, or tags
- **Responsive Design**: Works seamlessly on desktop and mobile

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: SQLite with Prisma ORM
- **Image API**: Pexels API for automatic image generation
- **State Management**: Custom React hooks
- **Deployment**: Ready for Vercel deployment

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone 'https://github.com/joyo11/TaskFlow'
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   create .env
   'PEXELS_API_KEY="your_pexels_api_key_here" '
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```
   
   **Clear sample data to start fresh**
   ```bash
   npm run clear
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🗑️ Clearing Default Data

The project comes with sample data for demonstration. To start with a clean slate:

```bash
npm run clear
```

This will remove all sample tasks and dependencies, leaving you with an empty task board.

## 🗄️ Database Schema

The application uses SQLite with the following schema:

```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority @default(MEDIUM)
  dueDate     DateTime
  assignee    String?
  tags        String   // JSON string for SQLite compatibility
  images      String   // JSON string for SQLite compatibility
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Self-referencing many-to-many relationships for dependencies
  dependencies Task[] @relation("TaskDependencies")
  dependents   Task[] @relation("TaskDependencies")
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}
```

## 🔌 API Endpoints

### Tasks
- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/[id]` - Fetch a specific task
- `PUT /api/tasks/[id]` - Update a task
- `DELETE /api/tasks/[id]` - Delete a task

### Dependencies
- `POST /api/tasks/[id]/dependencies` - Add/update task dependencies
- `DELETE /api/tasks/[id]/dependencies` - Remove task dependencies

### Analysis
- `GET /api/tasks/analysis` - Get critical path and earliest start dates

## 🖼️ Pexels Integration

The application automatically fetches relevant images from the Pexels API based on task descriptions:

- **Smart Keyword Extraction**: Extracts meaningful keywords from task descriptions
- **Automatic Fallback**: Shows placeholder when no relevant image is found
- **Loading States**: Smooth loading experience with spinners
- **Error Handling**: Graceful degradation when API is unavailable

## 🎯 Usage Guide

### Creating Tasks
1. Click "New Task" button
2. Fill in title, description, priority, and due date
3. Add tags and assignee (optional)
4. Click "Create Task"
5. Image will be automatically fetched from Pexels

### Managing Dependencies
1. Open a task's detail view
2. Go to the "Dependencies" section
3. Select tasks to add as dependencies
4. Click "Save Dependencies"
5. View the dependency graph to see relationships

### Using the Dependency Graph
1. Click "Dependency Graph" button in the header
2. View visual representation of task relationships
3. Yellow highlighting shows the critical path
4. Arrows indicate dependency direction

### Bulk Operations
1. Use "Delete All" button in column headers
2. Confirm deletion in the dialog
3. All tasks in that column will be removed



---

## 🎯 Solution

I have successfully implemented all three required features for the Soma Capital technical assessment.

### ✅ Part 1: Due Dates
- **Due date selection**: Added mandatory due date field when creating tasks
- **Visual indicators**: Overdue tasks show in red, "Due Today" in yellow, "Due Soon" in orange, future dates in normal color
- **Real-time updates**: Editing an overdue task to a future date automatically removes the red highlight
- **Direct editing**: Due dates can be edited directly in the task detail view

[🎥 Watch Demo](demos/task1.mov)

### ✅ Part 2: Image Generation
- **Pexels API integration**: Automatically fetches relevant images based on task descriptions
- **Smart keyword extraction**: Extracts meaningful keywords for better image matching
- **Loading states**: Shows spinners while images are being fetched
- **Fallback handling**: Graceful fallback when no relevant image is found or for nonsense queries
- **Image persistence**: Images are preserved across task updates

[🎥 Watch Demo](demos/task2.mov)

### ✅ Part 3: Task Dependencies
- **Multiple dependencies**: Tasks can depend on multiple other tasks
- **Circular prevention**: Automatic detection and blocking of circular dependencies
- **Critical path**: Identifies and highlights the longest chain of dependent tasks
- **Earliest start dates**: Calculates when each task can start based on dependencies
- **Dependency enforcement**: Tasks cannot be completed until all dependencies are finished
- **Visual graph**: Interactive dependency visualization with nodes and arrows

#### Demo Videos:
- [🎥 Simple and Multiple Dependencies](demos/Task3_single_multiple_dependencies.mov)
- [🎥 Independent Dependency Chains](demos/Task3_Indpenednt_dependency.mov)
- [🎥 Dependency Enforcement](demos/Task3_Enforcement.mov)
- [🎥 Circular Dependency Prevention](demos/Task3_Circular_dependencies.mov)

### 🧪 Testing Results
All features have been thoroughly tested and validated:
- ✅ Due date color coding works correctly for all scenarios
- ✅ Image generation handles various task descriptions and edge cases
- ✅ Dependency system prevents circular dependencies and enforces completion order
- ✅ Critical path calculation identifies the longest dependency chain
- ✅ Visual graph accurately represents task relationships

### 🛠️ Technical Implementation
- **Frontend**: React 18 with TypeScript, custom hooks for state management
- **Backend**: Next.js API routes with Prisma ORM and SQLite database
- **Algorithms**: DFS for circular dependency detection, topological sorting for critical path
- **UI/UX**: Modern dark theme with responsive design and smooth interactions

**Author:** Mohammad Shafay Joyo  
**Copyright:** © 2025 Mohammad Shafay Joyo  
**Repository:** [https://github.com/joyo11/TaskFlow](https://github.com/joyo11/TaskFlow)  
