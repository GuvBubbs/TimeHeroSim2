# Implementation Plan

- [x] 1. Fix core swimlane assignment logic
  - Enhance the `determineSwimLane()` function in `src/utils/graphBuilder.ts` to properly categorize all items
  - Add comprehensive mapping for town vendor files and game features
  - Implement fallback logic for unrecognized items
  - Add debug logging to track assignment decisions
  - _Requirements: 1.1, 1.2, 1.3, 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Implement boundary enforcement system
  - Modify `calculateNodePosition()` function to enforce strict lane boundaries
  - Add boundary validation that prevents nodes from spilling outside their lanes
  - Implement position adjustment logic when calculated positions exceed boundaries
  - Add warning system for overcrowded lanes with compression fallback
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] 3. Fix lane height calculation accuracy
  - Update `calculateLaneHeights()` to properly account for actual node distribution
  - Ensure lane heights accommodate the maximum nodes per tier within each lane
  - Add buffer space calculation that matches the positioning logic
  - Implement dynamic height adjustment based on content
  - _Requirements: 2.1, 2.2, 2.4, 3.1, 3.2_

- [x] 4. Implement proper swimlane visual backgrounds
  - Fix the `addSwimLaneVisuals()` function in `UpgradeTreeView.vue` to generate proper lane backgrounds
  - Ensure backgrounds align with actual node positions and calculated boundaries
  - Implement alternating background colors for visual distinction
  - Add proper z-index management to keep backgrounds behind nodes
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Add visible swimlane labels
  - Implement lane label generation with proper positioning on the left side
  - Ensure labels are centered vertically within their respective lanes
  - Apply proper styling for visibility and readability
  - Fix z-index issues to ensure labels are always visible
  - _Requirements: 2.1, 2.3, 4.5_

- [x] 6. Implement feature-based node coloring
  - Add color mapping system based on game features in Cytoscape styles
  - Update node classes to include feature-specific styling
  - Ensure color distinction between different game systems (Farm=green, Combat=red, etc.)
  - Apply consistent color scheme across all nodes
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 7. Add comprehensive position validation
  - Create validation system that checks all node positions against lane boundaries
  - Implement automated testing for boundary compliance
  - Add validation warnings and error reporting
  - Create debug output showing position calculations and boundary checks
  - _Requirements: 5.4, 5.5, 6.4, 6.5_

- [x] 8. Enhance vertical node distribution within lanes
  - Improve the vertical spacing algorithm for nodes within the same tier and lane
  - Implement even distribution when nodes fit comfortably
  - Add compression logic for overcrowded lanes while maintaining minimum spacing
  - Ensure single nodes are centered within their lane
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [ ] 9. Fix coordinate system consistency
  - Ensure all positioning calculations use the same coordinate system and constants
  - Verify that `LAYOUT_CONSTANTS` are consistently applied across all functions
  - Fix any discrepancies between lane height calculation and node positioning
  - Add coordinate system validation and debugging output
  - _Requirements: 3.5, 5.4, 6.4_

- [ ] 10. Integrate tier-based positioning with swimlane system
  - Ensure horizontal tier positioning works correctly with vertical lane containment
  - Maintain prerequisite-based left-to-right flow while enforcing lane boundaries
  - Verify that prerequisite edges connect properly positioned nodes
  - Add validation for tier alignment across lanes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 11. Add error handling and recovery systems
  - Implement fallback positioning when boundary enforcement fails
  - Add recovery logic for overcrowded lanes
  - Create emergency spacing algorithms for extreme cases
  - Add user-friendly error messages and warnings
  - _Requirements: 5.2, 5.3, 5.5_

- [ ] 12. Create comprehensive testing and validation
  - Write unit tests for swimlane assignment logic
  - Create visual validation tests for boundary compliance
  - Add performance tests for large datasets
  - Implement automated testing for lane organization
  - _Requirements: 4.4, 5.4, 6.4_

- [ ] 13. Add debug and monitoring capabilities
  - Enhance console logging for swimlane assignments and positioning
  - Add visual debugging tools to highlight lane boundaries
  - Create assignment statistics and validation reports
  - Implement real-time position monitoring during development
  - _Requirements: 4.5, 5.5_

- [ ] 14. Optimize performance and memory usage
  - Profile the enhanced positioning system for performance bottlenecks
  - Optimize lane calculation algorithms for large datasets
  - Ensure no memory leaks in the visual rendering system
  - Add performance monitoring for render times
  - _Requirements: 2.5_

- [ ] 15. Final integration and polish
  - Integrate all swimlane fixes with existing graph rebuild functionality
  - Ensure compatibility with search, filtering, and family tree features
  - Add smooth transitions for visual changes
  - Perform comprehensive testing with full dataset
  - _Requirements: 1.1, 2.5, 3.5, 4.4, 5.4, 6.5_