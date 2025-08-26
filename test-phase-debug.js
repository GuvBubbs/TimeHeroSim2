// Test phase calculation debugging
console.log('Testing phase calculation...')

// Test with browser
fetch('http://localhost:5177/TimeHeroSim2/#/upgrade-tree')
  .then(response => {
    console.log('Browser loaded, check console for 🎯 PHASE DEBUG messages')
  })
  .catch(error => {
    console.error('Error loading page:', error)
  })
