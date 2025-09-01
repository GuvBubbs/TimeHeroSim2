// Debug the actual CSS classes being applied to nodes
console.log('🔍 Debugging node classes and states...')

// Run this in browser console on the upgrade tree page
const debugNodeClasses = () => {
  const nodes = document.querySelectorAll('.tree-node')
  console.log(`Found ${nodes.length} tree nodes`)
  
  nodes.forEach((node, index) => {
    if (index < 10) { // Log first 10 nodes
      const classes = Array.from(node.classList)
      const title = node.querySelector('.node-title')?.textContent || 'No title'
      console.log(`Node ${index}: "${title}"`)
      console.log(`  Classes: ${classes.join(', ')}`)
      console.log(`  Computed styles:`)
      const computed = window.getComputedStyle(node)
      console.log(`    opacity: ${computed.opacity}`)
      console.log(`    display: ${computed.display}`)
      console.log(`    visibility: ${computed.visibility}`)
      console.log(`    color: ${computed.color}`)
      
      const titleEl = node.querySelector('.node-title')
      if (titleEl) {
        const titleComputed = window.getComputedStyle(titleEl)
        console.log(`  Title computed styles:`)
        console.log(`    opacity: ${titleComputed.opacity}`)
        console.log(`    display: ${titleComputed.display}`)
        console.log(`    visibility: ${titleComputed.visibility}`)
        console.log(`    color: ${titleComputed.color}`)
      }
    }
  })
}

console.log('Copy and paste this into browser console:')
console.log('debugNodeClasses()')

// Also create a function to test highlight mode
const testHighlightMode = () => {
  console.log('Testing highlight mode...')
  
  // Find the first node and click it
  const firstNode = document.querySelector('.tree-node')
  if (firstNode) {
    console.log('Clicking first node to trigger highlight mode...')
    firstNode.click()
    
    // Wait a bit then check classes again
    setTimeout(() => {
      console.log('After highlight mode:')
      debugNodeClasses()
    }, 500)
  }
}

console.log('To test highlight mode, run: testHighlightMode()')
