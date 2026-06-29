
export default function GridPainting(editMode, setEditMode, setOrbitControls, clearCubes, setStep){

    return(
        <div className="space-y-5">
            <div>
                <h3 className="font-semibold text-slate-900 text-sm mb-1">Step 1: Grid Block Painting</h3>
                <p className="text-xs text-slate-400 leading-relaxed">Add or remove obstacle blocks. The generated navigation mesh will route the agent around these boundaries.</p>
            </div>

            {/* Edit Tool Selector */}
            <div className="grid grid-cols-3 p-0.5 bg-slate-100 rounded-md border border-slate-200/40 text-[11px]">
                <button
                onClick={() => {
                    setEditMode('add');
                    setOrbitControls(false); // convenient toggle for painting
                }}
                className={`py-2 text-center rounded-sm font-medium transition-all ${
                    editMode === 'add'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                >
                Add
                </button>
                <button
                onClick={() => {
                    setEditMode('remove');
                    setOrbitControls(false); // convenient toggle for erasing
                }}
                className={`py-2 text-center rounded-sm font-medium transition-all ${
                    editMode === 'remove'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                >
                Erase
                </button>
                <button
                onClick={() => {
                    setEditMode('drag');
                    setOrbitControls(false); // convenient toggle for dragging
                }}
                className={`py-2 text-center rounded-sm font-medium transition-all ${
                    editMode === 'drag'
                    ? 'bg-white text-slate-900 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                >
                Drag
                </button>
            </div>

            {/* Grid Painting helper tip */}
            <div className="p-3.5 bg-slate-50 rounded-md border border-slate-200/50 text-[11px] text-slate-500 leading-relaxed">
                <span className="font-semibold text-slate-850 block mb-1">Painting &amp; Dragging Guide</span>
                Select <span className="font-semibold">Interactive Mode</span> in the top header. In <span className="font-semibold">Add</span> mode, click grid tiles to build obstacles. In <span className="font-semibold">Erase</span> mode, click to delete. In <span className="font-semibold">Drag</span> mode, click and hold to drag obstacle blocks smoothly around!
            </div>

            {/* Clear utility */}
            <button
                onClick={clearCubes}
                className="w-full py-2 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md text-[11px] font-medium transition-all"
            >
                Clear Current Grid
            </button>

            <div className="border-t border-slate-100 pt-4">
                <button
                onClick={() => setStep('navmesh')}
                className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-white font-medium text-xs rounded-md transition-all text-center block uppercase tracking-wider"
                >
                Compute NavMesh →
                </button>
            </div>
        </div>
    )
}