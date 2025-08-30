/**
 * Dependency Graph Component
 * 
 * Visualizes task dependencies as a network graph with nodes and arrows.
 * Shows the critical path, task relationships, and dependency chains.
 * Uses SVG for rendering arrows and absolute positioning for nodes.
 * 
 * @author Mohammad Shafay Joyo
 * @copyright 2025 Mohammad Shafay Joyo
 */

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight, GitBranch, GitCommit } from "lucide-react"
import type { Task } from "@/types/task"

/**
 * Props for the DependencyGraph component
 */
interface DependencyGraphProps {
  tasks: Task[]
  criticalPath: string[]
  earliestStartDates: Record<string, Date>
}

/**
 * Represents a node in the dependency graph
 */
interface GraphNode {
  id: string
  task: Task
  x: number
  y: number
  level: number
  isCritical: boolean
}

/**
 * Represents an edge (dependency relationship) in the graph
 */
interface GraphEdge {
  from: string
  to: string
  isCritical: boolean
}

/**
 * Dependency Graph Component
 * 
 * Renders a visual representation of task dependencies using nodes and arrows.
 * Tasks are positioned by their dependency levels, and arrows show relationships.
 * The critical path is highlighted in yellow.
 * 
 * @param tasks - Array of all tasks to visualize
 * @param criticalPath - Array of task IDs that form the critical path
 * @param earliestStartDates - Record of earliest start dates for each task
 */
export function DependencyGraph({ tasks, criticalPath, earliestStartDates }: DependencyGraphProps) {
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [edges, setEdges] = useState<GraphEdge[]>([])

  // Rebuild graph when tasks or critical path changes
  useEffect(() => {
    const { graphNodes, graphEdges } = buildDependencyGraph(tasks, criticalPath)
    console.log('DependencyGraph: Building graph with:', {
      tasks: tasks.map(t => ({ id: t.id, title: t.title, dependencies: t.dependencies })),
      criticalPath,
      graphNodes: graphNodes.map(n => ({ id: n.id, title: n.task.title, x: n.x, y: n.y })),
      graphEdges: graphEdges.map(e => ({ from: e.from, to: e.to, isCritical: e.isCritical }))
    })
    setNodes(graphNodes)
    setEdges(graphEdges)
  }, [tasks, criticalPath])

  /**
   * Builds the dependency graph by calculating node positions and edges
   * Uses topological sorting to determine dependency levels
   * 
   * @param tasks - Array of tasks to process
   * @param criticalPath - Array of task IDs in the critical path
   * @returns Object containing graph nodes and edges
   */
  const buildDependencyGraph = (tasks: Task[], criticalPath: string[]) => {
    const graphNodes: GraphNode[] = []
    const graphEdges: GraphEdge[] = []
    const taskMap = new Map(tasks.map(task => [task.id, task]))
    const levels = new Map<string, number>()
    const visited = new Set<string>()

    /**
     * Calculates the dependency level for a task using topological sort
     * Tasks with no dependencies are level 0, dependent tasks are level 1+, etc.
     * 
     * @param taskId - The ID of the task to calculate level for
     * @returns The dependency level (0 for no dependencies, 1+ for dependent tasks)
     */
    const calculateLevel = (taskId: string): number => {
      if (levels.has(taskId)) {
        return levels.get(taskId)!
      }

      if (visited.has(taskId)) {
        return 0 // Prevent infinite recursion
      }

      visited.add(taskId)
      const task = taskMap.get(taskId)
      if (!task || !task.dependencies || task.dependencies.length === 0) {
        levels.set(taskId, 0)
        return 0
      }

      let maxLevel = 0
      task.dependencies.forEach((dep: any) => {
        const depLevel = calculateLevel(dep.id)
        maxLevel = Math.max(maxLevel, depLevel + 1)
      })

      levels.set(taskId, maxLevel)
      return maxLevel
    }

    // Calculate levels for all tasks
    tasks.forEach(task => {
      calculateLevel(task.id)
    })

    // Group tasks by level for better positioning
    const tasksByLevel = new Map<number, Task[]>()
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0
      if (!tasksByLevel.has(level)) {
        tasksByLevel.set(level, [])
      }
      tasksByLevel.get(level)!.push(task)
    })

    // Create nodes with better spacing
    tasks.forEach(task => {
      const level = levels.get(task.id) || 0
      const isCritical = criticalPath.includes(task.id)
      
      // Calculate position within the level
      const tasksInLevel = tasksByLevel.get(level) || []
      const taskIndex = tasksInLevel.findIndex(t => t.id === task.id)
      
      graphNodes.push({
        id: task.id,
        task,
        x: level * 250 + 100, // More horizontal spacing between levels
        y: taskIndex * 150 + 100, // More vertical spacing between tasks
        level,
        isCritical
      })
    })

    // Create edges (dependency relationships)
    tasks.forEach(task => {
      if (task.dependencies) {
        task.dependencies.forEach((dep: any) => {
          // Check if this edge is part of the critical path
          // An edge is critical if both the source and target are in the critical path
          // AND they are consecutive in the critical path
          const depIndex = criticalPath.indexOf(dep.id)
          const taskIndex = criticalPath.indexOf(task.id)
          const isCritical = depIndex !== -1 && taskIndex !== -1 && taskIndex === depIndex + 1
          
          graphEdges.push({
            from: dep.id,
            to: task.id,
            isCritical
          })
        })
      }
    })

    return { graphNodes, graphEdges }
  }

  /**
   * Returns the appropriate color class for task status indicators
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case "done":
        return "bg-green-600"
      case "in-progress":
        return "bg-blue-600"
      case "todo":
        return "bg-gray-600"
      default:
        return "bg-gray-600"
    }
  }

  /**
   * Returns the appropriate color class for priority badges
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-600"
      case "medium":
        return "bg-yellow-600"
      case "low":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  return (
    <Card className="bg-gray-900 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center">
          <GitBranch className="h-5 w-5 mr-2" />
          Dependency Graph
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full h-[400px] overflow-auto bg-gray-950 rounded-lg border border-gray-700 p-4">
          {/* Critical Path Legend */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center space-x-2 text-xs bg-gray-900 px-2 py-1 rounded">
              <div className="w-3 h-0.5 bg-yellow-400"></div>
              <span className="text-yellow-400">Critical Path</span>
            </div>
          </div>

          {/* Nodes */}
          {nodes.map((node) => (
            <div
              key={node.id}
              className={`absolute p-3 rounded-lg border-2 min-w-[180px] max-w-[200px] ${
                node.isCritical
                  ? 'bg-yellow-900/20 border-yellow-400 text-yellow-100'
                  : 'bg-gray-800 border-gray-600 text-white'
              }`}
              style={{
                left: `${node.x}px`,
                top: `${node.y}px`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-sm truncate">{node.task.title}</h4>
                <div className={`w-2 h-2 rounded-full ${getStatusColor(node.task.status)}`}></div>
              </div>
              
              <div className="flex items-center justify-between text-xs">
                <Badge className={`${getPriorityColor(node.task.priority)} text-white`}>
                  {node.task.priority}
                </Badge>
                <span className="text-gray-400">
                  Level {node.level}
                </span>
              </div>

              {earliestStartDates[node.id] && (
                <div className="text-xs text-gray-400 mt-1">
                  Start: {earliestStartDates[node.id].toLocaleDateString()}
                </div>
              )}
            </div>
          ))}

          {/* Edges */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            {edges.map((edge, index) => {
              const fromNode = nodes.find(n => n.id === edge.from)
              const toNode = nodes.find(n => n.id === edge.to)
              
              if (!fromNode || !toNode) return null

              return (
                <g key={index}>
                  <defs>
                    <marker
                      id={`arrowhead-${index}`}
                      markerWidth="10"
                      markerHeight="7"
                      refX="9"
                      refY="3.5"
                      orient="auto"
                    >
                      <polygon
                        points="0 0, 10 3.5, 0 7"
                        fill={edge.isCritical ? "#fbbf24" : "#6b7280"}
                      />
                    </marker>
                  </defs>
                  <line
                    x1={fromNode.x + 100}
                    y1={fromNode.y}
                    x2={toNode.x - 100}
                    y2={toNode.y}
                    stroke={edge.isCritical ? "#fbbf24" : "#6b7280"}
                    strokeWidth={edge.isCritical ? "3" : "2"}
                    markerEnd={`url(#arrowhead-${index})`}
                  />
                </g>
              )
            })}
          </svg>
        </div>

        {/* Graph Info */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400">Total Tasks</div>
            <div className="text-white font-semibold">{tasks.length}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400">Critical Path Length</div>
            <div className="text-yellow-400 font-semibold">{criticalPath.length}</div>
          </div>
          <div className="bg-gray-800 p-3 rounded-lg">
            <div className="text-gray-400">Dependencies</div>
            <div className="text-white font-semibold">
              {edges.length}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
