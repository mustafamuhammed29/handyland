import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Smartphone, Wrench, Settings, LogOut, Headphones, ScanLine, FileText, Package, Users, Mail, ShoppingCart } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import { ActiveCarts } from './components/ActiveCarts';
import ProductsManager from './pages/ProductsManager';
import RepairManager from './pages/RepairManager';
import SettingsManager from './pages/SettingsManager';
import AccessoriesManager from './pages/AccessoriesManager';
import ArchiveManager from './pages/ArchiveManager';
import PageManager from './pages/PageManager';
import ValuationManager from './pages/ValuationManager';
import OrdersManager from './pages/OrdersManager';
import UsersManager from './pages/UsersManager';
import EmailManager from './pages/EmailManager';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './context/AuthContext';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}
    >
      <Icon size={20} />
      <span className="font-bold">{label}</span>
    </Link>
  );
};


const Layout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    // Redirect to login page after logout
    setTimeout(() => {
      navigate('/login', { replace: true });
    }, 100);
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-white font-sans selection:bg-blue-500/30">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 p-6 flex flex-col fixed h-full bg-slate-950 z-10">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Settings className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">HandyLand</h1>
            <p className="text-xs text-slate-500 font-mono">ADMIN_CONSOLE</p>
          </div>
        </div>

        {/* User Info */}
        {user && (
          <div className="mb-6 p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
              {user.role}
            </span>
          </div>
        )}

        <nav className="flex-1 space-y-2">
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/carts" icon={ShoppingCart} label="Active Carts" />
          <SidebarLink to="/users" icon={Users} label="Users" />
          <SidebarLink to="/orders" icon={Package} label="Orders" />
          <SidebarLink to="/products" icon={Smartphone} label="Products" />
          <SidebarLink to="/accessories" icon={Headphones} label="Accessories" />
          <SidebarLink to="/repairs" icon={Wrench} label="Repairs" />
          <SidebarLink to="/archive" icon={ScanLine} label="Repair Archive" />
          <SidebarLink to="/valuation" icon={FileText} label="Valuation" />
          <SidebarLink to="/pages" icon={FileText} label="Content Pages" />
          <SidebarLink to="/emails" icon={Mail} label="Emails" />
          <SidebarLink to="/settings" icon={Settings} label="Global Settings" />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-950/30 rounded-xl transition-all mt-auto"
        >
          <LogOut size={20} />
          <span className="font-bold">Logout</span>
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public Route - Login */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          }
        />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/carts" element={<ActiveCarts />} />
                  <Route path="/users" element={<UsersManager />} />
                  <Route path="/orders" element={<OrdersManager />} />
                  <Route path="/products" element={<ProductsManager />} />
                  <Route path="/accessories" element={<AccessoriesManager />} />
                  <Route path="/repairs" element={<RepairManager />} />
                  <Route path="/archive" element={<ArchiveManager />} />
                  <Route path="/valuation" element={<ValuationManager />} />
                  <Route path="/pages" element={<PageManager />} />
                  <Route path="/emails" element={<EmailManager />} />
                  <Route path="/settings" element={<SettingsManager />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
