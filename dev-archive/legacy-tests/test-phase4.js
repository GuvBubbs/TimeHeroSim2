// Test Phase 4 Personas Implementation
// Simple verification script

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🎯 Testing Phase 4 Personas Implementation...\n')

// Test 2: Check if store file exists and is valid

const storeFile = path.join(__dirname, 'src/stores/personas.ts')
if (fs.existsSync(storeFile)) {
  console.log('✅ Persona store file exists')
  const content = fs.readFileSync(storeFile, 'utf8')
  
  if (content.includes('defineStore')) {
    console.log('✅ Store uses Pinia defineStore pattern')
  }
  
  if (content.includes('SimplePersona')) {
    console.log('✅ Store imports SimplePersona type')
  }
  
  if (content.includes('speedrunner') && content.includes('casual') && content.includes('weekend-warrior')) {
    console.log('✅ All three preset personas defined')
  }
} else {
  console.log('❌ Persona store file not found')
}

// Test 3: Check if components exist
const componentsDir = path.join(__dirname, 'src/components/PlayerPersonas')
if (fs.existsSync(componentsDir)) {
  console.log('✅ PlayerPersonas components directory exists')
  
  const components = ['PersonaCard.vue', 'PersonaDetails.vue', 'PersonaBuilder.vue', 'PersonaSlider.vue']
  components.forEach(comp => {
    if (fs.existsSync(path.join(componentsDir, comp))) {
      console.log(`✅ ${comp} exists`)
    } else {
      console.log(`❌ ${comp} missing`)
    }
  })
} else {
  console.log('❌ PlayerPersonas components directory not found')
}

// Test 4: Check PersonasView.vue
const viewFile = path.join(__dirname, 'src/views/PersonasView.vue')
if (fs.existsSync(viewFile)) {
  console.log('✅ PersonasView.vue exists')
  const content = fs.readFileSync(viewFile, 'utf8')
  
  if (content.includes('usePersonaStore')) {
    console.log('✅ PersonasView imports persona store')
  }
  
  if (content.includes('PersonaCard')) {
    console.log('✅ PersonasView uses PersonaCard component')
  }
} else {
  console.log('❌ PersonasView.vue not found')
}

console.log('\n🎯 Phase 4 implementation check complete!')
console.log('Ready to test at: http://localhost:5179/TimeHeroSim2/#/personas')
