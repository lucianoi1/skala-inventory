// ============================================
// IMPORTACIONES - Librerías necesarias
// ============================================
import React, { useState, useEffect } from 'react';
import { 
  Camera, Package, TrendingUp, CheckCircle, XCircle, Clock, QrCode, 
  FileText, Lock, Eye, EyeOff, AlertCircle, Box, List, PlusCircle, 
  MinusCircle, ArrowRight, Search, Filter 
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
// COMPONENTE PRINCIPAL
// ============================================
const InventorySystem = () => {
  // --------------------------------------------
  // ESTADOS - Variables que controlan la app
  // --------------------------------------------
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [inventory, setInventory] = useState([]);
  const [baskets, setBaskets] = useState([]);
  const [movements, setMovements] = useState([]);
  const [pendingApprovals, setPendingApprovals] = useState([]);
  const [scannerActive, setScannerActive] = useState(false);
  const [selectedTube, setSelectedTube] = useState(null);
  const [selectedBasket, setSelectedBasket] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLocation, setFilterLocation] = useState('all');

  // --------------------------------------------
  // ROLES - Permisos de cada usuario
  // --------------------------------------------
  const ROLES = {
    'almacenista@skala.com': { 
      role: 'almacenista', 
      name: 'Almacenista', 
      permissions: ['create_exit', 'scan', 'view_inventory', 'manage_baskets'] 
    },
    'gerente@skala.com': { 
      role: 'gerente', 
      name: 'Gerente de Operaciones', 
      permissions: ['approve_base_exit', 'view_reports', 'view_inventory'] 
    },
    'representante@skala.com': { 
      role: 'representante', 
      name: 'Representante a Bordo', 
      permissions: ['approve_ship_entry', 'create_ship_exit', 'scan', 'manage_baskets'] 
    },
    'supervisor@skala.com': { 
      role: 'supervisor', 
      name: 'Supervisor', 
      permissions: ['scan', 'install_tubes'] 
    },
    'lugracia.eta18@gmail.com': { 
      role: 'administrador', 
      name: 'Luciano - Administrador', 
      permissions: ['create_exit', 'scan', 'view_inventory', 'approve_base_exit', 'view_reports', 'approve_ship_entry', 'create_ship_exit', 'install_tubes', 'admin', 'manage_baskets'] 
    }
  };

  // --------------------------------------------
  // CARGAR DATOS - Al iniciar sesión
  // --------------------------------------------
  useEffect(() => {
    if (currentUser) {
      loadInventory();
      loadBaskets();
      loadMovements();
      loadPendingApprovals();
    }
  }, [currentUser]);

  // --------------------------------------------
  // FUNCIÓN: Cargar inventario de tubos
  // --------------------------------------------
  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      alert('Error al cargar inventario. Verifica la conexión.');
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Cargar canastillas
  // --------------------------------------------
  const loadBaskets = async () => {
    try {
      const { data, error } = await supabase
        .from('baskets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBaskets(data || []);
    } catch (error) {
      console.error('Error cargando canastillas:', error);
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Cargar movimientos
  // --------------------------------------------
  const loadMovements = async () => {
    try {
      const { data, error } = await supabase
        .from('movements')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setMovements(data || []);
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Cargar aprobaciones pendientes
  // --------------------------------------------
  const loadPendingApprovals = async () => {
    try {
      const { data, error } = await supabase
        .from('pending_approvals')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setPendingApprovals(data || []);
    } catch (error) {
      console.error('Error cargando aprobaciones:', error);
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Iniciar sesión con Firebase
  // --------------------------------------------
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
      
      setCurrentUser({ 
        uid: userCredential.user.uid, 
        email: userCredential.user.email, 
        ...userData 
      });
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

  // --------------------------------------------
  // FUNCIÓN: Cerrar sesión
  // --------------------------------------------
  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('login');
  };

  // --------------------------------------------
  // FUNCIÓN: Escanear tubo (Simulado)
  // --------------------------------------------
  const handleScan = (tubeId) => {
    const tube = inventory.find(t => t.id === tubeId);
    if (tube) {
      setSelectedTube(tube);
      setScannerActive(false);
      
      // Buscar si el tubo está en una canastilla
      const basket = baskets.find(b => b.id === tube.basket_id);
      
      alert(`✓ Tubo escaneado:\n\nID: ${tube.id}\nDiámetro: ${tube.diameter}\nSerial: ${tube.serial}\nUbicación: ${tube.location}${basket ? `\nCanastilla: ${basket.name}` : ''}`);
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Activar escáner simulado
  // --------------------------------------------
  const simulateScan = () => {
    setScannerActive(true);
    setTimeout(() => {
      if (inventory.length > 0) {
        const randomTube = inventory[Math.floor(Math.random() * inventory.length)];
        handleScan(randomTube.id);
      }
    }, 2000);
  };

  // --------------------------------------------
  // FUNCIÓN: Escanear canastilla
  // --------------------------------------------
  const scanBasket = (basketId) => {
    const basket = baskets.find(b => b.id === basketId);
    if (basket) {
      setSelectedBasket(basket);
      
      // Contar tubos en esta canastilla
      const tubesInBasket = inventory.filter(t => t.basket_id === basketId);
      
      alert(`✓ Canastilla escaneada:\n\nID: ${basket.name}\nUbicación: ${basket.location}\nCapacidad: ${basket.current_count}/${basket.capacity} tubos\nTubos: ${tubesInBasket.map(t => t.id).join(', ') || 'Vacía'}`);
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Asignar tubo a canastilla
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
      
      alert(`✓ Tubo ${tubeId} asignado a ${basket.name}`);
      loadInventory();
      loadBaskets();
      setSelectedTube(null);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar tubo a canastilla');
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Remover tubo de canastilla
  // --------------------------------------------
  const removeFromBasket = async (tubeId) => {
    try {
      const { error } = await supabase
        .from('inventory')
        .update({ basket_id: null })
        .eq('id', tubeId);
      
      if (error) throw error;
      
      alert(`✓ Tubo ${tubeId} removido de la canastilla`);
      loadInventory();
      loadBaskets();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al remover tubo');
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Crear solicitud de salida
  // --------------------------------------------
  const createExitRequest = async () => {
    if (!selectedTube) {
      alert('Escanea un tubo primero');
      return;
    }

    try {
      const newMovement = {
        id: `MOV-${Date.now()}`,
        tube_id: selectedTube.id,
        type: 'Salida Base',
        from_location: selectedTube.location,
        to_location: 'Barco',
        date: new Date().toISOString().split('T')[0],
        user_name: currentUser.name,
        status: 'Pendiente Aprobación'
      };

      const { error: movError } = await supabase
        .from('movements')
        .insert([newMovement]);
      
      if (movError) throw movError;

      const newPending = {
        id: `PEND-${Date.now()}`,
        tube_id: selectedTube.id,
        type: `Salida ${selectedTube.location} → Barco`,
        requested_by: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        tubes: 1
      };

      const { error: pendError } = await supabase
        .from('pending_approvals')
        .insert([newPending]);
      
      if (pendError) throw pendError;

      alert('✓ Solicitud creada. Esperando aprobación.');
      setSelectedTube(null);
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear solicitud: ' + error.message);
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Mover canastilla completa
  // --------------------------------------------
  const moveBasket = async (basketId, toLocation) => {
    try {
      const basket = baskets.find(b => b.id === basketId);
      
      if (!basket) {
        alert('Canastilla no encontrada');
        return;
      }

      // Actualizar ubicación de la canastilla
      const { error: basketError } = await supabase
        .from('baskets')
        .update({ location: toLocation })
        .eq('id', basketId);
      
      if (basketError) throw basketError;

      // Actualizar ubicación de todos los tubos en la canastilla
      const { error: tubesError } = await supabase
        .from('inventory')
        .update({ location: toLocation })
        .eq('basket_id', basketId);
      
      if (tubesError) throw tubesError;

      // Registrar movimiento
      const { error: movError } = await supabase
        .from('movements')
        .insert([{
          id: `MOV-${Date.now()}`,
          tube_id: basketId,
          type: 'Movimiento Canastilla',
          from_location: basket.location,
          to_location: toLocation,
          date: new Date().toISOString().split('T')[0],
          user_name: currentUser.name,
          status: 'Completado'
        }]);
      
      if (movError) throw movError;

      alert(`✓ Canastilla ${basket.name} movida a ${toLocation}\n${basket.current_count} tubos actualizados`);
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
  // FUNCIÓN: Aprobar movimiento
  // --------------------------------------------
  const approveMovement = async (pendingId) => {
    try {
      const pending = pendingApprovals.find(p => p.id === pendingId);
      
      await supabase
        .from('movements')
        .update({ 
          status: 'Aprobado', 
          approved_by: currentUser.name 
        })
        .eq('tube_id', pending.tube_id)
        .eq('status', 'Pendiente Aprobación');
      
      await supabase
        .from('inventory')
        .update({ 
          location: 'Barco', 
          status: 'En tránsito' 
        })
        .eq('id', pending.tube_id);
      
      await supabase
        .from('pending_approvals')
        .delete()
        .eq('id', pendingId);

      alert(`✓ Aprobado\nTubo: ${pending.tube_id}\nNueva ubicación: Barco`);
      loadInventory();
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar: ' + error.message);
    }
  };

  // --------------------------------------------
  // FUNCIÓN: Rechazar movimiento
  // --------------------------------------------
  const rejectMovement = async (pendingId) => {
    try {
      const pending = pendingApprovals.find(p => p.id === pendingId);
      
      await supabase
        .from('movements')
        .update({ 
          status: 'Rechazado', 
          rejected_by: currentUser.name 
        })
        .eq('tube_id', pending.tube_id)
        .eq('status', 'Pendiente Aprobación');
      
      await supabase
        .from('pending_approvals')
        .delete()
        .eq('id', pendingId);

      alert(`✗ Rechazado: ${pending.tube_id}`);
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  // ============================================
  // FILTROS - Para búsqueda y ubicación
  // ============================================
  const filteredInventory = inventory.filter(tube => {
    const matchSearch = tube.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       tube.serial.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLocation = filterLocation === 'all' || tube.location === filterLocation;
    return matchSearch && matchLocation;
  });

  const filteredBaskets = baskets.filter(basket => {
    const matchSearch = basket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       basket.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchLocation = filterLocation === 'all' || basket.location === filterLocation;
    return matchSearch && matchLocation;
  });

  // ============================================
  // PANTALLA DE LOGIN
  // ============================================
  if (currentView === 'login') {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ background: 'white', borderRadius: '20px', padding: '40px', maxWidth: '450px', width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div style={{ width: '80px', height: '80px', background: 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <Package size={40} color="white" />
            </div>
            <h1 style={{ color: '#1a2332', fontSize: '28px', fontWeight: '700', margin: '0 0 10px 0' }}>Skala Energy</h1>
            <p style={{ color: '#6b7280', fontSize: '16px', margin: 0 }}>Sistema de Gestión de Inventarios</p>
          </div>

          {/* Formulario */}
          <div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="usuario@skala.com"
                style={{ width: '100%', padding: '12px 15px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none' }}
              />
            </div>

            <div style={{ marginBottom: '25px' }}>
              <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '600', marginBottom: '8px' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="Contraseña"
                  style={{ width: '100%', padding: '12px 45px 12px 15px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none' }}
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '4px' }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error de login */}
            {loginError && (
              <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#dc2626', padding: '12px', borderRadius: '8px', marginBottom: '20px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} />
                {loginError}
              </div>
            )}

            {/* Botón de login */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width: '100%', background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3b82f6 0%, #1e3a8a 100%)', color: 'white', border: 'none', borderRadius: '10px', padding: '14px', fontSize: '16px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}
            >
              {loading ? 'Iniciando...' : 'Iniciar Sesión'}
            </button>
          </div>

          {/* Info de usuarios */}
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
  // PANTALLA PRINCIPAL - Dashboard
  // ============================================
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', fontFamily: 'system-ui' }}>
      {/* Header - Barra superior */}
      <div style={{ background: 'linear-gradient(135deg, #1a2332 0%, #2c3e50 100%)', padding: '20px', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <Package size={32} />
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>Skala Energy</h1>
              <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>{currentUser?.name}</p>
            </div>
          </div>
          
          {/* Menú de navegación */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button onClick={() => setCurrentView('dashboard')} style={navBtn}>Dashboard</button>
            <button onClick={() => setCurrentView('baskets')} style={navBtn}>
              <Box size={16} /> Canastillas
            </button>
            {currentUser?.permissions.includes('scan') && (
              <button onClick={() => setCurrentView('scanner')} style={navBtn}>Escáner</button>
            )}
            <button onClick={() => setCurrentView('movements')} style={navBtn}>Movimientos</button>
            <button onClick={handleLogout} style={{ ...navBtn, background: 'rgba(239, 68, 68, 0.2)' }}>Salir</button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '30px 20px' }}>
        
        {/* ============================================ */}
        {/* VISTA: DASHBOARD - Estadísticas */}
        {/* ============================================ */}
        {currentView === 'dashboard' && (
          <>
            {/* Tarjetas de estadísticas */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
              <StatCard icon={<Package size={28} />} title="Total Tubos" value={inventory.length} color="#3b82f6" />
              <StatCard icon={<Box size={28} />} title="Canastillas" value={baskets.length} color="#8b5cf6" />
              <StatCard icon={<TrendingUp size={28} />} title="En Tránsito" value={inventory.filter(i => i.status === 'En tránsito').length} color="#10b981" />
              <StatCard icon={<Clock size={28} />} title="Pendientes" value={pendingApprovals.length} color="#f59e0b" />
            </div>

            {/* Aprobaciones pendientes (solo para Gerente/Admin) */}
            {currentUser.permissions.includes('approve_base_exit') && pendingApprovals.length > 0 && (
              <div style={card}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Clock size={24} color="#f59e0b" />Aprobaciones Pendientes
                </h2>
                {pendingApprovals.map(p => (
                  <div key={p.id} style={{ background: '#fef3c7', padding: '20px', borderRadius: '12px', marginBottom: '15px', border: '2px solid #fbbf24' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: '600', color: '#1a2332' }}>{p.type}</p>
                        <p style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#6b7280' }}>Tubo: {p.tube_id}</p>
                        <p style={{ margin: 0, fontSize: '14px', color: '#6b7280' }}>Por: {p.requested_by} - {p.date}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button onClick={() => approveMovement(p.id)} style={{ ...actionBtn, background: '#10b981' }}>
                          <CheckCircle size={18} /> Aprobar
                        </button>
                        <button onClick={() => rejectMovement(p.id)} style={{ ...actionBtn, background: '#ef4444' }}>
                          <XCircle size={18} /> Rechazar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Barra de búsqueda y filtros */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                <Search size={20} style={{ position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Buscar por ID o serial..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 15px 12px 45px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none' }}
                />
              </div>
              <select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                style={{ padding: '12px 15px', border: '2px solid #e5e7eb', borderRadius: '10px', fontSize: '15px', outline: 'none', cursor: 'pointer' }}
              >
                <option value="all">Todas las ubicaciones</option>
                <option value="Base Villahermosa">Base Villahermosa</option>
                <option value="Barco">Barco</option>
                <option value="Estructura">Estructura</option>
              </select>
            </div>

            {/* Tabla de inventario */}
            <div style={card}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1a2332', marginBottom: '20px' }}>
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
                          <td style={td}>{basket ? basket.name : 'Sin asignar'}</td>
                          <td style={td}>{t.location}</td>
                          <td style={td}>
                            <span style={{
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '600',
                              background: t.status === 'Disponible' ? '#d1fae5' : '#fef3c7',
                              color: t.status === 'Disponible' ? '#065f46' : '#92400e'
                            }}>{t.status}</span>
                          </td>
                          <td style={td}>
                            {currentUser.permissions.includes('manage_baskets') && (
                              <div style={{ display: 'flex', gap: '5px' }}>
                                {t.basket_id ? (
                                  <button 
                                    onClick={() => removeFromBasket(t.id)}
                                    style={{ ...smallBtn, background: '#ef4444' }}
                                    title="Remover de canastilla"
                                  >
                                    <MinusCircle size={14} />
                                  </button>
                                ) : (
                                  <button 
                                    onClick={() => {
                                      setSelectedTube(t);
                                      setCurrentView('assign-basket');
                                    }}
                                    style={{ ...smallBtn, background: '#10b981' }}
                                    title="Asignar a canastilla"
                                  >
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
              </div>
            </div>
          </>
        )}

        {/* ============================================ */}
        {/* VISTA: CANASTILLAS */}
        {/* ============================================ */}
        {currentView === 'baskets' && (
          <div style={card}>
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#1a2332', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Box size={28} />Gestión de Canastillas
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
              {filteredBaskets.map(basket => {
                const tubesInBasket = inventory.filter(t => t.basket_id === basket.id);
                const fillPercentage = (basket.current_count / basket.capacity) * 100;

                return (
                  <div key={basket.id} style={{ 
                    background: 'white', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '16px', 
                    padding: '20px',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
                  onClick={() => scanBasket(basket.id)}
                  >
                    {/* Header de canastilla */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Box size={24} color="#3b82f6" />
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#1a2332' }}>
                          {basket.name}
                        </h3>
                      </div>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: basket.status === 'Disponible' ? '#d1fae5' : '#fef3c7',
                        color: basket.status === 'Disponible' ? '#065f46' : '#92400e'
                      }}>{basket.status}</span>
                    </div>

                    {/* Info de canastilla */}
                    <div style={{ marginBottom: '15px' }}>
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#6b7280' }}>
                        <strong>ID:</strong> {basket.id}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#6b7280' }}>
                        <strong>Ubicación:</strong> {basket.location}
                      </p>
                      <p style={{ margin: '5px 0', fontSize: '14px', color: '#6b7280' }}>
                        <strong>Capacidad:</strong> {basket.current_count} / {basket.capacity} tubos
                      </p>
                    </div>

                    {/* Barra de progreso */}
                    <div style={{ marginBottom: '15px' }}>
                      <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          width: `${fillPercentage}%`,
                          height: '100%',
                          background: fillPercentage > 90 ? '#ef4444' : fillPercentage > 70 ? '#f59e0b' : '#10b981',
                          transition: 'width 0.3s ease'
                        }}></div>
                      </div>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'right' }}>
                        {fillPercentage.toFixed(0)}% llena
                      </p>
                    </div>

                    {/* Lista de tubos */}
                    {tubesInBasket.length > 0 && (
                      <div style={{ marginBottom: '15px' }}>
                        <p style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: '600', color: '#374151' }}>
                          Tubos en esta canastilla:
                        </p>
                        <div style={{ maxHeight: '100px', overflowY: 'auto', fontSize: '12px', color: '#6b7280' }}>
                          {tubesInBasket.map((tube, idx) => (
                            <div key={tube.id} style={{ padding: '4px 0', borderBottom: '1px solid #f3f4f6' }}>
                              {idx + 1}. {tube.id} - {tube.diameter}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Botones de acción */}
                    {currentUser.permissions.includes('manage_baskets') && (
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBasket(basket.id, 'Barco');
                          }}
                          style={{ ...actionBtn, flex: 1, background: '#3b82f6', fontSize: '13px', padding: '8px 12px' }}
                        >
                          <ArrowRight size={14} /> A Barco
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            moveBasket(basket.id, 'Estructura');
                          }}
                          style={{ ...actionBtn, flex: 1, background: '#8b5cf6', fontSize: '13px', padding: '8px
