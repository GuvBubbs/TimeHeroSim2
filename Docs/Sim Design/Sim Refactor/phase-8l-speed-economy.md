# Phase 8L: Simulation Speed & Core Economy Fixes

## Overview
Fix critical simulation speed issues and implement dynamic logging controls. Verify and correct the core economic model to match game design.

## Priority: IMMEDIATE - Foundation for all other testing

## 1. Simulation Speed Calibration

### Current Problem
- Simulation runs too fast even at 0.5x speed
- Makes debugging and observation difficult
- Logging overwhelms console in seconds

### Target Speed Settings
```javascript
// Each tick = 30 seconds of game time (0.5 minutes)
// 1 game day = 1440 minutes = 2880 ticks

const SPEED_CONFIGURATIONS = {
  '0.5x': {
    realSecondsPerGameDay: 576,    // 9.6 real minutes (cleaner with 5 ticks/sec)
    ticksPerSecond: 5,              // 2880 ticks / 576 seconds
    tickDurationMs: 200             // 1000ms / 5
  },
  '1x': {
    realSecondsPerGameDay: 288,    // 4.8 real minutes
    ticksPerSecond: 10,             // 2880 ticks / 288 seconds
    tickDurationMs: 100             // 1000ms / 10
  },
  '2x': {
    realSecondsPerGameDay: 144,    // 2.4 real minutes
    ticksPerSecond: 20,
    tickDurationMs: 50
  },
  '5x': {
    realSecondsPerGameDay: 57.6,   // ~1 real minute
    ticksPerSecond: 50,
    tickDurationMs: 20
  },
  'max': {
    realSecondsPerGameDay: 12,     // 12 seconds
    ticksPerSecond: 240,
    tickDurationMs: 4.17
  }
}
```

### Implementation Requirements
- Update SimulationBridge tick timing
- Ensure smooth animation at all speeds
- Add real-time clock display showing game time progression
- Display "Day X of 21" prominently

## 2. Dynamic Logging System

### UI Component Addition
Add to LiveMonitorView.vue control panel:
```vue
<div class="flex items-center gap-2">
  <label class="text-sm text-gray-400">Log Level:</label>
  <select 
    v-model="logLevel" 
    @change="updateLogLevel"
    class="bg-gray-700 text-white px-2 py-1 rounded text-sm"
  >
    <option value="verbose">Verbose (Debug)</option>
    <option value="normal">Normal</option>
    <option value="reduced">Reduced</option>
    <option value="minimal">Minimal</option>
    <option value="errors">Errors Only</option>
  </select>
  
  <label class="text-sm text-gray-400 ml-4">Categories:</label>
  <div class="flex gap-2">
    <label class="text-xs">
      <input type="checkbox" v-model="logCategories.farming"> Farm
    </label>
    <label class="text-xs">
      <input type="checkbox" v-model="logCategories.combat"> Combat
    </label>
    <label class="text-xs">
      <input type="checkbox" v-model="logCategories.crafting"> Craft
    </label>
    <label class="text-xs">
      <input type="checkbox" v-model="logCategories.economy"> Economy
    </label>
  </div>
</div>
```

### Logging Rules by Speed
```javascript
const SPEED_TO_LOG_LEVEL = {
  '0.5x': 'normal',     // Can handle more logs at slow speed
  '1x': 'reduced',      
  '2x': 'minimal',
  '5x': 'minimal',
  'max': 'errors'       // Only errors at max speed
}
```

### Log Categories
- **farming**: Planting, watering, harvesting, growth stages
- **combat**: Damage, enemy spawns, boss mechanics
- **crafting**: Forge operations, material refinement
- **economy**: Gold/energy transactions, purchases
- **decisions**: AI decision making (verbose only)
- **system**: Save/load, initialization, errors (always on)

## 3. Core Economic Model Verification

### Energy Economy Rules
Verify these core principles are working:

1. **Energy Sources** (ONLY from harvests):
   - Carrot: 1 energy
   - Potato: 2 energy  
   - Cabbage: 3 energy
   - Corn: 5 energy
   - Strawberry: 8 energy
   - Beetroot: 35 energy
   - NO passive regeneration
   - NO other sources

2. **Free Actions** (Time cost only):
   - Planting seeds (duration from CSV)
   - Harvesting crops (instant, adds energy)
   - Watering plants (instant if water available)

3. **Energy Consumers**:
   - Adventures (10-4000 energy based on route/length)
   - Farm cleanups (15-50000 energy based on cleanup)
   - Mining (2-1024 energy/min based on depth)
   - Crafting (20-15000 energy based on item)
   - Helper training (50-16000 energy based on level)

4. **Gold Sources** (ONLY from adventures):
   - Meadow Path: 25/75/150 gold (S/M/L)
   - Pine Vale: 60/150/300 gold
   - Volcano Core: 6000/15000/30000 gold
   - NO other gold sources initially

### Starting Resources Validation
```javascript
const CORRECT_STARTING_STATE = {
  gold: 50,          // Bootstrap gold to buy first weapon blueprint
  energy: 100,       // Enough for ~10 plantings
  water: 20,         // Base water tank
  plots: 3,          // From farm_stages.csv
  seeds: {
    carrot: 10,      // Tutorial seeds
    radish: 5        // Tutorial seeds  
  }
}

// Blueprint costs (adjusted to break circular dependency)
const EARLY_BLUEPRINTS = {
  blueprint_sword_i: 50,    // Can buy immediately with starting gold
  blueprint_hoe: 100,       // Requires 2 successful adventures
  blueprint_hammer: 150,    // Requires 3-4 successful adventures
}
```

## 4. Material Trading System

### Material Trader Implementation
Location: Town vendor (Exchange Post)

```javascript
const MATERIAL_TRADE_RATES = {
  // Sell materials for gold
  sellForGold: {
    stone: { price: 2, minQty: 10 },
    wood: { price: 3, minQty: 10 },
    copper: { price: 5, minQty: 5 },
    iron: { price: 10, minQty: 5 },
    silver: { price: 25, minQty: 3 },
    crystal: { price: 100, minQty: 1 },
    mythril: { price: 500, minQty: 1 },
    obsidian: { price: 1000, minQty: 1 }
  },
  
  // Trade within tiers
  withinTier: {
    common: { rate: '2:1', materials: ['stone', 'wood'] },
    metal: { rate: '2:1', materials: ['copper', 'iron'] },
    rare: { rate: '3:1', materials: ['silver', 'crystal'] },
    epic: { rate: '3:1', materials: ['mythril', 'obsidian'] }
  },
  
  // Cross-tier trading (late game)
  crossTier: {
    upTier: '5:1',    // 5 iron -> 1 silver
    downTier: '1:3'   // 1 silver -> 3 iron
  }
}
```

### Emergency Supplies
Agronomist emergency wood bundles:
```javascript
const EMERGENCY_WOOD = {
  small: { cost: 50, amount: 10, prereq: null },
  medium: { cost: 200, amount: 50, prereq: 'farm_stage_2' },
  large: { cost: 800, amount: 250, prereq: 'farm_stage_3' }
}
```

## Testing Checklist

### Speed & Logging
- [ ] 0.5x speed takes ~9.6 minutes for one game day (5 ticks/second)
- [ ] Speed transitions are smooth without tick buildup
- [ ] Log level dropdown appears and functions
- [ ] Category checkboxes filter logs correctly
- [ ] Console remains readable at all speeds
- [ ] Auto-adjustment of log level with speed works

### Economic Model  
- [ ] Starting resources match design (50 gold, 100 energy, 3 plots)
- [ ] Planting is FREE (no energy cost)
- [ ] Harvesting is FREE and adds correct energy
- [ ] Energy ONLY comes from harvests
- [ ] Gold ONLY comes from adventures initially
- [ ] No passive energy regeneration occurs
- [ ] Material trader appears in town
- [ ] Material selling generates gold correctly
- [ ] Emergency wood bundles available at Agronomist
- [ ] First weapon blueprint purchase works (Sword I = 50g)

## Success Metrics
- Console logs remain under 100 lines per game day at normal speed
- One complete day simulation is observable in ~9.6 minutes at 0.5x (5 ticks/second)
- Energy economy matches design document exactly
- Material trading provides late-game gold alternative
- No "free energy" exploits exist
- Bootstrap economy works: 50g → weapon blueprint → adventure → progression

## Files to Modify
1. `src/views/LiveMonitorView.vue` - Add logging controls
2. `src/utils/SimulationBridge.ts` - Fix tick timing
3. `src/utils/SimulationEngine.ts` - Update logging system
4. `src/utils/systems/EconomySystem.ts` - Verify energy/gold rules
5. `src/workers/simulation.worker.ts` - Adjust timing loop
6. `src/utils/systems/TownSystem.ts` - Add material trader