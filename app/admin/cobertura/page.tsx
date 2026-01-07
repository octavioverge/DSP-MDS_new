'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Client {
    name: string;
    phone: string;
    email: string;
    location: string;
}

interface CoberturaRequest {
    id: string;
    created_at: string;
    client_id: string;
    clients: Client; // Joined data
    plan_name: string;

    // Vehicle
    vehicle_make: string;
    vehicle_model: string;
    vehicle_year: number;
    vehicle_plate?: string;
    fuel_type?: string;

    // Insurance
    franchise_amount: number;
    insurance_company?: string;

    // Technical
    is_original_paint: string;
    visible_damage: string;
    photos: string[];

    // Admin
    status: string;
    monthly_fee?: number;
    start_date?: string;
    end_date?: string;
    last_payment_date?: string;
}

export default function AdminCoberturaPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [requests, setRequests] = useState<CoberturaRequest[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal & Selection
    const [selectedRequest, setSelectedRequest] = useState<CoberturaRequest | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState('Todos');

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchRequests();
        }
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('service_cobertura')
            .select(`
                *,
                clients (
                    name,
                    phone,
                    email,
                    location
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching requests:', error);
            alert('Error al cargar solicitudes');
        } else {
            setRequests((data as any) || []);
        }
        setLoading(false);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'true');
            fetchRequests();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: newStatus } : req
        ));

        if (selectedRequest && selectedRequest.id === id) {
            setSelectedRequest({ ...selectedRequest, status: newStatus });
        }

        const { error } = await supabase
            .from('service_cobertura')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Error al actualizar estado');
            fetchRequests();
        }
    };

    const handleAdminUpdate = async (field: keyof CoberturaRequest, value: any) => {
        if (!selectedRequest) return;

        // Update local state deeply
        const updatedReq = { ...selectedRequest, [field]: value };
        setSelectedRequest(updatedReq);
        setRequests(prev => prev.map(r => r.id === selectedRequest.id ? updatedReq : r));

        // Update DB
        // @ts-ignore
        const { error } = await supabase
            .from('service_cobertura')
            .update({ [field]: value })
            .eq('id', selectedRequest.id);

        if (error) console.error('Error saving field', field, error);
    };

    const filteredRequests = requests.filter(req => {
        return statusFilter === 'Todos' || req.status === statusFilter;
    });

    if (!isAuthenticated) {
        return (
            <div className="admin-login-container" style={{
                height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', color: '#fff'
            }}>
                <form onSubmit={handleLogin} style={{
                    padding: '2rem', border: '1px solid #333', borderRadius: '10px', textAlign: 'center', background: '#1a1a1a'
                }}>
                    <h2 style={{ marginBottom: '1.5rem', color: '#D4AF37' }}>Acceso Administrativo: COBERTURA</h2>
                    <input
                        type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '10px', marginBottom: '1rem', width: '100%', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}
                    />
                    <button type="submit" className="btn-gold" style={{ width: '100%' }}>Ingresar</button>
                    <Link href="/admin" style={{ display: 'block', marginTop: '10px', color: '#888', textDecoration: 'none' }}>Volver al Panel General</Link>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-dashboard" style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '2rem' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <div>
                        <Link href="/admin" style={{ color: '#D4AF37', textDecoration: 'none', marginRight: '10px' }}>
                            <i className="fas fa-arrow-left"></i> Volver
                        </Link>
                        <h1 style={{ color: '#D4AF37', borderLeft: '3px solid #D4AF37', paddingLeft: '10px', display: 'inline-block', verticalAlign: 'middle' }}>Gestión de Cobertura</h1>
                    </div>
                    <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('admin_session'); }} style={{ padding: '0.5rem 1rem', background: '#333', border: 'none', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}>
                        Cerrar Sesión
                    </button>
                </header>

                {/* Filters */}
                <div style={{ marginBottom: '20px' }}>
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}>
                        <option value="Todos">Todos los estados</option>
                        <option value="Solicitud">Solicitud</option>
                        <option value="Pre-Calificado">Pre-Calificado</option>
                        <option value="Evaluacion Manual">Evaluación Manual</option>
                        <option value="Activo">Activo</option>
                        <option value="Pendiente Pago">Pendiente Pago</option>
                        <option value="Cancelado">Cancelado</option>
                    </select>
                </div>

                {/* Table */}
                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #D4AF37', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Cliente</th>
                                <th style={{ padding: '1rem' }}>Plan / Vehículo</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                                <th style={{ padding: '1rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                            ) : filteredRequests.map(req => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{req.clients?.name || '---'}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#888' }}>{req.clients?.location}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: '#D4AF37' }}>{req.plan_name}</div>
                                        <div>{req.vehicle_make} {req.vehicle_model} ({req.vehicle_year})</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px',
                                            backgroundColor: req.status === 'Activo' ? 'green' : (req.status === 'Solicitud' ? '#333' : '#d4af3733'),
                                            color: '#fff',
                                            fontSize: '0.8em'
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button onClick={() => setSelectedRequest(req)} className="btn-gold" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Detail Modal */}
            {selectedRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
                }} onClick={() => setSelectedRequest(null)}>
                    <div style={{
                        backgroundColor: '#1a1a1a', width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: '10px', border: '1px solid #333', padding: '20px', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>

                        <button onClick={() => setSelectedRequest(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>

                        <h2 style={{ color: '#D4AF37', marginBottom: '20px' }}>Solicitud: {selectedRequest.plan_name}</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                            {/* Left Column: Info */}
                            <div>
                                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', color: '#eee' }}>Cliente y Vehículo</h3>
                                <div style={{ marginBottom: '10px' }}><strong>Nombre:</strong> {selectedRequest.clients?.name}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Email:</strong> {selectedRequest.clients?.email}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Teléfono:</strong> <a href={`https://wa.me/${selectedRequest.clients?.phone?.replace(/[^0-9]/g, '')}`} target="_blank" style={{ color: '#90EE90' }}>{selectedRequest.clients?.phone} <i className="fab fa-whatsapp"></i></a></div>
                                <div style={{ marginBottom: '10px' }}><strong>Vehículo:</strong> {selectedRequest.vehicle_make} {selectedRequest.vehicle_model} {selectedRequest.vehicle_year}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Pintura Original:</strong> {selectedRequest.is_original_paint}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Daños Visibles:</strong> {selectedRequest.visible_damage}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Franquicia Seguro:</strong> ${selectedRequest.franchise_amount}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Seguro:</strong> {selectedRequest.insurance_company || 'No especificado'}</div>

                                {selectedRequest.photos && selectedRequest.photos.length > 0 && (
                                    <div style={{ marginTop: '20px' }}>
                                        <strong>Fotos Adjuntas:</strong>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                            {selectedRequest.photos.map((url, idx) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                                    <img src={url} alt="Daño" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #444' }} />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Right Column: Management */}
                            <div style={{ background: '#222', padding: '20px', borderRadius: '10px', height: 'fit-content' }}>
                                <h3 style={{ color: '#D4AF37', marginBottom: '20px' }}>Administración</h3>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px', color: '#aaa', fontSize: '0.9rem' }}>Estado de la Solicitud</label>
                                    <select
                                        value={selectedRequest.status}
                                        onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #D4AF37', color: '#fff', borderRadius: '5px' }}
                                    >
                                        <option value="Solicitud">Solicitud Recibida</option>
                                        <option value="Pre-Calificado">Pre-Calificado (OK para inspección)</option>
                                        <option value="Evaluacion Manual">Evaluación Manual (Revisar datos)</option>
                                        <option value="Activo">Activo (Plan Vigente)</option>
                                        <option value="Pendiente Pago">Pendiente de Pago</option>
                                        <option value="Cancelado">Cancelado / Rechazado</option>
                                    </select>
                                </div>

                                {selectedRequest.status === 'Activo' && (
                                    <>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Valor Mensual ($)</label>
                                            <input
                                                type="number"
                                                value={selectedRequest.monthly_fee || ''}
                                                onChange={(e) => handleAdminUpdate('monthly_fee', parseFloat(e.target.value))}
                                                placeholder="Ej: 80000"
                                                style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Inicio de Vigencia</label>
                                            <input
                                                type="date"
                                                value={selectedRequest.start_date || ''}
                                                onChange={(e) => handleAdminUpdate('start_date', e.target.value)}
                                                style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }}
                                            />
                                        </div>
                                        <div style={{ marginBottom: '15px' }}>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem' }}>Fin de Vigencia</label>
                                            <input
                                                type="date"
                                                value={selectedRequest.end_date || ''}
                                                onChange={(e) => handleAdminUpdate('end_date', e.target.value)}
                                                style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }}
                                            />
                                        </div>
                                    </>
                                )}

                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
