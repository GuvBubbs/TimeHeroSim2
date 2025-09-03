# Time Hero - Starting Conditions Reference
## Phase 9A Update

### Starting Resources
- **Energy**: 3 (gain through harvesting crops)
- **Gold**: 75 (enough to buy Sword I & Tower Reach 1 blueprints)
- **Water**: 0 (pump to fill tank)
- **Seeds**: 2 total
  - 1 Carrot seed
  - 1 Radish seed
- **Plots**: 3 (leaves 1 empty plot, encouraging seed collection)

### Tower Access
- **Tower Reach 1**: 25 gold
  - Unlocks Ground Level (Seed Level 0)
  - Provides access to Carrot and Radish seeds
- **Tower Reach 2**: 100 gold
  - Unlocks Breeze band (Seed Level 1)
  - Provides access to Potato, Cabbage, Turnip seeds

### Early Game Progression
1. Player starts with 2 seeds for 3 plots
2. Plants initial seeds, has 1 empty plot
3. Pumps water (free action)
4. Harvests crops for energy
5. Goes to town to buy the blueprint for tower reach 1.
6. Goes back to the farm, spends 5 energy to build the tower
7. Can catch more seeds at tower (Reach 1)
8. Plants seeds to gain energy.
9. Uses 50 starting gold to buy Sword I blueprint in town.
10. Use forge to craft sword.
11. Goes on adventures with sword. 

### Design Philosophy
- Players always have a viable action (no deadlock states)
- Starting with 2 seeds for 3 plots creates immediate need for tower
- Free Tower Reach 1 ensures seed collection is always possible
- 75 gold enables first combat upgrade (Sword I) + Tower Reach upgrades
- 3 starting energy forces immediate farming engagement

---

## Implementation Status

**✅ CORRECTED** - Phase 10A (September 3, 2025)

These starting conditions are now properly implemented in the codebase. During Phase 10A testing, it was discovered that SimulationEngine.ts had incorrect hardcoded starting resources that didn't match this specification. The following corrections were made:

**Fixed Starting Resources**:
- Energy: 3/100 ✅ (was incorrectly 100/100)
- Gold: 75 ✅ (was incorrectly 50)
- Water: 0/20 ✅ (was incorrectly 20/20)
- Seeds: carrot: 1, radish: 1 ✅ (was incorrectly turnip: 10, carrot: 5, potato: 3)
- Materials: (empty) ✅ (was incorrectly wood: 20, stone: 10)

The application now starts with the exact conditions specified in this document, providing the intended game balance and progression flow.
