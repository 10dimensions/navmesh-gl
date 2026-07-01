# NavMesh GL

A React + Vite demo for interactive navigation mesh visualization and A* pathfinding in a 2D obstacle field.

## Overview

`NavMesh GL` is a small proof-of-concept that demonstrates how a visual navmesh can be generated with Babylon.js CSG while running agent navigation with a separate pathfinding pipeline.

The simulator supports:

- drag-and-drop obstacle placement,
- CSG-based walkable area rendering,
- A* pathfinding with agent clearance,
- line-of-sight path smoothing,
- a simulated agent and target in the Babylon.js scene.

## Demo videos

<video controls width="640" src="public/navmesh-astar.mp4">
  Your browser does not support the video tag.
</video>

**`navmesh-astar.mp4`** — shows the alternate `Pathfinder` + `portalgraph` portal-smoothed graph pathfinding pipeline.

<video controls width="640" src="public/navmesh-csg.mp4">
  Your browser does not support the video tag.
</video>

**`navmesh-csg.mp4`** — shows the active `pathfinderCsg` grid-based pipeline.

## Architecture

### NavMesh visualization

- Implemented in `src/components/core/navMeshCsg.js`.
- Generates a translucent walkable surface by subtracting obstacle volumes from an 11×11 base plane.
- Obstacles are inflated by the agent's `walkableRadius` before subtraction.
- The resulting mesh is visual only and is not used as a runtime navigation graph.

### Pathfinding architecture

The project contains two pathfinding strategies:

1. A grid-based A* pathfinder (`src/components/core/pathfinder/pathfinderCsg.js`) — active by default.
2. A graph-based A* pathfinder with portal smoothing (`src/components/core/pathfinder/pathfinder.js` + `src/components/core/pathfinder/portalgraph.js`) — available as an alternate approach.

#### Active pathfinding: grid-based A*

- Converts world coordinates to a dense 55×55 grid.
- Checks each grid sample for walkability against inflated obstacle bounds.
- Performs A* search on sample nodes.
- Uses diagonal corner-cut prevention.
- Smooths the resulting route via line-of-sight testing.

#### Alternate pathfinding: graph-based portal smoothing

- Builds a graph of walkable sample nodes and neighbor edges.
- Uses `Pathfinder` to run A* over the graph.
- Extracts portal edges and refines the path using a funnel-style approach.
- This alternate method exists in the codebase but is currently not enabled by default.

## Simulator behavior in `NavMeshSimulator.jsx`

`src/components/NavMeshSimulator.jsx` orchestrates the Babylon scene, simulator state, and pathfinding updates.

- Imports `NavMesh` from `src/components/core/navMeshCsg.js` for rendering the walkable surface.
- Imports `findPathAStarCsg` from `src/components/core/pathfinder/pathfinderCsg.js` as the default pathfinder.
- Also imports `Pathfinder` and `buildPortalGraph` from `src/components/core/pathfinder/` for the alternate graph-based option.

The `recomputePath()` flow:

1. Reads the current agent and target positions.
2. Calls `findPathAStarCsg(start, target, currentCubes, r)`.
3. Updates `simState` with the computed path.
4. Draws the path line in the Babylon scene.

### Pathfinding strategy comparison

- Active strategy: `findPathAStarCsg(...)` performs A* directly over a sampled grid and smooths the result.
- Alternate strategy: `buildPortalGraph(...)` plus `Pathfinder(...)` would build a graph of nodes and smooth the route using portals.
- The graph-based alternative is present in the code and can be enabled, but it is currently commented out in `NavMeshSimulator.jsx`.

## File breakdown

- `src/components/NavMeshSimulator.jsx`: main simulator component and path recomputation.
- `src/components/core/navMeshCsg.js`: navmesh visualization using Babylon.js CSG.
- `src/components/core/pathfinder/pathfinderCsg.js`: default grid-based pathfinder.
- `src/components/core/pathfinder/pathfinder.js`: graph-based A* and portal extraction.
- `src/components/core/pathfinder/portalgraph.js`: graph construction for alternate pathfinding.
- `src/components/core/navMeshPolygonal.js`: experimental polygonal navmesh prototype (not currently used).

## Implementation details

- The walkable area is generated as a CSG subtraction result, not as a traditional convex polygon mesh.
- No explicit polygon merging is performed in the active runtime flow.
- The active pathfinding approach uses grid sampling, not a fully optimized navmesh graph.
- The world is constrained to a fixed 11×11 area with axis-aligned unit obstacles.

## Limitations

- `NavMesh` is a visual representation only; pathfinding does not depend on a true navmesh data structure.
- The grid-based pathfinder is simpler but less efficient than a dedicated navmesh graph search.
- Diagonal movement avoids corner cutting, but the path may still include non-optimal turns.
- The current implementation is intentionally simplified for demonstration and experimentation.

## Getting started

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the app in your browser and use the grid painting and simulation controls to test obstacle placement, navmesh rendering, and pathfinding.
