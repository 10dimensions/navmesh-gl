export default function PathFinder({setActivePlacement, setOrbitControls, activePlacement, simState,
                                    stepBackward, togglePlayPause, stepForward, resetSimulation, agentPos, changeSpeed
                                   }) {
    return(
        <div className="space-y-5">
            <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Step 3: Run Simulation</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Reposition start and end points directly. Click anywhere on the grid to direct the agent.</p>
            </div>

            {/* Actor reposition switch */}
            <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">Click Destination Selector</span>
                <div className="grid grid-cols-2 p-0.5 bg-slate-100 rounded-md border border-slate-200/40 text-[11px]">
                <button
                    onClick={() => {
                    setActivePlacement('agent');
                    setOrbitControls(false); // toggle camera off
                    }}
                    className={`py-2 text-center rounded-sm font-medium transition-all ${
                    activePlacement === 'agent'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Place Agent Position
                </button>
                <button
                    onClick={() => {
                    setActivePlacement('target');
                    setOrbitControls(false); // toggle camera off
                    }}
                    className={`py-2 text-center rounded-sm font-medium transition-all ${
                    activePlacement === 'target'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                >
                    Place Target Position
                </button>
                </div>
            </div>

            {/* Real-time simulation controller deck */}
            <div className="bg-slate-50 p-4 rounded-md border border-slate-200/50 space-y-4">
                <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Simulation Controls</span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${
                    simState.status === 'running' ? 'bg-slate-900 text-white' :
                    simState.status === 'paused' ? 'bg-slate-200 text-slate-700' :
                    simState.status === 'completed' ? 'bg-slate-200 text-slate-700' : 'bg-slate-100 text-slate-450'
                }`}>
                    {simState.status}
                </span>
                </div>

                {/* Playback Buttons row */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                <button
                    onClick={stepBackward}
                    disabled={simState.path.length === 0}
                    className="py-1.5 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 font-medium rounded-sm text-slate-750"
                    title="Step Backward"
                >
                    Prev
                </button>
                
                <button
                    onClick={togglePlayPause}
                    className="py-1.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-semibold rounded-sm tracking-wider uppercase text-xs"
                    title={simState.isPlaying ? 'Pause' : 'Play'}
                >
                    {simState.isPlaying ? 'Pause' : 'Play'}
                </button>

                <button
                    onClick={stepForward}
                    disabled={simState.path.length === 0}
                    className="py-1.5 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 font-medium rounded-sm text-slate-750"
                    title="Step Forward"
                >
                    Next
                </button>
                
                <button
                    onClick={resetSimulation}
                    className="py-1.5 px-2.5 bg-white border border-slate-200 hover:bg-slate-100 font-medium rounded-sm text-slate-750"
                    title="Reset agent to start"
                >
                    Reset
                </button>
                </div>

                {/* Speed selector multiplier */}
                <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Playback Speed</span>
                <div className="grid grid-cols-4 gap-1">
                    {[0.5, 1.0, 2.0, 4.0].map((spd) => (
                    <button
                        key={spd}
                        onClick={() => changeSpeed(spd)}
                        className={`py-1 text-xs font-mono rounded-sm border text-center transition-all ${
                        simState.speed === spd
                            ? 'bg-slate-900 text-white border-slate-900 font-bold'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                        }`}
                    >
                        {spd}x
                    </button>
                    ))}
                </div>
                </div>
            </div>

            {/* Current Path Stats */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Path Metrics</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-sm border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Route Waypoints</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs">{simState.path.length} pts</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-sm border border-slate-200/50">
                    <span className="text-[10px] text-slate-400 block mb-0.5">Agent Position</span>
                    <span className="font-semibold text-slate-800 font-mono text-xs text-ellipsis overflow-hidden">
                    ({agentPos.x.toFixed(1)}, {agentPos.z.toFixed(1)})
                    </span>
                </div>
                </div>
            </div>

            <div className="flex pt-4 border-t border-slate-100">
                <button
                onClick={() => setStep('navmesh')}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-sm transition-all text-center"
                >
                ← Back to NavMesh
                </button>
            </div>
        </div>
    )
}