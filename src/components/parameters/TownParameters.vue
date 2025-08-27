<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-building mr-3 text-yellow-400"></i>
          Town System Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure purchasing behavior, vendor priorities, blueprint strategy, and material trading.
        </p>
      </div>

      <!-- Purchasing Behavior -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-shopping-cart mr-2"></i>
          Purchasing Behavior
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Gold Reserve"
              :value="townParams.purchasingBehavior.goldReserve"
              :min="0"
              :max="1000"
              :step="10"
              unit=" gold"
              description="Minimum gold to keep in reserve"
              path="town.purchasingBehavior.goldReserve"
              @update="updateParameter('town.purchasingBehavior.goldReserve', $event)"
            />
            
            <ParameterSlider
              label="Buy Threshold"
              :value="townParams.purchasingBehavior.buyThreshold"
              :min="1.0"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Buy when gold ≥ (item cost × threshold)"
              path="town.purchasingBehavior.buyThreshold"
              @update="updateParameter('town.purchasingBehavior.buyThreshold', $event)"
            />
          </div>

          <ParameterToggle
            label="Skip Expensive Items"
            :value="townParams.purchasingBehavior.skipExpensive"
            description="Skip items that cost more than 50% of current gold"
            path="town.purchasingBehavior.skipExpensive"
            @update="updateParameter('town.purchasingBehavior.skipExpensive', $event)"
          />

          <!-- Vendor Priorities -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Vendor Priority Weights</h4>
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Blacksmith"
                :value="townParams.purchasingBehavior.vendorPriorities.blacksmith"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Priority for tools and weapons"
                path="town.purchasingBehavior.vendorPriorities.blacksmith"
                @update="updateParameter('town.purchasingBehavior.vendorPriorities.blacksmith', $event)"
              />
              
              <ParameterSlider
                label="Agronomist"
                :value="townParams.purchasingBehavior.vendorPriorities.agronomist"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Priority for farm upgrades"
                path="town.purchasingBehavior.vendorPriorities.agronomist"
                @update="updateParameter('town.purchasingBehavior.vendorPriorities.agronomist', $event)"
              />
              
              <ParameterSlider
                label="Land Steward"
                :value="townParams.purchasingBehavior.vendorPriorities.landSteward"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Priority for land deeds"
                path="town.purchasingBehavior.vendorPriorities.landSteward"
                @update="updateParameter('town.purchasingBehavior.vendorPriorities.landSteward', $event)"
              />
              
              <ParameterSlider
                label="Carpenter"
                :value="townParams.purchasingBehavior.vendorPriorities.carpenter"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Priority for tower upgrades"
                path="town.purchasingBehavior.vendorPriorities.carpenter"
                @update="updateParameter('town.purchasingBehavior.vendorPriorities.carpenter', $event)"
              />
              
              <ParameterSlider
                label="Skills Trainer"
                :value="townParams.purchasingBehavior.vendorPriorities.skillsTrainer"
                :min="0.1"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Priority for skill training"
                path="town.purchasingBehavior.vendorPriorities.skillsTrainer"
                @update="updateParameter('town.purchasingBehavior.vendorPriorities.skillsTrainer', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Blueprint Strategy -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-blueprint mr-2"></i>
          Blueprint Management
        </div>
        <div class="card-body space-y-4">
          <!-- Strategy Toggles -->
          <div class="grid grid-cols-3 gap-4">
            <ParameterToggle
              label="Buy Ahead of Time"
              :value="townParams.blueprintStrategy.buyAheadOfTime"
              description="Purchase blueprints before materials are available"
              path="town.blueprintStrategy.buyAheadOfTime"
              @update="updateParameter('town.blueprintStrategy.buyAheadOfTime', $event)"
            />
            
            <ParameterToggle
              label="Only When Ready"
              :value="townParams.blueprintStrategy.onlyBuyWhenReady"
              description="Only buy blueprints when you can craft immediately"
              path="town.blueprintStrategy.onlyBuyWhenReady"
              @update="updateParameter('town.blueprintStrategy.onlyBuyWhenReady', $event)"
            />
            
            <ParameterToggle
              label="Stockpile Blueprints"
              :value="townParams.blueprintStrategy.stockpileBlueprints"
              description="Buy all available blueprints regardless of need"
              path="town.blueprintStrategy.stockpileBlueprints"
              @update="updateParameter('town.blueprintStrategy.stockpileBlueprints', $event)"
            />
          </div>

          <!-- Priority Lists -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium mb-2">Tool Purchase Priority</label>
              <div class="p-3 bg-sim-surface border border-sim-border rounded-lg">
                <p class="text-xs text-sim-muted mb-2">Order in which to buy tool blueprints (most important first)</p>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="(tool, index) in townParams.blueprintStrategy.toolPriorities" 
                    :key="index"
                    class="px-2 py-1 bg-sim-primary/20 border border-sim-primary/30 rounded text-xs"
                  >
                    {{ index + 1 }}. {{ tool }}
                  </span>
                  <span v-if="townParams.blueprintStrategy.toolPriorities.length === 0" class="text-sim-muted text-xs">
                    No priority order set (will use default)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium mb-2">Weapon Purchase Priority</label>
              <div class="p-3 bg-sim-surface border border-sim-border rounded-lg">
                <p class="text-xs text-sim-muted mb-2">Order in which to buy weapon blueprints</p>
                <div class="flex flex-wrap gap-2">
                  <span 
                    v-for="(weapon, index) in townParams.blueprintStrategy.weaponPriorities" 
                    :key="index"
                    class="px-2 py-1 bg-sim-primary/20 border border-sim-primary/30 rounded text-xs"
                  >
                    {{ index + 1 }}. {{ weapon }}
                  </span>
                  <span v-if="townParams.blueprintStrategy.weaponPriorities.length === 0" class="text-sim-muted text-xs">
                    No priority order set (will use default)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Skill Training -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-graduation-cap mr-2"></i>
          Skill Training
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Carry Capacity Target"
              :value="townParams.skillTraining.carryCapacityTarget"
              :min="1"
              :max="20"
              :step="1"
              unit=" level"
              description="Target level for carry capacity skill"
              path="town.skillTraining.carryCapacityTarget"
              @update="updateParameter('town.skillTraining.carryCapacityTarget', $event)"
            />
            
            <ParameterSlider
              label="Training Energy Reserve"
              :value="townParams.skillTraining.trainingEnergyReserve"
              :min="0"
              :max="50"
              :step="5"
              unit=" energy"
              description="Keep this much energy in reserve for training"
              path="town.skillTraining.trainingEnergyReserve"
              @update="updateParameter('town.skillTraining.trainingEnergyReserve', $event)"
            />
            
            <ParameterSlider
              label="Max Skill Level"
              :value="townParams.skillTraining.maxSkillLevel"
              :min="1"
              :max="50"
              :step="1"
              unit=" level"
              description="Maximum level to train any skill"
              path="town.skillTraining.maxSkillLevel"
              @update="updateParameter('town.skillTraining.maxSkillLevel', $event)"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Skill Training Priority</label>
            <div class="p-3 bg-sim-surface border border-sim-border rounded-lg">
              <p class="text-xs text-sim-muted mb-2">Order in which to train skills</p>
              <div class="flex flex-wrap gap-2">
                <span 
                  v-for="(skill, index) in townParams.skillTraining.skillPriorities" 
                  :key="index"
                  class="px-2 py-1 bg-sim-primary/20 border border-sim-primary/30 rounded text-xs"
                >
                  {{ index + 1 }}. {{ skill }}
                </span>
                <span v-if="townParams.skillTraining.skillPriorities.length === 0" class="text-sim-muted text-xs">
                  No priority order set (will train carry capacity first)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Material Trading -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-exchange-alt mr-2"></i>
          Material Trading
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Enable Trading"
              :value="townParams.materialTrading.enableTrading"
              description="Use the material trader when available"
              path="town.materialTrading.enableTrading"
              @update="updateParameter('town.materialTrading.enableTrading', $event)"
            />
            
            <ParameterToggle
              label="Emergency Buying"
              :value="townParams.materialTrading.emergencyBuying"
              description="Buy materials when needed for crafting"
              path="town.materialTrading.emergencyBuying"
              @update="updateParameter('town.materialTrading.emergencyBuying', $event)"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Trade Threshold"
              :value="townParams.materialTrading.tradeThreshold"
              :min="10"
              :max="200"
              :step="10"
              unit=" items"
              description="Trade materials when inventory exceeds this amount"
              path="town.materialTrading.tradeThreshold"
              @update="updateParameter('town.materialTrading.tradeThreshold', $event)"
            />
            
            <ParameterSlider
              label="Wood Buying Threshold"
              :value="townParams.materialTrading.woodBuyingThreshold"
              :min="0"
              :max="50"
              :step="5"
              unit=" bundles"
              description="Buy wood bundles when inventory falls below this"
              path="town.materialTrading.woodBuyingThreshold"
              @update="updateParameter('town.materialTrading.woodBuyingThreshold', $event)"
            />
          </div>

          <!-- Trading Information -->
          <div class="p-4 bg-sim-primary/10 border border-sim-primary/30 rounded-lg">
            <div class="flex items-center mb-2">
              <i class="fas fa-info-circle text-sim-primary mr-2"></i>
              <span class="text-sim-primary font-medium text-sm">Trading Behavior</span>
            </div>
            <ul class="text-xs text-sim-muted space-y-1">
              <li>• Material trader becomes available in mid-game</li>
              <li>• Trade excess materials for gold or needed materials</li>
              <li>• Emergency buying prevents crafting bottlenecks</li>
              <li>• Wood bundles provide quick construction materials</li>
            </ul>
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

const townParams = computed(() => parameterStore.effectiveParameters.town)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}
</script>
