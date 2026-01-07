import Link from 'next/link';
import ScrollAnimations from '../../components/ScrollAnimations';

export default function FormacionPage() {
    return (
        <main>
            <div className="internal-page-spacer"></div>
            <ScrollAnimations />
            <section className="section-padding">
                <div className="container">
                    <div className="text-center mb-5 fade-in-up">
                        <span className="section-subtitle">CAPACITACIÓN PROFESIONAL</span>
                        <h1 className="section-title text-gold">FORMACIÓN TÉCNICA DSP</h1>
                        <div className="gold-line mx-auto"></div>
                        <p className="mt-4" style={{ maxWidth: '700px', margin: '0 auto', fontSize: '1.1rem', color: '#ccc' }}>
                            Elegí la modalidad que mejor se adapte a tus necesidades. Te ofrecemos la mejor capacitación técnica para que te conviertas en un profesional del Desabollado Sin Pintura.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', maxWidth: '1000px', margin: '0 auto' }}>

                        {/* Formación Online */}
                        <div className="fade-in-up" style={{
                            background: '#1e1e1e',
                            padding: '40px',
                            borderRadius: '10px',
                            border: '1px solid #D4AF37',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            transition: 'transform 0.3s ease',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(212, 175, 55, 0.1)',
                                borderRadius: '50%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <i className="fas fa-laptop" style={{ fontSize: '2.5rem', color: '#D4AF37' }}></i>
                            </div>

                            <h3 className="section-title text-white mb-3" style={{ fontSize: '1.8rem' }}>Formación Online</h3>
                            <p style={{ color: '#aaa', marginBottom: '30px', flex: 1 }}>
                                Capacitate desde la comodidad de tu casa con nuestro curso completo en Hotmart. Accedé a lecciones detalladas y aprendé las técnicas fundamentales a tu propio ritmo.
                            </p>

                            <a
                                href="https://go.hotmart.com/F103497766T"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-gold"
                                style={{ width: '100%', maxWidth: '300px' }}
                            >
                                IR AL CURSO ONLINE
                            </a>
                        </div>

                        {/* Formación Presencial */}
                        <div className="fade-in-up" style={{
                            background: '#1e1e1e',
                            padding: '40px',
                            borderRadius: '10px',
                            border: '1px solid #333',
                            textAlign: 'center',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            opacity: 0.8,
                            animationDelay: '0.2s'
                        }}>
                            <div style={{
                                width: '80px',
                                height: '80px',
                                background: 'rgba(255, 255, 255, 0.05)',
                                borderRadius: '50%',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                marginBottom: '20px'
                            }}>
                                <i className="fas fa-users" style={{ fontSize: '2.5rem', color: '#888' }}></i>
                            </div>

                            <h3 className="section-title text-white mb-3" style={{ fontSize: '1.8rem', color: '#aaa' }}>Formación Presencial</h3>
                            <p style={{ color: '#888', marginBottom: '30px', flex: 1 }}>
                                Entrenamiento intensivo y personalizado en nuestro taller. Trabajamos mano a mano para perfeccionar tu técnica.
                                <br /><span style={{ color: '#D4AF37', marginTop: '10px', display: 'block', fontStyle: 'italic' }}>Próximamente nuevos formatos.</span>
                            </p>

                            <button
                                className="btn-gold-outline"
                                disabled
                                style={{
                                    width: '100%',
                                    maxWidth: '300px',
                                    borderColor: '#555',
                                    color: '#555',
                                    cursor: 'not-allowed'
                                }}
                            >
                                PRÓXIMAMENTE
                            </button>
                        </div>

                    </div>

                    <div className="text-center mt-5 pt-4 fade-in-up" style={{ animationDelay: '0.4s' }}>
                        <p style={{ color: '#888' }}>
                            ¿Tenés dudas sobre qué modalidad elegir? {' '}
                            <Link href="/#contact" style={{ color: '#D4AF37', textDecoration: 'underline' }}>
                                Contactanos para asesoramiento
                            </Link>
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
