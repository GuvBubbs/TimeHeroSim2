/**
 * Types and interfaces for the Upgrade Tree visualization
 */

export interface TreeNode {
  id: string
  name: string
  swimlane: string      // Which swimlane it belongs to
  type: string          // e.g., 'weapon', 'tool', 'upgrade'
  category: string      // e.g., 'bow', 'spear', 'storage'
  
  // Dependencies
  prerequisites: string[] // IDs of prerequisite nodes
  
  // Display data
  cost: {
    gold?: number
    energy?: number
    materials?: Record<string, number>
  }
  effect: string        // Brief description
  icon?: string         // Font Awesome class
  
  // Computed layout position
  column?: number       // X position (from topological sort)
  row?: number          // Y position within swimlane
}

export interface Connection {
  from: string
  to: string
  highlighted?: boolean
}

export interface NodePosition {
  x: number
  y: number
  swimlane: string
  row: number
  column: number
}

export interface Swimlane {
  id: string
  label: string
  color: string
}

export interface GridConfig {
  columnWidth: number      // Width of each column
  rowHeight: number        // Height of each row
  columnGap: number        // Horizontal gap between nodes (for arrows)
  rowGap: number          // Vertical gap between nodes
  swimlanePadding: number  // Padding inside swimlanes
  labelWidth: number       // Width reserved for swimlane labels
  
  // Node dimensions
  nodeWidth: number
  nodeHeight: number
  
  // Arrow routing
  arrowPadding: number     // Space between arrow and node edge
  cornerRadius: number     // Radius for 90° corners
}

// Swimlanes configuration from design document
export const SWIMLANES: Swimlane[] = [
  { id: 'farm', label: 'Farm', color: '#84cc16' },           // lime
  { id: 'town-vendors', label: 'Town - Vendors', color: '#8b5cf6' },    // purple
  { id: 'town-blacksmith', label: 'Town - Blacksmith', color: '#f59e0b' }, // amber
  { id: 'town-agronomist', label: 'Town - Agronomist', color: '#10b981' }, // green
  { id: 'town-carpenter', label: 'Town - Carpenter', color: '#06b6d4' },  // cyan
  { id: 'town-land', label: 'Town - Land Steward', color: '#84cc16' },   // lime
  { id: 'town-trader', label: 'Town - Material Trader', color: '#6366f1' }, // indigo
  { id: 'town-skills', label: 'Town - Skills Trainer', color: '#ec4899' }, // pink
  { id: 'adventure', label: 'Adventure - Routes', color: '#ef4444' },     // red
  { id: 'forge', label: 'Forge', color: '#f97316' },         // orange
  { id: 'mining', label: 'Mining', color: '#78716c' },       // stone
  { id: 'tower', label: 'Tower', color: '#3b82f6' }          // blue
]

// Grid configuration from design document
export const GRID_CONFIG: GridConfig = {
  columnWidth: 220,      // Width of each column
  rowHeight: 50,         // Height of each row (reduced from 60)
  columnGap: 40,         // Horizontal gap between nodes (for arrows)
  rowGap: 10,            // Vertical gap between nodes (reduced from 20)
  swimlanePadding: 0,    // No padding - use grid alignment instead
  labelWidth: 120,       // Width reserved for swimlane labels
  
  // Node dimensions
  nodeWidth: 180,
  nodeHeight: 36,        // Node height (reduced from 40)
  
  // Arrow routing
  arrowPadding: 8,       // Space between arrow and node edge
  cornerRadius: 8,       // Radius for 90° corners
}
