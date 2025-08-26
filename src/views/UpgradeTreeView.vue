<template>
  <div class="upgrade-tree-container">
    <!-- Header with controls -->
    <div class="tree-header">
      <h2 class="text-3xl font-bold">Upgrade Dependencies</h2>
      <div class="tree-controls">
        <div class="text-sm text-sim-muted">
          <span v-if="treeStore.isLoading">Loading...</span>
          <span v-else-if="treeStore.loadError" class="text-red-400">{{ treeStore.loadError }}</span>
          <span v-else>
            {{ treeStore.nodes.length }} nodes loaded
            <span v-if="treeStore.highlightMode" class="ml-4 text-amber-400">
              • {{ treeStore.selectedNodes.size }} selected
              <span v-if="treeStore.multiSelectMode" class="text-amber-300">(Multi-select: Ctrl+Click)</span>
            </span>
          </span>
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
        :nodes="treeStore.getVisibleNodes()"
        :connections="treeStore.getVisibleConnections()"
        :swimlanes="debugSwimlanes"
        :grid-config="treeStore.gridConfig"
        :node-positions="treeStore.nodePositions"
        :highlight-mode="treeStore.highlightMode"
        :highlighted-nodes="treeStore.highlightedNodes"
        :is-node-highlighted="treeStore.isNodeHighlighted"
        :is-node-dimmed="treeStore.isNodeDimmed"
        :get-swimlane-start-y="treeStore.getSwimlaneStartY"
        :node-highlight-info="treeStore.nodeHighlightInfo"
        :get-node-highlight-state="treeStore.getNodeHighlightState"
        :get-node-depth="treeStore.getNodeDepth"
        :get-node-connection-type="treeStore.getNodeConnectionType"
        :get-connection-depth="treeStore.getConnectionDepth"
        :is-connection-highlighted="treeStore.isConnectionHighlighted"
        :focus-mode="treeStore.focusMode"
        :focused-node-id="treeStore.focusedNodeId"
        :game-phases="treeStore.gamePhases"
        @node-click="handleNodeClick"
        @edit-click="handleEditClick"
        @background-click="handleBackgroundClick"
        @connection-hover="handleConnectionHover"
        @connection-click="handleConnectionClick"
        @node-hover="handleNodeHover"
      />
    </div>
    
    <!-- Phase 6: Edit Modal Integration -->
    <EditItemModal 
      :show="!!editingNode"
      :item="editingNodeData"
      @save="handleSaveNode"
      @close="handleCloseEdit"
    />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, nextTick, computed } from 'vue'
import { useUpgradeTreeStore } from '@/stores/upgradeTree'
import { useGameDataStore } from '@/stores/gameData'
import type { TreeNode, Connection } from '@/types/upgrade-tree'
import type { GameDataItem } from '@/types/game-data'
import TreeGrid from '@/components/UpgradeTree/TreeGrid.vue'
import EditItemModal from '@/components/GameConfiguration/EditItemModal.vue'

const treeStore = useUpgradeTreeStore()
const gameDataStore = useGameDataStore()

// Phase 6: Edit modal state
const editingNode = ref<TreeNode | null>(null)
const editingNodeData = ref<GameDataItem | null>(null)

// Debug: Track what swimlanes are being passed to TreeGrid
const debugSwimlanes = computed(() => {
  const swimlanes = treeStore.getVisibleSwimlanes()
  if (treeStore.focusMode) {
  }
  return swimlanes
})

// Load data when component mounts
onMounted(async () => {
  await treeStore.loadTreeData()
  
  // Debug: Log some sample data to help troubleshoot
  console.log('Tree loaded with nodes:', treeStore.nodes.length)
  if (treeStore.nodes.length > 0) {
    console.log('Sample node:', treeStore.nodes[0])
  }
  console.log('GameData items loaded:', gameDataStore.items.length)
  if (gameDataStore.items.length > 0) {
    console.log('Sample gameData item:', gameDataStore.items[0])
  }
})

// Handle node body click (enhanced with focus mode)
function handleNodeClick(node: TreeNode, event?: MouseEvent) {
  // Prevent event bubbling to avoid triggering background click handlers
  if (event) {
    event.stopPropagation()
  }
  
  const wasHighlightedBefore = treeStore.highlightMode && treeStore.selectedNodeId === node.id
  
  if (wasHighlightedBefore && !treeStore.focusMode) {
    // Second click on highlighted node: enter focus mode
    treeStore.enterFocusMode(node.id)
  } else if (wasHighlightedBefore && treeStore.focusMode) {
    // Third click on focused node: exit focus mode but stay highlighted
    treeStore.exitFocusMode()
  } else {
    // First click: enter highlight mode
    treeStore.enterHighlightMode(node.id)
  }
}

// Handle edit click from tree nodes
async function handleEditClick(node: TreeNode) {
  console.log('Edit clicked for node:', node.id)
  
  // Find the original item data for editing
  const originalItem = treeStore.findOriginalGameDataItem(node)
  
  if (!originalItem) {
    console.error('Could not find original data for node:', node.id)
    return
  }

  // Set up modal with the original data
  editingNodeData.value = { ...originalItem } // Set data first
  
  // Use nextTick to ensure data is set before showing modal
  nextTick(() => {
    editingNode.value = node // This triggers the modal to show
  })
}

// Handle modal save
async function handleSaveNode(updatedItem: GameDataItem | Record<string, any>) {
  if (!editingNode.value) return
  
  // Ensure we have a GameDataItem (cast if needed)
  const gameItem = updatedItem as GameDataItem
  
  const fileName = treeStore.getSourceFileForNode(editingNode.value)
  
  try {
    // Find the original item and update it in the gameData store
    const originalItem = treeStore.findOriginalGameDataItem(editingNode.value)
    if (!originalItem) {
      throw new Error(`Original item not found for ${editingNode.value.id}`)
    }
    
    // Update the item in the gameData store items array
    const itemIndex = gameDataStore.items.findIndex(item => 
      item.id === originalItem.id && item.sourceFile === originalItem.sourceFile
    )
    
    if (itemIndex === -1) {
      throw new Error(`Item not found in gameData store: ${originalItem.id}`)
    }
    
    // Replace the item with updated data
    gameDataStore.items[itemIndex] = { ...gameItem }
    
    // Close modal
    handleCloseEdit()
    
    // Reload tree data to reflect changes
    await treeStore.reloadAfterEdit()
    
    console.log('✅ Node updated successfully:', gameItem.id)
    
  } catch (error) {
    console.error('❌ Failed to save node changes:', error)
    // TODO: Add user-facing error notification
    alert(`Failed to save changes: ${error}`)
  }
}

// Handle modal close/cancel
function handleCloseEdit() {
  editingNode.value = null
  editingNodeData.value = null
}

// Debug function to test data availability
function debugData() {
  console.log('=== DEBUG DATA ===')
  console.log('GameData items:', gameDataStore.items.length)
  console.log('Tree nodes:', treeStore.nodes.length)
  
  if (gameDataStore.items.length > 0) {
    console.log('Sample gameData item:', gameDataStore.items[0])
  }
  
  if (treeStore.nodes.length > 0) {
    console.log('Sample tree node:', treeStore.nodes[0])
    
    // Test the mapping for first node
    const firstNode = treeStore.nodes[0]
    const sourceFile = treeStore.getSourceFileForNode(firstNode)
    const foundItem = gameDataStore.items.find(item => 
      item.id === firstNode.id && item.sourceFile === sourceFile
    )
    console.log('Can find first node in gameData?', foundItem ? 'YES' : 'NO')
    console.log('First node ID:', firstNode.id)
    console.log('Source file:', sourceFile)
    console.log('Found item:', foundItem)
  }
  
  console.log('=== END DEBUG ===')
}

// Handle clicking on background (exit focus mode or highlight mode)
function handleBackgroundClick() {
  if (treeStore.focusMode) {
    treeStore.exitFocusMode()
  } else {
    treeStore.exitHighlightMode()
  }
}

// Handle connection hover (enhanced for store integration)
function handleConnectionHover(connection: Connection, isHovering: boolean) {
  treeStore.handleConnectionHover(isHovering ? connection : null)
}

// Handle connection click for path-based navigation
function handleConnectionClick(connection: Connection) {
  treeStore.handleConnectionClick(connection)
}

// Handle node hover for enhanced feedback
function handleNodeHover(node: TreeNode, isHovering: boolean) {
  // Future: Could add preview highlighting or tooltips
  if (isHovering && !treeStore.highlightMode) {
    // Show subtle preview of what would be highlighted
    console.log(`Preview highlight for ${node.name}`)
  }
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
