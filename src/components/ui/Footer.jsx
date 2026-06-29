export default function Footer({cubes}){
    return(
        <footer className="p-4 border-t border-slate-200 bg-slate-50/50 text-[10px] text-slate-400 font-mono flex items-center justify-between">
            <span>Grid Range: [-5, 5]</span>
            <span>Obstacles: {cubes.length}</span>
        </footer>
    )
}