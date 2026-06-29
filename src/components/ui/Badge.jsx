export default function Badge({activePlacement}){
    return(
        <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-sm shadow-sm border border-slate-200 flex items-center gap-2 text-xs font-mono text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900" />
            <span>
            ACTIVE PLACEMENT: <span className="font-bold text-slate-900 uppercase">{activePlacement}</span>
            </span>
        </div>
    )
}