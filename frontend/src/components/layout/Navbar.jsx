import { Bell, Search, Menu } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLocation } from 'react-router-dom';

const routeTitles = {
  '/dashboard': 'Dashboard',
  '/pegawai': 'Data Pegawai',
  '/import': 'Import Data Fingerprint',
  '/absensi': 'Data Absensi Fingerprint',
  '/laporan': 'Rekap Laporan Absensi',
  '/settings': 'Pengaturan',
};

export default function Navbar({ onMenuClick }) {
  const { user } = useAuthStore();
  const location = useLocation();
  const title = Object.entries(routeTitles).find(([path]) => location.pathname.startsWith(path))?.[1] || 'SIAP';
  const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-white border-b border-gray-100 z-40 flex items-center px-6 gap-4 shadow-sm">
      <div className="flex-1">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        <p className="text-xs text-gray-400">{today}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Notification */}
        <button className="relative btn-icon hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-gray-800 leading-tight">{user?.nama}</p>
            <p className="text-xs text-gray-400 capitalize">{user?.role}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-bold">
            {user?.nama?.[0] || 'A'}
          </div>
        </div>
      </div>
    </header>
  );
}
