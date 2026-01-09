import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Users, ChevronDown, ChevronUp, UserPlus, LogOut, Menu, TrendingUp, User, Lock, Package, List, Truck, Upload, ShoppingCart, MapPin, BarChart3, Wallet, ShoppingBag } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
    const { theme, toggleTheme } = useTheme();
    const { auth, logout } = useAuth();
    const location = useLocation();
    const [showLogout, setShowLogout] = useState(false);
    
    // Determinar cuál menú debe estar abierto basado en la ruta actual
    const isAdminRoute = location.pathname.startsWith('/admins');
    const isCollaboratorRoute = location.pathname.startsWith('/colaboradores');
    const isCategoryRoute = location.pathname.startsWith('/categories');
    const isProductRoute = location.pathname.startsWith('/products') || location.pathname.startsWith('/categories');
    const isClientesRoute = location.pathname.startsWith('/clientes');
    const isDistributionRoute = location.pathname.startsWith('/distribution');
    const isComprasRoute = location.pathname.startsWith('/compras');
    const isVentasRoute = location.pathname.startsWith('/ventas');
    const isFinanzasRoute = location.pathname.startsWith('/finanzas');
    
    const [adminMenuOpen, setAdminMenuOpen] = useState(isAdminRoute);
    const [collaboratorMenuOpen, setCollaboratorMenuOpen] = useState(isCollaboratorRoute);
    const [, setCategoryMenuOpen] = useState(isCategoryRoute);
    const [productMenuOpen, setProductMenuOpen] = useState(isProductRoute);
    const [distributionMenuOpen, setDistributionMenuOpen] = useState(isDistributionRoute);
    const [clientesMenuOpen, setClientesMenuOpen] = useState(isClientesRoute);
    const [comprasMenuOpen, setComprasMenuOpen] = useState(isComprasRoute);
    const [ventasMenuOpen, setVentasMenuOpen] = useState(isVentasRoute);
    const [finanzasMenuOpen, setFinanzasMenuOpen] = useState(isFinanzasRoute);
    const [sidebarCollapsed] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    useEffect(() => {
        setAdminMenuOpen(isAdminRoute);
        setCollaboratorMenuOpen(isCollaboratorRoute);
        setCategoryMenuOpen(isCategoryRoute);
        setProductMenuOpen(isProductRoute);
        setDistributionMenuOpen(isDistributionRoute);
        setClientesMenuOpen(isClientesRoute);
        setComprasMenuOpen(isComprasRoute);
        setVentasMenuOpen(isVentasRoute);
        setFinanzasMenuOpen(isFinanzasRoute);
    }, [location.pathname]);

    return (
        <div className={`dashboard-layout ${!sidebarVisible ? 'sidebar-hidden' : ''}`}>
            {sidebarVisible && (
                <aside className={`sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                    <nav className="sidebar-nav">
                        <Link to="/" className={location.pathname === '/' ? 'active sidebar-link-root' : 'sidebar-link-root'} title="Estadísticas">
                            <TrendingUp size={20} />
                            {!sidebarCollapsed && <span>Estadísticas</span>}
                        </Link>
                        <button className="sidebar-group" onClick={() => setAdminMenuOpen(v => !v)} title="Administradores">
                            <Users size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Administradores</span>
                                    {adminMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {adminMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/admins" className={location.pathname === '/admins' ? 'active' : ''}>
                                    <Users size={16} /> Ver administradores
                                </Link>
                                <Link to="/admins/add" className={location.pathname === '/admins/add' ? 'active' : ''}>
                                    <UserPlus size={16} /> Agregar administrador
                                </Link>
                            </div>
                        )}
                        <button className="sidebar-group" onClick={() => setCollaboratorMenuOpen(v => !v)} title="Colaboradores">
                            <Users size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Colaboradores</span>
                                    {collaboratorMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {collaboratorMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/colaboradores" className={location.pathname === '/colaboradores' ? 'active' : ''}>
                                    <Users size={16} /> Ver colaboradores
                                </Link>
                                <Link to="/colaboradores/agregar" className={location.pathname === '/colaboradores/agregar' ? 'active' : ''}>
                                    <UserPlus size={16} /> Agregar colaborador
                                </Link>
                            </div>
                        )}
                        <button className="sidebar-group" onClick={() => setProductMenuOpen(v => !v)} title="Productos">
                            <Package size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Productos</span>
                                    {productMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {productMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/categories" className={location.pathname === '/categories' ? 'active' : ''}>
                                    <List size={16} /> Gestionar categorías
                                </Link>
                                <Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>
                                    <Package size={16} /> Ver productos
                                </Link>
                                <Link to="/products/add" className={location.pathname === '/products/add' ? 'active' : ''}>
                                    <UserPlus size={16} /> Registrar producto
                                </Link>
                                <Link to="/products/import" className={location.pathname === '/products/import' ? 'active' : ''}>
                                    <Upload size={16} /> Importar productos
                                </Link>
                            </div>
                        )}

                        <button className="sidebar-group" onClick={() => setComprasMenuOpen(v => !v)} title="Compras">
                            <ShoppingCart size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Compras</span>
                                    {comprasMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {comprasMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/compras" className={location.pathname === '/compras' ? 'active' : ''}>
                                    <ShoppingCart size={16} /> Ver compras
                                </Link>
                                <Link to="/compras/realizar" className={location.pathname === '/compras/realizar' ? 'active' : ''}>
                                    <UserPlus size={16} /> Realizar compra
                                </Link>
                                <Link to="/compras/proveedores" className={location.pathname === '/compras/proveedores' ? 'active' : ''}>
                                    <Users size={16} /> Mis proveedores
                                </Link>
                            </div>
                        )}

                        <button className="sidebar-group" onClick={() => setVentasMenuOpen(v => !v)} title="Ventas">
                            <ShoppingBag size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Ventas</span>
                                    {ventasMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {ventasMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/ventas" className={location.pathname === '/ventas' ? 'active' : ''}>
                                    <ShoppingBag size={16} /> Ver ventas
                                </Link>
                                <Link to="/ventas/realizar" className={location.pathname === '/ventas/realizar' ? 'active' : ''}>
                                    <UserPlus size={16} /> Realizar venta
                                </Link>
                            </div>
                        )}

                        <button className="sidebar-group" onClick={() => setClientesMenuOpen(v => !v)} title="Mis Clientes">
                            <User size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Mis Clientes</span>
                                    {clientesMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {clientesMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/clientes/categorias" className={location.pathname === '/clientes/categorias' ? 'active' : ''}>
                                    <List size={16} /> Gestionar categorías
                                </Link>
                                <Link to="/clientes" className={location.pathname === '/clientes' ? 'active' : ''}>
                                    <Users size={16} /> Ver clientes
                                </Link>
                                <Link to="/clientes/nuevo" className={location.pathname === '/clientes/nuevo' ? 'active' : ''}>
                                    <UserPlus size={16} /> Agregar cliente
                                </Link>
                                <Link to="/clientes/importar" className={location.pathname === '/clientes/importar' ? 'active' : ''}>
                                    <Upload size={16} /> Importar clientes
                                </Link>
                            </div>
                        )}

                        <button className="sidebar-group" onClick={() => setFinanzasMenuOpen(v => !v)} title="Finanzas">
                            <Wallet size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Ingresos/Egresos</span>
                                    {finanzasMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {finanzasMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/finanzas/registro-ingresos-egresos" className={location.pathname === '/finanzas/registro-ingresos-egresos' ? 'active' : ''}>
                                    <Wallet size={16} /> Registrar Ingresos/Egresos
                                </Link>
                                <Link to="/finanzas/ver-ingresos-egresos" className={location.pathname === '/finanzas/ver-ingresos-egresos' ? 'active' : ''}>
                                    <Wallet size={16} /> Ver Ingresos/Egresos
                                </Link>
                                <Link to="/finanzas/reporte-ingresos-egresos" className={location.pathname === '/finanzas/reporte-ingresos-egresos' ? 'active' : ''}>
                                    <Wallet size={16} /> Reporte de Ingresos/Egresos
                                </Link>
                                <Link to="/finanzas/categorias" className={location.pathname === '/finanzas/categorias' ? 'active' : ''}>
                                    <Wallet size={16} /> Gestionar Categorías
                                </Link>
                            </div>
                            
                        )}

                        <button className="sidebar-group" onClick={() => setDistributionMenuOpen(v => !v)} title="Distribución">
                            <Truck size={20} />
                            {!sidebarCollapsed && (
                                <>
                                    <span>Distribución</span>
                                    {distributionMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                </>
                            )}
                        </button>
                        {distributionMenuOpen && !sidebarCollapsed && (
                            <div className="sidebar-submenu">
                                <Link to="/distribution/vehicles" className={location.pathname === '/distribution/vehicles' ? 'active' : ''}>
                                    <Truck size={16} /> Ver vehículos
                                </Link>
                                <Link to="/distribution/assignments" className={location.pathname === '/distribution/assignments' ? 'active' : ''}>
                                    <Users size={16} /> Vincular vehículo
                                </Link>
                                <Link to="/distribution/rutas" className={location.pathname === '/distribution/rutas' ? 'active' : ''}>
                                    <MapPin size={16} /> Asignar rutas
                                </Link>
                                <Link to="/distribution/reportes" className={location.pathname === '/distribution/reportes' ? 'active' : ''}>
                                    <BarChart3 size={16} /> Reportes de rutas
                                </Link>
                            </div>
                        )}
                    </nav>
                </aside>
            )}
            <div className="main-area">
                <header className="topbar" data-theme={theme}>
                    <div className="topbar-left">
                        <button
                            className="hamburger-btn"
                            onClick={() => setSidebarVisible(v => !v)}
                            title={sidebarVisible ? 'Ocultar menú' : 'Mostrar menú'}
                        >
                            <Menu size={22} />
                        </button>
                        <img src={logo} alt="Logo" className="topbar-logo" />
                        <div className="topbar-brand">
                            <strong>Vicorsa Group</strong>
                            <span className="topbar-divider">|</span>
                            <span className="topbar-subtitle">Administración</span>
                        </div>
                    </div>
                    <div className="topbar-right">
                        <button className="icon-btn-top" onClick={toggleTheme} aria-label="Cambiar tema" title="Cambiar tema">
                            {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <div className="user-menu-container">
                            <button className="user-menu-btn" onClick={() => setUserMenuOpen(!userMenuOpen)}>
                                <User size={18} />
                                <span className="user-name">{auth?.nombre} {auth?.apellido}</span>
                                <ChevronDown size={16} className={userMenuOpen ? 'rotate-180' : ''} />
                            </button>
                            {userMenuOpen && (
                                <div className="user-dropdown">
                                    <Link to="/profile" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                        <User size={16} /> Editar perfil
                                    </Link>
                                    <Link to="/change-password" className="dropdown-item" onClick={() => setUserMenuOpen(false)}>
                                        <Lock size={16} /> Cambiar contraseña
                                    </Link>
                                    <button className="dropdown-item logout-item" onClick={() => { setUserMenuOpen(false); setShowLogout(true); }}>
                                        <LogOut size={16} /> Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <main className="main-content">
                    <Outlet />
                </main>
                {showLogout && (
                    <div className="modal-overlay" role="dialog" aria-modal="true">
                        <div className="modal">
                            <h3>¿Cerrar sesión?</h3>
                            <p>Se cerrará tu sesión actual en el sistema.</p>
                            <div className="modal-actions">
                                <button className="btn outline" onClick={() => setShowLogout(false)}>Cancelar</button>
                                <button className="btn" onClick={logout}>Sí, cerrar sesión</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
