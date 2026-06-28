
export default function Header({orbitControls, setOrbitControls, setNotification}) {
    return (
        <header id="sim-header" className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
            <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-slate-900 rounded-full" />
            <div>
                <h1 className="text-lg font-bold tracking-tight text-slate-900 font-sans">NavMesh Pathfinding Simulator</h1>
                <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Babylon.js 3D Recast &amp; A* Pathfinder</p>
            </div>
            </div>

            {/* Global Action Tools */}
            <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-md border border-slate-200/50 text-[11px]">
                <button
                onClick={() => setOrbitControls(true)}
                className={`px-3 py-1.5 rounded-sm font-medium transition-all ${
                    orbitControls
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Drag with left click to rotate camera view"
                >
                Orbit View
                </button>
                <button
                onClick={() => {
                    setOrbitControls(false);
                    setNotification({ message: 'Orbit controls unlocked. Click on tiles to place blocks/points!', type: 'info' });
                }}
                className={`px-3 py-1.5 rounded-sm font-medium transition-all ${
                    !orbitControls
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Click on grid tiles directly to interact"
                >
                Interactive Mode
                </button>
            </div>
            </div>
        </header>
    )
}