import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, UserCircle, Calendar, UsersRound, Calculator, Receipt, Package, DollarSign, Briefcase, Settings, LogOut, Lock, CreditCard, ShieldAlert, ShieldCheck, RefreshCw, Folder, Megaphone, AlertTriangle, Palette } from 'lucide-react';
import { useCurrentUser, useCurrentSpa, useAppStore } from '../lib/store';
import { StatusGate } from '../components/StatusGate';
import { getDirectoryHandle, verifyPermission, readStateFromLocalDirectory, writeStateToLocalDirectory } from '../lib/localFileStorage';

const SidebarItem = ({ icon: Icon, label, to, isLocked }: { icon: React.ElementType, label: string, to: string, isLocked?: boolean }) => {
  const location = useLocation();
  const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
  
  return (
    <Link
      to={to}
      className={`flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
        isActive 
          ? 'bg-primary-50 text-primary-700 font-semibold' 
          : 'text-gray-700 hover:bg-gray-100 hover:text-primary-600 font-medium'
      }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 animate-pulse-subtle" />
        <span>{label}</span>
      </div>
      {isLocked && <Lock className="w-4 h-4 text-gray-400 shrink-0" />}
    </Link>
  );
};

export const SpaOwnerLayout = () => {
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const currentSpa = useCurrentSpa();
  const logout = useAppStore((state) => state.logout);
  const plans = useAppStore((state) => state.plans);
  const hydrateOfflineState = useAppStore((state) => state.hydrateOfflineState);
  const fullState = useAppStore((state) => state);

  // Calculate subscription countdown
  const nextBillingStr = currentSpa?.settings.billing.nextBillingDate || currentSpa?.settings.billing.trialEndsAt;
  let daysLeft: number | null = null;
  if (nextBillingStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(nextBillingStr);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry.getTime() - today.getTime();
    daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  const [permissionState, setPermissionState] = useState<'PENDING' | 'GRANTED' | 'DENIED' | 'NOT_ENABLED'>('NOT_ENABLED');
  const [folderName, setFolderName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const checkOfflineSync = async () => {
      if (!currentSpa?.settings.offlineStorageEnabled) {
        setPermissionState('NOT_ENABLED');
        return;
      }
      
      const handle = (window as any).currentDirectoryHandle || await getDirectoryHandle();
      if (!handle) {
        setPermissionState('PENDING');
        setFolderName('None Assigned');
        return;
      }
      
      setFolderName(handle.name);
      (window as any).currentDirectoryHandle = handle;

      // Check if permission is already granted
      const options = { mode: 'readwrite' as const };
      const hasPermission = (await handle.queryPermission(options)) === 'granted';
      if (hasPermission) {
        setPermissionState('GRANTED');
      } else {
        setPermissionState('PENDING');
      }
    };
    checkOfflineSync();
  }, [currentSpa?.settings.offlineStorageEnabled]);

  useEffect(() => {
    if (permissionState !== 'GRANTED') return;
    const handle = (window as any).currentDirectoryHandle;
    if (!handle) return;

    // Subscribe to store updates and write state to disk
    const unsubscribe = useAppStore.subscribe(async (state) => {
      if (state.session.currentUserId) {
        await writeStateToLocalDirectory(handle, state);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [permissionState]);

  const handleAuthorize = async () => {
    try {
      const handle = (window as any).currentDirectoryHandle || await getDirectoryHandle();
      if (!handle) {
        navigate('/owner/settings');
        return;
      }

      setIsSyncing(true);
      const granted = await verifyPermission(handle, true);
      if (granted) {
        (window as any).currentDirectoryHandle = handle;
        setPermissionState('GRANTED');
        
        // Read local backup database
        const localData = await readStateFromLocalDirectory(handle);
        if (localData) {
          hydrateOfflineState(localData);
        } else {
          // If no backup exists, initialize directory with current database state
          await writeStateToLocalDirectory(handle, fullState);
        }
      } else {
        setPermissionState('DENIED');
      }
    } catch (e) {
      console.error('Failed to authorize folder:', e);
      setPermissionState('DENIED');
    } finally {
      setIsSyncing(false);
    }
  };

  const currentPlan = plans.find(p => p.id === currentSpa?.settings.billing.currentPlanId);
  const currentPlanType = currentPlan?.type || 'BASIC';

  const planHierarchy = {
    'BASIC': 1,
    'STANDARD': 2,
    'PREMIUM': 3,
    'ENTERPRISE': 4
  };
  const currentTier = planHierarchy[currentPlanType as keyof typeof planHierarchy] || 1;

  const isLocked = (requiredType: 'STANDARD' | 'PREMIUM' | 'ENTERPRISE') => {
    return currentTier < planHierarchy[requiredType];
  };

  const dashboardTitle = currentUser?.role === 'SPA_OWNER' 
    ? 'Owner Dashboard' 
    : currentUser?.role === 'MANAGER' 
      ? 'Manager Dashboard' 
      : 'Staff Portal';

  const colorTheme = currentSpa?.settings?.colorTheme || 'classic';
  const colorThemeClass = colorTheme !== 'classic' ? `theme-${colorTheme}` : '';

  return (
    <StatusGate>
      <div className={`min-h-screen bg-gray-50 flex ${currentSpa?.settings?.theme === 'CLAY' ? 'theme-clay' : ''} ${colorThemeClass}`}>
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold uppercase tracking-wider"><span className="text-primary">Spa</span><span className="text-secondary">POS</span></h1>
            <span className="block text-[8px] text-gray-400 font-semibold tracking-normal normal-case -mt-1 mb-1">powered by catcachcode</span>
            <p className="text-sm text-gray-500 mt-1">{currentSpa?.name ?? 'Spa Portal'}</p>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/owner" />
            <SidebarItem icon={Calculator} label="POS System" to="/owner/pos" isLocked={isLocked('STANDARD')} />
            <SidebarItem icon={Receipt} label="Invoices" to="/owner/invoices" isLocked={isLocked('STANDARD')} />
            <SidebarItem icon={UserCircle} label="Customers" to="/owner/customers" />
            <SidebarItem icon={Megaphone} label="Marketing & Campaigns" to="/owner/marketing" />
            <SidebarItem icon={UsersRound} label="Staff Management" to="/owner/staff" isLocked={isLocked('PREMIUM')} />
            <SidebarItem icon={Calendar} label="Appointments" to="/owner/appointments" isLocked={isLocked('STANDARD')} />
            <SidebarItem icon={Package} label="Inventory" to="/owner/inventory" isLocked={isLocked('STANDARD')} />
            <SidebarItem icon={DollarSign} label="Finance" to="/owner/finance" isLocked={isLocked('PREMIUM')} />
            <SidebarItem icon={Briefcase} label="HR & Payroll" to="/owner/hr" isLocked={isLocked('PREMIUM')} />
   
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 mt-8 px-2">Settings</div>
            <SidebarItem icon={Settings} label="Spa Settings" to="/owner/settings" />
            <SidebarItem icon={CreditCard} label="Billing & Plans" to="/owner/billing" />
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
            <h2 className="text-xl font-semibold">{dashboardTitle}</h2>
            <div className="flex items-center gap-4">
              {daysLeft !== null && daysLeft <= 14 && (
                <Link
                  to="/owner/billing"
                  className="flex items-center gap-1.5 text-[10px] bg-amber-500/25 hover:bg-amber-500/35 border border-amber-450/40 text-amber-250 px-3 py-1 rounded-full uppercase font-extrabold tracking-wider transition-colors cursor-pointer text-white no-underline"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                  <span>
                    {daysLeft > 0 
                      ? `${daysLeft} Day${daysLeft === 1 ? '' : 's'} Left` 
                      : daysLeft === 0 
                        ? 'Expires Today' 
                        : 'Expired'}
                  </span>
                </Link>
              )}
              {permissionState === 'GRANTED' && (
                <span className="hidden sm:flex items-center gap-1.5 text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase font-bold tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Local Sync Active
                </span>
              )}
              <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1.5 rounded-lg border border-white/15 text-xs text-white">
                <Palette className="w-3.5 h-3.5 text-primary-200 shrink-0" />
                <select
                  value={currentSpa?.settings?.colorTheme || 'classic'}
                  onChange={(e) => {
                    if (currentSpa) {
                      useAppStore.getState().updateSpaSettings(currentSpa.id, {
                        colorTheme: e.target.value as any
                      });
                    }
                  }}
                  className="bg-transparent border-none text-white outline-none font-semibold cursor-pointer py-0 pr-1 text-[10px] uppercase tracking-wider focus:ring-0 focus:outline-none"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="classic" className="text-gray-800 font-semibold bg-white">Classic Rose</option>
                  <option value="terracotta" className="text-gray-800 font-semibold bg-white">Terracotta</option>
                  <option value="amber" className="text-gray-800 font-semibold bg-white">Golden Amber</option>
                  <option value="peach" className="text-gray-800 font-semibold bg-white">Peach Clay</option>
                  <option value="sandalwood" className="text-gray-800 font-semibold bg-white">Sandalwood</option>
                  <option value="copper" className="text-gray-800 font-semibold bg-white">Copper Glow</option>
                </select>
              </div>
              <span className="text-xs bg-white/20 px-2 py-0.5 rounded uppercase font-bold tracking-wider">
                {currentUser?.role.replace('_', ' ')}
              </span>
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
                {currentUser?.firstName?.[0]}{currentUser?.lastName?.[0]}
              </div>
            </div>
          </header>
          
          {permissionState === 'PENDING' && (
            <div className="mx-8 mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-fade-in shrink-0">
              <div className="flex items-start md:items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5 md:mt-0" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900">Local Directory Sync is Paused</h4>
                  <p className="text-xs text-amber-700 mt-0.5 font-medium">
                    Offline storage mode is active, but the app needs your gesture permission to read and write changes to the directory: <span className="font-bold underline">{folderName}</span>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleAuthorize}
                disabled={isSyncing}
                className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-colors shrink-0 flex items-center gap-2"
              >
                {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Folder className="w-3.5 h-3.5" />}
                Authorize Directory Sync
              </button>
            </div>
          )}

          <div className="flex-1 overflow-auto p-8 font-medium">
            {window.location.hostname !== 'localhost' && 
             window.location.hostname !== '127.0.0.1' && 
             (import.meta.env.VITE_API_URL || 'http://localhost:5002/api/v1').includes('localhost') && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 shadow-sm text-sm shrink-0">
                <span className="text-lg">⚠️</span>
                <div>
                  <strong>Action Required (Deployment Check):</strong> The application is running in production but attempting to connect to a local backend API (<code>localhost:5002</code>). Please configure the environment variable <code>VITE_API_URL</code> on Vercel to point to your live Render backend API (e.g. <code>https://your-service.onrender.com/api/v1</code>).
                </div>
              </div>
            )}
            <Outlet />
          </div>
        </main>
      </div>
    </StatusGate>
  );
};
