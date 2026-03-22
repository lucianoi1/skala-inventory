// ============================================
// IMPORTACIONES
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Package, TrendingUp, CheckCircle, XCircle, Clock, QrCode,
  Eye, EyeOff, AlertCircle, Box, List, PlusCircle, MinusCircle,
  ArrowRight, Search, LogOut, Ship, MapPin, ChevronRight, X, RefreshCw
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import { firebaseConfig, supabaseConfig } from './config';

// ============================================
// INICIALIZACIÓN
// ============================================
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// ============================================
// BARCOS DISPONIBLES (agrega más aquí)
// ============================================
const SHIPS = ['Grand Canyon', 'Iron Horse'];

// ============================================
// COMPONENTE: ESCÁNER QR
// ============================================
const QRScanner = ({ onScan, onClose, title = 'Escanear Código QR', hint = 'Apunta la cámara al código QR' }) => {
  const scannerRef = useRef(null);
  const [camError, setCamError] = useState('');
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    let scanner = null;
    const timer = setTimeout(async () => {
      try {
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        scanner = new Html5QrcodeScanner('qr-reader-modal', {
          fps: 10, qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0, showTorchButtonIfSupported: true,
        }, false);
        scanner.render(
          (decoded) => { scanner.clear().catch(() => {}); onScan(decoded); },
          () => {}
        );
        scannerRef.current = scanner;
      } catch (e) {
        setCamError('Instala html5-qrcode o usa el ingreso manual.');
      }
    }, 150);
    return () => { clearTimeout(timer); if (scannerRef.current) scannerRef.current.clear().catch(() => {}); };
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.93)', zIndex: 9999,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ color: 'white', textAlign: 'center', marginBottom: '18px' }}>
        <QrCode size={36} style={{ marginBottom: '8px' }} />
        <h2 style={{ margin: 0, fontSize: '21px', fontWeight: '700' }}>{title}</h2>
        <p style={{ margin: '6px 0 0', opacity: 0.6, fontSize: '13px' }}>{hint}</p>
      </div>
      {camError ? (
        <div style={{ background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '12px',
          padding: '20px', textAlign: 'center', color: '#92400e', maxWidth: '320px' }}>
          <AlertCircle size={32} style={{ marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '13px', fontWeight: '600' }}>{camError}</p>
        </div>
      ) : (
        <div style={{ background: 'white', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '370px' }}>
          <div id="qr-reader-modal" style={{ width: '100%' }} />
        </div>
      )}
      <div style={{ marginTop: '18px', width: '100%', maxWidth: '370px' }}>
        <p style={{ color: 'rgba(255,255,255,0.55)', textAlign: 'center', fontSize: '12px', marginBottom: '8px' }}>
          ¿No funciona la cámara? Ingresa el ID manualmente:
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input type="text" placeholder="Ej: CAN-001 o TUB-001" value={manualId}
            onChange={e => setManualId(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && manualId.trim() && onScan(manualId.trim())}
            style={{ flex: 1, padding: '11px 13px', borderRadius: '8px', border: 'none', fontSize: '14px', outline: 'none' }} />
          <button onClick={() => manualId.trim() && onScan(manualId.trim())}
            style={{ padding: '11px 16px', background: '#3b82f6', color: 'white', border: 'none',
              borderRadius: '8px', fontWeight: '700', cursor: 'pointer', fontSize: '14px' }}>OK</button>
        </div>
      </div>
      <button onClick={onClose} style={{ marginTop: '16px', padding: '12px 36px',
        background: 'rgba(255,255,255,0.1)', color: 'white',
        border: '2px solid rgba(255,255,255,0.2)', borderRadius: '10px',
        fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>✕ Cerrar</button>
    </div>
  );
};

// ============================================
// COMPONENTE: MODAL GENÉRICO
// ============================================
const Modal = ({ title, onClose, children }) => (
  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 8000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
    <div style={{ background: 'white', borderRadius: '18px', padding: '28px', width: '100%',
      maxWidth: '600px', maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: '#1a2332' }}>{title}</h2>
        <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: '8px',
          padding: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <X size={18} color="#6b7280" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ============================================
// COMPONENTE: STAT CARD (clickeable)
// ============================================
const StatCard = ({ icon, title, value, color, onClick, active }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ background: 'white', borderRadius: '16px', padding: '25px',
        boxShadow: hovered || active ? `0 8px 24px ${color}30` : '0 2px 8px rgba(0,0,0,0.06)',
        display: 'flex', alignItems: 'center', gap: '20px',
        border: active ? `3px solid ${color}` : `3px solid ${hovered ? color + '60' : color + '20'}`,
        cursor: onClick ? 'pointer' : 'default',
        transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.2s ease' }}>
      <div style={{ width: '60px', height: '60px', borderRadius: '14px',
        background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
        {icon}
      </div>
      <div>
        <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{title}</p>
        <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1a2332' }}>{value}</p>
        {onClick && <p style={{ margin: '4px 0 0', fontSize: '12px', color, fontWeight: '600' }}>
          Ver detalle →
        </p>}
      </div>
    </div>
  );
};

// ============================================
// ESTILOS BASE
// ============================================
const card = { background: 'white', borderRadius: '16px', padding: '25px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '25px' };

const useHoverStyle = (base, hover) => {
  const [hovered, setHovered] = useState(false);
  return { style: hovered ? { ...base, ...hover } : base,
    onMouseEnter: () => setHovered(true), onMouseLeave: () => setHovered(false) };
};

const Btn = ({ children, onClick, color = '#3b82f6', disabled, style: extra = {}, small }) => {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: disabled ? '#9ca3af' : hovered ? color + 'dd' : color,
        color: 'white', border: 'none', borderRadius: '8px',
        padding: small ? '7px 12px' : '11px 18px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontSize: small ? '13px' : '14px', fontWeight: '600',
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        transform: hovered && !disabled ? 'translateY(-1px)' : 'none',
        boxShadow: hovered && !disabled ? `0 4px 12px ${color}50` : 'none',
        transition: 'all 0.15s ease', ...extra }}>
      {children}
    </button>
  );
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const InventorySystem = () => {
  // Estados principales
  const [currentUser, setCurrentUser]           = useState(null);
  const [currentView, setCurrentView]           = useState('login');
  const [inventory, setInventory]               = useState([]);
  const [baskets, setBaskets]                   = useState([]);
  const [movements, setMovements]               = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);

  // Login
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading]       = useState(false);

  // Búsqueda / filtros
  const [searchTerm, setSearchTerm]         = useState('');
  const [filterLocation, setFilterLocation] = useState('all');
  const [basketFilter, setBasketFilter]     = useState('todas');

  // Escáner y flujo de salida
  const [showQRScanner, setShowQRScanner]         = useState(false);
  const [qrScanMode, setQrScanMode]               = useState(''); // 'basket' | 'tube' | 'reception'
  const [activeBasket, setActiveBasket]           = useState(null);  // canastilla en proceso de carga
  const [scannedTubesForBasket, setScannedTubesForBasket] = useState([]); // tubos escaneados en esta sesión
  const [selectedShip, setSelectedShip]           = useState('');
  const [customShip, setCustomShip]               = useState('');
  const [movementNote, setMovementNote]           = useState('');

  // Dashboard modales
  const [dashboardModal, setDashboardModal] = useState(''); // 'transit' | 'available' | 'baskets_transit'
  const [selectedBasketDetail, setSelectedBasketDetail] = useState(null);

  // ----------------------------------------
  // ROLES
  // ----------------------------------------
  const ROLES = {
    'almacenista@skala.com':    { role: 'almacenista',    name: 'Almacenista',             permissions: ['create_exit','scan','view_inventory','manage_baskets'] },
    'gerente@skala.com':        { role: 'gerente',        name: 'Gerente de Operaciones',  permissions: ['approve_base_exit','view_reports','view_inventory'] },
    'representante@skala.com':  { role: 'representante',  name: 'Representante a Bordo',   permissions: ['approve_ship_entry','create_ship_exit','scan','manage_baskets'] },
    'supervisor@skala.com':     { role: 'supervisor',     name: 'Supervisor',              permissions: ['scan','install_tubes'] },
    'lugracia.eta18@gmail.com': { role: 'administrador',  name: 'Luciano - Administrador', permissions: ['create_exit','scan','view_inventory','approve_base_exit','view_reports','approve_ship_entry','create_ship_exit','install_tubes','admin','manage_baskets'] },
  };

  // ----------------------------------------
  // CARGA DE DATOS
  // ----------------------------------------
  useEffect(() => { if (currentUser) { loadAll(); } }, [currentUser]);

  const loadAll = () => { loadInventory(); loadBaskets(); loadMovements(); loadPendingApprovals(); };

  const loadInventory = async () => {
    const { data, error } = await supabase.from('inventory').select('*').order('created_at', { ascending: false });
    if (!error) setInventory(data || []);
  };
  const loadBaskets = async () => {
    const { data, error } = await supabase.from('baskets').select('*').order('created_at', { ascending: false });
    if (!error) setBaskets(data || []);
  };
  const loadMovements = async () => {
    const { data, error } = await supabase.from('movements').select('*').order('created_at', { ascending: false });
    if (!error) setMovements(data || []);
  };
  const loadPendingApprovals = async () => {
    const { data, error } = await supabase.from('pending_approvals').select('*').order('created_at', { ascending: false });
    if (!error) setPendingApprovals(data || []);
  };

  // ----------------------------------------
  // LOGIN / LOGOUT
  // ----------------------------------------
  const handleLogin = async () => {
    setLoginError(''); setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userData = ROLES[email.toLowerCase()];
      if (!userData) { await signOut(auth); throw new Error('Usuario no autorizado'); }
      setCurrentUser({ uid: cred.user.uid, email: cred.user.email, ...userData });
      setCurrentView('dashboard');
      setEmail(''); setPassword('');
    } catch (e) {
      setLoginError(e.code === 'auth/invalid-credential' ? 'Email o contraseña incorrectos' : e.message);
    } finally { setLoading(false); }
  };
  const handleLogout = async () => { await signOut(auth); setCurrentUser(null); setCurrentView('login'); };

  // ----------------------------------------
  // FLUJO QR: manejar resultado según modo
  // ----------------------------------------
  const handleQRResult = (scanned) => {
    setShowQRScanner(false);
    const id = scanned.trim();

    if (qrScanMode === 'basket') {
      // Escanear canastilla para iniciar carga
      const basket = baskets.find(b => b.id === id || b.name === id);
      if (!basket) { alert(`⚠️ Canastilla no encontrada: "${id}"`); return; }
      setActiveBasket(basket);
      setScannedTubesForBasket([]);
      setSelectedShip('');
      setMovementNote('');
      setCurrentView('load-basket');
    }

    if (qrScanMode === 'tube') {
      // Escanear tubo para agregar a canastilla activa
      const tube = inventory.find(t => t.id === id || t.serial === id);
      if (!tube) { alert(`⚠️ Tubo no encontrado: "${id}"`); return; }
      if (tube.status !== 'Disponible') { alert(`⚠️ El tubo ${tube.id} no está disponible.\nEstado actual: ${tube.status}`); return; }
      if (scannedTubesForBasket.find(t => t.id === tube.id)) { alert(`⚠️ El tubo ${tube.id} ya fue escaneado en esta sesión`); return; }
      setScannedTubesForBasket(prev => [...prev, tube]);
    }

    if (qrScanMode === 'reception') {
      // Representante escanea canastilla en el barco
      const basket = baskets.find(b => b.id === id || b.name === id);
      if (!basket) { alert(`⚠️ Canastilla no encontrada: "${id}"`); return; }
      setSelectedBasketDetail(basket);
      setDashboardModal('reception');
    }
  };

  // ----------------------------------------
  // CREAR SALIDA COMPLETA (canastilla + tubos)
  // ----------------------------------------
  const createBasketExit = async () => {
    if (!activeBasket) { alert('No hay canastilla seleccionada'); return; }
    if (scannedTubesForBasket.length === 0) { alert('Escanea al menos un tubo'); return; }
    const ship = customShip.trim() || selectedShip;
    if (!ship) { alert('Selecciona el barco de destino'); return; }

    try {
      setLoading(true);

      // 1. Asignar tubos a la canastilla y marcarlos como Pendiente
      for (const tube of scannedTubesForBasket) {
        await supabase.from('inventory')
          .update({ basket_id: activeBasket.id, status: 'Pendiente Aprobación' })
          .eq('id', tube.id);
      }

      // 2. Actualizar canastilla con barco destino
      await supabase.from('baskets')
        .update({ destination_ship: ship, status: 'En tránsito' })
        .eq('id', activeBasket.id);

      // 3. Registrar movimiento
      await supabase.from('movements').insert([{
        tube_id: activeBasket.id,
        type: 'Salida Canastilla',
        from_location: activeBasket.location,
        to_location: ship,
        date: new Date().toISOString().split('T')[0],
        user_name: currentUser.name,
        status: 'Pendiente Aprobación',
        notes: `Tubos: ${scannedTubesForBasket.map(t => t.id).join(', ')}${movementNote ? ' | ' + movementNote : ''}`
      }]);

      // 4. Crear aprobación pendiente
      await supabase.from('pending_approvals').insert([{
        tube_id: activeBasket.id,
        type: `Salida Canastilla → ${ship}`,
        requested_by: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        tubes: scannedTubesForBasket.length
      }]);

      alert(`✅ Salida creada\nCanastilla: ${activeBasket.name}\nBarco: ${ship}\nTubos: ${scannedTubesForBasket.length}\n\nEsperando aprobación del Gerente.`);
      setActiveBasket(null);
      setScannedTubesForBasket([]);
      setCurrentView('dashboard');
      loadAll();
    } catch (e) {
      alert('Error al crear salida: ' + e.message);
    } finally { setLoading(false); }
  };

  // ----------------------------------------
  // APROBAR MOVIMIENTO (Gerente)
  // ----------------------------------------
  const approveMovement = async (pendingId) => {
    try {
      setLoading(true);
      const pending = pendingApprovals.find(p => p.id === pendingId);
      if (!pending) return;

      const isEntry  = pending.type.includes('Entrada');
      const isBasket = pending.type.includes('Canastilla');
      const ship     = pending.type.split('→')[1]?.trim() || 'Barco';
      const newLocation = isEntry ? 'Base Villahermosa' : ship;

      // Actualizar movimiento
      await supabase.from('movements')
        .update({ status: 'Aprobado' })
        .eq('tube_id', pending.tube_id)
        .eq('status', 'Pendiente Aprobación');

      if (isBasket) {
        // Mover todos los tubos de la canastilla
        await supabase.from('inventory')
          .update({ location: newLocation, status: 'En tránsito' })
          .eq('basket_id', pending.tube_id);
        await supabase.from('baskets')
          .update({ location: newLocation })
          .eq('id', pending.tube_id);
      } else {
        await supabase.from('inventory')
          .update({ location: newLocation, status: isEntry ? 'Disponible' : 'En tránsito' })
          .eq('id', pending.tube_id);
      }

      await supabase.from('pending_approvals').delete().eq('id', pendingId);

      alert(`✅ Aprobado — ${pending.type}`);
      loadAll();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  const rejectMovement = async (pendingId) => {
    try {
      setLoading(true);
      const pending = pendingApprovals.find(p => p.id === pendingId);
      if (!pending) return;
      const isBasket = pending.type.includes('Canastilla');

      await supabase.from('movements')
        .update({ status: 'Rechazado' })
        .eq('tube_id', pending.tube_id)
        .eq('status', 'Pendiente Aprobación');

      if (isBasket) {
        await supabase.from('inventory')
          .update({ status: 'Disponible' })
          .eq('basket_id', pending.tube_id);
        await supabase.from('baskets')
          .update({ status: 'Disponible', destination_ship: null })
          .eq('id', pending.tube_id);
      } else {
        await supabase.from('inventory')
          .update({ status: 'Disponible' })
          .eq('id', pending.tube_id);
      }

      await supabase.from('pending_approvals').delete().eq('id', pendingId);
      alert(`❌ Rechazado: ${pending.tube_id}`);
      loadAll();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  // ----------------------------------------
  // CONFIRMAR RECEPCIÓN EN BARCO (Representante)
  // ----------------------------------------
  const confirmReception = async (basket) => {
    try {
      setLoading(true);
      const ship = basket.destination_ship || basket.location;

      await supabase.from('inventory')
        .update({ location: ship, status: 'Disponible' })
        .eq('basket_id', basket.id);

      await supabase.from('baskets')
        .update({ location: ship, status: 'Disponible' })
        .eq('id', basket.id);

      await supabase.from('movements').insert([{
        tube_id: basket.id,
        type: 'Recepción Barco',
        from_location: 'Base Villahermosa',
        to_location: ship,
        date: new Date().toISOString().split('T')[0],
        user_name: currentUser.name,
        status: 'Completado',
        notes: `Recibido a bordo de ${ship}`
      }]);

      alert(`✅ Recepción confirmada\nCanastilla: ${basket.name}\nBarco: ${ship}`);
      setDashboardModal('');
      setSelectedBasketDetail(null);
      loadAll();
    } catch (e) { alert('Error: ' + e.message); }
    finally { setLoading(false); }
  };

  // ----------------------------------------
  // DATOS DERIVADOS
  // ----------------------------------------
  const tubosDisponibles = inventory.filter(t => t.status === 'Disponible');
  const tubosEnTransito  = inventory.filter(t => t.status === 'En tránsito' || t.status === 'Pendiente Aprobación');
  const canastillasEnTransito = baskets.filter(b => b.status === 'En tránsito' || b.destination_ship);

  const filteredInventory = inventory.filter(t => {
    const s = searchTerm.toLowerCase();
    const matchSearch = (t.id||'').toLowerCase().includes(s) || (t.serial||'').toLowerCase().includes(s);
    const matchLoc = filterLocation === 'all' || t.location === filterLocation;
    return matchSearch && matchLoc;
  });

  const filteredBaskets = baskets.filter(b => {
    const s = searchTerm.toLowerCase();
    const matchSearch = (b.id||'').toLowerCase().includes(s) || (b.name||'').toLowerCase().includes(s);
    const matchLoc  = filterLocation === 'all' || b.location === filterLocation;
    const matchCat  = basketFilter === 'todas' || b.tube_category === basketFilter;
    return matchSearch && matchLoc && matchCat;
  });

  // ============================================
  // PANTALLA LOGIN
  // ============================================
  if (currentView === 'login') return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ background: 'white', borderRadius: '20px', padding: '40px',
        maxWidth: '440px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          <div style={{ width: '76px', height: '76px', background: 'linear-gradient(135deg,#3b82f6,#1e3a8a)',
            borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Package size={38} color="white" />
          </div>
          <h1 style={{ color: '#1a2332', fontSize: '26px', fontWeight: '700', margin: '0 0 8px' }}>Skala Energy</h1>
          <p style={{ color: '#6b7280', fontSize: '15px', margin: 0 }}>Sistema de Gestión de Inventarios</p>
        </div>
        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: '600', marginBottom: '7px' }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="usuario@skala.com"
            style={{ width: '100%', padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div style={{ marginBottom: '22px' }}>
          <label style={{ display: 'block', color: '#374151', fontSize: '13px', fontWeight: '600', marginBottom: '7px' }}>Contraseña</label>
          <div style={{ position: 'relative' }}>
            <input type={showPassword ? 'text' : 'password'} value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleLogin()} placeholder="Contraseña"
              style={{ width: '100%', padding: '11px 42px 11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
            <button onClick={() => setShowPassword(!showPassword)}
              style={{ position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
              {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
            </button>
          </div>
        </div>
        {loginError && (
          <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626',
            padding: '11px', borderRadius: '8px', marginBottom: '18px', fontSize: '13px',
            display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />{loginError}
          </div>
        )}
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', background: loading ? '#9ca3af' : 'linear-gradient(135deg,#3b82f6,#1e3a8a)',
            color: 'white', border: 'none', borderRadius: '10px', padding: '13px',
            fontSize: '15px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'Iniciando...' : 'Iniciar Sesión'}
        </button>
        <div style={{ marginTop: '24px', padding: '16px', background: '#f0fdf4', borderRadius: '10px', border: '1px solid #86efac' }}>
          <p style={{ fontSize: '11px', fontWeight: '700', color: '#166534', marginBottom: '8px', textAlign: 'center' }}>Usuarios del Sistema</p>
          {['almacenista@skala.com','gerente@skala.com','representante@skala.com','supervisor@skala.com','lugracia.eta18@gmail.com (Admin)'].map(u => (
            <p key={u} style={{ margin: '3px 0', fontSize: '11px', color: '#15803d' }}>• {u}</p>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================
  // PANTALLA PRINCIPAL
  // ============================================
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui' }}>

      {/* HEADER */}
      <div style={{ background: 'linear-gradient(135deg,#1a2332,#2c3e50)', padding: '14px 20px', color: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.2)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Package size={28} />
            <div>
              <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '700' }}>Skala Energy</h1>
              <p style={{ margin: 0, fontSize: '12px', opacity: 0.8 }}>{currentUser?.name} · {currentUser?.role}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {[
              { label: '📊 Dashboard', view: 'dashboard' },
              { label: '🗂️ Canastillas', view: 'baskets' },
              { label: '📋 Movimientos', view: 'movements' },
            ].map(item => (
              <NavBtn key={item.view} label={item.label} active={currentView === item.view}
                onClick={() => setCurrentView(item.view)} />
            ))}
            {currentUser?.permissions.includes('scan') && (
              <NavBtn label="📷 Escáner" active={currentView === 'scanner' || currentView === 'load-basket'}
                onClick={() => setCurrentView('scanner')} />
            )}
            <button onClick={handleLogout}
              style={{ background: 'rgba(239,68,68,0.25)', color: 'white', border: 'none',
                borderRadius: '8px', padding: '9px 14px', cursor: 'pointer', fontSize: '13px',
                fontWeight: '600', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <LogOut size={14} /> Salir
            </button>
          </div>
        </div>
      </div>

      {/* CONTENIDO */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>

        {/* ========================================== */}
        {/* VISTA: DASHBOARD                          */}
        {/* ========================================== */}
        {currentView === 'dashboard' && (<>
          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px,1fr))', gap: '18px', marginBottom: '24px' }}>
            <StatCard icon={<Package size={26} />}    title="Total Tubos"   value={inventory.length}              color="#3b82f6" />
            <StatCard icon={<Box size={26} />}        title="Canastillas"   value={baskets.length}                color="#8b5cf6"
              onClick={() => setDashboardModal('baskets_transit')} active={dashboardModal === 'baskets_transit'} />
            <StatCard icon={<TrendingUp size={26} />} title="En Tránsito"   value={tubosEnTransito.length}        color="#f59e0b"
              onClick={() => setDashboardModal('transit')} active={dashboardModal === 'transit'} />
            <StatCard icon={<CheckCircle size={26} />} title="Disponibles"  value={tubosDisponibles.length}       color="#10b981"
              onClick={() => setDashboardModal('available')} active={dashboardModal === 'available'} />
            <StatCard icon={<Clock size={26} />}      title="Pendientes"    value={pendingApprovals.length}       color="#ef4444" />
          </div>

          {/* Aprobaciones pendientes */}
          {currentUser.permissions.includes('approve_base_exit') && pendingApprovals.length > 0 && (
            <div style={card}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} color="#ef4444" /> Aprobaciones Pendientes ({pendingApprovals.length})
              </h2>
              {pendingApprovals.map(p => (
                <PendingCard key={p.id} p={p} loading={loading}
                  onApprove={() => approveMovement(p.id)}
                  onReject={() => rejectMovement(p.id)} />
              ))}
            </div>
          )}

          {/* Recepción barco (representante) */}
          {currentUser.permissions.includes('approve_ship_entry') && (
            <div style={card}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ship size={20} color="#3b82f6" /> Recepción en Barco
              </h2>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '16px' }}>
                Escanea el QR de la canastilla para confirmar que llegó al barco.
              </p>
              <Btn color="#3b82f6" onClick={() => { setQrScanMode('reception'); setShowQRScanner(true); }}>
                <QrCode size={16} /> Escanear Canastilla
              </Btn>
            </div>
          )}

          {/* Tabla inventario resumida */}
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', margin: 0 }}>
                Inventario ({filteredInventory.length})
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <SearchInput value={searchTerm} onChange={setSearchTerm} />
                <select value={filterLocation} onChange={e => setFilterLocation(e.target.value)}
                  style={{ padding: '9px 12px', border: '2px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', outline: 'none', cursor: 'pointer' }}>
                  <option value="all">Todas las ubicaciones</option>
                  <option value="Base Villahermosa">Base Villahermosa</option>
                  <option value="Barco">Barco</option>
                  <option value="Estructura">Estructura</option>
                  {SHIPS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <InventoryTable inventory={filteredInventory} baskets={baskets} currentUser={currentUser}
              onRemoveBasket={async (id) => {
                await supabase.from('inventory').update({ basket_id: null }).eq('id', id);
                loadInventory(); loadBaskets();
              }} />
          </div>
        </>)}

        {/* ========================================== */}
        {/* VISTA: ESCÁNER / FLUJO DE CARGA           */}
        {/* ========================================== */}
        {currentView === 'scanner' && (
          <div style={card}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={24} /> Escáner
            </h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '22px' }}>
              Para registrar una salida: primero escanea la <strong>canastilla</strong>, luego los <strong>tubos</strong> que van dentro.
            </p>
            <Btn color="#1e3a8a" style={{ width: '100%', justifyContent: 'center', padding: '16px', fontSize: '16px', marginBottom: '12px' }}
              onClick={() => { setQrScanMode('basket'); setShowQRScanner(true); }}>
              <Box size={20} /> 1. Escanear Canastilla
            </Btn>
            <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
              Después de escanear la canastilla podrás agregar los tubos
            </p>
          </div>
        )}

        {/* ========================================== */}
        {/* VISTA: CARGA DE CANASTILLA                */}
        {/* ========================================== */}
        {currentView === 'load-basket' && activeBasket && (
          <div>
            {/* Info canastilla */}
            <div style={{ ...card, borderLeft: '5px solid #3b82f6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h2 style={{ margin: '0 0 6px', fontSize: '20px', fontWeight: '700', color: '#1a2332' }}>
                    <Box size={20} style={{ verticalAlign: 'middle', marginRight: '8px' }} />
                    {activeBasket.name}
                  </h2>
                  <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>
                    📍 {activeBasket.location} · 📦 {activeBasket.tube_category || 'Sin categoría'} · Capacidad: {activeBasket.capacity}
                  </p>
                </div>
                <span style={{ padding: '5px 14px', background: '#dbeafe', color: '#1e40af', borderRadius: '20px', fontSize: '13px', fontWeight: '700' }}>
                  {scannedTubesForBasket.length} tubos escaneados
                </span>
              </div>
            </div>

            {/* Escanear tubos */}
            <div style={card}>
              <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1a2332', marginBottom: '14px' }}>
                2. Escanear Tubos para esta Canastilla
              </h3>
              <Btn color="#3b82f6" style={{ width: '100%', justifyContent: 'center', padding: '15px', fontSize: '15px', marginBottom: '16px' }}
                onClick={() => { setQrScanMode('tube'); setShowQRScanner(true); }}>
                <QrCode size={18} /> Escanear Tubo
              </Btn>

              {scannedTubesForBasket.length > 0 ? (
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                    Tubos en esta salida:
                  </p>
                  {scannedTubesForBasket.map(tube => (
                    <TubeRow key={tube.id} tube={tube}
                      onRemove={() => setScannedTubesForBasket(prev => prev.filter(t => t.id !== tube.id))} />
                  ))}
                </div>
              ) : (
                <p style={{ textAlign: 'center', color: '#d1d5db', padding: '20px', fontSize: '14px' }}>
                  Aún no has escaneado tubos
                </p>
              )}
            </div>

            {/* Seleccionar barco destino */}
            {scannedTubesForBasket.length > 0 && (
              <div style={card}>
                <h3 style={{ fontSize: '17px', fontWeight: '700', color: '#1a2332', marginBottom: '14px' }}>
                  3. Seleccionar Barco Destino
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px,1fr))', gap: '10px', marginBottom: '14px' }}>
                  {SHIPS.map(ship => (
                    <ShipCard key={ship} ship={ship} selected={selectedShip === ship && !customShip}
                      onClick={() => { setSelectedShip(ship); setCustomShip(''); }} />
                  ))}
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Otro barco:
                  </label>
                  <input type="text" placeholder="Nombre del barco..."
                    value={customShip} onChange={e => { setCustomShip(e.target.value); setSelectedShip(''); }}
                    style={{ width: '100%', padding: '10px 13px', border: '2px solid #e5e7eb', borderRadius: '9px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
                </div>

                <textarea placeholder="Nota opcional..."
                  value={movementNote} onChange={e => setMovementNote(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '2px solid #e5e7eb', borderRadius: '8px', fontSize: '14px', resize: 'vertical', minHeight: '60px', boxSizing: 'border-box', outline: 'none', marginBottom: '16px' }} />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Btn color="#ef4444" disabled={loading} onClick={createBasketExit}
                    style={{ flex: 1, justifyContent: 'center', padding: '14px', fontSize: '15px' }}>
                    {loading ? '⏳ Procesando...' : `📤 Crear Salida (${scannedTubesForBasket.length} tubos)`}
                  </Btn>
                  <Btn color="#6b7280" onClick={() => { setActiveBasket(null); setScannedTubesForBasket([]); setCurrentView('scanner'); }}>
                    ✕ Cancelar
                  </Btn>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================== */}
        {/* VISTA: CANASTILLAS                        */}
        {/* ========================================== */}
        {currentView === 'baskets' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a2332', margin: 0 }}>
                🗂️ Gestión de Canastillas
              </h2>
              <div style={{ display: 'flex', gap: '7px', flexWrap: 'wrap' }}>
                {['todas', ...new Set(baskets.map(b => b.tube_category).filter(Boolean))].map(cat => (
                  <FilterBtn key={cat} label={cat === 'todas' ? '🗂️ Todas' : `📦 ${cat}`}
                    active={basketFilter === cat} onClick={() => setBasketFilter(cat)} />
                ))}
              </div>
            </div>

            {/* Resumen por categoría */}
            {baskets.some(b => b.tube_category) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px,1fr))', gap: '12px', marginBottom: '20px' }}>
                {[...new Set(baskets.map(b => b.tube_category).filter(Boolean))].map(cat => {
                  const catTubes = inventory.filter(t => { const b = baskets.find(bk => bk.id === t.basket_id); return b && b.tube_category === cat; });
                  return (
                    <div key={cat} style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>📦 {cat}</p>
                      <p style={{ margin: 0, fontSize: '28px', fontWeight: '800', color: '#1a2332' }}>{catTubes.length}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>tubos</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px,1fr))', gap: '18px' }}>
              {filteredBaskets.map(basket => (
                <BasketCard key={basket.id} basket={basket} inventory={inventory}
                  canManage={currentUser.permissions.includes('manage_baskets')}
                  onMove={async (basketId, toLocation) => {
                    try {
                      const b = baskets.find(bk => bk.id === basketId);
                      if (!b) return;
                      await supabase.from('baskets').update({ location: toLocation }).eq('id', basketId);
                      await supabase.from('inventory').update({ location: toLocation }).eq('basket_id', basketId);
                      await supabase.from('movements').insert([{
                        tube_id: basketId, type: 'Movimiento Canastilla',
                        from_location: b.location, to_location: toLocation,
                        date: new Date().toISOString().split('T')[0],
                        user_name: currentUser.name, status: 'Completado'
                      }]);
                      loadAll();
                    } catch (e) { alert('Error: ' + e.message); }
                  }} />
              ))}
              {filteredBaskets.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No hay canastillas para mostrar
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* VISTA: MOVIMIENTOS                        */}
        {/* ========================================== */}
        {currentView === 'movements' && (
          <div style={card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', margin: 0 }}>
                📋 Historial de Movimientos ({movements.length})
              </h2>
              <Btn color="#6b7280" small onClick={loadMovements}>
                <RefreshCw size={14} /> Actualizar
              </Btn>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['Tipo','ID','Desde','Hacia','Fecha','Usuario','Estado','Notas'].map(h => (
                      <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <MovRow key={m.id} m={m} />
                  ))}
                </tbody>
              </table>
              {movements.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>Sin movimientos</p>}
            </div>
          </div>
        )}

      </div>

      {/* ── MODALES DASHBOARD ── */}

      {/* Modal: En Tránsito */}
      {dashboardModal === 'transit' && (
        <Modal title={`🚚 Tubos en Tránsito (${tubosEnTransito.length})`} onClose={() => setDashboardModal('')}>
          {tubosEnTransito.length === 0
            ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>No hay tubos en tránsito</p>
            : tubosEnTransito.map(t => {
              const basket = baskets.find(b => b.id === t.basket_id);
              return (
                <div key={t.id} style={{ padding: '12px', border: '1px solid #e5e7eb', borderRadius: '10px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 3px', fontWeight: '700', fontSize: '14px' }}>{t.id}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                        {t.diameter} · {t.serial} · 📍 {t.location}
                        {basket ? ` · 🗂️ ${basket.name}` : ''}
                      </p>
                    </div>
                    <StatusBadge status={t.status} />
                  </div>
                </div>
              );
            })
          }
        </Modal>
      )}

      {/* Modal: Disponibles */}
      {dashboardModal === 'available' && (
        <Modal title={`✅ Tubos Disponibles en Base (${tubosDisponibles.length})`} onClose={() => setDashboardModal('')}>
          {tubosDisponibles.length === 0
            ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>No hay tubos disponibles</p>
            : tubosDisponibles.map(t => {
              const basket = baskets.find(b => b.id === t.basket_id);
              return (
                <div key={t.id} style={{ padding: '12px', border: '1px solid #d1fae5', borderRadius: '10px', marginBottom: '8px', background: '#f0fdf4' }}>
                  <p style={{ margin: '0 0 3px', fontWeight: '700', fontSize: '14px' }}>{t.id}</p>
                  <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                    {t.diameter} · {t.material} · Serial: {t.serial} · 📍 {t.location}
                    {basket ? ` · 🗂️ ${basket.name}` : ' · Sin canastilla'}
                  </p>
                </div>
              );
            })
          }
        </Modal>
      )}

      {/* Modal: Canastillas en tránsito */}
      {dashboardModal === 'baskets_transit' && !selectedBasketDetail && (
        <Modal title={`🗂️ Canastillas (${canastillasEnTransito.length} en tránsito)`} onClose={() => setDashboardModal('')}>
          {canastillasEnTransito.length === 0
            ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>No hay canastillas en tránsito</p>
            : canastillasEnTransito.map(basket => {
              const tubes = inventory.filter(t => t.basket_id === basket.id);
              return (
                <div key={basket.id}
                  onClick={() => setSelectedBasketDetail(basket)}
                  style={{ padding: '14px', border: '2px solid #e5e7eb', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <p style={{ margin: '0 0 4px', fontWeight: '700', fontSize: '15px' }}>{basket.name}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
                        🚢 {basket.destination_ship || basket.location} · {tubes.length} tubos · 📍 {basket.location}
                      </p>
                    </div>
                    <ChevronRight size={18} color="#9ca3af" />
                  </div>
                </div>
              );
            })
          }
        </Modal>
      )}

      {/* Modal: Detalle canastilla */}
      {selectedBasketDetail && (dashboardModal === 'baskets_transit' || dashboardModal === 'reception') && (
        <Modal
          title={`🗂️ ${selectedBasketDetail.name}`}
          onClose={() => { setSelectedBasketDetail(null); if (dashboardModal === 'reception') setDashboardModal(''); }}>
          <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px', marginBottom: '16px', fontSize: '13px' }}>
            <p style={{ margin: '3px 0' }}>📍 <strong>Ubicación:</strong> {selectedBasketDetail.location}</p>
            <p style={{ margin: '3px 0' }}>🚢 <strong>Destino:</strong> {selectedBasketDetail.destination_ship || '—'}</p>
            <p style={{ margin: '3px 0' }}>📦 <strong>Categoría:</strong> {selectedBasketDetail.tube_category || '—'}</p>
            <p style={{ margin: '3px 0' }}>📊 <strong>Capacidad:</strong> {selectedBasketDetail.current_count}/{selectedBasketDetail.capacity}</p>
          </div>
          <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>
            Tubos en esta canastilla:
          </h3>
          {inventory.filter(t => t.basket_id === selectedBasketDetail.id).length === 0
            ? <p style={{ color: '#9ca3af', textAlign: 'center' }}>Canastilla vacía</p>
            : inventory.filter(t => t.basket_id === selectedBasketDetail.id).map(tube => (
              <div key={tube.id} style={{ padding: '10px 12px', border: '1px solid #e5e7eb', borderRadius: '9px', marginBottom: '7px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '13px' }}>{tube.id}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{tube.diameter} · {tube.material} · Serial: {tube.serial}</p>
                </div>
                <StatusBadge status={tube.status} />
              </div>
            ))
          }

          {/* Botón confirmar recepción (solo representante) */}
          {currentUser.permissions.includes('approve_ship_entry') && selectedBasketDetail.status === 'En tránsito' && (
            <div style={{ marginTop: '18px', paddingTop: '16px', borderTop: '2px solid #e5e7eb' }}>
              <Btn color="#10b981" disabled={loading}
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px' }}
                onClick={() => confirmReception(selectedBasketDetail)}>
                <CheckCircle size={18} /> {loading ? 'Confirmando...' : 'Confirmar Recepción en Barco'}
              </Btn>
            </div>
          )}
        </Modal>
      )}

      {/* MODAL ESCÁNER QR */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRResult}
          onClose={() => setShowQRScanner(false)}
          title={qrScanMode === 'basket' ? 'Escanear Canastilla' : qrScanMode === 'tube' ? 'Escanear Tubo' : 'Recepción en Barco'}
          hint={qrScanMode === 'basket' ? 'Apunta al QR de la canastilla' : qrScanMode === 'tube' ? 'Apunta al QR del tubo' : 'Escanea la canastilla recibida'}
        />
      )}

    </div>
  );
};

// ============================================
// SUB-COMPONENTES AUXILIARES
// ============================================

const NavBtn = ({ label, active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: active ? 'rgba(59,130,246,0.5)' : hov ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.1)',
        color: 'white', border: 'none', borderRadius: '8px', padding: '9px 14px',
        cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.15s' }}>
      {label}
    </button>
  );
};

const FilterBtn = ({ label, active, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '7px 14px', borderRadius: '20px', border: 'none', cursor: 'pointer',
        fontWeight: '600', fontSize: '12px', transition: 'all 0.15s',
        background: active ? '#3b82f6' : hov ? '#d1d5db' : '#e5e7eb',
        color: active ? 'white' : '#374151',
        transform: hov ? 'translateY(-1px)' : 'none' }}>
      {label}
    </button>
  );
};

const SearchInput = ({ value, onChange }) => (
  <div style={{ position: 'relative' }}>
    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
    <input type="text" placeholder="Buscar ID o serial..." value={value}
      onChange={e => onChange(e.target.value)}
      style={{ padding: '9px 12px 9px 36px', border: '2px solid #e5e7eb', borderRadius: '9px', fontSize: '13px', outline: 'none', width: '220px' }} />
  </div>
);

const StatusBadge = ({ status }) => {
  const map = {
    'Disponible':          { bg: '#d1fae5', color: '#065f46' },
    'En tránsito':         { bg: '#fef3c7', color: '#92400e' },
    'Pendiente Aprobación':{ bg: '#dbeafe', color: '#1e40af' },
    'Completado':          { bg: '#ede9fe', color: '#5b21b6' },
    'Rechazado':           { bg: '#fee2e2', color: '#dc2626' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#374151' };
  return (
    <span style={{ padding: '3px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700', background: s.bg, color: s.color, whiteSpace: 'nowrap' }}>
      {status}
    </span>
  );
};

const TubeRow = ({ tube, onRemove }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '10px 12px', background: hov ? '#f0fdf4' : '#f8fafc',
        border: `1px solid ${hov ? '#86efac' : '#e5e7eb'}`, borderRadius: '9px',
        marginBottom: '7px', transition: 'all 0.15s' }}>
      <div>
        <p style={{ margin: '0 0 2px', fontWeight: '600', fontSize: '13px' }}>{tube.id}</p>
        <p style={{ margin: 0, fontSize: '11px', color: '#6b7280' }}>{tube.diameter} · {tube.material} · Serial: {tube.serial}</p>
      </div>
      <button onClick={onRemove}
        style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
        <X size={14} />
      </button>
    </div>
  );
};

const ShipCard = ({ ship, selected, onClick }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: '14px', border: `2px solid ${selected ? '#3b82f6' : hov ? '#93c5fd' : '#e5e7eb'}`,
        borderRadius: '12px', cursor: 'pointer', textAlign: 'center',
        background: selected ? '#eff6ff' : hov ? '#f8fafc' : 'white',
        transition: 'all 0.15s', transform: hov ? 'translateY(-2px)' : 'none',
        boxShadow: selected ? '0 4px 12px rgba(59,130,246,0.2)' : 'none' }}>
      <Ship size={22} color={selected ? '#3b82f6' : '#9ca3af'} style={{ marginBottom: '6px' }} />
      <p style={{ margin: 0, fontWeight: '700', fontSize: '14px', color: selected ? '#1e40af' : '#374151' }}>{ship}</p>
    </div>
  );
};

const PendingCard = ({ p, loading, onApprove, onReject }) => {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? '#fefce8' : '#fef3c7', padding: '16px', borderRadius: '12px',
        marginBottom: '10px', border: `2px solid ${hov ? '#fbbf24' : '#fde68a'}`, transition: 'all 0.15s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#1a2332' }}>{p.type}</p>
          <p style={{ margin: '0 0 2px', fontSize: '13px', color: '#6b7280' }}>🔧 ID: <strong>{p.tube_id}</strong> · {p.tubes} tubo{p.tubes !== 1 ? 's' : ''}</p>
          <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>👤 {p.requested_by} · {p.date}</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Btn color="#10b981" disabled={loading} onClick={onApprove}><CheckCircle size={15} /> Aprobar</Btn>
          <Btn color="#ef4444" disabled={loading} onClick={onReject}><XCircle size={15} /> Rechazar</Btn>
        </div>
      </div>
    </div>
  );
};

const BasketCard = ({ basket, inventory, canManage, onMove }) => {
  const [hov, setHov] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const tubes = inventory.filter(t => t.basket_id === basket.id);
  const fillPct = basket.capacity > 0 ? Math.min((basket.current_count / basket.capacity) * 100, 100) : 0;
  const barColor = fillPct > 90 ? '#ef4444' : fillPct > 70 ? '#f59e0b' : '#10b981';

  const tubesByType = tubes.reduce((acc, t) => {
    const key = [t.diameter, t.material].filter(Boolean).join(' · ') || 'Sin clasificar';
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {});

  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'white', border: `2px solid ${hov ? '#3b82f6' : '#e5e7eb'}`,
        borderRadius: '16px', padding: '20px', transition: 'all 0.2s',
        boxShadow: hov ? '0 8px 24px rgba(59,130,246,0.12)' : '0 2px 6px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-2px)' : 'none' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: '700', color: '#1a2332' }}>{basket.name}</h3>
          {basket.tube_category && (
            <span style={{ display: 'inline-block', padding: '2px 9px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              📦 {basket.tube_category}
            </span>
          )}
          {basket.destination_ship && (
            <span style={{ display: 'inline-block', marginLeft: '6px', padding: '2px 9px', background: '#fef3c7', color: '#92400e', borderRadius: '20px', fontSize: '11px', fontWeight: '600' }}>
              🚢 {basket.destination_ship}
            </span>
          )}
        </div>
        <StatusBadge status={basket.status} />
      </div>

      <p style={{ margin: '4px 0', fontSize: '12px', color: '#6b7280' }}>📍 {basket.location} · {basket.current_count}/{basket.capacity} tubos</p>

      {/* Barra llenado */}
      <div style={{ margin: '10px 0' }}>
        <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${fillPct}%`, height: '100%', background: barColor, transition: 'width 0.4s', borderRadius: '4px' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
          <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fillPct.toFixed(0)}%</span>
          <span style={{ fontSize: '11px', color: fillPct > 90 ? '#ef4444' : '#9ca3af', fontWeight: fillPct > 90 ? '700' : '400' }}>
            {fillPct >= 100 ? '⚠️ Llena' : `${basket.capacity - basket.current_count} libres`}
          </span>
        </div>
      </div>

      {/* Contenido por tipo */}
      {Object.keys(tubesByType).length > 0 && (
        <div>
          <button onClick={() => setExpanded(!expanded)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '700', color: '#3b82f6', padding: '4px 0', marginBottom: '6px' }}>
            {expanded ? '▲ Ocultar tubos' : `▼ Ver ${tubes.length} tubo${tubes.length !== 1 ? 's' : ''}`}
          </button>
          {expanded && Object.entries(tubesByType).map(([tipo, ts]) => (
            <div key={tipo} style={{ background: '#f8fafc', borderRadius: '7px', padding: '7px 10px', marginBottom: '5px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '12px', fontWeight: '600', color: '#1a2332' }}>{tipo}</span>
                <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '1px' }}>
                  {ts.slice(0, 3).map(t => t.serial || t.id).join(', ')}{ts.length > 3 ? ` +${ts.length - 3}` : ''}
                </div>
              </div>
              <span style={{ background: '#3b82f6', color: 'white', borderRadius: '20px', padding: '2px 9px', fontSize: '12px', fontWeight: '700' }}>{ts.length}</span>
            </div>
          ))}
        </div>
      )}

      {/* Botones mover */}
      {canManage && (
        <div style={{ display: 'flex', gap: '6px', marginTop: '12px', flexWrap: 'wrap' }}>
          {['Barco', 'Estructura', 'Base Villahermosa'].map(dest => (
            <MoveBtn key={dest} label={dest} onClick={() => onMove(basket.id, dest)} />
          ))}
        </div>
      )}
    </div>
  );
};

const MoveBtn = ({ label, onClick }) => {
  const [hov, setHov] = useState(false);
  const colors = { 'Barco': '#3b82f6', 'Estructura': '#8b5cf6', 'Base Villahermosa': '#10b981' };
  const c = colors[label] || '#6b7280';
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ flex: 1, padding: '7px 6px', background: hov ? c : c + '22', color: hov ? 'white' : c,
        border: `2px solid ${c}`, borderRadius: '8px', cursor: 'pointer', fontSize: '11px',
        fontWeight: '700', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
      <ArrowRight size={12} /> {label.replace('Base Villahermosa', 'A Base')}
    </button>
  );
};

const InventoryTable = ({ inventory, baskets, currentUser, onRemoveBasket }) => (
  <div style={{ overflowX: 'auto' }}>
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
          {['ID','Diámetro','Long.','Material','Serial','Canastilla','Ubicación','Estado',''].map(h => (
            <th key={h} style={{ padding: '10px 13px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#374151', whiteSpace: 'nowrap' }}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {inventory.map(t => <InventoryRow key={t.id} t={t} baskets={baskets} currentUser={currentUser} onRemoveBasket={onRemoveBasket} />)}
      </tbody>
    </table>
    {inventory.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', padding: '28px' }}>No se encontraron tubos</p>}
  </div>
);

const InventoryRow = ({ t, baskets, currentUser, onRemoveBasket }) => {
  const [hov, setHov] = useState(false);
  const basket = baskets.find(b => b.id === t.basket_id);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #e5e7eb', background: hov ? '#f8fafc' : 'white', transition: 'background 0.15s' }}>
      <td style={{ padding: '11px 13px', fontSize: '13px', fontWeight: '600', color: '#1a2332' }}>{t.id}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#374151' }}>{t.diameter}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#374151' }}>{t.length}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#374151' }}>{t.material}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#374151' }}>{t.serial}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: basket ? '#374151' : '#d1d5db' }}>
        {basket ? basket.name : '—'}
      </td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#374151' }}>{t.location}</td>
      <td style={{ padding: '11px 13px' }}><StatusBadge status={t.status} /></td>
      <td style={{ padding: '11px 13px' }}>
        {currentUser.permissions.includes('manage_baskets') && t.basket_id && (
          <button onClick={() => onRemoveBasket(t.id)}
            style={{ background: '#fee2e2', border: 'none', borderRadius: '6px', padding: '5px 8px', cursor: 'pointer', color: '#dc2626', display: 'flex', alignItems: 'center' }}>
            <MinusCircle size={14} />
          </button>
        )}
      </td>
    </tr>
  );
};

const MovRow = ({ m }) => {
  const [hov, setHov] = useState(false);
  return (
    <tr onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderBottom: '1px solid #e5e7eb', background: hov ? '#f8fafc' : 'white', transition: 'background 0.15s' }}>
      <td style={{ padding: '11px 13px', fontSize: '13px', fontWeight: '600',
        color: m.type.includes('Entrada') || m.type.includes('Recepción') ? '#065f46' : m.type.includes('Salida') ? '#dc2626' : '#1e40af' }}>
        {m.type}
      </td>
      <td style={{ padding: '11px 13px', fontSize: '13px' }}>{m.tube_id}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#6b7280' }}>{m.from_location}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#6b7280' }}>{m.to_location}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#6b7280' }}>{m.date}</td>
      <td style={{ padding: '11px 13px', fontSize: '13px', color: '#6b7280' }}>{m.user_name}</td>
      <td style={{ padding: '11px 13px' }}><StatusBadge status={m.status} /></td>
      <td style={{ padding: '11px 13px', fontSize: '12px', color: '#9ca3af', maxWidth: '160px' }}>{m.notes || '—'}</td>
    </tr>
  );
};

export default InventorySystem;
