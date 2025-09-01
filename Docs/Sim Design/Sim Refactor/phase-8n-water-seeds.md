# Phase 8N: Water & Seed Systems

## Overview
Implement complete water management including retention systems and auto-pumps. Fix seed catching mechanics with proper wind levels and auto-catcher rates.

## Priority: MEDIUM - Quality of life and progression smoothing

## 1. Water Retention Systems

### Plot Water Duration Mechanics
```javascript
const WATER_RETENTION = {
  base: {
    waterPerPlot: 1,
    durationMinutes: 30,  // Base water lasts 30 minutes
    drainRate: 1/30       // 1 water per 30 minutes
  },
  
  upgrades: {
    mulch_beds: {
      cost: 300,
      prereq: 'water_tank_ii',
      effect: {
        durationMultiplier: 1.25,  // 25% longer = 37.5 minutes
        description: 'Plots retain water 25% longer'
      }
    },
    
    irrigation_channels: {
      cost: 1500,
      prereq: ['mulch_beds', 'homestead'],
      effect: {
        durationMultiplier: 1.50,  // 50% longer = 45 minutes
        description: 'Plots retain water 50% longer'
      }
    },
    
    crystal_irrigation: {
      cost: 8000,
      prereq: ['irrigation_channels', 'manor_grounds'],
      effect: {
        durationMultiplier: 1.75,  // 75% longer = 52.5 minutes
        description: 'Plots retain water 75% longer'
      }
    }
  }
}
```

### Implementation Logic
```javascript
class WaterSystem {
  calculateWaterDuration(baseMinutes, retentionUpgrade) {
    const multiplier = WATER_RETENTION.upgrades[retentionUpgrade]?.effect.durationMultiplier || 1.0
    return baseMinutes * multiplier
  }
  
  processWaterDrainage(plot, deltaTime, retentionLevel) {
    const drainRate = WATER_RETENTION.base.drainRate / (retentionLevel || 1.0)
    plot.waterLevel = Math.max(0, plot.waterLevel - (drainRate * deltaTime))
    
    // Crop growth slows without water
    if (plot.waterLevel <= 0) {
      plot.growthMultiplier = 0.25  // 75% slower when dry
    }
  }
}
```

## 2. Auto-Pump Systems

### Offline Water Generation
```javascript
const AUTO_PUMP_SYSTEMS = {
  auto_pump_i: {
    cost: 200,
    prereq: 'water_tank_ii',
    materials: { copper: 5 },
    effect: {
      offlineRate: 0.10,  // 10% of cap per hour
      description: 'Generates water while offline'
    }
  },
  
  auto_pump_ii: {
    cost: 1000,
    prereq: ['auto_pump_i', 'water_tank_iii'],
    materials: { iron: 10 },
    effect: {
      offlineRate: 0.20,  // 20% of cap per hour
      description: 'Improved offline water generation'
    }
  },
  
  auto_pump_iii: {
    cost: 5000,
    prereq: ['auto_pump_ii', 'reservoir'],
    materials: { silver: 5 },
    effect: {
      offlineRate: 0.35,  // 35% of cap per hour
      description: 'Advanced offline water generation'
    }
  },
  
  crystal_pump: {
    cost: 25000,
    prereq: ['auto_pump_iii', 'crystal_reservoir'],
    materials: { crystal: 3 },
    effect: {
      offlineRate: 0.50,  // 50% of cap per hour
      description: 'Maximum offline water generation'
    }
  }
}
```

### Offline Calculation
```javascript
function calculateOfflineWater(timeDeltaMinutes, waterCapacity, pumpLevel) {
  const hoursOffline = timeDeltaMinutes / 60
  const pumpRate = AUTO_PUMP_SYSTEMS[pumpLevel]?.effect.offlineRate || 0
  const waterGenerated = waterCapacity * pumpRate * hoursOffline
  
  return {
    generated: Math.min(waterGenerated, waterCapacity),
    message: `Auto-pump generated ${Math.floor(waterGenerated)} water while away`
  }
}
```

## 3. Seed Catching System

### Wind Level Implementation
```javascript
const WIND_LEVELS = {
  // Level: { name, reachRequired, seedLevels, catchDifficulty }
  1: { name: 'Ground', reach: 1, seedLevels: [0], difficulty: 1.0 },
  2: { name: 'Breeze', reach: 2, seedLevels: [0, 1], difficulty: 1.1 },
  3: { name: 'Gust', reach: 3, seedLevels: [0, 1, 2], difficulty: 1.2 },
  4: { name: 'Gale', reach: 4, seedLevels: [1, 2, 3], difficulty: 1.3 },
  5: { name: 'Jet Stream', reach: 5, seedLevels: [2, 3, 4], difficulty: 1.5 },
  6: { name: 'Cloud Layer', reach: 6, seedLevels: [3, 4, 5], difficulty: 1.7 },
  7: { name: 'Stratosphere', reach: 7, seedLevels: [4, 5, 6], difficulty: 2.0 },
  8: { name: 'Mesosphere', reach: 8, seedLevels: [5, 6, 7], difficulty: 2.3 },
  9: { name: 'Thermosphere', reach: 9, seedLevels: [6, 7, 8], difficulty: 2.6 },
  10: { name: 'Exosphere', reach: 10, seedLevels: [7, 8, 9], difficulty: 3.0 },
  11: { name: 'Low Orbit', reach: 11, seedLevels: [8, 9], difficulty: 3.5 }
}
```

### Manual Catching Simulation
```javascript
const MANUAL_CATCHING = {
  baseRate: 1,  // seeds per minute at difficulty 1.0
  
  nets: {
    none: { efficiency: 1.0 },
    net_i: { efficiency: 1.2, cost: 75 },      // +20%
    net_ii: { efficiency: 1.4, cost: 400 },    // +40%
    golden_net: { efficiency: 1.6, cost: 2500 }, // +60%
    crystal_net: { efficiency: 1.8, cost: 15000 } // +80%
  },
  
  calculateCatchRate(windLevel, netType, personaSkill) {
    const level = WIND_LEVELS[windLevel]
    const net = this.nets[netType]
    const baseRate = this.baseRate / level.difficulty
    const withNet = baseRate * net.efficiency
    const withSkill = withNet * personaSkill  // 0.7-0.95 based on persona
    
    return {
      seedsPerMinute: withSkill,
      seedPool: level.seedLevels  // Which seed types can appear
    }
  }
}
```

### Auto-Catcher Mechanics
```javascript
const AUTO_CATCHERS = {
  tier_i: {
    cost: 1000,
    materials: { iron: 10 },
    rate: 0.1,  // 1 seed per 10 minutes
    poolReduction: 2,  // highest reach - 2
    description: 'Basic passive seed collection'
  },
  
  tier_ii: {
    cost: 5000,
    materials: { silver: 5 },
    rate: 0.2,  // 1 seed per 5 minutes
    poolReduction: 2,  // highest reach - 2
    description: 'Improved passive collection'
  },
  
  tier_iii: {
    cost: 30000,
    materials: { crystal: 3 },
    prereq: 'reach_5',
    rate: 0.5,  // 1 seed per 2 minutes
    poolReduction: 1,  // highest reach - 1
    description: 'Advanced passive collection'
  }
}

class AutoCatcherSystem {
  calculateSeedPool(highestReach, catcherTier) {
    const reduction = AUTO_CATCHERS[catcherTier].poolReduction
    const effectiveReach = Math.max(1, highestReach - reduction)
    return WIND_LEVELS[effectiveReach].seedLevels
  }
  
  processCatching(deltaMinutes, catcherTier, seedStorage) {
    const catcher = AUTO_CATCHERS[catcherTier]
    const seedsGained = deltaMinutes * catcher.rate
    
    // Only whole seeds
    const wholeSeedsGained = Math.floor(seedsGained)
    
    if (wholeSeedsGained > 0) {
      const seedPool = this.calculateSeedPool(playerReach, catcherTier)
      const randomSeedLevel = seedPool[Math.floor(Math.random() * seedPool.length)]
      const seedType = this.getSeedByLevel(randomSeedLevel)
      
      return {
        seed: seedType,
        amount: wholeSeedsGained
      }
    }
  }
}
```

## 4. Seed Distribution Strategy

### AI Seed Management
```javascript
const SEED_STRATEGY = {
  earlyGame: {
    plotCount: [3, 20],
    strategy: 'focus',
    distribution: {
      highestTier: 0.7,   // 70% best seeds
      midTier: 0.3,       // 30% backup
      lowTier: 0          // No low tier
    }
  },
  
  midGame: {
    plotCount: [20, 40],
    strategy: 'balanced',
    distribution: {
      highestTier: 0.4,   // 40% best seeds
      midTier: 0.4,       // 40% mid tier
      lowTier: 0.2        // 20% quick turnover
    }
  },
  
  lateGame: {
    plotCount: [40, 90],
    strategy: 'diversified',
    distribution: {
      highestTier: 0.3,   // 30% best seeds (600/2000)
      midTier: 0.4,       // 40% mid tier (800/2000)
      lowTier: 0.3        // 30% backup (600/2000)
    }
  }
}
```

### Sower Helper Integration
```javascript
const SOWER_BEHAVIOR = {
  // NOTE: Live view widget may only show 1 plot at a time
  // but the sower should process multiple plots per tick
  
  plotsPerMinute: {
    level0: 3,
    level10: 13
  },
  
  processSowing(deltaMinutes, sowerLevel) {
    const plotsToSow = Math.floor((3 + sowerLevel) * deltaMinutes)
    const sowedPlots = []
    
    for (let i = 0; i < plotsToSow; i++) {
      const plot = this.findEmptyPlot()
      if (plot && this.hasSeeds()) {
        const seed = this.selectSeed(availableSeeds, plotCount, gamePhase)
        sowedPlots.push({ plot: plot.id, seed: seed.type })
        plot.plant(seed)
      }
    }
    
    // Widget display may batch these or show summary
    return {
      count: sowedPlots.length,
      details: sowedPlots,
      displayText: `Sowed ${sowedPlots.length} plots`
    }
  },
  prioritization: [
    'empty_watered_plots',     // First priority
    'empty_dry_plots',         // Second priority
    'maintain_diversity'       // Ensure variety
  ],
  
  selectSeed(availableSeeds, plotCount, gamePhase) {
    const strategy = SEED_STRATEGY[gamePhase]
    const distribution = strategy.distribution
    
    // Sort seeds by energy value
    const sorted = availableSeeds.sort((a, b) => b.energyValue - a.energyValue)
    
    // Pick based on distribution
    const highTier = sorted.slice(0, Math.ceil(sorted.length * 0.3))
    const midTier = sorted.slice(Math.ceil(sorted.length * 0.3), Math.ceil(sorted.length * 0.7))
    const lowTier = sorted.slice(Math.ceil(sorted.length * 0.7))
    
    // Weighted random selection
    const roll = Math.random()
    if (roll < distribution.highestTier && highTier.length > 0) {
      return highTier[Math.floor(Math.random() * highTier.length)]
    } else if (roll < distribution.highestTier + distribution.midTier && midTier.length > 0) {
      return midTier[Math.floor(Math.random() * midTier.length)]
    } else if (lowTier.length > 0) {
      return lowTier[Math.floor(Math.random() * lowTier.length)]
    }
    
    // Fallback to any available seed
    return availableSeeds[0]
  }
}
```

## 5. Watering Tool Integration

### Tool-Based Watering
```javascript
const WATERING_TOOLS = {
  hands: {
    plotsPerAction: 1,
    timePerAction: 2,  // seconds
    available: 'always'
  },
  
  watering_can_ii: {
    plotsPerAction: 2,
    timePerAction: 3,  // seconds
    craftCost: { copper: 5, wood: 3 }
  },
  
  sprinkler_can: {
    plotsPerAction: 4,
    timePerAction: 4,  // seconds
    craftCost: { silver: 3, pine_resin: 1 }
  },
  
  rain_bringer: {
    plotsPerAction: 8,
    timePerAction: 5,  // seconds
    craftCost: { crystal: 1, frozen_heart: 1 },
    specialEffect: 'plots_stay_wet_50_longer'
  }
}

class WateringSystem {
  calculateWateringEfficiency(tool, helperCount) {
    const toolData = WATERING_TOOLS[tool]
    const plotsPerMinute = (60 / toolData.timePerAction) * toolData.plotsPerAction
    
    // Add helper contribution
    const helperPlots = helperCount * 15  // Max level waterer = 15 plots/min
    
    return {
      totalPlotsPerMinute: plotsPerMinute + helperPlots,
      waterConsumed: plotsPerMinute + helperPlots  // 1 water per plot
    }
  }
}
```

## Testing Checklist

### Water Systems
- [ ] Mulch beds extend water duration by 25%
- [ ] Irrigation channels extend by 50%
- [ ] Crystal irrigation extends by 75%
- [ ] Dry plots grow 75% slower
- [ ] Auto-pump I generates 10% cap/hour offline
- [ ] Auto-pump II generates 20% cap/hour
- [ ] Auto-pump III generates 35% cap/hour
- [ ] Crystal pump generates 50% cap/hour
- [ ] Offline water caps at tank maximum
- [ ] Rain Bringer special effect works

### Seed Systems
- [ ] Wind levels contain correct seed tiers
- [ ] Higher wind = harder catch difficulty
- [ ] Nets improve catch rate by correct %
- [ ] Auto-catcher I: 1 seed/10 min from reach-2
- [ ] Auto-catcher II: 1 seed/5 min from reach-2
- [ ] Auto-catcher III: 1 seed/2 min from reach-1
- [ ] Seed storage caps prevent overflow
- [ ] Sower prioritizes watered plots
- [ ] Seed distribution follows game phase strategy
- [ ] **Sower processes multiple plots per tick (3-13/min) even if display shows 1**

## Success Metrics
- Water management reduces manual watering by 50%+ with upgrades
- Auto-catchers provide 720+ seeds/day at tier III
- Seed variety maintained automatically by Sower
- Late game manages 90 plots with helpers + retention
- No water crisis bottlenecks after pump upgrades

## Files to Modify
1. `src/utils/systems/WaterSystem.ts` - New file for retention/auto-pump
2. `src/utils/systems/SeedSystem.ts` - New file for catching mechanics
3. `src/utils/systems/CropSystem.ts` - Integrate water retention
4. `src/utils/SimulationEngine.ts` - Add offline calculations
5. `src/utils/systems/HelperSystem.ts` - Enhance Sower behavior
6. `Data/Unlocks/agronomist.csv` - Verify water upgrades listed