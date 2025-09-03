Context
-------

After Phase 10I verifies full integration of SimulationOrchestrator, we can safely remove the legacy SimulationEngine and clean up the codebase. This phase ensures no technical debt remains from the refactor.

Objectives
----------

1.  Archive SimulationEngine.ts for historical reference
    
2.  Remove any duplicate or dead code
    
3.  Optimize import paths and module structure
    
4.  Update all documentation to reflect final architecture
    
5.  Create comprehensive handoff documentation
    

Tasks
-----

### 1\. Legacy Code Archival (30 minutes)

bash

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   # Create archive directory  mkdir -p /src/utils/archive/phase10-legacy  # Move old engine with timestamp  mv /src/utils/SimulationEngine.ts /src/utils/archive/phase10-legacy/SimulationEngine.legacy.ts  # Add README explaining the archive  echo "# Legacy SimulationEngine  Archived: [DATE]  Original: 5,659 lines  Replaced by: SimulationOrchestrator (501 lines) + 13 specialized systems  See /Docs/Sim Design/Phase 10/ for refactor history" > /src/utils/archive/phase10-legacy/README.md   `

### 2\. Dead Code Removal (1 hour)

Search and remove:

*   Commented-out code referencing old engine
    
*   Unused imports in system files
    
*   Duplicate type definitions
    
*   Test files for SimulationEngine
    
*   Any TODO comments referencing the refactor
    

### 3\. Import Path Optimization (30 minutes)

*   Create barrel exports for systems: /src/utils/systems/index.ts
    
*   Standardize import paths across codebase
    
*   Remove circular dependencies if any remain
    
*   Update tsconfig paths for cleaner imports
    

### 4\. Module Structure Cleanup (45 minutes)

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   /src/utils/  ├── orchestration/  │   ├── SimulationOrchestrator.ts  │   ├── ConfigurationManager.ts  │   └── StateManager.ts  ├── systems/  │   ├── core/       # Game loop systems  │   ├── support/    # Helper systems  │   └── index.ts    # Barrel export  ├── workers/  │   └── (worker-related files)  └── archive/      └── phase10-legacy/   `

### 5\. Documentation Finalization (1 hour)

#### Update Master References

*   /Docs/App Build/SimulationEngine-As-Built.md - Mark as FINAL
    
*   /Docs/Sim Design/Phase 10/Phase10-Final-Report.md - Create summary
    
*   /src/utils/README.md - Document new architecture
    

#### Create Architecture Diagram

mermaid

Plain textANTLR4BashCC#CSSCoffeeScriptCMakeDartDjangoDockerEJSErlangGitGoGraphQLGroovyHTMLJavaJavaScriptJSONJSXKotlinLaTeXLessLuaMakefileMarkdownMATLABMarkupObjective-CPerlPHPPowerShell.propertiesProtocol BuffersPythonRRubySass (Sass)Sass (Scss)SchemeSQLShellSwiftSVGTSXTypeScriptWebAssemblyYAMLXML`   graph TD      A[SimulationOrchestrator   501 lines] --> B[Core Systems]      A --> C[Support Systems]      B --> D[FarmSystem   1,092 lines]      B --> E[TowerSystem   547 lines]      B --> F[TownSystem   662 lines]      B --> G[AdventureSystem   1,454 lines]      B --> H[MineSystem   389 lines]      B --> I[ForgeSystem   718 lines]      B --> J[HelperSystem   1,288 lines]      C --> K[OfflineProgressionSystem]      C --> L[PrerequisiteSystem]      C --> M[SeedSystem]      C --> N[SupportSystemManager]   `

### 6\. Performance Benchmark Report (30 minutes)

Create final performance comparison:

*   Before: SimulationEngine.ts (5,659 lines)
    
*   After: SimulationOrchestrator.ts (501 lines) + Systems
    
*   Tick performance: \[benchmark results\]
    
*   Memory usage: \[profiling results\]
    
*   Code maintainability: \[metrics\]
    

Success Criteria
----------------

*   SimulationEngine.ts no longer exists in active codebase
    
*   All imports use new architecture
    
*   Zero TypeScript errors
    
*   Documentation fully updated
    
*   Clean git history with proper commit messages
    

Final Checklist
---------------

*   Run full test suite one final time
    
*   Create git tag v2.0.0-refactor-complete
    
*   Update CHANGELOG.md
    
*   Notify team of architecture changes
    
*   Close all Phase 10 related issues
    

Estimated Time: 3.5 hours
-------------------------

Deliverables
------------

1.  Clean, refactored codebase
    
2.  Complete documentation package
    
3.  Performance benchmark report
    
4.  Migration guide for future developers