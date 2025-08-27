<template>
  <div class="h-full overflow-y-auto">
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="border-b border-sim-border pb-4">
        <h3 class="text-xl font-bold flex items-center">
          <i class="fas fa-fist-raised mr-3 text-red-400"></i>
          Adventure System Parameters
        </h3>
        <p class="text-sim-muted mt-2">
          Configure combat mechanics, risk assessment, route selection, and loot systems.
        </p>
      </div>

      <!-- Combat Mechanics -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-fist-raised mr-2"></i>
          Combat Mechanics
        </div>
        <div class="card-body space-y-4">
          <!-- Basic Combat Modifiers -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Damage Multiplier"
              :value="adventureParams.combatMechanics.damageMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Global damage modifier for hero attacks"
              path="adventure.combatMechanics.damageMultiplier"
              @update="updateParameter('adventure.combatMechanics.damageMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Defense Multiplier"
              :value="adventureParams.combatMechanics.defenseMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Global defense modifier for damage reduction"
              path="adventure.combatMechanics.defenseMultiplier"
              @update="updateParameter('adventure.combatMechanics.defenseMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Weapon Advantage Bonus"
              :value="adventureParams.combatMechanics.weaponAdvantageBonus"
              :min="1.0"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Damage multiplier when using effective weapon type"
              path="adventure.combatMechanics.weaponAdvantageBonus"
              @update="updateParameter('adventure.combatMechanics.weaponAdvantageBonus', $event)"
            />
            
            <ParameterSlider
              label="Weapon Disadvantage"
              :value="adventureParams.combatMechanics.weaponDisadvantage"
              :min="0.1"
              :max="1.0"
              :step="0.05"
              unit="x"
              description="Damage multiplier when using resisted weapon type"
              path="adventure.combatMechanics.weaponDisadvantage"
              @update="updateParameter('adventure.combatMechanics.weaponDisadvantage', $event)"
            />
            
            <ParameterSlider
              label="Combat Speed"
              :value="adventureParams.combatMechanics.combatSpeed"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Speed multiplier for combat animations and resolution"
              path="adventure.combatMechanics.combatSpeed"
              @update="updateParameter('adventure.combatMechanics.combatSpeed', $event)"
            />
            
            <ParameterSlider
              label="Weapon Switch Time"
              :value="adventureParams.combatMechanics.weaponSwitchTime"
              :min="0"
              :max="10"
              :step="0.5"
              unit=" seconds"
              description="Time required to switch weapons during combat"
              path="adventure.combatMechanics.weaponSwitchTime"
              @update="updateParameter('adventure.combatMechanics.weaponSwitchTime', $event)"
            />
          </div>

          <!-- Hero HP System -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Hero Health System</h4>
            <div class="grid grid-cols-3 gap-4">
              <ParameterSlider
                label="Base HP"
                :value="adventureParams.combatMechanics.heroHP.baseHP"
                :min="50"
                :max="500"
                :step="10"
                unit=" HP"
                description="Starting health points"
                path="adventure.combatMechanics.heroHP.baseHP"
                @update="updateParameter('adventure.combatMechanics.heroHP.baseHP', $event)"
              />
              
              <ParameterSlider
                label="HP per Level"
                :value="adventureParams.combatMechanics.heroHP.hpPerLevel"
                :min="5"
                :max="100"
                :step="5"
                unit=" HP"
                description="Health gained per level up"
                path="adventure.combatMechanics.heroHP.hpPerLevel"
                @update="updateParameter('adventure.combatMechanics.heroHP.hpPerLevel', $event)"
              />
              
              <ParameterSlider
                label="Max Level"
                :value="adventureParams.combatMechanics.heroHP.maxLevel"
                :min="10"
                :max="100"
                :step="5"
                unit=" level"
                description="Maximum hero level"
                path="adventure.combatMechanics.heroHP.maxLevel"
                @update="updateParameter('adventure.combatMechanics.heroHP.maxLevel', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Enemy Generation -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-skull mr-2"></i>
          Enemy Generation
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Boss Health Multiplier"
              :value="adventureParams.enemyGeneration.bossHealthMultiplier"
              :min="0.5"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Health multiplier for boss enemies"
              path="adventure.enemyGeneration.bossHealthMultiplier"
              @update="updateParameter('adventure.enemyGeneration.bossHealthMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Boss Damage Multiplier"
              :value="adventureParams.enemyGeneration.bossDamageMultiplier"
              :min="0.5"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Damage multiplier for boss enemies"
              path="adventure.enemyGeneration.bossDamageMultiplier"
              @update="updateParameter('adventure.enemyGeneration.bossDamageMultiplier', $event)"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <ParameterToggle
              label="Roll Persistence"
              :value="adventureParams.enemyGeneration.rollPersistence"
              description="Keep the same enemy roll after a failed attempt"
              path="adventure.enemyGeneration.rollPersistence"
              @update="updateParameter('adventure.enemyGeneration.rollPersistence', $event)"
            />
            
            <ParameterToggle
              label="Reroll on Success"
              :value="adventureParams.enemyGeneration.rerollOnSuccess"
              description="Generate new enemies after successful completion"
              path="adventure.enemyGeneration.rerollOnSuccess"
              @update="updateParameter('adventure.enemyGeneration.rerollOnSuccess', $event)"
            />
          </div>
        </div>
      </div>

      <!-- Risk Assessment -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-shield-alt mr-2"></i>
          Risk Assessment
        </div>
        <div class="card-body space-y-4">
          <!-- Risk Calculation Weights -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="HP Safety Margin"
              :value="adventureParams.riskCalculation.hpSafetyMargin"
              :min="0.0"
              :max="0.8"
              :step="0.05"
              unit="%"
              :display-multiplier="100"
              description="Required HP buffer before considering route safe"
              path="adventure.riskCalculation.hpSafetyMargin"
              @update="updateParameter('adventure.riskCalculation.hpSafetyMargin', $event)"
            />
            
            <ParameterSlider
              label="Defense Weight"
              :value="adventureParams.riskCalculation.defenseWeight"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Importance of defense in risk calculation"
              path="adventure.riskCalculation.defenseWeight"
              @update="updateParameter('adventure.riskCalculation.defenseWeight', $event)"
            />
            
            <ParameterSlider
              label="Weapon Coverage Weight"
              :value="adventureParams.riskCalculation.weaponCoverageWeight"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Importance of having effective weapons"
              path="adventure.riskCalculation.weaponCoverageWeight"
              @update="updateParameter('adventure.riskCalculation.weaponCoverageWeight', $event)"
            />
            
            <ParameterSlider
              label="Boss Weakness Weight"
              :value="adventureParams.riskCalculation.bossWeaknessWeight"
              :min="0.1"
              :max="3.0"
              :step="0.1"
              unit="x"
              description="Importance of countering boss weaknesses"
              path="adventure.riskCalculation.bossWeaknessWeight"
              @update="updateParameter('adventure.riskCalculation.bossWeaknessWeight', $event)"
            />
          </div>

          <!-- Risk Tolerance Levels -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Risk Tolerance Thresholds</h4>
            <div class="grid grid-cols-3 gap-4">
              <ParameterSlider
                label="Safe Risk"
                :value="adventureParams.riskCalculation.riskTolerance.safe"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit="%"
                :display-multiplier="100"
                description="Maximum risk for 'safe' routes"
                path="adventure.riskCalculation.riskTolerance.safe"
                @update="updateParameter('adventure.riskCalculation.riskTolerance.safe', $event)"
              />
              
              <ParameterSlider
                label="Moderate Risk"
                :value="adventureParams.riskCalculation.riskTolerance.moderate"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit="%"
                :display-multiplier="100"
                description="Maximum risk for 'moderate' routes"
                path="adventure.riskCalculation.riskTolerance.moderate"
                @update="updateParameter('adventure.riskCalculation.riskTolerance.moderate', $event)"
              />
              
              <ParameterSlider
                label="Dangerous Risk"
                :value="adventureParams.riskCalculation.riskTolerance.dangerous"
                :min="0.0"
                :max="1.0"
                :step="0.05"
                unit="%"
                :display-multiplier="100"
                description="Maximum risk for 'dangerous' routes"
                path="adventure.riskCalculation.riskTolerance.dangerous"
                @update="updateParameter('adventure.riskCalculation.riskTolerance.dangerous', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Route Selection -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-map mr-2"></i>
          Route Selection Strategy
        </div>
        <div class="card-body space-y-4">
          <!-- Strategy Selection -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSelect
              label="Route Strategy"
              :value="adventureParams.routeSelection.strategy"
              :options="[
                { value: 'optimal', label: 'Optimal' },
                { value: 'safe', label: 'Safe' },
                { value: 'risky', label: 'Risky' },
                { value: 'random', label: 'Random' },
                { value: 'scripted', label: 'Scripted' }
              ]"
              description="How to choose which routes to attempt"
              path="adventure.routeSelection.strategy"
              @update="updateParameter('adventure.routeSelection.strategy', $event)"
            />
            
            <ParameterSelect
              label="Difficulty Preference"
              :value="adventureParams.routeSelection.difficultyPreference"
              :options="[
                { value: 'short', label: 'Short Routes' },
                { value: 'medium', label: 'Medium Routes' },
                { value: 'long', label: 'Long Routes' },
                { value: 'adaptive', label: 'Adaptive' }
              ]"
              description="Preferred route length difficulty"
              path="adventure.routeSelection.difficultyPreference"
              @update="updateParameter('adventure.routeSelection.difficultyPreference', $event)"
            />
          </div>

          <!-- Route Behavior -->
          <div class="grid grid-cols-2 gap-4">
            <ParameterSlider
              label="Energy Threshold"
              :value="adventureParams.routeSelection.energyThreshold"
              :min="10"
              :max="100"
              :step="5"
              unit=" energy"
              description="Minimum energy required before attempting adventures"
              path="adventure.routeSelection.energyThreshold"
              @update="updateParameter('adventure.routeSelection.energyThreshold', $event)"
            />
            
            <ParameterToggle
              label="Allow Backtracking"
              :value="adventureParams.routeSelection.backtrackingAllowed"
              description="Can repeat previously completed routes"
              path="adventure.routeSelection.backtrackingAllowed"
              @update="updateParameter('adventure.routeSelection.backtrackingAllowed', $event)"
            />
          </div>

          <!-- Priority Factors -->
          <div class="space-y-4">
            <h4 class="font-medium text-sim-text">Reward Priority Factors</h4>
            <div class="grid grid-cols-2 gap-4">
              <ParameterSlider
                label="Gold Priority"
                :value="adventureParams.routeSelection.priorityFactors.gold"
                :min="0.0"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Weight for gold rewards"
                path="adventure.routeSelection.priorityFactors.gold"
                @update="updateParameter('adventure.routeSelection.priorityFactors.gold', $event)"
              />
              
              <ParameterSlider
                label="Materials Priority"
                :value="adventureParams.routeSelection.priorityFactors.materials"
                :min="0.0"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Weight for material drops"
                path="adventure.routeSelection.priorityFactors.materials"
                @update="updateParameter('adventure.routeSelection.priorityFactors.materials', $event)"
              />
              
              <ParameterSlider
                label="XP Priority"
                :value="adventureParams.routeSelection.priorityFactors.xp"
                :min="0.0"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Weight for experience gains"
                path="adventure.routeSelection.priorityFactors.xp"
                @update="updateParameter('adventure.routeSelection.priorityFactors.xp', $event)"
              />
              
              <ParameterSlider
                label="Completion Priority"
                :value="adventureParams.routeSelection.priorityFactors.completion"
                :min="0.0"
                :max="3.0"
                :step="0.1"
                unit="x"
                description="Weight for route completion"
                path="adventure.routeSelection.priorityFactors.completion"
                @update="updateParameter('adventure.routeSelection.priorityFactors.completion', $event)"
              />
              
              <ParameterSlider
                label="Gnome Rescue Priority"
                :value="adventureParams.routeSelection.priorityFactors.gnomeRescue"
                :min="0.0"
                :max="5.0"
                :step="0.1"
                unit="x"
                description="Weight for rescuing helper gnomes"
                path="adventure.routeSelection.priorityFactors.gnomeRescue"
                @update="updateParameter('adventure.routeSelection.priorityFactors.gnomeRescue', $event)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Loot System -->
      <div class="card">
        <div class="card-header">
          <i class="fas fa-treasure-chest mr-2"></i>
          Loot & Rewards
        </div>
        <div class="card-body space-y-4">
          <div class="grid grid-cols-3 gap-4">
            <ParameterSlider
              label="Drop Rate Multiplier"
              :value="adventureParams.lootSystem.dropRateMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Modifier for item drop chances"
              path="adventure.lootSystem.dropRateMultiplier"
              @update="updateParameter('adventure.lootSystem.dropRateMultiplier', $event)"
            />
            
            <ParameterSlider
              label="Gold Multiplier"
              :value="adventureParams.lootSystem.goldMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Modifier for gold rewards"
              path="adventure.lootSystem.goldMultiplier"
              @update="updateParameter('adventure.lootSystem.goldMultiplier', $event)"
            />
            
            <ParameterSlider
              label="XP Multiplier"
              :value="adventureParams.lootSystem.xpMultiplier"
              :min="0.1"
              :max="5.0"
              :step="0.1"
              unit="x"
              description="Modifier for experience gains"
              path="adventure.lootSystem.xpMultiplier"
              @update="updateParameter('adventure.lootSystem.xpMultiplier', $event)"
            />
          </div>

          <div>
            <ParameterSelect
              label="Armor Strategy"
              :value="adventureParams.lootSystem.armorStrategy"
              :options="[
                { value: 'keep-best', label: 'Keep Best Stats' },
                { value: 'keep-effects', label: 'Keep Best Effects' },
                { value: 'sell-all', label: 'Sell All Armor' }
              ]"
              description="How to handle armor drops"
              path="adventure.lootSystem.armorStrategy"
              @update="updateParameter('adventure.lootSystem.armorStrategy', $event)"
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

const adventureParams = computed(() => parameterStore.effectiveParameters.adventure)

function updateParameter(path: string, value: any) {
  parameterStore.applyOverride(path, value)
}
</script>
