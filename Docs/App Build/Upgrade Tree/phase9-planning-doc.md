# Phase 9: Game Phase Headers - Planning Document

## Overview
Add Civilization V-style phase headers to the upgrade tree that visually segment the progression timeline into distinct game phases (Tutorial, Early Game, Mid Game, Late Game, Endgame, Post-game).

## Visual Design Specifications

### Phase Header Row
- **Position**: Fixed/sticky at top when scrolling vertically, scrolls horizontally with grid
- **Height**: 45px (balanced between readability and space efficiency)
- **Background**: Gradient texture with semi-transparent overlay
  ```css
  background: linear-gradient(135deg, 
    rgba(30, 30, 35, 0.95) 0%, 
    rgba(40, 40, 45, 0.9) 50%, 
    rgba(30, 30, 35, 0.95) 100%);
  background-image: url('data:image/svg+xml,...'); /* Subtle hex pattern */
  ```
- **Text**: Bold, 14px, white with subtle shadow for contrast
- **Border**: 1px solid rgba(255, 255, 255, 0.1) on bottom

### Phase Cells
- **Width**: Dynamically calculated based on column span
- **Alignment**: Center text within each phase cell
- **Separation**: 3px black vertical lines at phase boundaries

### Vertical Phase Boundary Lines
- **Color**: Black (#000000)
- **Width**: 3px (3x thicker than grid lines)
- **Style**: Solid
- **Height**: Full grid height (including empty rows)
- **Z-index**: Above swimlanes, below nodes
- **Position**: At grid column edges (left edge of leftmost node, right edge of rightmost node)

## Technical Architecture

### Data Source Strategy
**Primary Source**: `phase_transitions.csv`
- Clean, explicit phase boundary definitions
- Clear prerequisite mapping for phase transitions
- Fallback to `farm_stages.csv` if transitions file unavailable

### Phase Definition Model
```typescript
interface GamePhase {
  id: string           // 'tutorial', 'early-game', etc.
  name: string         // 'Tutorial', 'Early Game', etc.
  startColumn: number  // Leftmost column index
  endColumn: number    // Rightmost column index
  prerequisites: string[] // Boundary node IDs
  color?: string       // Optional phase-specific accent color
}
```

### Column Calculation Algorithm
```typescript
function calculatePhaseColumns(nodes: TreeNode[]): GamePhase[] {
  // 1. Load phase boundaries from phase_transitions.csv
  const transitions = loadPhaseTransitions()
  
  // 2. For each phase, find boundary nodes
  phases.forEach(phase => {
    const boundaryNodes = nodes.filter(n => 
      phase.prerequisites.includes(n.id)
    )
    
    // 3. Boundary nodes belong to EARLIER phase
    phase.endColumn = Math.max(...boundaryNodes.map(n => n.column))
    
    // 4. Next phase starts at endColumn + 1
    nextPhase.startColumn = phase.endColumn + 1
  })
  
  // 5. Use grid edges for precise alignment
  phases.forEach(phase => {
    phase.startX = phase.startColumn * (columnWidth + columnGap)
    phase.endX = (phase.endColumn + 1) * (columnWidth + columnGap)
  })
}
```

## Component Integration

### PhaseHeader.vue (New Component)
```vue
<template>
  <div class="phase-header-container" :style="containerStyle">
    <div class="phase-header-row">
      <div 
        v-for="phase in visiblePhases" 
        :key="phase.id"
        class="phase-cell"
        :style="getPhaseCellStyle(phase)"
      >
        <span class="phase-label">{{ phase.name }}</span>
      </div>
    </div>
    <!-- Vertical boundary lines -->
    <svg class="phase-lines-layer">
      <line 
        v-for="boundary in phaseBoundaries"
        :x1="boundary.x" :y1="0"
        :x2="boundary.x" :y2="gridHeight"
        stroke="#000000"
        stroke-width="3"
      />
    </svg>
  </div>
</template>
```

### TreeGrid.vue Modifications
```vue
<!-- Add phase header above grid -->
<div class="tree-grid-wrapper">
  <!-- NEW: Phase header row (sticky) -->
  <PhaseHeader 
    v-if="!focusMode || hasVisiblePhases"
    :phases="gamePhases"
    :visible-columns="visibleColumnRange"
    :grid-config="gridConfig"
  />
  
  <!-- Existing grid content -->
  <div class="tree-grid-container">
    <!-- ... existing code ... -->
  </div>
</div>
```

## Focus Mode Behavior

### Phase Visibility Rules
- **Normal Mode**: All phases visible with full column spans
- **Focus Mode**: Only phases containing visible nodes are shown
- **Column Recalculation**: Phase boundaries adjust to visible node columns
- **Empty Phase Handling**: Phases with no visible nodes are hidden completely

### Implementation
```typescript
const visiblePhases = computed(() => {
  if (!focusMode.value) return allPhases
  
  // Filter to phases that contain visible nodes
  return allPhases.filter(phase => {
    const phaseNodes = nodes.value.filter(n => 
      visibleNodeIds.value.has(n.id) &&
      n.column >= phase.startColumn &&
      n.column <= phase.endColumn
    )
    return phaseNodes.length > 0
  })
})
```

## Styling System

### CSS Classes
```css
.phase-header-container {
  position: sticky;
  top: 0;
  z-index: 100;
  height: 45px;
  margin-left: 120px; /* Account for swimlane labels */
}

.phase-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border-right: 3px solid #000000;
  background: linear-gradient(135deg, ...);
}

.phase-label {
  font-weight: 700;
  font-size: 14px;
  color: white;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.phase-lines-layer {
  position: absolute;
  top: 45px; /* Below header */
  left: 0;
  width: 100%;
  height: calc(100% - 45px);
  pointer-events: none;
  z-index: 5; /* Above swimlanes, below nodes */
}
```

## Implementation Steps

1. **Create PhaseHeader Component**
   - Build sticky header structure
   - Implement gradient background with texture
   - Add phase label rendering

2. **Integrate Phase Data Loading**
   - Parse phase_transitions.csv
   - Map prerequisites to node columns
   - Calculate phase boundaries

3. **Modify TreeGrid Layout**
   - Add PhaseHeader component
   - Adjust grid container for header space
   - Implement sticky positioning

4. **Add Vertical Boundary Lines**
   - SVG overlay for lines
   - Calculate x positions from phase boundaries
   - Extend through full grid height

5. **Handle Focus Mode**
   - Filter phases by visible nodes
   - Recalculate boundaries for compressed view
   - Hide empty phases

6. **Polish Visual Design**
   - Fine-tune gradient and texture
   - Optimize text contrast
   - Add subtle animations

## Testing Checklist

- [ ] Phase headers display correct names
- [ ] Boundaries align with grid columns
- [ ] Sticky header works when scrolling vertically
- [ ] Headers scroll horizontally with grid
- [ ] Vertical lines extend full height
- [ ] Focus mode shows only relevant phases
- [ ] Empty phases hidden in focus mode
- [ ] Text remains readable on gradient background
- [ ] Performance acceptable with large datasets
- [ ] No z-index conflicts with existing elements

## Future Enhancements (Post-Phase 9)

1. **Phase Progress Indicators**: Show % completion within each phase
2. **Phase Filtering**: Click phase to focus only nodes in that phase
3. **Phase Tooltips**: Hover for phase requirements and rewards
4. **Phase Animations**: Subtle transitions when entering new phases
5. **Phase Colors**: Optional color coding for phase difficulty