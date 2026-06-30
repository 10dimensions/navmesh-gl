 import * as BABYLON from 'babylonjs';
 
 export class SceneControl {
    constructor(gridLinesRef, DEMO_LAYOUTS, setCubes, setNotification, agentMeshRef, targetMeshRef, agentPos, targetPos,
            cubeMeshesRef, cubes, pathLineMeshRef, stateRef, setSimState){
        this.gridLinesRef = gridLinesRef
        this.DEMO_LAYOUTS = DEMO_LAYOUTS
        this.setCubes = setCubes
        this.setNotification = setNotification
        this.agentMeshRef = agentMeshRef
        this.targetMeshRef = targetMeshRef
        this.agentPos = agentPos
        this.targetPos = targetPos
        this.cubeMeshesRef = cubeMeshesRef
        this.cubes = cubes
        this.pathLineMeshRef = pathLineMeshRef
        this.stateRef = stateRef
        this.setSimState = setSimState
    }

    // --- Helper: Create base Grid Floor ---
    createBaseGrid = (scene) => {
        const size = 11; // -5 to 5 grid
        
        // Solid base ground
        const ground = BABYLON.MeshBuilder.CreateGround('ground1', { width: size + 1, height: size + 1 }, scene);
        const groundMaterial = new BABYLON.StandardMaterial('groundMat', scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.98, 0.98, 0.99);
        groundMaterial.specularColor = new BABYLON.Color3(0.05, 0.05, 0.05);
        ground.material = groundMaterial;
        ground.position.y = -0.01; // slightly below 0

        // Draw grid lines
        const gridPoints = [];
        const min = -size/2 - 0.5;
        const max = size/2 + 0.5;

        for (let i = min; i <= max; i++) {
            // Vertical line
            gridPoints.push([new BABYLON.Vector3(i, 0.005, min), new BABYLON.Vector3(i, 0.005, max)]);
            // Horizontal line
            gridPoints.push([new BABYLON.Vector3(min, 0.005, i), new BABYLON.Vector3(max, 0.005, i)]);
        }

        const gridLines = BABYLON.MeshBuilder.CreateLineSystem('gridSystem', { lines: gridPoints }, scene);
        gridLines.color = new BABYLON.Color3(0.85, 0.88, 0.92);
        this.gridLinesRef.current = gridLines;

        // Edge physical wall borders (prevent blocks/cubes from sliding off)
        const borderMat = new BABYLON.StandardMaterial('borderMat', scene);
        borderMat.diffuseColor = new BABYLON.Color3(0.8, 0.84, 0.9); // clean slate grey-blue
        borderMat.alpha = 0.45;
        borderMat.specularColor = new BABYLON.Color3(0.4, 0.4, 0.4);

        // North Wall
        const wallN = BABYLON.MeshBuilder.CreateBox('wallN', { width: 11, height: 0.3, depth: 0.15 }, scene);
        wallN.position = new BABYLON.Vector3(0, 0.15, 5.575);
        wallN.material = borderMat;

        // South Wall
        const wallS = BABYLON.MeshBuilder.CreateBox('wallS', { width: 11, height: 0.3, depth: 0.15 }, scene);
        wallS.position = new BABYLON.Vector3(0, 0.15, -5.575);
        wallS.material = borderMat;

        // East Wall
        const wallE = BABYLON.MeshBuilder.CreateBox('wallE', { width: 0.15, height: 0.3, depth: 11.3 }, scene);
        wallE.position = new BABYLON.Vector3(5.575, 0.15, 0);
        wallE.material = borderMat;

        // West Wall
        const wallW = BABYLON.MeshBuilder.CreateBox('wallW', { width: 0.15, height: 0.3, depth: 11.3 }, scene);
        wallW.position = new BABYLON.Vector3(-5.575, 0.15, 0);
        wallW.material = borderMat;
    };

    // --- Helper: Create Agent and Target meshes ---
    createAgentAndTarget = (scene) => {
        // 1. Agent Mesh: Cylinder capsule
        const agentGroup = new BABYLON.Mesh('agentGroup', scene);
        
        const body = BABYLON.MeshBuilder.CreateCylinder('agentBody', {
            height: 0.6,
            diameterTop: 0.4,
            diameterBottom: 0.4,
            tessellation: 16
        }, scene);
        body.position.y = 0.3;
        body.parent = agentGroup;

        const head = BABYLON.MeshBuilder.CreateSphere('agentHead', { diameter: 0.4 }, scene);
        head.position.y = 0.65;
        head.parent = agentGroup;

        const nose = BABYLON.MeshBuilder.CreateBox('agentNose', { size: 0.15, depth: 0.25, height: 0.15 }, scene);
        nose.position.y = 0.65;
        nose.position.z = 0.2; // pointing forward
        nose.parent = agentGroup;

        // Materials
        const bodyMat = new BABYLON.StandardMaterial('agentMat', scene);
        bodyMat.diffuseColor = new BABYLON.Color3(0.1, 0.5, 0.85); // modern blue
        bodyMat.emissiveColor = new BABYLON.Color3(0.02, 0.1, 0.2);
        body.material = bodyMat;
        head.material = bodyMat;

        const noseMat = new BABYLON.StandardMaterial('noseMat', scene);
        noseMat.diffuseColor = new BABYLON.Color3(1.0, 0.45, 0.0); // orange nose
        nose.material = noseMat;

        agentGroup.position = new BABYLON.Vector3(this.agentPos.x, this.agentPos.y, this.agentPos.z);
        agentGroup.isVisible = false;
        this.agentMeshRef.current = agentGroup;

        // 2. Target Mesh: Ring indicator
        const targetGroup = new BABYLON.Mesh('targetGroup', scene);
        
        const ring = BABYLON.MeshBuilder.CreateTorus('targetRing', {
            diameter: 0.6,
            thickness: 0.1,
            tessellation: 24
        }, scene);
        ring.position.y = 0.05;
        ring.parent = targetGroup;

        const core = BABYLON.MeshBuilder.CreateCylinder('targetCore', {
            height: 0.4,
            diameterTop: 0.05,
            diameterBottom: 0.05
        }, scene);
        core.position.y = 0.2;
        core.parent = targetGroup;

        const targetMat = new BABYLON.StandardMaterial('targetMat', scene);
        targetMat.diffuseColor = new BABYLON.Color3(0.9, 0.3, 0.2); // Red/rust target
        targetMat.emissiveColor = new BABYLON.Color3(0.3, 0.05, 0.02);
        ring.material = targetMat;
        core.material = targetMat;

        targetGroup.position = new BABYLON.Vector3(this.targetPos.x, this.targetPos.y, this.targetPos.z);
        targetGroup.isVisible = false;
        this.targetMeshRef.current = targetGroup;
    };

    // --- Helper: Rebuild all obstacle cube meshes ---
    rebuildCubesMeshes = (scene) => {
        // Clear old meshes
        this.cubeMeshesRef.current.forEach((mesh) => mesh.dispose());
        this.cubeMeshesRef.current.clear();

        const cubeMat = new BABYLON.StandardMaterial('cubeMat', scene);
        cubeMat.diffuseColor = new BABYLON.Color3(0.45, 0.5, 0.55); // modern charcoal slate
        cubeMat.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);

        this.cubes.forEach((cube) => {
            const box = BABYLON.MeshBuilder.CreateBox(`cube-${cube.id}`, { size: 1, height: 1 }, scene);
            box.position = new BABYLON.Vector3(cube.x, 0.5, cube.z);
            box.material = cubeMat;
            this.cubeMeshesRef.current.set(cube.id, box);
        });
    };

    // --- Helper: Draw the 3D path line ---
    drawPathLineInBabylon = (path) => {
      if (this.pathLineMeshRef.current) {
        this.pathLineMeshRef.current.dispose();
        this.pathLineMeshRef.current = null;
      }

      if (path.length < 2) return;

      const points = path.map((pt) => new BABYLON.Vector3(pt.x, pt.y + 0.05, pt.z));
      const pathLine = BABYLON.MeshBuilder.CreateDashedLines('pathLine', {
        points: points,
        dashSize: 2,
        gapSize: 1,
        updatable: false,
      }, sceneRef.current);
      
      pathLine.color = new BABYLON.Color3(0.95, 0.45, 0.06); // energetic orange
      this.pathLineMeshRef.current = pathLine;
    };

      // --- Animate the Agent along the path ---
    animateAgentStep = () => {
      const { isPlaying, path, currentWaypointIndex, speed } = this.stateRef.current.simState;
      if (!isPlaying || path.length === 0) return;

      const agentMesh = this.agentMeshRef.current;
      if (!agentMesh) return;

      const targetWaypoint = path[currentWaypointIndex];
      if (!targetWaypoint) return;

      const currentPos = agentMesh.position;
      const destPos = new BABYLON.Vector3(targetWaypoint.x, targetWaypoint.y, targetWaypoint.z);

      const direction = destPos.subtract(currentPos);
      const distance = direction.length();

      // Speed multiplier logic
      const stepSize = 0.05 * speed;

      if (distance <= stepSize) {
        // Arrived at waypoint
        agentMesh.position = destPos;
        
        const nextIndex = currentWaypointIndex + 1;
        if (nextIndex >= path.length) {
          // Path completed
          this.setSimState(prev => ({
            ...prev,
            isPlaying: false,
            currentWaypointIndex: path.length - 1,
            status: 'completed',
          }));
          this.setNotification({ message: 'Simulation finished! Agent reached target successfully.', type: 'success' });
        } else {
          this.setSimState(prev => ({
            ...prev,
            currentWaypointIndex: nextIndex,
          }));
        }
      } else {
        // Move towards waypoint
        direction.normalize();
        agentMesh.translate(direction, stepSize, BABYLON.Space.WORLD);

        // Rotate towards movement direction
        const desiredRotation = Math.atan2(direction.x, direction.z);
        // Smooth interpolation for rotation
        agentMesh.rotation.y = agentMesh.rotation.y + (desiredRotation - agentMesh.rotation.y) * 0.15;
        
        // Update agent position in state periodically (not too fast to block render)
        this.stateRef.current.agentPos = {
          x: agentMesh.position.x,
          y: agentMesh.position.y,
          z: agentMesh.position.z,
        };
      }
    };

    // --- Demo layout selectors ---
    loadDemo = (index) => {
        const layout = this.DEMO_LAYOUTS[index];
        if (!layout) return;
        this.setCubes(layout.cubes);
        this.setNotification({ message: `Loaded preset scene "${layout.name}"`, type: 'success' });
    };

    clearCubes = () => {
        this.setCubes([]);
        this.setNotification({ message: 'Cleared all obstacle cubes.', type: 'info' });
    };
 }
 
 