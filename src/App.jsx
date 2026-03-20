import React, { useState, useEffect } from 'react';
import { Camera, Package, TrendingUp, CheckCircle, XCircle, Clock, QrCode, FileText, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { createClient } from '@supabase/supabase-js';
import { firebaseConfig, supabaseConfig } from './config';

// Inicializar Firebase y Supabase
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
    'almacenista.eta18@gmail.com': { role: 'almacenista', name: 'Luciano', permissions: ['create_exit', 'scan', 'view_inventory'] },
    'gerente@skala.com': { role: 'gerente', name: 'Gerente de Operaciones', permissions: ['approve_base_exit', 'view_reports'] },
    'lugracial.eta18@gmail.com.com': { role: 'representante', name: 'Representante a Bordo', permissions: ['approve_ship_entry', 'create_ship_exit', 'scan'] },
    'supervisor@skala.com': { role: 'supervisor', name: 'Supervisor', permissions: ['scan', 'install_tubes'] }
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
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error cargando inventario:', error);
      alert('Error al cargar inventario. Revisa la consola.');
    }
  };

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

  const handleLogin = async () => {
    setLoginError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      const userData = ROLES[email.toLowerCase()];
      if (!userData) {
        await signOut(auth);
        throw new Error('Usuario no autorizado');
      }
      
      setCurrentUser({ uid: user.uid, email: user.email, ...userData });
      setCurrentView('dashboard');
      setEmail('');
      setPassword('');
    } catch (error) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setLoginError('Email o contraseña incorrectos');
      } else if (error.code === 'auth/user-not-found') {
        setLoginError('Usuario no encontrado');
      } else {
        setLoginError(error.message || 'Error al iniciar sesión');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentUser(null);
    setCurrentView('login');
    setEmail('');
    setPassword('');
  };

  const handleScan = (tubeId) => {
    const tube = inventory.find(t => t.id === tubeId);
    if (tube) {
      setSelectedTube(tube);
      setScannerActive(false);
      alert(`✓ Tubo escaneado:\n\nID: ${tube.id}\nDiámetro: ${tube.diameter}\nSerial: ${tube.serial}`);
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
    if (!selectedTube) {
      alert('Escanea un tubo primero');
      return;
    }

    try {
      const newMovement = {
        id: `MOV-${Date.now()}`,
        tube_id: selectedTube.id,
        type: 'Salida Base',
        from_location: 'Base',
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
        type: 'Salida Base → Barco',
        requested_by: currentUser.name,
        date: new Date().toISOString().split('T')[0],
        tubes: 1
      };

      const { error: pendError } = await supabase
        .from('pending_approvals')
        .insert([newPending]);
      
      if (pendError) throw pendError;

      alert('✓ Solicitud creada. Esperando aprobación del Gerente.');
      setSelectedTube(null);
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al crear solicitud');
    }
  };

  const approveMovement = async (pendingId) => {
    try {
      const pending = pendingApprovals.find(p => p.id === pendingId);
      
      await supabase
        .from('movements')
        .update({ status: 'Aprobado', approved_by: currentUser.name })
        .eq('tube_id', pending.tube_id)
        .eq('status', 'Pendiente Aprobación');
      
      await supabase
        .from('inventory')
        .update({ location: 'Barco', status: 'En tránsito' })
        .eq('id', pending.tube_id);
      
      await supabase
        .from('pending_approvals')
        .delete()
        .eq('id', pendingId);

      alert(`✓ Aprobado\nTubo: ${pending.tube_id}`);
      loadInventory();
      loadMovements();
      loadPendingApprovals();
    } catch (error) {
      console.error('Error:', error);
      alert('Error al aprobar');
    }
  };

  const rejectMovement = async (pendingId) => {
    try {
      const pending = pendingApproval
