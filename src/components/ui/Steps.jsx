

export default function Steps({step, setStep}) {
    return(
        <div className="p-5 border-b border-slate-100">
            <h2 className="text-[10px] font-bold tracking-wider uppercase text-slate-400 mb-3">Workflow Progress</h2>
            <div className="flex border border-slate-200 rounded-md overflow-hidden text-xs">
              <button
                onClick={() => setStep('edit')}
                className={`flex-1 py-2.5 text-center transition-all ${
                  step === 'edit'
                    ? 'bg-slate-950 text-white font-medium'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-r border-slate-200'
                }`}
              >
                1. Edit
              </button>
              <button
                onClick={() => setStep('navmesh')}
                className={`flex-1 py-2.5 text-center transition-all ${
                  step === 'navmesh'
                    ? 'bg-slate-950 text-white font-medium'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-r border-slate-200'
                }`}
              >
                2. NavMesh
              </button>
              <button
                onClick={() => setStep('simulate')}
                className={`flex-1 py-2.5 text-center transition-all ${
                  step === 'simulate'
                    ? 'bg-slate-950 text-white font-medium'
                    : 'bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                3. Run
              </button>
            </div>
        </div>
    )
}