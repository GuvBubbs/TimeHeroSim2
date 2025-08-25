// Test: Temporary TreeNode Style Override
// This removes padding and borders to test if box model is the centering issue

const testStyles = `
/* Temporary test: Remove all padding and borders */
.tree-node {
  padding: 0 !important;
  border: 1px solid var(--node-color) !important;
  background: rgba(255, 0, 0, 0.3) !important; /* Red background to see boundaries */
}
`

console.log('🧪 Testing Box Model Impact on Node Centering')
console.log('===============================================')
console.log('')
console.log('💡 EXPERIMENT: Remove padding/borders to isolate centering issue')
console.log('')
console.log('To test this:')
console.log('1. Open browser DevTools (F12)')
console.log('2. Go to Console tab')
console.log('3. Paste this CSS:')
console.log('')
console.log(testStyles)
console.log('')
console.log('4. Or add to Sources > Overrides to test temporarily')
console.log('')
console.log('📊 EXPECTED RESULTS:')
console.log('✅ If centering fixes: Box model (padding/borders) was the issue')
console.log('❌ If still not centered: Issue is in positioning calculation logic')
console.log('')
console.log('🎯 COMPARISON TEST:')
console.log('Original: padding: 0.5rem (8px), border: 2px = 20px total extra')
console.log('Test: padding: 0, border: 1px = 2px total extra') 
console.log('Expected center shift: ~9px improvement in centering')

console.log('')
console.log('Copy the CSS above and paste in browser DevTools to test!')
