import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Layout from './components/Layout';
import FloatingAssistants from './components/FloatingAssistants';
import Stock from './pages/Stock';
import History from './pages/History';
import Configuration from './pages/Configuration';
import ProtectedRoute from './routes/ProtectedRoute';
import Users from './pages/Users';

const Unauthorized = () => (
    <div className="p-8 text-center text-red-600">
        <h1 className="text-2xl font-bold">403 - Acceso Denegado</h1>
        <p>No tienes los permisos requeridos para ver esta sección.</p>
    </div>
);

// Wrapper para inyectar el widget flotante a las rutas hijas
const FloatingLayout = () => (
    <>
        <Outlet />
        <FloatingAssistants />
    </>
);

function App() {
    return (
        <Router>
            <Routes>
                {/* Rutas Públicas */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/unauthorized" element={<Unauthorized />} />

                {/* Rutas Protegidas dentro del Layout */}
                <Route element={<ProtectedRoute allowedRoles={['admin', 'operator']} />}>
                    <Route element={<Layout />}>
                        <Route element={<FloatingLayout />}>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/stock" element={<Stock />} />
                            <Route path="/history" element={<History />} />
                            <Route path="/configuration" element={<Configuration />} />
                            <Route path="/users" element={<Users />} />
                        </Route>
                    </Route>
                </Route>

                {/* Redirección por defecto */}
                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </Router>
    );
}

export default App;