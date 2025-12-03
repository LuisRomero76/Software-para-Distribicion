import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Users, ChevronDown, ChevronUp, UserPlus, LogOut, Menu, TrendingUp, User, Lock, Package, List } from 'lucide-react';
import logo from '../assets/logo.png';
import { useAuth } from '../context/AuthContext';

export default function DashboardLayout() {
    const { theme, toggleTheme } = useTheme();
    const { auth, logout } = useAuth();
    const [showLogout, setShowLogout] = useState(false);
    const [adminMenuOpen, setAdminMenuOpen] = useState(true);
    const [productMenuOpen, setProductMenuOpen] = useState(true);
    const [sidebarCollapsed] = useState(false);
    const [sidebarVisible, setSidebarVisible] = useState(true);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const location = useLocation();

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
                                    <List size={16} /> Registrar categoría
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
