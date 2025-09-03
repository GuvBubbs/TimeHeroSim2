# Phase 11A - Fix Hero Inaction Bug

## Problem Statement
The hero never takes any actions despite having seeds to plant and empty plots available. The DecisionEngine's `shouldHeroActNow` method consistently returns false, preventing all gameplay.

## Root Cause Analysis

### Observed Symptoms
1. `shouldHeroActNow` always returns false
2. `lastCheckinTime` remains at 0 throughout simulation
3. `currentTime` increments normally (0.5, 1, 1.5, 2...)
4. Zero actions executed across all ticks
5. Hero has resources but never uses them

### Likely Issues in DecisionEngine
```typescript
// Current problematic logic (inferred from logs):
shouldHeroActNow = false (lastCheckinTime: 0, currentTime: 0.5)
```

The timing check is likely something like:
- Waiting for a minimum time interval since last action
- But `lastCheckinTime` never updates because no actions occur
- Creating a deadlock where the first action can never happen

## Solution Design

### Fix 1: Initialize Hero Action on Game Start
**Location**: `src/utils/ai/DecisionEngine.ts`
- Allow immediate action when `lastCheckinTime === 0` (game start)
- Change condition to: `if (lastCheckinTime === 0 || currentTime - lastCheckinTime >= checkInterval)`

### Fix 2: Ensure Proper Check Interval
**Location**: `src/utils/ai/DecisionEngine.ts`
- Set reasonable check interval (e.g., 5 minutes game time)
- Make it persona-dependent:
  - Speedrunner: 5 minutes
  - Casual: 10 minutes  
  - Weekend Warrior: 15 minutes

### Fix 3: Update lastCheckinTime After Actions
**Location**: `src/utils/SimulationOrchestrator.ts` or `DecisionEngine.ts`
- After executing actions, update `lastCheckinTime = currentTime`
- Ensure this happens even if zero actions were available

### Fix 4: Add Fallback for Stuck Heroes
**Location**: `src/utils/ai/DecisionEngine.ts`
- If no actions taken for >30 minutes, force a check-in
- Log warning when this fallback triggers for debugging

## Implementation Steps

1. **Locate the timing check** in DecisionEngine.ts
2. **Fix the initial condition** to allow first action
3. **Add proper time tracking** after action execution
4. **Test with all personas** to ensure different play styles work

## Testing Checklist

- [ ] Hero plants seeds on game start
- [ ] Hero takes actions at appropriate intervals
- [ ] lastCheckinTime updates after actions
- [ ] Speedrunner acts frequently (5 min intervals)
- [ ] Casual player acts moderately (10 min intervals)
- [ ] Weekend Warrior acts less frequently (15 min intervals)
- [ ] No actions are skipped due to timing issues
- [ ] Simulation progresses beyond tutorial phase

## Success Criteria

1. Within first 10 ticks, hero should:
   - Plant available seeds
   - Pump water if needed
   - Harvest crops when ready

2. DecisionEngine logs should show:
   - `shouldHeroActNow = true` periodically
   - `lastCheckinTime` updating after actions
   - Reasonable intervals between check-ins

## Risk Assessment

**Low Risk**: This is a logic fix that shouldn't affect other systems
**Testing Required**: All three personas must be verified
**Rollback Plan**: Previous DecisionEngine logic is preserved in git