# Phase 8M: Combat & Helper Systems

## Overview
Implement complete combat fidelity including boss quirks and armor effects. Fix helper system scaling and add dual-role functionality.

## Priority: HIGH - Core gameplay mechanics

## 1. Boss Quirk Implementation

### Boss Mechanics to Add

**Note**: These don't need perfect mechanical representation. Basic calculations that create challenges encouraging specific gear choices are sufficient.

#### Simplified Boss Challenge System
```javascript
const BOSS_CHALLENGES = {
  giant_slime: {
    description: 'Splits into minions at 50% HP',
    implementation: 'Add 50% more total damage to deal',
    encourages: 'High defense armor'
  },
  
  beetle_lord: {
    description: 'Hard shell reduces non-weakness damage',
    implementation: 'Takes 2x normal time without spear',
    encourages: 'Spear weapon requirement'
  },
  
  alpha_wolf: {
    description: 'Summons wolf cubs during fight',
    implementation: 'Add 30% more incoming damage',
    encourages: 'Reflection armor or high DPS'
  },
  
  sky_serpent: {
    description: 'Goes aerial periodically',
    implementation: 'Without bow, take 20% unavoidable damage',
    encourages: 'Bow weapon requirement'
  },
  
  crystal_spider: {
    description: 'Web traps disable weapons',
    implementation: 'Add 15% combat duration penalty',
    encourages: 'High defense to survive disabled periods'
  },
  
  frost_wyrm: {
    description: 'Gains armor at low HP',
    implementation: 'Last 50% HP takes 2x longer without wand',
    encourages: 'Wand for late phase'
  },
  
  lava_titan: {
    description: 'Constant burn damage',
    implementation: 'Fixed 10% HP loss over adventure',
    encourages: 'Regeneration armor'
  }
}

// Simple implementation
function applyBossChallenge(combatState, boss, equipment) {
  const challenge = BOSS_CHALLENGES[boss.id]
  
  switch(boss.id) {
    case 'beetle_lord':
      if (!equipment.weapons.includes('spear')) {
        combatState.duration *= 2  // Takes twice as long
      }
      break
      
    case 'sky_serpent':
      if (!equipment.weapons.includes('bow')) {
        combatState.heroHP -= combatState.maxHP * 0.2  // Unavoidable damage
      }
      break
      
    case 'lava_titan':
      if (equipment.armor?.effect !== 'regeneration') {
        combatState.heroHP -= combatState.maxHP * 0.1  // Burn damage
      }
      break
    
    // Add other simplified boss mechanics
  }
}
```

#### Beetle Lord (Pine Vale) 
```javascript
{
  quirk: 'hardened_shell',
  effect: {
    damageReduction: 0.5,  // 50% less from non-weakness
    weaknessRequired: 'spear'
  }
}
```

#### Alpha Wolf (Dark Forest)
```javascript
{
  quirk: 'pack_leader',
  triggers: [
    { hp: '75%', spawn: { cubs: 2, damage: 3 } },
    { hp: '25%', spawn: { cubs: 2, damage: 3 } }
  ]
}
```

#### Sky Serpent (Mountain Pass)
```javascript
{
  quirk: 'aerial_phase',
  pattern: {
    groundTime: 20,  // seconds
    airTime: 5,       // seconds  
    airRestriction: 'bow_only'  // Only bow can hit
  }
}
```

#### Crystal Spider (Crystal Caves)
```javascript
{
  quirk: 'web_trap',
  interval: 30,  // seconds
  effect: {
    disableWeapons: true,
    duration: 3    // seconds
  }
}
```

#### Frost Wyrm (Frozen Tundra)
```javascript
{
  quirk: 'frost_armor',
  trigger: 'hp <= 50%',
  effect: {
    defenseBonus: 30,
    weaknessRequired: 'wand'  // Wand breaks through
  }
}
```

#### Lava Titan (Volcano Core)
```javascript
{
  quirk: 'molten_core',
  effect: {
    burnDamage: 2,    // per second
    continuous: true,  // entire fight
    rotatingWeakness: ['spear', 'sword', 'bow', 'crossbow', 'wand']
  }
}
```

## 2. Armor Special Effects

### Effect Implementations

```javascript
const ARMOR_EFFECTS = {
  reflection: {
    chance: 0.15,
    reflectPercent: 0.30,
    bestAgainst: 'alpha_wolf'  // Reflects cub damage
  },
  
  evasion: {
    chance: 0.10,
    effect: 'dodge_completely',
    bestAgainst: 'high_damage_bosses'
  },
  
  gold_magnet: {
    goldMultiplier: 1.25,
    trigger: 'adventure_complete'
  },
  
  regeneration: {
    healAmount: 3,
    trigger: 'between_waves',
    maxTriggers: 'unlimited'
  },
  
  type_resist: {
    variants: ['slimes', 'insects', 'beasts', 'flying', 'plants'],
    damageReduction: 0.40,  // 40% less from type
    dropWeight: 0.05        // 5% each variant
  },
  
  speed_boost: {
    attackSpeedBonus: 0.20,  // +20% after taking damage
    duration: 5,              // seconds
    trigger: 'take_damage'
  },
  
  critical_shield: {
    effect: 'first_hit_zero_damage',
    trigger: 'each_wave',
    resetOnWave: true
  },
  
  vampiric: {
    healPerKill: 1,
    maxHealPerWave: 5  // Cap to prevent exploitation
  }
}
```

### Armor Drop Tables by Route
```javascript
const ROUTE_ARMOR_TABLES = {
  meadow_path: {
    minimal: 0.50, low: 0.30, medium: 0.15, high: 0.05, extreme: 0
  },
  pine_vale: {
    minimal: 0.40, low: 0.35, medium: 0.20, high: 0.05, extreme: 0
  },
  // ... (implement all 7 routes)
  volcano_core: {
    minimal: 0.15, low: 0.20, medium: 0.40, high: 0.20, extreme: 0.05
  }
}
```

## 3. Combat Timing Fixes

### Wave Spacing
```javascript
const WAVE_TIMING = {
  short: {
    minInterval: 30,   // seconds
    maxInterval: 45,   // seconds
    waveCount: [3, 4, 4, 5, 5, 6, 6]  // by route
  },
  medium: {
    minInterval: 40,
    maxInterval: 60,
    waveCount: [5, 6, 7, 8, 9, 10, 11]
  },
  long: {
    minInterval: 45,
    maxInterval: 70,
    waveCount: [8, 10, 12, 14, 16, 18, 20]
  }
}
```

### Rest Nodes
```javascript
const REST_NODE = {
  trigger: 'progress >= 50%',
  applies: 'long_routes_only',
  effect: {
    heal: '10% of max HP',
    pauseDuration: 10  // seconds
  }
}
```

## 4. Helper System Enhancements

### Level Scaling Formula
```javascript
const HELPER_SCALING = {
  waterer: {
    base: 5,           // plots/minute
    perLevel: 1,       // additional plots
    formula: (level) => 5 + level,  // 5-15 at L0-L10
  },
  
  pump_operator: {
    base: 20,          // water/hour
    perLevel: 5,
    formula: (level) => 20 + (level * 5)  // 20-70 at L0-L10
  },
  
  sower: {
    base: 3,
    perLevel: 1,
    formula: (level) => 3 + level  // 3-13 at L0-L10
  },
  
  harvester: {
    base: 4,
    perLevel: 1,
    formula: (level) => 4 + level  // 4-14 at L0-L10
  },
  
  miners_friend: {
    base: 0.15,        // 15% energy reduction
    perLevel: 0.03,    // 3% per level
    formula: (level) => 0.15 + (level * 0.03)  // 15-45%
  },
  
  adventure_fighter: {
    base: 5,           // damage
    perLevel: 2,
    formula: (level) => 5 + (level * 2)  // 5-25 damage
  },
  
  adventure_support: {
    base: 1,           // HP per 30 sec
    perLevel: 0.2,     // Increases healing rate
    formula: (level) => 1 + (level * 0.2)  // 1-3 HP/30s
  },
  
  seed_catcher: {
    base: 0.10,        // 10% catch bonus
    perLevel: 0.02,
    formula: (level) => 0.10 + (level * 0.02)  // 10-30%
  },
  
  forager: {
    base: 5,           // wood/hour from stumps
    perLevel: 2,
    formula: (level) => 5 + (level * 2)  // 5-25 wood/hour
  },
  
  refiner: {
    base: 0.05,        // 5% speed bonus
    perLevel: 0.01,
    formula: (level) => 0.05 + (level * 0.01)  // 5-15%
  }
}
```

### Dual-Role System (Master Academy)
```javascript
const DUAL_ROLE_SYSTEM = {
  prerequisite: 'master_academy_built',
  
  implementation: {
    maxRoles: 2,
    efficiencyPerRole: 0.75,  // 75% efficiency each
    
    calculateEffect: (helper, role1, role2) => {
      const role1Effect = HELPER_SCALING[role1].formula(helper.level) * 0.75
      const role2Effect = HELPER_SCALING[role2].formula(helper.level) * 0.75
      return { role1: role1Effect, role2: role2Effect }
    }
  },
  
  restrictions: [
    'Cannot duplicate same role',
    'Some roles incompatible (e.g., adventure_fighter + seed_catcher)',
    'Can switch roles but incurs 30-minute cooldown'
  ]
}
```

### Forager Role Activation
```javascript
const FORAGER_MECHANICS = {
  requirement: 'cleared_stumps_on_farm',
  
  woodGeneration: {
    checkInterval: 60,  // Check every game hour
    baseRate: 5,        // wood per hour at level 0
    
    calculateWood: (clearedStumps, helperLevel) => {
      const rate = HELPER_SCALING.forager.formula(helperLevel)
      const stumpMultiplier = Math.min(clearedStumps * 0.1, 2.0)  // Cap at 2x
      return Math.floor(rate * stumpMultiplier)
    }
  }
}
```

### Helper Training System
```javascript
const HELPER_TRAINING = {
  levels: [
    { level: 1, xp: 100, energy: 50, time: 30 },     // minutes
    { level: 2, xp: 300, energy: 150, time: 60 },
    { level: 3, xp: 600, energy: 300, time: 120 },
    { level: 4, xp: 1000, energy: 500, time: 240 },
    { level: 5, xp: 2000, energy: 1000, time: 480 },
    { level: 6, xp: 4000, energy: 2000, time: 720 },
    { level: 7, xp: 8000, energy: 4000, time: 1080 },
    { level: 8, xp: 16000, energy: 8000, time: 1440 },
    { level: 9, xp: 32000, energy: 16000, time: 2160 },
    { level: 10, xp: 64000, energy: 32000, time: 2880 }  // 48 hours
  ],
  
  trainingGrounds: {
    timeReduction: 0.25  // 25% faster
  },
  
  masterAcademy: {
    timeReduction: 0.50,  // 50% faster
    enablesDualRole: true
  }
}
```

## 5. Gnome Housing Requirements

```javascript
const GNOME_HOUSING = {
  structures: [
    { name: 'gnome_hut', capacity: 1, cost: 500, prereq: 'first_gnome' },
    { name: 'gnome_house', capacity: 2, cost: 2000, prereq: 'homestead' },
    { name: 'gnome_lodge', capacity: 3, cost: 10000, prereq: 'manor_grounds' },
    { name: 'gnome_hall', capacity: 4, cost: 50000, prereq: 'great_estate' },
    { name: 'gnome_village', capacity: 5, cost: 250000, prereq: 'gnome_hall' }
  ],
  
  validation: (rescuedGnomes, housingCapacity) => {
    const activeGnomes = Math.min(rescuedGnomes, housingCapacity)
    const inactiveGnomes = rescuedGnomes - activeGnomes
    
    if (inactiveGnomes > 0) {
      console.log(`${inactiveGnomes} gnomes waiting for housing`)
    }
    
    return activeGnomes
  }
}
```

## Testing Checklist

### Combat System
- [ ] Each boss quirk triggers at correct HP/time
- [ ] Sky Serpent aerial phase restricts to bow only
- [ ] Crystal Spider web disables weapons for 3 seconds
- [ ] Lava Titan burn damage applies continuously
- [ ] Alpha Wolf spawns cubs at 75% and 25% HP
- [ ] Armor effects proc at correct rates
- [ ] Regeneration heals between waves
- [ ] Vampiric heals on kills (max 5/wave)
- [ ] Gold Magnet increases adventure gold by 25%
- [ ] Wave spacing matches route length (30-70s)
- [ ] Rest nodes heal 10% HP at 50% progress on long routes

### Helper System
- [ ] Helper effects scale correctly with levels
- [ ] Dual-role system activates with Master Academy
- [ ] Dual roles operate at 75% efficiency each
- [ ] Forager generates wood from cleared stumps
- [ ] Training time/energy costs match design
- [ ] Training Grounds reduces time by 25%
- [ ] Master Academy reduces time by 50%
- [ ] Gnome housing limits active helpers
- [ ] Inactive gnomes show "waiting for housing" status

## Success Metrics
- Boss fights show distinctive mechanics in combat log
- Armor choice affects adventure success rate
- Helper leveling provides noticeable efficiency gains
- Dual-role gnomes effectively double workforce
- Combat feels tactical, not just statistical

## Files to Modify
1. `src/utils/systems/CombatSystem.ts` - Boss quirks and armor effects
2. `src/utils/systems/HelperSystem.ts` - Level scaling and dual roles
3. `src/utils/combat/BossQuirks.ts` - New file for quirk implementations
4. `src/utils/combat/ArmorEffects.ts` - New file for armor mechanics
5. `src/utils/systems/GnomeHousing.ts` - New file for housing validation
6. `src/stores/simulation.ts` - Update helper state management