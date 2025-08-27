<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-mountain mr-3 text-gray-400"></i>
          Mine System Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure mining mechanics, depth strategy, energy management, and material collection.
        </p>
      </div>

      <!-- Mining Mechanics -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-hammer mr-2"></i>
          Mining Mechanics
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Energy Drain Base"
              :value="mineParams.miningMechanics.energyDrainBase"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Base energy consumption rate while mining"
              path="mine.miningMechanics.energyDrainBase"
              @update="updateParameter('mine.miningMechanics.energyDrainBase', $event)"
            />
            
            <ParameterSlider
              label="Energy Drain Exponent"
              :value="mineParams.miningMechanics.energyDrainExponent"
              :min="1.0"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="How energy drain increases with depth"
              path="mine.miningMechanics.energyDrainExponent"
              @update="updateParameter('mine.miningMechanics.energyDrainExponent', $event)"
            />
            
            <ParameterSlider
              label="Depth Speed Multiplier"
              :value="mineParams.miningMechanics.depthSpeed"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Speed of descending through mine levels"
              path="mine.miningMechanics.depthSpeed"
              @update="updateParameter('mine.miningMechanics.depthSpeed', $event)"
            />
            
            <ParameterSlider
              label="Material Drop Rate"
              :value="mineParams.miningMechanics.materialDropRate"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Frequency of material drops while mining"
              path="mine.miningMechanics.materialDropRate"
              @update="updateParameter('mine.miningMechanics.materialDropRate', $event)"
            />
            
            <ParameterSlider
              label="Material Quantity Multiplier"
              :value="mineParams.miningMechanics.materialQuantityMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Amount of materials found per drop"
              path="mine.miningMechanics.materialQuantityMultiplier"
              @update="updateParameter('mine.miningMechanics.materialQuantityMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Rare Material Chance"
              :value="mineParams.miningMechanics.rareMaterialChance"
              :min="0.0"
              :max="1.0"
              :step="0.05"
              unit="%"
              :displayMultiplier="100"
              description="Chance to find rare materials"
              path="mine.miningMechanics.rareMaterialChance"
              @update="updateParameter('mine.miningMechanics.rareMaterialChance', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Depth Management -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-layer-group mr-2"></i>
          Depth Management
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Maximum Depth"
              :value="mineParams.depthManagement.maxDepth"
              :min="100"
              :max="2000"
              :step="50"
              unit=" levels"
              description="Maximum mining depth to attempt"
              path="mine.depthManagement.maxDepth"
              @update="updateParameter('mine.depthManagement.maxDepth', $event)"
            />
            
            <ParameterSlider
              label="Auto Return Threshold"
              :value="mineParams.depthManagement.autoReturnThreshold"
              :min="0.0"
              :max="0.5"
              :step="0.05"
              unit="%"
              :displayMultiplier="100"
              description="Energy level to automatically return to surface"
              path="mine.depthManagement.autoReturnThreshold"
              @update="updateParameter('mine.depthManagement.autoReturnThreshold', $event)"
            />
          </div>
          
          <div class="grid grid-cols-1 gap-4">
            <ParameterSelect
              label="Depth Strategy"
              :value="mineParams.depthManagement.depthStrategy"
              :options="[
                { value: 'shallow', label: 'Shallow (Safe & Efficient)' },
                { value: 'efficient', label: 'Efficient (Balanced)' },
                { value: 'deep', label: 'Deep (High Risk/Reward)' },
                { value: 'custom', label: 'Custom Target Depths' }
              ]"
              description="Strategy for selecting mining depths"
              path="mine.depthManagement.depthStrategy"
              @update="updateParameter('mine.depthManagement.depthStrategy', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Tool Sharpening -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-tools mr-2"></i>
          Tool Sharpening
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Sharpen Duration"
              :value="mineParams.toolSharpening.sharpenDurationMinutes"
              :min="1"
              :max="30"
              :step="1"
              unit=" min"
              description="Time required to sharpen pickaxe"
              path="mine.toolSharpening.sharpenDurationMinutes"
              @update="updateParameter('mine.toolSharpening.sharpenDurationMinutes', $event)"
            />
            
            <ParameterSlider
              label="Sharpen Efficiency Bonus"
              :value="mineParams.toolSharpening.sharpenBonus"
              :min="1.0"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Mining efficiency bonus when pickaxe is sharp"
              path="mine.toolSharpening.sharpenBonus"
              @update="updateParameter('mine.toolSharpening.sharpenBonus', $event)"
            />
            
            <ParameterSlider
              label="Auto Sharpen Threshold"
              :value="mineParams.toolSharpening.autoSharpenThreshold"
              :min="0.0"
              :max="1.0"
              :step="0.05"
              unit="%"
              :displayMultiplier="100"
              description="Sharpness level to trigger automatic sharpening"
              path="mine.toolSharpening.autoSharpenThreshold"
              @update="updateParameter('mine.toolSharpening.autoSharpenThreshold', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Pickaxe Efficiency -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-pickaxe mr-2"></i>
          Pickaxe Upgrades & Efficiency
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <ParameterSelect
              label="Upgrade Strategy"
              :value="mineParams.pickaxeEfficiency.upgradeStrategy"
              :options="[
                { value: 'asap', label: 'As Soon As Possible' },
                { value: 'efficient', label: 'Cost Efficient' },
                { value: 'conservative', label: 'Conservative (High Reserves)' }
              ]"
              description="When to purchase pickaxe upgrades"
              path="mine.pickaxeEfficiency.upgradeStrategy"
              @update="updateParameter('mine.pickaxeEfficiency.upgradeStrategy', $event)"
            />
          </div>
          
          <div class="space-y-3">
            <h4 class="font-medium text-sim-text">Pickaxe Tier Bonuses</h4>
            <p class="text-sm text-sim-muted">Configure efficiency bonuses per pickaxe tier (0-4)</p>
            
            <div class="grid grid-cols-3 gap-4">
              <div>
                <label class="block text-sm font-medium mb-2">Energy Reduction</label>
                <div class="space-y-2">
                  <div v-for="(value, index) in mineParams.pickaxeEfficiency.energyReduction" :key="`energy-${index}`" class="flex items-center space-x-2">
                    <span class="text-sm w-12">Tier {{ index }}:</span>
                    <ParameterSlider
                      :label="`Tier ${index}`"
                      :value="value"
                      :min="0.0"
                      :max="0.8"
                      :step="0.05"
                      unit="%"
                      :displayMultiplier="100"
                      class="flex-1"
                      @update="updateArrayParameter('mine.pickaxeEfficiency.energyReduction', index, $event)"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Material Bonus</label>
                <div class="space-y-2">
                  <div v-for="(value, index) in mineParams.pickaxeEfficiency.materialBonus" :key="`material-${index}`" class="flex items-center space-x-2">
                    <span class="text-sm w-12">Tier {{ index }}:</span>
                    <ParameterSlider
                      :label="`Tier ${index}`"
                      :value="value"
                      :min="0.0"
                      :max="1.0"
                      :step="0.05"
                      unit="%"
                      :displayMultiplier="100"
                      class="flex-1"
                      @update="updateArrayParameter('mine.pickaxeEfficiency.materialBonus', index, $event)"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label class="block text-sm font-medium mb-2">Depth Speed Bonus</label>
                <div class="space-y-2">
                  <div v-for="(value, index) in mineParams.pickaxeEfficiency.depthSpeedBonus" :key="`speed-${index}`" class="flex items-center space-x-2">
                    <span class="text-sm w-12">Tier {{ index }}:</span>
                    <ParameterSlider
                      :label="`Tier ${index}`"
                      :value="value"
                      :min="0.0"
                      :max="1.0"
                      :step="0.05"
                      unit="%"
                      :displayMultiplier="100"
                      class="flex-1"
                      @update="updateArrayParameter('mine.pickaxeEfficiency.depthSpeedBonus', index, $event)"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Decision Logic -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-brain mr-2"></i>
          Mining Decision Logic
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Mining Frequency"
              :value="mineParams.decisionLogic.miningFrequency"
              :min="1"
              :max="10"
              :step="1"
              unit=" times/day"
              description="How often to check and visit the mine"
              path="mine.decisionLogic.miningFrequency"
              @update="updateParameter('mine.decisionLogic.miningFrequency', $event)"
            />
            
            <ParameterSlider
              label="Minimum Energy Required"
              :value="mineParams.decisionLogic.minEnergyRequired"
              :min="10"
              :max="100"
              :step="5"
              unit=" energy"
              description="Minimum energy to start a mining session"
              path="mine.decisionLogic.minEnergyRequired"
              @update="updateParameter('mine.decisionLogic.minEnergyRequired', $event)"
            />
            
            <ParameterSlider
              label="Session Duration"
              :value="mineParams.decisionLogic.sessionDuration"
              :min="1"
              :max="30"
              :step="1"
              unit=" min"
              description="How long to mine in each session"
              path="mine.decisionLogic.sessionDuration"
              @update="updateParameter('mine.decisionLogic.sessionDuration', $event)"
            />
            
            <ParameterSlider
              label="Depth vs Efficiency Balance"
              :value="mineParams.decisionLogic.depthVsEfficiency"
              :min="0.0"
              :max="1.0"
              :step="0.05"
              description="0=efficiency focused, 1=depth focused"
              path="mine.decisionLogic.depthVsEfficiency"
              @update="updateParameter('mine.decisionLogic.depthVsEfficiency', $event)"
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

const mineParams = computed(() => parameterStore.effectiveParameters.mine)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}

function updateArrayParameter(basePath: string, index: number, value: any) {
  const fullPath = `${basePath}[${index}]`
  parameterStore.applyOverride(fullPath, value)
}
</script>
