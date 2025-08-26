// Debug row compression fix
// The issue: All nodes are getting individual rows instead of preserving grouping

// Original logs show all farm nodes had row 2, all blueprint nodes had row 1
// But compression is assigning 0,1,2,3,4 instead of keeping them grouped

// Fix: Instead of sequential assignment, preserve unique row groups
// If original rows are [2,2,2,2,2] -> all should become [0,0,0,0,0]
// If original rows are [1,1,1,1,1] -> all should become [0,0,0,0,0]
// If original rows are [1,2,3] -> should become [0,1,2]

console.log('Row compression logic:')
console.log('Original: farm nodes all at row 2, blueprints all at row 1')
console.log('Current bug: each node gets its own row 0,1,2,3,4')
console.log('Fix needed: preserve grouping - all row 2 nodes → row 0, all row 1 nodes → row 0 (per swimlane)')
