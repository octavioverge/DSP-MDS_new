'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

interface DemoRequest {
    id: string;
    created_at: string;
    client_name: string;
    client_phone: string;
    client_email: string;
    vehicle_make: string;
    vehicle_year: string;
    vehicle_color: string;
    damage_location: string;
    damage_origin: string;
    paint_status: string;
    damage_count: string;
    description: string;
    availability: string;
    photos: string[];
    status: string;
}

export default function AdminDemosPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [demos, setDemos] = useState<DemoRequest[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchDemos();
        }
    }, []);

    const fetchDemos = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('service_demos')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching demos:', error);
        } else {
            setDemos(data || []);
        }
        setLoading(false);
    };

    const updateStatus = async (id: string, newStatus: string) => {
        const { error } = await supabase
            .from('service_demos')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            alert('Error actualizando estado');
        } else {
            // Update local state
            setDemos(demos.map(d => d.id === id ? { ...d, status: newStatus } : d));
        }
    };

    if (!isAuthenticated) {
        return <div style={{ color: '#fff', padding: '2rem', textAlign: 'center' }}>Acceso denegado. <Link href="/admin" className="text-gold">Volver al login</Link></div>;
    }

    return (
        <div style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '2rem' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>

                {/* Header */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <Link href="/admin" style={{ color: '#aaa', fontSize: '1.2rem' }}>
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 style={{ color: '#D4AF37', margin: 0 }}>Solicitudes de Demostración</h1>
                    </div>
                </header>

                {/* List */}
                {loading ? (
                    <p>Cargando solicitues...</p>
                ) : demos.length === 0 ? (
                    <p>No hay solicitudes pendientes.</p>
                ) : (
                    <div style={{ display: 'grid', gap: '20px' }}>
                        {demos.map((request) => (
                            <div key={request.id} style={{
                                background: '#1a1a1a',
                                border: '1px solid #333',
                                borderRadius: '10px',
                                padding: '20px',
                                position: 'relative'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    borderBottom: '1px solid #333',
                                    paddingBottom: '15px',
                                    marginBottom: '15px',
                                    flexWrap: 'wrap',
                                    gap: '10px'
                                }}>
                                    <div>
                                        <h3 style={{ color: '#fff', marginBottom: '5px' }}>{request.client_name}</h3>
                                        <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                            {new Date(request.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <span style={{
                                            padding: '5px 10px',
                                            borderRadius: '5px',
                                            background: getStatusColor(request.status),
                                            color: '#000',
                                            fontWeight: 'bold',
                                            fontSize: '0.8rem',
                                            textTransform: 'uppercase'
                                        }}>
                                            {request.status}
                                        </span>
                                        <select
                                            value={request.status}
                                            onChange={(e) => updateStatus(request.id, e.target.value)}
                                            style={{
                                                background: '#333',
                                                color: '#fff',
                                                border: '1px solid #555',
                                                padding: '5px',
                                                borderRadius: '3px'
                                            }}
                                        >
                                            <option value="pending">Pendiente</option>
                                            <option value="contacted">Contactado</option>
                                            <option value="scheduled">Agendado</option>
                                            <option value="rejected">Rechazado</option>
                                            <option value="completed">Completado</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px' }}>

                                    {/* Contact Info */}
                                    <div>
                                        <h4 style={{ color: '#D4AF37', marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Contacto</h4>
                                        <p><i className="fas fa-phone" style={{ width: '20px', color: '#666' }}></i> <a href={`tel:${request.client_phone}`} style={{ color: '#fff', textDecoration: 'underline' }}>{request.client_phone}</a></p>
                                        <p><i className="fas fa-envelope" style={{ width: '20px', color: '#666' }}></i> {request.client_email || 'No email'}</p>
                                        <p><i className="fas fa-calendar" style={{ width: '20px', color: '#666' }}></i> {request.availability || 'Sin pref.'}</p>
                                    </div>

                                    {/* Vehicle Info */}
                                    <div>
                                        <h4 style={{ color: '#D4AF37', marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Vehículo</h4>
                                        <p><strong>Auto:</strong> {request.vehicle_make} {request.vehicle_year}</p>
                                        <p><strong>Color:</strong> {request.vehicle_color || '-'}</p>
                                        <p><strong>Pintura Original:</strong> {request.paint_status}</p>
                                    </div>

                                    {/* Damage Info */}
                                    <div>
                                        <h4 style={{ color: '#D4AF37', marginBottom: '10px', fontSize: '0.9rem', textTransform: 'uppercase' }}>Daño</h4>
                                        <p><strong>Origen:</strong> {request.damage_origin}</p>
                                        <p><strong>Ubicación:</strong> {request.damage_location}</p>
                                        <p><strong>Cant. Aprox:</strong> {request.damage_count}</p>
                                        <p style={{ marginTop: '5px', fontStyle: 'italic', color: '#bbb' }}>"{request.description}"</p>
                                    </div>

                                </div>

                                {/* Photos */}
                                {request.photos && request.photos.length > 0 && (
                                    <div style={{ marginTop: '20px', borderTop: '1px solid #333', paddingTop: '15px' }}>
                                        <h4 style={{ color: '#aaa', marginBottom: '10px', fontSize: '0.9rem' }}>FOTOS ADJUNTAS</h4>
                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                            {request.photos.map((url, idx) => (
                                                <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                                                    <img src={url} alt="Daño" style={{
                                                        width: '100px',
                                                        height: '100px',
                                                        objectFit: 'cover',
                                                        borderRadius: '5px',
                                                        border: '1px solid #444'
                                                    }} />
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function getStatusColor(status: string) {
    switch (status) {
        case 'pending': return '#ffcc00'; // Yellow
        case 'contacted': return '#00ccff'; // Blue
        case 'scheduled': return '#cc99ff'; // Purple
        case 'rejected': return '#ff6666'; // Red
        case 'completed': return '#66ff99'; // Green
        default: return '#ccc';
    }
}
