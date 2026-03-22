// ============================================
// IMPORTACIONES - Librerías necesarias
// ============================================
import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, Package, TrendingUp, CheckCircle, XCircle, Clock, QrCode,
  FileText, Lock, Eye, EyeOff, AlertCircle, Box, List, PlusCircle,
  MinusCircle, ArrowRight, Search, Filter, LogIn, LogOut
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import { firebaseConfig, supabaseConfig } from './config';

// ============================================
// INICIALIZACIÓN - Firebase y Supabase
// ============================================
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const supabase = createClient(supabaseConfig.url, supabaseConfig.anonKey);

// ============================================
// COMPONENTE: ESCÁNER QR REAL CON CÁMARA
// Requiere: npm install html5-qrcode
// ============================================
const QRScanner = ({ onScan, onClose }) => {
  const scannerRef = useRef(null);
  const [camError, setCamError] = useState('');
  const [manualId, setManualId] = useState('');

  useEffect(() => {
    let scanner = null;
    const timer = setTimeout(async () => {
      try {
        // Importación dinámica para no romper si no está instalada
        const { Html5QrcodeScanner } = await import('html5-qrcode');
        scanner = new Html5QrcodeScanner(
          'qr-reader-modal',
          {
            fps: 10,
            qrbox: { width: 260, height: 260 },
            aspectRatio: 1.0,
            showTorchButtonIfSupported: true,
            showZoomSliderIfSupported: true,
          },
          false
        );
        scanner.render(
          (decoded) => {
            scanner.clear().catch(() => {});
            onScan(decoded);
          },
          () => {} // errores de frame son normales
        );
        scannerRef.current = scanner;
      } catch (e) {
        setCamError('Instala html5-qrcode: npm install html5-qrcode\no usa el ingreso manual abajo.');
      }
    }, 150);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) scannerRef.current.clear().catch(() => {});
    };
  }, []);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.92)', zIndex: 9999,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      {/* Título */}
      <div style={{ color: 'white', textAlign: 'center', marginBottom: '20px' }}>
        <QrCode size={36} style={{ marginBottom: '8px' }} />
        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Escanear Código QR</h2>
        <p style={{ margin: '6px 0 0', opacity: 0.65, fontSize: '14px' }}>
          Apunta la cámara al QR del tubo
        </p>
      </div>

      {/* Área del escáner */}
      {camError ? (
        <div style={{
          background: '#fef3c7', border: '2px solid #fbbf24', borderRadius: '12px',
          padding: '20px', textAlign: 'center', color: '#92400e', maxWidth: '340px'
        }}>
          <AlertCircle size={36} style={{ marginBottom: '10px' }} />
          <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{camError}</p>
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: '16px', overflow: 'hidden',
          width: '100%', maxWidth: '380px'
        }}>
          <div id="qr-reader-modal" style={{ width: '100%' }} />
        </div>
      )}

      {/* Ingreso manual */}
      <div style={{ marginTop: '20px', width: '100%', maxWidth: '380px' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)', textAlign: 'center', fontSize: '13px', marginBottom: '8px' }}>
          ¿No funciona la cámara? Ingresa el ID manualmente:
        </p>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Ej: TUB-001 o serial..."
            value={manualId}
            onChange={(e) => setManualId(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && manualId.trim() && onScan(manualId.trim())}
            style={{
              flex: 1, padding: '12px 14px', borderRadius: '8px',
              border: 'none', fontSize: '15px', outline: 'none'
            }}
          />
          <button
            onClick={() => manualId.trim() && onScan(manualId.trim())}
            style={{
              padding: '12px 18px', background: '#3b82f6', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: '700',
              cursor: 'pointer', fontSize: '15px'
            }}
          >
            OK
          </button>
        </div>
      </div>

      {/* Cerrar */}
      <button
        onClick={onClose}
        style={{
          marginTop: '18px', padding: '13px 40px',
          background: 'rgba(255,255,255,0.12)', color: 'white',
          border: '2px solid rgba(255,255,255,0.25)', borderRadius: '10px',
          fontSize: '15px', fontWeight: '600', cursor: 'pointer'
        }}
      >
        ✕ Cerrar
      </button>
    </div>
  );
};

// ============================================
// SUBCOMPONENTE: Tarjeta de estadística
// ============================================
const StatCard = ({ icon, title, value, color }) => (
  <div style={{
    background: 'white', borderRadius: '16px', padding: '25px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex',
    alignItems: 'center', gap: '20px', border: `3px solid ${color}20`
  }}>
    <div style={{
      width: '60px', height: '60px', borderRadius: '14px',
      background: `${color}15`, display: 'flex', alignItems: 'center',
      justifyContent: 'center', color
    }}>
      {icon}
    </div>
    <div>
      <p style={{ margin: '0 0 4px', fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>{title}</p>
      <p style={{ margin: 0, fontSize: '32px', fontWeight: '800', color: '#1a2332' }}>{value}</p>
    </div>
  </div>
);

// ============================================
// ESTILOS BASE REUTILIZABLES
// ============================================
const card = {
  background: 'white', borderRadius: '16px', padding: '25px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '25px'
};
const navBtn = {
  background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none',
  borderRadius: '8px', padding: '10px 18px', cursor: 'pointer',
  fontSize: '14px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
};
const actionBtn = {
  background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px',
  padding: '10px 18px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
  display: 'flex', alignItems: 'center', gap: '6px'
};
const smallBtn = {
  color: 'white', border: 'none', borderRadius: '6px', padding: '6px 8px',
  cursor: 'pointer', display: 'flex', alignItems: 'center'
};
const th = {
  padding: '12px 16px', textAlign: 'left', fontSize: '13px',
  fontWeight: '700', color: '#374151', whiteSpace: 'nowrap'
};
const td = {
  padding: '12px 16px', fontSize: '14px', color: '#374151', whiteSpace: 'nowrap'
};

// ============================================
// COMPONENTE PRINCIPAL
// ============================================
const InventorySystem = () => {

  // --------------------------------------------
  // ESTADOS
  // --------------------------------------------
  const [currentUser, setCurrentUser]         = useState(null);
  const [currentView, setCurrentView]         = useState('login');
  const [inventory, setInventory]             = useState([]);
  const [baskets, setBaskets]                 = useState([]);
  const [movements, setMovements]             = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [selectedTube, setSelectedTube]       = useState(null);
  const [selectedBasket, setSelectedBasket]   = useState(null);
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loginError, setLoginError]           = useState('');
  const [loading, setLoading]                 = useState(false);
  const [searchTerm, setSearchTerm]           = useState('');
  const [filterLocation, setFilterLocation]   = useState('all');

  // NUEVOS ESTADOS
  const [showQRScanner, setShowQRScanner]     = useState(false);
  const [movementType, setMovementType]       = useState('salida'); // 'salida' | 'entrada'
  const [movementNote, setMovementNote]       = useState('');
  const [basketFilter, setBasketFilter]       = useState('todas');

  // --------------------------------------------
  // ROLES Y PERMISOS
  // --------------------------------------------
  const ROLES = {
    'almacenista@skala.com': {
      role: 'almacenista', name: 'Almacenista',
      permissions: ['create_exit', 'scan', 'view_inventory', 'manage_baskets']
    },
    'gerente@skala.com': {
      role: 'gerente', name: 'Gerente de Operaciones',
      permissions: ['approve_base_exit', 'view_reports', 'view_inventory']
    },
    'representante@skala.com': {
      role: 'representante', name: 'Representante a Bordo',
      permissions: ['approve_ship_entry', 'create_ship_exit', 'scan', 'manage_baskets']
    },
    'supervisor@skala.com': {
      role: 'supervisor', name: 'Supervisor',
      permissions: ['scan', 'install_tubes']
    },
    'lugracia.eta18@gmail.com': {
      role: 'administrador', name: 'Luciano - Administrador',
      permissions: ['create_exit', 'scan', 'view_inventory', 'approve_base_exit', 'view_reports',
        'approve_ship_entry', 'create_ship_exit', 'install_tubes', 'admin', 'manage_baskets']
    }
  };

  // --------------------------------------------
  // CARGAR DATOS AL INICIAR SESIÓN
  // --------------------------------------------
  useEffect(() => {
    if (currentUser) {
      loadInventory();
      loadBaskets();
      loadMovements();
      loadPendingApprovals();
    }
  }, [currentUser]);

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      alert('Error al cargar inventario. Verifica la conexión.');
    }
  };

  const loadBaskets = async () => {
    try {
      const { data, error } = await supabase
        .from('baskets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setBaskets(data || []);
    } catch (error) {
      console.error('Error cargando canastillas:', error);
    }
  };

  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('movements').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    }
  };

  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_approvals').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error cargando aprobaciones:', error);
    }
  };

  // --------------------------------------------
  // LOGIN / LOGOUT
  // --------------------------------------------
  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = ROLES[email.toLowerCase()];
      if (!userData) {
        await signOut(auth);
        throw new Error('Usuario no autorizado en el sistema');
      }
      setCurrentUser({ uid: userCredential.user.uid, email: userCredential.user.email, ...userData });
      setCurrentView('dashboard');
      setEmail('');
      setPassword('');
    } catch (error) {
      if (error.code === 'auth/invalid-credential') {
        setLoginError('Email o contraseña incorrectos');
      } else {
        setLoginError(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('login');
  };

  // --------------------------------------------
  // QR: Procesar resultado escaneado
  // --------------------------------------------
  const handleQRResult = (scannedText) => {
    setShowQRScanner(false);
    let tubeId = scannedText.trim();

    // El QR puede contener JSON: { "id": "TUB-001" } o texto plano
    try {
      const parsed = JSON.parse(scannedText);
      tubeId = parsed.id || parsed.tube_id || parsed.serial || scannedText;
    } catch (e) { /* texto plano, usar directo */ }

    // Buscar por id o por serial
    const tube = inventory.find(
      t => t.id === tubeId || t.serial === tubeId
    );

    if (tube) {
      setSelectedTube(tube);
    } else {
      alert(`⚠️ Tubo no encontrado\nID/Serial escaneado: "${tubeId}"\n\nVerifica que esté registrado en el sistema.`);
    }
  };

  // --------------------------------------------
  // FIX: CREAR SOLICITUD DE SALIDA (Base → Barco)
  // --------------------------------------------
  const createExitRequest = async () => {
    if (!selectedTube) { alert('Escanea un tubo primero'); return; }
    if (selectedTube.status === 'Pendiente Aprobación') {
      alert('⚠️ Este tubo ya tiene una solicitud pendiente'); return;
    }

    try {
      setLoading(true);

      // 1. Insertar movimiento (SIN campo id manual, Supabase lo genera)
      const { error: movError } = await supabase
        .from('movements')
        .insert([{
          tube_id: selectedTube.id,
          type: 'Salida Base',
          from_location: selectedTube.location,
          to_location: 'Barco',
          date: new Date().toISOString().split('T')[0],
          user_name: currentUser.name,
          status: 'Pendiente Aprobación',
          notes: movementNote || null
        }]);
      if (movError) throw movError;

      // 2. Insertar en pending_approvals (SIN campo id manual)
      const { error: pendError } = await supabase
        .from('pending_approvals')
        .insert([{
          tube_id: selectedTube.id,
          type: `Salida ${selectedTube.location} → Barco`,
          requested_by: currentUser.name,
          date: new Date().toISOString().split('T')[0],
          tubes: 1
        }]);
      if (pendError) throw pendError;

      // 3. Marcar tubo como Pendiente
      const { error: invError } = await supabase
        .from('inventory')
        .update({ status: 'Pendiente Aprobación' })
        .eq('id', selectedTube.id);
      if (invError) throw invError;

      alert('✅ Solicitud de SALIDA creada.\nEsperando aprobación del Gerente.');
      setSelectedTube(null);
      setMovementNote('');
      loadMovements();
      loadPendingApprovals();
      loadInventory();
    } catch (error) {
      console.error('Error salida:', error);
      alert('Error al crear salida: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------
  // NUEVO: CREAR SOLICITUD DE ENTRADA (Barco → Base)
  // --------------------------------------------
  const createEntryRequest = async () => {
    if (!selectedTube) { alert('Escanea un tubo primero'); return; }
    if (!['Barco', 'Estructura'].includes(selectedTube.location)) {
      alert('⚠️ Este tubo no está en el Barco o Estructura.\nUbicación actual: ' + selectedTube.location);
      return;
    }
    if (selectedTube.status === 'Pendiente Aprobación') {
      alert('⚠️ Este tubo ya tiene una solicitud pendiente'); return;
    }

    try {
      setLoading(true);

      const { error: movError } = await supabase
        .from('movements')
        .insert([{
          tube_id: selectedTube.id,
          type: 'Entrada Barco',
          from_location: selectedTube.location,
          to_location: 'Base Villahermosa',
          date: new Date().toISOString().split('T')[0],
          user_name: currentUser.name,
          status: 'Pendiente Aprobación',
          notes: movementNote || null
        }]);
      if (movError) throw movError;

      const { error: pendError } = await supabase
        .from('pending_approvals')
        .insert([{
          tube_id: selectedTube.id,
          type: `Entrada ${selectedTube.location} → Base Villahermosa`,
          requested_by: currentUser.name,
          date: new Date().toISOString().split('T')[0],
          tubes: 1
        }]);
      if (pendError) throw pendError;

      await supabase
        .from('inventory')
        .update({ status: 'Pendiente Aprobación' })
        .eq('id', selectedTube.id);

      alert('✅ Solicitud de ENTRADA creada.\nEsperando aprobación.');
      setSelectedTube(null);
      setMovementNote('');
      loadMovements();
      loadPendingApprovals();
      loadInventory();
    } catch (error) {
      console.error('Error entrada:', error);
      alert('Error al crear entrada: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------
  // FIX: APROBAR MOVIMIENTO (detecta entrada o salida)
  // --------------------------------------------
  const approveMovement = async (pendingId) => {
    try {
      setLoading(true);
      const pending = pendingApprovals.find(p => p.id === pendingId);
      if (!pending) { alert('Aprobación no encontrada'); return; }

      const isEntry = pending.type.includes('Entrada');
      const newLocation = isEntry ? 'Base Villahermosa' : 'Barco';

      // Actualizar movimiento
      const { error: movError } = await supabase
        .from('movements')
        .update({ status: 'Aprobado' })
        .eq('tube_id', pending.tube_id)
        .eq('status', 'Pendiente Aprobación');
      if (movError) throw movError;

      // Actualizar inventario
      const { error: invError } = await supabase
        .from('inventory')
        .update({ location: newLocation, status: 'Disponible' })
        .eq('id', pending.tube_id);
      if (invError) throw invError;

      // Eliminar de pendientes
      const { error: delError } = await supabase
        .from('pending_approvals')
        .delete()
        .eq('id', pendingId);
      if (delError) throw delError;

      alert(`✅ Aprobado\nTubo: ${pending.tube_id}\nNueva ubicación: ${newLocation}`);
      loadInventory();
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      console.error('Error aprobando:', error);
      alert('Error al aprobar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------
  // FIX: RECHAZAR MOVIMIENTO (devuelve tubo a Disponible)
  // --------------------------------------------
  const rejectMovement = async (pendingId) => {
    try {
      setLoading(true);
      const pending = pendingApprovals.find(p => p.id === pendingId);
      if (!pending) return;

      await supabase
        .from('movements')
        .update({ status: 'Rechazado' })
        .eq('tube_id', pending.tube_id)
        .eq('status', 'Pendiente Aprobación');

      // Devolver tubo a Disponible
      await supabase
        .from('inventory')
        .update({ status: 'Disponible' })
        .eq('id', pending.tube_id);

      await supabase
        .from('pending_approvals')
        .delete()
        .eq('id', pendingId);

      alert(`❌ Rechazado: ${pending.tube_id}\nTubo devuelto a estado Disponible`);
      loadMovements();
      loadPendingApprovals();
      loadInventory();
    } catch (error) {
      console.error('Error rechazando:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------
  // ASIGNAR TUBO A CANASTILLA
  // --------------------------------------------
  const assignToBasket = async (tubeId, basketId) => {
    try {
      const basket = baskets.find(b => b.id === basketId);
      if (basket.current_count >= basket.capacity) {
        alert('⚠️ Canastilla llena. Capacidad máxima alcanzada.');
        return;
      }
      const { error } = await supabase
        .from('inventory')
        .update({ basket_id: basketId })
        .eq('id', tubeId);
      if (error) throw error;
      alert(`✅ Tubo ${tubeId} asignado a ${basket.name}`);
      loadInventory();
      loadBaskets();
      setSelectedTube(null);
      setCurrentView('dashboard');
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar tubo a canastilla');
    }
  };

  // --------------------------------------------
  // REMOVER TUBO DE CANASTILLA
  // --------------------------------------------
  const removeFromBasket = async (tubeId) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ basket_id: null })
        .eq('id', tubeId);
      if (error) throw error;
      alert(`✅ Tubo ${tubeId} removido de la canastilla`);
      loadInventory();
      loadBaskets();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al remover tubo');
    }
  };

  // --------------------------------------------
  // MOVER CANASTILLA COMPLETA
  // --------------------------------------------
  const moveBasket = async (basketId, toLocation) => {
    try {
      const basket = baskets.find(b => b.id === basketId);
      if (!basket) { alert('Canastilla no encontrada'); return; }

      const { error: basketError } = await supabase
        .from('baskets')
        .update({ location: toLocation })
        .eq('id', basketId);
      if (basketError) throw basketError;

      const { error: tubesError } = await supabase
        .from('inventory')
        .update({ location: toLocation })
        .eq('basket_id', basketId);
      if (tubesError) throw tubesError;

      // Registrar movimiento (SIN id manual)
      const { error: movError } = await supabase
        .from('movements')
        .insert([{
          tube_id: basketId,
          type: 'Movimiento Canastilla',
          from_location: basket.location,
          to_location: toLocation,
          date: new Date().toISOString().split('T')[0],
          user_name: currentUser.name,
          status: 'Completado'
        }]);
      if (movError) throw movError;

      alert(`✅ Canastilla "${basket.name}" movida a ${toLocation}\n${basket.current_count} tubos actualizados`);
      loadBaskets();
      loadInventory();
      loadMovements();
      setSelectedBasket(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al mover canastilla: ' + error.message);
    }
  };

  // --------------------------------------------
  // FILTROS
  // --------------------------------------------
  const filteredInventory = inventory.filter(tube => {
    const matchSearch =
      (tube.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tube.serial || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchLocation = filterLocation === 'all' || tube.location === filterLocation;
    return matchSearch && matchLocation;
  });

  const filteredBaskets = baskets.filter(basket => {
    const matchSearch =
      (basket.id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (basket.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchLocation = filterLocation === 'all' || basket.location === filterLocation;
    const matchCategory = basketFilter === 'todas' || basket.tube_category === basketFilter;
    return matchSearch && matchLocation && matchCategory;
  });

  // ============================================
  // PANTALLA DE LOGIN
  // ============================================
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
              <input
                type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="usuario@skala.com"
                style={{ width: '100%', padding: '12px 15px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'} value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Contraseña"
                  style={{ width: '100%', padding: '12px 45px 12px 15px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}>
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />{loginError}
              </div>
            )}

            <button onClick={handleLogin} disabled={loading}
              style={{ width: '100%', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59,130,246,0.3)' }}>
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
              <p style={{ margin: '4px 0' }}>• lugracia.eta18@gmail.com (Admin)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // PANTALLA PRINCIPAL
  // ============================================
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui' }}>

      {/* ── HEADER ── */}
      <div style={{ background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)', padding: '15px 20px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.15)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Package size={30} />
            <div>
              <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '700' }}>Skala Energy</h1>
              <p style={{ margin: 0, fontSize: '13px', opacity: 0.85 }}>{currentUser?.name} · {currentUser?.role}</p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={() => setCurrentView('dashboard')} style={{ ...navBtn, background: currentView === 'dashboard' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)' }}>
              📊 Dashboard
            </button>
            <button onClick={() => setCurrentView('baskets')} style={{ ...navBtn, background: currentView === 'baskets' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)' }}>
              <Box size={15} /> Canastillas
            </button>
            {currentUser?.permissions.includes('scan') && (
              <button onClick={() => setCurrentView('scanner')} style={{ ...navBtn, background: currentView === 'scanner' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)' }}>
                <Camera size={15} /> Escáner
              </button>
            )}
            <button onClick={() => setCurrentView('movements')} style={{ ...navBtn, background: currentView === 'movements' ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.1)' }}>
              <List size={15} /> Movimientos
            </button>
            <button onClick={handleLogout} style={{ ...navBtn, background: 'rgba(239,68,68,0.25)' }}>
              <LogOut size={15} /> Salir
            </button>
          </div>
        </div>
      </div>

      {/* ── CONTENIDO ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '25px 20px' }}>

        {/* ============================================ */}
        {/* VISTA: DASHBOARD                            */}
        {/* ============================================ */}
        {currentView === 'dashboard' && (
          <>
            {/* Estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '25px' }}>
              <StatCard icon={<Package size={28} />} title="Total Tubos"   value={inventory.length}                                              color="#3b82f6" />
              <StatCard icon={<Box size={28} />}     title="Canastillas"   value={baskets.length}                                               color="#8b5cf6" />
              <StatCard icon={<TrendingUp size={28} />} title="En Tránsito" value={inventory.filter(i => i.status === 'En tránsito').length}    color="#10b981" />
              <StatCard icon={<Clock size={28} />}   title="Pendientes"    value={pendingApprovals.length}                                      color="#f59e0b" />
            </div>

            {/* Aprobaciones pendientes */}
            {currentUser.permissions.includes('approve_base_exit') && pendingApprovals.length > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={22} color="#f59e0b" /> Aprobaciones Pendientes ({pendingApprovals.length})
                </h2>
                {pendingApprovals.map(p => (
                  <div key={p.id} style={{ background: '#fef3c7', padding: '18px', borderRadius: '12px', marginBottom: '12px', border: '2px solid #fbbf24' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                      <div>
                        <p style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '700', color: '#1a2332' }}>{p.type}</p>
                        <p style={{ margin: '0 0 3px', fontSize: '13px', color: '#6b7280' }}>🔧 Tubo: <strong>{p.tube_id}</strong></p>
                        <p style={{ margin: 0, fontSize: '13px', color: '#6b7280' }}>👤 Por: {p.requested_by} · {p.date}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => approveMovement(p.id)} disabled={loading}
                          style={{ ...actionBtn, background: '#10b981' }}>
                          <CheckCircle size={16} /> Aprobar
                        </button>
                        <button onClick={() => rejectMovement(p.id)} disabled={loading}
                          style={{ ...actionBtn, background: '#ef4444' }}>
                          <XCircle size={16} /> Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Búsqueda y filtros */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
                <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input type="text" placeholder="Buscar por ID o serial..."
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '11px 14px 11px 42px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}
                style={{ padding: '11px 14px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '14px', outline: 'none', cursor: 'pointer' }}>
                <option value="all">Todas las ubicaciones</option>
                <option value="Base Villahermosa">Base Villahermosa</option>
                <option value="Barco">Barco</option>
                <option value="Estructura">Estructura</option>
              </select>
            </div>

            {/* Tabla de inventario */}
            <div style={card}>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#1a2332', marginBottom: '18px' }}>
                Inventario de Tubos ({filteredInventory.length})
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                      {['ID', 'Diámetro', 'Longitud', 'Material', 'Serial', 'Figura', 'Canastilla', 'Ubicación', 'Estado', 'Acciones'].map(h => (
                        <th key={h} style={th}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInventory.map(t => {
                      const basket = baskets.find(b => b.id === t.basket_id);
                      return (
                        <tr key={t.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                          <td style={td}>{t.id}</td>
                          <td style={td}>{t.diameter}</td>
                          <td style={td}>{t.length}</td>
                          <td style={td}>{t.material}</td>
                          <td style={td}>{t.serial}</td>
                          <td style={td}>{t.figure}</td>
                          <td style={td}>{basket ? basket.name : <span style={{ color: '#9ca3af' }}>Sin asignar</span>}</td>
                          <td style={td}>{t.location}</td>
                          <td style={td}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                              background: t.status === 'Disponible' ? '#d1fae5' : t.status === 'Pendiente Aprobación' ? '#dbeafe' : '#fef3c7',
                              color:      t.status === 'Disponible' ? '#065f46' : t.status === 'Pendiente Aprobación' ? '#1e40af' : '#92400e'
                            }}>{t.status}</span>
                          </td>
                          <td style={td}>
                            {currentUser.permissions.includes('manage_baskets') && (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                {t.basket_id ? (
                                  <button onClick={() => removeFromBasket(t.id)}
                                    style={{ ...smallBtn, background: '#ef4444' }} title="Quitar de canastilla">
                                    <MinusCircle size={14} />
                                  </button>
                                ) : (
                                  <button onClick={() => { setSelectedTube(t); setCurrentView('assign-basket'); }}
                                    style={{ ...smallBtn, background: '#10b981' }} title="Asignar a canastilla">
                                    <PlusCircle size={14} />
                                  </button>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredInventory.length === 0 && (
                  <p style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No se encontraron tubos</p>
                )}
              </div>
            </div>
          </>
        )}

        {/* ============================================ */}
        {/* VISTA: ESCÁNER — Entradas y Salidas         */}
        {/* ============================================ */}
        {currentView === 'scanner' && (
          <div style={card}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Camera size={26} /> Escáner de Tubos
            </h2>

            {/* Selector Salida / Entrada */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
              <button onClick={() => setMovementType('salida')}
                style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '15px',
                  background: movementType === 'salida' ? '#ef4444' : '#f3f4f6',
                  color:      movementType === 'salida' ? 'white'   : '#6b7280' }}>
                📤 Salida — Base → Barco
              </button>
              <button onClick={() => setMovementType('entrada')}
                style={{ flex: 1, padding: '14px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '15px',
                  background: movementType === 'entrada' ? '#10b981' : '#f3f4f6',
                  color:      movementType === 'entrada' ? 'white'   : '#6b7280' }}>
                📥 Entrada — Barco → Base
              </button>
            </div>

            {/* Botón abrir cámara */}
            <button onClick={() => setShowQRScanner(true)}
              style={{ width: '100%', padding: '18px', background: 'linear-gradient(135deg, #3b82f6, #1e3a8a)',
                color: 'white', border: 'none', borderRadius: '12px', fontSize: '17px', fontWeight: '700',
                cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
              <QrCode size={22} /> Escanear Código QR
            </button>

            {/* Tubo escaneado */}
            {selectedTube && (
              <div style={{ background: '#f0fdf4', border: '2px solid #86efac', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
                <h3 style={{ color: '#166534', margin: '0 0 15px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '16px' }}>
                  <CheckCircle size={20} /> Tubo Escaneado
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px', marginBottom: '15px' }}>
                  <p style={{ margin: 0 }}><strong>ID:</strong> {selectedTube.id}</p>
                  <p style={{ margin: 0 }}><strong>Serial:</strong> {selectedTube.serial}</p>
                  <p style={{ margin: 0 }}><strong>Diámetro:</strong> {selectedTube.diameter}</p>
                  <p style={{ margin: 0 }}><strong>Longitud:</strong> {selectedTube.length}</p>
                  <p style={{ margin: 0 }}><strong>Material:</strong> {selectedTube.material}</p>
                  <p style={{ margin: 0 }}><strong>Ubicación:</strong> {selectedTube.location}</p>
                  <p style={{ margin: 0 }}>
                    <strong>Estado: </strong>
                    <span style={{ color: selectedTube.status === 'Disponible' ? '#065f46' : '#92400e', fontWeight: '600' }}>
                      {selectedTube.status}
                    </span>
                  </p>
                  {selectedTube.basket_id && (
                    <p style={{ margin: 0 }}><strong>Canastilla:</strong> {baskets.find(b => b.id === selectedTube.basket_id)?.name || selectedTube.basket_id}</p>
                  )}
                </div>

                {/* Nota opcional */}
                <textarea
                  placeholder="Nota opcional (ej: tubo con daño en rosca)..."
                  value={movementNote}
                  onChange={(e) => setMovementNote(e.target.value)}
                  style={{ width: '100%', padding: '10px', border: '2px solid #d1fae5', borderRadius: '8px', fontSize: '14px', resize: 'vertical', minHeight: '65px', boxSizing: 'border-box', outline: 'none' }}
                />

                {/* Botones de acción */}
                <div style={{ display: 'flex', gap: '10px', marginTop: '14px', flexWrap: 'wrap' }}>
                  {movementType === 'salida' && currentUser.permissions.includes('create_exit') && (
                    <button onClick={createExitRequest} disabled={loading}
                      style={{ ...actionBtn, flex: 1, background: loading ? '#9ca3af' : '#ef4444', fontSize: '15px', padding: '13px', justifyContent: 'center' }}>
                      {loading ? '⏳ Procesando...' : '📤 Crear Salida Base → Barco'}
                    </button>
                  )}
                  {movementType === 'entrada' && currentUser.permissions.includes('create_ship_exit') && (
                    <button onClick={createEntryRequest} disabled={loading}
                      style={{ ...actionBtn, flex: 1, background: loading ? '#9ca3af' : '#10b981', fontSize: '15px', padding: '13px', justifyContent: 'center' }}>
                      {loading ? '⏳ Procesando...' : '📥 Crear Entrada Barco → Base'}
                    </button>
                  )}
                  <button onClick={() => { setSelectedTube(null); setMovementNote(''); }}
                    style={{ ...actionBtn, background: '#6b7280', padding: '13px 18px' }}>
                    ✕ Cancelar
                  </button>
                </div>
              </div>
            )}

            {/* Últimos movimientos */}
            {movements.length > 0 && (
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#374151', marginBottom: '12px' }}>
                  Últimos movimientos
                </h3>
                {movements.slice(0, 6).map(m => (
                  <div key={m.id} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: '600', fontSize: '14px' }}>{m.type} — {m.tube_id}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>{m.from_location} → {m.to_location} · {m.date}</p>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                      background: m.status === 'Aprobado'  ? '#d1fae5' : m.status === 'Rechazado' ? '#fee2e2' : m.status === 'Completado' ? '#dbeafe' : '#fef3c7',
                      color:      m.status === 'Aprobado'  ? '#065f46' : m.status === 'Rechazado' ? '#dc2626' : m.status === 'Completado' ? '#1e40af' : '#92400e'
                    }}>{m.status}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* VISTA: CANASTILLAS con categorías           */}
        {/* ============================================ */}
        {currentView === 'baskets' && (
          <div>
            {/* Header + filtros de categoría */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
              <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a2332', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Box size={26} /> Gestión de Canastillas
              </h2>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['todas', ...new Set(baskets.map(b => b.tube_category).filter(Boolean))].map(cat => (
                  <button key={cat} onClick={() => setBasketFilter(cat)}
                    style={{ padding: '7px 15px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s',
                      background: basketFilter === cat ? '#3b82f6' : '#e5e7eb',
                      color:      basketFilter === cat ? 'white'   : '#374151' }}>
                    {cat === 'todas' ? '🗂️ Todas' : `📦 ${cat}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Resumen por categoría */}
            {baskets.some(b => b.tube_category) && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '22px' }}>
                {[...new Set(baskets.map(b => b.tube_category).filter(Boolean))].map(cat => {
                  const catTubes = inventory.filter(t => {
                    const b = baskets.find(bk => bk.id === t.basket_id);
                    return b && b.tube_category === cat;
                  });
                  const catBaskets = baskets.filter(b => b.tube_category === cat);
                  return (
                    <div key={cat} style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px', textAlign: 'center' }}>
                      <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#6b7280', fontWeight: '600' }}>📦 {cat}</p>
                      <p style={{ margin: '0 0 4px', fontSize: '30px', fontWeight: '800', color: '#1a2332' }}>{catTubes.length}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#9ca3af' }}>
                        tubos · {catBaskets.length} canastilla{catBaskets.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Grid de canastillas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))', gap: '20px' }}>
              {filteredBaskets.map(basket => {
                const tubesInBasket = inventory.filter(t => t.basket_id === basket.id);
                const fillPct = basket.capacity > 0
                  ? Math.min((basket.current_count / basket.capacity) * 100, 100) : 0;
                const barColor = fillPct > 90 ? '#ef4444' : fillPct > 70 ? '#f59e0b' : '#10b981';

                // Agrupar tubos por tipo (diámetro + material)
                const tubesByType = tubesInBasket.reduce((acc, tube) => {
                  const key = [tube.diameter, tube.material].filter(Boolean).join(' · ') || 'Sin clasificar';
                  if (!acc[key]) acc[key] = [];
                  acc[key].push(tube);
                  return acc;
                }, {});

                return (
                  <div key={basket.id} style={{ background: 'white', border: '2px solid #e5e7eb', borderRadius: '16px', padding: '20px', transition: 'all 0.3s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = '#e5e7eb'}>

                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ margin: '0 0 5px', fontSize: '17px', fontWeight: '700', color: '#1a2332' }}>{basket.name}</h3>
                        {basket.tube_category && (
                          <span style={{ display: 'inline-block', padding: '3px 10px', background: '#eff6ff', color: '#1d4ed8', borderRadius: '20px', fontSize: '12px', fontWeight: '600' }}>
                            📦 {basket.tube_category}
                          </span>
                        )}
                      </div>
                      <span style={{ padding: '4px 12px', borderRadius: '12px', fontSize: '12px', fontWeight: '600',
                        background: basket.status === 'Disponible' ? '#d1fae5' : '#fef3c7',
                        color:      basket.status === 'Disponible' ? '#065f46' : '#92400e' }}>
                        {basket.status}
                      </span>
                    </div>

                    {/* Info básica */}
                    <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '12px' }}>
                      <p style={{ margin: '3px 0' }}>📍 <strong>Ubicación:</strong> {basket.location}</p>
                      <p style={{ margin: '3px 0' }}>📊 <strong>Capacidad:</strong> {basket.current_count} / {basket.capacity} tubos</p>
                    </div>

                    {/* Barra de llenado */}
                    <div style={{ marginBottom: '14px' }}>
                      <div style={{ width: '100%', height: '10px', background: '#e5e7eb', borderRadius: '5px', overflow: 'hidden' }}>
                        <div style={{ width: `${fillPct}%`, height: '100%', background: barColor, transition: 'width 0.4s ease', borderRadius: '5px' }} />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#9ca3af' }}>{fillPct.toFixed(0)}% llena</span>
                        <span style={{ fontSize: '11px', fontWeight: fillPct > 90 ? '700' : '400', color: fillPct > 90 ? '#ef4444' : '#9ca3af' }}>
                          {fillPct >= 100 ? '⚠️ Llena' : fillPct > 90 ? '⚠️ Casi llena' : fillPct === 0 ? 'Vacía' : `${basket.capacity - basket.current_count} libres`}
                        </span>
                      </div>
                    </div>

                    {/* Tubos agrupados por tipo/categoría */}
                    {Object.keys(tubesByType).length > 0 ? (
                      <div style={{ marginBottom: '14px' }}>
                        <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '700', color: '#374151' }}>
                          Contenido por tipo:
                        </p>
                        {Object.entries(tubesByType).map(([tipo, tubos]) => (
                          <div key={tipo} style={{ background: '#f8fafc', borderRadius: '8px', padding: '8px 12px', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <span style={{ fontSize: '13px', fontWeight: '600', color: '#1a2332' }}>{tipo}</span>
                              <div style={{ fontSize: '11px', color: '#9ca3af', marginTop: '2px' }}>
                                {tubos.slice(0, 3).map(t => t.serial || t.id).join(', ')}
                                {tubos.length > 3 && ` +${tubos.length - 3} más`}
                              </div>
                            </div>
                            <span style={{ background: '#3b82f6', color: 'white', borderRadius: '20px', padding: '3px 10px', fontSize: '13px', fontWeight: '700', minWidth: '28px', textAlign: 'center' }}>
                              {tubos.length}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p style={{ textAlign: 'center', color: '#d1d5db', fontSize: '13px', padding: '10px 0', marginBottom: '10px' }}>
                        Canastilla vacía
                      </p>
                    )}

                    {/* Botones mover */}
                    {currentUser.permissions.includes('manage_baskets') && (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                        <button onClick={() => moveBasket(basket.id, 'Barco')}
                          style={{ ...actionBtn, flex: 1, background: '#3b82f6', fontSize: '13px', padding: '8px 10px', justifyContent: 'center' }}>
                          <ArrowRight size={14} /> A Barco
                        </button>
                        <button onClick={() => moveBasket(basket.id, 'Estructura')}
                          style={{ ...actionBtn, flex: 1, background: '#8b5cf6', fontSize: '13px', padding: '8px 10px', justifyContent: 'center' }}>
                          <ArrowRight size={14} /> A Estructura
                        </button>
                        <button onClick={() => moveBasket(basket.id, 'Base Villahermosa')}
                          style={{ ...actionBtn, flex: 1, background: '#10b981', fontSize: '13px', padding: '8px 10px', justifyContent: 'center' }}>
                          <ArrowRight size={14} /> A Base
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
              {filteredBaskets.length === 0 && (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No hay canastillas para mostrar
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* VISTA: ASIGNAR TUBO A CANASTILLA            */}
        {/* ============================================ */}
        {currentView === 'assign-basket' && selectedTube && (
          <div style={card}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
              Asignar Tubo a Canastilla
            </h2>
            <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: '10px', padding: '15px', marginBottom: '22px', fontSize: '14px' }}>
              <p style={{ margin: 0 }}><strong>Tubo:</strong> {selectedTube.id} · {selectedTube.diameter} · Serial: {selectedTube.serial}</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
              {baskets.filter(b => b.current_count < b.capacity).map(basket => (
                <div key={basket.id}
                  onClick={() => assignToBasket(selectedTube.id, basket.id)}
                  style={{ border: '2px solid #e5e7eb', borderRadius: '12px', padding: '16px', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.background = 'white'; }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '15px', color: '#1a2332' }}>{basket.name}</strong>
                    {basket.tube_category && (
                      <span style={{ fontSize: '11px', background: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '10px', fontWeight: '600' }}>
                        {basket.tube_category}
                      </span>
                    )}
                  </div>
                  <p style={{ margin: '3px 0', fontSize: '13px', color: '#6b7280' }}>📍 {basket.location}</p>
                  <p style={{ margin: '3px 0', fontSize: '13px', color: '#6b7280' }}>
                    📊 {basket.current_count}/{basket.capacity} · {basket.capacity - basket.current_count} espacios libres
                  </p>
                </div>
              ))}
            </div>
            <button onClick={() => { setSelectedTube(null); setCurrentView('dashboard'); }}
              style={{ ...actionBtn, background: '#6b7280', marginTop: '20px' }}>
              ← Cancelar
            </button>
          </div>
        )}

        {/* ============================================ */}
        {/* VISTA: MOVIMIENTOS                          */}
        {/* ============================================ */}
        {currentView === 'movements' && (
          <div style={card}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <List size={26} /> Historial de Movimientos ({movements.length})
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                    {['Tipo', 'Tubo / Canastilla', 'Desde', 'Hacia', 'Fecha', 'Usuario', 'Estado', 'Notas'].map(h => (
                      <th key={h} style={th}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {movements.map(m => (
                    <tr key={m.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={td}>
                        <span style={{ fontWeight: '600', color: m.type.includes('Entrada') ? '#065f46' : m.type.includes('Salida') ? '#dc2626' : '#1e40af' }}>
                          {m.type}
                        </span>
                      </td>
                      <td style={td}>{m.tube_id}</td>
                      <td style={td}>{m.from_location}</td>
                      <td style={td}>{m.to_location}</td>
                      <td style={td}>{m.date}</td>
                      <td style={td}>{m.user_name}</td>
                      <td style={td}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '10px', fontSize: '12px', fontWeight: '600',
                          background: m.status === 'Aprobado' ? '#d1fae5' : m.status === 'Rechazado' ? '#fee2e2' : m.status === 'Completado' ? '#dbeafe' : '#fef3c7',
                          color:      m.status === 'Aprobado' ? '#065f46' : m.status === 'Rechazado' ? '#dc2626' : m.status === 'Completado' ? '#1e40af' : '#92400e'
                        }}>{m.status}</span>
                      </td>
                      <td style={{ ...td, maxWidth: '180px', whiteSpace: 'normal', fontSize: '12px', color: '#6b7280' }}>
                        {m.notes || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {movements.length === 0 && (
                <p style={{ textAlign: 'center', color: '#9ca3af', padding: '30px' }}>No hay movimientos registrados</p>
              )}
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL ESCÁNER QR ── */}
      {showQRScanner && (
        <QRScanner
          onScan={handleQRResult}
          onClose={() => setShowQRScanner(false)}
        />
      )}

    </div>
  );
};

export default InventorySystem;
