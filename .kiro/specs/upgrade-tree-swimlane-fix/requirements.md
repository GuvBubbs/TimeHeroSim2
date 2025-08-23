# Requirements Document

## Introduction

The Upgrade Tree Swimlane Positioning Fix addresses critical positioning issues in the existing Phase 3 upgrade tree visualization. Currently, nodes are not consistently positioned within their correct swimlanes, causing visual confusion and breaking the intended Civilization V-style tech tree organization. This feature ensures proper node containment within designated swimlanes, accurate visual alignment, and consistent spacing throughout the 14-lane system.

## Requirements

### Requirement 1

**User Story:** As a game designer, I want all upgrade nodes to be positioned within their correct swimlanes, so that I can clearly understand which game system each upgrade belongs to.

#### Acceptance Criteria

1. WHEN the upgrade tree loads THEN all nodes SHALL be positioned within the vertical boundaries of their assigned swimlane
2. WHEN a node belongs to the "Farm" swimlane THEN it SHALL appear only within the Farm lane's vertical space
3. WHEN a node belongs to a specific town vendor (Blacksmith, Agronomist, etc.) THEN it SHALL appear only within that vendor's designated lane
4. IF a node's calculated position would place it outside its lane boundaries THEN the system SHALL adjust the position to keep it within bounds
5. WHEN multiple nodes exist in the same tier within a lane THEN they SHALL be distributed vertically within that lane's boundaries only

### Requirement 2

**User Story:** As a game designer, I want the swimlane visual backgrounds to accurately reflect where nodes are positioned, so that the lane organization is visually clear and consistent.

#### Acceptance Criteria

1. WHEN swimlane backgrounds are rendered THEN they SHALL encompass all nodes assigned to that lane with appropriate padding
2. WHEN a lane contains nodes THEN the background SHALL extend from the topmost to bottommost node in that lane plus buffer space
3. WHEN a lane is empty THEN it SHALL display a minimal background with the lane label visible
4. WHEN lane backgrounds are positioned THEN they SHALL align continuously without gaps or overlaps
5. WHEN the graph is rebuilt THEN lane backgrounds SHALL automatically resize to match the actual node positions

### Requirement 3

**User Story:** As a game designer, I want consistent node spacing within each swimlane, so that the upgrade tree maintains a professional and organized appearance.

#### Acceptance Criteria

1. WHEN multiple nodes exist in the same tier within a lane THEN they SHALL be evenly distributed with consistent spacing
2. WHEN a lane becomes crowded THEN the system SHALL use minimum acceptable spacing while keeping all nodes within lane boundaries
3. WHEN nodes are positioned vertically THEN they SHALL maintain at least 15px spacing between adjacent nodes
4. WHEN a single node exists in a tier within a lane THEN it SHALL be centered vertically within that lane
5. WHEN calculating node positions THEN the system SHALL use standardized constants for consistent spacing across all lanes

### Requirement 4

**User Story:** As a game designer, I want accurate swimlane assignment based on game data, so that upgrades appear in the correct functional categories.

#### Acceptance Criteria

1. WHEN an item comes from a town vendor CSV file THEN it SHALL be assigned to the specific vendor's swimlane (Blacksmith, Agronomist, etc.)
2. WHEN an item's source file indicates a game feature THEN it SHALL be assigned to the corresponding swimlane (Farm, Tower, Adventure, etc.)
3. WHEN an item cannot be categorized THEN it SHALL be assigned to the "General" swimlane as a fallback
4. WHEN the swimlane assignment logic runs THEN it SHALL produce consistent results for the same input data
5. WHEN debugging swimlane assignments THEN the system SHALL log which lane each item is assigned to and why

### Requirement 5

**User Story:** As a game designer, I want proper boundary enforcement for node positioning, so that no nodes appear outside their designated swimlanes regardless of tier density.

#### Acceptance Criteria

1. WHEN calculating node positions THEN the system SHALL enforce maximum Y coordinates based on lane boundaries
2. WHEN a lane becomes overcrowded THEN nodes SHALL be compressed within the lane rather than spilling into adjacent lanes
3. WHEN nodes are positioned at the bottom of a lane THEN they SHALL not exceed the lane's bottom boundary minus appropriate buffer space
4. WHEN the positioning algorithm runs THEN it SHALL validate that all final positions are within their respective lane boundaries
5. WHEN boundary violations are detected THEN the system SHALL log warnings and apply corrective positioning

### Requirement 6

**User Story:** As a game designer, I want the tier-based horizontal positioning to work correctly with the swimlane system, so that prerequisite relationships are visually clear while maintaining lane organization.

#### Acceptance Criteria

1. WHEN nodes have prerequisites THEN they SHALL be positioned to the right of their prerequisite nodes horizontally
2. WHEN nodes are in the same tier THEN they SHALL be aligned vertically within their respective swimlanes
3. WHEN calculating horizontal positions THEN the system SHALL use consistent tier width spacing across all lanes
4. WHEN prerequisite edges are drawn THEN they SHALL connect nodes that are properly positioned within their lanes
5. WHEN the horizontal positioning is calculated THEN it SHALL not interfere with the vertical swimlane containment