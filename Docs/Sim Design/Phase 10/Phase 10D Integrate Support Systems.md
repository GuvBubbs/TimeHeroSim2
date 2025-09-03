# Phase 10D: Integrate Support Systems

## Context Within Phase 10
Support systems modify and validate the behavior of core and activity systems. They need proper integration to ensure helpers affect productivity, prerequisites gate actions, and offline progression works correctly.

**Previous**: Phase 10C extracted activity systems (~1,500 lines removed)
**Current**: Integrate and extract support system logic (~300 lines)
**Next**: Phase 10E will implement clean action routing

**SimulationEngine Status**: ~2,459 lines → Target: ~2,159 lines after this phase

## Support System Roles

### HelperSystem (Gnomes)
**Current Issues:**
- Helper effects scattered throughout SimulationEngine
- Assignment logic mixed with execution
- Level-up calculations inline
- No central helper management

**From SimulationEngine.ts to extract:**
- `evaluateHelperActions()` - Lines 1923-1987
- `executeAssignHelperAction()` - Lines 2812-2845
- `calculateHelperEffects()` - Lines 3734-3782
- `processHelperTraining()` - Lines 3783-3812
- Helper productivity modifiers

### OfflineProgressionSystem
**Current Issues:**
- Offline calculations scattered across systems
- No unified offline simulation
- Time accumulation logic duplicated

**From SimulationEngine.ts to extract:**
- `calculateOfflineProgress()` - Lines 3856-3945
- `applyOfflineRewards()` - Lines 3946-3998
- `simulateOfflineTime()` - Lines 3999-4032

### PrerequisiteSystem
**Current Issues:**
- Prerequisite checks inline everywhere
- No central validation
- Duplicate checking logic

**From SimulationEngine.ts to extract:**
- `checkPrerequisites()` - Used 47 times throughout
- `validateAction()` - Scattered validation logic
- `getUnlockStatus()` - Lines 4123-4156

## Integration Architecture

```typescript
// Support systems affect core systems through modifiers
interface SystemModifier {
  source: 'helper' | 'offline' | 'prerequisite';
  type: 'multiply' | 'add' | 'override';
  value: number;
  target: string; // e.g., 'farm.growthRate'
}

// HelperSystem provides modifiers
class HelperSystem {
  getModifiers(state: GameState): SystemModifier[] {
    const modifiers: SystemModifier[] = [];
    
    // Gnome assigned to farming
    if (state.helpers.assignments.farming) {
      modifiers.push({
        source: 'helper',
        type: 'multiply',
        value: 1.5, // 50% faster
        target: 'farm.harvestSpeed'
      });
    }
    
    return modifiers;
  }
}

// Systems apply modifiers during execution
class FarmSystem {
  tick(deltaTime: number, state: GameState, modifiers: SystemModifier[]) {
    let harvestSpeed = this.baseHarvestSpeed;
    
    // Apply modifiers
    const farmModifiers = modifiers.filter(m => m.target.startsWith('farm.'));
    for (const mod of farmModifiers) {
      if (mod.type === 'multiply') {
        harvestSpeed *= mod.value;
      }
    }
    
    // Continue with modified speed
  }
}
```

## Validation Flow

```typescript
// All actions validated through PrerequisiteSystem
class SimulationEngine {
  executeAction(action: GameAction): ActionResult {
    // 1. Check prerequisites
    const validation = this.prerequisiteSystem.validate(action, this.state);
    if (!validation.valid) {
      return { success: false, reason: validation.reason };
    }
    
    // 2. Route to system
    return this.actionRouter.route(action, this.state);
  }
}

// PrerequisiteSystem centralizes all validation
class PrerequisiteSystem {
  validate(action: GameAction, state: GameState): ValidationResult {
    // Check energy
    if (action.energyCost > state.resources.energy) {
      return { valid: false, reason: 'Insufficient energy' };
    }
    
    // Check prerequisites
    const prereqs = this.getPrerequisites(action.type);
    for (const prereq of prereqs) {
      if (!this.checkPrerequisite(prereq, state)) {
        return { valid: false, reason: `Missing: ${prereq}` };
      }
    }
    
    return { valid: true };
  }
}
```

## File Structure After Phase 10D

```
/src/utils/systems/
├── HelperSystem.ts (~400 lines)
│   ├── assignHelper()
│   ├── getModifiers()
│   ├── processTraining()
│   └── calculateEfficiency()
│
├── OfflineProgressionSystem.ts (~300 lines)
│   ├── calculateOfflineProgress()
│   ├── simulateOfflineTime()
│   └── generateSummary()
│
└── PrerequisiteSystem.ts (~350 lines)
    ├── validate()
    ├── checkPrerequisite()
    └── getUnlockTree()

SimulationEngine.ts: ~2,159 lines (down from 2,459)
```

## Integration Points

### Helper Effects Application
```typescript
// SimulationEngine tick()
tick(deltaTime: number) {
  // Get all modifiers
  const modifiers = this.helperSystem.getModifiers(this.state);
  
  // Pass to each system
  this.systems.farm.tick(deltaTime, this.state, modifiers);
  this.systems.mine.tick(deltaTime, this.state, modifiers);
  // etc...
}
```

### Offline Processing
```typescript
// On game resume
onResume(offlineTime: number) {
  const progress = this.offlineSystem.calculateOfflineProgress(
    offlineTime,
    this.state,
    this.systems
  );
  
  this.offlineSystem.applyOfflineRewards(progress, this.state);
}
```

### Action Validation
```typescript
// Before any action execution
canExecute(action: GameAction): boolean {
  return this.prerequisiteSystem.validate(action, this.state).valid;
}
```

## Success Criteria
- [ ] HelperSystem manages all gnome logic centrally
- [ ] OfflineProgressionSystem handles all offline calculations
- [ ] PrerequisiteSystem validates all actions
- [ ] Support systems properly modify core systems
- [ ] SimulationEngine reduced by ~300 lines
- [ ] No duplicate validation logic remains

## Time Estimate
- **Expected**: 2 hours
- **Per System**: ~40 minutes
- **Risk**: Complex integration patterns

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationEngine.ts`
- `/src/utils/systems/HelperSystem.ts`
- `/src/utils/systems/OfflineProgressionSystem.ts`
- `/src/utils/systems/PrerequisiteSystem.ts`
- `/src/utils/systems/GnomeHousingSystem.ts` (if exists)

**Prompt:**
```
Phase 10D: Integrate support systems and remove related code from SimulationEngine

HELPER SYSTEM INTEGRATION:
1. If GnomeHousingSystem exists, merge it into HelperSystem
2. EXTRACT from SimulationEngine:
   - evaluateHelperActions() 
   - executeAssignHelperAction()
   - calculateHelperEffects()
   - processHelperTraining()
3. CREATE in HelperSystem:
   - getModifiers() method that returns system modifiers
   - Assignment management
   - Training progression
   - Efficiency calculations

OFFLINE SYSTEM INTEGRATION:
1. EXTRACT from SimulationEngine:
   - calculateOfflineProgress()
   - applyOfflineRewards()
   - simulateOfflineTime()
2. ENSURE it can simulate all systems during offline time

PREREQUISITE SYSTEM INTEGRATION:
1. FIND all instances of prerequisite checking in SimulationEngine
2. CENTRALIZE in PrerequisiteSystem.validate()
3. REPLACE all inline checks with:
   this.prerequisiteSystem.validate(action, state)

MODIFIER PATTERN:
Update core systems to accept modifiers:
```typescript
// Add to each system's tick method
tick(deltaTime: number, state: GameState, modifiers?: SystemModifier[]) {
  // Apply modifiers to system behavior
}
```

DELETE all extracted code from SimulationEngine!

Document in /Docs/Sim Design/Phase10D-Support-Integration.md:
- Integration patterns used
- Modifier system design
- Validation flow
```

## Next Phase Preview
Phase 10E will replace the massive executeAction() method and its sub-methods with a clean ActionRouter, removing ~1,000 lines of switch statements and execution logic.