// Convert 3D world space coordinate (from -5.5 to 5.5) to grid index (0 to resolution)
export function worldToGrid(coord, resolution = 55) {
  const pct = (coord + 5.5) / 11;
  return Math.max(0, Math.min(resolution, Math.round(pct * resolution)));
}

// Convert grid index (0 to resolution) to 3D world space coordinate
export function gridToWorld(index, resolution = 55) {
  return (index / resolution) * 11 - 5.5;
}

// Check if a point is walkable considering exact obstacle bounds and agent walkableRadius
export function isPositionWalkable(
  x,
  z,
  cubes,
  R = 0.4
) {
  // Check boundary constraints (ground size is 11x11, coordinates [-5.5, 5.5])
  const boundaryLimit = 5.5 - R;
  if (Math.abs(x) > boundaryLimit || Math.abs(z) > boundaryLimit) {
    return false;
  }

  // Check collision with each cube (each cube is size 1x1, spanning [cube.x-0.5, cube.x+0.5] x [cube.z-0.5, cube.z+0.5])
  for (const cube of cubes) {
    const closestX = Math.max(cube.x - 0.5, Math.min(x, cube.x + 0.5));
    const closestZ = Math.max(cube.z - 0.5, Math.min(z, cube.z + 0.5));
    const dx = x - closestX;
    const dz = z - closestZ;
    // Standard precise circle-to-box distance check
    if (dx * dx + dz * dz < R * R) {
      return false; // Intersects obstacle or its inflated buffer!
    }
  }

  return true;
}

// A* Pathfinding Algorithm on a fine-resolution continuous grid
export function findPathAStar(
  start,
  target,
  cubes,
  walkableRadius = 0.4,
  resolution = 55
) {
  const startX = worldToGrid(start.x, resolution);
  const startZ = worldToGrid(start.z, resolution);
  const targetX = worldToGrid(target.x, resolution);
  const targetZ = worldToGrid(target.z, resolution);

  // If start is same as target, return simple path
  if (startX === targetX && startZ === targetZ) {
    return [start, target];
  }

  const openSet = [];
  const closedSet = new Set();

  const startNode = {
    x: startX,
    z: startZ,
    g: 0,
    h: Math.hypot(targetX - startX, targetZ - startZ),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.h;
  openSet.push(startNode);

  let targetNode = null;

  while (openSet.length > 0) {
    // Find node with lowest f
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    const key = `${current.x},${current.z}`;
    
    if (closedSet.has(key)) {
      continue;
    }
    closedSet.add(key);

    // If reached target, break
    if (current.x === targetX && current.z === targetZ) {
      targetNode = current;
      break;
    }

    // Neighbors (including diagonals)
    const neighbors = [
      { x: current.x + 1, z: current.z },
      { x: current.x - 1, z: current.z },
      { x: current.x, z: current.z + 1 },
      { x: current.x, z: current.z - 1 },
      { x: current.x + 1, z: current.z + 1, diag: true },
      { x: current.x - 1, z: current.z + 1, diag: true },
      { x: current.x + 1, z: current.z - 1, diag: true },
      { x: current.x - 1, z: current.z - 1, diag: true },
    ];

    for (const neighbor of neighbors) {
      // Out of bounds in grid space
      if (
        neighbor.x < 0 ||
        neighbor.x > resolution ||
        neighbor.z < 0 ||
        neighbor.z > resolution
      ) {
        continue;
      }

      // Check if closed
      const neighborKey = `${neighbor.x},${neighbor.z}`;
      if (closedSet.has(neighborKey)) {
        continue;
      }

      // Convert grid node to continuous world coordinate to check walkability
      const wx = gridToWorld(neighbor.x, resolution);
      const wz = gridToWorld(neighbor.z, resolution);

      // Blocked by obstacle or out of bounds
      if (!isPositionWalkable(wx, wz, cubes, walkableRadius)) {
        continue;
      }

      // If diagonal, check corner cutting to avoid passing through diagonal obstacles
      if (neighbor.diag) {
        const corner1X = gridToWorld(current.x, resolution);
        const corner1Z = gridToWorld(neighbor.z, resolution);
        const corner2X = gridToWorld(neighbor.x, resolution);
        const corner2Z = gridToWorld(current.z, resolution);

        if (!isPositionWalkable(corner1X, corner1Z, cubes, walkableRadius) ||
            !isPositionWalkable(corner2X, corner2Z, cubes, walkableRadius)) {
          continue; // Blocked diagonal corner
        }
      }

      const moveCost = neighbor.diag ? 1.414 : 1.0;
      const gScore = current.g + moveCost;

      let existingNode = openSet.find(
        (n) => n.x === neighbor.x && n.z === neighbor.z
      );

      if (!existingNode) {
        const h = Math.hypot(targetX - neighbor.x, targetZ - neighbor.z);
        const newNode = {
          x: neighbor.x,
          z: neighbor.z,
          g: gScore,
          h: h,
          f: gScore + h,
          parent: current,
        };
        openSet.push(newNode);
      } else if (gScore < existingNode.g) {
        existingNode.g = gScore;
        existingNode.f = gScore + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  if (!targetNode) {
    // Return empty if no path
    return [];
  }

  // Reconstruct path
  const path = [];
  let curr = targetNode;
  while (curr !== null) {
    path.push({
      x: gridToWorld(curr.x, resolution),
      y: 0.1,
      z: gridToWorld(curr.z, resolution),
    });
    curr = curr.parent;
  }
  path.reverse();

  // Replace start and end with the actual input positions for precise path endpoints
  if (path.length > 0) {
    path[0] = { ...start, y: 0.1 };
    path[path.length - 1] = { ...target, y: 0.1 };
  }

  return smoothPath(path, cubes, walkableRadius);
}

// Precise continuous line-of-sight check between two points using circle-box collision
export function hasLineOfSight(
  p1,
  p2,
  cubes,
  R = 0.4
) {
  const dist = Math.hypot(p2.x - p1.x, p2.z - p1.z);
  // Sample every 0.05 units along the line segment for extreme precision
  const steps = Math.max(15, Math.ceil(dist / 0.05));

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = p1.x + (p2.x - p1.x) * t;
    const z = p1.z + (p2.z - p1.z) * t;

    if (!isPositionWalkable(x, z, cubes, R)) {
      return false;
    }
  }
  return true;
}

// Smooth path by skipping intermediate nodes that have line-of-sight
export function smoothPath(
  path,
  cubes,
  R = 0.4
) {
  if (path.length <= 2) return path;

  const smoothed = [path[0]];
  let currentIdx = 0;

  while (currentIdx < path.length - 1) {
    let bestIdx = currentIdx + 1;
    // Look ahead to find the furthest visible node
    for (let i = currentIdx + 2; i < path.length; i++) {
      if (hasLineOfSight(path[currentIdx], path[i], cubes, R)) {
        bestIdx = i;
      }
    }
    smoothed.push(path[bestIdx]);
    currentIdx = bestIdx;
  }

  return smoothed;
}

// Standard demo layouts
export const DEMO_LAYOUTS = [
  {
    name: 'Simple Corridor',
    cubes: [
      { id: 'c1', x: -1, z: -2 },
      { id: 'c2', x: -1, z: -1 },
      { id: 'c3', x: -1, z: 0 },
      { id: 'c4', x: -1, z: 1 },
      { id: 'c5', x: -1, z: 2 },
      { id: 'c6', x: 2, z: -1 },
      { id: 'c7', x: 2, z: 0 },
      { id: 'c8', x: 2, z: 1 },
      { id: 'c9', x: 2, z: 2 },
      { id: 'c10', x: 2, z: 3 },
    ],
  },
  {
    name: 'Pillar Garden',
    cubes: [
      { id: 'p1', x: -3, z: -3 },
      { id: 'p2', x: -3, z: 3 },
      { id: 'p3', x: 3, z: -3 },
      { id: 'p4', x: 3, z: 3 },
      { id: 'p5', x: 0, z: -2 },
      { id: 'p6', x: 0, z: 2 },
      { id: 'p7', x: -2, z: 0 },
      { id: 'p8', x: 2, z: 0 },
    ],
  },
  {
    name: 'Diagonal Partition',
    cubes: [
      { id: 'd1', x: -4, z: -4 },
      { id: 'd2', x: -3, z: -3 },
      { id: 'd3', x: -2, z: -2 },
      { id: 'd4', x: -1, z: -1 },
      { id: 'd5', x: 1, z: 1 },
      { id: 'd6', x: 2, z: 2 },
      { id: 'd7', x: 3, z: 3 },
      { id: 'd8', x: 4, z: 4 },
    ],
  },
];