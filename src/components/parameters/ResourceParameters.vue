<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-warehouse mr-3 text-cyan-400"></i>
          Resource Management Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure storage, generation rates, consumption tracking, and exchange systems.
        </p>
      </div>

      <!-- Storage Management -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-boxes mr-2"></i>
          Storage Management
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Energy Storage Buffer"
              :value="resourceParams.storageManagement.energyStorageBuffer"
              :min="0.0"
              :max="0.5"
              :step="0.05"
              unit="%"
              :displayMultiplier="100"
              description="Keep this percentage of energy storage free"
              path="resources.storageManagement.energyStorageBuffer"
              @update="updateParameter('resources.storageManagement.energyStorageBuffer', $event)"
            />
            
            <ParameterSlider
              label="Seed Storage Buffer"
              :value="resourceParams.storageManagement.seedStorageBuffer"
              :min="0.0"
              :max="0.5"
              :step="0.05"
              unit="%"
              :displayMultiplier="100"
              description="Keep this percentage of seed storage free"
              path="resources.storageManagement.seedStorageBuffer"
              @update="updateParameter('resources.storageManagement.seedStorageBuffer', $event)"
            />
            
            <ParameterSlider
              label="Water Storage Buffer"
              :value="resourceParams.storageManagement.waterStorageBuffer"
              :min="0.0"
              :max="0.5"
              :step="0.05"
              unit="%"
              :displayMultiplier="100"
              description="Keep this percentage of water storage free"
              path="resources.storageManagement.waterStorageBuffer"
              @update="updateParameter('resources.storageManagement.waterStorageBuffer', $event)"
            />
          </div>
          
          <div class="grid grid-cols-1 gap-4">
            <ParameterSelect
              label="Overflow Strategy"
              :value="resourceParams.storageManagement.overflowStrategy"
              :options="[
                { value: 'waste', label: 'Waste Excess (Default)' },
                { value: 'stop', label: 'Stop Collection' },
                { value: 'sell', label: 'Auto-Sell Overflow' },
                { value: 'prioritize', label: 'Prioritize by Value' }
              ]"
              description="What to do when storage is full"
              path="resources.storageManagement.overflowStrategy"
              @update="updateParameter('resources.storageManagement.overflowStrategy', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Resource Generation -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-plus-circle mr-2"></i>
          Resource Generation
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Energy Generation Multiplier"
              :value="resourceParams.generation.energyGenerationMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Multiplier for all energy generation"
              path="resources.generation.energyGenerationMultiplier"
              @update="updateParameter('resources.generation.energyGenerationMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Gold Generation Multiplier"
              :value="resourceParams.generation.goldGenerationMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Multiplier for all gold generation"
              path="resources.generation.goldGenerationMultiplier"
              @update="updateParameter('resources.generation.goldGenerationMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Material Drop Multiplier"
              :value="resourceParams.generation.materialDropMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Multiplier for all material drops"
              path="resources.generation.materialDropMultiplier"
              @update="updateParameter('resources.generation.materialDropMultiplier', $event)"
            />
          </div>
          
          <div class="space-y-3">
            <h4 class="font-medium text-sim-text">Passive Generation Rates</h4>
            <p class="text-sm text-sim-muted">Additional resources generated automatically over time</p>
            
            <div class="grid grid-cols-3 gap-4">
              <ParameterSlider
                label="Passive Energy"
                :value="resourceParams.generation.passiveGeneration.energy"
                :min="0"
                :max="10"
                :step="0.1"
                unit=" /hour"
                description="Energy generated per hour passively"
                path="resources.generation.passiveGeneration.energy"
                @update="updateParameter('resources.generation.passiveGeneration.energy', $event)"
              />
              
              <ParameterSlider
                label="Passive Gold"
                :value="resourceParams.generation.passiveGeneration.gold"
                :min="0"
                :max="100"
                :step="1"
                unit=" /hour"
                description="Gold generated per hour passively"
                path="resources.generation.passiveGeneration.gold"
                @update="updateParameter('resources.generation.passiveGeneration.gold', $event)"
              />
              
              <ParameterSlider
                label="Passive Water"
                :value="resourceParams.generation.passiveGeneration.water"
                :min="0"
                :max="5"
                :step="0.1"
                unit=" /hour"
                description="Water generated per hour passively"
                path="resources.generation.passiveGeneration.water"
                @update="updateParameter('resources.generation.passiveGeneration.water', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Consumption -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-minus-circle mr-2"></i>
          Resource Consumption
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Energy Consumption Multiplier"
              :value="resourceParams.consumption.energyConsumptionMultiplier"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Multiplier for all energy consumption"
              path="resources.consumption.energyConsumptionMultiplier"
              @update="updateParameter('resources.consumption.energyConsumptionMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Water Consumption Multiplier"
              :value="resourceParams.consumption.waterConsumptionMultiplier"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Multiplier for all water consumption"
              path="resources.consumption.waterConsumptionMultiplier"
              @update="updateParameter('resources.consumption.waterConsumptionMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Seed Consumption Multiplier"
              :value="resourceParams.consumption.seedConsumptionMultiplier"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Multiplier for all seed consumption"
              path="resources.consumption.seedConsumptionMultiplier"
              @update="updateParameter('resources.consumption.seedConsumptionMultiplier', $event)"
            />
          </div>
          
          <div class="space-y-3">
            <h4 class="font-medium text-sim-text">Minimum Reserve Levels</h4>
            <p class="text-sm text-sim-muted">Never spend resources below these amounts</p>
            
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Energy Reserve"
                :value="resourceParams.consumption.minimumReserves.energy"
                :min="0"
                :max="100"
                :step="5"
                unit=" energy"
                description="Always keep this much energy in reserve"
                path="resources.consumption.minimumReserves.energy"
                @update="updateParameter('resources.consumption.minimumReserves.energy', $event)"
              />
              
              <ParameterSlider
                label="Gold Reserve"
                :value="resourceParams.consumption.minimumReserves.gold"
                :min="0"
                :max="1000"
                :step="25"
                unit=" gold"
                description="Always keep this much gold in reserve"
                path="resources.consumption.minimumReserves.gold"
                @update="updateParameter('resources.consumption.minimumReserves.gold', $event)"
              />
              
              <ParameterSlider
                label="Water Reserve"
                :value="resourceParams.consumption.minimumReserves.water"
                :min="0"
                :max="50"
                :step="1"
                unit=" water"
                description="Always keep this much water in reserve"
                path="resources.consumption.minimumReserves.water"
                @update="updateParameter('resources.consumption.minimumReserves.water', $event)"
              />
              
              <ParameterSlider
                label="Seed Reserve"
                :value="resourceParams.consumption.minimumReserves.seeds"
                :min="0"
                :max="50"
                :step="1"
                unit=" seeds"
                description="Always keep this many seeds in reserve"
                path="resources.consumption.minimumReserves.seeds"
                @update="updateParameter('resources.consumption.minimumReserves.seeds', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Exchange Rates -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-exchange-alt mr-2"></i>
          Resource Exchange Rates
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Energy to Gold Rate"
              :value="resourceParams.exchangeRates.energyToGold"
              :min="0.01"
              :max="1.0"
              :step="0.01"
              unit=" gold/energy"
              description="How much gold per energy when selling energy"
              path="resources.exchangeRates.energyToGold"
              @update="updateParameter('resources.exchangeRates.energyToGold', $event)"
            />
            
            <ParameterSlider
              label="Gold to Energy Rate"
              :value="resourceParams.exchangeRates.goldToEnergy"
              :min="1"
              :max="50"
              :step="1"
              unit=" gold/energy"
              description="How much gold per energy when buying energy"
              path="resources.exchangeRates.goldToEnergy"
              @update="updateParameter('resources.exchangeRates.goldToEnergy', $event)"
            />
          </div>
          
          <div class="space-y-3">
            <h4 class="font-medium text-sim-text">Material Values</h4>
            <p class="text-sm text-sim-muted">Override default gold values for materials</p>
            
            <div class="grid grid-cols-3 gap-4 text-sm">
              <div class="space-y-2">
                <h5 class="font-medium">Basic Materials</h5>
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span>Wood</span>
                    <span class="text-sim-muted">1g (default)</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Stone</span>
                    <span class="text-sim-muted">2g (default)</span>
                  </div>
                </div>
              </div>
              
              <div class="space-y-2">
                <h5 class="font-medium">Refined Materials</h5>
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span>Iron</span>
                    <span class="text-sim-muted">5g (default)</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Silver</span>
                    <span class="text-sim-muted">10g (default)</span>
                  </div>
                </div>
              </div>
              
              <div class="space-y-2">
                <h5 class="font-medium">Rare Materials</h5>
                <div class="space-y-1">
                  <div class="flex items-center justify-between">
                    <span>Crystal</span>
                    <span class="text-sim-muted">25g (default)</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span>Mythril</span>
                    <span class="text-sim-muted">50g (default)</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="text-sm text-sim-muted p-3 bg-sim-surface rounded">
              <i class="fas fa-info-circle mr-2"></i>
              Material value overrides can be added via the override system. Default values are based on game data.
            </div>
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

const resourceParams = computed(() => parameterStore.effectiveParameters.resources)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}
</script>
