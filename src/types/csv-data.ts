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
  gameFeature: 'Farm' | 'Town' | 'Adventure' | 'Combat' | 'Forge' | 'Mining' | 'Tower' | 'General'
  displayName: string
  description: string
  hasUnifiedSchema: boolean
}

export const CSV_FILE_LIST: CSVFileMetadata[] = [
  // Farm (5 files)
  { filename: 'crops.csv', category: 'Data', gameFeature: 'Farm', displayName: 'Crops', description: 'Farmable crops and their properties', hasUnifiedSchema: true },
  { filename: 'farm_actions.csv', category: 'Actions', gameFeature: 'Farm', displayName: 'Farm Actions', description: 'Farm construction and expansion actions', hasUnifiedSchema: true },
  { filename: 'farm_stages.csv', category: 'Data', gameFeature: 'Farm', displayName: 'Farm Stages', description: 'Farm development stages', hasUnifiedSchema: true },
  { filename: 'helpers.csv', category: 'Data', gameFeature: 'Farm', displayName: 'Helpers', description: 'Individual helper characters', hasUnifiedSchema: true },
  { filename: 'helper_roles.csv', category: 'Data', gameFeature: 'Farm', displayName: 'Helper Roles', description: 'Gnome helper role definitions', hasUnifiedSchema: false },
  
  // Town (7 files)
  { filename: 'vendors.csv', category: 'Unlocks', gameFeature: 'Town', displayName: 'Vendors', description: 'Merchant and vendor unlocks', hasUnifiedSchema: true },
  { filename: 'town_blacksmith.csv', category: 'Unlocks', gameFeature: 'Town', displayName: 'Blacksmith', description: 'Crafting and forging unlocks', hasUnifiedSchema: true },
  { filename: 'town_carpenter.csv', category: 'Unlocks', gameFeature: 'Town', displayName: 'Carpenter', description: 'Building and construction unlocks', hasUnifiedSchema: true },
  { filename: 'town_land_steward.csv', category: 'Unlocks', gameFeature: 'Town', displayName: 'Land Steward', description: 'Land management unlocks', hasUnifiedSchema: true },
  { filename: 'town_material_trader.csv', category: 'Actions', gameFeature: 'Town', displayName: 'Material Trader', description: 'Trading post actions and exchanges', hasUnifiedSchema: true },
  { filename: 'town_skills_trainer.csv', category: 'Unlocks', gameFeature: 'Town', displayName: 'Skills Trainer', description: 'Character skill unlocks', hasUnifiedSchema: true },
  { filename: 'town_agronomist.csv', category: 'Unlocks', gameFeature: 'Town', displayName: 'Agronomist', description: 'Farming specialist unlocks', hasUnifiedSchema: true },
  
  // Adventure (1 file)
  { filename: 'adventures.csv', category: 'Data', gameFeature: 'Adventure', displayName: 'Adventures', description: 'Quest and adventure definitions', hasUnifiedSchema: true },
  
  // Combat (9 files)
  { filename: 'weapons.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Weapons', description: 'Combat weapons and stats', hasUnifiedSchema: true },
  { filename: 'xp_progression.csv', category: 'Data', gameFeature: 'Combat', displayName: 'XP Progression', description: 'Experience and level progression', hasUnifiedSchema: true },
  { filename: 'boss_materials.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Boss Materials', description: 'Materials dropped by bosses', hasUnifiedSchema: false },
  { filename: 'armor_base.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Armor Base', description: 'Base armor statistics', hasUnifiedSchema: false },
  { filename: 'armor_potential.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Armor Potential', description: 'Armor upgrade potential', hasUnifiedSchema: false },
  { filename: 'armor_effects.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Armor Effects', description: 'Armor special effects and bonuses', hasUnifiedSchema: false },
  { filename: 'route_loot_table.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Route Loot', description: 'Loot tables for adventure routes', hasUnifiedSchema: false },
  { filename: 'enemy_types_damage.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Enemy Types', description: 'Enemy types and damage values', hasUnifiedSchema: false },
  { filename: 'route_wave_composition.csv', category: 'Data', gameFeature: 'Combat', displayName: 'Wave Composition', description: 'Enemy wave compositions', hasUnifiedSchema: false },
  
  // Forge (2 files)
  { filename: 'forge_actions.csv', category: 'Actions', gameFeature: 'Forge', displayName: 'Forge Actions', description: 'Blacksmith and crafting actions', hasUnifiedSchema: true },
  { filename: 'tools.csv', category: 'Data', gameFeature: 'Forge', displayName: 'Tools', description: 'Farm tools and equipment', hasUnifiedSchema: true },
  
  // Mining (1 file)
  { filename: 'mining.csv', category: 'Data', gameFeature: 'Mining', displayName: 'Mining', description: 'Mining nodes and resources', hasUnifiedSchema: true },
  
  // Tower (1 file)
  { filename: 'tower_actions.csv', category: 'Actions', gameFeature: 'Tower', displayName: 'Tower Actions', description: 'Tower building and upgrade actions', hasUnifiedSchema: true },

  // General (1 file)
  { filename: 'phase_transitions.csv', category: 'Data', gameFeature: 'General', displayName: 'Phase Transitions', description: 'Game phase progression rules', hasUnifiedSchema: false }
]

// Helper to get files that should contribute to item loading
export const UNIFIED_SCHEMA_FILES = CSV_FILE_LIST.filter(file => file.hasUnifiedSchema)
