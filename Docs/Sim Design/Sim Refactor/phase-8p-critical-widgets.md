# Phase 8P: Critical Widget Fixes

## Overview
Fix critical Live Monitor widgets that are broken or have major usability issues. Focus on data flow, layout problems, and missing functionality.

## Priority: CRITICAL - UI is unusable without these fixes

## 1. Current Action Widget Fix

### Problem
Widget shows "No active action" despite ongoing activities.

### Root Cause
Action state not propagating from SimulationEngine through SimulationBridge to widget.

### Solution
```typescript
// In SimulationEngine.ts
interface ActionState {
  type: 'planting' | 'harvesting' | 'watering' | 'combat' | 'crafting' | 'mining' | 'idle'
  description: string
  progress: number  // 0-100
  duration: number  // total seconds
  remaining: number // seconds left
}

// In WidgetDataAdapter.ts
static transformCurrentAction(gameState: GameState): ActionState {
  // Check all possible action sources
  if (gameState.combat?.active) {
    return {
      type: 'combat',
      description: `Fighting in ${gameState.combat.route}`,
      progress: gameState.combat.progress,
      duration: gameState.combat.totalDuration,
      remaining: gameState.combat.remaining
    }
  }
  
  if (gameState.crafting?.active) {
    return {
      type: 'crafting',
      description: `Crafting ${gameState.crafting.item}`,
      progress: gameState.crafting.progress,
      duration: gameState.crafting.duration,
      remaining: gameState.crafting.remaining
    }
  }
  
  // Check other action types...
  
  return {
    type: 'idle',
    description: 'Waiting for next decision',
    progress: 0,
    duration: 0,
    remaining: 0
  }
}
```

### Widget Display
```vue
<template>
  <div class="current-action-widget">
    <div v-if="action.type !== 'idle'" class="action-active">
      <div class="action-icon">{{ getActionIcon(action.type) }}</div>
      <div class="action-text">{{ action.description }}</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{width: action.progress + '%'}"></div>
      </div>
      <div class="time-remaining">{{ formatTime(action.remaining) }}</div>
    </div>
    <div v-else class="action-idle">
      ⏸️ Waiting for next check-in
    </div>
  </div>
</template>
```

## 2. Current Location Widget Layout

### Problem
Text being cut off, unclear what should be displayed.

### Solution
```vue
<template>
  <div class="location-widget">
    <div class="location-header">
      <span class="icon">{{ getScreenIcon(currentScreen) }}</span>
      <span class="screen-name">{{ currentScreen }}</span>
    </div>
    <div class="location-stats">
      <div class="stat-row">
        <span class="label">Time here:</span>
        <span class="value">{{ formatTime(screenTime) }}</span>
      </div>
      <div class="stat-row">
        <span class="label">Visits today:</span>
        <span class="value">{{ visitsToday }}</span>
      </div>
      <div class="stat-row">
        <span class="label">Total visits:</span>
        <span class="value">{{ totalVisits }}</span>
      </div>
    </div>
  </div>
</template>

<style>
.location-widget {
  padding: 8px;
}
.location-header {
  font-weight: bold;
  margin-bottom: 4px;
}
.stat-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  line-height: 1.4;
}
</style>
```

## 3. Resources Widget Optimization

### Problem
Can't see materials, seeds overflowing, poor layout.

### Solution - Compact Multi-Column Layout
```vue
<template>
  <div class="resources-widget">
    <!-- Primary Resources (always visible) -->
    <div class="primary-resources">
      <div class="resource-pair">
        <span class="resource">⚡ {{ energy }}/{{ energyMax }}</span>
        <span class="resource">💰 {{ gold }}</span>
      </div>
      <div class="resource-pair">
        <span class="resource">💧 {{ water }}/{{ waterMax }}</span>
        <span class="resource">🌾 {{ totalSeeds }}</span>
      </div>
    </div>
    
    <!-- Materials (scrollable if many) -->
    <div class="materials-section" v-if="hasMaterials">
      <div class="section-header">Materials:</div>
      <div class="materials-grid">
        <span v-for="(amount, type) in materials" :key="type" class="material">
          {{ getMaterialIcon(type) }} {{ amount }}
        </span>
      </div>
    </div>
    
    <!-- Seeds (expandable) -->
    <div class="seeds-section" v-if="hasSeeds">
      <div class="section-header" @click="seedsExpanded = !seedsExpanded">
        Seeds ({{ Object.keys(seeds).length }} types) {{ seedsExpanded ? '▼' : '▶' }}
      </div>
      <div v-show="seedsExpanded" class="seeds-grid">
        <span v-for="(amount, type) in seeds" :key="type" class="seed">
          {{ getSeedIcon(type) }} {{ amount }}
        </span>
      </div>
    </div>
  </div>
</template>

<style>
.primary-resources {
  margin-bottom: 8px;
}
.resource-pair {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2px;
}
.materials-grid, .seeds-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
  gap: 4px;
  max-height: 60px;
  overflow-y: auto;
}
.material, .seed {
  font-size: 0.85em;
  white-space: nowrap;
}
</style>
```

## 4. Equipment Widget Complete Overhaul

### Problem
Not showing all tools/weapons/armor, missing indicators.

### Solution - Show All Possible Equipment
```vue
<template>
  <div class="equipment-widget">
    <!-- Tools Section -->
    <div class="tools-section">
      <div class="section-label">Tools:</div>
      <div class="tools-grid">
        <ToolSlot name="Hoe" :level="tools.hoe" />
        <ToolSlot name="Hammer" :level="tools.hammer" />
        <ToolSlot name="Axe" :level="tools.axe" />
        <ToolSlot name="Shovel" :level="tools.shovel" />
        <ToolSlot name="Pickaxe" :level="tools.pickaxe" />
        <ToolSlot name="WaterCan" :level="tools.watercan" />
      </div>
    </div>
    
    <!-- Weapons Section -->
    <div class="weapons-section">
      <div class="section-label">Weapons:</div>
      <div class="weapons-grid">
        <WeaponSlot type="Spear" :level="weapons.spear" />
        <WeaponSlot type="Sword" :level="weapons.sword" />
        <WeaponSlot type="Bow" :level="weapons.bow" />
        <WeaponSlot type="Crossbow" :level="weapons.crossbow" />
        <WeaponSlot type="Wand" :level="weapons.wand" />
      </div>
    </div>
    
    <!-- Armor Section -->
    <div class="armor-section">
      <div class="section-label">Armor:</div>
      <div class="armor-slots">
        <ArmorSlot v-for="i in 3" :key="i" :armor="armor[i-1]" :slot="i" />
      </div>
    </div>
  </div>
</template>

<script>
// Tool component shows: - / 🔨 / 🛠️ / 🏆
const ToolSlot = {
  props: ['name', 'level'],
  template: `
    <div class="tool-slot" :title="name">
      <span v-if="!level">-</span>
      <span v-else-if="level === 'base'">🔨</span>
      <span v-else-if="level === 'plus'">🛠️</span>
      <span v-else-if="level === 'master'">🏆</span>
      <div class="slot-label">{{ name.slice(0,3) }}</div>
    </div>
  `
}

// Weapon shows: - / 1️⃣ through 🔟
const WeaponSlot = {
  props: ['type', 'level'],
  template: `
    <div class="weapon-slot" :title="type + ' Level ' + (level || 0)">
      <span v-if="!level">-</span>
      <span v-else>{{ getNumberEmoji(level) }}</span>
      <div class="slot-label">{{ type.slice(0,3) }}</div>
    </div>
  `,
  methods: {
    getNumberEmoji(level) {
      const emojis = ['', '1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟']
      return emojis[Math.min(level, 10)]
    }
  }
}

// Armor shows empty slot or armor info
const ArmorSlot = {
  props: ['armor', 'slot'],
  template: `
    <div class="armor-slot" :class="{empty: !armor}">
      <div v-if="!armor" class="empty-slot">
        <span class="slot-number">{{ slot }}</span>
        <span class="empty-icon">⬚</span>
      </div>
      <div v-else class="armor-info">
        <span class="armor-icon">🛡️</span>
        <span class="defense">{{ armor.defense }}</span>
        <span class="effect" :title="armor.effect">{{ getEffectIcon(armor.effect) }}</span>
      </div>
    </div>
  `
}
</script>

<style>
.tools-grid, .weapons-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}
.tool-slot, .weapon-slot, .armor-slot {
  border: 1px solid #444;
  padding: 4px;
  text-align: center;
  border-radius: 4px;
}
.slot-label {
  font-size: 0.7em;
  margin-top: 2px;
}
.armor-slots {
  display: flex;
  gap: 8px;
}
.empty-slot {
  opacity: 0.3;
}
</style>
```

## 5. Farm Visualizer Stage-Based Layout

### Problem
Fixed 5x5 grid instead of showing actual farm stages and plot counts.

### Solution - Dynamic Stage-Based Grid
```vue
<template>
  <div class="farm-visualizer">
    <!-- Stage 1: 8 plots (1 row) -->
    <div class="farm-row stage-1">
      <PlotCell v-for="i in 8" :key="`s1-${i}`" 
                :plot="getPlot(i-1)" 
                :unlocked="plotCount >= i" />
    </div>
    
    <!-- Stage 2: 12 plots (1 row) -->
    <div class="farm-row stage-2">
      <PlotCell v-for="i in 12" :key="`s2-${i}`" 
                :plot="getPlot(i+7)" 
                :unlocked="plotCount >= i+8" />
    </div>
    
    <!-- Stage 3: 20 plots (1 row) -->
    <div class="farm-row stage-3">
      <PlotCell v-for="i in 20" :key="`s3-${i}`" 
                :plot="getPlot(i+19)" 
                :unlocked="plotCount >= i+20" />
    </div>
    
    <!-- Stage 4: 25 plots (1 row) -->
    <div class="farm-row stage-4">
      <PlotCell v-for="i in 25" :key="`s4-${i}`" 
                :plot="getPlot(i+39)" 
                :unlocked="plotCount >= i+40" />
    </div>
    
    <!-- Stage 5: 25 plots (1 row) -->
    <div class="farm-row stage-5">
      <PlotCell v-for="i in 25" :key="`s5-${i}`" 
                :plot="getPlot(i+64)" 
                :unlocked="plotCount >= i+65" />
    </div>
    
    <!-- Legend -->
    <div class="farm-legend">
      <span>🟩 Ready</span>
      <span>🌱 Growing</span>
      <span>⬜ Locked</span>
      <span>🌊 Watered</span>
      <span>🏜️ Dry</span>
    </div>
  </div>
</template>

<script>
const PlotCell = {
  props: ['plot', 'unlocked'],
  template: `
    <div class="plot-cell" :class="plotClass" :title="plotTooltip">
      {{ plotIcon }}
    </div>
  `,
  computed: {
    plotClass() {
      if (!this.unlocked) return 'locked'
      if (!this.plot) return 'empty'
      if (this.plot.ready) return 'ready'
      if (this.plot.growing) return 'growing'
      return this.plot.watered ? 'watered' : 'dry'
    },
    plotIcon() {
      if (!this.unlocked) return '⬜'
      if (!this.plot) return '⬛'
      if (this.plot.ready) return '🟩'
      if (this.plot.growing) return '🌱'
      return this.plot.watered ? '🌊' : '🏜️'
    },
    plotTooltip() {
      if (!this.unlocked) return 'Locked - expand farm'
      if (!this.plot) return 'Empty plot'
      if (this.plot.crop) return `${this.plot.crop} - ${this.plot.progress}%`
      return 'Empty plot'
    }
  }
}
</script>

<style>
.farm-visualizer {
  padding: 8px;
}
.farm-row {
  display: flex;
  gap: 2px;
  margin-bottom: 4px;
  justify-content: center;
}
.plot-cell {
  width: 16px;
  height: 16px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: help;
}
.plot-cell.locked {
  opacity: 0.2;
}
.farm-legend {
  display: flex;
  gap: 12px;
  font-size: 0.8em;
  margin-top: 8px;
  justify-content: center;
}
</style>
```

## 6. Next Decision Widget Fix

### Problem
Never shows anything, decision queue not visible.

### Solution
```typescript
// In SimulationEngine.ts
getNextDecision(): DecisionInfo | null {
  const nextCheckIn = this.getNextCheckInTime()
  const pendingActions = this.evaluateAvailableActions()
  
  if (pendingActions.length === 0) {
    return {
      action: 'Waiting',
      reason: 'No actions available',
      nextCheck: nextCheckIn
    }
  }
  
  const topAction = pendingActions[0]
  return {
    action: topAction.type,
    reason: topAction.reasoning,
    nextCheck: nextCheckIn,
    priority: topAction.score
  }
}

// In widget
<template>
  <div class="next-decision-widget">
    <div class="decision-header">🎯 Next Action</div>
    <div v-if="decision" class="decision-content">
      <div class="action-type">{{ getActionIcon(decision.action) }} {{ decision.action }}</div>
      <div class="action-reason">{{ decision.reason }}</div>
      <div class="next-check">Next check: {{ formatTime(decision.nextCheck) }}</div>
    </div>
    <div v-else class="no-decision">
      Calculating...
    </div>
  </div>
</template>
```

## Testing Checklist

### Current Action Widget
- [ ] Shows active farming actions (planting, watering, harvesting)
- [ ] Shows combat progress during adventures
- [ ] Shows crafting progress at forge
- [ ] Shows mining depth and materials
- [ ] Shows "Waiting" when idle
- [ ] Progress bar updates smoothly

### Current Location Widget
- [ ] All text visible (no cutoff)
- [ ] Shows current screen correctly
- [ ] Time tracking works
- [ ] Visit counts accurate

### Resources Widget
- [ ] Primary resources always visible (energy, gold, water)
- [ ] Materials show when available
- [ ] Seeds collapsible to save space
- [ ] No overflow or cutoff

### Equipment Widget
- [ ] All 6 tools shown (- / 🔨 / 🛠️ / 🏆)
- [ ] All 5 weapons shown (- / 1️⃣-🔟)
- [ ] 3 armor slots always visible
- [ ] Tooltips show details

### Farm Visualizer
- [ ] Shows 8 plots in row 1
- [ ] Shows 12 plots in row 2
- [ ] Shows 20 plots in row 3
- [ ] Shows 25 plots in rows 4 & 5
- [ ] Locked plots are grayed out
- [ ] Crop states visible

### Next Decision Widget
- [ ] Shows next planned action
- [ ] Updates when decision changes
- [ ] Shows reasoning
- [ ] Shows next check-in time

## Success Metrics
- All widgets show relevant data
- No text cutoff or overflow
- Equipment tracking accurate
- Farm visualization matches game state
- Decision queue visible to player
- Current action always shows something meaningful

## Files to Modify
1. `src/views/widgets/CurrentActionWidget.vue` - Complete rewrite
2. `src/views/widgets/CurrentLocationWidget.vue` - Layout fixes
3. `src/views/widgets/ResourcesWidget.vue` - Compact layout
4. `src/views/widgets/EquipmentWidget.vue` - Show all items
5. `src/views/widgets/FarmVisualizerWidget.vue` - Stage-based grid
6. `src/views/widgets/NextDecisionWidget.vue` - Connect to engine
7. `src/utils/WidgetDataAdapter.ts` - Transform all needed data
8. `src/utils/SimulationEngine.ts` - Expose decision queue