# Core Actions Energy Policy

## Critical Design Decision

**Basic farming actions MUST be FREE (energyCost: 0)**

This is a fundamental game design principle that must NEVER be changed.

## Free Actions (energyCost: 0)

The following core gameplay actions cost no energy:

1. **Planting seeds (sowing)**
2. **Watering crops** 
3. **Harvesting crops**
4. **Pumping water from well**
5. **Catching seeds at tower**
6. **Travel between screens**

## Actions That Cost Energy

Only these types of actions should have energy costs:

1. **Actions from farm_actions.csv** - Building storage, clearing land, expanding farm
2. **Actions from forge_actions.csv** - Crafting tools, smelting, refining materials  
3. **Mining actions** - Going deeper, tool sharpening
4. **Combat actions** - Adventures, fighting enemies

## Rationale

The core game loop is: **Seeds → Plant → Water → Harvest → Energy**

This loop must be free or the game becomes unplayable. Players need to be able to:

- Plant seeds to start crop production
- Water crops to maintain growth
- Harvest crops to gain energy
- Pump water to sustain the cycle

Energy is:
- **SPENT on**: Land expansion, tool crafting, deep mining, combat/adventures
- **GAINED from**: Harvesting crops, adventure rewards

## Code Implementation

### FarmSystem.ts

The FarmSystem has been fixed to ensure basic actions are free:

```typescript
// Plant action
energyCost: 0, // CORE GAME DESIGN: Basic farming actions are FREE

// Harvest action  
energyCost: 0, // CORE GAME DESIGN: Basic farming actions are FREE

// Pump action
energyCost: 0, // CORE GAME DESIGN: Basic farming actions are FREE
```

### Energy Checks Removed

All energy validation checks have been removed from basic farming actions:

- No energy requirement in action evaluation
- No energy checks in action validation
- No energy deduction in action execution

## Historical Context

This issue has been repeatedly introduced and fixed. The reason is developers incorrectly assuming that "actions should cost energy" without understanding the core game design.

**This must not happen again.**

## File Locations

- Primary implementation: `src/utils/systems/core/FarmSystem.ts`
- Documentation header added to file with this policy
- Comments added to all relevant methods

## Testing Verification

To verify this is working correctly:

1. Hero should be able to plant seeds immediately without energy
2. Hero should be able to pump water without energy
3. Hero should be able to harvest crops without energy
4. Hero should gain energy from harvesting (not lose it)
5. Only special actions (building, crafting, etc.) should require energy

## Related Files

- `src/utils/systems/core/FarmSystem.ts` - Primary implementation
- `public/Data/Actions/farm_actions.csv` - Special actions that DO cost energy
- `public/Data/Actions/forge_actions.csv` - Crafting actions that DO cost energy
- `Docs/Time Hero Game Design Reference/Time Hero - Unified Game Design & Progression.md` - Original design document

## Enforcement

Any pull request that reintroduces energy costs to basic farming actions should be immediately rejected.

Code review checklist:
- [ ] Plant actions have `energyCost: 0`
- [ ] Harvest actions have `energyCost: 0`
- [ ] Pump actions have `energyCost: 0`
- [ ] Water actions have `energyCost: 0`
- [ ] No energy checks in basic action validation
- [ ] No energy deduction in basic action execution
