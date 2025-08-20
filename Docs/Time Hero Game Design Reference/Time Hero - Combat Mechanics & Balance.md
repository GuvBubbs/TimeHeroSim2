# **Time Hero \- Combat Mechanics & Balance**

## **Core Combat Philosophy**

Combat in Time Hero is **preparation-driven**: success depends on choosing the right loadout before departing, not on reaction time during the adventure. The hero auto-walks left to right, auto-switches weapons based on enemy type, and outcomes are deterministic.

---

## **1\. Hero Stats & Progression**

### **1.1 HP & Level System**

**Base HP Formula**: `HP = 100 + (Level × 20)`

| Level | XP Required | Total HP | Unlocked At |
| ----- | ----- | ----- | ----- |
| 1 | 0 | 120 | Tutorial |
| 2 | 100 | 140 | \~3 adventures |
| 3 | 300 | 160 | \~8 adventures |
| 4 | 600 | 180 | \~15 adventures |
| 5 | 1,000 | 200 | Early Game completion |
| 6 | 1,500 | 220 | Mid Game |
| 7 | 2,100 | 240 | Mid Game |
| 8 | 2,800 | 260 | Late Game |
| 9 | 3,600 | 280 | Late Game |
| 10 | 4,500 | 300 | Endgame |
| 11 | 5,500 | 320 | Endgame |
| 12 | 6,600 | 340 | Endgame |
| 13 | 7,800 | 360 | Post-game |
| 14 | 9,100 | 380 | Post-game |
| 15 | 10,500 | 400 | Max Level |

**XP Gains per Adventure**:

* Short: 10 XP base  
* Medium: 30 XP base  
* Long: 60 XP base  
* Boss kill bonus: \+20 XP

### **1.2 Defense System**

Defense reduces incoming damage by a percentage. Total defense comes from:

**Total Defense** \= Armor Base Defense \+ Forge Upgrade Bonus

**Damage Reduction Formula**: `Damage Taken = Base Damage × (1 - Defense/100)`

* Maximum defense capped at 80 (80% reduction)

---

## **2\. Armor System**

### **2.1 Armor Mechanics**

* **Inventory Limit**: 3 armor pieces maximum  
* **Equipment**: 1 armor piece active at a time  
* **Acquisition**: Boss drops only (not regular enemies)  
* **Forge Upgrades**: Each piece can be upgraded ONCE at the forge

### **2.2 Armor Stats**

Each armor piece has two ratings:

1. **Base Defense Rating** (fixed when dropped)  
2. **Upgrade Potential** (determines forge improvement)

| Defense Rating | Base Defense Value | Drop Weight |
| ----- | ----- | ----- |
| Minimal | 5 | 35% |
| Low | 10 | 30% |
| Medium | 15 | 20% |
| High | 20 | 10% |
| Extreme | 25 | 5% |

| Upgrade Potential | Forge Bonus | Drop Weight |
| ----- | ----- | ----- |
| Poor | \+5 defense | 40% |
| Average | \+10 defense | 35% |
| Good | \+15 defense | 20% |
| Excellent | \+20 defense | 5% |

**Forge Upgrade Costs**:

* Gold: 100 × (Current Defense \+ Potential)  
* Materials: Varies by route tier  
* Energy: 50 × Route Tier  
* Success Rate: 100% (guaranteed, one-time only)

### **2.3 Armor Special Effects**

In addition to defense, each armor piece has ONE special effect:

| Effect | Description | Drop Weight | Best Against |
| ----- | ----- | ----- | ----- |
| Reflection | 15% chance to reflect 30% damage | 10% | Alpha Wolf (cubs) |
| Evasion | 10% chance to dodge attack entirely | 10% | High damage bosses |
| Gold Magnet | \+25% gold from this adventure | 20% | Farming runs |
| Regeneration | Heal 3 HP between waves | 15% | Long routes |
| Type Resist (×5) | \-40% damage from specific enemy type | 25% (5% each) | Specific routes |
| Speed Boost | \+20% attack speed after taking damage | 10% | Boss races |
| Critical Shield | First hit each wave deals 0 damage | 5% | Many small waves |
| Vampiric | Heal 1 HP per enemy killed | 5% | Routes with many enemies |

### **2.4 Route-Specific Loot Tables**

Each route favors different defense ratings:

| Route | Minimal | Low | Medium | High | Extreme |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Meadow Path | 50% | 30% | 15% | 5% | 0% |
| Pine Vale | 40% | 35% | 20% | 5% | 0% |
| Dark Forest | 35% | 35% | 25% | 5% | 0% |
| Mountain Pass | 30% | 30% | 30% | 10% | 0% |
| Crystal Caves | 25% | 30% | 30% | 13% | 2% |
| Frozen Tundra | 20% | 25% | 35% | 17% | 3% |
| Volcano Core | 15% | 20% | 40% | 20% | 5% |

---

## **3\. Enemy Design & Scaling**

### **3.1 Enemy Types & Damage**

| Enemy Type | Base Damage | Attack Speed | HP | Weak To | Resistant To |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Slimes | 3 | 1.0/sec | 20 | All (neutral) | None |
| Armored Insects | 4 | 0.8/sec | 30 | Spear | Sword |
| Predatory Beasts | 6 | 1.2/sec | 25 | Sword | Bow |
| Flying Predators | 5 | 1.5/sec | 20 | Bow | Crossbow |
| Venomous Crawlers | 4 | 1.0/sec | 35 | Crossbow | Wand |
| Living Plants | 3 | 0.7/sec | 40 | Wand | Spear |

**Damage Modifiers**:

* Weakness: Enemy takes 1.5× damage  
* Resistance: Enemy takes 0.5× damage  
* Neutral: Enemy takes 1.0× damage

### **3.2 Wave Composition by Route**

| Route         | Wave Size | Enemy Rolls | Total Waves (S/M/L) | Boss                          | Notes            |
| ------------- | --------- | ----------- | ------------------- | ----------------------------- | ---------------- |
| Meadow Path   | 1-2       | Fixed       | 3/5/8               | Giant Slime                   | Slimes only      |
| Pine Vale     | 1-2       | 1           | 4/6/10              | Beetle Lord                   |                  |
| Dark Forest   | 2-3       | 2           | 4/7/12              | Alpha Wolf                    |                  |
| Mountain Pass | 2-3       | 2           | 5/8/14              | Sky Serpent                   |                  |
| Crystal Caves | 2-4       | 3           | 5/9/16              | Crystal Spider                |                  |
| Frozen Tundra | 3-4       | 3           | 6/10/18             | Frost Wyrm                    |                  |
| Volcano Core  | 3-5       | 3           | 6/11/20             | Lava Titan (rotates weakness) | Mix of all types |

### **3.3 Boss Stats & Quirks**

| Boss | HP | Damage | Attack Speed | Weakness | Quirk | Counter-Strategy |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Giant Slime | 150 | 8 | 0.5/sec | None | **Splits**: At 50% HP, becomes 2 mini-slimes (4 damage each) | High defense helps more than HP |
| Beetle Lord | 200 | 10 | 0.4/sec | Spear | **Hardened Shell**: Takes 50% less damage from non-weakness weapons | Spear is mandatory |
| Alpha Wolf | 250 | 12 | 0.8/sec | Sword | **Pack Leader**: Summons 2 cubs (3 damage each) at 75% and 25% HP | AOE effects or Reflection armor |
| Sky Serpent | 300 | 10 | 1.0/sec | Bow | **Aerial Phase**: Every 20 seconds, flies for 5 seconds (can only be hit by Bow) | Bow required or take guaranteed damage |
| Crystal Spider | 400 | 12 | 0.6/sec | Crossbow | **Web Trap**: Every 30 seconds, disables weapons for 3 seconds | High defense to survive disabled periods |
| Frost Wyrm | 500 | 15 | 0.7/sec | Wand | **Frost Armor**: Gains 30 defense when below 50% HP | Wand needed to break through late phase |
| Lava Titan | 600 | 18 | 0.5/sec | Rotates | **Molten Core**: Deals 2 burn damage/sec throughout entire fight | Regeneration armor strongly recommended |

**Boss Design Philosophy**: Each boss has a quirk that either:

* Demands a specific weapon (Beetle Lord, Sky Serpent)  
* Rewards specific armor effects (Alpha Wolf → Reflection)  
* Creates unavoidable damage windows (Crystal Spider's web)  
* Adds consistent pressure (Lava Titan's burn)

---

## **4\. Combat Flow & Timing**

### **4.1 Adventure Pacing**

**Wave Spacing**:

* Short routes: Wave every 30-45 seconds  
* Medium routes: Wave every 40-60 seconds  
* Long routes: Wave every 45-70 seconds

**Between Waves**:

* 5-second travel period (no combat)  
* Regeneration effects trigger here  
* Visual breather for watching players

**Combat Duration per Enemy**:

* With advantage: 2-3 seconds  
* Neutral: 4-5 seconds  
* With resistance: 8-10 seconds

### **4.2 Sustain & Healing**

**Natural Recovery**:

* No healing between waves without specific effects  
* HP persists through entire adventure  
* Full HP restored after adventure ends (win or lose)

**Healing Sources**:

1. **Regeneration Armor**: 3 HP between each wave  
2. **Vampiric Armor**: 1 HP per enemy killed  
3. **Gnome Support**: If assigned, heals 1 HP every 30 seconds  
4. **Rest Nodes**: Long routes only \- restore 10% max HP at 50% progress

**Healing Strategy**: Players must balance immediate defense (high DEF armor) vs sustain (regeneration effects) based on route length.

### **4.3 Weapon Auto-Switching**

The hero automatically switches between equipped weapons based on enemy type:

1. **Priority System**: Hero uses the weapon with advantage if available  
2. **Fallback**: If no advantage, uses neutral weapon  
3. **Forced Choice**: If facing resistance on both weapons, uses primary (first slot)

**Switch Time**: 0.5 seconds (hero is vulnerable during switch)

### **4.4 Route Timing Breakdown**

| Route | Short | Medium | Long |
| ----- | ----- | ----- | ----- |
| Meadow Path | 3 min (3 waves \+ boss) | 8 min (5 waves \+ boss) | 15 min (8 waves \+ boss) |
| Pine Vale | 5 min (4 waves \+ boss) | 15 min (6 waves \+ boss) | 30 min (10 waves \+ boss) |
| Dark Forest | 8 min (4 waves \+ boss) | 20 min (7 waves \+ boss) | 45 min (12 waves \+ boss) |
| Mountain Pass | 10 min (5 waves \+ boss) | 30 min (8 waves \+ boss) | 60 min (14 waves \+ boss) |
| Crystal Caves | 15 min (5 waves \+ boss) | 40 min (9 waves \+ boss) | 90 min (16 waves \+ boss) |
| Frozen Tundra | 20 min (6 waves \+ boss) | 50 min (10 waves \+ boss) | 120 min (18 waves \+ boss) |
| Volcano Core | 25 min (6 waves \+ boss) | 65 min (11 waves \+ boss) | 150 min (20 waves \+ boss) |

---

## **5\. Risk Calculation & Route Selection**

### **5.1 Risk Indicator**

The signpost displays a risk level for each route length based on your current loadout:

**Risk Factors**:

1. **Coverage**: What % of enemies can you handle effectively?  
2. **HP Cushion**: Current HP vs expected damage  
3. **Defense**: Total defense vs route difficulty  
4. **Boss Match**: Do you have the boss's weakness covered?

**Risk Levels**:

* **Safe** (Green): 80%+ success chance  
* **Moderate** (Yellow): 50-79% success chance  
* **Dangerous** (Orange): 20-49% success chance  
* **Deadly** (Red): \<20% success chance

### **5.2 Enemy Roll System**

When you approach a route, each length (Short/Medium/Long) rolls its enemy composition:

* Roll is **fixed** until you complete or fail that specific length  
* Other lengths keep their rolls if not attempted  
* After win or loss, that length rerolls next time

---

## **6\. Combat Resolution**

### **6.1 Energy Cost**

**All-or-Nothing System**:

* Energy cost is paid upfront when starting the adventure  
* Win or lose, the full energy is consumed  
* No partial refunds for failing early  
* Represents the hero's commitment and recovery time

### **6.2 Success Conditions**

Adventure succeeds if:

* Hero HP \> 0 when boss is defeated  
* All waves cleared before boss

### **6.3 Failure Conditions**

Adventure fails if:

* Hero HP reaches 0 at any point  
* Energy is still fully consumed  
* No rewards gained  
* Route length rerolls for next attempt

### **6.4 Damage Calculation Example**

**Scenario**: Level 5 hero (200 HP) with Medium armor (+15 base, \+10 upgraded \= 25 defense) faces a Predatory Beast (6 damage)

1. Base damage: 6  
2. Defense reduction: 6 × (1 \- 25/100) \= 6 × 0.75 \= 4.5 damage  
3. Weapon matchup:  
   * If using Sword (advantage): Beast dies in 3 hits (\~2.5 seconds)  
   * If using Bow (resistance): Beast dies in 10 hits (\~8 seconds)  
4. Total damage taken:  
   * With Sword: 4.5 × 3 \= 13.5 damage  
   * With Bow: 4.5 × 10 \= 45 damage

This shows the importance of bringing the right weapons\!

---

## **7\. Progression Expectations**

### **7.1 Typical Player Journey**

| Game Phase | Player Level | Typical HP | Expected Defense | Routes Accessible |
| ----- | ----- | ----- | ----- | ----- |
| Tutorial | 1-2 | 120-140 | 0-5 | Meadow Path |
| Early Game | 3-5 | 160-200 | 10-20 | Pine Vale, Dark Forest |
| Mid Game | 6-8 | 220-260 | 25-40 | Mountain Pass |
| Late Game | 9-11 | 280-320 | 45-60 | Crystal Caves |
| Endgame | 12-15 | 340-400 | 65-80 | Frozen Tundra, Volcano Core |

### **7.2 Armor Collection Goals**

* **By Mid Game**: 3 armor pieces, at least 1 with Medium defense  
* **By Late Game**: All 3 pieces Medium+, at least 1 upgraded  
* **By Endgame**: All 3 pieces High+, all upgraded, strategic effect selection

---

## **8\. Strategic Considerations**

### **8.1 Weapon Loadout Strategy**

**Coverage Approach**: Pick weapons that cover the most enemy types in the rolled set

* Example: If roll shows 60% Beasts, 40% Slimes → Sword is mandatory

**Boss Focus**: Pick weapons including the boss's weakness

* Trade worse mob coverage for guaranteed boss efficiency

**Resistance Avoidance**: Never bring weapons that face 50%+ resistance in the roll

### **8.2 Armor Management**

**Early Game**: Take any armor, prioritize defense over effects **Mid Game**: Start considering effects (Gold Magnet for economy) **Late Game**: Optimize for specific routes (Type Resist for problem enemies) **Endgame**: Min-max defense ratings vs upgrade potential

### **8.3 Forge Investment Priority**

1. **High Defense \+ Poor Potential**: Upgrade immediately for quick power  
2. **Medium Defense \+ Excellent Potential**: Long-term investment  
3. **Low Defense \+ Any Potential**: Consider selling unless effect is perfect

---

## **9\. Balancing Notes**

### **Key Ratios to Maintain**

* **HP to Enemy Damage**: Hero should survive 30-50 hits at-level  
* **Defense Impact**: Max defense (80) should enable 5× survivability  
* **Weapon Advantage**: Should reduce combat time by 60-70%  
* **Boss Difficulty**: Boss should deal 15-25% of hero's total HP (with proper counter-build)

### **Boss Quirk Design Principles**

Each boss quirk should:

1. **Create a puzzle** that rewards preparation over raw stats  
2. **Have a clear counter** (specific weapon or armor effect)  
3. **Punish ignorance** but not be impossible without the counter  
4. **Scale differently** with route length (some quirks hurt more on Long routes)

### **Escape Valves**

* **Overlevel**: Players can grind XP on easier routes  
* **Overgear**: Forge upgrades provide linear power increase  
* **Reroll Exploitation**: Can force rerolls by failing deliberately (costs energy)  
* **Backtrack Farming**: Previous routes remain viable for materials/gold

---

## **10\. Example Combat Scenario**

**Setup**: Level 7 hero attempts Mountain Pass (Long)

* HP: 240  
* Equipped: Sword \+ Bow  
* Armor: Medium defense (15 base \+ 10 upgrade \= 25 total) with Regeneration effect  
* Route roll: 50% Flying Predators, 50% Armored Insects  
* Boss: Sky Serpent (weak to Bow)

**Wave 1**: 2 Flying Predators

* Hero auto-switches to Bow (advantage)  
* Each predator dies in 3 hits (2 seconds)  
* Hero takes: 5 damage × (1 \- 0.25) × 2 attacks \= 7.5 damage  
* HP: 232.5/240  
* *Between waves: Regeneration \+3 HP*  
* HP: 235.5/240

**Wave 2**: 3 Armored Insects

* Hero auto-switches to Sword (neutral)  
* Each insect dies in 5 hits (4 seconds)  
* Hero takes: 4 damage × 0.75 × 4 attacks \= 12 damage  
* HP: 223.5/240  
* *Between waves: Regeneration \+3 HP*  
* HP: 226.5/240

*\[Fast forward through 14 waves...\]*

* After 14 waves with regeneration: \~180/240 HP

**Boss**: Sky Serpent

* Hero uses Bow (advantage)  
* Boss HP: 300, Hero damage with Bow VII: \~15/hit  
* Boss dies in 20 hits (15 seconds with Bow attack speed)  
* Hero takes: 10 damage × 0.75 × 15 attacks \= 112.5 damage  
* During aerial phases (5 seconds): Only Bow can hit, no melee damage taken  
* Final HP: \~67/240

**Result**: SUCCESS \- Mountain Pass (Long) completed\!

* Rewards: 2,000 gold, Silver ×3, Mountain Stone ×1  
* XP Gained: 60 \+ 20 (boss) \= 80 XP  
* Armor Drop: Roll for new armor piece

**Key Insights**:

1. The 25 defense (25% reduction) made the adventure survivable  
2. Regeneration armor provided 42 HP of healing (14 waves × 3\)  
3. Having Bow for the boss was crucial \- without it, aerial phases would be unwinnable  
4. Final HP margin shows this was appropriately challenging for Level 7

---

## **11\. Balancing Summary**

### **Rebalanced Key Ratios**

* **HP to Enemy Damage**: Hero survives 30-50 hits at-level (up from 20-30)  
* **Defense Impact**: 80 defense \= 80% reduction (more intuitive than 150 \= 75%)  
* **Boss Damage**: Reduced to 8-18 (from 15-50) to allow survival  
* **Healing Importance**: Regeneration adds \~15-20% effective HP on long routes

### **Strategic Build Considerations**

**Short Routes**:

* Prioritize raw defense over effects  
* Boss quirks less important due to shorter fights

**Medium Routes**:

* Balance defense and utility effects  
* Consider boss quirk (especially Beetle Lord, Sky Serpent)

**Long Routes**:

* Regeneration or Vampiric effects become mandatory  
* Must prepare for boss quirk  
* Rest node at 50% provides crucial recovery

### **Armor Building Philosophy**

Players should eventually collect:

1. **The Tank**: Extreme defense \+ Good potential (for raw survival)  
2. **The Sustainer**: Any defense \+ Regeneration/Vampiric (for long routes)  
3. **The Farmer**: Any defense \+ Gold Magnet (for economy)

Then swap based on the specific challenge ahead.

