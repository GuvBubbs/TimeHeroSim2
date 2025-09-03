# Phase 10H: Testing & Validation

## Context Within Phase 10
This is the final validation phase. The refactor is complete - SimulationEngine has been transformed from a 5,659-line monolith into a ~500-line orchestrator with properly separated systems. Now we must ensure everything works correctly.

**Previous**: Phase 10G created the final orchestrator (~500 lines)
**Current**: Test, validate, fix bugs, update documentation
**Result**: Production-ready refactored simulation

**Critical**: The seed catching bug MUST be fixed in this phase!

## Testing Checklist

### 1. Unit Tests for Each System
```typescript
// Test each system in isolation
describe('FarmSystem', () => {
  it('evaluates farm actions correctly');
  it('executes plant action');
  it('processes crop growth');
  it('handles water consumption');
});

describe('TowerSystem', () => {
  it('catches seeds at correct rate'); // FIX THE BUG HERE
  it('processes auto-catcher');
  it('generates appropriate seed pool');
});

// ... test all 7 core systems + support systems
```

### 2. Integration Tests
```typescript
describe('System Integration', () => {
  it('systems communicate via events');
  it('helper modifiers apply correctly');
  it('prerequisites validated before actions');
  it('state changes propagate properly');
});
```

### 3. Full Simulation Tests
```typescript
describe('Complete Simulation', () => {
  it('runs tutorial to completion');
  it('speedrunner persona reaches endgame');
  it('casual player progresses appropriately');
  it('weekend warrior handles gaps correctly');
});
```

### 4. Performance Benchmarks
```typescript
describe('Performance', () => {
  it('tick performance ≤ old SimulationEngine');
  it('memory usage stable over long runs');
  it('no memory leaks in systems');
  it('worker communication efficient');
});
```

## Known Bugs to Fix

### Priority 1: CRITICAL
**Seed Catching Not Working**
- **Location**: TowerSystem.ts
- **Issue**: Seeds not being caught when action executed
- **Root Cause**: Likely missing state update or incorrect probability calculation
- **Fix**:
```typescript
// TowerSystem.ts
catchSeed(action: CatchSeedAction, state: GameState): ActionResult {
  const windLevel = state.tower.currentLevel;
  const availableSeeds = this.getSeedsAtLevel(windLevel);
  
  // BUG FIX: Was checking wrong condition
  if (availableSeeds.length > 0) {
    const caught = this.selectRandomSeed(availableSeeds);
    
    // BUG FIX: Was not updating state correctly
    this.stateManager.addSeed(caught.type, 1);
    
    return { 
      success: true, 
      seed: caught,
      message: `Caught ${caught.name}!` 
    };
  }
  
  return { success: false, reason: 'No seeds available' };
}
```

### Priority 2: HIGH
**Combat Damage Calculations**
- **Location**: AdventureSystem.ts
- **Issue**: Damage off by factor of 10
- **Fix**: Check damage formula against design doc

**Mining Energy Drain**
- **Location**: MineSystem.ts
- **Issue**: Not exponential (should be 2^depth)
- **Fix**: Correct the energy calculation

**Helper Assignment**
- **Location**: HelperSystem.ts
- **Issue**: Assignments not persisting
- **Fix**: Ensure state updates properly

### Priority 3: MEDIUM
**Offline Progression Edge Cases**
- **Issue**: Negative resources possible
- **Fix**: Add validation in OfflineProgressionSystem

**Forge Heat Management**
- **Issue**: Heat not affecting success rates
- **Fix**: Apply heat modifier in success calculation

## Documentation Updates

### 1. Update As-Built Documentation
Create/Update these files:
```
/Docs/Sim Design/
├── SimulationOrchestrator-As-Built.md
├── SystemArchitecture-As-Built.md
├── Phase10-Complete-Report.md
└── Migration-Guide.md
```

### 2. System Documentation Template
For each system, document:
```markdown
# [System]System As-Built

## Purpose
What this system manages

## Interface
- evaluateActions()
- execute()
- tick()

## State Management
What state it reads/modifies

## Events
- Emitted events
- Subscribed events

## Dependencies
- Required systems
- Data sources
```

### 3. Migration Guide
```markdown
# Migration from SimulationEngine to SimulationOrchestrator

## Breaking Changes
- None (interface preserved)

## File Changes
- OLD: SimulationEngine.ts (5,659 lines)
- NEW: SimulationOrchestrator.ts (~500 lines)
- NEW: 7 core systems + support systems

## Integration Points
- Worker: Change import to SimulationOrchestrator
- Tests: Update to use new orchestrator
```

## Validation Metrics

### Line Count Verification
```
Target vs Actual:
- SimulationOrchestrator: Target 500, Actual: ___
- Total System Lines: ~4000
- Total Refactor Lines: ~4500 (vs 5659 original)
- Net Reduction: ~1159 lines (20% reduction)
```

### Functionality Verification
- [ ] All personas work correctly
- [ ] All game phases reachable
- [ ] All actions execute properly
- [ ] All systems integrate cleanly
- [ ] Performance acceptable

### Code Quality Metrics
- [ ] No circular dependencies
- [ ] Clear module boundaries
- [ ] Consistent interfaces
- [ ] Proper TypeScript types
- [ ] No direct state mutations

## Final Cleanup

### 1. Delete Old Files
After full validation:
```bash
# ONLY after everything verified working!
rm /src/utils/SimulationEngine.ts
rm /src/utils/SimulationEngine.old.ts (if exists)
```

### 2. Update Imports
```typescript
// In all files that imported SimulationEngine
// OLD:
import { SimulationEngine } from './utils/SimulationEngine';

// NEW:
import { SimulationOrchestrator } from './utils/SimulationOrchestrator';
```

### 3. Update Worker
```typescript
// /src/workers/simulationWorker.ts
// Update to use SimulationOrchestrator
```

## Success Criteria
- [ ] All tests pass (unit, integration, e2e)
- [ ] Seed catching bug FIXED and verified
- [ ] Performance equal or better than original
- [ ] Documentation complete and accurate
- [ ] Worker integration verified
- [ ] UI (LiveMonitor) works correctly
- [ ] Can delete SimulationEngine.ts

## Time Estimate
- **Expected**: 2 hours
- **Testing**: 45 minutes
- **Bug Fixes**: 45 minutes
- **Documentation**: 30 minutes
- **Risk**: Unknown integration issues

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationOrchestrator.ts`
- `/src/utils/systems/TowerSystem.ts` (for seed bug)
- `/src/utils/systems/AdventureSystem.ts` (for combat bug)
- `/src/utils/systems/MineSystem.ts` (for energy bug)
- `/src/tests/` (test files)
- `/src/workers/simulationWorker.ts`

**Prompt:**
```
Phase 10H: Test and validate the complete refactor

PRIORITY 1 - FIX SEED CATCHING BUG:
In TowerSystem.ts:
1. Find catchSeed() or executeCatchSeed() method
2. Debug why seeds aren't being caught
3. Check:
   - Is seed pool being generated?
   - Is random selection working?
   - Is state being updated?
   - Is the result being returned correctly?
4. FIX the bug and verify seeds can be caught

OTHER BUG FIXES:
1. AdventureSystem: Fix combat damage (off by 10x)
2. MineSystem: Fix energy drain (should be 2^depth)
3. HelperSystem: Fix assignment persistence

TESTING:
Create /src/tests/orchestrator.test.ts:
- Test each system in isolation
- Test system integration
- Test full simulation run
- Test all three personas

PERFORMANCE:
1. Time old SimulationEngine for 1000 ticks
2. Time new SimulationOrchestrator for 1000 ticks
3. Verify new version is equal or faster

INTEGRATION:
1. Update /src/workers/simulationWorker.ts to use SimulationOrchestrator
2. Test with LiveMonitor.vue to ensure UI still works
3. Verify all data flows correctly

DOCUMENTATION:
Create /Docs/Sim Design/Phase10-Complete-Report.md:
```markdown
# Phase 10 Refactor Complete

## Metrics
- Original: SimulationEngine.ts - 5,659 lines
- New: SimulationOrchestrator.ts - [ACTUAL] lines
- Systems Created: 7 core + 2 support
- Bugs Fixed: [List all fixed bugs]

## Performance
- Old: X ms per 1000 ticks
- New: Y ms per 1000 ticks
- Improvement: Z%

## Test Results
- Unit Tests: X/Y passing
- Integration Tests: X/Y passing
- E2E Tests: X/Y passing

## Migration Notes
[Any breaking changes or gotchas]
```

FINAL VERIFICATION:
Once everything works, SimulationEngine.ts can be safely deleted!
```

## Post-Phase 10 Considerations

### What's Next?
1. **Phase 11**: Advanced features (if needed)
   - Plugin system for new game systems
   - State replay/debugging tools
   - Performance profiling integration

2. **Phase 12**: Production optimization
   - Code splitting for systems
   - Lazy loading of unused systems
   - WebAssembly for performance-critical paths

### Maintenance Plan
- Each system can now be maintained independently
- New features add new systems, not modify orchestrator
- Bug fixes isolated to specific systems
- Testing can focus on changed systems only

## Conclusion
Phase 10H completes the massive refactor from a 5,659-line monolith to a clean, modular architecture with a ~500-line orchestrator and well-separated systems. The seed catching bug must be fixed, all tests must pass, and performance must be validated before considering the refactor complete.