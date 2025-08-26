# Personas Page - As Built Documentation

## Overview

The Player Personas page is a comprehensive behavior modeling system that allows users to select and customize player archetypes for simulation purposes. This Phase 4 implementation provides a complete persona management interface with preset personas, custom persona creation, and deep behavioral parameter configuration.

**Primary Purpose**: Configure player behavior profiles that drive simulation parameters and outcomes
**Technical Stack**: Vue 3 Composition API, Pinia state management, TypeScript, Tailwind CSS, Font Awesome icons
**Navigation Path**: `/personas` route in the main application

## Architecture Overview

### Core Components

#### 1. PersonasView.vue (Main Page)
**Location**: `src/views/PersonasView.vue`
**Role**: Primary container and orchestration component

**Key Features**:
- Responsive 3-column layout (preset personas, custom personas, selected details)
- Real-time persona statistics in header badge
- Integrated create/edit/delete workflow
- Error handling with retry mechanism
- Loading states for all async operations

**Layout Structure**:
```
Header (Stats + Create Button)
├── Loading State (conditional)
├── Main Grid (XL: 2/3 + 1/3 split)
│   ├── Left Section (2/3)
│   │   ├── Preset Personas Card
│   │   └── Custom Personas Card
│   └── Right Section (1/3)
│       └── Selected Persona Details
├── Error State (conditional)
└── Modals (PersonaBuilder + Delete Confirmation)
```

#### 2. PersonaStore (Pinia Store)
**Location**: `src/stores/personas.ts`
**Role**: Centralized state management and business logic

**State Management**:
- Preset personas (3 built-in archetypes)
- Custom personas (user-created, localStorage persisted)
- Selected persona tracking
- Editor state management
- Validation system

**Core Actions**:
- `loadPersonas()`: Initialize from localStorage
- `selectPersona(id)`: Change active selection
- `createPersona(templateId?)`: Start creation workflow
- `editPersona(id)`: Start edit workflow
- `savePersona()`: Persist changes
- `deletePersona(id)`: Remove custom persona

#### 3. PersonaBuilder.vue (Creation/Edit Modal)
**Location**: `src/components/PlayerPersonas/PersonaBuilder.vue`
**Role**: Comprehensive persona configuration interface

**Form Sections**:
- Basic Information (name, description, icon, color)
- Behavior Parameters (4 sliders: efficiency, risk tolerance, optimization, learning rate)
- Play Schedule (weekday/weekend frequency, session length)
- Template System (preset configurations for quick setup)

**Key Features**:
- Real-time validation with error display
- Template-based persona creation
- Icon selection with Font Awesome integration
- Form synchronization with store state
- Dirty state tracking for unsaved changes

#### 4. Supporting Components

**PersonaCard.vue**:
- Displays individual persona in grid layout
- Shows key stats and behavior indicators
- Handles selection state and visual feedback
- Proper Font Awesome icon formatting

**PersonaDetails.vue**:
- Right-panel detailed view of selected persona
- Behavior parameter visualization
- Action buttons (edit, delete, use in simulation)
- Preset vs custom persona differentiation

**IconSelector.vue**:
- Custom dropdown with Font Awesome icon preview
- 12 carefully curated icons representing different playstyles
- Proper class formatting (`fas fa-*` pattern)
- Search-friendly icon labels

## Data Architecture

### SimplePersona Interface
```typescript
interface SimplePersona {
  id: string                    // Unique identifier
  name: string                  // Display name
  description: string           // User-friendly description
  icon: string                  // Font Awesome class (fa-user, fa-bolt, etc.)
  color: string                 // Hex color for theming
  
  // Core Behavior (0-1 scale)
  efficiency: number            // Decision optimality
  riskTolerance: number         // Dangerous route willingness
  optimization: number          // Min-max tendency
  learningRate: number          // Improvement speed
  
  // Schedule Parameters
  weekdayCheckIns: number       // Daily frequency (weekdays)
  weekendCheckIns: number       // Daily frequency (weekends)
  avgSessionLength: number      // Minutes per session
  
  // Metadata
  isPreset: boolean             // Preset vs custom
  createdAt?: string            // Creation timestamp
  lastModified?: string         // Last edit timestamp
}
```

### Preset Personas

#### 1. Speedrunner Sam
- **Archetype**: Optimized efficiency player
- **Key Traits**: High efficiency (0.95), high optimization (1.0), low learning rate (0.1)
- **Schedule**: Consistent high frequency (10/10 check-ins, 30min sessions)
- **Use Case**: Testing optimal gameplay paths

#### 2. Casual Casey  
- **Archetype**: Relaxed, sub-optimal player
- **Key Traits**: Moderate efficiency (0.7), low risk tolerance (0.3), medium optimization (0.6)
- **Schedule**: Low frequency (2/2 check-ins, 15min sessions)
- **Use Case**: Testing casual player experience

#### 3. Weekend Warrior Wade
- **Archetype**: Time-constrained weekday, binge weekend player
- **Key Traits**: Good efficiency (0.8), moderate optimization (0.8)
- **Schedule**: Asymmetric (1 weekday, 8 weekend check-ins, 45min sessions)
- **Use Case**: Testing schedule-based gameplay patterns

### Template System

Pre-configured starting points for custom persona creation:
- **Balanced Player**: Even distribution across all parameters
- **Completionist**: High optimization, low risk, thorough approach
- **Risk Taker**: High risk tolerance, lower efficiency

## User Workflows

### 1. Persona Selection
```
PersonasView → PersonaCard click → selectPersona() → PersonaDetails update
```
- Single-click selection of any persona
- Visual feedback with selection highlighting
- Immediate details panel update
- Automatic localStorage persistence

### 2. Custom Persona Creation
```
Create Button → PersonaBuilder Modal → Form Configuration → Save → PersonaCard Added
```
**Steps**:
1. Click "Create Custom" button
2. Optional template selection
3. Configure basic information (name, description, icon, color)
4. Adjust behavior sliders
5. Set play schedule parameters
6. Save with validation checks

### 3. Persona Editing
```
Edit Button → PersonaBuilder Modal → Modify Configuration → Save → Update Display
```
**Special Cases**:
- Editing preset personas creates new custom persona
- Original preset remains unchanged
- Custom personas can be edited in-place

### 4. Persona Deletion
```
Delete Button → Confirmation Modal → Confirm → Remove from Storage
```
**Rules**:
- Only custom personas can be deleted
- Confirmation required for safety
- Auto-reselect default if deleting active persona

## Technical Implementation Details

### State Synchronization
The system uses a sophisticated form-to-store synchronization pattern:

```typescript
// Manual sync to avoid reactive update loops
function handleSave() {
  if (!canSave.value || !formData.value) return
  
  // Manual field-by-field sync
  Object.keys(formData.value).forEach(key => {
    if (key in formData.value) {
      personaStore.updatePersonaField(key as keyof SimplePersona, formData.value[key])
    }
  })
  
  personaStore.savePersona()
  emit('save', personaStore.editorState.current)
}
```

### Validation System
Multi-layer validation approach:
- **Client-side**: Real-time form validation
- **Store-level**: Business rule validation
- **Type-safe**: TypeScript interface enforcement

**Validation Rules**:
- Name required and unique (for custom personas)
- Behavior parameters: 0-1 scale
- Check-ins: 1-20 range
- Session length: 5-120 minutes

### Storage Strategy
- **Custom Personas**: localStorage as JSON
- **Selected Persona**: localStorage key
- **Presets**: In-memory Map (not persisted)
- **Editor State**: Reactive store state (session only)

### Font Awesome Integration
Proper icon class formatting throughout:
```vue
<!-- Template Usage -->
<i :class="`fas ${persona.icon}`"></i>

<!-- Ensures complete classes like "fas fa-user" -->
```

## Performance Optimizations

### Reactive Data Patterns
- Computed properties for derived state
- Ref-based reactive state for forms
- Map-based storage for O(1) persona lookups

### Component Optimization
- Conditional rendering for modals and states
- Event delegation for persona selection
- Efficient v-for with proper key binding

### Memory Management
- Store cleanup on persona delete
- Editor state reset after operations
- Proper component lifecycle management

## Phase 5 Integration Hooks

### Simulation Configuration Export
```typescript
// Ready-to-use simulation configuration
function getSimulationConfig(personaId?: string): SimulationPersonaConfig {
  return {
    personaId: targetPersonaId,
    enableBehaviorTracking: true
  }
}
```

### Behavior Override System
```typescript
// Runtime persona modification for simulation
function applySimulationOverrides(config: SimulationPersonaConfig) {
  // Hook for Phase 5 - apply runtime overrides to persona behavior
  console.log('Simulation overrides applied:', config)
}
```

### Navigation Integration
```typescript
// Pre-configured navigation to simulation setup
function handleUseInSimulation() {
  const config = personaStore.getSimulationConfig()
  router.push({
    path: '/simulation-setup',
    query: { persona: personaStore.selected }
  })
}
```

## Code Quality & Maintenance

### TypeScript Coverage
- 100% typed interfaces and components
- Strict type checking enabled
- Generic type parameters for reusability

### Testing Considerations
**Key Test Points**:
- Persona creation/edit workflows
- Validation rule enforcement
- localStorage persistence
- Template application
- Icon selector functionality

### Error Handling
- Graceful localStorage failures
- Network-independent operation
- User-friendly error messages
- Automatic retry mechanisms

## Known Limitations & Future Enhancements

### Current Limitations
- No persona import/export functionality
- No bulk operations for custom personas
- No advanced scheduling patterns (seasonal, event-based)
- No persona comparison visualization

### Phase 5+ Enhancement Opportunities
- **Behavior Analytics**: Track actual vs predicted behavior patterns
- **Advanced Templates**: Community-shared persona templates
- **Dynamic Parameters**: Runtime behavior modification during simulation
- **Persona Groups**: Team-based persona management
- **A/B Testing**: Compare persona effectiveness

## Maintenance Notes

### Dependencies
- Vue 3.x Composition API
- Pinia 2.x store management
- Font Awesome 6.x icon library
- Tailwind CSS 3.x utilities

### Performance Monitoring Points
- localStorage read/write operations
- Form validation frequency
- Modal render performance
- Persona grid scrolling

### Security Considerations
- Client-side only (no sensitive data)
- localStorage size limits
- XSS protection via template escaping
- Input sanitization for custom data

---

**Status**: ✅ Phase 4 Complete - Production Ready
**Last Updated**: August 27, 2025
**Next Phase Integration**: Ready for Phase 5 simulation system integration
