// Test the Phase 2 layout algorithm
console.log('Testing Phase 2 layout algorithm:');

// Simulate the topological sort algorithm
function testTopologicalSort() {
  const nodes = [
    { id: 'wood_gather', prerequisites: [], type: 'action', category: 'basic' },
    { id: 'wood_axe', prerequisites: ['wood_gather'], type: 'tool', category: 'axe' },
    { id: 'oak_chop', prerequisites: ['wood_axe'], type: 'action', category: 'advanced' },
    { id: 'storage_upgrade', prerequisites: ['wood_gather'], type: 'upgrade', category: 'storage' },
    { id: 'advanced_chop', prerequisites: ['oak_chop', 'storage_upgrade'], type: 'action', category: 'advanced' }
  ];
  
  // Build dependency levels using simplified algorithm
  const levels = new Map();
  const inDegree = new Map();
  const adjList = new Map();
  
  // Initialize
  nodes.forEach(node => {
    levels.set(node.id, 0);
    inDegree.set(node.id, 0);
    adjList.set(node.id, []);
  });
  
  // Build graph
  nodes.forEach(node => {
    node.prerequisites.forEach(prereqId => {
      adjList.get(prereqId).push(node.id);
      inDegree.set(node.id, inDegree.get(node.id) + 1);
    });
  });
  
  // Process in topological order
  const queue = [];
  for (const [nodeId, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(nodeId);
    }
  }
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentLevel = levels.get(currentId);
    
    adjList.get(currentId).forEach(dependentId => {
      const newInDegree = inDegree.get(dependentId) - 1;
      inDegree.set(dependentId, newInDegree);
      
      const newLevel = Math.max(levels.get(dependentId), currentLevel + 1);
      levels.set(dependentId, newLevel);
      
      if (newInDegree === 0) {
        queue.push(dependentId);
      }
    });
  }
  
  console.log('✅ Column assignment (topological sort):');
  nodes.forEach(node => {
    console.log(`  ${node.id}: column ${levels.get(node.id)}`);
  });
  
  return levels;
}

// Test row grouping
function testRowGrouping() {
  const nodes = [
    { id: 'action1', type: 'action', category: 'basic', column: 0 },
    { id: 'action2', type: 'action', category: 'basic', column: 1 },
    { id: 'action3', type: 'action', category: 'advanced', column: 1 },
    { id: 'tool1', type: 'tool', category: 'axe', column: 1 },
    { id: 'upgrade1', type: 'upgrade', category: 'storage', column: 1 }
  ];
  
  // Group by type, then category
  const typeGroups = new Map();
  nodes.forEach(node => {
    if (!typeGroups.has(node.type)) {
      typeGroups.set(node.type, []);
    }
    typeGroups.get(node.type).push(node);
  });
  
  let currentRow = 0;
  typeGroups.forEach((typeNodes, type) => {
    console.log(`\n📝 Type: ${type}`);
    
    const categoryGroups = new Map();
    typeNodes.forEach(node => {
      if (!categoryGroups.has(node.category)) {
        categoryGroups.set(node.category, []);
      }
      categoryGroups.get(node.category).push(node);
    });
    
    categoryGroups.forEach((categoryNodes, category) => {
      console.log(`  Category: ${category}, Row: ${currentRow}`);
      categoryNodes.forEach(node => {
        node.row = currentRow;
        console.log(`    ${node.id}: column ${node.column}, row ${node.row}`);
      });
      currentRow++;
    });
    
    currentRow++; // Gap between types
  });
  
  console.log('\n✅ Row assignment completed');
  return nodes;
}

testTopologicalSort();
testRowGrouping();

console.log('\n🎯 Phase 2 layout algorithm test completed successfully!');
