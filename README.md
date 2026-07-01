# NavMesh GL

A small React + Vite proof-of-concept for interactive navmesh simulation and A* pathfinding over a 2D obstacle grid.

## Framework / approach used

- UI: React with Vite.
- 3D rendering: Babylon.js.
- NavMesh visualization: Babylon.js meshes and Babylon.CSG to carve walkable space from a base ground plane.
- Pathfinding: custom A* over a dense grid of world-space samples, with line-of-sight smoothing.

## Core navmesh implementations

The project currently contains two navmesh implementations under the core folder:

- `src/components/core/navMeshCsg.js` is the active implementation used by the simulator.
- `src/components/core/navMeshPolygonal.js` is a polygonal-navmesh prototype that is currently not used because it is still running into issues.

The simulator imports and runs the CSG-based logic, while the polygonal version remains available as a reference or future work target.

## NavMesh generation strategy

The current implementation does not build a traditional polygonal navigation mesh from scratch. Instead, it:

1. Creates a full 11×11 base plate representing the walkable floor.
2. Inflates each obstacle by the agent radius (`walkableRadius`).
3. Uses Babylon.js CSG subtraction to remove the inflated obstacle volumes from the base plate.
4. Renders the resulting remaining region as a transparent walkable surface.

This produces a visual walkable area that reflects obstacle clearance, but it is not an explicit convex polygon mesh.

## NavMesh polygon merging strategy

There is no explicit polygon merging step in the current codebase.

- The navmesh is generated as a single CSG-derived mesh, not as a set of merged convex polygons.
- The system does not group adjacent cells into convex polygons or produce a polygon mesh graph.

If polygon merging were added later, the expected strategy would be:

- identify adjacent walkable cells in the underlying grid,
- merge contiguous cells into larger convex regions where possible,
- keep region boundaries aligned with obstacle edges and grid axes.

## Portal edge computation

The current implementation does not compute portal edges between adjacent navmesh polygons.

- There is no explicit portal graph or shared-edge detection step.
- Pathfinding is handled by sampling grid points and checking walkability directly.

A full portal computation would normally involve:

- enumerating adjacent polygon faces,
- finding shared boundary edges between pairs of convex polygons,
- storing those shared edges as portals for corridor-based path smoothing.

## Known issues / incomplete areas

- `NavMesh` is currently a visual CSG representation only. Pathfinding does not use a true navmesh data structure.
- There is no explicit convex polygon generation or portal graph creation in the current code.
- The pathfinder uses a dense grid search, which is simpler but less efficient than a true navmesh-based search.
- Diagonal movement is bounded by corner-cut prevention, but the grid resolution and sampling may still produce suboptimal turns.
- The demo is limited to a fixed 11×11 area and axis-aligned unit obstacles.
- Obstacle motion and dynamic navmesh updates are supported visually, but runtime navigation data remains approximate.

## Running the app

1. Install dependencies:

```bash
npm install
```

2. Start the dev server:

```bash
npm run dev
```

3. Open the app in the browser and use the grid painting controls to place obstacles, compute the navmesh, and simulate the agent path.
