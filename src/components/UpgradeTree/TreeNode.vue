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
  grid-template-columns: 24px 1fr 24px;
  align-items: center;
  gap: 0.5rem;
  height: 36px;
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
