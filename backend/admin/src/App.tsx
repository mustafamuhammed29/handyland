import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LayoutDashboard, Smartphone, Wrench, Settings, LogOut, Headphones, ScanLine, FileText, Package, Users, Mail, ShoppingCart, CreditCard, Truck, MessageSquare, Star, Box, PhoneForwarded, ShieldCheck, Languages } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import InventoryManager from './pages/InventoryManager';
import { ActiveCarts } from './components/ActiveCarts';
import ProductsManager from './pages/ProductsManager';
import RepairManager from './pages/RepairManager';
import SettingsManager from './pages/SettingsManager';
import AccessoriesManager from './pages/AccessoriesManager';
import ArchiveManager from './pages/ArchiveManager';
import RepairTicketManager from './pages/RepairTicketManager';
import PageManager from './pages/PageManager';
import ValuationManager from './pages/ValuationManager';
import OrdersManager from './pages/OrdersManager';
import UsersManager from './pages/UsersManager';
import EmailManager from './pages/EmailManager';
import PaymentManager from './pages/PaymentManager';
import ShippingManager from './pages/ShippingManager';
import MessagesManager from './pages/MessagesManager';
import CouponManager from './pages/CouponManager';
import ReviewsManager from './pages/ReviewsManager';
import Login from './pages/Login';
import WalletManager from './pages/WalletManager';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoanerManager from './pages/LoanerManager';
import WarrantyManager from './pages/WarrantyManager';
import TranslationManager from './pages/TranslationManager';

const SidebarLink = ({ to, icon: Icon, label }: { to: string, icon: React.ElementType, label: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link
      to={to}
      className={`relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-300 overflow-hidden group ${isActive ? 'text-white bg-blue-500/10' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
    >
      {/* Active Indicator Line */}
      {isActive && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-2/3 bg-blue-500 rounded-r-md shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
      )}
      <Icon size={18} className={`transition-all duration-300 ${isActive ? 'text-blue-400' : 'group-hover:text-blue-400 group-hover:scale-110'}`} />
      <span className="font-medium text-sm tracking-wide">{label}</span>
    </Link>
  );
};

const SidebarSectionHeader = ({ title }: { title: string }) => (
  <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-6 mb-2 px-4">
    {title}
  </h3>
);


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
    // Minimalist deep modern background
    <div className="flex min-h-screen bg-[#060B19] text-white font-sans selection:bg-blue-500/30 overflow-x-hidden">
      
      {/* Sidebar - Glassmorphism */}
      <aside className="w-[280px] border-r border-slate-800/60 p-5 flex flex-col fixed h-full bg-[#0B1120]/95 backdrop-blur-3xl z-40">
        
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-8 px-2">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            <Settings className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">HandyLand</h1>
            <p className="text-[10px] text-blue-400 font-mono tracking-widest uppercase mt-0.5">Admin_Console</p>
          </div>
        </div>

        {/* User Profile Glass Card */}
        {user && (
          <div className="mb-6 p-4 glass-panel rounded-2xl flex flex-col gap-1 shadow-lg shadow-black/20">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-slate-400">{user.email}</p>
            <div className="flex mt-2">
              <span className="px-2 py-0.5 border border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px] font-bold uppercase tracking-wider rounded-md">
                {user.role}
              </span>
            </div>
          </div>
        )}

        {/* Organized Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto pr-2 custom-scrollbar pb-6">
          <SidebarSectionHeader title="Overview" />
          <SidebarLink to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarLink to="/messages" icon={MessageSquare} label="Inbox" />

          <SidebarSectionHeader title="Shop & Orders" />
          <SidebarLink to="/carts" icon={ShoppingCart} label="Active Carts" />
          <SidebarLink to="/orders" icon={Package} label="Orders" />
          <SidebarLink to="/products" icon={Smartphone} label="Products" />
          <SidebarLink to="/accessories" icon={Headphones} label="Accessories" />

          <SidebarSectionHeader title="Repairs & Services" />
          <SidebarLink to="/repairs" icon={Wrench} label="Repairs Catalog" />
          <SidebarLink to="/repair-tickets" icon={FileText} label="Repair Tickets" />
          <SidebarLink to="/archive" icon={ScanLine} label="Repair Archive" />
          <SidebarLink to="/loaners" icon={PhoneForwarded} label="Loaner Phones" />
          <SidebarLink to="/valuation" icon={FileText} label="Valuation Tool" />

          <SidebarSectionHeader title="Marketing & Users" />
          <SidebarLink to="/users" icon={Users} label="Users" />
          <SidebarLink to="/reviews" icon={Star} label="Reviews" />
          <SidebarLink to="/coupons" icon={ScanLine} label="Coupons" />
          <SidebarLink to="/warranties" icon={ShieldCheck} label="Smart Warranty" />
          <SidebarLink to="/emails" icon={Mail} label="Email Campaigns" />

          <SidebarSectionHeader title="System Configuration" />
          <SidebarLink to="/wallet" icon={CreditCard} label="Wallet Manager" />
          <SidebarLink to="/inventory" icon={Box} label="Inventory & Sales" />
          <SidebarLink to="/payment" icon={CreditCard} label="Payments" />
          <SidebarLink to="/shipping" icon={Truck} label="Shipping" />
          <SidebarLink to="/pages" icon={FileText} label="Content Pages" />
          <SidebarLink to="/translations" icon={Languages} label="Translations" />
          <SidebarLink to="/settings" icon={Settings} label="Global Settings" />
        </nav>

        {/* Elegant Logout Button */}
        <div className="pt-4 mt-2 border-t border-slate-800/50 pb-2">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:text-white hover:bg-red-500 border border-red-500/20 rounded-xl transition-all duration-300 group"
          >
            <LogOut size={18} className="transition-transform group-hover:-translate-x-1" />
            <span className="font-medium text-sm">Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-[280px] p-8 relative min-h-screen">
          {/* Ambient Glows for premium feel */}
          <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
          <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full pointer-events-none z-0" />
          
        <div className="max-w-[1600px] mx-auto relative z-10 w-full">
          {children}
        </div>
      </main>
    </div>
  );
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
                  <Route path="/wallet" element={<WalletManager />} />
                  <Route path="/inventory" element={<InventoryManager />} />
                  <Route path="/orders" element={<OrdersManager />} />
                  <Route path="/products" element={<ProductsManager />} />
                  <Route path="/accessories" element={<AccessoriesManager />} />
                  <Route path="/coupons" element={<CouponManager />} />
                  <Route path="/repairs" element={<RepairManager />} />
                  <Route path="/repair-tickets" element={<RepairTicketManager />} />
                  <Route path="/archive" element={<ArchiveManager />} />
                  <Route path="/loaners" element={<LoanerManager />} />
                  <Route path="/warranties" element={<WarrantyManager />} />
                  <Route path="/valuation" element={<ValuationManager />} />
                  <Route path="/messages" element={<MessagesManager />} />
                  <Route path="/pages" element={<PageManager />} />
                  <Route path="/reviews" element={<ReviewsManager />} />

                  <Route path="/payment" element={<PaymentManager />} />
                  <Route path="/shipping" element={<ShippingManager />} />
                  <Route path="/emails" element={<EmailManager />} />
                  <Route path="/settings" element={<SettingsManager />} />
                  <Route path="/translations" element={<TranslationManager />} />
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
      <Toaster 
        position="top-right" 
        toastOptions={{ 
            style: { background: '#0f172a', color: '#fff', border: '1px solid #1e293b' },
            success: { iconTheme: { primary: '#10b981', secondary: '#fff' } }
        }} 
      />
      <AppContent />
    </AuthProvider>
  );
}

export default App;
