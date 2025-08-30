"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"

export function TaskFilters() {
  const [filters, setFilters] = useState({
    priority: "",
    assignee: "",
    status: "",
    tags: [] as string[],
  })

  const clearFilters = () => {
    setFilters({
      priority: "",
      assignee: "",
      status: "",
      tags: [],
    })
  }

  const hasActiveFilters = filters.priority || filters.assignee || filters.status || filters.tags.length > 0

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* Priority Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Priority:</span>
          <Select
            value={filters.priority}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, priority: value }))}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-32">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="" className="text-white hover:bg-gray-700">
                Any
              </SelectItem>
              <SelectItem value="high" className="text-white hover:bg-gray-700">
                High
              </SelectItem>
              <SelectItem value="medium" className="text-white hover:bg-gray-700">
                Medium
              </SelectItem>
              <SelectItem value="low" className="text-white hover:bg-gray-700">
                Low
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Status:</span>
          <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-32">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="" className="text-white hover:bg-gray-700">
                Any
              </SelectItem>
              <SelectItem value="todo" className="text-white hover:bg-gray-700">
                To Do
              </SelectItem>
              <SelectItem value="in-progress" className="text-white hover:bg-gray-700">
                In Progress
              </SelectItem>
              <SelectItem value="done" className="text-white hover:bg-gray-700">
                Done
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Assignee Filter */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-400">Assignee:</span>
          <Select
            value={filters.assignee}
            onValueChange={(value) => setFilters((prev) => ({ ...prev, assignee: value }))}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white w-40">
              <SelectValue placeholder="Anyone" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              <SelectItem value="" className="text-white hover:bg-gray-700">
                Anyone
              </SelectItem>
              <SelectItem value="John Doe" className="text-white hover:bg-gray-700">
                John Doe
              </SelectItem>
              <SelectItem value="Jane Smith" className="text-white hover:bg-gray-700">
                Jane Smith
              </SelectItem>
              <SelectItem value="Mike Johnson" className="text-white hover:bg-gray-700">
                Mike Johnson
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearFilters}
            className="border-gray-600 text-gray-300 hover:bg-gray-800 bg-transparent"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-700">
          {filters.priority && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
              Priority: {filters.priority}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, priority: "" }))}
                className="ml-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
              Status: {filters.status}
              <button onClick={() => setFilters((prev) => ({ ...prev, status: "" }))} className="ml-1 hover:text-white">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          {filters.assignee && (
            <Badge variant="secondary" className="bg-gray-800 text-gray-300">
              Assignee: {filters.assignee}
              <button
                onClick={() => setFilters((prev) => ({ ...prev, assignee: "" }))}
                className="ml-1 hover:text-white"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}
