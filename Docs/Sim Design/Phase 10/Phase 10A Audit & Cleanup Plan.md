# Phase 10A: Audit & Cleanup Plan

## Context Within Phase 10
This is the foundation phase of the complete SimulationEngine refactor. Before we can extract systems and create a clean orchestrator, we need to:
1. Remove the failed refactor attempt (SimulationOrchestrator.ts)
2. Consolidate duplicate systems
3. Establish baseline metrics
4. Create a clean starting point

## Current State Assessment
- **SimulationEngine.ts**: 5,659 lines (monolithic, contains everything)
- **SimulationOrchestrator.ts**: ~3,500 lines (failed refactor attempt, mostly a copy)
- **System Files**: 15 files with some duplicates and inconsistencies

## Phase 10A Objectives
1. **Delete SimulationOrchestrator.ts** - it's a failed attempt, not a true refactor
2. **Audit system files** for duplicates and consolidation opportunities
3. **Create system registry** for clean system management
4. **Document baseline metrics** for tracking progress

## Detailed Tasks

### Task 1: Remove Failed Refactor
```bash
# Delete the failed orchestrator attempt
rm /src/utils/SimulationOrchestrator.ts
```

### Task 2: System Audit & Consolidation

**Review these system files:**
```
/src/utils/systems/
├── AdventureSystem.ts       ✓ Keep
├── CombatSystem.ts          ? Merge into AdventureSystem
├── CraftingSystem.ts        ? Merge into ForgeSystem
├── CropSystem.ts            ? Merge into FarmSystem or rename
├── ForgeSystem.ts           ✓ Keep
├── GnomeHousingSystem.ts    ? Merge into HelperSystem
├── HelperSystem.ts          ✓ Keep
├── MiningSystem.ts          → Rename to MineSystem.ts
├── OfflineProgressionSystem.ts ✓ Keep
├── PrerequisiteSystem.ts    ✓ Keep
├── RouteEnemyRollSystem.ts  ? Merge into AdventureSystem
├── SeedSystem.ts            ? Keep or merge into TowerSystem
├── TowerSystem.ts           ✓ Keep
├── TownSystem.ts            ✓ Keep
└── WaterSystem.ts           ? Keep or merge into FarmSystem
```

**Consolidation Decisions:**
- **FarmSystem**: Should include CropSystem and WaterSystem logic
- **AdventureSystem**: Should include CombatSystem and RouteEnemyRollSystem
- **ForgeSystem**: Should include CraftingSystem
- **HelperSystem**: Should include GnomeHousingSystem
- **MineSystem**: Rename from MiningSystem for consistency

### Task 3: Create System Registry

Create `/src/utils/systems/systemRegistry.ts`:
```typescript
import { FarmSystem } from './FarmSystem';
import { TowerSystem } from './TowerSystem';
import { TownSystem } from './TownSystem';
import { AdventureSystem } from './AdventureSystem';
import { MineSystem } from './MineSystem';
import { ForgeSystem } from './ForgeSystem';
import { HelperSystem } from './HelperSystem';
import { OfflineProgressionSystem } from './OfflineProgressionSystem';
import { PrerequisiteSystem } from './PrerequisiteSystem';

export const CORE_SYSTEMS = {
  farm: FarmSystem,
  tower: TowerSystem,
  town: TownSystem,
  adventure: AdventureSystem,
  mine: MineSystem,
  forge: ForgeSystem,
  helper: HelperSystem
} as const;

export const SUPPORT_SYSTEMS = {
  offline: OfflineProgressionSystem,
  prerequisites: PrerequisiteSystem
} as const;

export type CoreSystemType = keyof typeof CORE_SYSTEMS;
export type SupportSystemType = keyof typeof SUPPORT_SYSTEMS;
```

### Task 4: Document Baseline Metrics

Create `/Docs/Sim Design/Phase10A-Baseline-Metrics.md`:
```markdown
# Phase 10A Baseline Metrics

## File Sizes Before Refactor
- SimulationEngine.ts: 5,659 lines
- SimulationOrchestrator.ts: ~3,500 lines (DELETED)

## System Files (After Consolidation)
- FarmSystem.ts: XXX lines (includes Crop + Water)
- TowerSystem.ts: XXX lines (includes Seed)
- TownSystem.ts: XXX lines
- AdventureSystem.ts: XXX lines (includes Combat + RouteRolls)
- MineSystem.ts: XXX lines (renamed from Mining)
- ForgeSystem.ts: XXX lines (includes Crafting)
- HelperSystem.ts: XXX lines (includes GnomeHousing)
- OfflineProgressionSystem.ts: XXX lines
- PrerequisiteSystem.ts: XXX lines

## Deleted Files
- SimulationOrchestrator.ts (failed refactor)
- CropSystem.ts (merged into FarmSystem)
- WaterSystem.ts (merged into FarmSystem)
- CombatSystem.ts (merged into AdventureSystem)
- RouteEnemyRollSystem.ts (merged into AdventureSystem)
- CraftingSystem.ts (merged into ForgeSystem)
- GnomeHousingSystem.ts (merged into HelperSystem)
```

## Success Criteria
- [ ] SimulationOrchestrator.ts deleted
- [ ] No duplicate systems remain
- [ ] System registry created and typed
- [ ] All systems follow consistent naming (XxxSystem.ts)
- [ ] Baseline metrics documented
- [ ] Clean starting point for Phase 10B

## Time Estimate
- **Expected**: 2 hours
- **Tasks**: Audit, consolidate, document
- **Risk**: Finding unexpected dependencies

## Implementation Prompt for GitHub Copilot

**Attach these files:**
- `/src/utils/SimulationEngine.ts`
- `/src/utils/SimulationOrchestrator.ts`
- `/src/utils/systems/` (entire folder)

**Prompt:**
```
Phase 10A: Audit and cleanup for SimulationEngine refactor.

IMMEDIATE ACTIONS:
1. DELETE /src/utils/SimulationOrchestrator.ts - it's a failed refactor attempt

2. CONSOLIDATE these system files:
   - Merge CropSystem + WaterSystem → FarmSystem
   - Merge CombatSystem + RouteEnemyRollSystem → AdventureSystem
   - Merge CraftingSystem → ForgeSystem
   - Merge GnomeHousingSystem → HelperSystem
   - Rename MiningSystem → MineSystem
   - Keep or merge SeedSystem → TowerSystem (your judgment)

3. CREATE /src/utils/systems/systemRegistry.ts with:
   - CORE_SYSTEMS object (7 main systems)
   - SUPPORT_SYSTEMS object (offline, prerequisites)
   - Proper TypeScript types

4. DOCUMENT in /Docs/Sim Design/Phase10A-Baseline-Metrics.md:
   - Current line count of SimulationEngine.ts (5,659)
   - Line count of each consolidated system
   - List of deleted/merged files

Do NOT start extracting code yet - just consolidate systems and document the starting point.

Report back with the baseline metrics when complete.
```

## Next Phase Preview
Phase 10B will begin extracting the core game loop systems (Farm, Tower, Town) from SimulationEngine, targeting removal of ~1,700 lines. We'll have clean, consolidated systems ready to receive the extracted code.