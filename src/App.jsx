import { Routes, Route } from 'react-router-dom'
import Login from './pages/Login/Login'
import Painel from './pages/Painel/Painel'
import './styles/global.css'

function App() {
  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/painel" element={<Painel />} />
      </Routes>
    </div>
  )
}

export default App