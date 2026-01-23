'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Insumo {
    id: string;
    created_at: string;
    producto: string;
    descripcion?: string;
    cantidad: number;
    precio: number;
    vendedor: string;
    empleado: string;
    fecha_compra: string;
    categoria?: string;
    metodo_pago?: string;
    notas?: string;
    deleted_at?: string | null;
}

const categorias = [
    'Herramientas',
    'Consumibles',
    'Limpieza',
    'Pintura',
    'Repuestos',
    'Oficina',
    'Otros'
];

const metodosPago = [
    'Efectivo',
    'Transferencia',
    'Tarjeta de Débito',
    'Tarjeta de Crédito',
    'Mercado Pago',
    'Otro'
];

export default function AdminInsumosPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [insumos, setInsumos] = useState<Insumo[]>([]);
    const [loading, setLoading] = useState(false);

    // View mode: 'active' or 'deleted'
    const [viewMode, setViewMode] = useState<'active' | 'deleted'>('active');

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
    const [formData, setFormData] = useState({
        producto: '',
        descripcion: '',
        cantidad: 1,
        precio: '',
        vendedor: '',
        empleado: '',
        fecha_compra: new Date().toISOString().split('T')[0],
        categoria: '',
        metodo_pago: 'Efectivo',
        notas: ''
    });
    const [saving, setSaving] = useState(false);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategoria, setFilterCategoria] = useState('Todos');
    const [filterEmpleado, setFilterEmpleado] = useState('Todos');
    const [filterMonth, setFilterMonth] = useState('');

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchInsumos();
        }
    }, []);

    const fetchInsumos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('insumos')
            .select('*')
            .order('fecha_compra', { ascending: false });

        if (error) {
            console.error('Error fetching insumos:', error);
            alert('Error al cargar insumos');
        } else {
            setInsumos(data || []);
        }
        setLoading(false);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '111355') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'true');
            fetchInsumos();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const handleFormChange = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const resetForm = () => {
        setFormData({
            producto: '',
            descripcion: '',
            cantidad: 1,
            precio: '',
            vendedor: '',
            empleado: '',
            fecha_compra: new Date().toISOString().split('T')[0],
            categoria: '',
            metodo_pago: 'Efectivo',
            notas: ''
        });
        setEditingInsumo(null);
    };

    const openNewModal = () => {
        resetForm();
        setShowModal(true);
    };

    const openEditModal = (insumo: Insumo) => {
        setEditingInsumo(insumo);
        setFormData({
            producto: insumo.producto,
            descripcion: insumo.descripcion || '',
            cantidad: insumo.cantidad,
            precio: insumo.precio.toString(),
            vendedor: insumo.vendedor,
            empleado: insumo.empleado,
            fecha_compra: insumo.fecha_compra,
            categoria: insumo.categoria || '',
            metodo_pago: insumo.metodo_pago || 'Efectivo',
            notas: insumo.notas || ''
        });
        setShowModal(true);
    };

    const handleSave = async () => {
        if (!formData.producto || !formData.precio || !formData.vendedor || !formData.empleado) {
            alert('Por favor complete los campos obligatorios: Producto, Precio, Vendedor y Empleado');
            return;
        }

        setSaving(true);

        const insumoData = {
            producto: formData.producto,
            descripcion: formData.descripcion || undefined,
            cantidad: formData.cantidad,
            precio: parseFloat(formData.precio),
            vendedor: formData.vendedor,
            empleado: formData.empleado,
            fecha_compra: formData.fecha_compra,
            categoria: formData.categoria || undefined,
            metodo_pago: formData.metodo_pago || undefined,
            notas: formData.notas || undefined
        };

        try {
            if (editingInsumo) {
                // Update existing
                const { error } = await supabase
                    .from('insumos')
                    .update(insumoData)
                    .eq('id', editingInsumo.id);

                if (error) throw error;

                setInsumos(prev => prev.map(i =>
                    i.id === editingInsumo.id ? { ...i, ...insumoData } : i
                ));
                alert('Insumo actualizado correctamente');
            } else {
                // Create new
                const { data, error } = await supabase
                    .from('insumos')
                    .insert([insumoData])
                    .select()
                    .single();

                if (error) throw error;

                if (data) {
                    setInsumos(prev => [data, ...prev]);
                }
                alert('Insumo registrado correctamente');
            }

            setShowModal(false);
            resetForm();
        } catch (error) {
            console.error('Error saving insumo:', error);
            alert('Error al guardar el insumo');
        } finally {
            setSaving(false);
        }
    };

    // Soft delete - mover a papelera
    const handleSoftDelete = async (id: string) => {
        if (!confirm('¿Mover este registro a la papelera?')) return;

        const { error } = await supabase
            .from('insumos')
            .update({ deleted_at: new Date().toISOString() })
            .eq('id', id);

        if (error) {
            console.error('Error moving to trash:', error);
            alert('Error al mover a papelera');
        } else {
            setInsumos(prev => prev.map(i =>
                i.id === id ? { ...i, deleted_at: new Date().toISOString() } : i
            ));
            alert('Movido a la papelera');
        }
    };

    // Restaurar desde papelera
    const handleRestore = async (id: string) => {
        if (!confirm('¿Restaurar este registro?')) return;

        const { error } = await supabase
            .from('insumos')
            .update({ deleted_at: null })
            .eq('id', id);

        if (error) {
            console.error('Error restoring:', error);
            alert('Error al restaurar');
        } else {
            setInsumos(prev => prev.map(i =>
                i.id === id ? { ...i, deleted_at: null } : i
            ));
            alert('Registro restaurado');
        }
    };

    // Eliminar permanentemente
    const handlePermanentDelete = async (id: string) => {
        if (!confirm('¿Eliminar PERMANENTEMENTE este registro? Esta acción no se puede deshacer.')) return;

        const { error } = await supabase
            .from('insumos')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting permanently:', error);
            alert('Error al eliminar permanentemente');
        } else {
            setInsumos(prev => prev.filter(i => i.id !== id));
            alert('Eliminado permanentemente');
        }
    };

    // Separate active and deleted insumos
    const activeInsumos = insumos.filter(i => !i.deleted_at);
    const deletedInsumos = insumos.filter(i => i.deleted_at);

    // Get unique employees for filter (only from active)
    const uniqueEmpleados = [...new Set(activeInsumos.map(i => i.empleado))];

    // Filter insumos based on view mode
    const insumosToFilter = viewMode === 'active' ? activeInsumos : deletedInsumos;

    const filteredInsumos = insumosToFilter.filter(insumo => {
        const matchesSearch = searchTerm === '' ||
            insumo.producto.toLowerCase().includes(searchTerm.toLowerCase()) ||
            insumo.vendedor.toLowerCase().includes(searchTerm.toLowerCase()) ||
            insumo.empleado.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategoria = filterCategoria === 'Todos' ||
            insumo.categoria === filterCategoria;

        const matchesEmpleado = filterEmpleado === 'Todos' ||
            insumo.empleado === filterEmpleado;

        const matchesMonth = filterMonth === '' ||
            insumo.fecha_compra.startsWith(filterMonth);

        return matchesSearch && matchesCategoria && matchesEmpleado && matchesMonth;
    });

    // Calculate totals (only from active insumos for summary)
    const totalGastos = activeInsumos.reduce((sum, i) => sum + i.precio, 0);
    const filteredTotal = filteredInsumos.reduce((sum, i) => sum + i.precio, 0);

    if (!isAuthenticated) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#111',
                color: '#fff'
            }}>
                <form onSubmit={handleLogin} style={{
                    padding: '2rem',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    textAlign: 'center',
                    background: '#1a1a1a'
                }}>
                    <h2 style={{ marginBottom: '1.5rem', color: '#D4AF37' }}>Gestión de Insumos</h2>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '10px',
                            marginBottom: '1rem',
                            width: '100%',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff'
                        }}
                    />
                    <button type="submit" style={{
                        width: '100%',
                        padding: '10px 20px',
                        background: '#D4AF37',
                        color: '#111',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                    }}>Ingresar</button>
                </form>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '1rem 2rem' }}>
            <div style={{ maxWidth: '1400px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                        <Link href="/admin" style={{ color: '#888', textDecoration: 'none', fontSize: '0.9rem' }}>
                            ← Volver al Panel
                        </Link>
                        <h1 style={{ color: '#D4AF37', margin: '0.5rem 0 0 0' }}>Gestión de Insumos</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {/* View Mode Toggle */}
                        <div style={{
                            display: 'flex',
                            background: '#222',
                            borderRadius: '5px',
                            overflow: 'hidden',
                            border: '1px solid #333'
                        }}>
                            <button
                                onClick={() => setViewMode('active')}
                                style={{
                                    padding: '10px 20px',
                                    background: viewMode === 'active' ? '#D4AF37' : 'transparent',
                                    color: viewMode === 'active' ? '#111' : '#888',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: viewMode === 'active' ? 'bold' : 'normal',
                                    transition: 'all 0.2s'
                                }}
                            >
                                Activos ({activeInsumos.length})
                            </button>
                            <button
                                onClick={() => setViewMode('deleted')}
                                style={{
                                    padding: '10px 20px',
                                    background: viewMode === 'deleted' ? '#8B0000' : 'transparent',
                                    color: viewMode === 'deleted' ? '#fff' : '#888',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: viewMode === 'deleted' ? 'bold' : 'normal',
                                    transition: 'all 0.2s'
                                }}
                            >
                                🗑️ Papelera ({deletedInsumos.length})
                            </button>
                        </div>
                        {viewMode === 'active' && (
                            <button
                                onClick={openNewModal}
                                style={{
                                    padding: '12px 24px',
                                    background: '#D4AF37',
                                    color: '#111',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}
                            >
                                + Nuevo Insumo
                            </button>
                        )}
                    </div>
                </div>

                {/* Summary Card - Solo para activos */}
                {viewMode === 'active' && (
                    <div style={{
                        background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2a2a 100%)',
                        padding: '1.5rem',
                        borderRadius: '10px',
                        border: '1px solid #333',
                        marginBottom: '2rem',
                        display: 'flex',
                        justifyContent: 'space-around',
                        flexWrap: 'wrap',
                        gap: '1rem'
                    }}>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Total Gastos</div>
                            <div style={{ color: '#D4AF37', fontSize: '2rem', fontWeight: 'bold' }}>
                                ${totalGastos.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Registros</div>
                            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                                {activeInsumos.length}
                            </div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <div style={{ color: '#888', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Promedio</div>
                            <div style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold' }}>
                                ${activeInsumos.length > 0 ? (totalGastos / activeInsumos.length).toLocaleString('es-AR', { minimumFractionDigits: 2 }) : '0.00'}
                            </div>
                        </div>
                    </div>
                )}

                {/* Deleted Warning Banner */}
                {viewMode === 'deleted' && (
                    <div style={{
                        background: 'linear-gradient(135deg, #3a1a1a 0%, #4a2020 100%)',
                        padding: '1rem 1.5rem',
                        borderRadius: '10px',
                        border: '1px solid #8B0000',
                        marginBottom: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '1rem'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🗑️</span>
                        <div>
                            <div style={{ color: '#ff6b6b', fontWeight: 'bold' }}>Papelera de Insumos</div>
                            <div style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                Los registros aquí pueden ser restaurados o eliminados permanentemente.
                            </div>
                        </div>
                    </div>
                )}

                {/* Filters */}
                <div style={{
                    display: 'flex',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                }}>
                    <input
                        type="text"
                        placeholder="Buscar por producto, vendedor o empleado..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            flex: '1',
                            minWidth: '200px',
                            padding: '10px 15px',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff'
                        }}
                    />
                    <select
                        value={filterCategoria}
                        onChange={(e) => setFilterCategoria(e.target.value)}
                        style={{
                            padding: '10px 15px',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="Todos">Todas las categorías</option>
                        {categorias.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                    <select
                        value={filterEmpleado}
                        onChange={(e) => setFilterEmpleado(e.target.value)}
                        style={{
                            padding: '10px 15px',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="Todos">Todos los empleados</option>
                        {uniqueEmpleados.map(emp => (
                            <option key={emp} value={emp}>{emp}</option>
                        ))}
                    </select>
                    <input
                        type="month"
                        value={filterMonth}
                        onChange={(e) => setFilterMonth(e.target.value)}
                        style={{
                            padding: '10px 15px',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff'
                        }}
                    />
                    {filterMonth && (
                        <button
                            onClick={() => setFilterMonth('')}
                            style={{
                                padding: '10px 15px',
                                borderRadius: '5px',
                                border: 'none',
                                background: '#444',
                                color: '#fff',
                                cursor: 'pointer'
                            }}
                        >
                            Limpiar fecha
                        </button>
                    )}
                </div>

                {/* Table */}
                {loading ? (
                    <p style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>Cargando...</p>
                ) : filteredInsumos.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        background: '#1a1a1a',
                        borderRadius: '10px',
                        border: '1px solid #333'
                    }}>
                        <p style={{ color: '#888', fontSize: '1.2rem' }}>
                            {viewMode === 'active'
                                ? 'No hay insumos registrados'
                                : 'No hay insumos en la papelera'
                            }
                        </p>
                        <p style={{ color: '#666', fontSize: '0.9rem' }}>
                            {viewMode === 'active'
                                ? 'Hacé clic en "Nuevo Insumo" para agregar el primero'
                                : 'Los registros eliminados aparecerán aquí'
                            }
                        </p>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            background: '#1a1a1a',
                            borderRadius: '10px',
                            overflow: 'hidden'
                        }}>
                            <thead>
                                <tr style={{ background: '#222', borderBottom: '2px solid #333' }}>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Fecha</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Producto</th>
                                    <th style={{ padding: '15px', textAlign: 'center', color: '#D4AF37' }}>Cant.</th>
                                    <th style={{ padding: '15px', textAlign: 'right', color: '#D4AF37' }}>Precio</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Vendedor</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Empleado</th>
                                    <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Categoría</th>
                                    {viewMode === 'deleted' && (
                                        <th style={{ padding: '15px', textAlign: 'left', color: '#D4AF37' }}>Eliminado</th>
                                    )}
                                    <th style={{ padding: '15px', textAlign: 'center', color: '#D4AF37' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredInsumos.map((insumo, index) => (
                                    <tr
                                        key={insumo.id}
                                        style={{
                                            background: index % 2 === 0 ? '#1a1a1a' : '#202020',
                                            borderBottom: '1px solid #333',
                                            transition: 'background 0.2s',
                                            opacity: viewMode === 'deleted' ? 0.8 : 1
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = '#252525'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? '#1a1a1a' : '#202020'}
                                    >
                                        <td style={{ padding: '12px 15px', color: '#aaa', whiteSpace: 'nowrap' }}>
                                            {new Date(insumo.fecha_compra).toLocaleDateString('es-AR')}
                                        </td>
                                        <td style={{ padding: '12px 15px' }}>
                                            <div style={{ fontWeight: 'bold', color: '#fff' }}>{insumo.producto}</div>
                                            {insumo.descripcion && (
                                                <div style={{ fontSize: '0.85rem', color: '#888', marginTop: '2px' }}>
                                                    {insumo.descripcion.substring(0, 50)}{insumo.descripcion.length > 50 ? '...' : ''}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'center', color: '#fff' }}>
                                            {insumo.cantidad}
                                        </td>
                                        <td style={{ padding: '12px 15px', textAlign: 'right', color: '#D4AF37', fontWeight: 'bold' }}>
                                            ${insumo.precio.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td style={{ padding: '12px 15px', color: '#ccc' }}>{insumo.vendedor}</td>
                                        <td style={{ padding: '12px 15px', color: '#ccc' }}>{insumo.empleado}</td>
                                        <td style={{ padding: '12px 15px' }}>
                                            {insumo.categoria ? (
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '4px 10px',
                                                    background: '#333',
                                                    borderRadius: '20px',
                                                    fontSize: '0.8rem',
                                                    color: '#D4AF37'
                                                }}>
                                                    {insumo.categoria}
                                                </span>
                                            ) : '-'}
                                        </td>
                                        {viewMode === 'deleted' && (
                                            <td style={{ padding: '12px 15px', color: '#ff6b6b', fontSize: '0.85rem' }}>
                                                {insumo.deleted_at ? new Date(insumo.deleted_at).toLocaleDateString('es-AR') : '-'}
                                            </td>
                                        )}
                                        <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                            {viewMode === 'active' ? (
                                                <>
                                                    <button
                                                        onClick={() => openEditModal(insumo)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#333',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            color: '#fff',
                                                            cursor: 'pointer',
                                                            marginRight: '5px'
                                                        }}
                                                    >
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleSoftDelete(insumo.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#8B0000',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            color: '#fff',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        Eliminar
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => handleRestore(insumo.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#2e7d32',
                                                            border: 'none',
                                                            borderRadius: '5px',
                                                            color: '#fff',
                                                            cursor: 'pointer',
                                                            marginRight: '5px'
                                                        }}
                                                    >
                                                        ✓ Restaurar
                                                    </button>
                                                    <button
                                                        onClick={() => handlePermanentDelete(insumo.id)}
                                                        style={{
                                                            padding: '6px 12px',
                                                            background: '#5c0000',
                                                            border: '1px solid #8B0000',
                                                            borderRadius: '5px',
                                                            color: '#ff6b6b',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✕ Eliminar
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '1rem'
                }}>
                    <div style={{
                        background: '#1a1a1a',
                        borderRadius: '10px',
                        padding: '2rem',
                        width: '100%',
                        maxWidth: '600px',
                        maxHeight: '90vh',
                        overflow: 'auto',
                        border: '1px solid #333'
                    }}>
                        <h2 style={{ color: '#D4AF37', marginTop: 0, marginBottom: '1.5rem' }}>
                            {editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
                        </h2>

                        <div style={{ display: 'grid', gap: '1rem' }}>
                            {/* Producto */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Producto *</label>
                                <input
                                    type="text"
                                    value={formData.producto}
                                    onChange={(e) => handleFormChange('producto', e.target.value)}
                                    placeholder="Nombre del producto o insumo"
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #444',
                                        background: '#222',
                                        color: '#fff'
                                    }}
                                />
                            </div>

                            {/* Descripción */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Descripción</label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) => handleFormChange('descripcion', e.target.value)}
                                    placeholder="Descripción detallada (opcional)"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #444',
                                        background: '#222',
                                        color: '#fff',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>

                            {/* Cantidad y Precio */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Cantidad</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.cantidad}
                                        onChange={(e) => handleFormChange('cantidad', parseInt(e.target.value) || 1)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Precio Total *</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.precio}
                                        onChange={(e) => handleFormChange('precio', e.target.value)}
                                        placeholder="0.00"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Vendedor y Empleado */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Vendedor/Proveedor *</label>
                                    <input
                                        type="text"
                                        value={formData.vendedor}
                                        onChange={(e) => handleFormChange('vendedor', e.target.value)}
                                        placeholder="Nombre del vendedor"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Empleado que compró *</label>
                                    <input
                                        type="text"
                                        value={formData.empleado}
                                        onChange={(e) => handleFormChange('empleado', e.target.value)}
                                        placeholder="Nombre del empleado"
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Fecha y Categoría */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Fecha de Compra *</label>
                                    <input
                                        type="date"
                                        value={formData.fecha_compra}
                                        onChange={(e) => handleFormChange('fecha_compra', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff'
                                        }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Categoría</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => handleFormChange('categoria', e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '10px',
                                            borderRadius: '5px',
                                            border: '1px solid #444',
                                            background: '#222',
                                            color: '#fff',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <option value="">Sin categoría</option>
                                        {categorias.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Método de Pago */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Método de Pago</label>
                                <select
                                    value={formData.metodo_pago}
                                    onChange={(e) => handleFormChange('metodo_pago', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #444',
                                        background: '#222',
                                        color: '#fff',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {metodosPago.map(mp => (
                                        <option key={mp} value={mp}>{mp}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Notas */}
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', color: '#aaa' }}>Notas adicionales</label>
                                <textarea
                                    value={formData.notas}
                                    onChange={(e) => handleFormChange('notas', e.target.value)}
                                    placeholder="Observaciones o notas (opcional)"
                                    rows={2}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        borderRadius: '5px',
                                        border: '1px solid #444',
                                        background: '#222',
                                        color: '#fff',
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>

                        {/* Buttons */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                            <button
                                onClick={() => { setShowModal(false); resetForm(); }}
                                style={{
                                    padding: '10px 20px',
                                    background: '#333',
                                    border: 'none',
                                    borderRadius: '5px',
                                    color: '#fff',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                style={{
                                    padding: '10px 20px',
                                    background: saving ? '#555' : '#D4AF37',
                                    color: '#111',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: saving ? 'not-allowed' : 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {saving ? 'Guardando...' : 'Guardar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
