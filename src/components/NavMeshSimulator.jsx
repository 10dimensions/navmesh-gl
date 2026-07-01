import React, { useEffect, useRef, useState } from 'react';
import * as BABYLON from 'babylonjs';
import { findPathAStar, DEMO_LAYOUTS } from '../utils/pathfinding';
import Badge from "./ui/Badge.jsx"
import Header from "./ui/Header.jsx"
import Footer from "./ui/Footer.jsx"
import Notification from "./ui/Notification.jsx"
import PathFinder from "./ui/PathFinder.jsx"
import Steps from "./ui/Steps.jsx"
import GridPainting from "./ui/GridPainting.jsx"
import NavMeshWidget from "./ui/NavMeshWidget.jsx" 

import { NavMesh } from "./core/navMeshCsg.js"
import { PointerEvents } from "./core/cursor.js"
import { SceneControl } from "./core/sceneControl.js" 
import { SimControl } from './core/simControl.js';

export default function NavMeshSimulator() {
  // --- React State ---
  const [step, setStep] = useState('edit');
  const [cubes, setCubes] = useState([
    { id: '1', x: 1, z: 0 },
    { id: '2', x: -2, z: 1 },
    { id: '3', x: 2, z: -2 },
  ]);
  const [orbitControls, setOrbitControls] = useState(true);
  const [editMode, setEditMode] = useState('add');
  
  // NavMesh configuration parameters
  const [navMesh] = useState(() => new NavMesh())
  const [navParams, setNavParams] = useState(() => navMesh.getNavMeshState());

  // Agent & Target states
  const [agentPos, setAgentPos] = useState({ x: -4, y: 0.1, z: -4 });
  const [targetPos, setTargetPos] = useState({ x: 4, y: 0.1, z: 4 });
  const [activePlacement, setActivePlacement] = useState('target');

  // Simulation states
  const [simState, setSimState] = useState({
    isPlaying: false,
    speed: 1.0,
    status: 'idle',
    path: [],
    currentWaypointIndex: 0,
    progress: 0,
  });

  const [notification, setNotification] = useState({
    message: 'Welcome to the NavMesh Simulator! Design the grid obstacles, then simulate pathfinding.',
    type: 'info'
  });

  // --- Refs for Babylon and Animation Loop ---
  const canvasRef = useRef(null);
  const engineRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  
  // Mesh refs
  const cubeMeshesRef = useRef(new Map());
  const gridLinesRef = useRef(null);
  const navMeshGroupRef = useRef(null);
  const agentMeshRef = useRef(null);
  const targetMeshRef = useRef(null);
  const pathLineMeshRef = useRef(null);
  const pointerObserverRef = useRef(null);
  const dragRef = useRef({
    isDragging: false,
    draggedCubeId: null,
    lastValidX: 0,
    lastValidZ: 0,
  });

  // Synchronization refs for the 60fps render loop
  const stateRef = useRef({
    step,
    cubes,
    editMode,
    orbitControls,
    agentPos,
    targetPos,
    activePlacement,
    simState,
    navParams,
  });

  const recomputePath = () => {
    // Start pathfinding from the current real-time position of the cylinder agent mesh if it exists
    let start = stateRef.current.agentPos;
    if (agentMeshRef.current) {
      start = {
        x: agentMeshRef.current.position.x,
        y: agentMeshRef.current.position.y,
        z: agentMeshRef.current.position.z,
      };
    }

    const target = stateRef.current.targetPos;
    const currentCubes = stateRef.current.cubes;
    const r = stateRef.current.navParams.walkableRadius;
    
    const computedPath = findPathAStar(start, target, currentCubes, r);
    
    setSimState(prev => ({
      ...prev,
      path: computedPath,
      currentWaypointIndex: 0,
      progress: 0,
      status: computedPath.length > 0 ? 'idle' : 'completed',
    }));

    sceneController.drawPathLineInBabylon(computedPath, sceneRef);
  };

  // Keep the sync ref fresh
  useEffect(() => {
    stateRef.current = {
      step,
      cubes,
      editMode,
      orbitControls,
      agentPos,
      targetPos,
      activePlacement,
      simState,
      navParams,
    };
  }, [step, cubes, editMode, orbitControls, agentPos, targetPos, activePlacement, simState, navParams]);

  // Toast notification auto-dismissal
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // --- Trigger Path Recomputation when Cubes/Agent/Target/NavParams changes ---
  useEffect(() => {
    if (step === 'simulate') {
      recomputePath();
    }
  }, [cubes, agentPos, targetPos, step, navParams]);

  // --- Babylon.js Scene Setup ---
  useEffect(() => {
    if (!canvasRef.current) return;

    // Initialize Engine and Scene
    const engine = new BABYLON.Engine(canvasRef.current, true, { preserveDrawingBuffer: true, stencil: true });
    engineRef.current = engine;
    
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.96, 0.97, 0.98, 1); // modern light gray bg
    sceneRef.current = scene;

    // Camera setup
    const camera = new BABYLON.ArcRotateCamera(
      'camera1',
      -Math.PI / 4,
      Math.PI / 3,
      15,
      new BABYLON.Vector3(0, 0, 0),
      scene
    );
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 25;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2 - 0.05; // don't go below ground
    cameraRef.current = camera;

    if (orbitControls) {
      camera.attachControl(canvasRef.current, true);
    }

    // Lights
    const light1 = new BABYLON.HemisphericLight('light1', new BABYLON.Vector3(0, 1, 0), scene);
    light1.intensity = 0.7;
    
    const light2 = new BABYLON.DirectionalLight('dirLight', new BABYLON.Vector3(-1, -2, -1), scene);
    light2.position = new BABYLON.Vector3(5, 10, 5);
    light2.intensity = 0.4;

    // Ground & Grid
    sceneController.createBaseGrid(scene);

    // Initial Cubes render
    sceneController.rebuildCubesMeshes(cubeMeshesRef, cubes, scene);

    // Init auxiliary visual nodes
    navMeshGroupRef.current = navMesh.init(scene); //new BABYLON.TransformNode('navMeshGroup', scene);
    
    // Create Agent & Target Meshes
    sceneController.createAgentAndTarget();

    // Register 3D click handler
    pointerEvents.setupPointerObserver(scene);
    

    // Render loop
    engine.runRenderLoop(() => {
      scene.render();
      sceneController.animateAgentStep();
    });

    // Resize handler
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (pointerObserverRef.current) {
        scene.onPointerObservable.remove(pointerObserverRef.current);
      }
      scene.dispose();
      engine.dispose();
    };
  }, []);

  // --- Dynamic camera attachment based on OrbitControls state ---
  useEffect(() => {
    if (!cameraRef.current || !canvasRef.current) return;
    if (orbitControls) {
      cameraRef.current.attachControl(canvasRef.current, true);
    } else {
      cameraRef.current.detachControl();
    }
  }, [orbitControls]);

  // --- Step transitions handling ---
  useEffect(() => {
    const currentScene = sceneRef.current;
    if (!currentScene) return;

    // Clear and build NavMesh Mesh if we are entering navmesh or simulate step
    if (step === 'navmesh' || step === 'simulate') {
      navMesh.rebuildNavMesh(currentScene, navMeshGroupRef, stateRef);
    } else {
      navMesh.clearNavMesh(navMeshGroupRef);
    }

    // Toggle simulation meshes visibility
    const isSimulate = step === 'simulate';
    if (agentMeshRef.current) agentMeshRef.current.isVisible = isSimulate;
    if (targetMeshRef.current) targetMeshRef.current.isVisible = isSimulate;
    if (pathLineMeshRef.current) pathLineMeshRef.current.isVisible = isSimulate;

    if (isSimulate) {
      recomputePath();
      // Keep agent and target positions at their precise continuous coordinates
      const currentAgent = {
        x: stateRef.current.agentPos.x,
        y: 0.1,
        z: stateRef.current.agentPos.z,
      };
      const currentTarget = {
        x: stateRef.current.targetPos.x,
        y: 0.1,
        z: stateRef.current.targetPos.z,
      };
      setAgentPos(currentAgent);
      setTargetPos(currentTarget);
      if (agentMeshRef.current) agentMeshRef.current.position = new BABYLON.Vector3(currentAgent.x, currentAgent.y, currentAgent.z);
      if (targetMeshRef.current) targetMeshRef.current.position = new BABYLON.Vector3(currentTarget.x, currentTarget.y, currentTarget.z);
    } else {
      // Pause simulation when leaving simulation step
      setSimState(prev => ({ ...prev, isPlaying: false, status: 'idle' }));
    }
  }, [step]);

  // --- Trigger Cube & NavMesh Mesh reconstruction when state or parameters change ---
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    sceneController.rebuildCubesMeshes(cubeMeshesRef, cubes, scene);

    if (step === 'navmesh' || step === 'simulate') {
      navMesh.rebuildNavMesh(scene, navMeshGroupRef, stateRef);
    }
  }, [cubes, navParams, step]);

  const [pointerEvents] = useState(() => new PointerEvents(
      sceneRef, stateRef, dragRef, cubeMeshesRef, setCubes, setNotification, cameraRef, canvasRef, agentMeshRef,
                setAgentPos, setSimState, setTargetPos, targetMeshRef, recomputePath, navMesh, pointerObserverRef
  ));

  const [sceneController] = useState(() => new SceneControl(gridLinesRef, DEMO_LAYOUTS, setCubes, setNotification, agentMeshRef, 
      targetMeshRef, agentPos, targetPos, cubeMeshesRef, cubes, pathLineMeshRef, stateRef, setSimState
  ));

  const [simControlState] = useState(() => new SimControl(simState, setSimState, setNotification, stateRef, agentMeshRef, agentPos));


  return (
    <div id="sim-root" className="flex flex-col h-screen bg-slate-50 font-sans text-slate-800">
      
      {/* Header Deck */}
      <Header orbitControls={orbitControls} setOrbitControls={setOrbitControls} setNotification={setNotification} />

      {/* Main Workspace Frame */}
      <div id="sim-workspace" className="flex flex-1 overflow-hidden">
        
        {/* Left Side Sidebar - Control Panel */}
        <aside id="sim-sidebar" className="w-90 bg-white border-r border-slate-200 flex flex-col h-full shrink-0 shadow-xs">
          
          {/* Step Segment Switcher */}
          <Steps step={step} setStep={setStep} />

          {/* Step Specific Action Panels */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            
            {/* STEP 1: GRID AND CUBE PAINTING */}
            {step === 'edit' && (
              <GridPainting editMode={editMode} setEditMode={setEditMode} setOrbitControls={setOrbitControls} clearCubes={sceneController.clearCubes} 
                setStep={setStep} DEMO_LAYOUTS={DEMO_LAYOUTS} loadDemo={sceneController.loadDemo} />
            )}

            {/* STEP 2: NAVMESH PARAMETERS */}
            {step === 'navmesh' && (
              <NavMeshWidget navParams={navParams} setNavParams={setNavParams} setStep={setStep} />
            )}

            {/* STEP 3: PATHFINDING SIMULATION */}
            {step === 'simulate' && (
              <PathFinder setActivePlacement={setActivePlacement} setOrbitControls={setOrbitControls} activePlacement={activePlacement} 
                simState={simState} stepBackward={simControlState.stepBackward} togglePlayPause={simControlState.togglePlayPause} stepForward={simControlState.stepForward} 
                resetSimulation={simControlState.resetSimulation} agentPos={agentPos} changeSpeed={simControlState.changeSpeed} />
            )}

          </div>

          {/* Persistent Footer Deck */}
          <Footer cubes={cubes} />
        </aside>

        {/* 3D Render Canvas stage */}
        <main id="sim-canvas-stage" className="flex-1 relative bg-slate-150 flex items-center justify-center h-full">
          
          {/* Active Canvas */}
          <canvas
            ref={canvasRef}
            className="w-full h-full outline-none select-none block"
            id="babylon-canvas"
          />

          {/* Floating Instructions/Status overlay */}
          {notification && ( <Notification notification={notification} />)}

          {/* Placement Hint Badges */}
          {step === 'simulate' && ( <Badge activePlacement={activePlacement} /> )}
        </main>
      </div>

    </div>
  );
}
