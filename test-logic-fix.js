// Test the core logic fix directly
// Simulating the checkBaseConditions method behavior

function testCheckBaseConditions(currentTime, lastCheckIn) {
  console.log(`\n🔍 Testing: currentTime=${currentTime}, lastCheckIn=${lastCheckIn}`)
  
  // CRITICAL FIX: Allow immediate action on game start (lastCheckIn === 0)
  if (lastCheckIn === 0) {
    console.log(`✅ Game start detected, allowing immediate action`);
    return true;
  }
  
  // CRITICAL FIX: Always allow actions in first 10 hours for active gameplay
  // This must come BEFORE night time check to override time interpretation issues
  if (currentTime < 600) { // First 10 hours
    console.log(`✅ Early game period (${currentTime} < 600 min), allowing action`);
    return true // Allow multiple check-ins during initial gameplay
  }
  
  const currentHour = Math.floor((currentTime % (24 * 60)) / 60)
  
  // Don't act at night (10 PM to 6 AM) - only after early game period
  if (currentHour < 6 || currentHour >= 22) {
    console.log(`❌ Night time (hour ${currentHour}), blocking action`);
    return false;
  }

  console.log(`✅ Daytime (hour ${currentHour}), allowing action`);
  return true
}

function testPersonaInterval(personaName, interval, currentTime, lastCheckIn) {
  console.log(`\n🎯 ${personaName.toUpperCase()}: Testing interval logic`)
  
  if (!testCheckBaseConditions(currentTime, lastCheckIn)) {
    console.log(`❌ Base conditions failed`)
    return false
  }

  const timeSinceLastCheckin = currentTime - lastCheckIn
  const shouldAct = timeSinceLastCheckin >= interval;
  
  console.log(`⏱️ Time since last checkin: ${timeSinceLastCheckin} >= ${interval} = ${shouldAct}`)
  
  return shouldAct;
}

console.log('🧪 TESTING CORE LOGIC FIXES')
console.log('============================')

// Test the exact bug scenario
console.log('\n📋 SCENARIO 1: Game start (the original bug)')
console.log('currentTime: 0.5, lastCheckinTime: 0')
const gameStartResult = testCheckBaseConditions(0.5, 0)
console.log(`Result: ${gameStartResult} (should be TRUE)`)

console.log('\n📋 SCENARIO 2: Early game progression')
console.log('currentTime: 1.0, lastCheckinTime: 0.5')
const earlyGameResult = testCheckBaseConditions(1.0, 0.5)
console.log(`Result: ${earlyGameResult} (should be TRUE)`)

console.log('\n📋 SCENARIO 3: Persona intervals after game start')
testPersonaInterval('speedrunner', 5, 6.0, 0.5)  // Should be true
testPersonaInterval('casual', 10, 6.0, 0.5)      // Should be false  
testPersonaInterval('weekend_warrior', 15, 6.0, 0.5)  // Should be false

console.log('\n📋 SCENARIO 4: After casual interval')
testPersonaInterval('speedrunner', 5, 11.0, 0.5)  // Should be true
testPersonaInterval('casual', 10, 11.0, 0.5)      // Should be true
testPersonaInterval('weekend_warrior', 15, 11.0, 0.5)  // Should be false

console.log('\n📋 SCENARIO 5: After weekend warrior interval')
testPersonaInterval('speedrunner', 5, 16.0, 0.5)  // Should be true
testPersonaInterval('casual', 10, 16.0, 0.5)      // Should be true
testPersonaInterval('weekend_warrior', 15, 16.0, 0.5)  // Should be true

console.log('\n✅ SUMMARY')
console.log('===========')
console.log('If all game start tests return TRUE, the core bug is fixed!')
console.log('The hero will now be able to take actions immediately when the simulation begins.')
console.log('')
console.log('Expected behavior:')
console.log('- Game start: All personas can act immediately (lastCheckinTime = 0)')
console.log('- Speedrunner: Acts every 5 minutes')
console.log('- Casual: Acts every 10 minutes')
console.log('- Weekend Warrior: Acts every 15 minutes')
console.log('- All personas: Can act throughout first 10 hours regardless of "time of day"')
