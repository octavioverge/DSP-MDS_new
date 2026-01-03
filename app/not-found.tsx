import Link from 'next/link';

export default function NotFound() {
    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundImage: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.8)), url("https://images.unsplash.com/photo-1596516109370-29001ec8ec36?q=80&w=1470&auto=format&fit=crop")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: '#fff',
            textAlign: 'center',
            padding: '20px'
        }}>
            <h1 style={{ fontSize: '6rem', color: '#D4AF37', marginBottom: '10px', textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>404</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '20px', fontFamily: 'var(--font-heading)' }}>Página No Encontrada</h2>
            <p style={{ fontSize: '1.2rem', maxWidth: '600px', marginBottom: '40px', color: '#ccc' }}>
                Parece que chocaste con un enlace roto. No te preocupes, nosotros arreglamos abolladuras, pero no links rotos.
            </p>
            <Link href="/" className="btn-gold">
                Volver al Inicio
            </Link>
        </div>
    );
}
