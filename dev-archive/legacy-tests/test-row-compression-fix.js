// Test the row compression logic fix
console.log('Testing row compression grouping fix...')

// Simulate the Well Pump I focus mode scenario
const visibleNodes = [
  { id: 'well_pump_1', swimlane: 'farm', row: 2 },
  { id: 'well_pump_2', swimlane: 'farm', row: 2 },
  { id: 'well_pump_3', swimlane: 'farm', row: 2 },
  { id: 'steam_pump', swimlane: 'farm', row: 2 },
  { id: 'crystal_pump', swimlane: 'farm', row: 2 },
  { id: 'blueprint_well_pump_1', swimlane: 'town-agronomist', row: 1 },
  { id: 'blueprint_well_pump_2', swimlane: 'town-agronomist', row: 1 },
  { id: 'blueprint_well_pump_3', swimlane: 'town-agronomist', row: 1 },
  { id: 'blueprint_steam_pump', swimlane: 'town-agronomist', row: 1 },
  { id: 'blueprint_crystal_pump', swimlane: 'town-agronomist', row: 1 }
]

console.log('BEFORE compression:')
visibleNodes.forEach(node => {
  console.log(`${node.swimlane}: ${node.id} at row ${node.row}`)
})

// Apply the FIXED compression logic
const swimlaneGroups = new Map()
visibleNodes.forEach(node => {
  if (!swimlaneGroups.has(node.swimlane)) {
    swimlaneGroups.set(node.swimlane, [])
  }
  swimlaneGroups.get(node.swimlane).push(node)
})

swimlaneGroups.forEach((swimlaneNodes, swimlaneId) => {
  // Sort by original row
  swimlaneNodes.sort((a, b) => a.row - b.row)
  
  // Find unique row values and create mapping
  const originalRows = [...new Set(swimlaneNodes.map(node => node.row))].sort((a, b) => a - b)
  const rowMapping = new Map()
  
  originalRows.forEach((originalRow, index) => {
    rowMapping.set(originalRow, index)
  })
  
  // Apply compressed mapping
  swimlaneNodes.forEach(node => {
    const oldRow = node.row
    const newRow = rowMapping.get(oldRow) || 0
    node.row = newRow
    console.log(`FIXED: ${swimlaneId}: ${node.id} row ${oldRow} → ${newRow}`)
  })
})

console.log('\nAFTER compression (FIXED):')
visibleNodes.forEach(node => {
  console.log(`${node.swimlane}: ${node.id} at row ${node.row}`)
})

console.log('\nExpected result: All farm nodes at row 0, all town-agronomist nodes at row 0')
