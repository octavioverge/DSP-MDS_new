'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

interface Request {
    id: string;
    created_at: string;
    make_model: string;
    year: string;
    final_price: number;
    budget_value: number;
    discounted_value: number;
    clients: {
        name: string;
    };
    status: string;
}

export default function EstadisticasPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [repairedRequests, setRepairedRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(false);
    const [monthFilter, setMonthFilter] = useState('');

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchRepairedRequests();
        }

        // Set default month filter to current month YYYY-MM
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        setMonthFilter(`${yyyy}-${mm}`);

    }, []);

    const fetchRepairedRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('service_puntual')
            .select(`
                id,
                created_at,
                make_model,
                year,
                final_price,
                budget_value,
                discounted_value,
                status,
                clients (
                    name
                )
            `)
            .eq('status', 'Reparado')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching repaired requests:', error);
        } else {
            setRepairedRequests((data as any) || []);
        }
        setLoading(false);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === '111355') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'true');
            fetchRepairedRequests();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    // Filter Logic
    const filteredRequests = repairedRequests.filter(req => {
        if (!monthFilter) return true;
        const date = new Date(req.created_at);
        const reqMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        return reqMonth === monthFilter;
    });

    // Calculations
    const totalRevenue = filteredRequests.reduce((sum, req) => sum + (req.final_price || 0), 0);
    const totalPotential = filteredRequests.reduce((sum, req) => sum + (req.budget_value || 0), 0);
    const totalDiscounts = filteredRequests.reduce((sum, req) => {
        // If discount value is present, difference between budget and discount is the discount amount
        // Or if user just enters the final discounted value directly. 
        // Assuming discounted_value is the PRICE AFTER DISCOUNT.
        // So discount_amount = budget_value - discounted_value (if discounted_value > 0)
        // If discounted_value is 0, assumes no discount or full price.
        if (req.budget_value && req.discounted_value) {
            return sum + (req.budget_value - req.discounted_value);
        }
        return sum;
    }, 0);

    const averageTicket = filteredRequests.length > 0 ? totalRevenue / filteredRequests.length : 0;

    if (!isAuthenticated) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                backgroundColor: '#000', color: '#D4AF37', display: 'flex', flexDirection: 'column',
                justifyContent: 'center', alignItems: 'center', zIndex: 9999
            }}>
                <h2 style={{ marginBottom: '20px' }}>Acceso Restringido - Estadísticas</h2>
                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '10px', borderRadius: '5px', border: '1px solid #D4AF37', background: '#222', color: '#fff' }}
                    />
                    <button type="submit" className="btn-gold" style={{ padding: '10px 20px' }}>Ingresar</button>
                </form>
                <div style={{ marginTop: '20px' }}>
                    <Link href="/admin" style={{ color: '#888', textDecoration: 'underline' }}>Volver a Admin</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#000', minHeight: '100vh', color: '#fff', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', borderBottom: '1px solid #333', paddingBottom: '20px' }}>
                    <h1 style={{ color: '#D4AF37', margin: 0 }}>Estadísticas y Reportes</h1>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <Link href="/admin" className="btn-gold" style={{ textDecoration: 'none', padding: '10px 20px', fontSize: '0.9rem' }}>
                            <i className="fas fa-arrow-left"></i> Volver a Inicio
                        </Link>
                        <button onClick={() => { localStorage.removeItem('admin_session'); setIsAuthenticated(false); }} style={{ background: 'none', border: '1px solid #ff4444', color: '#ff4444', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                            Cerrar Sesión
                        </button>
                    </div>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333' }}>
                        <label style={{ display: 'block', color: '#888', marginBottom: '10px', fontSize: '0.9rem' }}>Filtrar por Mes</label>
                        <input
                            type="month"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            style={{ background: '#333', border: '1px solid #555', color: '#fff', padding: '10px', borderRadius: '5px', width: '100%' }}
                        />
                    </div>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #D4AF37', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Ingresos Reales</span>
                        <span style={{ color: '#28a745', fontSize: '2.5rem', fontWeight: 'bold' }}>${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Autos Reparados</span>
                        <span style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: 'bold' }}>{filteredRequests.length}</span>
                    </div>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Ticket Promedio</span>
                        <span style={{ color: '#aaa', fontSize: '2.5rem', fontWeight: 'bold' }}>${Math.round(averageTicket).toLocaleString()}</span>
                    </div>
                </div>

                <div className="table-responsive" style={{ overflowX: 'auto', background: '#1a1a1a', borderRadius: '10px', padding: '20px', border: '1px solid #333' }}>
                    <h3 style={{ color: '#D4AF37', marginBottom: '20px' }}>Detalle de Operaciones (Reparados)</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #D4AF37', textAlign: 'left', color: '#ccc' }}>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Cliente</th>
                                <th style={{ padding: '1rem' }}>Vehículo</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Presupuestado</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Con Descuento</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Cobrado Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No hay registros en este período.</td></tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr key={req.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>{req.clients?.name || 'Desconocido'}</td>
                                        <td style={{ padding: '1rem' }}>{req.make_model} ({req.year})</td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#ccc' }}>
                                            ${(req.budget_value || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#ccc' }}>
                                            {req.discounted_value ? `$${req.discounted_value.toLocaleString()}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#28a745', fontWeight: 'bold' }}>
                                            ${(req.final_price || 0).toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
