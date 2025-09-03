Context
-------

Phase 10A-H successfully refactored SimulationEngine from 5,659 lines to a clean 501-line SimulationOrchestrator. However, the old SimulationEngine.ts still exists (650 lines) and we need to verify the new architecture is fully integrated before deletion.

Objectives
----------

1.  Verify SimulationOrchestrator is actually being used by all integration points
    
2.  Update all imports from SimulationEngine to SimulationOrchestrator
    
3.  Run comprehensive integration tests
    
4.  Ensure worker bridge uses new orchestrator
    
5.  Validate all views work with new architecture
    

Tasks
-----

### 1\. Integration Audit (30 minutes)

*   Check /src/workers/simulationWorker.ts - uses SimulationOrchestrator?
    
*   Check /src/utils/SimulationBridge.ts - references correct engine?
    
*   Check /src/stores/simulationStore.ts - imports correct engine?
    
*   Check all test files - using new orchestrator?
    
*   Search codebase for SimulationEngine imports
    

### 2\. Update Integration Points (1 hour)

typescript

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   // Update all instances of:  import { SimulationEngine } from './utils/SimulationEngine'  // To:  import { SimulationOrchestrator } from './utils/SimulationOrchestrator'   `

Files likely needing updates:

*   /src/workers/simulationWorker.ts
    
*   /src/utils/SimulationBridge.ts
    
*   /src/utils/monteCarloManager.ts
    
*   /src/utils/workerManager.ts
    
*   All test files in /src/tests/
    

### 3\. Verification Testing (1 hour)

Run full test suite for each persona:

*   Speedrunner persona - full simulation to endgame
    
*   Casual Player persona - verify helper automation
    
*   Weekend Warrior persona - test offline progression
    
*   Monte Carlo analysis - 50 runs minimum
    
*   A/B testing - verify comparison works
    

### 4\. Performance Validation (30 minutes)

*   Benchmark 1000 ticks - confirm <1000ms total
    
*   Memory profiling - no leaks in orchestrator
    
*   Worker communication - same or better performance
    
*   UI responsiveness - LiveMonitor updates smoothly
    

### 5\. Critical Feature Verification (30 minutes)

Manually test the three previously broken features:

*   **Seed Catching**: Start catching seeds, verify completion and rewards
    
*   **Helper Assignment**: Assign gnome roles, verify persistence
    
*   **Combat Calculations**: Run adventures, verify damage is correct
    

Success Criteria
----------------

*   Zero imports of SimulationEngine remain (except in legacy/backup)
    
*   All automated tests pass
    
*   All three personas reach endgame successfully
    
*   Performance benchmarks maintained or improved
    
*   No regression in previously fixed bugs
    

Documentation Updates
---------------------

*   Update /src/utils/README.md with new architecture
    
*   Add migration notes for future developers
    
*   Document any discovered edge cases
    

Estimated Time: 3.5 hours
-------------------------

Risk Mitigation
---------------

*   Keep SimulationEngine.ts as backup until Phase 10J
    
*   Create git branch phase-10i-integration before changes
    
*   Run tests after each integration point update