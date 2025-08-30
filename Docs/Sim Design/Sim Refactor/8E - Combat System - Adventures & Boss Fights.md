# 8E - Combat System - Adventures & Boss Fights

## Context
- **What this phase is doing:** See Goals below.
- **What came before:** 7D - Helper System - Automation & Roles
- **What's coming next:** 7F - Crafting & Mining - Forge Heat & Depth Progression

## Scope
### Phase 8E: Combat System - Adventures & Boss Fights ⚔️
**Goals**: Implement real combat simulation with weapon advantages
**Expected Changes**:
- Wave generation from CSV enemy compositions
- Weapon pentagon advantages (1.5x/0.5x damage)
- Boss quirks and special mechanics
- Armor effects applied
- Proper rewards and XP
**Test Command**: Start Meadow Path adventure → Check combat calculations in console
**Success Criteria**: Hero HP decreases realistically, success/failure matches expected outcomes

## Details
## Phase 8E: Combat System - Adventures & Boss Fights
### Files to Modify
- `/src/utils/systems/CombatSystem.ts` - New combat simulation
- `/src/utils/SimulationEngine.ts` - Adventure execution

### Implementation Tasks

#### 1. Create Combat System
```typescript
// New file: src/utils/systems/CombatSystem.ts
export class CombatSystem {
  static simulateAdventure(
    route: any,
    weapons: Map<string, any>,
    armor: any,
    heroLevel: number,
    helpers: any[],
    parameters: any
  ): AdventureResult {
    const baseHP = 100 + (heroLevel * 20)
    let currentHP = baseHP
    let totalGold = 0
    let totalXP = 0
    const events: string[] = []
    
    // Parse route data from CSV
    const routeVariant = route.id.split('_').pop() // short, medium, or long
    const waveCount = this.getWaveCount(route, routeVariant)
    const enemyComposition = this.parseEnemyComposition(route.enemy_types)
    
    // Process waves
    for (let wave = 1; wave <= waveCount; wave++) {
      const waveResult = this.simulateWave(
        wave, 
        enemyComposition, 
        weapons, 
        armor, 
        currentHP,
        helpers
      )
      
      currentHP = waveResult.remainingHP
      events.push(`Wave ${wave}: Lost ${baseHP - currentHP} HP`)
      
      if (currentHP <= 0) {
        return {
          success: false,
          gold: 0,
          xp: 0,
          hp: 0,
          events,
          reason: `Died on wave ${wave}`
        }
      }
      
      // Apply armor effects between waves
      if (armor?.effect === 'Regeneration') {
        const heal = 3
        currentHP = Math.min(baseHP, currentHP + heal)
        events.push(`Regenerated ${heal} HP`)
      }
    }
    
    // Boss fight
    const bossResult = this.simulateBossFight(
      route.boss_type,
      weapons,
      armor,
      currentHP,
      heroLevel
    )
    
    currentHP = bossResult.remainingHP
    events.push(`Boss fight: ${bossResult.description}`)
    
    if (currentHP > 0) {
      // Victory!
      totalGold = CSVDataParser.parseNumericValue(route.gold_gain, 100)
      totalXP = CSVDataParser.parseNumericValue(route.xp_gain, 50)
      
      // Apply Gold Magnet armor effect
      if (armor?.effect === 'Gold Magnet') {
        totalGold = Math.floor(totalGold * 1.25)
        events.push('Gold Magnet: +25% gold')
      }
      
      return {
        success: true,
        gold: totalGold,
        xp: totalXP,
        hp: currentHP,
        events,
        loot: this.generateLoot(route, bossResult.bossDefeated),
        materials: this.parseMaterialRewards(route.materials_gain)
      }
    }
    
    return {
      success: false,
      gold: 0,
      xp: 0,
      hp: 0,
      events,
      reason: 'Died to boss'
    }
  }
  
  static simulateWave(
    waveNumber: number,
    composition: Map<string, number>,
    weapons: Map<string, any>,
    armor: any,
    currentHP: number,
    helpers: any[]
  ): { remainingHP: number; enemiesKilled: number } {
    let totalDamageDealt = 0
    let totalDamageTaken = 0
    let enemiesKilled = 0
    
    // Generate enemies for this wave
    const enemyCount = 1 + Math.floor(waveNumber / 3) // 1-5 enemies based on wave
    const enemies = this.generateEnemies(enemyCount, composition)
    
    for (const enemy of enemies) {
      // Select best weapon
      const weapon = this.selectBestWeapon(weapons, enemy.type)
      if (!weapon) continue
      
      // Calculate damage
      const damagePerHit = this.calculateDamage(weapon, enemy)
      const hitsToKill = Math.ceil(enemy.hp / damagePerHit)
      const timeToKill = hitsToKill / weapon.attackSpeed
      
      // Apply helper damage if fighter assigned
      const fighterHelper = helpers.find(h => h.role === 'fighter')
      if (fighterHelper) {
        const helperDamage = 5 + fighterHelper.level * 2
        enemy.hp -= helperDamage * timeToKill
      }
      
      // Calculate damage taken
      const defenseMitigation = armor ? (armor.defense / 100) : 0
      const incomingDamage = enemy.damage * timeToKill * (1 - defenseMitigation)
      
      // Apply armor special effects
      if (armor?.effect === 'Reflection' && Math.random() < 0.15) {
        totalDamageTaken += incomingDamage * 0.7 // 30% reflected
      } else if (armor?.effect === 'Evasion' && Math.random() < 0.1) {
        // Dodged entirely
      } else if (armor?.effect === 'Critical Shield' && enemiesKilled === 0) {
        // First hit negated
      } else {
        totalDamageTaken += incomingDamage
      }
      
      enemiesKilled++
      
      // Vampiric healing
      if (armor?.effect === 'Vampiric') {
        currentHP += 1 // Heal 1 HP per kill
      }
    }
    
    return {
      remainingHP: currentHP - totalDamageTaken,
      enemiesKilled
    }
  }
  
  static calculateDamage(weapon: any, enemy: any): number {
    const baseDamage = weapon.damage || 10
    
    // Weapon type advantages (pentagon system)
    const advantages = {
      'spear': 'armored_insects',
      'sword': 'predatory_beasts',
      'bow': 'flying_predators',
      'crossbow': 'venomous_crawlers',
      'wand': 'living_plants'
    }
    
    const resistances = {
      'spear': 'predatory_beasts',
      'sword': 'flying_predators',
      'bow': 'venomous_crawlers',
      'crossbow': 'living_plants',
      'wand': 'armored_insects'
    }
    
    let multiplier = 1.0
    if (advantages[weapon.type] === enemy.type) {
      multiplier = 1.5 // Advantage
    } else if (resistances[weapon.type] === enemy.type) {
      multiplier = 0.5 // Resistance
    }
    
    return baseDamage * multiplier
  }
  
  static simulateBossFight(
    bossType: string,
    weapons: Map<string, any>,
    armor: any,
    currentHP: number,
    heroLevel: number
  ): { remainingHP: number; bossDefeated: boolean; description: string } {
    const bosses = {
      'giant_slime': {
        hp: 150,
        damage: 8,
        attackSpeed: 0.5,
        weakness: null,
        quirk: 'splits'
      },
      'beetle_lord': {
        hp: 200,
        damage: 10,
        attackSpeed: 0.4,
        weakness: 'spear',
        quirk: 'hardened_shell'
      },
      'alpha_wolf': {
        hp: 250,
        damage: 12,
        attackSpeed: 0.8,
        weakness: 'sword',
        quirk: 'pack_leader'
      },
      'sky_serpent': {
        hp: 300,
        damage: 10,
        attackSpeed: 1.0,
        weakness: 'bow',
        quirk: 'aerial_phase'
      },
      'crystal_spider': {
        hp: 400,
        damage: 12,
        attackSpeed: 0.6,
        weakness: 'crossbow',
        quirk: 'web_trap'
      },
      'frost_wyrm': {
        hp: 500,
        damage: 15,
        attackSpeed: 0.7,
        weakness: 'wand',
        quirk: 'frost_armor'
      },
      'lava_titan': {
        hp: 600,
        damage: 18,
        attackSpeed: 0.5,
        weakness: 'rotating',
        quirk: 'molten_core'
      }
    }
    
    const boss = bosses[bossType] || bosses['giant_slime']
    let bossHP = boss.hp
    let totalDamage = 0
    let description = `Fighting ${bossType}`
    
    // Check if we have the weakness weapon
    const hasWeakness = boss.weakness && weapons.has(boss.weakness)
    
    // Apply quirk penalties
    if (boss.quirk === 'hardened_shell' && !hasWeakness) {
      description += ' (50% damage without spear)'
      totalDamage *= 2 // Takes twice as long
    }
    
    if (boss.quirk === 'aerial_phase' && !weapons.has('bow')) {
      totalDamage += boss.damage * 5 // 5 seconds of free damage
      description += ' (took aerial damage)'
    }
    
    if (boss.quirk === 'molten_core') {
      const burnDamage = 2 * (bossHP / 20) // 2 damage per second for entire fight
      totalDamage += burnDamage
      description += ' (burn damage throughout)'
    }
    
    // Calculate fight duration and damage
    const weapon = hasWeakness ? weapons.get(boss.weakness) : Array.from(weapons.values())[0]
    const damagePerHit = weapon ? weapon.damage * (hasWeakness ? 1.5 : 1.0) : 10
    const timeToKill = bossHP / (damagePerHit * weapon.attackSpeed)
    
    const defenseMitigation = armor ? (armor.defense / 100) : 0
    totalDamage += boss.damage * boss.attackSpeed * timeToKill * (1 - defenseMitigation)
    
    return {
      remainingHP: currentHP - totalDamage,
      bossDefeated: currentHP > totalDamage,
      description
    }
  }
  
  static generateLoot(route: any, bossDefeated: boolean): any[] {
    if (!bossDefeated) return []
    
    const loot = []
    
    // Boss materials (guaranteed)
    if (route.boss_material) {
      loot.push({
        type: 'material',
        id: route.boss_material,
        quantity: 1
      })
    }
    
    // Armor drop chance
    if (Math.random() < 0.3) { // 30% chance
      const defenseRatings = ['minimal', 'low', 'medium', 'high', 'extreme']
      const effects = ['reflection', 'evasion', 'gold_magnet', 'regeneration', 'type_resist']
      
      loot.push({
        type: 'armor',
        defense: defenseRatings[Math.floor(Math.random() * defenseRatings.length)],
        effect: effects[Math.floor(Math.random() * effects.length)],
        upgradePotential: Math.random() < 0.2 ? 'excellent' : 'average'
      })
    }
    
    return loot
  }
  
  /**
   * Gets wave count for a route variant
   * SOURCE: These values are from the game design document, hardcoded here for clarity
   * In production, these should come from CSV data (waves_short, waves_medium, waves_long columns)
   * 
   * @param route - The adventure route object from CSV
   * @param variant - 'short', 'medium', or 'long' variant of the route
   * @returns Number of waves for this route variant
   */
  private static getWaveCount(route: any, variant: string): number {
    // WAVE COUNT SOURCE: Time Hero - Unified Game Design document Section 6.2
    // These should ideally be in CSV columns: waves_short, waves_medium, waves_long
    const waveCounts = {
      'meadow_path': { short: 3, medium: 5, long: 8 },
      'pine_vale': { short: 4, medium: 6, long: 10 },
      'dark_forest': { short: 4, medium: 7, long: 12 },
      'mountain_pass': { short: 5, medium: 8, long: 14 },
      'crystal_caves': { short: 5, medium: 9, long: 16 },
      'frozen_tundra': { short: 6, medium: 10, long: 18 },
      'volcano_core': { short: 6, medium: 11, long: 20 }
    }
    
    const routeBase = route.id.replace(`_${variant}`, '')
    return waveCounts[routeBase]?.[variant] || 5
  }
  
  private static parseEnemyComposition(enemyTypes: string): Map<string, number> {
    const composition = new Map<string, number>()
    
    // Parse format: "Slimes (100%)" or "Beasts (60%), Slimes (40%)"
    const matches = enemyTypes.matchAll(/(\w+)\s*\((\d+)%\)/g)
    for (const match of matches) {
      const type = match[1].toLowerCase()
      const percentage = parseInt(match[2]) / 100
      composition.set(type, percentage)
    }
    
    return composition
  }
  
  private static generateEnemies(count: number, composition: Map<string, number>): any[] {
    const enemies = []
    const types = Array.from(composition.entries())
    
    for (let i = 0; i < count; i++) {
      // Random selection based on composition percentages
      const rand = Math.random()
      let cumulative = 0
      let selectedType = 'slimes'
      
      for (const [type, percentage] of types) {
        cumulative += percentage
        if (rand <= cumulative) {
          selectedType = type
          break
        }
      }
      
      enemies.push(this.createEnemy(selectedType))
    }
    
    return enemies
  }
  
  private static createEnemy(type: string): any {
    const enemyStats = {
      'slimes': { hp: 20, damage: 3, attackSpeed: 1.0 },
      'armored_insects': { hp: 30, damage: 4, attackSpeed: 0.8 },
      'predatory_beasts': { hp: 25, damage: 6, attackSpeed: 1.2 },
      'flying_predators': { hp: 20, damage: 5, attackSpeed: 1.5 },
      'venomous_crawlers': { hp: 35, damage: 4, attackSpeed: 1.0 },
      'living_plants': { hp: 40, damage: 3, attackSpeed: 0.7 }
    }
    
    return {
      type,
      ...(enemyStats[type] || enemyStats['slimes'])
    }
  }
  
  private static selectBestWeapon(weapons: Map<string, any>, enemyType: string): any {
    // Find weapon with advantage
    const advantages = {
      'armored_insects': 'spear',
      'predatory_beasts': 'sword',
      'flying_predators': 'bow',
      'venomous_crawlers': 'crossbow',
      'living_plants': 'wand'
    }
    
    const idealWeapon = advantages[enemyType]
    if (idealWeapon && weapons.has(idealWeapon)) {
      return weapons.get(idealWeapon)
    }
    
    // Return any weapon, preferring one without resistance
    for (const [type, weapon] of weapons) {
      const resistances = {
        'spear': 'predatory_beasts',
        'sword': 'flying_predators',
        'bow': 'venomous_crawlers',
        'crossbow': 'living_plants',
        'wand': 'armored_insects'
      }
      
      if (resistances[type] !== enemyType) {
        return weapon
      }
    }
    
    // Return first available weapon
    return weapons.values().next().value
  }
  
  private static parseMaterialRewards(materialsString: string): Map<string, number> {
    if (!materialsString) return new Map()
    return CSVDataParser.parseMaterials(materialsString)
  }
}
```

### Testing Phase 8E
```javascript
// Start Meadow Path Short adventure
// Check combat log for wave processing
// Verify HP decreases appropriately
// Check weapon switching based on enemy types
// Verify boss fight mechanics
// Check loot and rewards on success
```

---
