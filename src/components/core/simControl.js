export class SimControl {
    constructor(simState, setSimState, setNotification, stateRef, agentMeshRef, agentPos){
        this.simState = simState
        this.setNotification = setNotification
        this.setSimState = setSimState
        this.stateRef = stateRef
        this.agentMeshRef = agentMeshRef
        this.agentPos = agentPos
    }

      // --- Playback controls handlers ---
    togglePlayPause = () => {
        if (this.simState.path.length === 0) {
            this.setNotification({ message: 'No valid path found to simulate!', type: 'warning' });
            return;
        }

        this.setSimState((prev) => {
            const nextPlaying = !prev.isPlaying;
            const nextStatus = nextPlaying ? 'running' : 'paused';
            
            // Update render loop state
            this.stateRef.current.simState.isPlaying = nextPlaying;
            this.stateRef.current.simState.status = nextStatus;

            return {
                ...prev,
                isPlaying: nextPlaying,
                status: nextStatus,
            };
        });
    };

    resetSimulation = () => {
        // Return agent cylinder mesh to original starting point
        if (this.agentMeshRef.current) {
            this.agentMeshRef.current.position = new BABYLON.Vector3(this.agentPos.x, this.agentPos.y, this.agentPos.z);
        }
        
        this.setSimState((prev) => {
            const nextState = {
                ...prev,
                isPlaying: false,
                currentWaypointIndex: 0,
                progress: 0,
                status: 'idle',
            };
            
            this.stateRef.current.simState = nextState;
            return nextState;
        });

        this.setNotification({ message: 'Simulation reset to start coordinate.', type: 'info' });
    };

    
    stepForward = () => {
        const { path, currentWaypointIndex } = this.simState;
        if (path.length === 0) return;
        
        const nextIndex = Math.min(path.length - 1, currentWaypointIndex + 1);
        const targetPt = path[nextIndex];

        if (this.agentMeshRef.current) {
            this.agentMeshRef.current.position = new BABYLON.Vector3(targetPt.x, targetPt.y, targetPt.z);
        }

        this.setSimState((prev) => {
            const nextState = {
                ...prev,
                currentWaypointIndex: nextIndex,
                status: nextIndex === path.length - 1 ? 'completed' : 'paused',
            };
            this.stateRef.current.simState = nextState;
            return nextState;
        });
    };

    stepBackward = () => {
        const { path, currentWaypointIndex } = this.simState;
        if (path.length === 0) return;

        const prevIndex = Math.max(0, currentWaypointIndex - 1);
        const targetPt = path[prevIndex];

        if (this.agentMeshRef.current) {
            this.agentMeshRef.current.position = new BABYLON.Vector3(targetPt.x, targetPt.y, targetPt.z);
        }

        this.setSimState((prev) => {
            const nextState = {
                ...prev,
                currentWaypointIndex: prevIndex,
                status: 'paused',
            };
            this.stateRef.current.simState = nextState;
            return nextState;
        });
    };

    changeSpeed = (newSpeed) => {
        this.setSimState((prev) => {
            const nextState = { ...prev, speed: newSpeed };
            this.stateRef.current.simState = nextState;
            return nextState;
        });
    };
}