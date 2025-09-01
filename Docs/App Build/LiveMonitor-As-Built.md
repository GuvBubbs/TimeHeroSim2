# Live Monitor System Reference - TimeHero Sim

## Overview

The Live Monitor provides real-time visualization of TimeHero simulation gameplay through a comprehensive widget-based interface. It displays 13 specialized widgets that monitor different aspects of the simulation, from resource management to AI decision-making, enabling detailed observation and analysis of gameplay progression.

## Architecture

### Core Components

**File Locations**:
- `src/views/LiveMonitorView.vue` - Main interface orchestrating all widgets
- `src/utils/SimulationEngine.ts` - Game logic running in Web Worker
- `src/utils/SimulationBridge.ts` - Communication between main thread and worker
- `src/components/monitor/BaseWidget.vue` - Foundation component for all widgets
- `src/utils/WidgetDataAdapter.ts` - Transforms game state data for widgets

### Data Flow

```
Web Worker (SimulationEngine) → SimulationBridge → LiveMonitorView → Individual Widgets
```

1. **SimulationEngine** executes game logic in Web Worker isolation
2. **SimulationBridge** handles thread communication and state synchronization  
3. **LiveMonitorView** receives updates and distributes data to widgets
4. **WidgetDataAdapter** transforms complex game state into widget-friendly format
5. **Individual Widgets** display specific aspects of the simulation state

## Widget Grid Layout

```
[Game Phase Progress - Full Width Header]

[Current Location] [Resources] [Equipment] [Current Action] - Top Row (h-80)

[Farm Visualizer (9 cols)]               [Action Log (3 cols)]
[Mini Upgrade Tree (9 cols)]             [    Tall Column    ]
[Timeline (9 cols)]                      [     h-640         ]

[Screen Time] [Helper Management] [Next Decision] - Bottom Row (h-80)

[Performance Monitor - Full Width Footer]
```

## Widget Reference

### 1. Game Phase Progress Widget
**Purpose**: Displays current game progression and timeline  
**Location**: `src/components/monitor/PhaseProgress.vue`  
**Data Source**: `gameState.time.day`, `gameState.progression.currentPhase`  
**Features**:
- Current day tracking with visual timeline
- Phase milestone indicators (Tutorial → Early → Mid → Late → End)
- Progress percentage calculation
- Compact horizontal layout for header placement

### 2. Current Location Widget
**Purpose**: Shows hero's current location and movement history  
**Location**: `src/components/monitor/CurrentLocation.vue`  
**Data Source**: `gameState.location.currentScreen`, `gameState.location.visitHistory`  
**Features**:
- 4x3 location grid with cross-shaped layout (Town, Farm, Adventure, etc.)
- Current location highlighted with hero indicator (👤)
- Visit statistics and time tracking for each location
- Helper presence indicators

### 3. Resources Widget
**Purpose**: Comprehensive inventory management display  
**Location**: `src/components/monitor/ResourcesWidget.vue`  
**Data Source**: `gameState.resources` (energy, gold, water, seeds, materials)  
**Features**:
- **Top Section**: Energy/Gold and Water/Seeds with progress bars
- **Two-Column Layout**: Seeds (left, green) and Materials (right, purple)
- **Full-Height Scrolling**: Utilizes entire widget height for inventory view
- **Custom Scrollbars**: Thin 4px scrollbars with hover states
- **Always Visible**: Complete inventory accessible without collapsing

### 4. Equipment Widget
**Purpose**: Tools, weapons, and armor management  
**Location**: `src/components/monitor/EquipmentWidget.vue`  
**Data Source**: `gameState.inventory.equipment`  
**Features**:
- **Tools**: Hoe🛠️, Hammer🔨, Axe, Pickaxe with progression levels
- **Weapons**: 5-weapon system with numeric level indicators
- **Armor**: Defense values with special effects (Regeneration, Evasion, etc.)
- Hover tooltips with detailed item information

### 5. Current Action Widget
**Purpose**: Active action monitoring with progress tracking  
**Location**: `src/components/monitor/CurrentAction.vue`  
**Data Source**: `gameState.currentAction`, simulation engine action queue  
**Features**:
- Real-time display of current simulation action
- Progress bar for time-based actions
- Next action preview from AI decision engine
- Action type icons and descriptions

### 6. Farm Visualizer Widget
**Purpose**: Visual farm management with plot-by-plot status  
**Location**: `src/components/monitor/FarmVisualizerWidget.vue`  
**Data Source**: `gameState.farm.plots`, `gameState.farm.stage`  
**Features**:
- **Two-Column Layout**: Stage titles (128px) + aligned plot grid
- **5 Farm Stages**: Progression from 8 → 12 → 20 → 25 → 25 plots
- **Color-Coded Status**: Ready (🟩), Growing (🌱), Locked (⬜), Watered (🌊), Dry (🏜️)
- **Perfect Grid Alignment**: Professional grid structure with consistent spacing

### 7. Action Log Widget
**Purpose**: Scrolling event history and simulation tracking  
**Location**: `src/components/monitor/ActionLog.vue`  
**Data Source**: Simulation engine event stream  
**Features**:
- **Tall Layout**: Right-side column spanning multiple content rows (h-640)
- **Event Categories**: Actions, Resources, Combat, Phase Changes
- **Auto-Scroll**: Automatically scrolls to latest events
- **Timestamps**: Game time formatting for all events
- **Filter System**: Show/hide different event types

### 8. Mini Upgrade Tree Widget
**Purpose**: Progression tree and unlock tracking  
**Location**: `src/components/monitor/MiniUpgradeTreeWidget.vue`  
**Data Source**: `gameState.progression.unlockedUpgrades`, CSV upgrade data  
**Features**:
- **Timeline Phases**: Visual progression through game phases
- **Upgrade Dependencies**: Shows prerequisite relationships from CSV data
- **Current Goals**: Highlights next available upgrades
- **Prerequisite Validation**: Real-time checking of unlock requirements

### 9. Timeline Widget
**Purpose**: Daily activity visualization and event chronology  
**Location**: `src/components/monitor/TimelineWidget.vue`  
**Data Source**: `gameState.events`, time-based game data  
**Features**:
- **Time Markers**: 6:00 to 20:00 daily activity overview
- **Event Plotting**: Real GameEvent data with timestamps
- **Current Time Indicator**: Shows simulation's current time position
- **Milestone Tracking**: Important events marked on timeline

### 10. Helper Management Widget
**Purpose**: Gnome workforce management and optimization  
**Location**: `src/components/monitor/HelperManagementWidget.vue`  
**Data Source**: `gameState.helpers`, housing data, role assignments  
**Features**:
- **Housing Status**: Current capacity vs. rescued gnomes (e.g., "3/5 housed")
- **Role Assignments**: Active helper roles and efficiency ratings
- **Resource Production**: Helper contribution to resource generation
- **Rescue Progress**: Available gnomes and rescue costs

### 11. Next Decision Widget
**Purpose**: AI decision preview and strategy insight  
**Location**: `src/components/monitor/NextDecisionWidget.vue`  
**Data Source**: Decision engine, AI scoring system  
**Features**:
- **Next Action Preview**: Shows AI's planned next action
- **Decision Reasoning**: Explains why action was chosen
- **Priority Scoring**: Displays action priority values
- **Strategy Context**: Shows persona-driven decision factors

### 12. Screen Time Widget
**Purpose**: Location analytics and time distribution  
**Location**: `src/components/monitor/ScreenTimeWidget.vue`  
**Data Source**: `gameState.location.timeTracking`  
**Features**:
- **Time Distribution**: Farm, Town, Tower, Adventure percentages
- **Efficiency Metrics**: Time spent vs. productivity in each location
- **Persona Behavior**: Shows player type patterns (Speedrunner vs. Casual)
- **Session Analytics**: Current session time allocation

### 13. Performance Monitor Widget
**Purpose**: System performance and simulation metrics  
**Location**: `src/components/monitor/PerformanceMonitor.vue`  
**Data Source**: Simulation engine performance data  
**Features**:
- **Simulation Speed**: ms/tick with large readable display
- **Tick Rate**: Current simulation frequency
- **Memory Usage**: Web Worker memory consumption
- **Error Tracking**: Simulation engine error counts

## Technical Implementation

### BaseWidget Foundation

All widgets extend `BaseWidget.vue` which provides:
- Consistent styling with dark theme integration
- Header with title and icon support
- Content and footer slot architecture
- Responsive height management
- Border and background standardization

### Web Worker Communication

The simulation runs in a Web Worker for performance isolation:
```typescript
// SimulationBridge handles all worker communication
const bridge = new SimulationBridge()
bridge.onTick((gameState) => {
  // Updates flow to all widgets automatically
  updateAllWidgets(gameState)
})
```

### Data Transformation

`WidgetDataAdapter.ts` converts complex game state:
```typescript
// Transforms Map objects to widget-friendly format
const transformedData = WidgetDataAdapter.transform(gameState)
// Example: Map{'wood' => 25} → {wood: 25} for template binding
```

### Responsive Grid System

Uses Tailwind CSS grid with breakpoint management:
- **Desktop**: Full 13-widget layout with optimal spacing
- **Tablet**: Responsive column adjustments
- **Mobile**: Vertical stacking with widget prioritization

## Key Features

### Real-Time Updates
- **Event-Driven**: Updates trigger on simulation state changes
- **Efficient Rendering**: Only changed widgets re-render
- **Smooth Animation**: Progress bars and transitions use CSS transforms

### Performance Optimization
- **Web Worker Isolation**: Simulation doesn't block UI thread
- **Selective Updates**: Widgets only update when their data changes
- **Memory Management**: Proper cleanup of event listeners and watchers

### Accessibility
- **Semantic HTML**: Proper heading structure and ARIA labels
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Reader Support**: Descriptive content for assistive technology

## File Structure

```
src/
├── views/
│   └── LiveMonitorView.vue              # Main orchestration
├── components/monitor/
│   ├── BaseWidget.vue                   # Widget foundation
│   ├── PhaseProgress.vue               # Phase tracking
│   ├── CurrentLocation.vue             # Location grid
│   ├── ResourcesWidget.vue             # Inventory management
│   ├── CurrentAction.vue               # Action tracking
│   ├── ActionLog.vue                   # Event history
│   ├── EquipmentWidget.vue             # Equipment display
│   ├── FarmVisualizerWidget.vue        # Farm visualization
│   ├── HelperManagementWidget.vue      # Helper management
│   ├── MiniUpgradeTreeWidget.vue       # Upgrade tracking
│   ├── TimelineWidget.vue              # Event timeline
│   ├── ScreenTimeWidget.vue            # Location analytics
│   ├── NextDecisionWidget.vue          # AI preview
│   └── PerformanceMonitor.vue          # System metrics
├── utils/
│   ├── SimulationEngine.ts             # Core game logic
│   ├── SimulationBridge.ts             # Worker communication
│   └── WidgetDataAdapter.ts            # Data transformation
└── workers/
    └── simulation.worker.ts            # Web Worker entry point
```

This system provides comprehensive real-time monitoring of TimeHero simulations through a professional, widget-based interface that scales from quick testing to detailed gameplay analysis.
