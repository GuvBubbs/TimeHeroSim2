<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-tower-observation mr-3 text-blue-400"></i>
          Tower System Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure seed catching mechanics, auto-catcher behavior, and tower progression settings.
        </p>
      </div>

      <!-- Seed Catching Mechanics -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-hand-paper mr-2"></i>
          Manual Catching Mechanics
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Manual Catch Rate"
              :value="towerParams.catchMechanics.manualCatchRate"
              :min="10"
              :max="180"
              :step="10"
              unit=" seeds/min"
              description="Seeds caught per minute during active play"
              path="tower.catchMechanics.manualCatchRate"
              @update="updateParameter('tower.catchMechanics.manualCatchRate', $event)"
            />
            
            <ParameterSlider
              label="Catch Radius"
              :value="towerParams.catchMechanics.manualCatchRadius"
              :min="0.5"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Size of the catch hitbox multiplier"
              path="tower.catchMechanics.manualCatchRadius"
              @update="updateParameter('tower.catchMechanics.manualCatchRadius', $event)"
            />
            
            <ParameterSlider
              label="Wind Speed"
              :value="towerParams.catchMechanics.windSpeedMultiplier"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Speed of falling seeds multiplier"
              path="tower.catchMechanics.windSpeedMultiplier"
              @update="updateParameter('tower.catchMechanics.windSpeedMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Seed Density"
              :value="towerParams.catchMechanics.seedDensity"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Number of seeds per spawn wave"
              path="tower.catchMechanics.seedDensity"
              @update="updateParameter('tower.catchMechanics.seedDensity', $event)"
            />
            
            <ParameterSlider
              label="Net Efficiency"
              :value="towerParams.catchMechanics.netEfficiencyMultiplier"
              :min="0.5"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Efficiency bonus from net upgrades"
              path="tower.catchMechanics.netEfficiencyMultiplier"
              @update="updateParameter('tower.catchMechanics.netEfficiencyMultiplier', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Auto-Catcher System -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-robot mr-2"></i>
          Auto-Catcher Behavior
        </div>
        <div class="card-body space-y-4">
          <!-- Base Settings -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Base Catch Rate"
              :value="towerParams.autoCatcher.baseRate"
              :min="1"
              :max="50"
              :step="1"
              unit=" seeds/hr"
              description="Seeds caught per hour at level 0"
              path="tower.autoCatcher.baseRate"
              @update="updateParameter('tower.autoCatcher.baseRate', $event)"
            />
            
            <ParameterSlider
              label="Offline Efficiency"
              :value="towerParams.autoCatcher.offlineMultiplier"
              :min="0.1"
              :max="1.0"
              :step="0.05"
              unit="x"
              description="Catch rate when not actively playing"
              path="tower.autoCatcher.offlineMultiplier"
              @update="updateParameter('tower.autoCatcher.offlineMultiplier', $event)"
            />
          </div>

          <!-- Prioritization Strategy -->
          <div>
            <ParameterSelect
              label="Catch Prioritization"
              :value="towerParams.autoCatcher.prioritization"
              :options="[
                { value: 'random', label: 'Random' },
                { value: 'highest-tier', label: 'Highest Tier' },
                { value: 'needed', label: 'Most Needed' },
                { value: 'balanced', label: 'Balanced Mix' }
              ]"
              description="How auto-catcher chooses which seeds to prioritize"
              path="tower.autoCatcher.prioritization"
              @update="updateParameter('tower.autoCatcher.prioritization', $event)"
            />
          </div>

          <!-- Level Bonuses -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Auto-Catcher Level Bonuses</h4>
            <div class="grid grid-cols-5 gap-2">
              <ParameterSlider
                v-for="(bonus, index) in towerParams.autoCatcher.levelBonus"
                :key="index"
                :label="`Level ${index}`"
                :value="bonus"
                :min="0"
                :max="50"
                :step="1"
                unit=" seeds/hr"
                :description="`Bonus seeds per hour at level ${index}`"
                :path="`tower.autoCatcher.levelBonus.${index}`"
                @update="updateLevelBonus(index, $event)"
              />
            </div>
          </div>

          <!-- Seed Pool Bias -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Seed Tier Weights</h4>
            <div class="grid grid-cols-4 gap-4">
              <ParameterSlider
                v-for="(weight, index) in towerParams.autoCatcher.seedPoolBias"
                :key="index"
                :label="`Tier ${index + 1}`"
                :value="weight"
                :min="0.1"
                :max="5.0"
                :step="0.1"
                unit="x"
                :description="`Weight for tier ${index + 1} seeds`"
                :path="`tower.autoCatcher.seedPoolBias.${index}`"
                @update="updateSeedPoolBias(index, $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Unlock Progression -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-unlock mr-2"></i>
          Unlock Progression
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Skip Prerequisites"
              :value="towerParams.unlockProgression.skipPrerequisites"
              description="Ignore normal unlock requirements"
              path="tower.unlockProgression.skipPrerequisites"
              @update="updateParameter('tower.unlockProgression.skipPrerequisites', $event)"
            />
          </div>

          <!-- Reach Level Costs Override -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Reach Level Cost Overrides</h4>
            <p class="text-xs text-sim-muted">Override gold costs for reaching new tower levels (leave empty to use defaults)</p>
            
            <div class="grid grid-cols-3 gap-4">
              <ParameterSlider
                v-for="(cost, index) in Math.min(towerParams.unlockProgression.reachLevelCosts.length, 6)"
                :key="index"
                :label="`Level ${index + 1}`"
                :value="towerParams.unlockProgression.reachLevelCosts[index] || 0"
                :min="0"
                :max="1000"
                :step="10"
                unit=" gold"
                :description="`Gold cost to reach level ${index + 1}`"
                :path="`tower.unlockProgression.reachLevelCosts.${index}`"
                @update="updateReachLevelCost(index, $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Decision Logic -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-brain mr-2"></i>
          AI Decision Logic
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Visit Frequency"
              :value="towerParams.decisionLogic.visitFrequency"
              :min="1"
              :max="30"
              :step="1"
              unit=" minutes"
              description="How often AI checks the tower"
              path="tower.decisionLogic.visitFrequency"
              @update="updateParameter('tower.decisionLogic.visitFrequency', $event)"
            />
            
            <ParameterSlider
              label="Catch Duration"
              :value="towerParams.decisionLogic.catchDuration"
              :min="0.5"
              :max="10"
              :step="0.5"
              unit=" minutes"
              description="Time spent manually catching per visit"
              path="tower.decisionLogic.catchDuration"
              @update="updateParameter('tower.decisionLogic.catchDuration', $event)"
            />
            
            <ParameterSlider
              label="Upgrade Threshold"
              :value="towerParams.decisionLogic.upgradeThreshold"
              :min="0.1"
              :max="2.0"
              :step="0.1"
              unit="x"
              description="Buy upgrades when gold > cost × threshold"
              path="tower.decisionLogic.upgradeThreshold"
              @update="updateParameter('tower.decisionLogic.upgradeThreshold', $event)"
            />
            
            <ParameterSlider
              label="Seed Target Multiplier"
              :value="towerParams.decisionLogic.seedTargetMultiplier"
              :min="0.5"
              :max="10"
              :step="0.5"
              unit="x plots"
              description="Target seed inventory (multiplier of farm plots)"
              path="tower.decisionLogic.seedTargetMultiplier"
              @update="updateParameter('tower.decisionLogic.seedTargetMultiplier', $event)"
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

const towerParams = computed(() => parameterStore.effectiveParameters.tower)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}

function updateLevelBonus(index: number, value: number) {
  const currentBonuses = [...towerParams.value.autoCatcher.levelBonus]
  currentBonuses[index] = value
  parameterStore.applyOverride('tower.autoCatcher.levelBonus', currentBonuses)
}

function updateSeedPoolBias(index: number, value: number) {
  const currentBias = [...towerParams.value.autoCatcher.seedPoolBias]
  currentBias[index] = value
  parameterStore.applyOverride('tower.autoCatcher.seedPoolBias', currentBias)
}

function updateReachLevelCost(index: number, value: number) {
  const currentCosts = [...towerParams.value.unlockProgression.reachLevelCosts]
  // Ensure array is long enough
  while (currentCosts.length <= index) {
    currentCosts.push(0)
  }
  currentCosts[index] = value
  parameterStore.applyOverride('tower.unlockProgression.reachLevelCosts', currentCosts)
}
</script>
