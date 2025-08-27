<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-anvil mr-3 text-orange-400"></i>
          Forge System Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure crafting mechanics, heat management, material priorities, and automation.
        </p>
      </div>

      <!-- Crafting Mechanics -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-hammer mr-2"></i>
          Crafting Mechanics
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Crafting Speed"
              :value="forgeParams.craftingMechanics.craftingSpeed"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Multiplier for crafting time"
              path="forge.craftingMechanics.craftingSpeed"
              @update="updateParameter('forge.craftingMechanics.craftingSpeed', $event)"
            />
            
            <ParameterSlider
              label="Success Rate Bonus"
              :value="forgeParams.craftingMechanics.successRateBonus"
              :min="0.0"
              :max="0.5"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Bonus to base crafting success rates"
              path="forge.craftingMechanics.successRateBonus"
              @update="updateParameter('forge.craftingMechanics.successRateBonus', $event)"
            />
            
            <ParameterSlider
              label="Quality Improvement"
              :value="forgeParams.craftingMechanics.qualityImprovement"
              :min="0.0"
              :max="2.0"
              :step="0.1"
              unit="x"
              description="Modifier for item quality outcomes"
              path="forge.craftingMechanics.qualityImprovement"
              @update="updateParameter('forge.craftingMechanics.qualityImprovement', $event)"
            />
            
            <ParameterSlider
              label="Material Efficiency"
              :value="forgeParams.craftingMechanics.materialEfficiency"
              :min="0.5"
              :max="2.0"
              :step="0.05"
              unit="x"
              description="Material usage modifier (lower = less materials)"
              path="forge.craftingMechanics.materialEfficiency"
              @update="updateParameter('forge.craftingMechanics.materialEfficiency', $event)"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Auto-Select Materials"
              :value="forgeParams.craftingMechanics.autoSelectMaterials"
              description="Automatically choose optimal materials for recipes"
              path="forge.craftingMechanics.autoSelectMaterials"
              @update="updateParameter('forge.craftingMechanics.autoSelectMaterials', $event)"
            />
            
            <ParameterToggle
              label="Batch Crafting"
              :value="forgeParams.craftingMechanics.batchCrafting"
              description="Enable crafting multiple items at once when possible"
              path="forge.craftingMechanics.batchCrafting"
              @update="updateParameter('forge.craftingMechanics.batchCrafting', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Heat Management -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-fire mr-2"></i>
          Heat Management
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Heat Gain Multiplier"
              :value="forgeParams.heatManagement.heatGainMultiplier"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Rate at which heat builds up during crafting"
              path="forge.heatManagement.heatGainMultiplier"
              @update="updateParameter('forge.heatManagement.heatGainMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Heat Loss Rate"
              :value="forgeParams.heatManagement.heatLossRate"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Rate at which heat dissipates when idle"
              path="forge.heatManagement.heatLossRate"
              @update="updateParameter('forge.heatManagement.heatLossRate', $event)"
            />
            
            <ParameterSlider
              label="Optimal Heat Range"
              :value="forgeParams.heatManagement.optimalHeatRange"
              :min="0.1"
              :max="0.8"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Heat level range for optimal crafting"
              path="forge.heatManagement.optimalHeatRange"
              @update="updateParameter('forge.heatManagement.optimalHeatRange', $event)"
            />
            
            <ParameterSlider
              label="Max Heat Threshold"
              :value="forgeParams.heatManagement.maxHeatThreshold"
              :min="0.7"
              :max="1.0"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Heat level that requires cooling before crafting"
              path="forge.heatManagement.maxHeatThreshold"
              @update="updateParameter('forge.heatManagement.maxHeatThreshold', $event)"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <ParameterSelect
              label="Heat Strategy"
              :value="forgeParams.heatManagement.heatStrategy"
              :options="[
                { value: 'optimal', label: 'Maintain Optimal' },
                { value: 'maxEfficiency', label: 'Max Efficiency' },
                { value: 'conservative', label: 'Conservative' },
                { value: 'aggressive', label: 'Aggressive' }
              ]"
              description="How to manage forge heat levels"
              path="forge.heatManagement.heatStrategy"
              @update="updateParameter('forge.heatManagement.heatStrategy', $event)"
            />
            
            <ParameterToggle
              label="Auto Cooling"
              :value="forgeParams.heatManagement.autoCooling"
              description="Automatically cool forge when overheated"
              path="forge.heatManagement.autoCooling"
              @update="updateParameter('forge.heatManagement.autoCooling', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Recipe Selection -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-scroll mr-2"></i>
          Recipe Selection & Priorities
        </div>
        <div class="card-body space-y-4">
          <!-- Selection Strategy -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSelect
              label="Recipe Strategy"
              :value="forgeParams.recipeSelection.strategy"
              :options="[
                { value: 'profit', label: 'Maximum Profit' },
                { value: 'materials', label: 'Use Available Materials' },
                { value: 'upgrades', label: 'Equipment Upgrades' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'scripted', label: 'Scripted Order' }
              ]"
              description="How to choose which items to craft"
              path="forge.recipeSelection.strategy"
              @update="updateParameter('forge.recipeSelection.strategy', $event)"
            />
            
            <ParameterSelect
              label="Upgrade Priority"
              :value="forgeParams.recipeSelection.upgradePriority"
              :options="[
                { value: 'weapons', label: 'Weapons First' },
                { value: 'armor', label: 'Armor First' },
                { value: 'tools', label: 'Tools First' },
                { value: 'balanced', label: 'Balanced' }
              ]"
              description="Priority order for crafting upgrades"
              path="forge.recipeSelection.upgradePriority"
              @update="updateParameter('forge.recipeSelection.upgradePriority', $event)"
            />
          </div>

          <!-- Priority Factors -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Recipe Priority Factors</h4>
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Profit Weight"
                :value="forgeParams.recipeSelection.priorityFactors.profit"
                :min="0.0"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Importance of gold value in recipe selection"
                path="forge.recipeSelection.priorityFactors.profit"
                @update="updateParameter('forge.recipeSelection.priorityFactors.profit', $event)"
              />
              
              <ParameterSlider
                label="Material Availability"
                :value="forgeParams.recipeSelection.priorityFactors.materialAvailability"
                :min="0.0"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Importance of having required materials"
                path="forge.recipeSelection.priorityFactors.materialAvailability"
                @update="updateParameter('forge.recipeSelection.priorityFactors.materialAvailability', $event)"
              />
              
              <ParameterSlider
                label="Equipment Need"
                :value="forgeParams.recipeSelection.priorityFactors.equipmentNeed"
                :min="0.0"
                :max="5.0"
                :step="0.1"
                unit="x"
                description="Importance of crafting needed equipment upgrades"
                path="forge.recipeSelection.priorityFactors.equipmentNeed"
                @update="updateParameter('forge.recipeSelection.priorityFactors.equipmentNeed', $event)"
              />
              
              <ParameterSlider
                label="Crafting Speed"
                :value="forgeParams.recipeSelection.priorityFactors.craftingTime"
                :min="0.0"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Preference for faster crafting recipes"
                path="forge.recipeSelection.priorityFactors.craftingTime"
                @update="updateParameter('forge.recipeSelection.priorityFactors.craftingTime', $event)"
              />
            </div>
          </div>

          <!-- Material Management -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Material Management</h4>
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Material Reserve"
                :value="forgeParams.recipeSelection.materialReserve"
                :min="0.0"
                :max="0.5"
                :step="0.05"
                unit="%"
                :display-multiplier="100"
                description="Percentage of materials to keep in reserve"
                path="forge.recipeSelection.materialReserve"
                @update="updateParameter('forge.recipeSelection.materialReserve', $event)"
              />
              
              <ParameterToggle
                label="Use Rare Materials"
                :value="forgeParams.recipeSelection.useRareMaterials"
                description="Allow using rare materials for crafting"
                path="forge.recipeSelection.useRareMaterials"
                @update="updateParameter('forge.recipeSelection.useRareMaterials', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Automation Settings -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-cogs mr-2"></i>
          Automation & Efficiency
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Auto-Craft Equipment"
              :value="forgeParams.automation.autoCraftEquipment"
              description="Automatically craft equipment upgrades when materials available"
              path="forge.automation.autoCraftEquipment"
              @update="updateParameter('forge.automation.autoCraftEquipment', $event)"
            />
            
            <ParameterToggle
              label="Auto-Repair Items"
              :value="forgeParams.automation.autoRepairItems"
              description="Automatically repair damaged equipment"
              path="forge.automation.autoRepairItems"
              @update="updateParameter('forge.automation.autoRepairItems', $event)"
            />
            
            <ParameterToggle
              label="Queue Management"
              :value="forgeParams.automation.queueManagement"
              description="Automatically manage crafting queue priorities"
              path="forge.automation.queueManagement"
              @update="updateParameter('forge.automation.queueManagement', $event)"
            />
            
            <ParameterToggle
              label="Material Optimization"
              :value="forgeParams.automation.materialOptimization"
              description="Optimize material usage across multiple recipes"
              path="forge.automation.materialOptimization"
              @update="updateParameter('forge.automation.materialOptimization', $event)"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Queue Size"
              :value="forgeParams.automation.queueSize"
              :min="1"
              :max="20"
              :step="1"
              unit=" items"
              description="Maximum number of items in crafting queue"
              path="forge.automation.queueSize"
              @update="updateParameter('forge.automation.queueSize', $event)"
            />
            
            <ParameterSlider
              label="Efficiency Threshold"
              :value="forgeParams.automation.efficiencyThreshold"
              :min="0.5"
              :max="1.0"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Minimum efficiency required before crafting"
              path="forge.automation.efficiencyThreshold"
              @update="updateParameter('forge.automation.efficiencyThreshold', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useParameterStore } from '@/stores/parameters'
import ParameterSlider from '../parameters/shared/ParameterSlider.vue'
import ParameterToggle from '../parameters/shared/ParameterToggle.vue'
import ParameterSelect from '../parameters/shared/ParameterSelect.vue'

const parameterStore = useParameterStore()

const forgeParams = computed(() => parameterStore.effectiveParameters.forge)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}
</script>
