# Time Hero Simulator - Phased Development Plan
## Document 8: Implementation Roadmap

### Overview
This document outlines a phased approach to building the Time Hero Simulator, ensuring each phase delivers testable, functional components. The plan is designed for development using Cursor and GitHub Copilot with Claude Sonnet 4, focusing on incremental value delivery rather than time estimates.

### Development Principles
- **Incremental Delivery**: Each phase produces a working, testable application
- **Progressive Enhancement**: Start with core functionality, add complexity gradually
- **Stub Strategy**: Maintain full navigation while building features incrementally
- **Data-First Approach**: Establish data layer before complex UI
- **Test-as-You-Go**: Each phase includes specific testing checkpoints

---

## Phase 0: Foundation & Scaffolding
**Goal**: Establish project structure and basic navigation

### Deliverables
- Vue 3 application with Vite configuration
- Tailwind CSS integration with dark theme
- Basic routing for all 7 main sections
- Responsive layout shell (optimized for MacBook Air)
- Navigation header with tab system
- Stub pages for all main sections

### Technical Components
```
- Project setup (Vue 3 + Vite + TypeScript)
- Router configuration (vue-router)
- Base layout component
- Navigation component with active states
- Dark theme CSS variables
- Font Awesome icon integration
```

### File Structure
```
/src
  /components
    - AppHeader.vue
    - AppNavigation.vue
  /views
    - DashboardView.vue (stub)
    - ConfigurationView.vue (stub)
    - UpgradeTreeView.vue (stub)
    - PersonasView.vue (stub)
    - SimulationSetupView.vue (stub)
    - LiveMonitorView.vue (stub)
    - ReportsView.vue (stub)
  /styles
    - main.css (Tailwind + theme)
```

### Testing Checkpoint
- ✅ App loads without errors
- ✅ All navigation tabs are visible and clickable
- ✅ Routing works for all 7 sections
- ✅ Dark theme is applied consistently
- ✅ Layout is responsive on MacBook Air resolution

---

## Phase 1: Data Layer & Management
**Goal**: Load and manage all CSV data with proper models

### Deliverables
- CSV parsing system for all data files
- Pinia stores for data management
- TypeScript interfaces for all data types
- Data validation and error handling
- Debug view to inspect loaded data
- Prerequisite relationship mapping

### Technical Components
```
- CSV parser integration (PapaParse)
- Pinia store setup
- Data models/interfaces
- Data loading service
- Relationship resolver
- Debug data viewer component
```

### Data Stores
```typescript
- gameDataStore (crops, adventures, weapons, etc.)
- unlocksStore (town vendors, upgrades)
- actionsStore (farm, forge, tower actions)
- dependencyStore (prerequisite relationships)
```

### Key Files
```
/src/utils
  - csvLoader.ts
  - dataValidator.ts
  - relationshipResolver.ts
/src/stores
  - gameData.ts
  - unlocks.ts
  - actions.ts
  - dependencies.ts
/src/types
  - gameTypes.ts
  - unlockTypes.ts
  - actionTypes.ts
```

### Testing Checkpoint
- ✅ All CSV files load successfully
- ✅ Data appears in browser console/debug view
- ✅ Relationships between items are mapped
- ✅ Invalid data triggers appropriate errors
- ✅ Store getters return filtered data correctly

---

## Phase 2: Configuration & Data Editing
**Goal**: Complete Game Configuration page with full CRUD operations

### Deliverables
- Two-tier tab system (Game Screens → Sub-categories)
- DataTable component with sorting/filtering
- Inline editing capabilities
- Add/Edit/Delete modals
- Save/Reset functionality
- Change tracking and indicators
- Search across all data

### Technical Components
```
- DataTable component (with virtual scrolling)
- EditModal component
- TabSystem component
- Search/Filter components
- Auto-save system
- Change detection
```

### Features
```
- Click-to-edit cells
- Bulk operations
- Column sorting
- Real-time search
- Data validation on edit
- Undo/Redo capability
- Export current configuration
```

### Testing Checkpoint
- ✅ All game data is viewable in tables
- ✅ Can edit any value inline
- ✅ Changes persist in store
- ✅ Can add new items
- ✅ Can delete items (with confirmation)
- ✅ Search filters work across tabs
- ✅ Modified indicator shows unsaved changes

---

## Phase 3: Upgrade Tree Visualization
**Goal**: Interactive dependency graph for all upgrades

### Deliverables
- Node-based visualization of all upgrades
- Swim lane organization by source
- Interactive pan/zoom controls
- Node detail modals
- Dependency line visualization
- Family tree isolation feature
- Grid-based layout system

### Technical Components
```
- D3.js or vis-network integration
- Node rendering system
- Edge/connection renderer
- Pan/zoom controls
- Layout algorithm (swim lanes)
- Detail modal component
- Graph filtering system
```

### Node Features
```
- Visual states (owned/available/locked)
- Cost display
- Effect summary
- Click for details
- Edit capability
- Prerequisite highlighting
```

### Testing Checkpoint
- ✅ All upgrades appear as nodes
- ✅ Dependencies shown as connections
- ✅ Can pan and zoom smoothly
- ✅ Clicking node shows full details
- ✅ Can isolate family trees
- ✅ Swim lanes organize by source
- ✅ Grid alignment is consistent

---

## Phase 4: Player Personas & Setup
**Goal**: Define player behavior profiles and simulation parameters

### Deliverables
- Persona card interface
- Behavior parameter sliders
- Custom persona creation
- Simulation setup wizard
- Schedule pattern configuration
- Strategy preference settings

### Technical Components
```
- PersonaCard component
- BehaviorSlider component
- ScheduleEditor component
- SetupWizard component
- Persona templates
- Validation rules
```

### Persona Parameters
```
- Check-in frequency (weekday/weekend)
- Session length
- Efficiency percentages
- Decision strategies
- Risk tolerance
- Time-of-day patterns
```

### Testing Checkpoint
- ✅ Can select from preset personas
- ✅ Can modify persona parameters
- ✅ Can save custom personas
- ✅ Validation prevents invalid values
- ✅ Setup wizard guides through configuration
- ✅ Can clone existing personas

---

## Phase 5: Simulation Engine Core
**Goal**: Implement game simulation logic in Web Workers

### Deliverables
- Web Worker setup for simulation
- Game state machine implementation
- Resource calculation systems
- Phase progression logic
- Decision-making algorithms
- Action execution system
- Event logging

### Technical Components
```
- SimulationWorker.ts
- GameState class
- ResourceManager
- PhaseTracker
- DecisionEngine
- ActionExecutor
- EventLogger
```

### Simulation Features
```
- Minute-by-minute progression
- Resource generation/consumption
- Upgrade purchasing logic
- Adventure selection
- Mining decisions
- Helper management
- Offline progression calculation
```

### Testing Checkpoint
- ✅ Can start/stop simulation
- ✅ Console logs show progression
- ✅ Resources calculate correctly
- ✅ Phases transition appropriately
- ✅ Decisions follow persona rules
- ✅ Web Worker doesn't block UI

---

## Phase 6: Live Monitor & Visualization
**Goal**: Real-time simulation monitoring with visual feedback

### Deliverables
- Real-time resource displays
- Game time visualization
- Current action display
- Screen time tracker
- Mini upgrade tree
- Speed controls (1x, 10x, 100x, max)
- Pause/resume functionality

### Technical Components
```
- ResourceDisplay component
- TimeDisplay component
- ActionLog component
- ScreenTimeChart component
- MiniUpgradeTree component
- SimulationControls component
- Real-time update system
```

### Visual Elements
```
- Progress bars for resources
- Phase progression indicator
- Current location display
- Action history (last 5)
- Screen time heat map
- Owned upgrades highlighting
```

### Testing Checkpoint
- ✅ All resources update in real-time
- ✅ Can control simulation speed
- ✅ Pause/resume works correctly
- ✅ Action log shows activities
- ✅ Screen time percentages are accurate
- ✅ Mini upgrade tree reflects ownership
- ✅ No UI lag at max speed

---

## Phase 7: Reports & Analysis
**Goal**: Generate comprehensive simulation reports

### Deliverables
- Report generation system
- Report library/management
- Interactive charts and graphs
- Bottleneck analysis
- Phase timing analysis
- Export functionality (JSON, Markdown)
- Report comparison tools

### Technical Components
```
- ReportGenerator service
- ReportViewer component
- ChartComponents (Chart.js)
- AnalysisEngine
- ExportService
- ComparisonView
```

### Report Sections
```
- Executive summary
- Phase progression timeline
- Resource efficiency metrics
- Upgrade acquisition order
- Bottleneck identification
- Screen time distribution
- Key milestones
```

### Testing Checkpoint
- ✅ Reports generate after simulation
- ✅ All charts render correctly
- ✅ Can save/load reports
- ✅ Export produces valid JSON/Markdown
- ✅ Can compare two reports
- ✅ Bottlenecks are identified accurately
- ✅ Filtering and sorting work

---

## Phase 8: Polish & Optimization
**Goal**: Final polish, performance optimization, and LLM export

### Deliverables
- Performance optimizations
- Loading states and transitions
- Error boundaries and handling
- Keyboard shortcuts
- Help system/tooltips
- LLM-friendly export format
- Final UI polish
- GitHub Pages deployment

### Technical Components
```
- Virtual scrolling optimization
- Lazy loading implementation
- Error boundary components
- Keyboard shortcut system
- Tooltip system
- LLM export formatter
- Build optimization
```

### Polish Items
```
- Smooth animations/transitions
- Loading skeletons
- Consistent icon usage
- Keyboard navigation
- Contextual help
- Performance profiling
- Memory leak fixes
- Bundle size optimization
```

### Testing Checkpoint
- ✅ No memory leaks after long sessions
- ✅ Smooth performance with large datasets
- ✅ All keyboard shortcuts work
- ✅ Help tooltips are informative
- ✅ LLM export contains all context
- ✅ Deploys successfully to GitHub Pages
- ✅ Works offline after first load

---

## Implementation Guidelines

### Development Workflow
1. **Start each phase** by reviewing its deliverables
2. **Implement core functionality** before UI polish
3. **Use stubs liberally** for future features
4. **Test incrementally** using the checkpoints
5. **Commit working code** at each checkpoint
6. **Document decisions** in code comments

### Stub Strategy
- Create placeholder components that return minimal UI
- Include "Coming in Phase X" messages
- Maintain consistent navigation structure
- Use mock data where real data isn't ready
- Keep stubs functional enough for navigation testing

### Code Organization
```
/src
  /components   - Reusable UI components
  /views        - Page-level components
  /stores       - Pinia state management
  /utils        - Helper functions and services
  /workers      - Web Worker files
  /types        - TypeScript interfaces
  /data         - Static data and constants
  /styles       - Global styles and themes
```

### Testing Strategy
- Test each phase independently
- Use browser DevTools for debugging
- Implement console logging for data flow
- Create test scenarios for each persona
- Verify calculations with manual checks
- Profile performance at each phase

### Common Patterns
```typescript
// Consistent component structure
<script setup lang="ts">
// imports
// props/emits
// store access
// computed properties
// methods
// lifecycle
</script>

// Consistent store structure
export const useGameStore = defineStore('game', () => {
  // state
  // getters
  // actions
  return { /* exports */ }
})

// Consistent error handling
try {
  // operation
} catch (error) {
  console.error(`[ComponentName] Error:`, error)
  // user feedback
}
```

---

## Success Criteria

### Phase Completion
Each phase is considered complete when:
- All deliverables are implemented
- Testing checkpoints pass
- Code is committed and documented
- Next phase can build on current work

### Overall Project Success
- Complete 35-day simulation with smooth visual feedback at various speeds
- Identify progression bottlenecks accurately through visual observation
- Support 5+ player personas
- Generate actionable balance insights
- Deploy successfully to GitHub Pages

---

## Notes for Development with AI

### Effective Prompting
When working with Claude Sonnet 4:
- Provide context from previous phases
- Reference specific files and components
- Include TypeScript interfaces
- Specify Vue 3 Composition API
- Mention Tailwind classes needed

### Code Generation Tips
- Request complete components, not fragments
- Ask for TypeScript types upfront
- Specify store integration needs
- Include error handling requirements
- Request responsive design considerations

### Debugging Assistance
- Share full error messages
- Include relevant store state
- Provide component hierarchy
- Describe expected vs actual behavior
- Include browser console output

---

This phased approach ensures steady progress toward a fully functional Time Hero Simulator, with each phase delivering value and setting the foundation for the next. The modular structure allows for adjustments based on discoveries during development while maintaining the overall architectural vision.