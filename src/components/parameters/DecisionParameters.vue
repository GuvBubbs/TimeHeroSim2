<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-brain mr-3 text-pink-400"></i>
          Decision Engine Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure AI behavior, decision priorities, interrupts, and optimization goals for the simulation.
        </p>
      </div>

      <!-- Global Decision Behavior -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-cogs mr-2"></i>
          Global Decision Behavior
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Decision Interval"
              :value="decisionParams.globalBehavior.decisionInterval"
              :min="5"
              :max="120"
              :step="5"
              unit=" seconds"
              description="How often the AI evaluates and makes decisions"
              path="decisions.globalBehavior.decisionInterval"
              @update="updateParameter('decisions.globalBehavior.decisionInterval', $event)"
            />
            
            <ParameterSlider
              label="Look Ahead Time"
              :value="decisionParams.globalBehavior.lookAheadTime"
              :min="30"
              :max="300"
              :step="10"
              unit=" seconds"
              description="How far ahead the AI plans actions"
              path="decisions.globalBehavior.lookAheadTime"
              @update="updateParameter('decisions.globalBehavior.lookAheadTime', $event)"
            />
            
            <ParameterSlider
              label="Randomness Factor"
              :value="decisionParams.globalBehavior.randomness"
              :min="0.0"
              :max="0.5"
              :step="0.01"
              unit=""
              description="Amount of randomness in decision making (0=deterministic)"
              path="decisions.globalBehavior.randomness"
              @update="updateParameter('decisions.globalBehavior.randomness', $event)"
            />
            
            <ParameterSlider
              label="Learning Rate"
              :value="decisionParams.globalBehavior.learningRate"
              :min="0.0"
              :max="0.1"
              :step="0.005"
              unit=""
              description="How quickly AI adapts to changing conditions"
              path="decisions.globalBehavior.learningRate"
              @update="updateParameter('decisions.globalBehavior.learningRate', $event)"
            />
            
            <ParameterSlider
              label="Persistence Bias"
              :value="decisionParams.globalBehavior.persistenceBias"
              :min="0.0"
              :max="0.8"
              :step="0.05"
              unit=""
              description="Tendency to continue current activity vs switching"
              path="decisions.globalBehavior.persistenceBias"
              @update="updateParameter('decisions.globalBehavior.persistenceBias', $event)"
            />
          </div>
          
          <div class="grid grid-cols-1 gap-4">
            <ParameterSelect
              label="Decision Strategy"
              :value="decisionParams.globalBehavior.decisionStrategy"
              :options="[
                { value: 'optimal', label: 'Optimal (Mathematical)' },
                { value: 'greedy', label: 'Greedy (Short-term focused)' },
                { value: 'balanced', label: 'Balanced (Medium-term)' },
                { value: 'conservative', label: 'Conservative (Risk-averse)' },
                { value: 'aggressive', label: 'Aggressive (Risk-taking)' }
              ]"
              description="Overall approach to decision making"
              path="decisions.globalBehavior.decisionStrategy"
              @update="updateParameter('decisions.globalBehavior.decisionStrategy', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Screen Priorities -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-list-ol mr-2"></i>
          Screen Priority Weights
        </div>
        <div class="card-body space-y-4">
          <div class="space-y-3">
            <h4 class="font-medium text-sim-text">Base Priority Weights</h4>
            <p class="text-sm text-sim-muted">How much the AI values visiting each game screen</p>
            
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-3">
                <ParameterSlider
                  label="🌱 Farm Priority"
                  :value="getScreenWeight('farm')"
                  :min="0.0"
                  :max="3.0"
                  :step="0.1"
                  unit="x"
                  description="Base weight for farm activities"
                  @update="updateScreenWeight('farm', $event)"
                />
                
                <ParameterSlider
                  label="🏗️ Tower Priority"
                  :value="getScreenWeight('tower')"
                  :min="0.0"
                  :max="3.0"
                  :step="0.1"
                  unit="x"
                  description="Base weight for tower/seed catching"
                  @update="updateScreenWeight('tower', $event)"
                />
                
                <ParameterSlider
                  label="🏢 Town Priority"
                  :value="getScreenWeight('town')"
                  :min="0.0"
                  :max="3.0"
                  :step="0.1"
                  unit="x"
                  description="Base weight for town/shopping"
                  @update="updateScreenWeight('town', $event)"
                />
              </div>
              
              <div class="space-y-3">
                <ParameterSlider
                  label="⚔️ Adventure Priority"
                  :value="getScreenWeight('adventure')"
                  :min="0.0"
                  :max="3.0"
                  :step="0.1"
                  unit="x"
                  description="Base weight for adventure/combat"
                  @update="updateScreenWeight('adventure', $event)"
                />
                
                <ParameterSlider
                  label="🔨 Forge Priority"
                  :value="getScreenWeight('forge')"
                  :min="0.0"
                  :max="3.0"
                  :step="0.1"
                  unit="x"
                  description="Base weight for forging/crafting"
                  @update="updateScreenWeight('forge', $event)"
                />
                
                <ParameterSlider
                  label="⛰️ Mine Priority"
                  :value="getScreenWeight('mine')"
                  :min="0.0"
                  :max="3.0"
                  :step="0.1"
                  unit="x"
                  description="Base weight for mining activities"
                  @update="updateScreenWeight('mine', $event)"
                />
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 gap-4">
            <ParameterToggle
              label="Dynamic Priority Adjustment"
              :value="decisionParams.screenPriorities.dynamicAdjustment"
              description="Allow priorities to change based on game state (low energy, new unlocks, etc.)"
              path="decisions.screenPriorities.dynamicAdjustment"
              @update="updateParameter('decisions.screenPriorities.dynamicAdjustment', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Action Evaluation -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-balance-scale mr-2"></i>
          Action Evaluation
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Immediate Value Weight"
              :value="decisionParams.actionEvaluation.immediateValueWeight"
              :min="0.0"
              :max="1.0"
              :step="0.05"
              unit=""
              description="How much to value immediate rewards"
              path="decisions.actionEvaluation.immediateValueWeight"
              @update="updateParameter('decisions.actionEvaluation.immediateValueWeight', $event)"
            />
            
            <ParameterSlider
              label="Future Value Weight"
              :value="decisionParams.actionEvaluation.futureValueWeight"
              :min="0.0"
              :max="1.0"
              :step="0.05"
              unit=""
              description="How much to value long-term benefits"
              path="decisions.actionEvaluation.futureValueWeight"
              @update="updateParameter('decisions.actionEvaluation.futureValueWeight', $event)"
            />
            
            <ParameterSlider
              label="Risk Weight"
              :value="decisionParams.actionEvaluation.riskWeight"
              :min="0.0"
              :max="2.0"
              :step="0.05"
              unit=""
              description="How much risk affects action scoring (higher = more risk-averse)"
              path="decisions.actionEvaluation.riskWeight"
              @update="updateParameter('decisions.actionEvaluation.riskWeight', $event)"
            />
          </div>
          
          <div class="grid grid-cols-1 gap-4">
            <ParameterSelect
              label="Value Calculation Method"
              :value="decisionParams.actionEvaluation.valueCalculation"
              :options="[
                { value: 'linear', label: 'Linear (Simple addition)' },
                { value: 'exponential', label: 'Exponential (High values favored)' },
                { value: 'logarithmic', label: 'Logarithmic (Diminishing returns)' },
                { value: 'sigmoid', label: 'Sigmoid (Balanced curve)' }
              ]"
              description="Mathematical approach to calculating action values"
              path="decisions.actionEvaluation.valueCalculation"
              @update="updateParameter('decisions.actionEvaluation.valueCalculation', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Emergency Interrupts -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-exclamation-triangle mr-2"></i>
          Emergency Interrupts
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <ParameterToggle
              label="Enable Emergency Interrupts"
              :value="decisionParams.interrupts.enabled"
              description="Allow AI to interrupt current actions for emergencies"
              path="decisions.interrupts.enabled"
              @update="updateParameter('decisions.interrupts.enabled', $event)"
            />
          </div>
          
          <div v-if="decisionParams.interrupts.enabled" class="space-y-4">
            <div class="grid grid-cols-1 gap-4">
              <ParameterSlider
                label="Emergency Energy Threshold"
                :value="decisionParams.interrupts.emergencyMode.threshold"
                :min="5"
                :max="50"
                :step="1"
                unit=" energy"
                description="Energy level that triggers emergency mode"
                path="decisions.interrupts.emergencyMode.threshold"
                @update="updateParameter('decisions.interrupts.emergencyMode.threshold', $event)"
              />
            </div>
            
            <div class="space-y-2">
              <h4 class="font-medium text-sim-text">Emergency Actions</h4>
              <p class="text-sm text-sim-muted">Actions allowed during emergency mode (when energy is critically low)</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="action in decisionParams.interrupts.emergencyMode.actions" 
                      :key="action" 
                      class="px-3 py-1 bg-sim-primary/20 border border-sim-primary/30 rounded-full text-sm">
                  {{ action }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Optimization Goals -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-target mr-2"></i>
          Optimization Goals
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-1 gap-4">
            <ParameterSelect
              label="Primary Optimization Goal"
              :value="decisionParams.optimization.primaryGoal"
              :options="[
                { value: 'speed', label: 'Speed (Complete as fast as possible)' },
                { value: 'efficiency', label: 'Efficiency (Optimal resource usage)' },
                { value: 'completion', label: 'Completion (See all content)' },
                { value: 'exploration', label: 'Exploration (Discover everything)' },
                { value: 'balanced', label: 'Balanced (Multiple goals)' }
              ]"
              description="Primary goal that drives overall AI behavior"
              path="decisions.optimization.primaryGoal"
              @update="updateParameter('decisions.optimization.primaryGoal', $event)"
            />
          </div>
          
          <div v-if="decisionParams.optimization.primaryGoal === 'balanced'" class="space-y-3">
            <h4 class="font-medium text-sim-text">Sub-Goal Weights</h4>
            <p class="text-sm text-sim-muted">Balance between different optimization objectives (must sum to 1.0)</p>
            
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Minimize Days"
                :value="decisionParams.optimization.subGoals.minimizeDays"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit=""
                description="Weight for completing quickly"
                path="decisions.optimization.subGoals.minimizeDays"
                @update="updateSubGoalWeight('minimizeDays', $event)"
              />
              
              <ParameterSlider
                label="Maximize Efficiency"
                :value="decisionParams.optimization.subGoals.maximizeEfficiency"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit=""
                description="Weight for resource efficiency"
                path="decisions.optimization.subGoals.maximizeEfficiency"
                @update="updateSubGoalWeight('maximizeEfficiency', $event)"
              />
              
              <ParameterSlider
                label="Explore Content"
                :value="decisionParams.optimization.subGoals.exploreContent"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit=""
                description="Weight for seeing all content"
                path="decisions.optimization.subGoals.exploreContent"
                @update="updateSubGoalWeight('exploreContent', $event)"
              />
              
              <ParameterSlider
                label="Minimize Risk"
                :value="decisionParams.optimization.subGoals.minimizeRisk"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit=""
                description="Weight for avoiding risky actions"
                path="decisions.optimization.subGoals.minimizeRisk"
                @update="updateSubGoalWeight('minimizeRisk', $event)"
              />
            </div>
            
            <div class="text-sm p-3 rounded" :class="subGoalSum === 1.0 ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'">
              <i class="fas fa-info-circle mr-2"></i>
              Sub-goal weights sum: {{ subGoalSum.toFixed(2) }} {{ subGoalSum === 1.0 ? '✓' : '(should equal 1.0)' }}
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

const decisionParams = computed(() => parameterStore.effectiveParameters.decisions)

const subGoalSum = computed(() => {
  const goals = decisionParams.value.optimization.subGoals
  return goals.minimizeDays + goals.maximizeEfficiency + goals.exploreContent + goals.minimizeRisk
})

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}

function getScreenWeight(screenId: string): number {
  const weights = decisionParams.value.screenPriorities.weights
  
  // Handle both Map and plain object cases (for serialization compatibility)
  if (weights instanceof Map) {
    return weights.get(screenId) ?? 1.0
  } else {
    // This should no longer happen with the fixed effectiveParameters computation
    console.warn('Screen weights is not a Map - this indicates a problem with parameter cloning')
    return (weights as any)[screenId] ?? 1.0
  }
}

function updateScreenWeight(screenId: string, value: number) {
  // Since we can't directly update Map entries, we need to create a new Map
  const currentWeights = decisionParams.value.screenPriorities.weights
  
  let newWeights: Map<string, number>
  if (currentWeights instanceof Map) {
    newWeights = new Map(currentWeights)
  } else {
    // Convert plain object to Map if needed
    console.warn('Converting plain object to Map for screen weights - this should not happen')
    newWeights = new Map(Object.entries(currentWeights as any))
  }
  
  newWeights.set(screenId, value)
  updateParameter('decisions.screenPriorities.weights', newWeights)
}

function updateSubGoalWeight(goalType: string, value: number) {
  updateParameter(`decisions.optimization.subGoals.${goalType}`, value)
}
</script>
