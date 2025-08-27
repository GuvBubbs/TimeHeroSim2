<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-seedling mr-3 text-green-400"></i>
          Farm System Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure crop growth, water management, automation behavior, and land expansion settings.
        </p>
      </div>

      <!-- Initial State -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-play-circle mr-2"></i>
          Initial State
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Starting Plots"
              :value="farmParams.initialState.plots"
              :min="1"
              :max="10"
              :step="1"
              description="Number of farm plots available at start"
              path="farm.initialState.plots"
              @update="updateParameter('farm.initialState.plots', $event)"
            />
            
            <ParameterSlider
              label="Starting Water"
              :value="farmParams.initialState.water"
              :min="0"
              :max="100"
              :step="5"
              description="Initial water amount"
              path="farm.initialState.water"
              @update="updateParameter('farm.initialState.water', $event)"
            />
            
            <ParameterSlider
              label="Starting Energy"
              :value="farmParams.initialState.energy"
              :min="10"
              :max="100"
              :step="5"
              description="Initial energy amount"
              path="farm.initialState.energy"
              @update="updateParameter('farm.initialState.energy', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Crop Mechanics -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-leaf mr-2"></i>
          Crop Growth Mechanics
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Growth Speed Multiplier"
              :value="farmParams.cropMechanics.growthTimeMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Multiplier for crop growth time (lower = faster)"
              @update="updateParameter('farm.cropMechanics.growthTimeMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Water Consumption Rate"
              :value="farmParams.cropMechanics.waterConsumptionRate"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Water usage multiplier per plot"
              @update="updateParameter('farm.cropMechanics.waterConsumptionRate', $event)"
            />
            
            <ParameterSlider
              label="Wither Chance"
              :value="farmParams.cropMechanics.witheredCropChance"
              :min="0"
              :max="0.5"
              :step="0.01"
              unit="%"
              :display-multiplier="100"
              description="Chance crops die without water"
              @update="updateParameter('farm.cropMechanics.witheredCropChance', $event)"
            />
            
            <ParameterSlider
              label="Harvest Window"
              :value="farmParams.cropMechanics.harvestWindowMinutes"
              :min="5"
              :max="120"
              :step="5"
              unit="min"
              description="Time before crops wither after ready"
              @update="updateParameter('farm.cropMechanics.harvestWindowMinutes', $event)"
            />
            
            <ParameterSlider
              label="Energy Conversion Efficiency"
              :value="farmParams.cropMechanics.energyConversionEfficiency"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Energy gained from crops multiplier"
              @update="updateParameter('farm.cropMechanics.energyConversionEfficiency', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Water System -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-tint mr-2"></i>
          Water Management
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Pump Efficiency"
              :value="farmParams.waterSystem.pumpEfficiency"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Water gained per pump action multiplier"
              @update="updateParameter('farm.waterSystem.pumpEfficiency', $event)"
            />
            
            <ParameterSlider
              label="Auto-Pump Threshold"
              :value="farmParams.waterSystem.autoPumpThreshold"
              :min="0.1"
              :max="0.8"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Water level to trigger auto-pumping"
              @update="updateParameter('farm.waterSystem.autoPumpThreshold', $event)"
            />
            
            <ParameterSlider
              label="Evaporation Rate"
              :value="farmParams.waterSystem.evaporationRate"
              :min="0"
              :max="2"
              :step="0.1"
              unit="/hr"
              description="Water lost per hour (0 = no evaporation)"
              @update="updateParameter('farm.waterSystem.evaporationRate', $event)"
            />
            
            <ParameterSlider
              label="Rain Chance"
              :value="farmParams.waterSystem.rainChance"
              :min="0"
              :max="0.2"
              :step="0.01"
              unit="%"
              :display-multiplier="100"
              description="Random rain event probability"
              @update="updateParameter('farm.waterSystem.rainChance', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Automation -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-robot mr-2"></i>
          Automation Behavior
        </div>
        <div class="card-body space-y-4">
          <!-- Toggle Options -->
          <div class="grid grid-cols-3 gap-4">
            <ParameterToggle
              label="Auto-Plant"
              :value="farmParams.automation.autoPlant"
              description="Automatically plant seeds when plots are empty"
              @update="updateParameter('farm.automation.autoPlant', $event)"
            />
            
            <ParameterToggle
              label="Auto-Water"
              :value="farmParams.automation.autoWater"
              description="Automatically water crops when needed"
              @update="updateParameter('farm.automation.autoWater', $event)"
            />
            
            <ParameterToggle
              label="Auto-Harvest"
              :value="farmParams.automation.autoHarvest"
              description="Automatically harvest ready crops"
              @update="updateParameter('farm.automation.autoHarvest', $event)"
            />
          </div>

          <!-- Strategy Selection -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSelect
              label="Planting Strategy"
              :value="farmParams.automation.plantingStrategy"
              :options="[
                { value: 'highest-value', label: 'Highest Value' },
                { value: 'fastest-growth', label: 'Fastest Growth' },
                { value: 'balanced', label: 'Balanced' },
                { value: 'diverse', label: 'Diverse Mix' }
              ]"
              description="How to choose which seeds to plant"
              @update="updateParameter('farm.automation.plantingStrategy', $event)"
            />
            
            <ParameterSelect
              label="Harvest Timing"
              :value="farmParams.automation.harvestTiming"
              :options="[
                { value: 'immediate', label: 'Immediate' },
                { value: 'batch', label: 'Batch Process' },
                { value: 'optimal', label: 'Optimal Timing' }
              ]"
              description="When to harvest ready crops"
              @update="updateParameter('farm.automation.harvestTiming', $event)"
            />
          </div>

          <!-- Thresholds -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Watering Threshold"
              :value="farmParams.automation.wateringThreshold"
              :min="0.1"
              :max="0.8"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Water level to trigger auto-watering"
              @update="updateParameter('farm.automation.wateringThreshold', $event)"
            />
          </div>

          <!-- Priority Weights -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Action Priority Weights</h4>
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Planting Priority"
                :value="farmParams.automation.priorityWeights.planting"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Relative priority for planting actions"
                @update="updateParameter('farm.automation.priorityWeights.planting', $event)"
              />
              
              <ParameterSlider
                label="Watering Priority"
                :value="farmParams.automation.priorityWeights.watering"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Relative priority for watering actions"
                @update="updateParameter('farm.automation.priorityWeights.watering', $event)"
              />
              
              <ParameterSlider
                label="Harvesting Priority"
                :value="farmParams.automation.priorityWeights.harvesting"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Relative priority for harvesting actions"
                @update="updateParameter('farm.automation.priorityWeights.harvesting', $event)"
              />
              
              <ParameterSlider
                label="Pumping Priority"
                :value="farmParams.automation.priorityWeights.pumping"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Relative priority for water pumping"
                @update="updateParameter('farm.automation.priorityWeights.pumping', $event)"
              />
              
              <ParameterSlider
                label="Cleanup Priority"
                :value="farmParams.automation.priorityWeights.cleanup"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Relative priority for land cleanup"
                @update="updateParameter('farm.automation.priorityWeights.cleanup', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Land Expansion -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-expand-arrows-alt mr-2"></i>
          Land Expansion
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Cleanup Energy Multiplier"
              :value="farmParams.landExpansion.cleanupEnergyMultiplier"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Energy cost modifier for land cleanup"
              @update="updateParameter('farm.landExpansion.cleanupEnergyMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Cleanup Time Multiplier"
              :value="farmParams.landExpansion.cleanupTimeMultiplier"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Time modifier for land cleanup"
              @update="updateParameter('farm.landExpansion.cleanupTimeMultiplier', $event)"
            />
          </div>
          
          <ParameterToggle
            label="Auto-Cleanup Enabled"
            :value="farmParams.landExpansion.autoCleanupEnabled"
            description="Automatically clean land when resources are available"
            @update="updateParameter('farm.landExpansion.autoCleanupEnabled', $event)"
          />
        </div>
      </div>

      <!-- Helper Efficiency -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-users mr-2"></i>
          Helper Efficiency
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Watering Speed"
              :value="farmParams.helperEfficiency.wateringSpeed"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Helper watering speed multiplier"
              @update="updateParameter('farm.helperEfficiency.wateringSpeed', $event)"
            />
            
            <ParameterSlider
              label="Planting Speed"
              :value="farmParams.helperEfficiency.plantingSpeed"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Helper planting speed multiplier"
              @update="updateParameter('farm.helperEfficiency.plantingSpeed', $event)"
            />
            
            <ParameterSlider
              label="Harvesting Speed"
              :value="farmParams.helperEfficiency.harvestingSpeed"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Helper harvesting speed multiplier"
              @update="updateParameter('farm.helperEfficiency.harvestingSpeed', $event)"
            />
            
            <ParameterSlider
              label="Pumping Bonus"
              :value="farmParams.helperEfficiency.pumpingBonus"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Extra water per pump with helper"
              @update="updateParameter('farm.helperEfficiency.pumpingBonus', $event)"
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
import ParameterSlider from './shared/ParameterSlider.vue'
import ParameterToggle from './shared/ParameterToggle.vue'
import ParameterSelect from './shared/ParameterSelect.vue'

const parameterStore = useParameterStore()

const farmParams = computed(() => parameterStore.effectiveParameters.farm)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}
</script>
