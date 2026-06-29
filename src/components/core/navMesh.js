import * as BABYLON from 'babylonjs';

export class NavMesh {

    constructor(){
        this.navMeshState = {
            cs: 0.2,
            ch: 0.2,
            walkableSlopeAngle: 45,
            walkableHeight: 1.0,
            walkableClimb: 0.5,
            walkableRadius: 0.4,
        }
    }

    getNavMeshState() {
        return this.navMeshState
    }

    init(scene) {
        return new BABYLON.TransformNode('navMeshGroup', scene)
    }

    rebuildNavMesh = (scene, navMeshGroupRef) => {
        clearNavMesh();
    
        if (!navMeshGroupRef.current) return;
    
        const navMat = new BABYLON.StandardMaterial('navMeshMat', scene);
        navMat.diffuseColor = new BABYLON.Color3(0.06, 0.84, 0.65); // beautiful emerald cyan
        navMat.alpha = 0.35; // clean transparent overlay
        navMat.emissiveColor = new BABYLON.Color3(0.0, 0.2, 0.15);
    
        try {
          // Create a base plate representing the full walkable grid area (11x11, from -5.5 to 5.5)
          const basePlate = BABYLON.MeshBuilder.CreateBox('basePlate', { width: 11, height: 0.01, depth: 11 }, scene);
          basePlate.position = new BABYLON.Vector3(0, 0, 0);
    
          let baseCSG = BABYLON.CSG.FromMesh(basePlate);
          const tempMeshes = [basePlate];
    
          // Subtract each obstacle inflated by the agent walkableRadius
          const r = stateRef.current.navParams.walkableRadius;
          const size = 1 + 2 * r;
    
          stateRef.current.cubes.forEach((cube) => {
            const obstacleBox = BABYLON.MeshBuilder.CreateBox(`temp-obs-${cube.id}`, { width: size, height: 1.5, depth: size }, scene);
            obstacleBox.position = new BABYLON.Vector3(cube.x, 0.5, cube.z);
            tempMeshes.push(obstacleBox);
    
            const obstacleCSG = BABYLON.CSG.FromMesh(obstacleBox);
            baseCSG = baseCSG.subtract(obstacleCSG);
          });
    
          // Render the subtraction result
          const navMeshVisual = baseCSG.toMesh('navMeshVisual', navMat, scene);
          navMeshVisual.position.y = 0.012; // slightly above ground to prevent z-fighting
          navMeshVisual.parent = navMeshGroupRef.current;
    
          // Clean up temporary meshes
          tempMeshes.forEach((mesh) => mesh.dispose());
        } catch (e) {
          console.error("Error generating CSG NavMesh:", e);
        }
      };
    
    clearNavMesh = (navMeshGroupRef) => {
        if (navMeshGroupRef.current) {
          const children = navMeshGroupRef.current.getChildMeshes();
          children.forEach((mesh) => mesh.dispose());
        }
    };

}