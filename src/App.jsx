import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import heroImg from './assets/hero.png'
import './App.css'
import NavMeshSimulator from './components/NavMeshSimulator'

function Landing({setStart}) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-gray-100">
      <button className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white shadow-md hover:bg-blue-700 transition duration-200"
        onClick={()=>setStart(true)}>
        Start
      </button>
    </div>
  );
}

function App() {

  const [start, setStart] = useState(false)

  return (
    <>
    { !start ? <Landing setStart={setStart} /> : <NavMeshSimulator /> }
    </>
  )
}

export default App
