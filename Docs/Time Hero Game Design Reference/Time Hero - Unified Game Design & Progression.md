# **Time Hero – Unified Game Design & Progression**

## **1\) Vision & Pillars**

* One-hand friendly controls (d-pad/A/B; short crank bursts only).  
* Autonomy-first hero behavior; you set direction via upgrades.  
* Purposeful idling capped by storage. Clear, readable time & cost.  
* **Real-time progression**: All timers (growth, crafting, adventures) use real-world minutes/hours. There is no separate "game time" \- when something takes 30 minutes, that's 30 real minutes.

## **2\) Core Loop**

Seeds → Farm → Food → Energy → Adventures/Mine/Forge → Gold & Materials → Town Upgrades → Better Seeds/Production → repeat.

### **2.1) Screen quick reference**

| Screen | What it does | Why you visit | Key progression levers |
| ----- | ----- | ----- | ----- |
| **Home / Farm** | Grow and harvest crops; pump water; perform land cleanups. Generates most **energy**. | To gain energy and fuel for all other activities. | Agronomist upgrades; Land Deeds; Carry skill; Tools from Blacksmith. |
| **Tower** | Extend arm to catch seeds at different wind levels; unlock higher bands; set up Auto-Catcher. | To gain seeds to access better crops and broaden the seed pool. | Wind levels (replacing floors), Nets, Auto-Catchers from Carpenter. |
| **Town** | Vendor hub for blueprints, deeds, and skills. | To buy progression-critical unlocks. | Blacksmith (tools/forge), Agronomist (farm systems), Land Steward (deeds), Skills Trainer (skills). |
| **Adventure** | Sign Post to choose routes with risk assessment; auto-combat with weapon switching; earn boss materials, gold, and armor pieces. Hero HP and Defense determine survivability | To gain gold, finish quests and free helpers. | Route tiers unlocked by finishing previous routes. (Soft gated by energy & items) |
| **Forge** | Craft tools and upgrades via heat-band timing; refine raw materials; increase throughput. | To unlock/upgrade tools and forge tiers. Refine raw materials. | Bellows, Furnace, Anvils, Recipes from Blacksmith. |
| **Mine** | Convert energy to depth over time; sharpen tools for buffs; find materials/helpers. | To acquire raw materials. | Pickaxe tiers gate depth access; energy drain limits deep runs. |

### **2.2) Phases by Farm Expansion**

Phases are defined by the farm's **land deeds** (purchased in Town) and the cleanups you complete afterward. **Progression is based entirely on prerequisites and achievements, not real-world time.**

| Phase | Farm Level | Land Size | Deed (Town) | Prerequisites | Post-Deed Cleanups |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Tutorial | Starter Plot | 3→8 plots | – (tutorial area) | – | Clear weeds & till |
| Early Game | Small Hold | 8→20 plots | – (no deed) | Complete Stage 1 | Rocks & till batches |
| Mid Game | Homestead | 20→40 plots | **Homestead Deed** | Complete Stage 2 (20 plots) | Boulders \+ stumps \+ till |
| Late Game | Manor Grounds | 40→65 plots | **Manor Grounds Deed** | Complete Stage 3 (40 plots) | Excavations \+ thickets \+ terraform |
| End Game | Great Estate | 65→90 plots | **Great Estate Deed** | Complete Stage 4 (65 plots) | Blasts \+ ancient roots \+ sacred clearing |
| Post Game | Legacy Estate | 90+ plots | (Future Content) | Complete Stage 5 | (Future Content) |

**Note on Post-Game**: A prestige system is planned where your hero eventually grows old and the farm falls into disrepair. Your child then inherits the land and begins anew with certain bonuses. This system will be fully designed after the core game loop is perfected.

### **2.3) Farm Manageability Expansion**

| Phase | Plots | Hero Alone | Management Strategy |
| ----- | ----- | ----- | ----- |
| Tutorial | 3-8 | Manageable | Direct control |
| Early | 8-20 | Challenging | Upgrade Hero |
| Mid | 20-40 | Overwhelming | Get helper |
| Late | 40-65 | Impossible | Get more helpers & upgrades |
| Endgame | 65-90 | Impossible | Even more helpers & upgrades |
| Post-End | 90-120 | Impossible | Full automation kingdom |

---

## **3\) Home – Farm**

**What you do:** Plant → water → harvest. The farm is the primary **energy** engine and the pacing driver for the whole game.

**Key actions**

* Pump water (crank) to fill the tank.  
* Plant from seed storage; harvest into crop storage.  
* Perform on-farm **cleanups** (ticks). **New land** (deeds) is bought in Town.

### **Water System**

* **Plots drain water at a standard rate** when watered (1 water per plot)  
* **All crops require the same water** regardless of type or growth stage  
* **Optimizations come from**:  
  * More gnomes assigned to watering roles  
  * Bigger watering cans (water multiple plots at once)  
  * Higher water capacity and pump speeds

### **Energy Conversion**

* **Harvested crops instantly convert to energy** when collected  
* **No intermediate crop storage** \- energy is the universal currency  
* **Players don't track individual food types** in their energy pool

### **Inputs and Actions**

| Input | Action | Details |
| ----- | ----- | ----- |
| **D-pad** | Navigate menus | Move through upgrade options, cleanup tasks, and farm management menus |
| **B Button** | Inventory | View current seeds, see what crops are planted, check storage levels |
| **A Button** | Action menu | Direct hero to spend resources on tasks (e.g., "Spend 150 energy to remove stump") |
| **Crank** | Pump water | Physical pump motion \- crank up and down to draw water into the well tank |

### **3.1 Unlock Order (Farm)**

Farm unlocks are grouped by **farm stage** (based on plot count). This section removes deed references; purchases happen elsewhere.

| Order | Farm Stage | Plots Range | What it does | Cleanups (on Farm) |
| ----- | ----- | ----- | ----- | ----- |
| 1 | **Stage 1 – Starter Plot** | 3→8 | Teaches core loop; small, safe workspace to learn water/carry rhythm | Clear Weeds → Till |
| 2 | **Stage 2 – Small Hold** | 8→20 | Expands field; introduces rocks; raises energy/water demands modestly | Rocks → Till batches |
| 3 | **Stage 3 – Homestead** | 20→40 | Major capacity jump; unlocks tougher obstacles; sets up mid-tier crops/routes | Boulders → Stumps → Till |
| 4 | **Stage 4 – Manor Grounds** | 40→65 | Broad expansion; requires advanced tools; supports late-tier crops & longer runs | Excavations → Thickets → Terraform |
| 5 | **Stage 5 – Great Estate** | 65→90 | Endgame farmland size; enables heavy automation and late cleanups | Blasts → Ancient Roots → Sacred Clearing |

### **3.2 Land Cleanups (Ticks – done on the Farm)**

Ticks cost **energy** and require the right **tool**. This section lists on-farm cleanups by **farm stage**; purchasing new land happens in Town.

#### **Stage 1 – Starter Plot (3→8 plots)**

| Cleanup | Plots \+ | Total Plots | Energy Cost | Tool Required | Yields |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Clear Weeds \#1 | \+2 | 5 | 5/weed (×3) | Hands | \- |
| Clear Weeds \#2 | \+3 | 8 | 10/weed (×5) | Hands | \- |

**Repeatable Actions (Tutorial area):**

| Action | Energy Cost | Tool Required | Yields | Cooldown |
| ----- | ----- | ----- | ----- | ----- |
| Gather Sticks | 5 energy | Hands | Wood ×1 | None |
| Break Branches | 10 energy | Hands | Wood ×2 | None |

#### **Stage 2 – Small Hold (8→20 plots)**

| Cleanup | Plots \+ | Total Plots | Energy Cost | Tool Required | Yields |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Collect Dead Trees | \+2 | 10 | 15/tree (×4) | Hands | Wood ×8 |
| Till Soil \#1 | \+3 | 13 | 20/plot | Hoe | \- |
| Clear Rocks \#1 | \+3 | 16 | 30/rock (×4) | Hands | Stone ×8 |
| Till Soil \#2 | \+4 | 20 | 40/plot | Hoe | \- |

**Repeatable Actions (Off-screen forest):**

| Action | Energy Cost | Tool Required | Yields | Cooldown |
| ----- | ----- | ----- | ----- | ----- |
| Gather Branches | 15 energy | Hands | Wood ×1 | None |
| Chop Saplings | 25 energy | Hands | Wood ×2 | None |
| Fell Small Tree | 50 energy | Axe | Wood ×5 | None |

#### **Stage 3 – Homestead (20→40 plots)**

| Cleanup | Plots \+ | Total Plots | Energy Cost | Tool Required | Yields |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Clear Boulders \#1 | \+4 | 24 | 100/boulder (×6) | Hammer+ | Stone ×12 |
| Remove Stumps \#1 | \+4 | 28 | 150/stump (×5) | Axe | Wood ×20 |
| Clear Boulders \#2 | \+4 | 32 | 200/boulder (×6) | Hammer+ | Stone ×18 |
| Remove Stumps \#2 | \+4 | 36 | 300/stump (×5) | Axe | Wood ×30 |
| Till New Land | \+4 | 40 | 400/section | Hoe+ | \- |

**Repeatable Actions (Off-screen forest):**

| Action | Energy Cost | Tool Required | Yields | Cooldown |
| ----- | ----- | ----- | ----- | ----- |
| Chop Trees | 100 energy | Axe | Wood ×10 | None |
| Clear Grove | 200 energy | Axe+ | Wood ×25 | None |

#### **Stage 4 – Homestead (40→65 plots)**

| Cleanup | Plots \+ | Total Plots | Energy Cost | Tool Required | Yields |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Excavate Rocks \#1 | \+5 | 45 | 500/buried (×8) | Shovel | Stone ×24 |
| Clear Thickets \#1 | \+5 | 50 | 600/thicket (×6) | Earth Mover | Wood ×36 |
| Excavate Rocks \#2 | \+5 | 55 | 800/buried (×8) | Shovel+ | Stone ×32 |
| Clear Thickets \#2 | \+5 | 60 | 1,000/thicket (×6) | Earth Mover | Wood ×48 |
| Terraform | \+5 | 65 | 1,500/section | Advanced Tools | \- |

**Repeatable Actions (Off-screen forest):**

| Action | Energy Cost | Tool Required | Yields | Cooldown |
| ----- | ----- | ----- | ----- | ----- |
| Harvest Forest | 400 energy | Shovel+ | Wood ×40 | None |
| Clear Old Growth | 800 energy | Earth Mover | Wood ×100 | None |

#### **Stage 5 – Great Estate (65→90 plots)**

| Cleanup | Plots \+ | Total Plots | Energy Cost | Tool Required | Yields |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Stone Monoliths \#1 | \+5 | 70 | 2,000/monolith (×10) | Stone Breaker | Stone ×50 |
| Ancient Roots \#1 | \+5 | 75 | 2,500/root (×8) | World Splitter | Wood ×100 |
| Stone Monoliths \#2 | \+5 | 80 | 3,000/monolith (×10) | Stone Breaker | Stone ×75 |
| Sacred Clearing | \+10 | 90 | 5,000/section | World Splitter \+ Stone Breaker | \- |

**Repeatable Actions (Off-screen forest):**

| Action | Energy Cost | Tool Required | Yields | Cooldown |
| ----- | ----- | ----- | ----- | ----- |
| Mystic Grove | 1,500 energy | World Splitter | Wood ×200 | None |
| Enchanted Forest | 3,000 energy | World Splitter \+ Stone Breaker | Wood ×500, Enchanted Wood ×1 (5% chance) | None |

**Automatic Planting Priority:** The hero automatically plants seeds in this order:

1. Highest energy value seeds first (best available)  
2. Fills remaining plots with lower-tier seeds  
3. Maintains diversity for continuous harvests

**Seed Distribution Guidelines:**

* **Early Game (150 storage)**: Focus on 2-3 crop types  
* **Mid Game (500 storage)**: Maintain 4-5 crop types, 100 each  
* **Late Game (2,000 storage)**:  
  * 30% highest tier seeds (600)  
  * 40% mid-tier seeds (800)  
  * 30% low-tier backup seeds (600)

**Why Keep Low-Tier Seeds?**

* Fill gaps when high-tier seeds run out  
* Maintain continuous energy generation  
* Quick turnover for immediate energy needs

---

## **4\) Tower – Catch Seeds**

**What you do:** Use an extending arm with net to catch drifting seeds at different wind levels. The **Auto-Catcher** runs passively and draws from a **fixed seed pool** based on the wind level where you unlocked it.

**Key actions**

* Extend/retract arm to reach different wind levels  
* Position net to catch seeds as they drift by  
* Unlock higher wind levels for rarer seeds  
* Install Auto-Catchers for passive collection

### **Inputs and Actions**

| Input | Action | Details |
| ----- | ----- | ----- |
| **D-pad** | Move mode: Navigate wind levels | Move the extending arm up/down between unlocked wind levels |
| **D-pad** | Catch mode: Position net | Fine control of net position to intercept seed paths |
| **B Button** | – | Not used on this screen |
| **A Button** | – | Not used on this screen |
| **Crank** | Direct net control | 1:1 movement between crank rotation and net position \- catch seeds as they fly by |

### **4.1 Unlock Order (Tower)**

| Order | Type | Path | What it does | Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Reach Levels | Reach 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 | Extends arm to access higher wind bands; expands crop variety and energy potential | Previous reach level; later reaches may require endgame farm level 🏡 |
| 2 | Nets | Net I → Net II → Golden Net → Crystal Net | Boosts **active** catch efficiency (seeds/min) | Previous net; higher nets may require Reach 6–7 🏡 |
| 3 | Automation | Auto-Catcher I → II → III | Adds **passive** idle seed collection; seed pool based on highest reach level (up to level-2) | Previous auto-catcher; III benefits from higher reach levels 🏡 |

**Wind Level ↔ Reach Level ↔ Seed Level Legend:**

| Wind Level | Reach Level | Seed Level |
| ----- | ----- | ----- |
| Breeze | Reach 2 | 0 |
| Gust | Reach 3 | 1 |
| Gale | Reach 4 | 2 |
| Jet Stream | Reach 5 | 3 |
| Cloud Layer | Reach 6 | 4 |
| Stratosphere | Reach 7 | 5 |
| Mesosphere | Reach 8 | 6 |
| Thermosphere | Reach 9 | 7 |
| Exosphere | Reach 10 | 8 |
| Low Orbit | Reach 11 | 9 |

### **4.2 Reach Levels (Access to Higher Wind Bands)**

| Reach | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 2 | Tower built | 100 | 50 | 10 Wood | Unlock **Breeze** band (Seed Level 0\) |
| 3 | Reach 2 | 500 | 200 | 15 Wood, 5 Copper | Unlock **Gust** band (Seed Level 1\) |
| 4 | Reach 3 | 2,000 | 1,000 | 20 Wood, 10 Iron | Unlock **Gale** band (Seed Level 2\) |
| 5 | Reach 4 | 10,000 | 5,000 | 5 Silver | Unlock **Jet Stream** band (Seed Level 3\) |
| 6 | Reach 5 \+ **Homestead** 🏡 | 50,000 | 20,000 | 3 Crystal | Unlock **Cloud Layer** band (Seed Level 4\) |
| 7 | Reach 6 \+ **Manor Grounds** 🏡 | 200,000 | 100,000 | 2 Mythril | Unlock **Stratosphere** band (Seed Level 5\) |
| 8 | Reach 7 \+ **Great Estate** 🏡 | 1,000,000 | 400,000 | 3 Mythril | Unlock **Mesosphere** band (Seed Level 6\) |
| 9 | Reach 8 \+ **Great Estate** 🏡 | 5,000,000 | 1,500,000 | 1 Obsidian | Unlock **Thermosphere** band (Seed Level 7\) |
| 10 | Reach 9 \+ **Great Estate** 🏡 | 15,000,000 | 5,000,000 | 2 Obsidian | Unlock **Exosphere** band (Seed Level 8\) |
| 11 | Reach 10 \+ **Great Estate** 🏡 | 50,000,000 | 15,000,000 | 3 Obsidian | Unlock **Low Orbit** band (Seed Level 9\) |

### **4.3 Nets (Catch Efficiency)**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Net I | Tower built | 75 | 60 | 5 Copper | \+20% catch rate (active play) |
| Net II | Net I | 400 | 300 | 8 Iron | \+40% catch rate (active play) |
| Golden Net | Net II \+ **Reach 4** 🏡 | 2,500 | 1,500 | 3 Silver | \+60% catch rate (active play) |
| Crystal Net | Golden Net \+ **Reach 5** 🏡 | 15,000 | 8,000 | 2 Crystal | \+80% catch rate (active play) |

### **4.4 Auto-Catchers (Passive Seed Collection)**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect | Idle Rate |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Auto-Catcher I | Tower built | 1,000 | 500 | 10 Iron | Collects seeds from levels 0 to (highest reach \- 2\) | 1 seed/10 min |
| Auto-Catcher II | Auto-Catcher I | 5,000 | 2,500 | 5 Silver | Collects seeds from levels 0 to (highest reach \- 2\) | 1 seed/5 min |
| Auto-Catcher III | Auto-Catcher II \+ **Reach 5** 🏡 | 30,000 | 15,000 | 3 Crystal | Collects seeds from levels 0 to (highest reach \- 1\) | 1 seed/2 min |

**Auto-Catcher rule:** The auto-catcher passively collects seeds while idle. Seed pool is based on your highest unlocked reach level (minus 1-2 levels for balance). Higher tier auto-catchers collect faster and from a wider pool.

**Seed System Notes:**

* Each wind level contains all seeds of that Seed Level and below  
* Seeds appear randomly within their wind level (equal catch chance)  
* With 30 seeds/hour from Auto-Catcher III, players gain 720 seeds/day while idle  
* Combined with active catching (3-8 seeds/min with nets), seed requirements are achievable  
* Early game needs fewer seeds (8-20 plots), late game has better catchers

---

## **5\) Town – Vendors & Blueprints**

**What you do:** Visit distinct vendors to purchase blueprints and deeds. Each vendor has its own unlock path. Items themselves still build/operate in their home screens (Farm, Tower, Forge), but **gold purchases** happen here.

### **Inputs and Actions**

| Input | Action | Details |
| ----- | ----- | ----- |
| **D-pad** | Navigate menus | Browse vendor inventories and blueprint categories |
| **B Button** | Back out | Return to previous menu or exit shop |
| **A Button** | Select | Choose shops to enter, select items to purchase |
| **Crank** | Swap shops | Quickly rotate between the 5 vendor shops without backing out |

### **5.1 Townwide Unlock Order (by Vendor)**

| Order | Vendor | What it does | Gate |
| ----- | ----- | ----- | ----- |
| 1 | **Blacksmith** | Tools & forge tiers (bellows, furnace, anvils, recipes) → gates cleanups, mining depths, crafting throughput | Unlock vendor after completing first simple adventure. |
| 2 | **Skills Trainer** | Teaches hero **skills** (e.g., Carry Capacity \+1 per rank) | Available from start |
| 3 | **Agronomist** | Farm systems (energy storage, pump speed, water capacity, seed storage) → longer idle windows, smoother loops | Available from start |
| 4 | **Land Steward** | **Land Deeds** that advance farm phases and unlock new cleanups | Available from start |
| 5 | **Carpenter (Skywright)** | Tower upgrades (Floors, Nets, Auto-Catchers) → access to higher **Seed Levels** and passive seed pool | Available from start |

### **5.2 Vendor Map (who sells what)**

| Vendor | Shop Name | Stocks | Where it applies | Notes |
| ----- | ----- | ----- | ----- | ----- |
| Blacksmith | Ember & Edge | Tools; Weapons; Forge upgrades (Bellows, Furnace, Anvils); Batch/Master recipes | Forge / Farm / Mine / Adventure | Tools unlock cleanups; Weapons for combat |
| Agronomist | Greenwise Co-op | Energy storage; Pump speed; Water capacity; Seed storage; Material storage; **Wood bundles** | Farm | Extends idle windows & capacity; Emergency wood supply |
| Land Steward | County Land Office | **Homestead / Manor Grounds / Great Estate** Deeds | Farm | Advances **Farm Level** (phases) |
| Carpenter (Skywright) | Towerwrights Guild | Tower **Reach Levels** (0–9); **Nets**; **Auto-Catchers**; **Gnome Housing** | Tower / Farm | Auto-Catcher seed pool based on highest reach; Gnome buildings |
| Skills Trainer | Field School | Hero Skills: **Carry Capacity** (+1 per rank) | Hero (Farm) | Default carry 1; each rank \+1 (trained, not an item) |
| Material Trader | Exchange Post | Convert excess materials to gold or other materials | All | Resource sink for late game excess |

**Wood Supply (Agronomist Emergency Stock)**

| Item | Prerequisites | Gold | Amount | Notes |
| ----- | ----- | ----- | ----- | ----- |
| Wood Bundle (Small) | – | 50 | 10 Wood | Emergency supply for early game |
| Wood Bundle (Medium) | Farm Stage 2 | 200 | 50 Wood | Bulk purchase option |
| Wood Bundle (Large) | Farm Stage 3 | 800 | 250 Wood | Late game convenience |

### **5.3 Blacksmith – Tools & Forge Tiers**

#### **5.3.1 Unlock Order (Blacksmith)**

| Order | Line | Path | What it does | Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Tools | Hoe → Hammer → Hammer+ → Axe → Shovel → Shovel+ | Enables farm cleanups & QoL | Previous tool; some require Anvil tier 🏡 |
| 2 | Mining | Pickaxe I → II → III → Crystal Pick → Mythril Pick | Reaches deeper mine tiers | Previous pickaxe; higher tiers require Anvil/Furnace 🏡 |
| 3 | Weapons | Spear/Sword/Bow/Crossbow/Wand → Level II → III → ... → X | Combat effectiveness vs enemy types | Previous weapon level; higher levels require Anvils 🏡 |
| 4 | Forge: Bellows | Bellows I → II → Auto-Bellows | Heat control and passive crafting | Previous tier |
| 5 | Forge: Furnace | Furnace I → II → Crystal Furnace | Craft speed & high-tier recipes | Previous tier; Crystal Furnace may require **Manor Grounds** 🏡 |
| 6 | Forge: Anvils | Anvil I → II → Mythril Anvil | Unlocks advanced recipes | Previous tier; Mythril Anvil may require **Great Estate** 🏡 |
| 7 | Forge: Recipes | Batch Craft → Master Craft | Batch size & proc chance | Batch needs Anvil I; Master needs Batch \+ Furnace II 🏡 |

#### **5.3.2 Tool Blueprints (buy here, craft in Forge)**

| Tool | Prerequisites | Gold (Blueprint) | Crafted Where | Tier |
| ----- | ----- | ----- | ----- | ----- |
| Hoe | – | 50 | Forge | Base |
| Hoe+ | Hoe \+ **Anvil I** 🏡 | 750 | Forge | Plus |
| Terra Former | Hoe+ \+ **Mythril Anvil** 🏡 | 15,000 | Forge | Master |
| Hammer | Hoe | 150 | Forge | Base |
| Hammer+ | Hammer \+ **Anvil I** 🏡 | 1,200 | Forge | Plus |
| Stone Breaker | Hammer+ \+ **Mythril Anvil** 🏡 | 25,000 | Forge | Master |
| Axe | Hammer | 300 | Forge | Base |
| Axe+ | Axe \+ **Anvil II** 🏡 | 3,000 | Forge | Plus |
| World Splitter | Axe+ \+ **Mythril Anvil** 🏡 | 60,000 | Forge | Master |
| Shovel | Axe | 600 | Forge | Base |
| Shovel+ | Shovel \+ **Anvil II** 🏡 | 8,000 | Forge | Plus |
| Earth Mover | Shovel+ \+ **Crystal Furnace** 🏡 | 40,000 | Forge | Master |
| Pickaxe I | – | 100 | Forge | Base |
| Pickaxe II | Pickaxe I | 500 | Forge | Base |
| Pickaxe III | Pickaxe II \+ **Anvil II** 🏡 | 2,500 | Forge | Base |
| Crystal Pick | Pickaxe III \+ **Mythril Anvil** 🏡 | 12,000 | Forge | Plus |
| Abyss Seeker | Crystal Pick \+ **Crystal Furnace** 🏡 | 60,000 | Forge | Master |

*Note: Tool progression follows Base → Plus (+) → Master tiers. Master tools have special names and require boss materials.*

#### **5.3.3 Weapon Blueprints (buy here, craft in Forge)**

| Weapon Type | Base Cost | Level Scaling | Max Level (X) Cost |
| ----- | ----- | ----- | ----- |
| Spear I-X | 100 gold | ×2.5 per level | 100,000 gold |
| Sword I-X | 100 gold | ×2.5 per level | 100,000 gold |
| Bow I-X | 100 gold | ×2.5 per level | 100,000 gold |
| Crossbow I-X | 150 gold | ×2.5 per level | 150,000 gold |
| Wand I-X | 200 gold | ×2.5 per level | 200,000 gold |

*Note: Each weapon level must be purchased sequentially. See Section 10.2 for detailed weapon stats and crafting requirements.*

#### **5.3.4 Forge Upgrade Blueprints (build effects in §7)**

| Upgrade | Prerequisites | Gold | Notes |
| ----- | ----- | ----- | ----- |
| Bellows I | Forge built | 80 | See §7.2 for build effects/costs |
| Bellows II | Bellows I | 400 | – |
| Auto-Bellows | Bellows II | 2,000 | – |
| Furnace I | Forge built | 200 | See §7.3 |
| Furnace II | Furnace I | 1,000 | – |
| Crystal Furnace | Furnace II \+ **Manor Grounds** 🏡 | 10,000 | – |
| Anvil I | Forge built | 150 | See §7.4 |
| Anvil II | Anvil I | 1,500 | – |
| Mythril Anvil | Anvil II \+ **Great Estate** 🏡 | 15,000 | – |
| Batch Craft | Anvil I | 500 | See §7.5 |
| Master Craft | Batch Craft \+ **Furnace II** 🏡 | 5,000 | – |

### **5.4 Agronomist – Farm Systems**

#### **5.4.1 Unlock Order (Agronomist)**

| Order | Line | Path | What it does | Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Energy Storage | Shed I → II → III → Barn I → Barn II → Silo | Expands energy cap (longer runs) | Previous tier; Barns/Silo require farm level 🏡 |
| 2 | Pump Speed | Pump I → II → III → Steam → Crystal | Faster water refills | Previous tier; later tiers require farm level 🏡 |
| 3 | Water Capacity | Tank I → II → III → Reservoir → Crystal Reservoir | Larger water buffer for more offline progress. | Previous tier; later tiers require farm level 🏡 |
| 4 | Seed Storage | Seed I → II → Vault | Larger seed buffer | Previous tier; Vault may require **Homestead** 🏡 |
| 5 | Material Storage | Crate I → II → Warehouse → Depot → Silo | Max items per material type (50→100→250→500→1000) | Previous tier; later tiers require farm level 🏡 |

#### **5.4.2 Energy Storage**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Storage Shed I | – | 20 | 10 | – | Energy cap 50→150 |
| Storage Shed II | Shed I | 100 | 50 | 5 Stone | Energy cap 150→500 |
| Storage Shed III | Shed II \+ **Homestead** 🏡 | 500 | 200 | 10 Iron | Energy cap 500→1,500 |
| Storage Barn I | Shed III \+ **Homestead** 🏡 | 3,000 | 1,000 | 5 Silver | Energy cap 1,500→6,000 |
| Storage Barn II | Barn I \+ **Manor Grounds** 🏡 | 20,000 | 5,000 | 2 Crystal | Energy cap 6,000→20,000 |
| Storage Silo | Barn II \+ **Great Estate** 🏡 | 100,000 | 25,000 | 1 Mythril | Energy cap 20,000→100,000 |

#### **5.4.3 Pump Speed**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Well Pump I | – | 30 | 20 | 3 Stone | 2→4 water/crank |
| Well Pump II | Pump I | 150 | 100 | 5 Copper | 4→8 water/crank |
| Well Pump III | Pump II \+ **Homestead** 🏡 | 750 | 500 | 10 Iron | 8→15 water/crank |
| Steam Pump | Pump III \+ **Homestead** 🏡 | 4,000 | 2,500 | 3 Silver | 15→30 water/crank |
| Crystal Pump | Steam Pump \+ **Manor Grounds** 🏡 | 25,000 | 12,000 | 3 Crystal | 30→60 water/crank |

#### **5.4.4 Water Capacity & Auto-Pump**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Water Tank I | – | 25 | 15 | 5 Stone | 20→60 water cap |
| Water Tank II | Tank I | 125 | 75 | 8 Copper | 60→200 water cap |
| Water Tank III | Tank II \+ **Homestead** 🏡 | 600 | 400 | 12 Iron | 200→600 water cap |
| Reservoir | Tank III \+ **Homestead** 🏡 | 3,500 | 2,000 | 5 Silver | 600→2,000 water cap |
| Crystal Reservoir | Reservoir \+ **Manor Grounds** 🏡 | 22,000 | 10,000 | 5 Crystal | 2,000→10,000 water cap |

**Water Retention Systems (Plot Efficiency)**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Mulch Beds | Water Tank II | 300 | 150 | 50 Wood | Plots retain water 25% longer |
| Irrigation Channels | Mulch Beds \+ **Homestead** | 1,500 | 750 | 100 Wood, 5 Iron | Plots retain water 50% longer |
| Crystal Irrigation | Channels \+ **Manor Grounds** | 8,000 | 4,000 | 200 Wood, 3 Crystal | Plots retain water 75% longer |

*Note: Water retention reduces the frequency of watering needed, crucial for managing 65-90 plots with limited helpers.*

**Auto-Pump Systems (Offline Water Generation)**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Auto-Pump I | Water Tank II | 200 | 100 | 5 Copper | \+10% of cap per hour offline |
| Auto-Pump II | Auto-Pump I \+ Tank III | 1,000 | 500 | 10 Iron | \+20% of cap per hour offline |
| Auto-Pump III | Auto-Pump II \+ Reservoir | 5,000 | 2,500 | 5 Silver | \+35% of cap per hour offline |
| Crystal Pump | Auto-Pump III \+ Crystal Reservoir | 25,000 | 12,000 | 3 Crystal | \+50% of cap per hour offline |

*Note: Auto-pumps enable offline progression by generating water while away. This directly impacts how much energy can be earned through offline crop growth.*

#### **5.4.5 Seed Storage**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Seed Storage I | – | 50 | 40 | 5 Stone | 50→150 seed cap |
| Seed Storage II | Seed Storage I | 250 | 200 | 10 Copper | 150→500 seed cap |
| Seed Vault | Seed Storage II \+ **Homestead** 🏡 | 1,500 | 1,000 | 5 Iron | 500→2,000 seed cap |

#### **5.4.6 Material Storage**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Material Crate I | – | 75 | 50 | 10 Wood | Max 50 per material type |
| Material Crate II | Crate I | 400 | 250 | 20 Wood, 5 Iron | Max 100 per material type |
| Material Warehouse | Crate II \+ **Homestead** 🏡 | 2,000 | 1,000 | 10 Iron, 2 Silver | Max 250 per material type |
| Material Depot | Warehouse \+ **Manor Grounds** 🏡 | 10,000 | 5,000 | 5 Silver, 2 Crystal | Max 500 per material type |
| Material Silo | Depot \+ **Great Estate** 🏡 | 50,000 | 20,000 | 3 Crystal, 1 Mythril | Max 1000 per material type |
| Grand Warehouse | Material Silo | 250,000 | 100,000 | 5 Crystal, 2 Mythril | Max 2500 per material type |
| Infinite Vault | Grand Warehouse | 1,000,000 | 500,000 | 10 Crystal, 5 Mythril | Max 10000 per material type |

*Note: Material storage applies to all refined materials (Stone, Wood, Copper, Iron, Silver, Crystal, Mythril, Obsidian) and special materials. Late-game storage ensures players can stockpile for major projects.*

### **5.5 Land Steward – Deeds**

#### **5.5.1 Unlock Order (Land Steward)**

| Order | Path | What it does | Gate |
| ----- | ----- | ----- | ----- |
| 1 | Homestead Deed | Expands plots 20→40; unlocks Stage-3 cleanups | Complete **Small Hold** |
| 2 | Manor Grounds Deed | Expands plots 40→65; unlocks Stage-4 cleanups | Complete **Homestead** |
| 3 | Great Estate Deed | Expands plots 65→90; unlocks Stage-5 cleanups | Complete **Manor Grounds** |

#### **5.5.2 Land Deeds (Buy New Land)**

| Deed | Prerequisites | Gold | Optional Build Energy | Adds | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| **Homestead Deed** | Complete **Small Hold** (20 plots) | **1,500** | 250 | \+20 plots (20→40) | Enables boulder & stump cleanups |
| **Manor Grounds Deed** | Complete **Homestead** (40 plots) | **6,000** | 750 | \+25 plots (40→65) | Enables excavation & thicket cleanups |
| **Great Estate Deed** | Complete **Manor Grounds** (65 plots) | **20,000** | 1,500 | \+25 plots (65→90) | Enables blasts & ancient roots |

### **5.6 Carpenter (Skywright) – Tower Upgrades**

#### **5.6.1 Unlock Order (Carpenter)**

| Order | Line | Path | What it does | Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Reach Levels | Reach 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 → 10 → 11 | Grants **Seed Levels 0–9** bands | Previous reach level; higher reaches require farm level 🏡 |
| 2 | Nets | Net I → Net II → Golden Net → Crystal Net | Boosts active catch rate | Previous net; higher nets may require Reach 6–7 🏡 |
| 3 | Auto-Catchers | I → II → III | Adds passive seed collection; **seed pool based on highest reach** | Previous AC; better with higher reach levels 🏡 |

#### **5.6.2 Tower Purchases (values & effects in §4)**

| Category | Sold Items | Pointer |
| ----- | ----- | ----- |
| Reach Levels | Reach 2 … Reach 11 | See §4.2 for costs/effects |
| Nets | Net I … Crystal Net | See §4.3 |
| Auto-Catchers | AC I … AC III | See §4.4 |

#### **5.6.3 Gnome Housing**

| Building | Prerequisites | Gold | Build Energy | Materials | Gnome Capacity |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Gnome Hut | First gnome rescued | 500 | 250 | 20 Wood, 10 Stone | 1 gnome |
| Gnome House | Gnome Hut \+ **Homestead** | 2,000 | 1,000 | 50 Wood, 20 Iron | 2 gnomes |
| Gnome Lodge | Gnome House \+ **Manor Grounds** | 10,000 | 5,000 | 100 Wood, 10 Silver | 3 gnomes |
| Gnome Hall | Gnome Lodge \+ **Great Estate** | 50,000 | 25,000 | 200 Wood, 5 Crystal | 4 gnomes |
| Gnome Village | Gnome Hall | 250,000 | 100,000 | 500 Wood, 2 Mythril | 5 gnomes |

*Note: Gnome housing must be built to activate rescued gnomes. Each building tier increases the number of active gnomes you can deploy.*

### **5.7 Skills Trainer – Hero Skills**

**What you do:** Pay gold and spend training energy to learn small, repeatable **skills** that improve the hero's fundamentals. Skills are not items and persist through sessions.

#### **5.7.1 Unlock Order (Skills Trainer)**

| Order | Skill Line | Path | What it does | Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Carry Capacity | Rank 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9 | Each rank adds **\+1** to how many crops the hero can carry (default carry \= 1\) | Previous rank; certain ranks may require farm level 🏡 |

#### **5.7.2 Carry Capacity (Skill)**

| Rank | Prerequisites | Gold | Training Energy | Effect (Total Carry) | Notes |
| ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | – | 25 | 10 | \+1 (total 2\) | Starter boost |
| 2 | Rank 1 | 50 | 15 | \+1 (total 3\) | – |
| 3 | Rank 2 | 100 | 20 | \+1 (total 4\) | – |
| 4 | Rank 3 \+ **Homestead** 🏡 | 200 | 30 | \+1 (total 5\) | Mid-game unlock |
| 5 | Rank 4 | 400 | 40 | \+1 (total 6\) | – |
| 6 | Rank 5 \+ **Manor Grounds** 🏡 | 800 | 60 | \+1 (total 7\) | Late-game ramp |
| 7 | Rank 6 | 1,500 | 80 | \+1 (total 8\) | – |
| 8 | Rank 7 \+ **Great Estate** 🏡 | 3,000 | 100 | \+1 (total 9\) | End-game prep |
| 9 | Rank 8 | 6,000 | 125 | \+1 (total 10\) | Soft cap |

### **5.8 Material Trader – Resource Exchange**

**What you do:** Convert excess materials into gold or trade between material types at unfavorable but necessary rates. Provides a sink for excess resources in late game.

#### **5.8.1 Material to Gold Exchange**

| Material | Sell Price (per unit) | Min Quantity | Notes |
| ----- | ----- | ----- | ----- |
| Stone | 2 gold | 10 | Common excess |
| Wood | 3 gold | 10 | Valuable early |
| Copper | 5 gold | 5 | – |
| Iron | 10 gold | 5 | – |
| Silver | 25 gold | 3 | – |
| Crystal | 100 gold | 1 | Rare excess |
| Mythril | 500 gold | 1 | Very rare |
| Obsidian | 1,000 gold | 1 | Endgame only |

#### **5.8.2 Material Trading (2:1 ratio within tier)**

| Trade | Prerequisites | Exchange Rate | Example |
| ----- | ----- | ----- | ----- |
| Common Materials | – | 2:1 within tier | 20 Stone → 10 Wood |
| Metal Trading | **Homestead** | 2:1 within tier | 10 Copper → 5 Iron |
| Rare Trading | **Manor Grounds** | 3:1 within tier | 3 Silver → 1 Crystal |
| Cross-Tier Trading | **Great Estate** | 5:1 up, 1:3 down | 5 Iron → 1 Silver |

*Note: The Material Trader provides an inefficient but necessary outlet for excess materials, preventing dead-end states while maintaining resource value.*

---

## **6\) Adventure – Routes & Combat**

**What you do:** Choose routes with visible **duration**, **energy cost**, enemy composition, and boss type. Combat is fully automated with deterministic outcomes. The hero auto-walks left to right, auto-switches between your two equipped weapons based on enemy type, and either succeeds or fails based on preparation.

**Combat System:** Uses a 5-type pentagon where each weapon has advantage vs one enemy type. Hero HP and Defense stats (separate from Energy) determine survivability. For detailed combat mechanics, damage calculations, and armor system, see the **Combat Mechanics & Balance** document.

### **Inputs and Actions**

#### **Sign Post (Route Selection)**

| Input | Action | Details |
| ----- | ----- | ----- |
| **D-pad** | Navigate menus | Browse available routes and difficulty options (Short/Medium/Long) |
| **B Button** | Inventory | View equipped weapons, armor, and check enemy composition |
| **A Button** | Select route | Choose route and difficulty to begin adventure |
| **Crank** | Quick swap | Rotate between unlocked routes quickly |

#### **During Adventure**

| Input | Action | Details |
| ----- | ----- | ----- |
| **D-pad** | – | Not used during adventure |
| **B Button** | Toggle view | Switch between combat view (health, enemies) and progress view (time remaining, waves cleared) |
| **A Button** | – | Not used during adventure |
| **Crank** | – | Not used during adventure |

### **6.1 Unlock Order (Adventure)**

| Order | Type | Path | What it does | Soft Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Early routes | Meadow → Pine Vale → Dark Forest | Introduces combat pacing; drops early mats (copper/iron) for tools | Farm Stage 1–2 |
| 2 | Mid routes | Mountain Pass → Crystal Caves | Adds silver/crystal; longer runs with better efficiency | Stage 3 → Stage 4 |
| 3 | Late routes | Frozen Tundra → Volcano Core | Unlocks mythril/obsidian; best boss mats and late-game efficiency | Stage 4 → Stage 5 |

### **6.2 Routes & Durations**

| Route | Prerequisites | Short (20%) | Medium (50%) | Long (100%) | Gold Rewards (Short/Med/Long) | Enemy Types | Boss | Boss Weakness | Boss Materials | Common Materials | First Clear Bonus |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Meadow Path | None | 10 energy, 3 min | 25 energy, 8 min | 50 energy, 15 min | 25/75/150 gold | Slimes only | Giant Slime | None (neutral) | Copper ×2 | Wood ×5-10 | \- |
| Pine Vale | Cleared Meadow Path Long | 20 energy, 5 min | 50 energy, 15 min | 100 energy, 30 min | 60/150/300 gold | Armored Insects | Beetle Lord | Spear | Iron ×3, **Pine Resin** ×1 | Wood ×20-30 | \- |
| Dark Forest | Cleared Pine Vale Long | 40 energy, 8 min | 100 energy, 20 min | 200 energy, 45 min | 150/375/750 gold | Beasts (60%), Slimes (40%) | Alpha Wolf | Sword | Iron ×5, **Shadow Bark** ×1 | Wood ×40-60 | **Gnome rescued** |
| Mountain Pass | Cleared Dark Forest Long | 100 energy, 10 min | 250 energy, 30 min | 500 energy, 60 min | 400/1,000/2,000 gold | Flying (50%), Insects (50%) | Sky Serpent | Bow | Silver ×3, **Mountain Stone** ×1 | Stone ×30-50 | **Gnome rescued** |
| Crystal Caves | Cleared Mountain Pass Long | 200 energy, 15 min | 500 energy, 40 min | 1,000 energy, 90 min | 1,000/2,500/5,000 gold | Crawlers (50%), Plants (50%) | Crystal Spider | Crossbow | Crystal ×2, **Cave Crystal** ×1 | Crystal ×1-2 | **Gnome rescued** |
| Frozen Tundra | Cleared Crystal Caves Long | 400 energy, 20 min | 1,000 energy, 50 min | 2,000 energy, 2 h | 2,500/6,250/12,500 gold | Flying (40%), Beasts (40%), Plants (20%) | Frost Wyrm | Wand | Mythril ×1, **Frozen Heart** ×1, **Enchanted Wood** ×1 | Wood ×80-120 | **Gnome rescued** |
| Volcano Core | Cleared Frozen Tundra Long | 800 energy, 25 min | 2,000 energy, 65 min | 4,000 energy, 2.5 h | 6,000/15,000/30,000 gold | Random mix (all types) | Lava Titan | Rotates | Obsidian ×2, **Molten Core** ×1 | Obsidian ×1 | **Gnome rescued** |

### **6.3 Combat Overview**

**Pre-Adventure Setup:**

* Equip **two weapons** from your arsenal (covers 2 of 5 enemy types)  
* Equip **one armor piece** from your collection (max 3 pieces owned)  
* Check the **risk indicator** showing success chance based on enemy composition and your loadout

**Enemy Composition:**

* Each route length (Short/Medium/Long) has a **fixed enemy roll** that persists until you win or fail that specific length  
* Enemy types and percentages are shown at the Sign Post  
* After completing or failing, that length rerolls its enemies

**Combat Resolution:**

* Hero automatically switches weapons based on enemy type advantage  
* Damage dealt and received depends on weapon matchups, hero level, defense rating, and armor effects  
* All combat is deterministic \- same inputs always produce same results

**Energy Cost:**

* Full energy cost paid upfront (win or lose)  
* No partial refunds for early failure  
* Represents commitment and recovery time

### **6.4 Armor System Summary**

* **Inventory**: Maximum 3 armor pieces owned, 1 equipped  
* **Acquisition**: Boss drops only (guaranteed on kill)  
* **Stats**: Defense Rating (Minimal to Extreme) \+ Upgrade Potential  
* **Effects**: Each piece has one special effect (Regeneration, Reflection, Gold Magnet, etc.)  
* **Forge Upgrades**: Each piece can be upgraded ONCE for additional defense  
* **Selling**: New drops can be sold for gold if inventory is full

*For complete combat mechanics, HP progression, defense calculations, and detailed boss strategies, refer to the separate Combat Mechanics & Balance document.*

---

## **7\) Forge – Crafting & Tools**

**What you do:** Spend energy \+ materials to craft tools/upgrades. A heat-band minigame improves success; Auto-Bellows enables idle crafting.

### **Inputs and Actions**

| Input | Action | Details |
| ----- | ----- | ----- |
| **D-pad** | Navigate menus | Browse crafting recipes and refinement options |
| **B Button** | Inventory | View raw and refined metals in storage |
| **A Button** | Action menu | Choose tasks: "Refine raw materials" or "Craft item" |
| **Crank** | Bellows control | Dock crank, then morse-code style pumping motion to maintain furnace heat |

*Note: The crank bellows mechanic uses the dock detector \- rhythmic docking/undocking pumps air into the furnace to keep temperature in the optimal band for higher success rates.*

### **7.1 Unlock Order (Forge)**

| Order | Type | Path | What it does | Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Heat Control | Bellows I → II → Auto-Bellows | Widens heat band / enables idle crafting → easier timing, higher success | Previous tier |
| 2 | Furnace Speed | Furnace I → II → Crystal Furnace | Shortens craft times → higher throughput | Previous tier; Crystal Furnace may require Farm Stage 4 🏡 |
| 3 | Recipe Tiers | Anvil I → Anvil II → Mythril Anvil | Unlocks higher-tier recipes and advanced tools | Previous tier; Mythril Anvil may require Farm Stage 4–5 🏡 |
| 4 | Crafting QoL | Batch Craft → Master Craft | Batch size & proc chance reduce clicks and inputs per output | Batch requires Anvil I; Master requires Batch \+ Furnace II 🏡 |
| 5 | Tools | Buy blueprint in Town → craft here | Gate farm cleanups, mining depths, and adventure viability | Tools gate each other by tier and sometimes farm stage |

### **7.2 Forge Upgrades – Bellows**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Bellows I | Forge built | 80 | 60 | 8 Stone | Wider heat band; Min idle heat: 500° |
| Bellows II | Bellows I | 400 | 300 | 10 Copper | Much wider heat band; Min idle heat: 1000° |
| Auto-Bellows | Bellows II | 2,000 | 1,500 | 8 Iron | Auto maintains heat; Min idle heat: 2000° |

*Note: Furnace heat ranges from 0-5000°. Optimal crafting zone is 2500-3500°. Manual bellows can reach 5000°, while idle heat maintains minimum levels to reduce warm-up time.*

### **7.3 Forge Upgrades – Furnace**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Furnace Upgrade I | Forge built | 200 | 150 | 12 Stone | \+20% craft speed |
| Furnace Upgrade II | Furnace I | 1,000 | 750 | 15 Iron | \+40% craft speed |
| Crystal Furnace | Furnace II \+ **Farm Stage 4** 🏡 | 10,000 | 6,000 | 5 Crystal | \+60% craft speed |

### **7.4 Forge Upgrades – Anvils (Recipe Tiers)**

| Upgrade | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Anvil I | Forge built | 150 | 100 | 10 Copper | Unlock iron recipes |
| Anvil II | Anvil I | 1,500 | 1,000 | 5 Silver | Unlock silver recipes |
| Mythril Anvil | Anvil II \+ **Farm Stage 4–5** 🏡 | 15,000 | 10,000 | 3 Crystal | Unlock mythril recipes |

### **7.5 Recipe Unlocks**

| Recipe | Prerequisites | Gold | Effect |
| ----- | ----- | ----- | ----- |
| Batch Craft | Anvil I | 500 | Craft 5 at once |
| Master Craft | Batch Craft \+ **Furnace II** 🏡 | 5,000 | 10% chance double output |

### **7.6 Tool Crafting Costs (Forge)**

#### **Base Tools**

| Tool | Prerequisites | Time | Energy | Materials | Success |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Hoe | – | 5 min | 20 | 5 Stone \+ 3 Wood | 100% |
| Hammer | Hoe | 8 min | 40 | 8 Stone \+ 5 Wood | 100% |
| Axe | Hammer | 10 min | 100 | 5 Iron \+ 8 Wood | 95% |
| Shovel | Axe | 10 min | 100 | 3 Copper \+ 5 Wood | 100% |
| Pickaxe I | – | 10 min | 30 | 5 Copper \+ 5 Wood | 100% |
| Pickaxe II | Pickaxe I | 15 min | 150 | 5 Iron \+ 8 Stone | 95% |
| Pickaxe III | Pickaxe II \+ **Anvil II** 🏡 | 25 min | 750 | 3 Silver \+ 10 Iron | 90% |
| Watering Can II | Anvil I | 5 min | 50 | 5 Copper \+ 3 Wood | 100% |

#### **Plus Tools (+)**

| Tool | Prerequisites | Time | Energy | Materials | Boss Mat | Success |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Hoe+ | Hoe \+ **Anvil I** | 15 min | 200 | 10 Iron \+ 5 Wood | Pine Resin ×1 | 95% |
| Hammer+ | Hammer \+ **Anvil I** | 20 min | 300 | 8 Iron \+ 10 Stone | Shadow Bark ×1 | 95% |
| Axe+ | Axe \+ **Anvil II** | 25 min | 500 | 5 Silver \+ 10 Wood | Mountain Stone ×1 | 90% |
| Shovel+ | Shovel \+ **Anvil II** | 20 min | 500 | 8 Iron \+ 2 Silver | Shadow Bark ×1 | 90% |
| Crystal Pick | Pickaxe III \+ **Mythril Anvil** | 40 min | 3,000 | 2 Crystal \+ 5 Silver | Cave Crystal ×2 | 85% |
| Sprinkler Can | Watering Can II \+ **Furnace II** | 20 min | 400 | 3 Silver \+ 10 Copper | Pine Resin ×1 | 90% |

#### **Master Tools**

| Tool | Prerequisites | Time | Energy | Materials | Boss Mat | Success | Special Name |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Master Hoe | Hoe+ \+ **Mythril Anvil** | 45 min | 2,000 | 2 Crystal \+ 10 Silver | Mountain Stone ×2 | 85% | **Terra Former** |
| Master Hammer | Hammer+ \+ **Mythril Anvil** | 50 min | 3,000 | 3 Crystal \+ 1 Mythril | Frozen Heart ×1 | 80% | **Stone Breaker** |
| Master Axe | Axe+ \+ **Mythril Anvil** | 50 min | 8,000 | 3 Crystal \+ 1 Enchanted Wood | Frozen Heart ×2 | 80% | **World Splitter** |
| Master Shovel | Shovel+ \+ **Crystal Furnace** | 45 min | 5,000 | 2 Crystal \+ 1 Mythril | Cave Crystal ×3 | 80% | **Earth Mover** |
| Mythril Pick | Crystal Pick \+ **Crystal Furnace** | 60 min | 15,000 | 1 Mythril \+ 3 Crystal | Molten Core ×2 | 80% | **Abyss Seeker** |
| Divine Can | Sprinkler Can \+ **Crystal Furnace** | 30 min | 2,000 | 1 Crystal \+ 20 Silver | Frozen Heart ×1 | 85% | **Rain Bringer** |

### **7.7 Material Refinement (Forge)**

All materials from mining come as "Raw" and must be refined at the forge before use in crafting.

| Raw Material | Refined Output | Time | Energy | Ratio | Success Rate |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Raw Stone | Stone | 2 min | 10 | 1:1 | 100% |
| Raw Copper | Copper | 3 min | 20 | 1:1 | 100% |
| Raw Iron | Iron | 5 min | 50 | 1:1 | 100% |
| Raw Silver | Silver | 8 min | 100 | 1:1 | 100% |
| Raw Crystal | Crystal | 12 min | 250 | 1:1 | 100% |
| Raw Mythril | Mythril | 20 min | 500 | 1:1 | 100% |
| Raw Obsidian | Obsidian | 30 min | 1000 | 1:1 | 100% |

**Special Materials:**

* **Boss Materials**: Pine Resin, Shadow Bark, Mountain Stone, Cave Crystal, Frozen Heart, Molten Core (dropped from adventure bosses)  
* **Enchanted Wood**: Special boss material drop from Frozen Tundra, cannot be crafted

*Note: Higher furnace tiers reduce refinement time by 20/40/60%.*

---

## **8\) Mine – Depths & Finds**

**What you do:** Convert energy to depth over time. Energy drain doubles by depth, creating shallow sustainability and deep burst runs. Depths gate ability to have the right metals.

### **Inputs and Actions**

| Input | Action | Details |
| ----- | ----- | ----- |
| **D-pad** | – | Not used in mine |
| **B Button** | Toggle view | Switch between status view (depth, materials found) and clock view (energy drain rate) |
| **A Button** | – | Not used in mine |
| **Crank** | Sharpen tools | Stop mining and fully rotate crank in one direction to sharpen pickaxe \- provides mining buff for short duration |

*Note: Tool sharpening pauses energy drain but takes time. The buff increases material drop rates or reduces energy drain temporarily.*

### **8.1 Unlock Order (Mine)**

| Order | Type | Path | What it does | Gate |
| ----- | ----- | ----- | ----- | ----- |
| 1 | Depth Access | Pickaxes I → II → III → Crystal → Mythril | Reaches deeper levels with rarer materials and better drops | Previous pickaxe tier |
| 2 | Shortcuts | Build after clearing each depth | Start mining from previously cleared depths | Must reach bottom of depth |

### **8.2 Mining Depths & Materials**

| Depth | Name | Depth Range | Prerequisites | Base Energy/min | Runtime @ 1500 Energy | Raw Materials (per 30 sec) | Unlock Next |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | **Surface Shaft** | 0 to \-500 | Reached Depth 1 | 2 | 12.5 hours\* | Raw Stone ×8-12 | Reach \-500 |
| 2 | **Copper Vein** | \-500 to \-1000 | Cleared D1 | 4 | 6.25 hours\* | Raw Copper ×6-8, Raw Stone ×4-6 | Reach \-1000 |
| 3 | **Iron Seam** | \-1000 to \-1500 | Cleared D2 | 8 | 3.1 hours\* | Raw Iron ×5-7, Raw Copper ×3-4 | Reach \-1500 |
| 4 | **Deep Iron** | \-1500 to \-2000 | Cleared D3 | 16 | 1.5 hours\* | Raw Iron ×8-12 | Reach \-2000 |
| 5 | **Silver Pocket** | \-2000 to \-2500 | Cleared D4 | 32 | 47 min\* | Raw Silver ×6-8, Raw Iron ×4-6 | Reach \-2500 |
| 6 | **Silver Lode** | \-2500 to \-3000 | Cleared D5 | 64 | 23 min\* | Raw Silver ×10-15 | Reach \-3000 |
| 7 | **Crystal Cave** | \-3000 to \-3500 | Cleared D6 | 128 | 12 min\* | Raw Crystal ×4-6, Raw Silver ×3-5 | Reach \-3500 |
| 8 | **Crystal Core** | \-3500 to \-4000 | Cleared D7 | 256 | 6 min\* | Raw Crystal ×8-12 | Reach \-4000 |
| 9 | **Mythril Vein** | \-4000 to \-4500 | Cleared D8 | 512 | 3 min\* | Raw Mythril ×3-5, Raw Crystal ×2-3 | Reach \-4500 |
| 10 | **The Abyss** | \-4500 to \-5000 | Cleared D9 | 1024 | 1.5 min\* | Raw Obsidian ×2-3, Raw Mythril ×2-3 | Maximum depth |

\*Runtime shown with base Pickaxe I. Higher tier pickaxes reduce energy drain \- see Section 11.3 for details.

**Mining Shortcuts** (Build after clearing each depth to start there next time):

| Shortcut | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Depth 2 Entry | Reached \-1000 | 100 | 50 | 10 Stone | Start at Depth 2 |
| Depth 3 Entry | Reached \-1500 | 250 | 150 | 5 Copper | Start at Depth 3 |
| Depth 4 Entry | Reached \-2000 | 500 | 300 | 10 Iron | Start at Depth 4 |
| Depth 5 Entry | Reached \-2500 | 1,000 | 600 | 5 Silver | Start at Depth 5 |
| Depth 6 Entry | Reached \-3000 | 2,500 | 1,500 | 10 Silver | Start at Depth 6 |
| Depth 7 Entry | Reached \-3500 | 5,000 | 3,000 | 2 Crystal | Start at Depth 7 |
| Depth 8 Entry | Reached \-4000 | 10,000 | 6,000 | 5 Crystal | Start at Depth 8 |
| Depth 9 Entry | Reached \-4500 | 25,000 | 15,000 | 1 Mythril | Start at Depth 9 |
| Depth 10 Entry | Reached \-5000 | 50,000 | 30,000 | 2 Mythril | Start at Depth 10 |

**Mining Notes:**

* **Shortcuts**: Once you reach the bottom of a depth level, you can build a shortcut to start there next time  
* **Auto-Mining**: Players can always start from depth 0 and let the hero mine automatically through multiple levels until energy runs out  
* **Progressive Drain**: When mining through multiple depths, energy drain adjusts as you pass each threshold (e.g., 2/min from 0 to \-500, then 4/min from \-500 to \-1000, etc.)  
* **Material Collection**: You gain appropriate materials from each depth level as you pass through (every 30 seconds)  
* **Scaling Philosophy**: Deeper levels yield exponentially more materials per drop to compensate for exponentially higher energy costs  
* **Pickaxe Efficiency**: Higher tier pickaxes reduce energy drain \- see Section 11.3 for details  
* Energy drain is continuous while mining  
* Return to surface at any time, keeping all materials collected  
* Tool sharpening (crank mechanic) reduces energy drain by 25% for 5 minutes

### **8.3 Mining Tools – Unlocks**

**Note**: Pickaxes don't gate depth access \- you can always mine from depth 0 to 10\. Instead, they reduce energy drain to make deeper mining viable. See Section 11.3 for pickaxe efficiency details.

---

## **9\) Helpers (Gnomes) \- Role-Based System**

**What they do:** Gnomes are rescued from adventure bosses and join your farm to repay your kindness. Each gnome focuses on a single task at a time, automating crucial farm operations as plot counts become overwhelming.

### **9.1 Gnome Acquisition**

* **One-time rescue**: Each major boss (Dark Forest and beyond) rescues exactly one gnome on first Long route clear  
* **Total available**: 5 gnomes (Dark Forest, Mountain Pass, Crystal Caves, Frozen Tundra, Volcano Core)  
* **Subsequent runs**: Drop boss materials only, no additional gnomes

### **9.2 Gnome Housing Requirement**

**Important**: Rescued gnomes must rest before they can work. Without proper housing, a gnome will sit sadly in the corner of the Forge, unable to help. Once you build appropriate housing from the Carpenter in Town, they will have somewhere to sleep and can get to work.

### **9.3 Gnome Roles**

Each gnome must be assigned a single role. Roles can be changed at any time on the Farm screen.

| Role | Function | Base Effect | Leveled Effect | Max Level Effect |
| ----- | ----- | ----- | ----- | ----- |
| **Waterer** | Waters crops automatically | Waters 5 plots/minute | \+1 plot per level | 15 plots/minute at L10 |
| **Pump Operator** | Generates water passively | \+20 water/hour | \+5 water/hour per level | \+70 water/hour at L10 |
| **Sower** | Plants seeds automatically after harvest | Plants 3 seeds/minute | \+1 seed per level | 13 seeds/minute at L10 |
| **Harvester** | Collects and stores crops | Harvests 4 plots/minute | \+1 plot per level | 14 plots/minute at L10 |
| **Miner's Friend** | Reduces mining energy cost | \-15% energy drain | \-3% per level | \-45% energy drain at L10 |
| **Adventure Fighter** | Assists in combat | 5 neutral damage/hit | \+2 damage per level | 25 damage/hit at L10 |
| **Adventure Support** | Assists in combat | Heals 1 HP/30 secl | \+2 damage per level |  25 damage/hit at L1 |
| **Seed Catcher** | Boosts tower efficiency | \+10% catch rate | \+2% per level | \+30% catch rate at L10 |
| **Forager** | Collects wood from stumps | 5 wood/hour from cleared stumps | \+2 wood per level | 25 wood/hour at L10 |
| **Refiner** | Assists at forge | \+5% refinement speed | \+1% per level | \+15% speed at L10 |

**Scaling Notes**:

* With 5 max-level gnomes in watering roles, you can manage 75 plots/minute  
* The **Master Academy** enables dual-role gnomes (75% efficiency each role), effectively giving you 10 active roles  
* The **Sower** role provides full automation by replanting harvested plots with appropriate seeds  
* Combined with longer growth times (30-50 minutes for endgame crops), the helper system can manage 90 plots

### **9.3 Gnome Management**

* **Role Assignment**: Change roles freely on Farm screen (instant switch)  
* **Housing**: Build gnome quarters in Town to activate rescued gnomes  
* **Training**: Feed surplus crops to level up gnomes (max level 10\)  
* **Efficiency**: Higher levels increase role effectiveness

### **Gnome Progression**

| Level | XP Required | Energy Cost | Training Time |
| ----- | ----- | ----- | ----- |
| 1→2 | 100 | 50 | 30 min |
| 2→3 | 300 | 150 | 1 hour |
| 3→4 | 600 | 300 | 2 hours |
| 4→5 | 1,000 | 500 | 4 hours |
| 5→6 | 2,000 | 1,000 | 8 hours |
| 6→7 | 4,000 | 2,000 | 12 hours |
| 7→8 | 8,000 | 4,000 | 18 hours |
| 8→9 | 16,000 | 8,000 | 24 hours |
| 9→10 | 32,000 | 16,000 | 36 hours |

### **9.4 Gnome Training Academy (Late Game)**

| Building | Prerequisites | Gold | Build Energy | Materials | Effect |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Training Grounds | Gnome Lodge \+ **Manor Grounds** | 25,000 | 10,000 | 200 Wood, 10 Silver, Cave Crystal ×2 | Reduces training time by 25% |
| Master Academy | Training Grounds \+ **Great Estate** | 100,000 | 50,000 | 500 Wood, 5 Crystal, Frozen Heart ×1 | Reduces training time by 50%, enables dual-role gnomes |

*Note: The paradigm shift from manual farming to gnome management occurs around 20-25 plots when the first gnome is rescued. Gnome housing must be purchased from the Carpenter in Town (see Section 5.6.3). The Master Academy allows gnomes to perform two roles simultaneously at 75% efficiency each.*

## **10\) Offline Progression System**

## **Overview**

Time Hero continues progressing while the device is locked or the game is suspended. This respects player time and enables the idle gameplay loop on a handheld device. The game uses smart offline calculation that doesn't simulate every tick but calculates the end result efficiently.

## **Core Principles**

* **Real-Time Progression**: All timers use real-world time (growth, crafting, adventures continue offline)  
* **Resource Gating**: Water and seeds gate offline growth \- no infinite generation  
* **Storage Caps**: Energy and material caps prevent runaway accumulation  
* **Fair Distribution**: Resources are distributed evenly across all eligible targets  
* **Summary on Return**: Simple "While you were away..." modal shows what happened

## **10.1 System-Specific Offline Behavior**

### **10.1.1 Farm System**

**How it works:**

* Crops continue growing with available water  
* Auto-harvest when ready (if energy cap allows)  
* Auto-sow if seeds available and plots empty  
* Water distributes evenly across all active plots

**Limitations:**

* Water supply (plots \+ well total)  
* Seed availability (1 seed per plant/replant)  
* Energy storage cap (harvests stop when full)  
* No hero movement simulation

**Calculation Details:**

1. Convert offline time to growth ticks  
2. Calculate total water available (plot water \+ well water)  
3. Distribute water evenly across active plots  
4. Apply "wet" growth while water available, then "dry" growth  
5. Count harvests, spend seeds for replants  
6. Stop harvesting if energy cap reached  
7. Update final water levels

### **10.1.2 Tower System**

**How it works:**

* Auto-Catcher continues at configured rate  
* Collects from seed pool based on highest reach level  
* Seeds accumulate up to storage cap

**Limitations:**

* Seed storage capacity (150-2,000)  
* Catch rate (1 seed per 2-10 minutes based on tier)  
* Seed pool (highest reach minus 1-2 levels)

**Auto-Catcher Rates:**

* Tier I: 1 seed/10 minutes  
* Tier II: 1 seed/5 minutes  
* Tier III: 1 seed/2 minutes

### **10.1.3 Adventure System**

**How it works:**

* Adventures in progress continue running  
* Complete and store rewards for collection  
* Cannot start new adventures while offline

**Limitations:**

* Must be started before going offline  
* One adventure at a time  
* Rewards wait in "completed" state

### **10.1.4 Mining System**

**How it works:**

* Continues at current depth until energy depleted  
* Materials collected every 30 seconds  
* Stops when energy reaches zero or depth complete

**Limitations:**

* Energy drain rate (2^depth per minute)  
* Material storage caps  
* Cannot change depths while offline  
* Tool sharpening buff expires normally

### **10.1.5 Forge System**

**How it works:**

* Current crafting continues  
* Batch crafting processes sequentially  
* Items complete and wait for collection  
* Material refinement continues

**Limitations:**

* Queue processes in order  
* Cannot add new items to queue  
* Success rates apply normally  
* Heat gradually decreases to idle level

### **10.1.6 Helper System**

**How it works:**

* Helpers continue assigned tasks  
* Training progresses if food available  
* Efficiency based on current level  
* Role assignments maintained

**Limitations:**

* Training consumes food stocks  
* Cannot change roles while offline  
* Dual-role efficiency (75% each) applies

## **10.2 Offline Duration Rules**

### **Time Limits**

* **Maximum Credit**: 24 hours (prevents exploitation)  
* **Minimum Credit**: 60 seconds (avoids micro-interruptions)  
* **Menu Pause**: System menu pause doesn't count as offline time

## **10.3 "While You Were Away" Summary**

The modal displays:

* **Time Away**: Humanized format ("2 hours 15 minutes")  
* **Energy Gained**: Total from all harvests  
* **Seeds Collected**: Breakdown by type if multiple  
* **Adventures**: Completed routes and rewards  
* **Mining**: Depth reached and materials gathered  
* **Crafting**: Items completed  
* **Helpers**: Training progress and level-ups  
* **Water Generated**: From auto-pumps

**Interaction**: Press A button to dismiss modal and resume play

## **10.4 Balance Considerations**

### **Encouraging Active Play**

* Manual catching more efficient than auto-catcher  
* Heat band minigame improves forge success  
* Tool sharpening requires active input  
* Adventure route selection matters

### **Respecting Idle Time**

* Meaningful progress while away  
* No penalty for short sessions  
* Storage caps prevent waste anxiety  
* Clear feedback on return

### **Preventing Exploitation**

* 24-hour maximum prevents date manipulation  
* Resource caps limit accumulation  
* No offline adventure starting  
* Energy gating prevents infinite loops

## **Summary**

The offline system transforms Time Hero from a demanding active game into a respectful idle experience. Players can engage in short sessions throughout the day, knowing their farm continues working. The system maintains game balance while respecting the realities of playing on a handheld device.

Key achievement: Players feel rewarded for returning without feeling punished for leaving.

---

## **11\) Reference Tables**

### **11.1 Crops**

*(Core progression only; values align to energy economy and plot counts. Crops are gated by **Seed Level**. Each game phase spans two levels: Tutorial (0–1), Early Game (2–3), Mid Game (4–5), Late Game (6–7), End Game (8–9).)*

| Crop | Tier | Seed Level | Stages | Growth Time | Energy/Harvest | Energy @ 20 plots | Energy @ 65 plots | Energy @ 90 plots |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| Carrot | Early | 0 | 3 | 6 min | 1 | 20 | 65 | 90 |
| Radish | Early | 0 | 3 | 5 min | 1 | 20 | 65 | 90 |
| Potato | Early | 1 | 3 | 8 min | 2 | 40 | 130 | 180 |
| Cabbage | Early | 1 | 4 | 10 min | 3 | 60 | 195 | 270 |
| Turnip | Early | 1 | 3 | 7 min | 2 | 40 | 130 | 180 |
| Corn | Early | 2 | 5 | 15 min | 5 | 100 | 325 | 450 |
| Tomato | Early | 2 | 5 | 12 min | 4 | 80 | 260 | 360 |
| Strawberry | Mid | 3 | 5 | 20 min | 8 | 160 | 520 | 720 |
| Spinach | Mid | 3 | 3 | 10 min | 5 | 100 | 325 | 450 |
| Onion | Mid | 3 | 3 | 12 min | 6 | 120 | 390 | 540 |
| Garlic | Mid | 4 | 3 | 15 min | 8 | 160 | 520 | 720 |
| Cucumber | Mid | 4 | 5 | 25 min | 12 | 240 | 780 | 1,080 |
| Leek | Mid | 5 | 3 | 18 min | 10 | 200 | 650 | 900 |
| Wheat | Mid | 5 | 4 | 22 min | 12 | 240 | 780 | 1,080 |
| Asparagus | Late | 6 | 4 | 30 min | 20 | 400 | 1,300 | 1,800 |
| Cauliflower | Late | 6 | 4 | 28 min | 18 | 360 | 1,170 | 1,620 |
| Caisim | Late | 6 | 3 | 25 min | 15 | 300 | 975 | 1,350 |
| Pumpkin | Late | 6 | 5 | 35 min | 25 | 500 | 1,625 | 2,250 |
| Watermelon | Late | 7 | 5 | 40 min | 35 | 700 | 2,275 | 3,150 |
| Honeydew | Late | 7 | 5 | 38 min | 30 | 600 | 1,950 | 2,700 |
| Pineapple | Endgame | 8 | 5 | 45 min | 40 | 800 | 2,600 | 3,600 |
| Beetroot | Endgame | 8 | 4 | 35 min | 35 | 700 | 2,275 | 3,150 |
| Eggplant | Endgame | 8 | 3 | 30 min | 30 | 600 | 1,950 | 2,700 |
| Soybean | Endgame | 8 | 5 | 42 min | 45 | 900 | 2,925 | 4,050 |
| Yam | Endgame | 9 | 5 | 50 min | 50 | 1,000 | 3,250 | 4,500 |
| Bell Pepper (G) | Endgame | 9 | 5 | 48 min | 45 | 900 | 2,925 | 4,050 |
| Bell Pepper (R) | Endgame | 9 | 5 | 48 min | 55 | 1,100 | 3,575 | 4,950 |
| Bell Pepper (Y) | Endgame | 9 | 5 | 48 min | 65 | 1,300 | 4,225 | 5,850 |
| Shallot | Endgame | 9 | 3 | 40 min | 60 | 1,200 | 3,900 | 5,400 |

### **11.2 Weapons**

All weapons follow the combat pentagon: Spear \> Armored Insects, Sword \> Predatory Beasts, Bow \> Flying Predators, Crossbow \> Venomous Crawlers, Wand \> Living Plants. Slimes take neutral damage from all weapons.

#### **Spears (vs Armored Insects: 1.5x)**

| Level | Name | Prerequisites | Gold | Materials | Damage | Attack Speed |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | Spear | Forge built | 100 | 5 Wood, 3 Stone | 10 | 1.0/sec |
| 2 | Spear II | Spear | 250 | 8 Wood, 5 Copper | 15 | 1.0/sec |
| 3 | Spear III | Spear II | 500 | 10 Iron | 22 | 1.0/sec |
| 4 | Spear IV | Spear III \+ **Anvil I** | 1,000 | 15 Iron, 5 Silver | 32 | 1.1/sec |
| 5 | Spear V | Spear IV | 2,500 | 8 Silver | 45 | 1.1/sec |
| 6 | Spear VI | Spear V \+ **Anvil II** | 5,000 | 3 Crystal | 60 | 1.2/sec |
| 7 | Spear VII | Spear VI | 10,000 | 5 Crystal, Pine Resin ×1 | 80 | 1.2/sec |
| 8 | Spear VIII | Spear VII \+ **Mythril Anvil** | 25,000 | 2 Mythril | 105 | 1.3/sec |
| 9 | Spear IX | Spear VIII | 50,000 | 3 Mythril, Frozen Heart ×1 | 135 | 1.3/sec |
| X | Spear X | Spear IX | 100,000 | 1 Obsidian, Molten Core ×2 | 200 | 1.5/sec |

#### **Swords (vs Predatory Beasts: 1.5x)**

| Level | Name | Prerequisites | Gold | Materials | Damage | Attack Speed |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | Sword | Forge built | 100 | 5 Wood, 3 Stone | 12 | 0.9/sec |
| 2 | Sword II | Sword | 250 | 8 Wood, 5 Copper | 18 | 0.9/sec |
| 3 | Sword III | Sword II | 500 | 10 Iron | 26 | 0.9/sec |
| 4 | Sword IV | Sword III \+ **Anvil I** | 1,000 | 15 Iron, 5 Silver | 38 | 0.95/sec |
| 5 | Sword V | Sword IV | 2,500 | 8 Silver | 54 | 0.95/sec |
| 6 | Sword VI | Sword V \+ **Anvil II** | 5,000 | 3 Crystal | 72 | 1.0/sec |
| 7 | Sword VII | Sword VI | 10,000 | 5 Crystal, Shadow Bark ×1 | 96 | 1.0/sec |
| 8 | Sword VIII | Sword VII \+ **Mythril Anvil** | 25,000 | 2 Mythril | 126 | 1.05/sec |
| 9 | Sword IX | Sword VIII | 50,000 | 3 Mythril, Mountain Stone ×1 | 162 | 1.05/sec |
| X | Sword X | Sword IX | 100,000 | 1 Obsidian, Molten Core ×2 | 240 | 1.2/sec |

#### **Bows (vs Flying Predators: 1.5x)**

| Level | Name | Prerequisites | Gold | Materials | Damage | Attack Speed |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | Bow | Forge built | 100 | 8 Wood, 2 Stone | 8 | 1.2/sec |
| 2 | Bow II | Bow | 250 | 12 Wood, 5 Copper | 12 | 1.2/sec |
| 3 | Bow III | Bow II | 500 | 10 Iron, 5 Wood | 18 | 1.2/sec |
| 4 | Bow IV | Bow III \+ **Anvil I** | 1,000 | 15 Iron, 5 Silver | 26 | 1.25/sec |
| 5 | Bow V | Bow IV | 2,500 | 8 Silver | 37 | 1.25/sec |
| 6 | Bow VI | Bow V \+ **Anvil II** | 5,000 | 3 Crystal | 50 | 1.3/sec |
| 7 | Bow VII | Bow VI | 10,000 | 5 Crystal, Cave Crystal ×1 | 67 | 1.3/sec |
| 8 | Bow VIII | Bow VII \+ **Mythril Anvil** | 25,000 | 2 Mythril | 88 | 1.35/sec |
| 9 | Bow IX | Bow VIII | 50,000 | 3 Mythril, Frozen Heart ×1 | 113 | 1.35/sec |
| X | Bow X | Bow IX | 100,000 | 1 Obsidian, Molten Core ×2 | 167 | 1.5/sec |

#### **Crossbows (vs Venomous Crawlers: 1.5x)**

| Level | Name | Prerequisites | Gold | Materials | Damage | Attack Speed |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | Crossbow | Forge built | 150 | 10 Wood, 5 Stone | 15 | 0.7/sec |
| 2 | Crossbow II | Crossbow | 375 | 15 Wood, 8 Copper | 23 | 0.7/sec |
| 3 | Crossbow III | Crossbow II | 750 | 12 Iron, 8 Wood | 33 | 0.7/sec |
| 4 | Crossbow IV | Crossbow III \+ **Anvil I** | 1,500 | 18 Iron, 6 Silver | 48 | 0.75/sec |
| 5 | Crossbow V | Crossbow IV | 3,750 | 10 Silver | 68 | 0.75/sec |
| 6 | Crossbow VI | Crossbow V \+ **Anvil II** | 7,500 | 4 Crystal | 91 | 0.8/sec |
| 7 | Crossbow VII | Crossbow VI | 15,000 | 6 Crystal, Mountain Stone ×1 | 122 | 0.8/sec |
| 8 | Crossbow VIII | Crossbow VII \+ **Mythril Anvil** | 37,500 | 3 Mythril | 160 | 0.85/sec |
| 9 | Crossbow IX | Crossbow VIII | 75,000 | 4 Mythril, Cave Crystal ×2 | 206 | 0.85/sec |
| X | Crossbow X | Crossbow IX | 150,000 | 2 Obsidian, Molten Core ×3 | 305 | 1.0/sec |

#### **Wands (vs Living Plants: 1.5x)**

| Level | Name | Prerequisites | Gold | Materials | Damage | Attack Speed |
| ----- | ----- | ----- | ----- | ----- | ----- | ----- |
| 1 | Wand | Forge built | 200 | 5 Wood, 1 Copper | 7 | 1.5/sec |
| 2 | Wand II | Wand | 500 | 8 Wood, 3 Copper | 11 | 1.5/sec |
| 3 | Wand III | Wand II | 1,000 | 5 Iron, 2 Silver | 16 | 1.5/sec |
| 4 | Wand IV | Wand III \+ **Anvil I** | 2,000 | 8 Silver | 23 | 1.6/sec |
| 5 | Wand V | Wand IV | 5,000 | 12 Silver | 33 | 1.6/sec |
| 6 | Wand VI | Wand V \+ **Anvil II** | 10,000 | 2 Crystal | 44 | 1.7/sec |
| 7 | Wand VII | Wand VI | 20,000 | 4 Crystal, Pine Resin ×2 | 59 | 1.7/sec |
| 8 | Wand VIII | Wand VII \+ **Mythril Anvil** | 50,000 | 2 Mythril | 77 | 1.8/sec |
| 9 | Wand IX | Wand VIII | 100,000 | 3 Mythril, Shadow Bark ×2 | 99 | 1.8/sec |
| X | Wand X | Wand IX | 200,000 | 1 Obsidian, Frozen Heart ×2 | 147 | 2.0/sec |

**Combat Effectiveness Note:**

* Weapons deal 1.5× damage to their advantaged enemy type  
* Weapons deal 0.5× damage to their resisted enemy type  
* Weapons deal 1.0× damage to neutral enemies and slimes  
* Hero auto-switches between two equipped weapons based on enemy type  
* See Combat Mechanics & Balance document for complete combat system

**Weapon Notes:**

* All weapons can be purchased as blueprints from the Blacksmith, then crafted at the Forge  
* Higher tier weapons require corresponding Anvil levels to craft

---

### **11.3 Tools**

#### **Farm Tools**

| Tool | Tier | Purpose | Unlocks | Special Effects |
| ----- | ----- | ----- | ----- | ----- |
| Hoe | Base | Till soil for plots | Create new farm plots | – |
| Hoe+ | Plus | Advanced tilling | Till multiple plots faster | 2x tilling speed |
| Terra Former | Master | Massive land shaping | Terraform sections | 4x tilling speed, can till 4 plots at once |
| Hammer | Base | Clear rocks | Remove rocks from expansion | – |
| Hammer+ | Plus | Clear boulders | Remove large boulders | Can break stone clusters |
| Stone Breaker | Master | Shatter monoliths | Clear stone monoliths in Stage 5 | Instant rock clearing, yields bonus stone |
| Axe | Base | Remove stumps | Clear tree stumps | – |
| Axe+ | Plus | Heavy timber work | Faster stump removal | 2x wood yield from stumps |
| World Splitter | Master | Ancient root clearing | Clear ancient roots in Stage 5 | 3x wood yield, chance for Enchanted Wood |
| Shovel | Base | Excavate buried rocks | Dig up buried obstacles | – |
| Shovel+ | Plus | Deep excavation | Faster excavation | Can dig irrigation channels |
| Earth Mover | Master | Reshape the land | Clear thickets, major excavation | Can clear multiple obstacles at once |
| Watering Can | Base | Water 1 plot | Default watering tool | – |
| Watering Can II | Upgrade | Water 2 plots | Improved efficiency | – |
| Sprinkler Can | Plus | Water 4 plots | Area watering | – |
| Rain Bringer | Master | Water 8 plots | Divine watering | Plots stay watered 50% longer |

#### **Mining Tools (Pickaxes)**

| Pickaxe | Tier | Energy Reduction | Material Bonus | Max Depth | Special |
| ----- | ----- | ----- | ----- | ----- | ----- |
| Pickaxe I | Base | 0% | 0% | Depth 10 | Starting pickaxe |
| Pickaxe II | Iron | \-15% | \+10% | Depth 10 | Slightly faster mining |
| Pickaxe III | Silver | \-30% | \+20% | Depth 10 | Good efficiency |
| Crystal Pick | Crystal | \-45% | \+30% | Depth 10 | Excellent efficiency |
| Abyss Seeker | Mythril | \-60% | \+50% | Depth 10 | Can sense rare materials (2x obsidian chance) |

**Pickaxe Energy Calculation**: `Actual Drain = Base Drain × (1 - Pickaxe Reduction)`

* Example: Depth 10 with Crystal Pick \= 1024 × 0.55 \= 563 energy/min  
* Example: Depth 10 with Abyss Seeker \= 1024 × 0.40 \= 410 energy/min

**Material Bonus**: Increases all material drops by the percentage shown.

#### **Watering Tools Evolution**

| Tool | Plots Watered | Craft Requirements | Notes |
| ----- | ----- | ----- | ----- |
| Hero Hands | 1 | – | Starting tool |
| Watering Can II | 2 | 5 Copper \+ 3 Wood | First upgrade |
| Sprinkler Can | 4 | 3 Silver \+ Pine Resin ×1 | Mid-game essential |
| Rain Bringer | 8 | 1 Crystal \+ Frozen Heart ×1 | Endgame automation |

#### **Tool Progression Philosophy**

* **Base Tools**: Enable the mechanic (clear obstacles, mine, water)  
* **Plus Tools (+)**: Improve efficiency by 2x, require boss materials  
* **Master Tools**: Transform the mechanic (3-4x efficiency, special abilities), require rare boss materials

**Tool Naming Convention**:

* Base and Plus tools use descriptive names (Hammer, Hammer+)  
* Master tools get epic names that hint at their power (Stone Breaker, World Splitter, Earth Mover)

**Tool Gating**:

* Base tools gate access to game mechanics  
* Plus tools gate mid-game efficiency  
* Master tools are prestige items for endgame optimization

### **11.4 Hero Progression**

| Level | XP Required | Total HP | Typical Game Phase |
| ----- | ----- | ----- | ----- |
| 1 | 0 | 120 | Tutorial |
| 2 | 100 | 140 | Tutorial |
| 3 | 300 | 160 | Early Game |
| 4 | 600 | 180 | Early Game |
| 5 | 1,000 | 200 | Early Game |
| 6 | 1,500 | 220 | Mid Game |
| 7 | 2,100 | 240 | Mid Game |
| 8 | 2,800 | 260 | Mid Game |
| 9 | 3,600 | 280 | Late Game |
| 10 | 4,500 | 300 | Late Game |
| 11 | 5,500 | 320 | Endgame |
| 12 | 6,600 | 340 | Endgame |
| 13 | 7,800 | 360 | Post-game |
| 14 | 9,100 | 380 | Post-game |
| 15 | 10,500 | 400 | Max Level |

**XP Sources:**

* Short adventures: 10 XP  
* Medium adventures: 30 XP  
* Long adventures: 60 XP  
* Boss kill bonus: \+20 XP

**HP Note:** HP is separate from Energy. HP is used only for combat survivability, while Energy fuels all activities (starting adventures, mining, crafting, etc.)

---

