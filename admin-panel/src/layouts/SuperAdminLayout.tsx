import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Key, Settings, LogOut, Megaphone } from 'lucide-react';
import { useAppStore, useCurrentUser } from '../lib/store';

const SidebarItem = ({ icon: Icon, label, to }: { icon: React.ElementType, label: string, to: string }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-primary-50 text-primary-700 font-semibold' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600 font-medium'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
};

export const SuperAdminLayout = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const logout = useAppStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold uppercase tracking-wider"><span className="text-primary">Spa</span><span className="text-secondary">POS</span></h1>
          <span className="block text-[8px] text-gray-400 font-semibold tracking-normal normal-case -mt-1 mb-1">powered by catcachcode</span>
          <p className="text-sm text-gray-500 mt-1">Super Admin Portal</p>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/super-admin" />
          <SidebarItem icon={Users} label="Spas & Tenants" to="/super-admin/spas" />
          <SidebarItem icon={CreditCard} label="Subscriptions" to="/super-admin/plans" />
          <SidebarItem icon={Megaphone} label="Marketing & Campaigns" to="/super-admin/marketing" />
          
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">System</div>
          <SidebarItem icon={Key} label="Licenses" to="/super-admin/licenses" />
          <SidebarItem icon={Settings} label="Settings" to="/super-admin/settings" />
        </nav>

        <div className="p-4 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="bg-secondary h-16 flex items-center justify-between px-8 text-white sticky top-0 z-40">
          <h2 className="text-xl font-semibold">Super Admin Dashboard</h2>
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};
