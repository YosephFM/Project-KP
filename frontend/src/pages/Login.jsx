import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Eye, EyeOff, Leaf, Shield, BarChart3, FileSpreadsheet } from 'lucide-react';

export default function Login() {
  const [form, setForm] = useState({ username: 'admin', password: 'admin123' });
  const [showPass, setShowPass] = useState(false);
  const { login, loading, error, clearError } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ok = await login(form.username, form.password);
    if (ok) navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* BG shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-primary-700/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary-500/5 rounded-full blur-2xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center shadow-xl">
              <Leaf size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">SIAP</h1>
              <p className="text-gray-400 text-xs">Sistem Informasi Absensi Pegawai</p>
            </div>
          </div>

          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Kelola Absensi<br />
            <span className="text-primary-400">Lebih Efisien</span>
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
            Platform manajemen absensi terintegrasi dengan mesin fingerprint untuk Dinas Lingkungan Hidup Kota Palembang.
          </p>
        </div>

        <div className="relative space-y-4">
          {[
            { icon: Shield, title: 'Terintegrasi Fingerprint', desc: 'Sinkronisasi data absensi langsung dari mesin fingerprint ZKTeco/Anviz' },
            { icon: BarChart3, title: 'Statistik Real-time', desc: 'Pantau kehadiran pegawai setiap hari dengan dashboard interaktif' },
            { icon: FileSpreadsheet, title: 'Export PDF & Excel', desc: 'Generate laporan rekap absensi resmi dalam sekali klik' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
              <div className="w-9 h-9 rounded-lg bg-primary-600/20 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-primary-400" />
              </div>
              <div>
                <h4 className="text-white text-sm font-semibold">{title}</h4>
                <p className="text-gray-400 text-xs mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="relative">
          <p className="text-gray-500 text-xs">© 2025 Dinas Lingkungan Hidup Kota Palembang</p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">SIAP</h1>
              <p className="text-gray-500 text-xs">DLH Kota Palembang</p>
            </div>
          </div>

          <div className="card p-8">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800">Masuk ke Dashboard</h2>
              <p className="text-gray-500 text-sm mt-1">Masukkan kredensial akun admin Anda</p>
            </div>

            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2.5 text-red-600 text-sm">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                {error}
                <button onClick={clearError} className="ml-auto text-red-400 hover:text-red-600">✕</button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">Username</label>
                <div className="relative">
                  <input
                    type="text"
                    className="form-input pl-10"
                    placeholder="Masukkan username"
                    value={form.username}
                    onChange={(e) => setForm(p => ({ ...p, username: e.target.value }))}
                    required
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>
                </div>
              </div>

              <div>
                <label className="form-label">Password</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    className="form-input pl-10 pr-10"
                    placeholder="Masukkan password"
                    value={form.password}
                    onChange={(e) => setForm(p => ({ ...p, password: e.target.value }))}
                    required
                  />
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                  <span className="text-sm text-gray-600">Ingat saya</span>
                </label>
                <a href="#" className="text-sm text-primary-600 hover:text-primary-700 font-medium">Lupa password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn btn-primary btn-lg justify-center"
              >
                {loading ? (
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                ) : null}
                {loading ? 'Memproses...' : 'Masuk ke Dashboard'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <div className="flex items-center justify-center gap-1.5 text-gray-400 text-xs">
                <Shield size={12} />
                <span>Sistem dilindungi enkripsi SSL/TLS</span>
              </div>
              <p className="text-gray-400 text-xs mt-1">SIAP v2.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
