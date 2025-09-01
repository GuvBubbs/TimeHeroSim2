// Debug test for seed catching completion
console.log('🧪 Starting seed catching debug test...')

// Open the dev console to see debug logs
setTimeout(() => {
  // Inject a test seed catching session directly into the game state
  console.log('🧪 Attempting to inject test seed catching session...')
  
  // Try to access the simulation through window globals or similar
  // This is a crude test but should help us debug
  
  if (window.vueApp && window.vueApp.$refs && window.vueApp.$refs.simulation) {
    const simulation = window.vueApp.$refs.simulation
    console.log('🧪 Found simulation reference:', simulation)
    
    // Try to access the engine
    if (simulation.engine) {
      console.log('🧪 Found simulation engine:', simulation.engine)
      
      // Manually start a seed catching session for testing
      simulation.engine.gameState.processes.seedCatching = {
        startedAt: simulation.engine.gameState.time.totalMinutes,
        duration: 5,
        progress: 0,
        windLevel: 3,
        netType: 'basic',
        expectedSeeds: 10,
        isComplete: false
      }
      
      console.log('🧪 Injected test seed catching session! Should complete in 5 minutes.')
      console.log('Current time:', simulation.engine.gameState.time.totalMinutes)
      console.log('Should complete at:', simulation.engine.gameState.time.totalMinutes + 5)
    }
  } else {
    console.log('🧪 Could not find simulation reference - try checking manually')
  }
}, 2000)
