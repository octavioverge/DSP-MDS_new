'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const router = useRouter();

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded password for demo
        if (password === '111355') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'true');
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const handleLogout = () => {
        setIsAuthenticated(false);
        localStorage.removeItem('admin_session');
    };

    if (!isAuthenticated) {
        return (
            <div className="admin-login-container" style={{
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
                    <h2 style={{ marginBottom: '1.5rem', color: '#D4AF37' }}>DSP-MDS ADMIN</h2>
                    <input
                        type="password"
                        placeholder="Contraseña Maestra"
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
                    <button type="submit" className="btn-gold" style={{ width: '100%' }}>Ingresar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-dashboard-main" style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '2rem' }}>
            <div className="container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <h1 style={{ color: '#D4AF37', margin: 0 }}>Panel General</h1>
                    <button onClick={handleLogout} style={{ padding: '0.5rem 1rem', background: '#333', border: 'none', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}>
                        Cerrar Sesión
                    </button>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>

                    {/* Card 1: Puntual */}
                    <Link href="/admin/puntual" style={{ textDecoration: 'none' }}>
                        <div className="dashboard-card" style={{
                            background: '#1a1a1a',
                            padding: '30px',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, border-color 0.2s'
                        }}>
                            <div style={{ color: '#D4AF37', fontSize: '2rem', marginBottom: '15px' }}>
                                <i className="fas fa-hammer"></i>
                            </div>
                            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px' }}>Trabajos Puntuales</h2>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                Gestión de solicitudes de presupuesto por abolladuras, fotos de daños, presupuestos PDF y seguimiento de reparaciones esporádicas.
                            </p>
                        </div>
                    </Link>

                    {/* Card 2: Cursos */}
                    <Link href="/admin/cursos" style={{ textDecoration: 'none' }}>
                        <div className="dashboard-card" style={{
                            background: '#1a1a1a',
                            padding: '30px',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, border-color 0.2s'
                        }}>
                            <div style={{ color: '#D4AF37', fontSize: '2rem', marginBottom: '15px' }}>
                                <i className="fas fa-chalkboard-teacher"></i>
                            </div>
                            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px' }}>Cursos y Capacitación</h2>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                Administración de alumnos, inscripciones a cursos iniciales/avanzados, pagos y fechas de cursada.
                            </p>
                        </div>
                    </Link>

                    {/* Card 3: Cobertura */}
                    <Link href="/admin/cobertura" style={{ textDecoration: 'none' }}>
                        <div className="dashboard-card" style={{
                            background: '#1a1a1a',
                            padding: '30px',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            cursor: 'pointer',
                            transition: 'transform 0.2s, border-color 0.2s'
                        }}>
                            <div style={{ color: '#D4AF37', fontSize: '2rem', marginBottom: '15px' }}>
                                <i className="fas fa-file-contract"></i>
                            </div>
                            <h2 style={{ color: '#fff', fontSize: '1.5rem', marginBottom: '10px' }}>Cobertura Mensual</h2>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>
                                Gestión de suscripciones mensuales, flotas de vehículos, vencimientos y planes de cobertura.
                            </p>
                        </div>
                    </Link>

                </div>
            </div>
            <style jsx>{`
                .dashboard-card:hover {
                    transform: translateY(-5px);
                    border-color: #D4AF37 !important;
                }
            `}</style>
        </div>
    );
}
