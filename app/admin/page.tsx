'use client';

import { useState } from 'react';

// Mock data to simulate storage since we don't have a backend yet
const MOCK_REQUESTS = [
    {
        id: '1',
        date: '2023-11-20',
        name: 'Juan Perez',
        phone: '221 555 1234',
        email: 'juan@example.com',
        makeModel: 'Volkswagen Gol',
        year: '2019',
        damageType: 'DAÑO POR GRANIZO',
        damageLocation: ['TECHO', 'CAPOT'],
        status: 'Pendiente',
        location: 'La Plata',
        licensePlate: 'AD 123 CD'
    },
    {
        id: '2',
        date: '2023-11-21',
        name: 'Maria Garcia',
        phone: '11 4444 8888',
        email: 'maria@test.com',
        makeModel: 'Toyota Corolla',
        year: '2021',
        damageType: 'GOLPE DE ESTACIONAMIENTO',
        damageLocation: ['PUERTA DELANTERA'],
        status: 'Contactado',
        location: 'CABA',
        licensePlate: 'AE 444 GG'
    },
    {
        id: '3',
        date: '2023-11-22',
        name: 'Carlos Lopez',
        phone: '221 999 0000',
        email: 'charly@mail.com',
        makeModel: 'Ford Ranger',
        year: '2022',
        damageType: 'CHOQUE MENOR',
        damageLocation: ['PARAGOLPE', 'GUARDABARRO TRASERO'],
        status: 'Presupuesto Enviado',
        location: 'Berisso',
        licensePlate: 'AC 999 WW'
    }
];

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [requests, setRequests] = useState(MOCK_REQUESTS);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded password for demo
        if (password === 'admin123') {
            setIsAuthenticated(true);
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const handleStatusChange = (id: string, newStatus: string) => {
        setRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: newStatus } : req
        ));
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
                    <h2 style={{ marginBottom: '1.5rem', color: '#D4AF37' }}>Acceso Administrativo</h2>
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
                    <button type="submit" className="btn-gold" style={{ width: '100%' }}>Ingresar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-dashboard" style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '2rem' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <h1 style={{ color: '#D4AF37' }}>Panel de Solicitudes</h1>
                    <button onClick={() => setIsAuthenticated(false)} style={{ padding: '0.5rem 1rem', background: '#333', border: 'none', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}>
                        Cerrar Sesión
                    </button>
                </header>

                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #D4AF37', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Cliente</th>
                                <th style={{ padding: '1rem' }}>Vehículo</th>
                                <th style={{ padding: '1rem' }}>Daño</th>
                                <th style={{ padding: '1rem' }}>Contacto</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {requests.map(req => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '1rem' }}>{req.date}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{req.name}</div>
                                        <div style={{ color: '#888', fontSize: '0.8rem' }}>{req.location || 'Localidad N/A'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{req.makeModel}</div>
                                        <small style={{ color: '#888' }}>{req.year} - {req.licensePlate || 'Sin Patente'}</small>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: '#D4AF37' }}>{req.damageType}</div>
                                        <small>{(req.damageLocation || []).join(', ')}</small>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{req.email}</div>
                                        <div>{req.phone}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <select
                                            value={req.status}
                                            onChange={(e) => handleStatusChange(req.id, e.target.value)}
                                            style={{
                                                padding: '5px',
                                                borderRadius: '5px',
                                                background: '#222',
                                                color: '#fff',
                                                border: '1px solid #444'
                                            }}
                                        >
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Contactado">Contactado</option>
                                            <option value="Presupuesto Enviado">Presupuesto Enviado</option>
                                            <option value="Turno Agendado">Turno Agendado</option>
                                            <option value="Reparado">Reparado</option>
                                            <option value="Cancelado">Cancelado</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
