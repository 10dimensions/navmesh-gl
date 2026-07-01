// Pathfinder.js

export class Pathfinder {

  constructor(portalGraph) {
    this.graph = portalGraph;
  }

  findPath(startNode, targetNode) {
    const nodePath =this.aStar(startNode.id, targetNode.id);

    if(nodePath.length === 0) return [];

    const portals = this.extractPortals(nodePath);

    return this.funnel(startNode.position, targetNode.position, portals);
  }

  aStar(startId, goalId) {
    const openSet = new Set([startId]);
    const closedSet = new Set();

    const cameFrom = {};

    const gScore = {};
    const fScore = {};

    for(const id in this.graph.nodes){
      gScore[id] = Infinity;
      fScore[id] = Infinity;
    }

    gScore[startId]=0;

    fScore[startId] = this.heuristic(this.graph.nodes[startId], this.graph.nodes[goalId]);

    while(openSet.size > 0){
      const current = this.lowestScore(openSet, fScore);

      if(current === goalId) return this.reconstructPath(cameFrom, current);

      openSet.delete(current);
      closedSet.add(current);

      const edges = this.graph.edges[current] || [];

      for(const edge of edges){
        const neighbor=edge.to;

        if(closedSet.has(neighbor))
          continue;

        const tentative = gScore[current] + edge.cost;

        if(tentative < gScore[neighbor]){
          cameFrom[neighbor]=current;
          gScore[neighbor]=tentative;

          fScore[neighbor] = tentative + this.heuristic(this.graph.nodes[neighbor], this.graph.nodes[goalId]);
          openSet.add(neighbor);
        }
      }
    }
    return [];
  }

  heuristic(a,b){
    return Math.hypot(
      a.position.x - b.position.x,
      a.position.z - b.position.z
    );
  }

  lowestScore(set,scores){
    let best=null;
    let value=Infinity;

    for(const id of set){
      if(scores[id] < value){
        value=scores[id];
        best=id;
      }
    }

    return best;
  }

  reconstructPath(cameFrom,current){
    const path=[current];

    while(cameFrom[current]){
      current = cameFrom[current];
      path.unshift(current);
    }

    return path;
  }

  extractPortals(nodePath){
    const portals=[];

    for(let i=0;i<nodePath.length-1;i++){
      const key = `${nodePath[i]}-${nodePath[i+1]}`;

      const portal = this.graph.portalEdges[key];

      if(portal) portals.push(portal);
    }

    return portals;
  }

  funnel(start,end,portals){
    const result=[start];

    for(const portal of portals){
      result.push(portal.left);
    }

    result.push(end);
    return result;
  }
}