# Time Hero Simulator - Phased Development Plan
## Document 8: Implementation Roadmap

### Overview
This document outlines a phased approach to building the Time Hero Simulator, ensuring each phase delivers testable, functional components. The plan is designed for development using Cursor and GitHub Copilot with Claude Sonnet 4, focusing on incremental value delivery rather than time estimates.

**Last Updated**: January 2025 - After completion of Phase 3 (Upgrade Tree Visualization)

### Development Principles
- **Incremental Delivery**: Each phase produces a working, testable application
- **Progressive Enhancement**: Start with core functionality, add complexity gradually
- **Stub Strategy**: Maintain full navigation while building features incrementally
- **Data-First Approach**: Establish data layer before complex UI
- **Test-as-You-Go**: Each phase includes specific testing checkpoints

### Lessons Learned (Phases 0-3)
- **Complex features need sub-phases**: Phase 3 (Upgrade Tree) required 9 sub-phases to complete
- **Iterative refinement is essential**: Visual components need multiple polish passes
- **Data architecture is critical**: Dual-schema approach (unified + specialized) proved valuable
- **Component reuse saves time**: EditItemModal successfully reused between Configuration and Upgrade Tree
- **Performance matters early**: Large datasets (460+ nodes) require optimization from the start

---

## ✅ Phase 0: Foundation & Scaffolding (COMPLETED)
**Goal**: Establish project structure and basic navigation

### Delivered
- Vue 3 application with Vite configuration
- TypeScript integration throughout
- Tailwind CSS with comprehensive dark theme
- Full routing for all 7 main sections
- Responsive layout optimized for MacBook Air (1440x900)
- Navigation header with active states
- Stub pages for all sections

### Key Implementation Details
- **Tech Stack**: Vue 3 + Vite + TypeScript + Pinia + Tailwind
- **Dark Theme**: Complete color system with `sim-*` variables
- **Font Awesome**: Full icon integration
- **Router**: Vue Router with proper navigation guards

### Testing Results ✅
- App loads without errors
- All navigation tabs functional
- Dark theme consistent throughout
- Layout responsive at target resolution
- TypeScript strict mode enabled

---

## ✅ Phase 1: Data Layer & Management (COMPLETED)
**Goal**: Load and manage all CSV data with proper models

### Delivered
- Complete CSV parsing system for 27 data files
- Dual-schema architecture (17 unified + 10 specialized files)
- Pinia stores with full TypeScript integration
- Comprehensive data validation system
- Real-time cross-file dependency checking
- Material cost parsing system ("Crystal x2;Silver x5" → object format)
- Debug view in Dashboard

### Key Implementation Details
```typescript
// Dual-schema approach proved highly effective
- gameDataStore: Manages unified GameDataItem[] and specialized data
- configurationStore: Tracks user modifications with dirty state
- CSV_FILE_LIST: Centralized metadata for all data files
- Validation system: Prerequisites, circular dependencies, data consistency
```

### Data Architecture Highlights
- **17 Unified Schema Files**: Standard GameDataItem interface
- **10 Specialized Files**: Custom structures (boss materials, XP progression, etc.)
- **Material System**: Sophisticated string→object→array conversions
- **Memory Tracking**: Real-time usage monitoring

### Testing Results ✅
- All 27 CSV files load successfully
- Validation catches prerequisite issues
- Cross-file relationships properly mapped
- Memory usage tracking functional
- Store reactivity working perfectly

---

## ✅ Phase 2: Configuration & Data Editing (COMPLETED)
**Goal**: Complete Game Configuration page with full CRUD operations

### Delivered
- Two-tier navigation (Game Screens → Sub-categories)
- DataTable with virtual scrolling for large datasets
- Sophisticated modal editing system
- Material cost/gain management with array UI
- Complete CRUD operations
- Change tracking with unsaved indicators
- Global search across all data
- LocalStorage persistence

### Key Implementation Details
- **Modal System**: Complex form management with dual data structures
- **Navigation**: 8 main tabs with dynamic sub-categories
- **Data Badges**: Visual indicators for Actions/Data/Unlocks
- **File Counting**: Smart badge system showing item counts
- **Click-Outside**: Proper modal behavior with dirty state checks

### Critical Solutions
```typescript
// Solved "unsaved changes" bug in modal initialization
1. Convert materials to arrays first
2. Set originalData AFTER array conversion
3. This ensures isDirty computed property works correctly
```

### Testing Results ✅
- All game data viewable and editable
- Changes persist correctly
- Search filters work across tabs
- Modified indicators accurate
- Modal editing fully functional
- Material management UI working

---

## ✅ Phase 3: Upgrade Tree Visualization (COMPLETED - 9 Sub-Phases!)
**Goal**: Interactive dependency graph for all upgrades

### Delivered (Far exceeded original scope)
1. **CSS Grid Layout System**: Precise node positioning with swimlanes
2. **Topological Sort Algorithm**: Proper dependency-based column assignment
3. **Perfect Node Centering**: Fine-tuned visual positioning
4. **SVG Connection Layer**: Smart path routing with bezier curves
5. **Enhanced Highlight Mode**: Complete dependency tree traversal
6. **Edit Integration**: Reused Configuration modal successfully
7. **Gap-Free Layout**: Revolutionary row compression algorithm
8. **Focus Mode**: Filter to show only dependency families
9. **Game Phase Headers**: Civilization V-style progression visualization

### Key Implementation Details
```typescript
// 13 Swimlane architecture with proper organization
- Excluded reference data (weapons, tools, armor) from tree
- Added "Other" swimlane for fallback items
- Gap elimination algorithm for seamless visual flow
- Focus mode with smart row compression
- Phase headers with unique textures per game stage
```

### Technical Achievements
- **460+ nodes** rendered smoothly
- **Connection routing**: Within-swimlane horizontal, cross-swimlane bezier
- **4 highlight states**: selected, direct, indirect, dimmed
- **Interactive connections**: Clickable SVG paths
- **Performance optimized**: O(V+E) algorithms
- **Production ready**: All debugging removed

### Testing Results ✅
- All upgrades displayed correctly
- Dependencies properly visualized
- Focus mode works perfectly
- Edit integration functional
- Performance smooth with large datasets
- Phase headers align correctly
- No visual gaps in layout

---

## Phase 4: Player Personas & Behavior (NEXT TARGET)
**Goal**: Define player behavior profiles and simulation parameters

### Updated Deliverables (Building on completed foundation)
- Persona card interface integrated with existing dark theme
- Behavior parameter components matching established UI patterns
- Custom persona builder using modal patterns from Configuration
- Integration with existing Pinia store architecture (Composition API)
- Schedule visualization components
- Strategy configuration interface

### Technical Components (Leveraging existing work)
```typescript
// PersonaStore using Composition API pattern from completed stores
export const usePersonaStore = defineStore('personas', () => {
  // State (using ref like gameDataStore)
  const presets = ref<Map<string, PlayerPersona>>(new Map())
  const custom = ref<Map<string, PlayerPersona>>(new Map())
  const selected = ref<string>('casual')
  const isLoading = ref(false)
  
  // Computed (following established patterns)
  const currentPersona = computed(() => 
    presets.value.get(selected.value) || 
    custom.value.get(selected.value)
  )
  
  // Actions (async pattern from gameDataStore)
  async function loadPersonas() {
    isLoading.value = true
    try {
      // Loading logic
    } finally {
      isLoading.value = false
    }
  }
  
  return { presets, custom, selected, currentPersona, loadPersonas }
})
```

### UI Components (Using established patterns)
```typescript
// PersonaCard.vue - Using card classes from Dashboard
<div class="bg-sim-surface border border-sim-border rounded-lg p-6">
  <div class="card-header">
    <h3 class="text-lg font-semibold text-sim-text">{{ persona.name }}</h3>
  </div>
  <div class="card-body">
    <!-- Content using established form patterns -->
  </div>
</div>

// PersonaModal.vue - Extending EditItemModal patterns
- Use same dual data structure for arrays
- Apply dirty state management pattern
- Implement click-outside-to-close
- Use established validation patterns
```

### Integration Points
- Use existing validation system for persona parameters
- Leverage material management patterns for behavior arrays
- Apply Configuration's two-tier navigation for persona types
- Reuse modal dirty state management
- Apply established loading state patterns

### Testing Checkpoint
- [ ] Can select from preset personas
- [ ] Can modify persona parameters with validation
- [ ] Can save custom personas to LocalStorage
- [ ] Schedule heatmap renders correctly
- [ ] Behavior radar chart displays
- [ ] Integration with existing stores works

---

## Phase 5: Simulation Engine Core
**Goal**: Implement game simulation logic in Web Workers

### Updated Deliverables (Adjusted for actual data model)
- Web Worker setup compatible with Vite build system
- Game state machine using actual CSV data structures
- Integration with 27 CSV files (17 unified + 10 specialized)
- Decision engine based on persona parameters
- Resource calculations matching Time Hero game design
- Event logging system for debugging
- Progress tracking compatible with Live Monitor

### Technical Components
```typescript
- SimulationWorker.ts - Main worker thread
- GameEngine class - Core simulation logic
- ResourceManager - Track energy, gold, materials
- DecisionEngine - Persona-based choices
- ProgressionTracker - Phase advancement
- CSVDataBridge - Interface with loaded data
```

### Key Integrations
- Load game data from gameDataStore into worker
- Use actual prerequisite chains from CSV files
- Apply material costs from parsed data
- Respect upgrade dependencies from tree visualization

### Testing Checkpoint
- [ ] Worker loads without blocking UI
- [ ] Can access all CSV data in worker
- [ ] Resources calculate correctly
- [ ] Decisions follow persona rules
- [ ] Progression matches game design
- [ ] Events log to console

---

## Phase 6: Simulation Setup Wizard
**Goal**: Configuration wizard for simulation parameters

### Updated Deliverables (Using established patterns)
- Multi-step wizard using existing modal/form patterns
- Integration with completed Configuration system
- Persona selection from Phase 4
- Game data source selection (default/modified)
- Parameter override interface
- Launch configuration with validation

### Technical Components (Leveraging existing patterns)
```typescript
// SetupStore using Composition API
export const useSetupStore = defineStore('simulationSetup', () => {
  // State
  const currentStep = ref(0)
  const configuration = ref<SimulationConfig>({})
  const validation = ref<ValidationState>({})
  
  // Computed
  const canProceed = computed(() => {
    // Validation logic
  })
  
  // Actions
  function nextStep() {
    // Step navigation
  }
  
  return { currentStep, configuration, canProceed, nextStep }
})
```

### Building on Existing Work
- Reuse form components from Configuration
- Apply modal patterns for step navigation
- Use existing validation system
- Leverage dirty state management
- Apply two-tier navigation patterns
- Use established dark theme classes

### Testing Checkpoint
- [ ] Wizard navigation works smoothly
- [ ] Can select persona from Phase 4
- [ ] Can choose data configuration
- [ ] Validation prevents invalid setups
- [ ] Configuration saves correctly
- [ ] Can launch simulation

---

## Phase 7: Live Monitor & Visualization
**Goal**: Real-time simulation monitoring with visual feedback

### Deliverables
- Real-time resource displays using Chart.js
- Game clock visualization
- Current action display with icons
- Phase progression indicator
- Mini upgrade tree (leveraging Phase 3 work)
- Speed controls (1x, 10x, 100x, max)
- WebSocket/Worker message handling

### Technical Components
```typescript
- LiveMonitor.vue - Main monitoring view
- ResourceChart.vue - Real-time graphs
- GameClock.vue - Time display
- ActionLog.vue - Activity feed
- MiniTree.vue - Simplified upgrade tree
- SimulationControls.vue - Speed/pause controls
```

### Reusing Phase 3 Work
- Mini upgrade tree uses same data structure
- Node highlighting shows owned upgrades
- Connection visualization for prerequisites
- Swimlane organization maintained

### Testing Checkpoint
- [ ] Resources update in real-time
- [ ] No UI lag at max speed
- [ ] Action log shows activities
- [ ] Mini tree reflects ownership
- [ ] Speed controls responsive
- [ ] Memory usage stable

---

## Phase 8: Reports & Analysis
**Goal**: Generate comprehensive simulation reports

### Deliverables
- Report generation from simulation data
- Report storage and management
- Interactive charts with Chart.js
- Bottleneck identification algorithms
- Phase timing analysis
- Export to JSON/CSV/Markdown
- Comparison tools for multiple runs

### Technical Components
```typescript
- ReportGenerator.ts - Analysis engine
- ReportViewer.vue - Display component
- ChartGallery.vue - Multiple chart types
- BottleneckAnalyzer.ts - Detection algorithms
- ExportService.ts - Multiple formats
- ComparisonView.vue - Side-by-side analysis
```

### Analysis Features
- Progression timeline visualization
- Resource efficiency metrics
- Upgrade acquisition patterns
- Bottleneck severity scoring
- Screen time distribution
- Success/failure analysis

### Testing Checkpoint
- [ ] Reports generate accurately
- [ ] Charts render correctly
- [ ] Bottlenecks identified properly
- [ ] Export formats valid
- [ ] Comparison tools work
- [ ] Performance acceptable

---

## Phase 9: Polish & Optimization
**Goal**: Final polish, performance optimization, and deployment

### Deliverables
- Performance profiling and optimization
- Memory leak detection and fixes
- Loading state improvements
- Error boundary implementation
- Comprehensive help system
- Keyboard shortcuts
- GitHub Pages deployment
- Documentation updates

### Optimization Targets
- [ ] Virtual scrolling for all large lists
- [ ] Lazy loading for heavy components
- [ ] Worker pooling for parallel simulations
- [ ] Bundle size optimization
- [ ] Image/icon optimization
- [ ] Caching strategies

### Polish Items
- [ ] Consistent loading skeletons
- [ ] Smooth transitions everywhere
- [ ] Tooltips for all controls
- [ ] Keyboard navigation
- [ ] Accessibility improvements
- [ ] Mobile responsive design

### Testing Checkpoint
- [ ] No memory leaks after hours
- [ ] Smooth with 1000+ nodes
- [ ] All shortcuts functional
- [ ] Deploys to GitHub Pages
- [ ] Works offline after load
- [ ] Documentation complete

---

## Implementation Guidelines

### Development Workflow (Updated)
1. **Plan sub-phases** for complex features (lesson from Phase 3)
2. **Build incrementally** with frequent commits
3. **Test visual components** at multiple stages
4. **Profile performance** early and often
5. **Document as-built** details for future reference
6. **Refactor when needed** (don't let technical debt accumulate)

### Code Patterns (Established in Phases 0-3)
```typescript
// Component structure (Composition API)
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useGameDataStore } from '@/stores/gameData'
// ... rest of imports

// Props/emits with TypeScript
const props = defineProps<{
  item: GameDataItem
  show: boolean
}>()

const emit = defineEmits<{
  save: [item: GameDataItem]
  close: []
}>()

// Store access
const gameData = useGameDataStore()

// Reactive state
const formData = ref<any>({})

// Computed properties
const isDirty = computed(() => {
  return JSON.stringify(formData.value) !== JSON.stringify(originalData.value)
})
</script>

// Pinia store pattern (Composition API)
export const useGameStore = defineStore('game', () => {
  // State
  const items = ref<GameDataItem[]>([])
  const isLoading = ref(false)
  
  // Computed
  const itemCount = computed(() => items.value.length)
  
  // Actions
  async function loadData() {
    isLoading.value = true
    try {
      // ... loading logic
    } finally {
      isLoading.value = false
    }
  }
  
  return { items, isLoading, itemCount, loadData }
})
```

### Common UI Patterns (Established)
- **Cards**: `bg-sim-surface border border-sim-border rounded-lg p-6`
- **Buttons Primary**: `bg-sim-accent text-white hover:bg-blue-600`
- **Buttons Secondary**: `bg-sim-surface hover:bg-slate-700`
- **Form Inputs**: `border border-sim-border rounded-lg bg-sim-bg`
- **Loading States**: Spinner with message
- **Error States**: Red border with icon
- **Success States**: Green with checkmark

---

## Success Criteria

### Phase Completion (Updated)
Each phase is considered complete when:
- All deliverables implemented and working
- Testing checkpoints pass (100%)
- As-built documentation created
- Performance acceptable for target data size
- No critical bugs remaining
- Code committed with clear history

### Overall Project Success
- ✅ Complete data layer with 27 CSV files (Phase 1)
- ✅ Full CRUD interface for game configuration (Phase 2)
- ✅ Interactive upgrade tree with 460+ nodes (Phase 3)
- [ ] 3+ player personas with behavior modeling (Phase 4)
- [ ] Complete 35-day simulation with smooth feedback
- [ ] Identify bottlenecks through visual observation
- [ ] Generate actionable balance reports
- [ ] Deploy successfully to GitHub Pages

---

## Risk Mitigation

### Identified Risks (From Phases 0-3)
1. **Complexity Creep**: Features growing beyond initial scope
   - **Mitigation**: Break into sub-phases, deliver incrementally
   
2. **Performance Issues**: Large datasets causing lag
   - **Mitigation**: Profile early, optimize data structures
   
3. **Integration Challenges**: Components not working together
   - **Mitigation**: Establish patterns early, reuse proven solutions
   
4. **Data Consistency**: CSV changes breaking functionality
   - **Mitigation**: Validation system, defensive coding

### Future Risks (Phases 4-9)
1. **Worker Communication**: Complex messaging between threads
   - **Mitigation**: Simple message protocol, thorough testing
   
2. **Simulation Accuracy**: Results not matching game behavior
   - **Mitigation**: Incremental validation, comparison with game
   
3. **Memory Leaks**: Long-running simulations consuming resources
   - **Mitigation**: Regular profiling, proper cleanup
   
4. **Deployment Issues**: GitHub Pages limitations
   - **Mitigation**: Test deployment early, have backup plan

---

## Notes for Development with AI

### Effective Prompting (Updated with experience)
When working with Claude:
- **Provide full context** including completed phase details
- **Reference specific files** from the codebase
- **Include TypeScript interfaces** for type safety
- **Mention established patterns** to maintain consistency
- **Show working examples** from completed phases
- **Be specific about Vue 3 Composition API** requirements

### Code Generation Tips (Proven effective)
- Request complete components with all imports
- Ask for TypeScript types upfront
- Specify Pinia Composition API pattern
- Reference existing component patterns
- Include dark theme classes needed
- Request proper error handling

### Common Issues & Solutions
- **"Unsaved changes" in modals**: Initialize arrays before setting originalData
- **File count mismatches**: Check CSV_FILE_LIST metadata
- **Performance problems**: Use computed properties, avoid watchers
- **TypeScript errors**: Ensure proper interface definitions
- **Dark theme inconsistencies**: Use established `sim-*` variables

---

## Conclusion

The Time Hero Simulator project has made excellent progress through Phase 3, with robust data management, comprehensive configuration tools, and a sophisticated upgrade tree visualization. The foundation is solid, patterns are established, and the path forward is clear.

The completion of Phase 3's 9 sub-phases demonstrates the team's ability to handle complex features through iterative development. With lessons learned and patterns established, Phases 4-9 should proceed more smoothly while building on this strong foundation.

Next immediate target: **Phase 4 - Player Personas & Behavior**

*Document updated: January 2025*  
*Phases 0-3: ✅ COMPLETE*  
*Current Focus: Phase 4 Planning*
