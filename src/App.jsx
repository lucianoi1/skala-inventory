import React, { useState, useEffect } from 'react';
import { Camera, Package, TrendingUp, CheckCircle, XCircle, Clock, QrCode, FileText, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import { firebaseConfig, supabaseConfig } from './config';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

const InventorySystem = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [inventory, setInventory] = useState([]);
  const [movements, setMovements] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [selectedTube, setSelectedTube] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);

   const ROLES = {
    'almacenista@skala.com': { 
      role: 'almacenista', 
      name: 'Almacenista', 
      permissions: ['create_exit', 'scan', 'view_inventory'] 
    },
    'gerente@skala.com': { 
      role: 'gerente', 
      name: 'Gerente de Operaciones', 
      permissions: ['approve_base_exit', 'view_reports'] 
    },
    'representante@skala.com': { 
      role: 'representante', 
      name: 'Representante a Bordo', 
      permissions: ['approve_ship_entry', 'create_ship_exit', 'scan'] 
    },
    'supervisor@skala.com': { 
      role: 'supervisor', 
      name: 'Supervisor', 
      permissions: ['scan', 'install_tubes'] 
    },
    'lugracia.eta18@gmail.com': { 
      role: 'administrador', 
      name: 'Luciano - Administrador', 
      permissions: ['create_exit', 'scan', 'view_inventory', 'approve_base_exit', 'view_reports', 'approve_ship_entry', 'create_ship_exit', 'install_tubes', 'admin'] 
    }
  };


  useEffect(() => {
    if (currentUser) {
      loadInventory();
      loadMovements();
      loadPendingApprovals();
    }
  }, [currentUser]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase.from('movements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase.from('pending_approvals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = ROLES[email.toLowerCase()];
      if (!userData) {
        await signOut(auth);
        throw new Error('Usuario no autorizado');
      }
      setCurrentUser({ uid: userCredential.user.uid, email: userCredential.user.email, ...userData });
      setCurrentView('dashboard');
      setEmail('');
      setPassword('');
    } catch (error) {
      setLoginError(error.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos' : error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('login');
  };

  const handleScan = (tubeId) => {
    const tube = inventory.find(t => t.id === tubeId);
    if (tube) {
      setSelectedTube(tube);
      setScannerActive(false);
      alert(`✓ Tubo: ${tube.id}\nDiámetro: ${tube.diameter}`);
    }
  };

  const simulateScan = () => {
    setScannerActive(true);
    setTimeout(() => {
      if (inventory.length > 0) {
        const randomTube = inventory[Math.floor(Math.random() * inventory.length)];
        handleScan(randomTube.id);
      }
    }, 2000);
  };

  const createExitRequest = async () => {
    if (!selectedTube) return alert('Escanea un tubo primero');
    try {
      await supabase.from('movements').insert([{
        id: `MOV-${Date.now()}`,
        tube_id: selectedTube.id,
        type: 'Salida Base',
        from_location: 'Base',
        to_location: 'Barco',
        date: new Date().toISOString().split('T')[0],
        user_name: currentUser.name,
        status: 'Pendiente Aprobación'
      }]);
      await supabase.from('pending_approvals').insert([{
        id: `PEND-${Date.now()}`,
        tube_id: selectedTube.id,
        type: 'Salida Base → Barco',
        requested_by: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        tubes: 1
      }]);
      alert('✓ Solicitud creada');
      setSelectedTube(null);
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      alert('Error al crear solicitud');
    }
  };

  const approveMovement = async (pendingId) => {
    try {
      const pending = pendingApprovals.find(p => p.id === pendingId);
      await supabase.from('movements').update({ status: 'Aprobado', approved_by: currentUser.name }).eq('tube_id', pending.tube_id).eq('status', 'Pendiente Aprobación');
      await supabase.from('inventory').update({ location: 'Barco', status: 'En tránsito' }).eq('id', pending.tube_id);
      await supabase.from('pending_approvals').delete().eq('id', pendingId);
      alert(`✓ Aprobado: ${pending.tube_id}`);
      loadInventory();
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      alert('Error al aprobar');
    }
  };

  const rejectMovement = async (pendingId) => {
    try {
      const pending = pendingApprovals.find(p => p.id === pendingId);
      await supabase.from('movements').update({ status: 'Rechazado', rejected_by: currentUser.name }).eq('tube_id', pending.tube_id).eq('status', 'Pendiente Aprobación');
      await supabase.from('pending_approvals').delete().eq('id', pendingId);
      alert(`✗ Rechazado: ${pending.tube_id}`);
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      console.error(error);
    }
  };

  if (currentView === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Package size={40} color="white" />
            </div>
            <h1 style={{ color: '#1a2332', fontSize: '28px', fontWeight: '700', margin: '0 0 10px 0' }}>Skala Energy</h1>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Sistema de Gestión de Inventarios</p>
          </div>
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="usuario@skala.com" style={{ width: '100%', padding: '12px 15px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none' }} />
            </div>
            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleLogin()} placeholder="Contraseña" style={{ width: '100%', padding: '12px 45px 12px 15px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none' }} />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            {loginError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />{loginError}
              </div>
            )}
            <button onClick={handleLogin} disabled={loading} style={{ width: '100%', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>
          <div style={{ marginTop: '30px', padding: '20px', background: '#f0fdf4', borderRadius: '12px', border: '1px solid #86efac' }}>
            <p style={{ fontSize: '12px', fontWeight: '600', color: '#166534', marginBottom: '10px', textAlign: 'center' }}>Usuarios del Sistema</p>
            <div style={{ fontSize: '11px', color: '#15803d', lineHeight: '1.8' }}>
              <p style={{ margin: '4px 0' }}>• almacenista@skala.com</p>
              <p style={{ margin: '4px 0' }}>• gerente@skala.com</p>
              <p style={{ margin: '4px 0' }}>• representante@skala.com</p>
              <p style={{ margin: '4px 0' }}>• supervisor@skala.com</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)', padding: '20px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Package size={32} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Skala Energy</h1>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>{currentUser?.name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setCurrentView('dashboard')} style={navBtn}>Dashboard</button>
            {currentUser?.permissions.includes('scan') && <button onClick={() => setCurrentView('scanner')} style={navBtn}>Escáner</button>}
            <button onClick={() => setCurrentView('movements')} style={navBtn}>Movimientos</button>
            <button onClick={handleLogout} style={{ ...navBtn, background: 'rgba(239, 68, 68, 0.2)' }}>Salir</button>
          </div>
        </div>
      </div>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        {currentView === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <StatCard icon={<Package size={28} />} title="Total Activos" value={inventory.length} color="#3b82f6" />
              <StatCard icon={<TrendingUp size={28} />} title="En Tránsito" value={inventory.filter(i => i.status === 'En tránsito').length} color="#10b981" />
              <StatCard icon={<Clock size={28} />} title="Pendientes" value={pendingApprovals.length} color="#f59e0b" />
              <StatCard icon={<CheckCircle size={28} />} title="Disponibles" value={inventory.filter(i => i.status === 'Disponible').length} color="#8b5cf6" />
            </div>
            {currentUser.permissions.includes('approve_base_exit') && pendingApprovals.length > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><Clock size={24} color="#f59e0b" />Aprobaciones Pendientes</h2>
                {pendingApprovals.map(p => (
                  <div key={p.id} style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '15px', border: '2px solid #fbbf24' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>{p.type}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>Tubo: {p.tube_id}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Por: {p.requested_by} - {p.date}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => approveMovement(p.id)} style={{ ...actionBtn, background: '#10b981' }}><CheckCircle size={18} /> Aprobar</button>
                        <button onClick={() => rejectMovement(p.id)} style={{ ...actionBtn, background: '#ef4444' }}><XCircle size={18} /> Rechazar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div style={card}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>Inventario</h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead><tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['ID', 'Diámetro', 'Longitud', 'Material', 'Serial', 'Figura', 'Ubicación', 'Estado'].map(h => (<th key={h} style={th}>{h}</th>))}
                  </tr></thead>
                  <tbody>
                    {inventory.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                        <td style={td}>{t.id}</td><td style={td}>{t.diameter}</td><td style={td}>{t.length}</td><td style={td}>{t.material}</td><td style={td}>{t.serial}</td><td style={td}>{t.figure}</td><td style={td}>{t.location}</td>
                        <td style={td}><span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600', background: t.status === 'Disponible' ? '#d1fae5' : '#fef3c7', color: t.status === 'Disponible' ? '#065f46' : '#92400e' }}>{t.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {currentView === 'scanner' && (
          <div style={card}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><QrCode size={24} />Escáner QR</h2>
            <div style={{ textAlign: 'center', padding: '40px' }}>
              {!scannerActive ? (
                <>
                  <div style={{ width: '200px', height: '200px', margin: '0 auto 30px', background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><QrCode size={100} color="white" /></div>
                  <button onClick={simulateScan} style={{ ...actionBtn, background: '#3b82f6', fontSize: '18px', padding: '16px 32px' }}><Camera size={20} /> Activar Escáner</button>
                </>
              ) : (
                <div style={{ padding: '40px', background: '#dbeafe', borderRadius: '16px', border: '2px dashed #3b82f6' }}>
                  <div style={{ width: '150px', height: '150px', margin: '0 auto 20px', border: '4px solid #3b82f6', borderRadius: '12px', position: 'relative' }}>
                    <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '3px', background: '#3b82f6', animation: 'scan 2s ease-in-out infinite' }}></div>
                  </div>
                  <p style={{ color: '#1e3a8a', fontSize: '18px', fontWeight: '600' }}>Escaneando...</p>
                </div>
              )}
              {selectedTube && (
                <div style={{ marginTop: '30px', padding: '25px', background: '#d1fae5', borderRadius: '12px', border: '2px solid #10b981' }}>
                  <h3 style={{ color: '#065f46', fontSize: '18px', fontWeight: '700', marginBottom: '15px' }}>✓ Tubo Escaneado</h3>
                  <div style={{ textAlign: 'left', color: '#065f46', marginBottom: '20px' }}>
                    <p style={{ margin: '8px 0' }}><strong>ID:</strong> {selectedTube.id}</p>
                    <p style={{ margin: '8px 0' }}><strong>Diámetro:</strong> {selectedTube.diameter}</p>
                    <p style={{ margin: '8px 0' }}><strong>Serial:</strong> {selectedTube.serial}</p>
                    <p style={{ margin: '8px 0' }}><strong>Ubicación:</strong> {selectedTube.location}</p>
                  </div>
                  {currentUser.permissions.includes('create_exit') && (
                    <button onClick={createExitRequest} style={{ ...actionBtn, background: '#10b981' }}><TrendingUp size={18} /> Crear Solicitud</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
        {currentView === 'movements' && (
          <div style={card}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}><FileText size={24} />Historial</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {movements.length === 0 ? (<p style={{ textAlign: 'center', color: '#6b7280', padding: '40px' }}>Sin movimientos</p>) : (
                movements.map(m => (
                  <div key={m.id} style={{ padding: '20px', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>{m.type}: {m.tube_id}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>{m.from_location} → {m.to_location}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Por: {m.user_name} - {m.date}</p>
                      </div>
                      <span style={{ padding: '6px 16px', borderRadius: '12px', fontSize: '14px', fontWeight: '600', background: m.status === 'Aprobado' ? '#d1fae5' : m.status === 'Rechazado' ? '#fee2e2' : '#fef3c7', color: m.status === 'Aprobado' ? '#065f46' : m.status === 'Rechazado' ? '#dc2626' : '#92400e' }}>{m.status}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      <style>{`@keyframes scan { 0%, 100% { top: 0; } 50% { top: calc(100% - 3px); } }`}</style>
    </div>
  );
};

const StatCard = ({ icon, title, value, color }) => (
  <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', borderLeft: `4px solid ${color}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#6b7280', fontWeight: '600' }}>{title}</p>
        <p style={{ margin: 0, fontSize: '32px', fontWeight: '700', color: '#1a2332' }}>{value}</p>
      </div>
      <div style={{ color }}>{icon}</div>
    </div>
  </div>
);

const card = { background: 'white', padding: '30px', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)', marginBottom: '20px' };
const navBtn = { background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600' };
const actionBtn = { border: 'none', color: 'white', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '8px' };
const th = { padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#1a2332' };
const td = { padding: '12px', fontSize: '14px', color: '#4b5563' };

export default InventorySystem;
