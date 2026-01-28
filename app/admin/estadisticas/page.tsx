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

type PeriodType = 'dia' | 'semana' | 'mes' | 'anual';

export default function EstadisticasPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [repairedRequests, setRepairedRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(false);

    // Período de filtro
    const [periodType, setPeriodType] = useState<PeriodType>('mes');
    const [selectedDate, setSelectedDate] = useState(() => {
        const now = new Date();
        return now.toISOString().split('T')[0]; // YYYY-MM-DD
    });

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchRepairedRequests();
        }
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
            .in('status', ['Reparado', 'Reparado (factura)'])
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

    // Calcular rango de fechas según el período seleccionado
    const getDateRange = () => {
        const date = new Date(selectedDate + 'T12:00:00'); // Evitar problemas de timezone
        let startDate: Date;
        let endDate: Date;
        let label: string;

        switch (periodType) {
            case 'dia':
                startDate = new Date(date);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(date);
                endDate.setHours(23, 59, 59, 999);
                label = date.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                break;
            case 'semana':
                const dayOfWeek = date.getDay();
                const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
                startDate = new Date(date);
                startDate.setDate(date.getDate() - diffToMonday);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                endDate.setHours(23, 59, 59, 999);
                const formatShort = (d: Date) => d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });
                label = `Semana del ${formatShort(startDate)} al ${formatShort(endDate)}`;
                break;
            case 'mes':
                startDate = new Date(date.getFullYear(), date.getMonth(), 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                endDate.setHours(23, 59, 59, 999);
                label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
                break;
            case 'anual':
                startDate = new Date(date.getFullYear(), 0, 1);
                startDate.setHours(0, 0, 0, 0);
                endDate = new Date(date.getFullYear(), 11, 31);
                endDate.setHours(23, 59, 59, 999);
                label = `Año ${date.getFullYear()}`;
                break;
            default:
                startDate = new Date();
                endDate = new Date();
                label = '';
        }

        return { startDate, endDate, label };
    };

    const { startDate, endDate, label: periodLabel } = getDateRange();

    // Filter Logic basado en el período
    const filteredRequests = repairedRequests.filter(req => {
        const reqDate = new Date(req.created_at);
        return reqDate >= startDate && reqDate <= endDate;
    });

    // Navegación de período
    const navigatePeriod = (direction: 'prev' | 'next') => {
        const date = new Date(selectedDate + 'T12:00:00');

        switch (periodType) {
            case 'dia':
                date.setDate(date.getDate() + (direction === 'next' ? 1 : -1));
                break;
            case 'semana':
                date.setDate(date.getDate() + (direction === 'next' ? 7 : -7));
                break;
            case 'mes':
                date.setMonth(date.getMonth() + (direction === 'next' ? 1 : -1));
                break;
            case 'anual':
                date.setFullYear(date.getFullYear() + (direction === 'next' ? 1 : -1));
                break;
        }

        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const goToToday = () => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
    };

    // Calculations - TOTALES
    const totalRevenue = filteredRequests.reduce((sum, req) => sum + (req.final_price || 0), 0);
    const averageTicket = filteredRequests.length > 0 ? totalRevenue / filteredRequests.length : 0;

    // Calculations - Solo REPARADO (sin factura)
    const reparadoNormal = filteredRequests.filter(req => req.status === 'Reparado');
    const reparadoNormalRevenue = reparadoNormal.reduce((sum, req) => sum + (req.final_price || 0), 0);
    const reparadoNormalAvgTicket = reparadoNormal.length > 0 ? reparadoNormalRevenue / reparadoNormal.length : 0;

    // Calculations - Solo REPARADO (FACTURA)
    const reparadoFactura = filteredRequests.filter(req => req.status === 'Reparado (factura)');
    const reparadoFacturaRevenue = reparadoFactura.reduce((sum, req) => sum + (req.final_price || 0), 0);
    const reparadoFacturaAvgTicket = reparadoFactura.length > 0 ? reparadoFacturaRevenue / reparadoFactura.length : 0;

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
                            ← Volver a Inicio
                        </Link>
                        <button onClick={() => { localStorage.removeItem('admin_session'); setIsAuthenticated(false); }} style={{ background: 'none', border: '1px solid #ff4444', color: '#ff4444', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>
                            Cerrar Sesión
                        </button>
                    </div>
                </header>

                {/* SELECTOR DE PERÍODO */}
                <div style={{
                    background: 'linear-gradient(135deg, #1a1a1a 0%, #252525 100%)',
                    padding: '20px',
                    borderRadius: '10px',
                    border: '1px solid #D4AF37',
                    marginBottom: '20px'
                }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center', justifyContent: 'space-between' }}>
                        {/* Tipo de período */}
                        <div style={{ display: 'flex', gap: '5px', background: '#111', padding: '5px', borderRadius: '8px' }}>
                            {(['dia', 'semana', 'mes', 'anual'] as PeriodType[]).map(type => (
                                <button
                                    key={type}
                                    onClick={() => setPeriodType(type)}
                                    style={{
                                        padding: '10px 20px',
                                        background: periodType === type ? '#D4AF37' : 'transparent',
                                        color: periodType === type ? '#000' : '#888',
                                        border: 'none',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        fontWeight: periodType === type ? 'bold' : 'normal',
                                        transition: 'all 0.2s',
                                        textTransform: 'capitalize'
                                    }}
                                >
                                    {type === 'dia' ? 'Día' : type === 'anual' ? 'Año' : type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Navegación y selector de fecha */}
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <button
                                onClick={() => navigatePeriod('prev')}
                                style={{
                                    padding: '10px 15px',
                                    background: '#333',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                ←
                            </button>

                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                style={{
                                    background: '#333',
                                    border: '1px solid #555',
                                    color: '#fff',
                                    padding: '10px 15px',
                                    borderRadius: '5px',
                                    fontSize: '1rem'
                                }}
                            />

                            <button
                                onClick={() => navigatePeriod('next')}
                                style={{
                                    padding: '10px 15px',
                                    background: '#333',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontSize: '1.2rem'
                                }}
                            >
                                →
                            </button>

                            <button
                                onClick={goToToday}
                                style={{
                                    padding: '10px 15px',
                                    background: '#D4AF37',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '5px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                Hoy
                            </button>
                        </div>
                    </div>

                    {/* Label del período */}
                    <div style={{ marginTop: '15px', textAlign: 'center' }}>
                        <span style={{ color: '#D4AF37', fontSize: '1.3rem', fontWeight: 'bold', textTransform: 'capitalize' }}>
                            {periodLabel}
                        </span>
                    </div>
                </div>

                {/* TOTALES GENERALES */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #28a745', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Ingresos Totales</span>
                        <span style={{ color: '#28a745', fontSize: '2.5rem', fontWeight: 'bold' }}>${totalRevenue.toLocaleString()}</span>
                    </div>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Total Autos Reparados</span>
                        <span style={{ color: '#D4AF37', fontSize: '2.5rem', fontWeight: 'bold' }}>{filteredRequests.length}</span>
                    </div>
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                        <span style={{ color: '#888', fontSize: '0.9rem' }}>Ticket Promedio</span>
                        <span style={{ color: '#aaa', fontSize: '2.5rem', fontWeight: 'bold' }}>${Math.round(averageTicket).toLocaleString()}</span>
                    </div>
                </div>

                {/* DISCRIMINACIÓN POR TIPO */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '40px' }}>
                    {/* Reparado (sin factura) */}
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #28a745' }}>
                        <h3 style={{ color: '#28a745', marginTop: 0, marginBottom: '15px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#28a74533', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Reparado</span>
                            Sin Factura
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            <div>
                                <span style={{ color: '#888', fontSize: '0.8rem', display: 'block' }}>Ingresos</span>
                                <span style={{ color: '#28a745', fontSize: '1.5rem', fontWeight: 'bold' }}>${reparadoNormalRevenue.toLocaleString()}</span>
                            </div>
                            <div>
                                <span style={{ color: '#888', fontSize: '0.8rem', display: 'block' }}>Autos</span>
                                <span style={{ color: '#28a745', fontSize: '1.5rem', fontWeight: 'bold' }}>{reparadoNormal.length}</span>
                            </div>
                            <div>
                                <span style={{ color: '#888', fontSize: '0.8rem', display: 'block' }}>Ticket Prom.</span>
                                <span style={{ color: '#28a745', fontSize: '1.5rem', fontWeight: 'bold' }}>${Math.round(reparadoNormalAvgTicket).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    {/* Reparado (con factura) */}
                    <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #17a2b8' }}>
                        <h3 style={{ color: '#17a2b8', marginTop: 0, marginBottom: '15px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ background: '#17a2b833', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem' }}>Reparado</span>
                            Con Factura
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                            <div>
                                <span style={{ color: '#888', fontSize: '0.8rem', display: 'block' }}>Ingresos</span>
                                <span style={{ color: '#17a2b8', fontSize: '1.5rem', fontWeight: 'bold' }}>${reparadoFacturaRevenue.toLocaleString()}</span>
                            </div>
                            <div>
                                <span style={{ color: '#888', fontSize: '0.8rem', display: 'block' }}>Autos</span>
                                <span style={{ color: '#17a2b8', fontSize: '1.5rem', fontWeight: 'bold' }}>{reparadoFactura.length}</span>
                            </div>
                            <div>
                                <span style={{ color: '#888', fontSize: '0.8rem', display: 'block' }}>Ticket Prom.</span>
                                <span style={{ color: '#17a2b8', fontSize: '1.5rem', fontWeight: 'bold' }}>${Math.round(reparadoFacturaAvgTicket).toLocaleString()}</span>
                            </div>
                        </div>
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
                                <th style={{ padding: '1rem', textAlign: 'center' }}>Tipo</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Presupuestado</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Con Descuento</th>
                                <th style={{ padding: '1rem', textAlign: 'right' }}>Cobrado Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>Cargando datos...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>No hay registros en este período.</td></tr>
                            ) : (
                                filteredRequests.map(req => (
                                    <tr key={req.id} style={{ borderBottom: '1px solid #333' }}>
                                        <td style={{ padding: '1rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                        <td style={{ padding: '1rem' }}>{req.clients?.name || 'Desconocido'}</td>
                                        <td style={{ padding: '1rem' }}>{req.make_model} ({req.year})</td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                backgroundColor: req.status === 'Reparado (factura)' ? '#17a2b833' : '#28a74533',
                                                color: req.status === 'Reparado (factura)' ? '#17a2b8' : '#28a745'
                                            }}>
                                                {req.status === 'Reparado (factura)' ? 'FACTURA' : 'SIN FACT.'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#ccc' }}>
                                            ${(req.budget_value || 0).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: '#ccc' }}>
                                            {req.discounted_value ? `$${req.discounted_value.toLocaleString()}` : '-'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'right', color: req.status === 'Reparado (factura)' ? '#17a2b8' : '#28a745', fontWeight: 'bold' }}>
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
