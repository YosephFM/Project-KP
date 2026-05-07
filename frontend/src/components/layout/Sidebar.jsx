import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import {
  LayoutDashboard, Users, Upload, ClipboardList, FileText,
  History, LogOut, Leaf, ChevronRight, Settings
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/pegawai', label: 'Data Pegawai', icon: Users },
  { path: '/import', label: 'Import Fingerprint', icon: Upload },
  { path: '/absensi', label: 'Data Absensi', icon: ClipboardList },
  { path: '/laporan', label: 'Rekap Laporan', icon: FileText },
];

export default function Sidebar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed top-0 left-0 h-screen w-64 bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center shadow-lg flex-shrink-0">
            <Leaf size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-base leading-tight">SIAP</h1>
            <p className="text-gray-400 text-[10px] leading-tight">DLH Kota Palembang</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Menu Utama</p>
        {navItems.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`
            }
          >
            <Icon size={17} />
            <span className="flex-1">{label}</span>
            <ChevronRight size={14} className="opacity-40" />
          </NavLink>
        ))}

        <div className="pt-4">
          <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest px-3 mb-3">Pengaturan</p>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `sidebar-item ${isActive ? 'sidebar-item-active' : 'sidebar-item-inactive'}`
            }
          >
            <Settings size={17} />
            <span className="flex-1">Pengaturan</span>
            <ChevronRight size={14} className="opacity-40" />
          </NavLink>
        </div>
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.nama?.[0] || 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.nama}</p>
            <p className="text-gray-400 text-[10px] capitalize">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 text-xs transition-all"
        >
          <LogOut size={14} />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
