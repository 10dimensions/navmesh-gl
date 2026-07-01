// GraphConstructor.js


export function buildPortalGraph(cubes, walkableRadius = 0.4, resolution = 55) {

  const graph = {
    nodes:{},
    edges:{},
    portalEdges:{}
  };

  /*
    YOUR OLD GRID CREATION GOES HERE

    Instead of returning a grid path,
    create nodes and weighted connections.

    Example node:

  */

  let id=0;

  for(let x=0;x<=resolution;x++){
    for(let z=0;z<=resolution;z++){
      const wx = (x/resolution)*11 - 5.5;
      const wz = (z/resolution)*11 - 5.5;

      if(!isPositionWalkable(wx, wz, cubes, walkableRadius))
        continue;

      const nodeId = String(id++);

      graph.nodes[nodeId]={
        id:nodeId,
        position:{
          x:wx,
          z:wz
        }
      };

      graph.edges[nodeId]=[];
    }
  }

  /*
     Connect nearby nodes

     Cost is distance.

     Pathfinder only sees:

     node A -> node B
     cost = number

  */


  const nodes = Object.values(graph.nodes);

  for(const a of nodes){
    for(const b of nodes){
      if(a.id===b.id)
        continue;

      const dist = Math.hypot(a.position.x-b.position.x, a.position.z-b.position.z);

      if(dist < 0.25){
        graph.edges[a.id].push({
          to:b.id,
          cost:dist
        });

        graph.portalEdges[`${a.id}-${b.id}`] = {
          left:a.position,
          right:b.position
        };
      }
    }
  }

  return graph;
}


function isPositionWalkable(x, z, cubes, R) {

  const limit = 5.5-R;

  if(Math.abs(x)>limit || Math.abs(z)>limit)
    return false;

  for(const cube of cubes){
    const closestX =
      Math.max(
        cube.x-0.5,
        Math.min(
          x,
          cube.x+0.5
        )
      );


    const closestZ =
      Math.max(
        cube.z-0.5,
        Math.min(
          z,
          cube.z+0.5
        )
      );

    const dx=x-closestX;
    const dz=z-closestZ;

    if(dx*dx+dz*dz < R*R)
      return false;
  }

  return true;
}