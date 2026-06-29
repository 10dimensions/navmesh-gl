export default function Notification({notification}) {
    return( 
        <div className="absolute bottom-5 left-5 right-5 md:left-auto md:max-w-md p-3 bg-slate-900 text-white text-xs font-mono rounded-sm shadow-md border border-slate-800 transition-all flex items-center justify-between">
            <div className="flex items-center gap-2">
                <span className={`w-1.5 h-1.5 rounded-full ${
                    notification.type === 'success' ? 'bg-emerald-400' :
                    notification.type === 'warning' ? 'bg-amber-400' : 'bg-cyan-400'
                }`} />
                <p className="leading-relaxed">{notification.message}</p>
            </div>
        </div>
    )
}
