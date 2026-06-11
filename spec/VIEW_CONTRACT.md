# ExGraph View Contract v0

## Purpose

The HTML UI is implementation detail. It may be generated or replaced by another Agent.

The normative layer is the view behavior contract.

A UI implementation is acceptable if it satisfies this contract, even if the visual design changes entirely.

## Required user questions

The viewer must help users answer:

1. What is the current mainline?
2. What is the current frontier?
3. What is blocked, and why?
4. What is closed or archived?
5. Why does a selected node exist?
6. What supports, refutes, blocks, or supersedes the selected node?
7. What does the selected node affect?
8. What diagnostics did the engine produce?

## Required view capabilities

The viewer must support:

- Displaying the normalized graph.
- Switching between `flow`, `cluster`, and `frontier` views.
- Filtering by `node.kind`.
- Filtering by `node.state`.
- Filtering by `edge.kind`.
- Filtering/highlighting by `sets`.
- Searching nodes by id/title/note/tags.
- Hiding or showing `closed` / `archived` nodes.
- Clicking a node to show its details.
- Showing incoming edges for the selected node.
- Showing outgoing edges for the selected node.
- Showing `note` and `state_note`.
- Showing diagnostics.

## Required view semantics

### Flow

Purpose: show directional paths, dependencies, and convergence.

Recommended implementation: directed graph layout such as dagre or ELK.

### Cluster

Purpose: show local groups and competing branches.

Recommended implementation: force/constraint layout such as fcose.

### Frontier

Purpose: show current work memory.

Expected spatial semantics:

- `mainline` near the center.
- `frontier` near mainline.
- `parking` and candidates farther out.
- `closed` and `archived` nodes outer, dimmed, or collapsible.

## Non-requirements

The viewer must not require:

- Browser-side graph editing.
- Saved layout coordinates.
- Drag-and-drop node placement.
- Domain-specific UI logic.

## UI implementation status

v0 implementation may use plain TypeScript and Cytoscape.js.

Future implementations may use Svelte, Solid, Vue, React, or another UI layer as long as they satisfy this contract.
