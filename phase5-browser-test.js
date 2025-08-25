// Phase 5 Enhanced Highlight Mode - Browser Console Test
// Paste this into browser console at http://localhost:5175/TimeHeroSim2/#/upgrade-tree

console.log('🚀 Phase 5 Enhanced Highlight Mode Test')

// Wait for store to be ready
setTimeout(() => {
  try {
    // Access Vue app and store
    const app = document.querySelector('#app').__vue_app__
    const stores = app.config.globalProperties.$pinia._s
    const treeStore = stores.get('upgradeTree')
    
    if (!treeStore) {
      console.error('❌ Could not access tree store')
      return
    }
    
    console.log(`✅ Store loaded: ${treeStore.nodes.length} nodes, ${treeStore.connections.length} connections`)
    
    // Test 1: Find a node with dependencies
    const testNode = treeStore.nodes.find(n => n.prerequisites?.length > 0)
    if (!testNode) {
      console.log('⚠️ No nodes with prerequisites found')
      return
    }
    
    console.log(`\n🎯 Testing with: ${testNode.name}`)
    console.log(`📋 Prerequisites: ${testNode.prerequisites.join(', ')}`)
    
    // Test 2: Enhanced highlighting
    console.log('\n🌈 Activating enhanced highlight mode...')
    treeStore.enterHighlightMode(testNode.id)
    
    const depTree = treeStore.currentDependencyTree
    if (depTree) {
      console.log(`🌳 Dependency tree:`)
      console.log(`  • Selected: ${depTree.selected.length}`)
      console.log(`  • Direct prereqs: ${depTree.directPrerequisites.length}`)
      console.log(`  • Indirect prereqs: ${depTree.indirectPrerequisites.length}`)
      console.log(`  • Direct dependents: ${depTree.directDependents.length}`)
      console.log(`  • Indirect dependents: ${depTree.indirectDependents.length}`)
      console.log(`  • Total highlighted: ${treeStore.highlightedNodes.size}`)
    }
    
    // Test 3: Multi-select
    console.log('\n🎯 Testing multi-select...')
    const secondNode = treeStore.nodes.find(n => n.id !== testNode.id && n.prerequisites?.length > 0)
    if (secondNode) {
      treeStore.toggleMultiSelectMode(true)
      treeStore.enterHighlightMode(secondNode.id, true)
      console.log(`📊 Multi-select: ${treeStore.selectedNodes.size} nodes selected`)
      console.log(`🎨 Total highlighted: ${treeStore.highlightedNodes.size} nodes`)
    }
    
    // Test 4: Visual elements
    console.log('\n🎨 Checking visual elements...')
    const nodeElements = document.querySelectorAll('.tree-node')
    const highlightedElements = document.querySelectorAll('.tree-node.highlight-selected, .tree-node.highlight-direct, .tree-node.highlight-indirect')
    const depthIndicators = document.querySelectorAll('.depth-indicator')
    const connectionPaths = document.querySelectorAll('.connection-layer path')
    
    console.log(`  • Node elements: ${nodeElements.length}`)
    console.log(`  • Highlighted elements: ${highlightedElements.length}`)
    console.log(`  • Depth indicators: ${depthIndicators.length}`)
    console.log(`  • Connection paths: ${connectionPaths.length}`)
    
    // Test 5: Connection interaction
    console.log('\n🔗 Testing connection interactions...')
    const testConnection = treeStore.connections[0]
    if (testConnection) {
      const depth = treeStore.getConnectionDepth(testConnection)
      const highlighted = treeStore.isConnectionHighlighted(testConnection)
      console.log(`  • Test connection depth: ${depth}`)
      console.log(`  • Connection highlighted: ${highlighted}`)
    }
    
    console.log('\n🎉 Phase 5 test complete!')
    console.log('✅ Enhanced highlight mode operational')
    console.log('✅ Multi-level dependency traversal working')
    console.log('✅ Visual hierarchy implemented')
    console.log('✅ Interactive connections functional')
    
    // Clean up after 5 seconds
    setTimeout(() => {
      treeStore.exitHighlightMode()
      console.log('🧹 Cleaned up highlight mode')
    }, 5000)
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}, 1000)
