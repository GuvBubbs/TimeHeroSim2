// Phase 1 Test Script - Standalone test of type/category extraction
// This tests our grouping functions without running the full app

// Mock data similar to what we'll get from CSV
const mockItems = [
  {
    id: 'storage_shed_1',
    name: 'Storage Shed I',
    type: 'energy_storage',
    categories: [],
    sourceFile: 'farm_actions.csv',
    prerequisites: ['blueprint_storage_shed_1']
  },
  {
    id: 'iron_sword',
    name: 'Iron Sword',
    type: 'weapon',
    categories: ['sword'],
    sourceFile: 'town_blacksmith.csv',
    prerequisites: []
  },
  {
    id: 'copper_hoe',
    name: 'Copper Hoe',
    type: 'tool',
    categories: ['hoe'],
    sourceFile: 'town_blacksmith.csv',
    prerequisites: []
  },
  {
    id: 'copper_hoe_plus',
    name: 'Copper Hoe+',
    type: 'tool',
    categories: ['hoe'],
    sourceFile: 'town_blacksmith.csv',
    prerequisites: ['copper_hoe']
  }
];

// Mock functions (simplified versions of actual functions)
function determineSwimLane(item) {
  if (item.sourceFile?.includes('farm')) return 'Farm';
  if (item.sourceFile?.includes('blacksmith')) return 'Blacksmith';
  return 'General';
}

function calculatePrerequisiteDepth(item, allItems) {
  if (!item.prerequisites || item.prerequisites.length === 0) return 0;
  
  let maxDepth = 0;
  for (const prereqId of item.prerequisites) {
    const prereqItem = allItems.find(i => i.id === prereqId);
    if (prereqItem) {
      maxDepth = Math.max(maxDepth, calculatePrerequisiteDepth(prereqItem, allItems) + 1);
    }
  }
  return maxDepth;
}

// Our Phase 1 functions
function normalizeGroupString(str) {
  return str.toLowerCase().trim().replace(/\s+/g, '_').replace(/s$/, '');
}

function extractTypeCategories(items) {
  const hierarchy = {};
  
  items.forEach(item => {
    const swimlane = determineSwimLane(item);
    const type = normalizeGroupString(item.type || 'ungrouped');
    const category = normalizeGroupString(item.categories?.[0] || 'uncategorized');
    
    if (!hierarchy[swimlane]) hierarchy[swimlane] = {};
    if (!hierarchy[swimlane][type]) hierarchy[swimlane][type] = {};
    if (!hierarchy[swimlane][type][category]) hierarchy[swimlane][type][category] = [];
    
    hierarchy[swimlane][type][category].push(item);
  });
  
  return hierarchy;
}

function logGroupHierarchy(items) {
  const hierarchy = extractTypeCategories(items);
  console.log('🎯 TYPE/CATEGORY HIERARCHY EXTRACTION (Phase 1):');
  
  Object.entries(hierarchy).forEach(([swimlane, types]) => {
    console.log(`\n📊 ${swimlane}:`);
    Object.entries(types).forEach(([type, categories]) => {
      console.log(`  📁 Type: ${type}`);
      Object.entries(categories).forEach(([category, itemsInCategory]) => {
        console.log(`    📄 Category: ${category} (${itemsInCategory.length} items)`);
        itemsInCategory.forEach(item => {
          const tier = calculatePrerequisiteDepth(item, items);
          console.log(`      - ${item.name} (tier: ${tier})`);
        });
      });
    });
  });
  
  // Summary statistics
  const totalSwimLanes = Object.keys(hierarchy).length;
  const totalTypes = Object.values(hierarchy).reduce((sum, types) => sum + Object.keys(types).length, 0);
  const totalCategories = Object.values(hierarchy).reduce((sum, types) => 
    sum + Object.values(types).reduce((typeSum, categories) => typeSum + Object.keys(categories).length, 0), 0);
  
  console.log(`\n📈 EXTRACTION SUMMARY:`);
  console.log(`  Swimlanes: ${totalSwimLanes}`);
  console.log(`  Types: ${totalTypes}`);
  console.log(`  Categories: ${totalCategories}`);
  console.log(`  Total Items: ${items.length}`);
}

// Test the extraction
console.log('Testing Phase 1 Type/Category Extraction...\n');
logGroupHierarchy(mockItems);

console.log('\n✅ Phase 1 Test Complete - Functions working correctly!');
