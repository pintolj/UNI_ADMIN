import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import AdminLayout from './layouts/AdminLayout'
import Home from './pages/Home'
import Horarios from './pages/Horarios'
import MisTareas from './pages/MisTareas'
import Repositorio from './pages/Repositorio'
import Enlaces from './pages/Enlaces'
import CalculadoraNotas from './pages/CalculadoraNotas'
import Profesores from './pages/Profesores'
import Estudiantes from './pages/Estudiantes'
import Login from './pages/Login'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/horarios" element={<Horarios />} />
            <Route path="/tareas" element={<MisTareas />} />
            <Route path="/repositorio" element={<Repositorio />} />
            <Route path="/enlaces" element={<Enlaces />} />
            <Route path="/notas" element={<CalculadoraNotas />} />
            <Route path="/profesores" element={<Profesores />} />
            <Route path="/estudiantes" element={<Estudiantes />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
