import './App.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Login from './pages/Login'
import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute from './routes/PublicRoute'
import Dashboard from './pages/Dashboard'
import DashboardLayout from './components/DashboardLayout'
import DashboardAdmins from './pages/Admins'
import DashboardAddAdmin from './pages/AddAdmin'
import { CollaboratorsManagement, AddCollaboratorPage } from './pages/collaborator'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import CategoriesManagement from './pages/products/caregories/CategoriesManagement'
import Vehicles from './pages/distribution/Vehicles'
import VehicleAssignment from './pages/distribution/VehicleAssignment'
import { ViewProducts, AddProduct, ImportProducts } from './pages/products'
import CategoriasClientes from './pages/clientes/CategoriasClientes'
import VerClientes from './pages/clientes/VerClientes'
import NuevoCliente from './pages/clientes/NuevoCliente'
import ClientDetails from './pages/clientes/ClientDetails'
import ImportarClientes from './pages/clientes/ImportarClientes'
import { VerCompras, RealizarCompra } from './pages/compras'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <Login />
                </PublicRoute>
              }
            />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="admins" element={<DashboardAdmins />} />
              <Route path="admins/add" element={<DashboardAddAdmin />} />
              <Route path="colaboradores" element={<CollaboratorsManagement />} />
              <Route path="colaboradores/agregar" element={<AddCollaboratorPage />} />
              <Route path="profile" element={<Profile />} />
              <Route path="change-password" element={<ChangePassword />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="products" element={<ViewProducts />} />
              <Route path="products/add" element={<AddProduct />} />
              <Route path="clientes" element={<VerClientes />} />
              <Route path="clientes/nuevo" element={<NuevoCliente />} />
              <Route path="clientes/importar" element={<ImportarClientes />} />
              <Route path="clientes/:id" element={<ClientDetails />} />
              <Route path="clientes/categorias" element={<CategoriasClientes />} />
              <Route path="products/import" element={<ImportProducts />} />
              <Route path="distribution/vehicles" element={<Vehicles />} />
              <Route path="distribution/assignments" element={<VehicleAssignment />} />
              <Route path="compras" element={<VerCompras />} />
              <Route path="compras/realizar" element={<RealizarCompra />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
