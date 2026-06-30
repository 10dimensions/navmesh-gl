import * as BABYLON from 'babylonjs';

export class PointerEvents {

    constructor(scene, stateRef, dragRef, cubeMeshesRef, setCubes, setNotification, cameraRef, canvasRef, agentMeshRef, 
                setAgentPos, setSimState, setTargetPos, targetMeshRef, recomputePath, navMesh, pointerObserverRef) {
        this.scene = scene
        this.dragRef = dragRef
        this.stateRef = stateRef
        this.cubeMeshesRef = cubeMeshesRef
        this.setCubes = setCubes
        this.setNotification = setNotification
        this.cameraRef = cameraRef
        this.canvasRef = canvasRef
        this.agentMeshRef = agentMeshRef
        this.setAgentPos = setAgentPos
        this.setSimState = setSimState
        this.targetMeshRef = targetMeshRef
        this.setTargetPos = setTargetPos
        this.recomputePath = recomputePath
        this.navMesh = navMesh
        this.pointerObserverRef = pointerObserverRef
    }

    onPointerDown(pointerInfo){
       
        // Ignore right click dragging (orbit controls)
        if (this.stateRef.current.orbitControls && pointerInfo.event.button === 2) return;

        const pickInfo = pointerInfo.pickInfo;
        if (!pickInfo || !pickInfo.hit) return;

        const pickedMesh = pickInfo.pickedMesh;
        const pt = pickInfo.pickedPoint;

        const currentStep = this.stateRef.current.step;

        // --- Handle ERASER Mode ---
        if (currentStep === 'edit' && this.stateRef.current.editMode === 'remove') {
            if (pickedMesh && pickedMesh.name.startsWith('cube-')) {
                const id = pickedMesh.name.substring(5);
                this.setCubes((prev) => prev.filter((c) => c.id !== id));
                this.setNotification({ message: 'Obstacle block removed.', type: 'success' });
                return;
            } 
            else if (pt) {
                // Find any cube within a radius of 0.6 units from clicked point on ground
                const closestCube = this.stateRef.current.cubes.find(
                    (c) => Math.hypot(c.x - pt.x, c.z - pt.z) < 0.6
                );
                if (closestCube) {
                    this.setCubes((prev) => prev.filter((c) => c.id !== closestCube.id));
                    this.setNotification({ message: 'Obstacle block removed.', type: 'success' });
                    return;
                }
            }
        }

        // --- Handle DRAG Mode ---
        if (currentStep === 'edit' && this.stateRef.current.editMode === 'drag') {
            if (pickedMesh && pickedMesh.name.startsWith('cube-')) {
                const id = pickedMesh.name.substring(5);
                const cube = this.stateRef.current.cubes.find((c) => c.id === id);
                if (cube) {
                    // Initiate continuous Dragging Mode
                    this.dragRef.current = {
                        isDragging: true,
                        draggedCubeId: id,
                        lastValidX: cube.x,
                        lastValidZ: cube.z,
                    };

                    // Temporarily disable camera control so user can drag without rotating camera
                    if (this.cameraRef.current && this.canvasRef.current) {
                        this.cameraRef.current.detachControl();
                    }

                    this.setNotification({ message: 'Dragging block smoothly. Release to place!', type: 'info' });
                    return; // intercept event
                }
            }
        }

        // If not dragging, handle single-click spawn or placements
        if (!pt) return;

        // Bounds constraint: coordinates range from -5 to 5
        if (Math.abs(pt.x) > 5.5 || Math.abs(pt.z) > 5.5) return;

        if (currentStep === 'edit') {
            if (this.stateRef.current.editMode === 'add') {
                const exactX = Math.max(-5, Math.min(5, pt.x));
                const exactZ = Math.max(-5, Math.min(5, pt.z));

                // Ensure we don't spawn overlapping other blocks!
                const overlaps = this.stateRef.current.cubes.some(
                (c) => Math.abs(c.x - exactX) < 1.0 && Math.abs(c.z - exactZ) < 1.0
                );

                // Also check agent and target overlap
                const overlapsAgent = Math.abs(this.stateRef.current.agentPos.x - exactX) < 0.9 && Math.abs(this.stateRef.current.agentPos.z - exactZ) < 0.9;
                const overlapsTarget = Math.abs(this.stateRef.current.targetPos.x - exactX) < 0.9 && Math.abs(this.stateRef.current.targetPos.z - exactZ) < 0.9;

                if (overlaps) {
                    this.setNotification({ message: 'Cannot place overlapping another obstacle!', type: 'warning' });
                    return;
                }

                if (overlapsAgent || overlapsTarget) {
                    this.setNotification({ message: 'Cannot place an obstacle directly overlapping the agent or target!', type: 'warning' });
                    return;
                }

                const newCube = {
                    id: Date.now().toString(),
                    x: exactX,
                    z: exactZ,
                };
                this.setCubes((prev) => [...prev, newCube]);
            }
        } 
        else if (currentStep === 'simulate') {
            const exactX = Math.max(-5.3, Math.min(5.3, pt.x));
            const exactZ = Math.max(-5.3, Math.min(5.3, pt.z));

            // Verify point is inside walkable area (not inside obstacle buffer zone)
            const r = this.stateRef.current.navParams.walkableRadius;
            const isBlocked = this.stateRef.current.cubes.some(
                (c) => Math.abs(c.x - exactX) < (0.5 + r) && Math.abs(c.z - exactZ) < (0.5 + r)
            );

            if (isBlocked) {
                this.setNotification({ message: 'Cannot place inside the obstacle buffer zone!', type: 'warning' });
                return;
            }

            const newPos = { x: exactX, y: 0.1, z: exactZ };

            if (this.stateRef.current.activePlacement === 'agent') {
                this.setAgentPos(newPos);
                if (this.agentMeshRef.current) {
                    this.agentMeshRef.current.position = new BABYLON.Vector3(newPos.x, newPos.y, newPos.z);
                }
                // Reset simulation waypoint index
                this.setSimState((prev) => {
                    const nextState = {
                        ...prev,
                        currentWaypointIndex: 0,
                        progress: 0,
                    };
                    this.stateRef.current.simState = nextState;
                    return nextState;
                });
            } else {
                this.setTargetPos(newPos);
                if (this.targetMeshRef.current) {
                    this.targetMeshRef.current.position = new BABYLON.Vector3(newPos.x, newPos.y, newPos.z);
                }
                
                // Force cylinder to move to the newly placed target immediately
                this.setSimState((prev) => {
                    const nextState = {
                        ...prev,
                        isPlaying: true,
                        status: 'running',
                        currentWaypointIndex: 0,
                        progress: 0,
                    };
                    this.stateRef.current.simState = nextState;
                    return nextState;
                });
                this.setNotification({ message: 'Target set! Cylinder agent is navigating to target.', type: 'success' });
            }
        }
            
    }

    onPointerMove(scene){
        if (this.dragRef.current.isDragging && this.dragRef.current.draggedCubeId) {
            const draggedCubeId = this.dragRef.current.draggedCubeId;

            // Raycast to find intersection point strictly on ground
            const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh.name === 'ground1');
            if (pickResult && pickResult.hit && pickResult.pickedPoint) {
                const pt = pickResult.pickedPoint;
                const exactX = Math.max(-5, Math.min(5, pt.x));
                const exactZ = Math.max(-5, Math.min(5, pt.z));

                const otherCubes = this.stateRef.current.cubes.filter((c) => c.id !== draggedCubeId);

                // Test function for sliding collisions
                const testOverlap = (tx, tz) => {
                    const occupied = otherCubes.some(
                        (c) => Math.abs(c.x - tx) < 1.0 && Math.abs(c.z - tz) < 1.0
                    );
                    const overlapAgentTarget = (this.stateRef.current.step === 'simulate') && (
                        (Math.abs(tx - this.stateRef.current.agentPos.x) < 0.9 && Math.abs(tz - this.stateRef.current.agentPos.z) < 0.9) ||
                        (Math.abs(tx - this.stateRef.current.targetPos.x) < 0.9 && Math.abs(tz - this.stateRef.current.targetPos.z) < 0.9)
                    );
                    return occupied || overlapAgentTarget;
                };

                let finalX = this.dragRef.current.lastValidX;
                let finalZ = this.dragRef.current.lastValidZ;

                if (!testOverlap(exactX, exactZ)) {
                    finalX = exactX;
                    finalZ = exactZ;
                } else if (!testOverlap(exactX, this.dragRef.current.lastValidZ)) {
                    // Smooth sliding along X axis
                    finalX = exactX;
                } else if (!testOverlap(this.dragRef.current.lastValidX, exactZ)) {
                    // Smooth sliding along Z axis
                    finalZ = exactZ;
                }

                // Update physical mesh position instantly for smooth drag
                const mesh = this.cubeMeshesRef.current.get(draggedCubeId);
                if (mesh) {
                    mesh.position.x = finalX;
                    mesh.position.z = finalZ;
                }

                // Save last valid coordinates
                this.dragRef.current.lastValidX = finalX;
                this.dragRef.current.lastValidZ = finalZ;

                // Feed updated coordinates directly to stateRef to allow real-time path/NavMesh updates
                this.stateRef.current.cubes = this.stateRef.current.cubes.map((c) =>
                    c.id === draggedCubeId ? { ...c, x: finalX, z: finalZ } : c
                );

                // Real-time calculation triggers based on active workflow step
                if (this.stateRef.current.step === 'simulate') {
                    this.recomputePath();
                } else if (this.stateRef.current.step === 'navmesh') {
                    this.navMesh.rebuildNavMesh(scene, navMeshGroupRef);
                }
            }
        }

        if (this.stateRef.current.step === 'simulate' && !this.stateRef.current.simState.isPlaying) {

            const pickResult = scene.pick(scene.pointerX, scene.pointerY, (mesh) => mesh.name === 'ground1');

            if (pickResult && pickResult.hit && pickResult.pickedPoint) {
                const pt = pickResult.pickedPoint;
                const exactX = Math.max(-5.3, Math.min(5.3, pt.x));
                const exactZ = Math.max(-5.3, Math.min(5.3, pt.z));

                // Verify point is inside walkable area (not inside obstacle buffer zone)
                const r = this.stateRef.current.navParams.walkableRadius;
                const isBlocked = this.stateRef.current.cubes.some(
                    (c) => Math.abs(c.x - exactX) < (0.5 + r) && Math.abs(c.z - exactZ) < (0.5 + r)
                );

                if (isBlocked) {
                    this.setNotification({ message: 'Cannot place inside the obstacle buffer zone!', type: 'warning' });
                    return;
                }

                const newPos = { x: exactX, y: 0.1, z: exactZ };
                this.setTargetPos(newPos);
                if (this.targetMeshRef.current) {
                    this.targetMeshRef.current.position = new BABYLON.Vector3(newPos.x, newPos.y, newPos.z);
                }
            }
        }
    }

    onPointerUp(){
        if (this.dragRef.current.isDragging && this.dragRef.current.draggedCubeId) {
            const draggedCubeId = this.dragRef.current.draggedCubeId;
            const finalX = this.dragRef.current.lastValidX;
            const finalZ = this.dragRef.current.lastValidZ;

            // Commit final coords to React State to permanently synchronize elements
            this.setCubes((prev) =>
                prev.map((c) => (c.id === draggedCubeId ? { ...c, x: finalX, z: finalZ } : c))
            );

            // Restore Orbit Controls if active
            if (this.stateRef.current.orbitControls && this.cameraRef.current && this.canvasRef.current) {
                this.cameraRef.current.attachControl(this.canvasRef.current, true);
            }

            this.dragRef.current = {
                isDragging: false,
                draggedCubeId: null,
                lastValidX: 0,
                lastValidZ: 0,
            };

            this.setNotification({ message: 'Obstacle block placed smoothly.', type: 'success' });
        }
    }

    setupPointerObserver(scene) {
        this.pointerObserverRef.current = scene.onPointerObservable.add((pointerInfo) => {
            // 1. POINTERDOWN Event
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
                this.onPointerDown(pointerInfo)
            }
            
            // 2. POINTERMOVE Event
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERMOVE) {
                this.onPointerMove(scene)
            }

                  // 3. POINTERUP Event
            if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERUP) {
                this.onPointerUp()
            }
        }
    )}
}
      
