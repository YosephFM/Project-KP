import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { Toaster } from 'react-hot-toast';

export default function Layout({ children }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 pt-16 p-6">
          {children}
        </main>
        <footer className="ml-0 px-6 py-3 text-xs text-gray-400 border-t border-gray-100 bg-white">
          © 2025 Dinas Lingkungan Hidup Kota Palembang — SIAP v2.0.0
        </footer>
      </div>
      <Toaster position="top-right" toastOptions={{
        className: 'text-sm font-medium',
        style: { borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,.12)' },
        success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
      }} />
    </div>
  );
}
