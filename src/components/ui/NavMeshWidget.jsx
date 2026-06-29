export default function NavMeshWidget({navParams, setNavParams, setStep}){
    return(
        <div className="space-y-5">
            <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Step 2: NavMesh Configurations</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Adjust Recast parameters to generate a custom navigation mesh over your scene geometry.</p>
            </div>

            {/* Recast variables controller */}
            <div className="space-y-4">
                <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>Cell Size</span>
                    <span className="font-mono text-slate-400">{navParams.cs}m</span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={navParams.cs}
                    onChange={(e) => setNavParams({ ...navParams, cs: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                </div>

                <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>Cell Height</span>
                    <span className="font-mono text-slate-400">{navParams.ch}m</span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={navParams.ch}
                    onChange={(e) => setNavParams({ ...navParams, ch: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                </div>

                <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>Max Slope Angle</span>
                    <span className="font-mono text-slate-400">{navParams.walkableSlopeAngle}°</span>
                </div>
                <input
                    type="range"
                    min="0"
                    max="90"
                    step="5"
                    value={navParams.walkableSlopeAngle}
                    onChange={(e) => setNavParams({ ...navParams, walkableSlopeAngle: parseInt(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                </div>

                <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>Radius Clearance</span>
                    <span className="font-mono text-slate-400">{navParams.walkableRadius}m</span>
                </div>
                <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={navParams.walkableRadius}
                    onChange={(e) => setNavParams({ ...navParams, walkableRadius: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                </div>

                <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-medium text-slate-600">
                    <span>Height Clearance</span>
                    <span className="font-mono text-slate-400">{navParams.walkableHeight}m</span>
                </div>
                <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={navParams.walkableHeight}
                    onChange={(e) => setNavParams({ ...navParams, walkableHeight: parseFloat(e.target.value) })}
                    className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                />
                </div>
            </div>

            {/* Recast parameters tip */}
            <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200/50 text-[11px] text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800 block mb-1">Visualization Info:</span>
                The green translucent surface overlays represent walkable regions derived from your custom grid obstacles.
            </div>

            <div className="flex gap-2 pt-4 border-t border-slate-100 text-xs">
                <button
                onClick={() => setStep('edit')}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-md transition-all text-center animate-none"
                >
                ← Edit Grid
                </button>
                <button
                onClick={() => setStep('simulate')}
                className="flex-1 py-2 bg-slate-950 hover:bg-slate-800 text-white font-medium rounded-md transition-all text-center animate-none"
                >
                Simulate Path →
                </button>
            </div>
        </div>
    )
}