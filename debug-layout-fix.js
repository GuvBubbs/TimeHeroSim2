// Debug Focus Mode Layout Issue

console.log('🔍 Debugging Focus Mode Layout')
console.log('===============================')

// Simulate the issue
const mockNodes = [
  { id: 'well_pump_1', swimlane: 'farm', column: 2, row: 0 },
  { id: 'well_pump_2', swimlane: 'farm', column: 4, row: 0 },
  { id: 'blueprint_1', swimlane: 'town', column: 1, row: 0 },
  { id: 'blueprint_2', swimlane: 'town', column: 3, row: 0 },
  { id: 'blueprint_3', swimlane: 'town', column: 5, row: 0 }
]

const visibleNodeIds = new Set(['well_pump_1', 'well_pump_2', 'blueprint_1', 'blueprint_2', 'blueprint_3'])

console.log('\n📊 Original Layout:')
mockNodes.forEach(node => {
  console.log(`${node.id}: column ${node.column}, row ${node.row}, swimlane ${node.swimlane}`)
})

// Simulate the recalculation
const visibleNodes = mockNodes.filter(node => visibleNodeIds.has(node.id))

// Group by swimlane
const swimlaneGroups = new Map()
visibleNodes.forEach(node => {
  if (!swimlaneGroups.has(node.swimlane)) {
    swimlaneGroups.set(node.swimlane, [])
  }
  swimlaneGroups.get(node.swimlane).push(node)
})

console.log('\n🎯 After Focus Mode Recalculation:')
swimlaneGroups.forEach((swimlaneNodes, swimlaneId) => {
  console.log(`\n${swimlaneId} swimlane:`)
  
  // Sort by original column to maintain dependency order
  swimlaneNodes.sort((a, b) => a.column - b.column)
  
  // Reassign columns starting from 0
  swimlaneNodes.forEach((node, index) => {
    const oldColumn = node.column
    node.column = index
    console.log(`  ${node.id}: column ${oldColumn} → ${node.column}`)
  })
})

console.log('\n✅ Layout should now be compact and visible')
console.log('🎯 Test in browser: click node, then click again for focus mode')
