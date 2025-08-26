// Test to debug the highlight mode issue
// This will simulate the problem and help identify the root cause

console.log('🔍 Testing highlight mode issue...')

// Simulate what happens when highlight mode is triggered
const testNodes = [
  { id: 'test1', name: 'Test Node 1', swimlane: 'farm' },
  { id: 'test2', name: 'Test Node 2', swimlane: 'farm' },
  { id: 'test3', name: 'Test Node 3', swimlane: 'other' }
]

console.log('Original nodes:', testNodes)

// Simulate the updateNodeHighlightInfo function
const nodeHighlightInfo = new Map()

// Set all nodes to dimmed first (like the store does)
testNodes.forEach(node => {
  nodeHighlightInfo.set(node.id, { state: 'dimmed' })
})

console.log('After setting all to dimmed:', nodeHighlightInfo)

// Set selected node to highlighted
nodeHighlightInfo.set('test1', { state: 'selected' })

console.log('After highlighting test1:', nodeHighlightInfo)

// Check if nodes are still intact
console.log('Nodes after highlight operations:', testNodes)

// The issue is likely that the nodes array itself is being modified
// or there's a reactivity issue where the name property is getting lost
