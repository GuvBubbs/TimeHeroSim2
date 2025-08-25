#!/usr/bin/env node

/**
 * Debug script to detect overlapping nodes in the upgrade tree layout
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Read the CSV files to get all nodes
function loadCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.trim())
  
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim())
    const obj = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    return obj
  })
}

// Load connections data to understand the upgrade tree structure
function loadConnections() {
  const connectionsPath = path.join(__dirname, 'public/Data/Data/connections.csv')
  if (!fs.existsSync(connectionsPath)) {
    console.log('❌ connections.csv not found, using alternative method...')
    return []
  }
  return loadCSV(connectionsPath)
}

// Get all unique upgrade IDs from various CSV files
function getAllUpgradeIds() {
  const upgradeIds = new Set()
  
  // Check common upgrade files
  const upgradeFiles = [
    'public/Data/Data/farm_upgrades.csv',
    'public/Data/Data/forge_upgrades.csv',
    'public/Data/Data/tower_upgrades.csv',
    'public/Data/Data/general_upgrades.csv'
  ]
  
  upgradeFiles.forEach(file => {
    const filePath = path.join(__dirname, file)
    if (fs.existsSync(filePath)) {
      try {
        const data = loadCSV(filePath)
        data.forEach(row => {
          if (row.id || row.upgrade_id) {
            upgradeIds.add(row.id || row.upgrade_id)
          }
        })
        console.log(`✅ Loaded ${data.length} upgrades from ${file}`)
      } catch (error) {
        console.log(`⚠️  Could not parse ${file}:`, error.message)
      }
    }
  })
  
  return Array.from(upgradeIds)
}

// Simulate the grid layout logic to detect overlaps
function detectNodeOverlaps() {
  const upgradeIds = getAllUpgradeIds()
  console.log(`🔍 Analyzing ${upgradeIds.length} total upgrades for position overlaps...`)
  
  // Mock position data - in reality this would come from the Vue store
  // For now, let's create a simple grid simulation
  const positionMap = new Map()
  const overlaps = []
  
  // Simulate basic grid positioning (this is simplified)
  upgradeIds.forEach((id, index) => {
    // Simple grid: 20 columns, auto-row
    const col = index % 20
    const row = Math.floor(index / 20)
    const position = `${col},${row}`
    
    if (positionMap.has(position)) {
      overlaps.push({
        position: position,
        nodes: [positionMap.get(position), id],
        coordinates: { x: col, y: row }
      })
      // Add to existing overlap
      const existingOverlap = overlaps.find(o => o.position === position)
      if (existingOverlap && !existingOverlap.nodes.includes(id)) {
        existingOverlap.nodes.push(id)
      }
    } else {
      positionMap.set(position, id)
    }
  })
  
  return overlaps
}

// Main execution
console.log('🕵️  Starting Node Overlap Detection...\n')

try {
  const overlaps = detectNodeOverlaps()
  
  if (overlaps.length === 0) {
    console.log('✅ No node overlaps detected in simulated grid!')
  } else {
    console.log(`❌ Found ${overlaps.length} position overlaps:`)
    console.log()
    
    overlaps.forEach((overlap, index) => {
      console.log(`Overlap #${index + 1}:`)
      console.log(`  Position: (${overlap.coordinates.x}, ${overlap.coordinates.y})`)
      console.log(`  Nodes: ${overlap.nodes.join(', ')}`)
      console.log(`  Count: ${overlap.nodes.length} nodes`)
      console.log()
    })
  }
  
  console.log('\n📊 Summary:')
  console.log(`  Total positions checked: ${positionMap.size}`)
  console.log(`  Overlapping positions: ${overlaps.length}`)
  console.log(`  Nodes with overlaps: ${overlaps.reduce((sum, o) => sum + o.nodes.length, 0)}`)
  
} catch (error) {
  console.error('❌ Error during overlap detection:', error)
}

console.log('\n💡 Note: This is a simulation. For real overlap detection, we need to integrate with the Vue store\'s nodePositions Map.')
