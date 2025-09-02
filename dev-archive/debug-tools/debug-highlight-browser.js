// Debug script to test live upgrade tree data
// This will help us see what's happening to the node data

console.log('🔍 Debugging live upgrade tree data...')

// Access the Vue app and stores in the browser
// We'll create a test that can be run in the browser console

const debugScript = `
// Run this in the browser console when on the upgrade tree page
// to debug the blank nodes issue

console.log('🔍 Debugging upgrade tree nodes...')

// Get the Vue app instance
const app = document.querySelector('#app').__vue_app__
const stores = app.config.globalProperties.$pinia

// Get the upgrade tree store
const upgradeTreeStore = stores._s.get('upgradeTree')
const state = upgradeTreeStore.$state

console.log('Nodes array:', state.nodes)
console.log('Highlight mode:', state.highlightMode)
console.log('Highlighted nodes:', Array.from(state.highlightedNodes))
console.log('Node highlight info:', state.nodeHighlightInfo)

// Check if any nodes have missing names
const nodesWithoutNames = state.nodes.filter(node => !node.name || node.name === '')
console.log('Nodes without names:', nodesWithoutNames)

// Check the first few nodes' names
console.log('First 5 nodes names:', state.nodes.slice(0, 5).map(n => ({ id: n.id, name: n.name })))

// Test triggering highlight mode on a node
if (state.nodes.length > 0) {
  const testNode = state.nodes[0]
  console.log('Testing highlight mode on node:', testNode.id, testNode.name)
  
  // Enter highlight mode
  upgradeTreeStore.enterHighlightMode(testNode.id)
  
  // Check if the node still has its name
  console.log('After highlight mode - node name still exists:', testNode.name)
  console.log('Node data:', testNode)
}
`

console.log('Copy and paste this script into the browser console:')
console.log(debugScript)
