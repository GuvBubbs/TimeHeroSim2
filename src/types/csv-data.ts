/**
 * Raw CSV row interface - represents the unified schema used across all CSV files
 * This interface matches the column structure found in all CSV files
 */
export interface CSVGameDataRow {
  id: string
  name: string
  prerequisite: string // Can be empty or contain semicolon-separated prerequisites
  type: string
  categories: string
  gold_cost: string
  gold_gain: string
  energy_cost: string
  time: string
  materials_cost: string // Format: "Material x5" or "Material1 x5;Material2 x10"
  materials_gain: string // Same format as materials_cost
  level: string
  effect: string
  activities: string
  ratio: string
  sell_price_per_unit: string
  min_quantity: string
  exchange_rate: string
  windLevel: string
  seedLevel: string
  seedPool: string
  damage: string
  attackSpeed: string
  advantageVs: string
  length: string
  boss: string
  boss_drop: string
  common_drop: string
  enemy_rolls: string
  depth_range: string
  effectPerLevel: string
  plots_added: string
  total_plots: string
  tool_required: string
  repeatable: string // "TRUE" or "FALSE"
  notes: string
}

/**
 * Metadata about CSV files and their categories
 */
export interface CSVFileMetadata {
  filename: string
  category: 'Actions' | 'Data' | 'Unlocks'
  displayName: string
  description: string
  hasUnifiedSchema: boolean
}

export const CSV_FILE_LIST: CSVFileMetadata[] = [
  // Actions (All use unified schema)
  { filename: 'farm_actions.csv', category: 'Actions', displayName: 'Farm Actions', description: 'Farm construction and expansion actions', hasUnifiedSchema: true },
  { filename: 'forge_actions.csv', category: 'Actions', displayName: 'Forge Actions', description: 'Blacksmith and crafting actions', hasUnifiedSchema: true },
  { filename: 'tower_actions.csv', category: 'Actions', displayName: 'Tower Actions', description: 'Tower building and upgrade actions', hasUnifiedSchema: true },
  { filename: 'town_material_trader.csv', category: 'Actions', displayName: 'Material Trader', description: 'Trading post actions and exchanges', hasUnifiedSchema: true },
  
  // Core Data (Mixed schemas)
  { filename: 'adventures.csv', category: 'Data', displayName: 'Adventures', description: 'Quest and adventure definitions', hasUnifiedSchema: true },
  { filename: 'armor_base.csv', category: 'Data', displayName: 'Armor (Base)', description: 'Base armor statistics', hasUnifiedSchema: false },
  { filename: 'armor_effects.csv', category: 'Data', displayName: 'Armor Effects', description: 'Armor special effects and bonuses', hasUnifiedSchema: false },
  { filename: 'armor_potential.csv', category: 'Data', displayName: 'Armor Potential', description: 'Armor upgrade potential', hasUnifiedSchema: false },
  { filename: 'boss_materials.csv', category: 'Data', displayName: 'Boss Materials', description: 'Materials dropped by bosses', hasUnifiedSchema: false },
  { filename: 'crops.csv', category: 'Data', displayName: 'Crops', description: 'Farmable crops and their properties', hasUnifiedSchema: true },
  { filename: 'enemy_types_damage.csv', category: 'Data', displayName: 'Enemy Types', description: 'Enemy types and damage values', hasUnifiedSchema: false },
  { filename: 'farm_stages.csv', category: 'Data', displayName: 'Farm Stages', description: 'Farm development stages', hasUnifiedSchema: true },
  { filename: 'helper_roles.csv', category: 'Data', displayName: 'Helper Roles', description: 'Gnome helper role definitions', hasUnifiedSchema: false },
  { filename: 'helpers.csv', category: 'Data', displayName: 'Helpers', description: 'Individual helper characters', hasUnifiedSchema: true },
  { filename: 'mining.csv', category: 'Data', displayName: 'Mining', description: 'Mining nodes and resources', hasUnifiedSchema: true },
  { filename: 'phase_transitions.csv', category: 'Data', displayName: 'Phase Transitions', description: 'Game phase progression rules', hasUnifiedSchema: false },
  { filename: 'route_loot_table.csv', category: 'Data', displayName: 'Route Loot', description: 'Loot tables for adventure routes', hasUnifiedSchema: false },
  { filename: 'route_wave_composition.csv', category: 'Data', displayName: 'Route Waves', description: 'Enemy wave compositions', hasUnifiedSchema: false },
  { filename: 'tools.csv', category: 'Data', displayName: 'Tools', description: 'Farm tools and equipment', hasUnifiedSchema: true },
  { filename: 'weapons.csv', category: 'Data', displayName: 'Weapons', description: 'Combat weapons and stats', hasUnifiedSchema: true },
  { filename: 'xp_progression.csv', category: 'Data', displayName: 'XP Progression', description: 'Experience and level progression', hasUnifiedSchema: true },
  
  // Unlocks (All use unified schema)
  { filename: 'town_agronomist.csv', category: 'Unlocks', displayName: 'Agronomist', description: 'Farming specialist unlocks', hasUnifiedSchema: true },
  { filename: 'town_blacksmith.csv', category: 'Unlocks', displayName: 'Blacksmith', description: 'Crafting and forging unlocks', hasUnifiedSchema: true },
  { filename: 'town_carpenter.csv', category: 'Unlocks', displayName: 'Carpenter', description: 'Building and construction unlocks', hasUnifiedSchema: true },
  { filename: 'town_land_steward.csv', category: 'Unlocks', displayName: 'Land Steward', description: 'Land management unlocks', hasUnifiedSchema: true },
  { filename: 'town_skills_trainer.csv', category: 'Unlocks', displayName: 'Skills Trainer', description: 'Character skill unlocks', hasUnifiedSchema: true },
  { filename: 'vendors.csv', category: 'Unlocks', displayName: 'Vendors', description: 'Merchant and vendor unlocks', hasUnifiedSchema: true }
]

// Helper to get files that should contribute to item loading
export const UNIFIED_SCHEMA_FILES = CSV_FILE_LIST.filter(file => file.hasUnifiedSchema)
