# Hardcoded Data Architecture Issue - Critical Analysis

## Executive Summary

A critical architectural flaw has been identified in the TimeHero Simulator where the `SimulationEngine` contains hardcoded parameter arrays that duplicate and diverge from the authoritative CSV data files. This creates a "two sources of truth" problem that leads to data inconsistency, maintenance overhead, and simulation inaccuracy.

**Impact**: The simulation may test game balance using different values than the actual game uses, invalidating balance analysis results.

---

## The Problem

### Current Architecture Flaw

The TimeHero Simulator has developed two parallel data systems:

1. **CSV Data System** (Correct)
   - Located in `public/Data/Actions/*.csv`
   - Loaded via `gameDataStore` and accessed through `useGameData` composable
   - Used by the actual game UI and mechanics
   - Example: `farm_actions.csv` shows `tower_reach_1` costs 5 energy

2. **Hardcoded Parameters** (Problematic)
   - Located in `src/utils/SimulationEngine.ts`
   - Manually maintained parameter arrays
   - Used only by the simulation engine
   - Example: `reachLevelEnergy: [5, 50, 200, 1000]` array

### Specific Instance Discovered

During Phase 9E energy economy fixes, we discovered:

```csv
# farm_actions.csv (Source of Truth)
tower_reach_1,Tower Reach 1,...,,,5,2,...  # 5 energy cost

# SimulationEngine.ts (Divergent Copy)
reachLevelEnergy: [0, 50, 200, 1000]  # Was hardcoded as 0 energy
```

The simulation was testing tower progression assuming the first level was free, while the actual game required 5 energy.

---

## How It Works Now

### Data Flow Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│   CSV Files     │    │   Game Data      │    │   Actual Game  │
│  (Authoritative)│───▶│     Store        │───▶│   Interface    │
└─────────────────┘    └──────────────────┘    └────────────────┘
                                                         ▲
                                                         │
                                                    Uses CSV Data
                                                         │
┌─────────────────┐    ┌──────────────────┐    ┌────────────────┐
│  Hardcoded      │    │  Simulation      │    │   Simulation   │
│  Parameters     │───▶│    Engine        │───▶│    Results     │
│ (Disconnected)  │    │                  │    │                │
└─────────────────┘    └──────────────────┘    └────────────────┘
                                                         ▲
                                                         │
                                                  Uses Hardcoded Data
                                                         │
                                                    ❌ MISMATCH
```

### Current Hardcoded Parameters in SimulationEngine

```typescript
// Line ~215 - Tower progression costs
reachLevelEnergy: [5, 50, 200, 1000]

// Line ~190 - Farm system parameters  
farm: {
  baseWaterCost: 1,
  energyPerCrop: 2,
  // ... many more hardcoded values
}

// Line ~250 - Helper system parameters
helper: {
  baseHireCost: 100,
  costMultiplier: 1.5,
  // ... efficiency rates, etc.
}
```

These arrays contain dozens of gameplay parameters that **should** come from CSV files but are instead manually maintained.

---

## Root Cause Analysis

### Historical Development Pattern

1. **Phase 1-3**: Basic simulation with minimal parameters
2. **Phase 4-6**: CSV data system developed for game UI
3. **Phase 7-8**: Simulation complexity increased, parameters added directly to engine
4. **Phase 9**: Energy economy bug reveals the divergence

### Why This Happened

- **Separation of Concerns**: Simulation development happened in parallel with data system development
- **Performance Assumptions**: Developers may have assumed direct parameter access was faster than CSV lookups
- **Lack of Integration**: No architectural mandate to use unified data sources
- **Technical Debt**: Quick fixes were made directly in simulation code rather than addressing data integration

---

## Impact Assessment

### Immediate Consequences

1. **Simulation Inaccuracy**: Balance testing uses different values than actual game
2. **Maintenance Overhead**: Changes must be made in two places
3. **Bug Introduction**: Manual synchronization is error-prone
4. **Development Friction**: Developers must know about both systems

### Example Scenarios Where This Fails

1. **Balance Tuning**: Designer changes tower costs in CSV, but simulation still uses old hardcoded values
2. **New Content**: Adding new actions requires updates in both CSV and simulation parameters
3. **Data Validation**: No automatic verification that simulation matches game data
4. **Regression Testing**: Simulation results may not reflect actual gameplay experience

---

## Potential Solution Approaches

### Approach 1: Simulation Engine Refactor (Recommended)

**Concept**: Make SimulationEngine a consumer of the existing game data system.

**Implementation Ideas**:
- Import `useGameData` composable into SimulationEngine
- Replace hardcoded arrays with dynamic lookups: `getItemById('tower_reach_1').energyCost`
- Add CSV data validation step before simulation runs
- Cache frequently accessed values for performance

**Pros**:
- Single source of truth maintained
- Automatic synchronization with CSV changes
- Leverages existing, well-tested data infrastructure
- Reduces code duplication

**Cons**:
- Requires significant refactoring of SimulationEngine
- May need performance optimization for frequent lookups
- Breaking changes to simulation initialization

### Approach 2: Parameter Synchronization System

**Concept**: Build tooling to automatically sync CSV data to hardcoded parameters.

**Implementation Ideas**:
- Build script to extract CSV values and generate TypeScript parameter objects
- Add validation step to compare CSV vs hardcoded values
- Automated tests to catch divergence
- CI/CD integration to regenerate parameters on CSV changes

**Pros**:
- Minimal changes to existing simulation code
- Can maintain performance characteristics
- Gradual migration possible

**Cons**:
- Still maintains data duplication
- Adds complexity to build process
- Requires discipline to run sync process consistently

### Approach 3: Unified Parameter Configuration

**Concept**: Create a new parameter management system that serves both game and simulation.

**Implementation Ideas**:
- Abstract parameter interface that can load from CSV or override values
- Configuration system for simulation-specific parameter adjustments
- Game and simulation both use same parameter service
- Support for A/B testing scenarios

**Pros**:
- Clean architectural separation
- Supports both standard and experimental parameters
- Maintains flexibility for simulation-specific needs

**Cons**:
- Most complex solution
- Requires changes to both game and simulation systems
- May be over-engineered for current needs

### Approach 4: CSV-First Development

**Concept**: Establish CSV files as the authoritative source and eliminate hardcoded parameters entirely.

**Implementation Ideas**:
- Add simulation-specific columns to existing CSV files
- Create new CSV files for simulation parameters not related to game actions
- Build CSV validation and type generation tools
- Establish development practices around CSV-first parameter management

**Pros**:
- Clear data governance model
- Non-programmers can adjust simulation parameters
- Version control friendly
- Supports data-driven development

**Cons**:
- May require CSV schema changes
- Learning curve for developers accustomed to code-based configuration
- Need robust CSV validation tools

---

## Recommendations for Resolution

### Immediate Actions (Phase 9)

1. **Document All Hardcoded Parameters**: Catalog every hardcoded value in SimulationEngine and identify its CSV equivalent
2. **Add Validation Tests**: Create tests that compare key hardcoded values against CSV data
3. **Manual Sync Critical Values**: Ensure energy costs, material requirements, and progression gates match CSV data

### Medium-term Actions (Phase 10)

1. **Prototype Approach 1**: Implement dynamic CSV lookup for one parameter category (e.g., tower costs)
2. **Performance Testing**: Measure impact of CSV lookups vs hardcoded arrays
3. **Developer Guidelines**: Establish practices for future parameter additions

### Long-term Actions (Phase 11+)

1. **Full Architectural Migration**: Implement chosen solution approach
2. **Tooling Development**: Build supporting tools for chosen approach
3. **Documentation Update**: Revise all simulation documentation to reflect new data architecture

---

## Success Criteria

A successful resolution should achieve:

1. **Data Consistency**: Simulation uses identical values to actual game
2. **Single Source of Truth**: Parameters defined in one place only
3. **Maintainability**: Changes require updates in one location only
4. **Performance**: No significant performance degradation
5. **Developer Experience**: Clear, simple process for parameter management
6. **Validation**: Automated verification of data consistency

---

## Conclusion

The hardcoded data architecture issue represents a critical technical debt that undermines the reliability of the TimeHero Simulator's balance testing capabilities. While several solution approaches exist, the fundamental requirement is establishing a single source of truth for game parameters.

The severity of this issue was demonstrated by the Phase 9E energy economy bug, where simulation and game used different tower progression costs. This type of discrepancy can invalidate months of balance testing work.

Resolution of this issue should be prioritized to ensure the simulator serves its intended purpose of accurate game balance analysis and prediction.

---

**Document Version**: 1.0  
**Date**: September 2, 2025  
**Phase**: 9E Post-Mortem  
**Author**: GitHub Copilot  
**Review Status**: Draft
