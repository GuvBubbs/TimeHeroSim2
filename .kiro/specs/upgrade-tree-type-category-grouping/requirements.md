# Requirements Document

## Introduction

The Upgrade Tree Type and Category Grouping Enhancement builds upon the existing swimlane system to provide advanced organization within each swimlane based on the `type` and `categories` columns from CSV data. Currently, nodes within swimlanes are positioned only by tier (prerequisite depth), but users need to see logical groupings of related items. For example, in the Forge swimlane, all farm tools should be grouped together with hoes in one row, hammers in another row, etc., while still maintaining left-to-right prerequisite flow. Additionally, this feature addresses node boundary drift issues and improves edge visibility for parent/child relationships.

## Requirements

### Requirement 1

**User Story:** As a game designer, I want nodes within each swimlane to be grouped by type first, then by categories, so that I can easily see related items organized together.

#### Acceptance Criteria

1. WHEN nodes are positioned within a swimlane THEN they SHALL be grouped first by their `type` column value from CSV data
2. WHEN nodes share the same type THEN they SHALL be sub-grouped by their `categories` column value
3. WHEN nodes share the same category THEN they SHALL be positioned in the same horizontal row within their swimlane
4. WHEN a type has no categories defined THEN nodes of that type SHALL be grouped together without sub-categorization
5. WHEN calculating positions THEN the system SHALL maintain prerequisite-based left-to-right flow within each category group

### Requirement 2

**User Story:** As a game designer, I want all swimlanes to show clear organization through logical positioning, so that I can read the upgrade progression from left to right in a clean, understandable order.

#### Acceptance Criteria

1. WHEN nodes within any swimlane share the same category THEN they SHALL be positioned in the same horizontal row
2. WHEN nodes within a category have prerequisites THEN they SHALL maintain left-to-right positioning while staying in their category row
3. WHEN multiple levels of the same item exist (e.g., Spear I, II, III) THEN they SHALL appear in the same row with proper prerequisite ordering
4. WHEN viewing any swimlane THEN the eye SHALL be able to read upgrade progressions from left to right in a logical order
5. WHEN type groups are positioned THEN they SHALL be organized vertically within the swimlane for clear visual separation

### Requirement 3

**User Story:** As a game designer, I want nodes to stay within their designated swimlane boundaries, so that the visual organization remains clear and professional.

#### Acceptance Criteria

1. WHEN nodes are positioned THEN they SHALL never extend outside their assigned swimlane's vertical boundaries
2. WHEN the Forge swimlane contains many nodes THEN they SHALL be compressed within the lane rather than spilling into adjacent lanes
3. WHEN the Tower swimlane is rendered THEN all tower nodes SHALL remain within the Tower lane boundaries
4. WHEN category rows become crowded THEN nodes SHALL use minimum acceptable spacing while staying within lane bounds
5. WHEN boundary violations are detected THEN the system SHALL log warnings and apply corrective positioning

### Requirement 4

**User Story:** As a game designer, I want to see clear visual lines connecting parent and child nodes across swimlanes, so that I can understand cross-system dependencies.

#### Acceptance Criteria

1. WHEN a node has prerequisites in other swimlanes THEN visible edges SHALL connect them with clear lines
2. WHEN edges cross swimlane boundaries THEN they SHALL be visually distinct and easy to follow
3. WHEN edges connect nodes THEN they SHALL come out of the right side of parent nodes and enter the left side of child nodes
4. WHEN multiple edges exist THEN they SHALL not overlap in ways that obscure the connections
5. WHEN edges are rendered THEN they SHALL have sufficient contrast against the swimlane backgrounds

### Requirement 5

**User Story:** As a game designer, I want consistent vertical spacing achieved through logical positioning alone, so that the organization is clear without requiring additional visual elements.

#### Acceptance Criteria

1. WHEN type groups are positioned THEN there SHALL be consistent spacing between different type groups within a swimlane
2. WHEN category rows are positioned THEN there SHALL be consistent spacing between rows within a type group  
3. WHEN nodes are organized THEN the logical positioning SHALL create clear visual organization without requiring additional visual indicators
4. WHEN calculating group spacing THEN the system SHALL ensure all groups fit within the swimlane boundaries
5. WHEN the tree is rendered THEN users SHALL be able to understand the organization through positioning alone

### Requirement 6

**User Story:** As a game designer, I want the system to handle edge cases gracefully, so that the tree remains functional even with incomplete or inconsistent data.

#### Acceptance Criteria

1. WHEN a node has a type but no category THEN it SHALL be grouped with other nodes of the same type
2. WHEN a node has no type or category data THEN it SHALL be positioned using the existing tier-based system
3. WHEN category data is inconsistent THEN the system SHALL use fallback grouping logic
4. WHEN a swimlane becomes overcrowded THEN the system SHALL compress groups while maintaining readability
5. WHEN grouping fails THEN the system SHALL fall back to the existing positioning system with appropriate warnings

### Requirement 7

**User Story:** As a game designer, I want the existing swimlane functionality to be preserved exactly as it currently works, so that the new grouping features don't break the positioning system that's already working well.

#### Acceptance Criteria

1. WHEN the new grouping system is implemented THEN existing swimlane boundaries SHALL remain exactly the same size and position
2. WHEN nodes are processed by the new system THEN they SHALL still be assigned to the correct swimlanes using the existing logic
3. WHEN the grouping system is disabled or fails THEN the tree SHALL render exactly as it does currently
4. WHEN swimlane positioning is calculated THEN the existing algorithms SHALL be preserved and used as the foundation
5. WHEN testing the new features THEN all existing swimlane functionality SHALL pass validation without any regressions