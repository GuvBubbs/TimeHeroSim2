// Phase 8 Focus Mode Test Script
// Tests the focus mode functionality independently

const test = {
  // Mock data to test focus mode logic
  nodes: [
    { id: 'gather_sticks', swimlane: 'farm', prerequisites: [] },
    { id: 'chop_wood', swimlane: 'farm', prerequisites: ['gather_sticks'] },
    { id: 'build_axe', swimlane: 'town', prerequisites: ['chop_wood'] },
    { id: 'upgrade_axe', swimlane: 'town', prerequisites: ['build_axe'] },
    { id: 'unrelated_item', swimlane: 'other', prerequisites: [] }
  ],
  
  // Test the family tree calculation
  calculateVisibleNodes(nodeId) {
    const visibleNodes = new Set()
    
    // Add the focused node itself
    visibleNodes.add(nodeId)
    
    // Simple prerequisite traversal
    const addPrerequisites = (id) => {
      const node = this.nodes.find(n => n.id === id)
      if (node && node.prerequisites) {
        node.prerequisites.forEach(prereqId => {
          visibleNodes.add(prereqId)
          addPrerequisites(prereqId) // Recursive
        })
      }
    }
    
    // Simple dependent traversal
    const addDependents = (id) => {
      this.nodes.forEach(node => {
        if (node.prerequisites.includes(id)) {
          visibleNodes.add(node.id)
          addDependents(node.id) // Recursive
        }
      })
    }
    
    addPrerequisites(nodeId)
    addDependents(nodeId)
    
    return visibleNodes
  },
  
  // Test visible swimlanes
  getVisibleSwimlanes(visibleNodeIds) {
    const swimlanes = ['farm', 'town', 'other']
    return swimlanes.filter(swimlane => {
      return this.nodes.some(node => 
        node.swimlane === swimlane && visibleNodeIds.has(node.id)
      )
    })
  }
}

console.log('🎯 Testing Focus Mode Logic')
console.log('============================')

// Test focusing on 'build_axe' - should show the chain: gather_sticks → chop_wood → build_axe → upgrade_axe
console.log('\n📋 Test 1: Focus on "build_axe"')
const visibleNodes = test.calculateVisibleNodes('build_axe')
console.log('Visible nodes:', Array.from(visibleNodes))
console.log('Expected: gather_sticks, chop_wood, build_axe, upgrade_axe')

const visibleSwimlanes = test.getVisibleSwimlanes(visibleNodes)
console.log('Visible swimlanes:', visibleSwimlanes)
console.log('Expected: farm, town (not other)')

// Test focusing on isolated node
console.log('\n📋 Test 2: Focus on "unrelated_item"')
const visibleNodes2 = test.calculateVisibleNodes('unrelated_item')
console.log('Visible nodes:', Array.from(visibleNodes2))
console.log('Expected: unrelated_item')

const visibleSwimlanes2 = test.getVisibleSwimlanes(visibleNodes2)
console.log('Visible swimlanes:', visibleSwimlanes2)
console.log('Expected: other')

console.log('\n✅ Focus mode logic tests completed')
console.log('🎯 Ready to test in browser at: http://localhost:5176/TimeHeroSim2/#/upgrade-tree')
console.log('')
console.log('📖 Instructions:')
console.log('1. Click any node once → highlights family tree')
console.log('2. Click same node again → enters focus mode (only family tree visible)')
console.log('3. Click empty space → exits focus mode')
console.log('4. Focused node should have purple border')
