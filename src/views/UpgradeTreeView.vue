<template>
  <div class="upgrade-tree-container">
    <!-- Header with controls -->
    <div class="tree-header">
      <h2 class="text-3xl font-bold">Upgrade Dependencies</h2>
      <div class="tree-controls">
        <div class="text-sm text-sim-muted">
          <span v-if="treeStore.isLoading">Loading...</span>
          <span v-else-if="treeStore.loadError" class="text-red-400">{{ treeStore.loadError }}</span>
          <span v-else>{{ treeStore.nodes.length }} nodes loaded</span>
        </div>
      </div>
    </div>
    
    <!-- Scrollable tree area -->
    <div class="tree-scroll-area card" @click="handleBackgroundClick">
      <div v-if="treeStore.isLoading" class="loading-state">
        <i class="fas fa-spinner fa-spin text-4xl mb-4"></i>
        <p>Loading upgrade tree...</p>
      </div>
      
      <div v-else-if="treeStore.loadError" class="error-state">
        <i class="fas fa-exclamation-triangle text-4xl mb-4 text-red-400"></i>
        <p class="text-red-400">{{ treeStore.loadError }}</p>
        <button @click="treeStore.loadTreeData()" class="mt-4 btn-primary">
          Retry
        </button>
      </div>
      
      <TreeGrid 
        v-else
        :nodes="treeStore.nodes"
        :connections="treeStore.connections"
        :swimlanes="treeStore.swimlanes"
        :grid-config="treeStore.gridConfig"
        :node-positions="treeStore.nodePositions"
        :highlight-mode="treeStore.highlightMode"
        :highlighted-nodes="treeStore.highlightedNodes"
        :is-node-highlighted="treeStore.isNodeHighlighted"
        :is-node-dimmed="treeStore.isNodeDimmed"
        :get-swimlane-start-y="treeStore.getSwimlaneStartY"
        @node-click="handleNodeClick"
        @edit-click="handleEditClick"
        @background-click="handleBackgroundClick"
        @connection-hover="handleConnectionHover"
      />
    </div>
    
    <!-- Edit modal (reused from Configuration screen) -->
    <!-- TODO: In Phase 6, we'll add the edit modal integration -->
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useUpgradeTreeStore } from '@/stores/upgradeTree'
import type { TreeNode, Connection } from '@/types/upgrade-tree'
import TreeGrid from '@/components/UpgradeTree/TreeGrid.vue'

const treeStore = useUpgradeTreeStore()

// Load data when component mounts
onMounted(async () => {
  await treeStore.loadTreeData()
})

// Handle node body click (enter highlight mode)
function handleNodeClick(node: TreeNode) {
  if (treeStore.highlightMode && treeStore.selectedNodeId === node.id) {
    // Clicking same node exits highlight mode
    treeStore.exitHighlightMode()
  } else {
    // Enter highlight mode for this node
    treeStore.enterHighlightMode(node.id)
  }
}

// Handle edit button click
function handleEditClick(node: TreeNode) {
  // TODO: In Phase 6, implement edit modal
  console.log('Edit node:', node)
}

// Handle clicking on background (exit highlight mode)
function handleBackgroundClick() {
  treeStore.exitHighlightMode()
}

// Handle connection hover
function handleConnectionHover(connection: Connection, isHovering: boolean) {
  // TODO: Could add visual feedback for hovered connections
  console.log('Connection hover:', connection, isHovering)
}
</script>

<style scoped>
.upgrade-tree-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.tree-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.tree-scroll-area {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  color: #9ca3af;
}

/* Button styles to match the app theme */
.btn-primary {
  background: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background: #2563eb;
}
</style>
