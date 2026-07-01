# NavMesh GL Design Notes

## 1. System architecture

### Conceptual components

- **NavMeshManager**
  - Mapped to `src/components/core/navMeshCsg.js`.
  - Responsible for generating the visual walkable surface from the current obstacle set.
  - In the current implementation, it is a renderer rather than a runtime navigation structure.
  - It is invoked from `NavMeshSimulator.jsx` via `navMesh.rebuildNavMesh(...)`.

- **Pathfinder**
  - Implemented by `src/components/core/pathfinder/pathfinderCsg.js` for the active simulation path.
  - Optionally, `src/components/core/pathfinder/pathfinder.js` and `portalgraph.js` provide an alternate graph-based pathfinder.
  - The active pathfinder converts start/target positions into grid samples, runs A* on that sampled grid, and then smooths the path.

- **AgentController**
  - Conceptually implemented by `SceneControl` and `SimControl` together.
  - `SceneControl` manages agent/target mesh creation, path-line rendering, and animation updates.
  - `SimControl` exposes playback controls (`togglePlayPause`, `stepForward`, `stepBackward`, `resetSimulation`, `changeSpeed`).
  - The simulated agent moves along `simState.path` and updates the Babylon scene.

- **State machine**
  - Root state is managed inside `NavMeshSimulator.jsx`.
  - Two main state domains exist:
    - UI/app step state: `step` can be `edit`, `navmesh`, or `simulate`.
    - Simulation state: `simState` keeps `isPlaying`, `status`, `path`, `currentWaypointIndex`, `progress`, and `speed`.
  - `stateRef` mirrors React state for the 60Hz render loop and scene updates.
  - Changing `step` triggers different behaviors: navmesh rebuild in `navmesh`/`simulate`, path recomputation in `simulate`, and simulation pause when leaving `simulate`.

- **UI layer**
  - Composed of React components such as `Steps`, `GridPainting`, `NavMeshWidget`, `PathFinder`, `Header`, and `Footer`.
  - The UI updates shared state via React setters like `setCubes`, `setNavParams`, `setStep`, `setAgentPos`, `setTargetPos`, and `setSimState`.
  - User actions propagate into the core simulation through React state updates, which in turn trigger effects and core rebuilds.

### Communication flow

1. User interacts with the UI.
2. UI updates React state in `NavMeshSimulator.jsx`.
3. `useEffect` hooks detect state changes and propagate them to core modules:
   - cube changes -> `SceneControl.rebuildCubesMeshes` and navmesh rebuild.
   - navmesh parameter changes -> navmesh rebuild.
   - simulation entry or move -> `recomputePath()`.
4. `recomputePath()` calls the active pathfinder and updates `simState.path`.
5. `SceneControl.animateAgentStep()` reads `stateRef.current.simState` each render frame to move the agent.
6. Playback commands from `SimControl` mutate simulation state and update the scene.
### Architecture flow chart

```
 UI Layer
    |
    v
NavMeshSimulator.jsx
    |\
    | \---> SceneControl
    | |        |
    | |        v
    | |   Babylon.js Scene
    | |
    | +---> SimControl
    |          |
    |          v
    |      Agent Playback
    |
    +---> NavMeshManager (navMeshCsg.js)
    |          |
    |          v
    |      Walkable Mesh
    |
    +---> Pathfinder (pathfinderCsg.js)
               |
               v
           Path Data -> NavMeshSimulator.jsx
```
## 2. Incremental rebuild

### Current rebuild behavior

- A single cube move currently triggers a full rebuilding sequence:
  - `SceneControl.rebuildCubesMeshes` disposes and recreates all obstacle meshes.
  - `NavMesh.rebuildNavMesh` recomputes the entire CSG walkable surface by subtracting every inflated obstacle from the base plate.
  - `recomputePath()` reruns the active grid-based A* search from scratch.

### Worst-case cost

- Mesh rebuild cost is roughly O(C), where `C` is the number of cubes, because all cube meshes are reconstructed.
- Navmesh rebuild cost is O(C) CSG subtraction operations in the current implementation, plus all temporary mesh creation/disposal overhead.
- Pathfinding cost is the full grid search overhead: in the current implementation, open-set sorting makes the A* loop closer to O(G^2) in the worst case, where `G` is the number of sampled grid nodes.

### Region invalidation

- The current code has no explicit region invalidation.
- If it were introduced, the natural invalidation region is the obstacle's local influence circle with radius `walkableRadius + obstacleHalfSize`.
- A bounded region could limit recomputation to the portion of the navmesh and sampled graph near the moved cube.
- For pathfinding, a localized repair strategy could rechunk the A* search space around the moved obstacle instead of recomputing from scratch.

## 3. Tradeoffs

### Simplifications made for speed

- The navmesh is treated as a visual CSG surface rather than a true runtime polygon mesh.
- The active pathfinder uses dense grid sampling and exact obstacle clearance checks instead of a fully-formed navigation mesh.
- Graph-based pathfinding and portal smoothing are kept as an alternate implementation but are not the default runtime path.
- There is no spatial index for obstacles; collision and walkability checks scan every cube.
- Rebuilds are global rather than incremental, removing the need for region tracking.
- A* uses a simple array-based open set sorted on each iteration rather than a priority queue.

### Next priorities if time permitted

- Build a true polygonal navmesh pipeline with explicit convex regions.
- Implement an incremental navmesh update path when a cube moves or changes.
- Replace full-grid A* with a graph-based search over navmesh nodes and portals.
- Add spatial indexing for obstacle collision tests (uniform grid, BVH, or R-tree).
- Replace open-set sorting with a binary heap or bucket-based priority queue.
- Introduce a clear separation between visual navmesh generation and runtime navigation data.

## 4. Scaling

### Handling 10,000 sampled cells and hundreds of cubes

If the project scaled to a larger scene, the current approach would not be sufficient.

Potential improvements:

- **Uniform grid / spatial hash**
  - Use a uniform cell grid for obstacle lookups and walkability queries.
  - For each sample query, only test obstacles in nearby grid cells instead of all cubes.
  - This is a natural fit for a dense regular sample grid and can reduce collision costs from O(C) to O(1) average per query.

- **BVH over cubes**
  - Build a bounding volume hierarchy for obstacles.
  - Use it for faster collision and line-of-sight checks when the number of cubes grows.
  - A BVH can limit expanded obstacle intersection tests to O(log C) nodes.

- **R-tree over polygons**
  - If the system moved to a polygonal navmesh, an R-tree would accelerate spatial region queries and adjacency lookups.
  - It would help with locating the nearest walkable region, nearest portal, or impacted polygon after obstacle movement.

- **Sparse or hierarchical grid representation**
  - Represent the sampled navigation space sparsely if large regions are empty.
  - Use a quadtree or chunked grid to avoid allocating all 10,000 samples when only a portion of the world contains obstacles.

- **Efficient A***
  - Use a binary heap or radix heap for the open set instead of sorting arrays.
  - Store node metadata in typed arrays or flat objects to reduce allocation churn.
  - Consider hierarchical pathfinding: coarse search on a simplified graph, then local refinement.

### Data structure recommendations

- Use a uniform grid or spatial hash for per-sample obstacle culling.
- Use a BVH for obstacle geometry tests when hundreds of cubes are present.
- Use an R-tree or polygon index if switching to mesh-based navigation regions.
- Keep the visual CSG mesh separate from the search graph to avoid expensive mesh operations during pathfinding.

## 5. Performance

### Main concerns

- **Polygon count / visual complexity**
  - Babylon.js CSG creates a single combined mesh, but CSG operations can be expensive and generate complex geometry.
  - The current solution keeps the scene simple by using a single base plate and subtracting a small number of inflated cubes.

- **A* search space**
  - The active pathfinder searches a dense sampled grid and may explore many nodes.
  - The current implementation uses array sorting on each iteration, which is a performance bottleneck at scale.

- **Funnel recomputation**
  - The alternate graph-based pipeline would need portal extraction and funnel smoothing.
  - The current default flow avoids this cost by using a grid path smoother instead of a true funnel algorithm.

### How these concerns were addressed

- The implementation separates visual navmesh rendering from pathfinding, avoiding expensive mesh queries during search.
- A line-of-sight smoothing pass post-processes the A* result to reduce path length and waypoint count.
- The grid search is constrained by world bounds and exact obstacle clearance, which keeps the search space bounded.
- In the current prototype, the simplicity of arrays and direct scans is acceptable for the demo-scale scene.

### Future performance improvements

- Replace open-set sorting with a priority queue for A*.
- Use obstacle spatial indexing to avoid scanning all cubes for every walkability query.
- Cache walkability or precompute a boolean occupancy grid so that repeated queries reuse results.
- Limit navmesh rebuilds to the localized region touched by a cube move.
- Move from CSG-based visual navmesh generation to a polygonal mesh workflow with explicit region adjacency.

## Summary

The current implementation is intentionally simple and exploratory. It emphasizes a clear demo of navmesh-like rendering and A* pathfinding, while leaving room for future work on true runtime navmesh data, incremental rebuilds, spatial indexing, and scale-appropriate search structures.