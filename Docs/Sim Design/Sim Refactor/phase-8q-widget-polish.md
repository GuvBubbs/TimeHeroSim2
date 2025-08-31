# Phase 8Q: Widget Polish & Action Log

## Overview
Complete the Live Monitor by fixing the Action Log, implementing dynamic Mini Upgrade Tree, and fixing Screen Time aggregation.

## Priority: HIGH - User experience and monitoring capability

## 1. Action Log Complete Fix

### Problems
- No icons for actions
- Wrong chronological order (old at top)
- Auto-scroll not working
- Redundant timestamp field

### Solution - Proper Event Log
```vue
<template>
  <div class="action-log-widget">
    <div class="log-header">
      <span>📋 Action Log</span>
      <button @click="toggleAutoScroll" class="auto-scroll-btn" :class="{active: autoScroll}">
        {{ autoScroll ? '🔒' : '🔓' }} Auto-scroll
      </button>
      <button @click="clearLog" class="clear-btn">Clear</button>
    </div>
    
    <div class="log-container" ref="logContainer">
      <TransitionGroup name="log-fade" tag="div">
        <div v-for="(entry, index) in reversedEntries" 
             :key="entry.id"
             class="log-entry"
             :class="entry.category">
          <span class="entry-icon">{{ getActionIcon(entry.type) }}</span>
          <span class="entry-text">{{ entry.description }}</span>
          <span class="entry-tick">T{{ entry.tick }}</span>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      entries: [],
      autoScroll: true,
      maxEntries: 100
    }
  },
  
  computed: {
    reversedEntries() {
      // Most recent at top
      return [...this.entries].reverse()
    }
  },
  
  methods: {
    addEntry(action) {
      const entry = {
        id: `${action.tick}-${Date.now()}`,
        tick: action.tick,
        type: action.type,
        category: action.category,
        description: action.description,
        timestamp: Date.now()
      }
      
      this.entries.push(entry)
      
      // Limit entries to prevent memory issues
      if (this.entries.length > this.maxEntries) {
        this.entries.shift()
      }
      
      if (this.autoScroll) {
        this.$nextTick(() => {
          this.$refs.logContainer.scrollTop = 0  // Scroll to top (newest)
        })
      }
    },
    
    getActionIcon(type) {
      const icons = {
        // Farm actions
        plant: '🌱',
        water: '💧',
        harvest: '🌾',
        cleanup: '🧹',
        
        // Combat actions
        combat: '⚔️',
        victory: '🏆',
        defeat: '💀',
        
        // Craft actions
        craft: '🔨',
        refine: '🔥',
        forge: '⚒️',
        
        // Town actions
        purchase: '💰',
        upgrade: '📈',
        
        // Mine actions
        mine: '⛏️',
        
        // Tower actions
        catch: '🪝',
        
        // Helper actions
        helper: '👥',
        train: '📚',
        
        // Economy
        gold: '🪙',
        energy: '⚡',
        
        // Default
        default: '•'
      }
      return icons[type] || icons.default
    },
    
    toggleAutoScroll() {
      this.autoScroll = !this.autoScroll
    },
    
    clearLog() {
      this.entries = []
    }
  },
  
  mounted() {
    // Listen for action events from simulation
    this.$root.$on('action-executed', this.addEntry)
  },
  
  beforeDestroy() {
    this.$root.$off('action-executed', this.addEntry)
  }
}
</script>

<style>
.action-log-widget {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.log-header {
  display: flex;
  justify-content: space-between;
  padding: 8px;
  border-bottom: 1px solid #444;
}

.auto-scroll-btn {
  font-size: 0.9em;
  padding: 2px 6px;
  background: #333;
  border: 1px solid #555;
  cursor: pointer;
}

.auto-scroll-btn.active {
  background: #2a4d3a;
  border-color: #4a7d5a;
}

.log-container {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.log-entry {
  display: flex;
  align-items: center;
  padding: 3px 6px;
  margin-bottom: 2px;
  background: rgba(255, 255, 255, 0.02);
  border-left: 2px solid transparent;
  font-size: 0.9em;
  transition: all 0.2s;
}

.log-entry:hover {
  background: rgba(255, 255, 255, 0.05);
}

/* Category colors */
.log-entry.farm { border-left-color: #4CAF50; }
.log-entry.combat { border-left-color: #f44336; }
.log-entry.craft { border-left-color: #FF9800; }
.log-entry.economy { border-left-color: #FFD700; }

.entry-icon {
  margin-right: 6px;
  font-size: 1.1em;
}

.entry-text {
  flex: 1;
}

.entry-tick {
  font-size: 0.8em;
  opacity: 0.5;
  margin-left: 8px;
}

/* Transition animations */
.log-fade-enter-active {
  transition: all 0.3s ease;
}

.log-fade-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.log-fade-leave-active {
  transition: all 0.3s ease;
}

.log-fade-leave-to {
  transform: translateX(-100%);
  opacity: 0;
}
</style>
```

## 2. Mini Upgrade Tree Dynamic Implementation

### Problem
Static display, not reading actual game data.

### Solution - Dynamic Minimap
```vue
<template>
  <div class="mini-upgrade-tree">
    <div class="tree-header">🌳 Upgrade Progress</div>
    
    <div class="tree-container" @click="openFullTree">
      <svg :viewBox="`0 0 ${viewWidth} ${viewHeight}`" class="tree-svg">
        <!-- Connections -->
        <line v-for="conn in connections" 
              :key="`conn-${conn.from}-${conn.to}`"
              :x1="getNodeX(conn.from)"
              :y1="getNodeY(conn.from)"
              :x2="getNodeX(conn.to)"
              :y2="getNodeY(conn.to)"
              :class="getConnectionClass(conn)"
              stroke-width="1" />
        
        <!-- Nodes -->
        <g v-for="node in nodes" :key="node.id">
          <circle :cx="getNodeX(node.id)"
                  :cy="getNodeY(node.id)"
                  r="3"
                  :class="getNodeClass(node)"
                  @mouseover="showTooltip(node, $event)"
                  @mouseout="hideTooltip" />
        </g>
      </svg>
      
      <!-- Tooltip -->
      <div v-if="tooltip" class="node-tooltip" :style="tooltipStyle">
        <div class="tooltip-name">{{ tooltip.node.name }}</div>
        <div class="tooltip-status">{{ getStatusText(tooltip.node) }}</div>
      </div>
    </div>
    
    <!-- Statistics -->
    <div class="tree-stats">
      <div class="stat">
        <span class="stat-label">Unlocked:</span>
        <span class="stat-value">{{ unlockedCount }}/{{ totalCount }}</span>
      </div>
      <div class="stat">
        <span class="stat-label">Available:</span>
        <span class="stat-value">{{ availableCount }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      nodes: [],
      connections: [],
      viewWidth: 300,
      viewHeight: 150,
      tooltip: null
    }
  },
  
  computed: {
    unlockedCount() {
      return this.nodes.filter(n => n.unlocked).length
    },
    
    availableCount() {
      return this.nodes.filter(n => n.available && !n.unlocked).length
    },
    
    totalCount() {
      return this.nodes.length
    }
  },
  
  methods: {
    loadTreeData() {
      // Get actual upgrade tree data from CSV/game state
      const gameData = this.$store.state.gameData
      
      // Build simplified node list
      this.nodes = gameData.allItems
        .filter(item => this.isUpgrade(item))
        .map(item => ({
          id: item.id,
          name: item.name,
          category: item.category,
          phase: this.getPhase(item),
          unlocked: this.isUnlocked(item),
          available: this.isAvailable(item),
          x: this.calculateX(item),
          y: this.calculateY(item)
        }))
      
      // Build connections from prerequisites
      this.connections = []
      gameData.allItems.forEach(item => {
        if (item.prerequisites) {
          const prereqs = item.prerequisites.split(';')
          prereqs.forEach(prereq => {
            this.connections.push({
              from: prereq.trim(),
              to: item.id,
              unlocked: this.isUnlocked(item)
            })
          })
        }
      })
    },
    
    isUpgrade(item) {
      // Determine if item should appear in tree
      const upgradeCategories = [
        'farm_upgrades', 'tower_upgrades', 'forge_upgrades',
        'tools', 'weapons', 'helpers', 'deeds'
      ]
      return upgradeCategories.includes(item.category)
    },
    
    getPhase(item) {
      // Map items to game phases
      if (!item.prerequisites) return 'tutorial'
      
      // Check for phase gates in prerequisites
      if (item.prerequisites.includes('great_estate')) return 'endgame'
      if (item.prerequisites.includes('manor_grounds')) return 'late'
      if (item.prerequisites.includes('homestead')) return 'mid'
      if (item.prerequisites.includes('small_hold')) return 'early'
      return 'tutorial'
    },
    
    calculateX(item) {
      // Position based on phase
      const phaseX = {
        tutorial: 30,
        early: 90,
        mid: 150,
        late: 210,
        endgame: 270
      }
      return phaseX[this.getPhase(item)] || 30
    },
    
    calculateY(item) {
      // Distribute vertically within phase
      const categoryY = {
        deeds: 20,
        farm_upgrades: 40,
        tools: 60,
        weapons: 80,
        tower_upgrades: 100,
        forge_upgrades: 120,
        helpers: 140
      }
      return categoryY[item.category] || 75
    },
    
    getNodeX(nodeId) {
      const node = this.nodes.find(n => n.id === nodeId)
      return node ? node.x : 0
    },
    
    getNodeY(nodeId) {
      const node = this.nodes.find(n => n.id === nodeId)
      return node ? node.y : 0
    },
    
    getNodeClass(node) {
      if (node.unlocked) return 'node-unlocked'
      if (node.available) return 'node-available'
      return 'node-locked'
    },
    
    getConnectionClass(conn) {
      return conn.unlocked ? 'connection-unlocked' : 'connection-locked'
    },
    
    showTooltip(node, event) {
      const rect = event.target.getBoundingClientRect()
      this.tooltip = {
        node,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      }
    },
    
    hideTooltip() {
      this.tooltip = null
    },
    
    getStatusText(node) {
      if (node.unlocked) return '✅ Unlocked'
      if (node.available) return '🔓 Available'
      return '🔒 Locked'
    },
    
    openFullTree() {
      this.$router.push('/upgrade-tree')
    }
  },
  
  computed: {
    tooltipStyle() {
      if (!this.tooltip) return {}
      return {
        left: `${this.tooltip.x}px`,
        top: `${this.tooltip.y}px`
      }
    }
  },
  
  mounted() {
    this.loadTreeData()
    
    // Refresh when game state changes
    this.$store.watch(
      state => state.simulation.gameState,
      () => this.loadTreeData()
    )
  }
}
</script>

<style>
.mini-upgrade-tree {
  padding: 8px;
}

.tree-header {
  font-weight: bold;
  margin-bottom: 8px;
}

.tree-container {
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  height: 150px;
}

.tree-svg {
  width: 100%;
  height: 100%;
}

/* Node styles */
.node-locked {
  fill: #444;
  stroke: #666;
}

.node-available {
  fill: #FFD700;
  stroke: #FFA500;
  animation: pulse 2s infinite;
}

.node-unlocked {
  fill: #4CAF50;
  stroke: #2E7D32;
}

/* Connection styles */
.connection-locked {
  stroke: #444;
  opacity: 0.3;
}

.connection-unlocked {
  stroke: #4CAF50;
  opacity: 0.7;
}

/* Tooltip */
.node-tooltip {
  position: fixed;
  background: #222;
  border: 1px solid #555;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85em;
  pointer-events: none;
  transform: translate(-50%, -100%);
  z-index: 1000;
}

.tooltip-name {
  font-weight: bold;
}

.tooltip-status {
  font-size: 0.9em;
  opacity: 0.8;
}

/* Stats */
.tree-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 8px;
  font-size: 0.9em;
}

.stat-label {
  opacity: 0.7;
  margin-right: 4px;
}

.stat-value {
  font-weight: bold;
}

/* Animation */
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}
</style>
```

## 3. Screen Time Aggregation Fix

### Problem
Only tracking current screen time, not cumulative across all screens.

### Solution - Complete Time Tracking
```typescript
// In SimulationEngine.ts or dedicated TimeTracker
class ScreenTimeTracker {
  private screenTimes: Map<string, number> = new Map()
  private currentScreen: string = 'farm'
  private sessionStart: number = Date.now()
  private screenEnteredAt: number = Date.now()
  private dailyVisits: Map<string, number> = new Map()
  private totalVisits: Map<string, number> = new Map()
  
  changeScreen(newScreen: string) {
    // Update time for previous screen
    const timeOnScreen = Date.now() - this.screenEnteredAt
    const currentTime = this.screenTimes.get(this.currentScreen) || 0
    this.screenTimes.set(this.currentScreen, currentTime + timeOnScreen)
    
    // Update visit counts
    const dailyCount = this.dailyVisits.get(newScreen) || 0
    const totalCount = this.totalVisits.get(newScreen) || 0
    this.dailyVisits.set(newScreen, dailyCount + 1)
    this.totalVisits.set(newScreen, totalCount + 1)
    
    // Switch to new screen
    this.currentScreen = newScreen
    this.screenEnteredAt = Date.now()
  }
  
  getScreenStats(screen?: string) {
    const targetScreen = screen || this.currentScreen
    
    // Add current session time if asking for current screen
    let screenTime = this.screenTimes.get(targetScreen) || 0
    if (targetScreen === this.currentScreen) {
      screenTime += Date.now() - this.screenEnteredAt
    }
    
    return {
      screen: targetScreen,
      currentTime: screenTime,
      visitsToday: this.dailyVisits.get(targetScreen) || 0,
      totalVisits: this.totalVisits.get(targetScreen) || 0,
      percentage: this.getPercentage(targetScreen)
    }
  }
  
  getAllScreenStats() {
    const allScreens = ['farm', 'tower', 'town', 'adventure', 'forge', 'mine']
    return allScreens.map(screen => this.getScreenStats(screen))
  }
  
  getPercentage(screen: string) {
    const totalTime = Array.from(this.screenTimes.values()).reduce((a, b) => a + b, 0)
    const screenTime = this.screenTimes.get(screen) || 0
    return totalTime > 0 ? (screenTime / totalTime * 100).toFixed(1) : '0'
  }
  
  getTrends() {
    // Calculate which screens are visited most
    const sorted = Array.from(this.screenTimes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
    
    return {
      mostVisited: sorted[0]?.[0] || 'farm',
      timeDistribution: this.getAllScreenStats(),
      sessionDuration: Date.now() - this.sessionStart
    }
  }
  
  resetDaily() {
    this.dailyVisits.clear()
  }
}

// In ScreenTimeWidget.vue
<template>
  <div class="screen-time-widget">
    <div class="widget-header">⏱️ Screen Time</div>
    
    <!-- Current Screen -->
    <div class="current-screen-section">
      <div class="screen-name">{{ currentScreen }}</div>
      <div class="screen-stats">
        <div>Time here: {{ formatTime(currentStats.currentTime) }}</div>
        <div>Visits today: {{ currentStats.visitsToday }}</div>
        <div>Total visits: {{ currentStats.totalVisits }}</div>
      </div>
    </div>
    
    <!-- Time Distribution -->
    <div class="time-distribution">
      <div class="distribution-header">Time Distribution</div>
      <div v-for="screen in allScreens" :key="screen.screen" class="screen-bar">
        <span class="screen-label">{{ screen.screen }}</span>
        <div class="bar-container">
          <div class="bar-fill" :style="{width: screen.percentage + '%'}"></div>
        </div>
        <span class="screen-percent">{{ screen.percentage }}%</span>
      </div>
    </div>
    
    <!-- Trends -->
    <div class="trends-section">
      <div class="trend-label">Trends</div>
      <div class="trend-text">{{ trendText }}</div>
    </div>
  </div>
</template>
```

## 4. Performance Monitor Enhancement

### Current State
Widget exists but could show more useful metrics.

### Enhancement
```vue
<template>
  <div class="performance-widget">
    <div class="widget-header">📊 Performance</div>
    
    <div class="metrics-grid">
      <div class="metric">
        <span class="metric-label">Speed:</span>
        <span class="metric-value">{{ simSpeed }}x</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">TPS:</span>
        <span class="metric-value">{{ ticksPerSecond.toFixed(1) }}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">Memory:</span>
        <span class="metric-value">{{ memoryUsage }} MB</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">CPU:</span>
        <span class="metric-value">{{ cpuUsage }}%</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">Tick:</span>
        <span class="metric-value">{{ currentTick }}</span>
      </div>
      
      <div class="metric">
        <span class="metric-label">Actions:</span>
        <span class="metric-value">{{ totalActions }}</span>
      </div>
    </div>
    
    <!-- Performance Graph -->
    <div class="performance-graph">
      <canvas ref="perfCanvas" width="200" height="50"></canvas>
    </div>
    
    <!-- Warnings -->
    <div v-if="warnings.length > 0" class="warnings">
      <div v-for="warning in warnings" :key="warning" class="warning">
        ⚠️ {{ warning }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      tickHistory: [],
      maxHistory: 60,
      warnings: []
    }
  },
  
  methods: {
    updateGraph() {
      const canvas = this.$refs.perfCanvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      const width = canvas.width
      const height = canvas.height
      
      // Clear
      ctx.clearRect(0, 0, width, height)
      
      // Draw tick rate graph
      ctx.strokeStyle = '#4CAF50'
      ctx.beginPath()
      
      this.tickHistory.forEach((tps, index) => {
        const x = (index / this.maxHistory) * width
        const y = height - (tps / this.targetTPS) * height
        
        if (index === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      })
      
      ctx.stroke()
      
      // Draw target line
      ctx.strokeStyle = '#FFD700'
      ctx.setLineDash([5, 5])
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
    },
    
    checkPerformance() {
      this.warnings = []
      
      if (this.ticksPerSecond < this.targetTPS * 0.8) {
        this.warnings.push('Running below target speed')
      }
      
      if (this.memoryUsage > 500) {
        this.warnings.push('High memory usage')
      }
      
      if (this.cpuUsage > 80) {
        this.warnings.push('High CPU usage')
      }
    }
  }
}
</script>
```

## Testing Checklist

### Action Log
- [ ] Most recent entries appear at top
- [ ] Icons display for all action types
- [ ] Auto-scroll works when enabled
- [ ] Clear button removes all entries
- [ ] Categories have color coding
- [ ] No timestamp, only tick number
- [ ] Smooth entry animations

### Mini Upgrade Tree
- [ ] Shows actual game data nodes
- [ ] Connections drawn correctly
- [ ] Node colors reflect status (locked/available/unlocked)
- [ ] Tooltip shows on hover
- [ ] Statistics update in real-time
- [ ] Click opens full upgrade tree

### Screen Time
- [ ] Tracks time on all screens
- [ ] Visit counts increment correctly
- [ ] Percentage distribution accurate
- [ ] Daily reset works
- [ ] Trends text meaningful

### Performance Monitor
- [ ] Shows current simulation speed
- [ ] TPS updates in real-time
- [ ] Memory usage tracked
- [ ] Performance graph draws correctly
- [ ] Warnings appear when appropriate

## Success Metrics
- Action log provides clear history of events
- Mini tree gives at-a-glance progress view
- Screen time shows player behavior patterns
- Performance issues are visible
- All widgets update smoothly without lag

## Files to Modify
1. `src/views/widgets/ActionLogWidget.vue` - Complete rewrite
2. `src/views/widgets/MiniUpgradeTreeWidget.vue` - Make dynamic
3. `src/views/widgets/ScreenTimeWidget.vue` - Add aggregation
4. `src/views/widgets/PerformanceMonitorWidget.vue` - Enhance
5. `src/utils/ScreenTimeTracker.ts` - New file
6. `src/utils/SimulationEngine.ts` - Emit action events
7. `src/stores/simulation.ts` - Track screen changes