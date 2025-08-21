# Time Hero Simulator - Dashboard
## Document 1: Home View & Command Center

### Purpose & Goals
The Dashboard serves as the **command center** for the Time Hero Simulator, providing immediate visibility into system status, recent activity, and quick access to common workflows. It's the first screen users see and should answer the question: "What's the current state of my game balance?"

### Integration with Simulator Goals
- **Quick Validation**: See at a glance if recent simulations passed balance checks
- **Trend Analysis**: Spot patterns across multiple simulation runs
- **Workflow Acceleration**: One-click access to common tasks
- **System Health**: Ensure data integrity and performance metrics

### Layout Structure

#### Grid Layout (Desktop - 1440x900)
```
┌─────────────────────────────────────────────────────────────┐
│                        Header Bar                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐│
│  │  System Status  │  │  Quick Actions  │  │Data Health  ││
│  └─────────────────┘  └─────────────────┘  └─────────────┘│
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Recent Simulations Table                │  │
│  │                  (Expandable rows)                   │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### 1. System Status Widget
```typescript
interface SystemStatus {
  dataStatus: 'loaded' | 'loading' | 'error';
  csvFilesLoaded: number;
  totalDataPoints: number;
  lastModified: Date;
  memoryUsage: number; // MB
  activeSimulations: number;
}
```

**Visual Design**:
- Dark card with slate-800 background
- Status indicator: Green (✓), Yellow (⚠), Red (✗)
- Real-time memory meter with gradient fill
- Animated pulse for active simulations

**Features**:
- Click to expand detailed data inventory
- Hover for last validation timestamp
- Warning badges for data issues

#### 2. Quick Actions Panel
```typescript
interface QuickAction {
  id: string;
  label: string;
  icon: string; // Font Awesome class
  action: () => void;
  hotkey?: string;
  disabled?: boolean;
}

const quickActions: QuickAction[] = [
  {
    id: 'new-sim',
    label: 'New Simulation',
    icon: 'fa-play',
    hotkey: 'Cmd+N'
  },
  {
    id: 'quick-speedrun',
    label: 'Test Speedrunner',
    icon: 'fa-bolt'
  },
  {
    id: 'quick-casual',
    label: 'Test Casual',
    icon: 'fa-user'
  },
  {
    id: 'compare-last',
    label: 'Compare Last 2',
    icon: 'fa-code-branch'
  },
  {
    id: 'export-all',
    label: 'Export Reports',
    icon: 'fa-download'
  }
];
```

**Visual Design**:
- Large button cards with icon + label
- Hover state with scale transform
- Keyboard shortcut badges
- Disabled state for context-dependent actions

#### 3. Data Health Monitor
```typescript
interface DataHealth {
  validationStatus: 'passed' | 'warnings' | 'errors';
  issues: DataIssue[];
  lastCheck: Date;
  recommendations: string[];
}

interface DataIssue {
  severity: 'error' | 'warning' | 'info';
  file: string;
  message: string;
  line?: number;
}
```

**Visual Design**:
- Traffic light indicator (green/yellow/red)
- Expandable issue list with line references
- Fix suggestions with direct links
- Auto-refresh every 30 seconds

#### 4. Recent Simulations Table
```typescript
interface SimulationSummary {
  id: string;
  timestamp: Date;
  persona: string;
  duration: number; // simulated days
  phase: 'Tutorial' | 'Early' | 'Mid' | 'Late' | 'Endgame';
  status: 'completed' | 'failed' | 'bottlenecked';
  keyMetrics: {
    completionDays: number;
    bottlenecks: number;
    efficiency: number; // percentage
  };
}
```

**Table Features**:
- Sortable columns with visual indicators
- Row highlighting on hover
- Status badges with color coding
- Click row to view full report
- Bulk selection for comparison
- Virtual scrolling for 100+ rows

**Columns**:
1. Status (icon)
2. Timestamp (relative time)
3. Persona (with avatar)
4. Days Simulated
5. Final Phase
6. Bottlenecks
7. Efficiency %
8. Actions (View, Clone, Delete)



### Interactivity & Workflows

#### Quick Simulation Launch
1. Click "New Simulation" or press Cmd+N
2. Modal with preset configurations
3. One-click launch with default persona
4. Redirects to Live Monitor

#### Comparison Workflow
1. Select 2+ simulations via checkboxes
2. "Compare Selected" button appears
3. Opens split-view comparison in Reports tab
4. Highlights differences in key metrics

#### Data Validation Flow
1. Data Health shows warning
2. Click to see specific issues
3. "Fix" button opens Configuration tab
4. Auto-validates after changes

### State Management

#### Dashboard Store (Pinia)
```typescript
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    recentSimulations: [] as SimulationSummary[],
    systemStatus: {} as SystemStatus,
    dataHealth: {} as DataHealth,
    selectedSimulations: new Set<string>(),
    refreshInterval: 30000, // ms
  }),
  
  getters: {
    hasDataIssues: (state) => 
      state.dataHealth.validationStatus !== 'passed',
    
    comparisonReady: (state) => 
      state.selectedSimulations.size >= 2,
    
    averageCompletionTime: (state) => 
      state.recentSimulations.reduce((acc, sim) => 
        acc + sim.keyMetrics.completionDays, 0) / 
        state.recentSimulations.length,
  },
  
  actions: {
    async loadDashboardData() {
      // Load recent simulations from IndexedDB
      // Check system status
      // Validate data health
    },
    
    async launchQuickSimulation(preset: string) {
      // Create simulation with preset
      // Navigate to Live Monitor
    },
  }
});
```

### Performance Considerations

#### Optimization Strategies
- **Lazy Loading**: Charts render only when visible
- **Debounced Updates**: Table refreshes throttled to 100ms
- **Virtual Scrolling**: For simulation table >50 rows
- **Memoized Calculations**: Metrics cached until data changes
- **Progressive Loading**: Critical data first, charts second

#### Memory Management
```typescript
// Auto-cleanup old simulations
const MAX_RECENT_SIMULATIONS = 100;
const CLEANUP_THRESHOLD = 150;

function cleanupOldSimulations() {
  if (simulations.length > CLEANUP_THRESHOLD) {
    simulations.splice(MAX_RECENT_SIMULATIONS);
    indexedDB.cleanup();
  }
}
```

### Visual Design Language

#### Color Palette
```css
/* Dashboard-specific colors */
--dash-bg: #0f172a;        /* slate-900 */
--dash-card: #1e293b;      /* slate-800 */
--dash-border: #334155;    /* slate-700 */
--dash-text: #e2e8f0;      /* slate-200 */
--dash-muted: #94a3b8;     /* slate-400 */

/* Status colors */
--status-success: #10b981; /* emerald-500 */
--status-warning: #f59e0b; /* amber-500 */
--status-error: #ef4444;   /* red-500 */
--status-info: #3b82f6;    /* blue-500 */
```

#### Typography
```css
.dashboard-title {
  font-family: 'Inter', system-ui;
  font-weight: 700;
  font-size: 1.5rem;
  letter-spacing: -0.025em;
}

.metric-value {
  font-family: 'JetBrains Mono', monospace;
  font-variant-numeric: tabular-nums;
}
```

### Accessibility Features
- **Keyboard Navigation**: Tab through all interactive elements
- **Screen Reader Support**: ARIA labels for all widgets
- **High Contrast Mode**: Respects system preferences
- **Focus Indicators**: Clear outline on focused elements
- **Status Announcements**: Live regions for updates

### Error Handling

#### Data Loading Errors
```typescript
interface ErrorState {
  type: 'data-load' | 'validation' | 'simulation';
  message: string;
  recovery: () => void;
  showRetry: boolean;
}
```

**Error Display**:
- Non-blocking toast notifications
- Inline error states in widgets
- Retry buttons where applicable
- Fallback to cached data when available

### Responsive Behavior
While primarily desktop-focused, the dashboard gracefully handles different viewport sizes:

- **1440px+**: Full 3-column layout
- **1200px-1439px**: 2-column with stacked metrics
- **1024px-1199px**: Single column, prioritized order
- **<1024px**: Not supported message

### Integration Points

#### Navigation to Other Tabs
- System Status → Game Configuration (for data issues)
- Quick Actions → Simulation Setup (new simulation)
- Recent Simulations → Reports (view details)
- Recent Simulations → Live Monitor (watch simulation in progress)

#### Data Dependencies
- Requires: CSV data loaded, IndexedDB initialized
- Provides: System health status, recent activity
- Updates: On simulation complete, data change

### Testing Requirements

#### Unit Tests
- Data calculations (averages, trends)
- State management actions
- Error handling flows

#### Integration Tests
- Quick action workflows
- Data refresh cycles
- Navigation flows

#### Visual Regression Tests
- Chart rendering at different data volumes
- Table states (empty, few, many rows)
- Status indicator states

### Future Enhancements
1. **Customizable Widgets**: Drag-and-drop layout
2. **Saved Dashboards**: Multiple dashboard configurations
3. **Real-time Collaboration**: See team member activity
4. **Predictive Analytics**: ML-based issue prediction
5. **Custom Metrics**: User-defined KPIs

### Conclusion
The Dashboard provides essential oversight and control for the Time Hero Simulator, enabling developers to quickly assess game balance health and launch targeted investigations. Its focus on visual clarity, performance, and workflow efficiency makes it the ideal starting point for balance testing sessions.
