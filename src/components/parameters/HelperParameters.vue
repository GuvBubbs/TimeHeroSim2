<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-users mr-3 text-green-400"></i>
          Helper System Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure helper acquisition, role assignment, training schedules, and efficiency optimization.
        </p>
      </div>

      <!-- Helper Acquisition -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-user-plus mr-2"></i>
          Helper Acquisition & Housing
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSelect
              label="Housing Strategy"
              :value="helperParams.acquisition.housingStrategy"
              :options="[
                { value: 'immediate', label: 'Build Immediately' },
                { value: 'delayed', label: 'Build When Needed' },
                { value: 'optimal', label: 'Optimal Timing' }
              ]"
              description="When to build housing for new helpers"
              path="helpers.acquisition.housingStrategy"
              @update="updateParameter('helpers.acquisition.housingStrategy', $event)"
            />
            
            <ParameterToggle
              label="Build Housing Ahead"
              :value="helperParams.acquisition.buildHousingAhead"
              description="Build housing before rescuing helpers"
              path="helpers.acquisition.buildHousingAhead"
              @update="updateParameter('helpers.acquisition.buildHousingAhead', $event)"
            />
          </div>

          <!-- Rescue Order -->
          <DraggableList
            title="Rescue Priority Order"
            description="Priority order for rescuing helpers (drag to reorder)"
            :items="helperParams.acquisition.rescueOrder"
            backgroundColor="bg-blue-500/20"
            path="helpers.acquisition.rescueOrder"
            @update="updateParameter"
          />
        </div>
      </div>

      <!-- Role Assignment Strategy -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-tasks mr-2"></i>
          Role Assignment Strategy
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSelect
              label="Assignment Strategy"
              :value="helperParams.roleAssignment.strategy"
              :options="[
                { value: 'balanced', label: 'Balanced Distribution' },
                { value: 'focused', label: 'Focus on Priority' },
                { value: 'adaptive', label: 'Adaptive to Needs' },
                { value: 'custom', label: 'Custom Assignment' }
              ]"
              description="How to assign helpers to different roles"
              path="helpers.roleAssignment.strategy"
              @update="updateParameter('helpers.roleAssignment.strategy', $event)"
            />
          </div>

          <!-- Role Distribution -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Target Role Distribution</h4>
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Waterer Helpers"
                :value="helperParams.roleAssignment.roleDistribution.waterer"
                :min="0"
                :max="20"
                :step="1"
                unit=" helpers"
                description="Target number of waterer helpers"
                path="helpers.roleAssignment.roleDistribution.waterer"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.waterer', $event)"
              />
              
              <ParameterSlider
                label="Pump Helpers"
                :value="helperParams.roleAssignment.roleDistribution.pump"
                :min="0"
                :max="10"
                :step="1"
                unit=" helpers"
                description="Target number of pump helpers"
                path="helpers.roleAssignment.roleDistribution.pump"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.pump', $event)"
              />
              
              <ParameterSlider
                label="Sower Helpers"
                :value="helperParams.roleAssignment.roleDistribution.sower"
                :min="0"
                :max="15"
                :step="1"
                unit=" helpers"
                description="Target number of sower helpers"
                path="helpers.roleAssignment.roleDistribution.sower"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.sower', $event)"
              />
              
              <ParameterSlider
                label="Harvester Helpers"
                :value="helperParams.roleAssignment.roleDistribution.harvester"
                :min="0"
                :max="15"
                :step="1"
                unit=" helpers"
                description="Target number of harvester helpers"
                path="helpers.roleAssignment.roleDistribution.harvester"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.harvester', $event)"
              />
              
              <ParameterSlider
                label="Miner Helpers"
                :value="helperParams.roleAssignment.roleDistribution.miner"
                :min="0"
                :max="10"
                :step="1"
                unit=" helpers"
                description="Target number of miner helpers"
                path="helpers.roleAssignment.roleDistribution.miner"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.miner', $event)"
              />
              
              <ParameterSlider
                label="Fighter Helpers"
                :value="helperParams.roleAssignment.roleDistribution.fighter"
                :min="0"
                :max="10"
                :step="1"
                unit=" helpers"
                description="Target number of fighter helpers"
                path="helpers.roleAssignment.roleDistribution.fighter"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.fighter', $event)"
              />
              
              <ParameterSlider
                label="Support Helpers"
                :value="helperParams.roleAssignment.roleDistribution.support"
                :min="0"
                :max="5"
                :step="1"
                unit=" helpers"
                description="Target number of support helpers"
                path="helpers.roleAssignment.roleDistribution.support"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.support', $event)"
              />
              
              <ParameterSlider
                label="Catcher Helpers"
                :value="helperParams.roleAssignment.roleDistribution.catcher"
                :min="0"
                :max="8"
                :step="1"
                unit=" helpers"
                description="Target number of catcher helpers"
                path="helpers.roleAssignment.roleDistribution.catcher"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.catcher', $event)"
              />
              
              <ParameterSlider
                label="Forager Helpers"
                :value="helperParams.roleAssignment.roleDistribution.forager"
                :min="0"
                :max="8"
                :step="1"
                unit=" helpers"
                description="Target number of forager helpers"
                path="helpers.roleAssignment.roleDistribution.forager"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.forager', $event)"
              />
              
              <ParameterSlider
                label="Refiner Helpers"
                :value="helperParams.roleAssignment.roleDistribution.refiner"
                :min="0"
                :max="5"
                :step="1"
                unit=" helpers"
                description="Target number of refiner helpers"
                path="helpers.roleAssignment.roleDistribution.refiner"
                @update="updateParameter('helpers.roleAssignment.roleDistribution.refiner', $event)"
              />
            </div>
          </div>

          <!-- Adaptive Thresholds -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Adaptive Assignment Thresholds</h4>
            <div class="grid grid-cols-3 gap-4">
              <ParameterSlider
                label="Switch to Waterer"
                :value="helperParams.roleAssignment.adaptiveThresholds.switchToWaterer"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit="%"
                :display-multiplier="100"
                description="Water level threshold to reassign helpers to watering"
                path="helpers.roleAssignment.adaptiveThresholds.switchToWaterer"
                @update="updateParameter('helpers.roleAssignment.adaptiveThresholds.switchToWaterer', $event)"
              />
              
              <ParameterSlider
                label="Switch to Harvester"
                :value="helperParams.roleAssignment.adaptiveThresholds.switchToHarvester"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit="%"
                :display-multiplier="100"
                description="Crop readiness threshold to reassign helpers to harvesting"
                path="helpers.roleAssignment.adaptiveThresholds.switchToHarvester"
                @update="updateParameter('helpers.roleAssignment.adaptiveThresholds.switchToHarvester', $event)"
              />
              
              <ParameterSlider
                label="Switch to Miner"
                :value="helperParams.roleAssignment.adaptiveThresholds.switchToMiner"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit="%"
                :display-multiplier="100"
                description="Material shortage threshold to reassign helpers to mining"
                path="helpers.roleAssignment.adaptiveThresholds.switchToMiner"
                @update="updateParameter('helpers.roleAssignment.adaptiveThresholds.switchToMiner', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Training & Development -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-graduation-cap mr-2"></i>
          Training & Development
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Enable Training"
              :value="helperParams.training.enableTraining"
              description="Allow helpers to train and improve their skills"
              path="helpers.training.enableTraining"
              @update="updateParameter('helpers.training.enableTraining', $event)"
            />
            
            <ParameterSlider
              label="Training Energy Budget"
              :value="helperParams.training.trainingEnergyBudget"
              :min="10"
              :max="200"
              :step="10"
              unit=" energy"
              description="Maximum energy to allocate for training per cycle"
              path="helpers.training.trainingEnergyBudget"
              @update="updateParameter('helpers.training.trainingEnergyBudget', $event)"
            />
          </div>

          <div class="grid grid-cols-1 gap-4">
            <ParameterSelect
              label="Training Schedule"
              :value="helperParams.training.trainingSchedule"
              :options="[
                { value: 'continuous', label: 'Continuous Training' },
                { value: 'periodic', label: 'Periodic Sessions' },
                { value: 'milestone', label: 'Milestone-Based' }
              ]"
              description="When and how often to conduct training"
              path="helpers.training.trainingSchedule"
              @update="updateParameter('helpers.training.trainingSchedule', $event)"
            />
          </div>

          <!-- Training Priority -->
          <DraggableList
            title="Training Priority Order"
            description="Priority order for training different helper types (drag to reorder)"
            :items="helperParams.training.trainingPriority"
            backgroundColor="bg-blue-500/20"
            path="helpers.training.trainingPriority"
            @update="updateParameter"
          />
        </div>
      </div>

      <!-- Efficiency Optimization -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-chart-line mr-2"></i>
          Efficiency & Optimization
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Role Switch Frequency"
              :value="helperParams.efficiency.roleSwitchFrequency"
              :min="1"
              :max="60"
              :step="1"
              unit=" minutes"
              description="How often to reevaluate and switch helper roles"
              path="helpers.efficiency.roleSwitchFrequency"
              @update="updateParameter('helpers.efficiency.roleSwitchFrequency', $event)"
            />
            
            <ParameterSlider
              label="Efficiency Threshold"
              :value="helperParams.efficiency.efficiencyThreshold"
              :min="0.5"
              :max="1.0"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Minimum efficiency before considering role changes"
              path="helpers.efficiency.efficiencyThreshold"
              @update="updateParameter('helpers.efficiency.efficiencyThreshold', $event)"
            />
            
            <ParameterSlider
              label="Workload Balance Factor"
              :value="helperParams.efficiency.workloadBalanceFactor"
              :min="0.0"
              :max="2.0"
              :step="0.1"
              unit="x"
              description="How strongly to balance workload across helpers"
              path="helpers.efficiency.workloadBalanceFactor"
              @update="updateParameter('helpers.efficiency.workloadBalanceFactor', $event)"
            />
            
            <ParameterSlider
              label="Specialization Bonus"
              :value="helperParams.efficiency.specializationBonus"
              :min="1.0"
              :max="2.0"
              :step="0.05"
              unit="x"
              description="Efficiency bonus for helpers staying in same role"
              path="helpers.efficiency.specializationBonus"
              @update="updateParameter('helpers.efficiency.specializationBonus', $event)"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Auto Role Optimization"
              :value="helperParams.efficiency.autoRoleOptimization"
              description="Automatically optimize role assignments based on current needs"
              path="helpers.efficiency.autoRoleOptimization"
              @update="updateParameter('helpers.efficiency.autoRoleOptimization', $event)"
            />
            
            <ParameterToggle
              label="Prevent Overassignment"
              :value="helperParams.efficiency.preventOverassignment"
              description="Avoid assigning more helpers than needed for a task"
              path="helpers.efficiency.preventOverassignment"
              @update="updateParameter('helpers.efficiency.preventOverassignment', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Decision Logic -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-brain mr-2"></i>
          Decision Logic & Automation
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Management Frequency"
              :value="helperParams.decisionLogic.managementFrequency"
              :min="1"
              :max="30"
              :step="1"
              unit=" minutes"
              description="How often to review and manage helper assignments"
              path="helpers.decisionLogic.managementFrequency"
              @update="updateParameter('helpers.decisionLogic.managementFrequency', $event)"
            />
            
            <ParameterSlider
              label="Emergency Response Time"
              :value="helperParams.decisionLogic.emergencyResponseTime"
              :min="0.5"
              :max="10"
              :step="0.5"
              unit=" minutes"
              description="How quickly to reassign helpers in emergency situations"
              path="helpers.decisionLogic.emergencyResponseTime"
              @update="updateParameter('helpers.decisionLogic.emergencyResponseTime', $event)"
            />
            
            <ParameterSlider
              label="Priority Override Threshold"
              :value="helperParams.decisionLogic.priorityOverrideThreshold"
              :min="0.5"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="How urgent a task needs to be to override current assignments"
              path="helpers.decisionLogic.priorityOverrideThreshold"
              @update="updateParameter('helpers.decisionLogic.priorityOverrideThreshold', $event)"
            />
            
            <ParameterSlider
              label="Idle Helper Threshold"
              :value="helperParams.decisionLogic.idleHelperThreshold"
              :min="1"
              :max="30"
              :step="1"
              unit=" seconds"
              description="How long before idle helpers are reassigned"
              path="helpers.decisionLogic.idleHelperThreshold"
              @update="updateParameter('helpers.decisionLogic.idleHelperThreshold', $event)"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Emergency Reassignment"
              :value="helperParams.decisionLogic.emergencyReassignment"
              description="Allow emergency reassignment of helpers during critical situations"
              path="helpers.decisionLogic.emergencyReassignment"
              @update="updateParameter('helpers.decisionLogic.emergencyReassignment', $event)"
            />
            
            <ParameterToggle
              label="Cross-Training Priority"
              :value="helperParams.decisionLogic.crossTrainingPriority"
              description="Prioritize training helpers in multiple roles for flexibility"
              path="helpers.decisionLogic.crossTrainingPriority"
              @update="updateParameter('helpers.decisionLogic.crossTrainingPriority', $event)"
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
import DraggableList from '../parameters/shared/DraggableList.vue'

const parameterStore = useParameterStore()

const helperParams = computed(() => parameterStore.effectiveParameters.helpers)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}
</script>
