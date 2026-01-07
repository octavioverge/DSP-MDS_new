'use client';
import Link from 'next/link';

export default function AdminCursosPage() {
    return (
        <div className="admin-dashboard" style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '2rem' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <Link href="/admin" style={{ color: '#D4AF37', textDecoration: 'none', marginRight: '10px' }}>
                        <i className="fas fa-arrow-left"></i> Volver
                    </Link>
                    <h1 style={{ color: '#D4AF37', borderLeft: '3px solid #D4AF37', paddingLeft: '10px', margin: 0 }}>Gestión de Cursos</h1>
                </header>

                <div style={{ padding: '40px', textAlign: 'center', background: '#222', borderRadius: '10px', border: '1px solid #333' }}>
                    <i className="fas fa-graduation-cap" style={{ fontSize: '3rem', color: '#D4AF37', marginBottom: '20px' }}></i>
                    <h2>Panel de Alumnos</h2>

                    <button className="btn-gold" style={{ opacity: 0.7, cursor: 'not-allowed' }}>Próximamente</button>
                </div>
            </div>
        </div>
    );
}
