# 8A - Foundation - CSV Parsing & Resource Management

## Context
- **What this phase is doing:** See Goals below.
- **What came before:** (This is the first sub‑phase in the plan.)
- **What's coming next:** 7B - Core Actions - Farm Cleanup & Plot Expansion

## Scope
### Phase 8A: Foundation - CSV Parsing & Resource Management ⚡ Priority 1
**Goals**: Fix fundamental data parsing and resource tracking issues
**Expected Changes**: 
- Materials parse correctly from CSV ("Crystal x2;Silver x5")
- All resources tracked properly (wood, stone, copper, iron, etc.)
- Storage limits enforced
- Prerequisites validated
**Test Command**: `npm run dev` → Navigate to Live Monitor → Start simulation → Check console for parsing errors
**Success Criteria**: No parsing errors, resources display correctly in ResourcesWidget

## Details
## Phase 8A: Foundation - CSV Parsing & Resource Management
### Files to Modify
- `/src/utils/SimulationEngine.ts` - Add CSVDataParser class
- `/src/types/game-state.ts` - Update resource interfaces
- `/src/utils/gameDataUtils.ts` - Material parsing utilities

### Implementation Tasks

#### 1. Create CSVDataParser Class
```typescript
// Location: src/utils/CSVDataParser.ts (NEW FILE)
export class CSVDataParser {
  // Parse material requirements from CSV strings
  static parseMaterials(materialString: string): Map<string, number> {
    const materials = new Map<string, number>()
    if (!materialString || materialString === '-') return materials
    
    // Handle both "x" and "×" separators
    const parts = materialString.split(';')
    for (const part of parts) {
      const match = part.trim().match(/(.+?)\s*[x×]\s*(\d+)/i)
      if (match) {
        const materialName = match[1].trim().toLowerCase().replace(/\s+/g, '_')
        materials.set(materialName, parseInt(match[2]))
      }
    }
    return materials
  }
  
  // Parse gold cost from materials string
  static parseGoldCost(materialString: string): number {
    const materials = this.parseMaterials(materialString)
    return materials.get('gold') || 0
  }
  
  // Parse energy cost
  static parseEnergyCost(materialString: string): number {
    const materials = this.parseMaterials(materialString)
    return materials.get('energy') || 0
  }
  
  // Parse numeric values with fallback
  static parseNumericValue(value: string, defaultValue: number = 0): number {
    if (!value || value === '-') return defaultValue
    const num = parseInt(value.replace(/[^\d]/g, ''))
    return isNaN(num) ? defaultValue : num
  }
  
  // Parse duration strings (e.g., "10 min", "2 hours")
  static parseDuration(durationString: string): number {
    if (!durationString) return 0
    const match = durationString.match(/(\d+)\s*(min|hour|hr|h)/i)
    if (match) {
      const value = parseInt(match[1])
      const unit = match[2].toLowerCase()
      return unit.includes('hour') || unit === 'h' || unit === 'hr' ? value * 60 : value
    }
    return 0
  }
}
```

#### 2. Fix Material Management System
```typescript
// In SimulationEngine.ts - Update initializeMaterials
private initializeMaterials(): Map<string, number> {
  const materials = new Map<string, number>()
  
  // Standard materials from game design
  const standardMaterials = [
    'wood', 'stone', 'copper', 'iron', 'silver', 'crystal', 'mythril', 'obsidian',
    'pine_resin', 'shadow_bark', 'mountain_stone', 'cave_crystal', 
    'frozen_heart', 'molten_core', 'enchanted_wood'
  ]
  
  for (const material of standardMaterials) {
    materials.set(material, 0)
  }
  
  // Set initial values from parameters if provided
  const startingMaterials = this.parameters?.resource?.starting?.materials || {}
  for (const [material, amount] of Object.entries(startingMaterials)) {
    materials.set(material.toLowerCase(), amount as number)
  }
  
  return materials
}

// Add storage limit checking - SINGLE SOURCE OF TRUTH for material caps
// This method should be exported and used by all systems that need storage limits
export function getStorageLimit(gameState: GameState, material: string): number {
  // Check material storage upgrades
  const storageUpgrades = [
    { id: 'material_crate_i', limit: 50 },
    { id: 'material_crate_ii', limit: 100 },
    { id: 'material_warehouse', limit: 250 },
    { id: 'material_depot', limit: 500 },
    { id: 'material_silo', limit: 1000 }
  ]
  
  for (let i = storageUpgrades.length - 1; i >= 0; i--) {
    if (gameState.progression.unlockedUpgrades.includes(storageUpgrades[i].id)) {
      return storageUpgrades[i].limit
    }
  }
  
  return 50 // Default storage limit
}

// Update addMaterial with storage limits
private addMaterial(materialName: string, amount: number): boolean {
  const material = materialName.toLowerCase().replace(/\s+/g, '_')
  const current = this.gameState.resources.materials.get(material) || 0
  const storageLimit = getStorageLimit(this.gameState, material)
  
  const newAmount = Math.min(current + amount, storageLimit)
  this.gameState.resources.materials.set(material, newAmount)
  
  if (newAmount < current + amount) {
    this.addEvent('warning', `Material storage full for ${material}`)
    return true // Hit storage cap
  }
  
  return false
}
```

#### 3. Update Resource Interfaces
```typescript
// In game-state.ts
interface ResourceState {
  energy: {
    current: number
    max: number
    regenerationRate: number
  }
  gold: number
  water: {
    current: number
    max: number
    autoGenRate: number // From auto-pumps
  }
  seeds: Map<string, number>
  materials: Map<string, number>
}
```

### Testing Phase 8A
```bash
# Console tests for CSV parsing
const parser = new CSVDataParser()
parser.parseMaterials("Crystal x2;Silver x5") // Should return Map with crystal:2, silver:5
parser.parseGoldCost("Gold x100;Wood x5") // Should return 100
parser.parseDuration("30 min") // Should return 30
```

---
