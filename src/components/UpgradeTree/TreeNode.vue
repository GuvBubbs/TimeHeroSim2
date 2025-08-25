<template>
  <div 
    class="tree-node"
    :class="{ 
      highlighted: highlighted,
      dimmed: dimmed 
    }"
    :style="nodeStyle"
    @click="$emit('node-click')"
  >
    <!-- Icon on left -->
    <div class="node-icon">
      <i :class="node.icon || 'fa fa-cube'"></i>
    </div>
    
    <!-- Title in middle -->
    <div class="node-title">
      {{ node.name }}
    </div>
    
    <!-- Material costs (if any) -->
    <div class="node-materials" v-if="hasMaterials">
      <span 
        v-for="(amount, material) in node.cost.materials" 
        :key="material"
        class="material-cost"
        :title="`${material}: ${amount}`"
      >
        <i :class="getMaterialIcon(material)"></i>
        <span class="material-amount">{{ amount }}</span>
      </span>
    </div>
    
    <!-- Edit button on right -->
    <button 
      class="node-edit-btn"
      @click.stop="$emit('edit-click')"
      title="Edit"
    >
      <i class="fa fa-edit"></i>
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TreeNode } from '@/types/upgrade-tree'

interface Props {
  node: TreeNode
  highlighted: boolean
  dimmed: boolean
  swimlaneColor: string
}

const props = defineProps<Props>()

defineEmits<{
  'node-click': []
  'edit-click': []
}>()

// Compute node border color based on swimlane
const nodeStyle = computed(() => ({
  '--node-color': props.swimlaneColor,
  borderColor: props.highlighted ? '#fbbf24' : props.swimlaneColor
}))

// Check if node has material costs
const hasMaterials = computed(() => {
  return props.node.cost.materials && 
         Object.keys(props.node.cost.materials).length > 0
})

// Map materials to Font Awesome icons
function getMaterialIcon(material: string): string {
  const iconMap: Record<string, string> = {
    'Wood': 'fa fa-tree',
    'Stone': 'fa fa-cube',
    'Iron': 'fa fa-hammer',
    'Copper': 'fa fa-coins',
    'Silver': 'fa fa-gem',
    'Gold': 'fa fa-coins',
    'Crystal': 'fa fa-diamond',
    'Mythril': 'fa fa-star',
    'Obsidian': 'fa fa-circle'
  }
  return iconMap[material] || 'fa fa-box'
}
</script>

<style scoped>
.tree-node {
  background: rgba(0, 0, 0, 0.6); /* Dark background */
  border: 2px solid var(--node-color);
  border-radius: 0.5rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
  display: grid;
  grid-template-columns: 24px 1fr auto 24px;
  align-items: center;
  gap: 0.5rem;
  height: 40px;
  width: 180px;
  position: relative;
  color: white;
}

.node-icon {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--node-color);
  font-size: 14px;
}

.node-title {
  font-size: 0.875rem;
  font-weight: 500;
  text-align: center;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: white;
}

.node-materials {
  display: flex;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.material-cost {
  display: flex;
  align-items: center;
  gap: 2px;
  color: rgba(255, 255, 255, 0.7);
}

.material-cost i {
  font-size: 10px;
}

.material-amount {
  font-size: 10px;
}

.node-edit-btn {
  width: 24px;
  height: 24px;
  border-radius: 0.25rem;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.node-edit-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  border-color: rgba(255, 255, 255, 0.3);
}

.tree-node:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  border-width: 3px;
}

.tree-node.highlighted {
  border-color: #fbbf24 !important;
  box-shadow: 0 0 20px rgba(251, 191, 36, 0.6);
  z-index: 10;
}

.tree-node.dimmed {
  opacity: 0.3;
}
</style>
