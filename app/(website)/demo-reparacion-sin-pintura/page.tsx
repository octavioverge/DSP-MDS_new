import type { Metadata } from "next";
import DemoForm from "@/app/components/DemoForm";

export const metadata: Metadata = {
    title: "Demostración Técnica de Reparación sin Pintura",
    description: "Solicitá una demostración técnica gratuita para conocer el proceso de sacabollos antes de contratar el servicio.",
    openGraph: {
        title: "Demostración Técnica - DSP-MDS",
        description: "Conocé el proceso real del sacabollos profesional antes de tomar decisiones.",
        url: 'https://www.desabolladosinpinturamds.com.ar/demo-reparacion-sin-pintura',
        type: 'website',
    },
    alternates: {
        canonical: '/demo-reparacion-sin-pintura',
    },
};

export default function DemoPage() {
    return (
        <main style={{ paddingTop: '120px', paddingBottom: '80px', minHeight: '100vh' }}>
            <div className="container" style={{ maxWidth: '900px' }}>

                {/* BLOQUE 1 – TÍTULO PRINCIPAL */}
                <section className="text-center fade-in-up" style={{ marginBottom: '60px' }}>
                    <h1 style={{
                        fontSize: '3rem',
                        marginBottom: '20px',
                        background: 'linear-gradient(to right, #D4AF37, #F2E8C4, #D4AF37)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        fontWeight: 'bold'
                    }}>
                        Demostración Técnica
                    </h1>
                    <h2 style={{ fontSize: '1.5rem', color: '#ccc', fontWeight: '300' }}>
                        Conocé el proceso real del sacabollos profesional antes de tomar decisiones.
                    </h2>
                    <div className="gold-line mx-auto"></div>
                </section>

                {/* BLOQUE 2 – DESCRIPCIÓN BREVE */}
                <section className="text-center fade-in-up" style={{ marginBottom: '60px', maxWidth: '700px', margin: '0 auto 60px' }}>
                    <p style={{ fontSize: '1.1rem', color: '#e0e0e0', lineHeight: '1.8' }}>
                        Esta demostración tiene como objetivo mostrar el proceso real de reparación de abolladuras sin pintura y permitir que el cliente conozca el alcance, las limitaciones y la metodología de trabajo antes de realizar una reparación definitiva.
                    </p>
                </section>

                {/* BLOQUE 3 – CÓMO FUNCIONA */}
                <section className="fade-in-up" style={{ marginBottom: '80px' }}>
                    <h3 className="section-title text-center text-gold" style={{ marginBottom: '40px' }}>¿Cómo funciona?</h3>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                        gap: '30px'
                    }}>
                        {/* Paso 1 */}
                        <div style={{
                            background: '#1a1a1a',
                            padding: '30px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '60px', height: '60px',
                                background: 'rgba(212,175,55,0.1)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <span className="text-gold" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>1</span>
                            </div>
                            <h4 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>Solicitá</h4>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Completás el formulario de solicitud con los datos del vehículo y del daño.</p>
                        </div>
                        {/* Paso 2 */}
                        <div style={{
                            background: '#1a1a1a',
                            padding: '30px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '60px', height: '60px',
                                background: 'rgba(212,175,55,0.1)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <span className="text-gold" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>2</span>
                            </div>
                            <h4 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>Evaluamos</h4>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Evaluamos la información y preseleccionamos los casos viables para la demo.</p>
                        </div>
                        {/* Paso 3 */}
                        <div style={{
                            background: '#1a1a1a',
                            padding: '30px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.05)',
                            textAlign: 'center'
                        }}>
                            <div style={{
                                width: '60px', height: '60px',
                                background: 'rgba(212,175,55,0.1)',
                                borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                margin: '0 auto 20px'
                            }}>
                                <span className="text-gold" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>3</span>
                            </div>
                            <h4 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '10px' }}>Coordinamos</h4>
                            <p style={{ color: '#aaa', fontSize: '0.9rem' }}>Si el caso califica, coordinamos una inspección presencial en el taller.</p>
                        </div>
                    </div>
                </section>

                {/* BLOQUE 4 – QUÉ INCLUYE */}
                <section className="fade-in-up" style={{
                    marginBottom: '80px',
                    background: 'linear-gradient(to right, #1a1a1a, #222)',
                    padding: '40px',
                    borderRadius: '10px',
                    borderLeft: '4px solid #D4AF37',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }}>
                    <h3 style={{ fontSize: '1.8rem', color: '#fff', marginBottom: '25px' }}>Qué incluye la demostración</h3>
                    <ul style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                            <i className="fa-solid fa-check text-gold" style={{ marginTop: '5px' }}></i>
                            <span style={{ color: '#ddd', fontSize: '1.05rem' }}>Evaluación técnica detallada del daño.</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                            <i className="fa-solid fa-check text-gold" style={{ marginTop: '5px' }}></i>
                            <span style={{ color: '#ddd', fontSize: '1.05rem' }}>Reparación demostrativa parcial en taller (sobre el vehículo o panel de prueba).</span>
                        </li>
                        <li style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                            <i className="fa-solid fa-check text-gold" style={{ marginTop: '5px' }}></i>
                            <span style={{ color: '#ddd', fontSize: '1.05rem' }}>Registro del proceso de reparación en video (opcional).</span>
                        </li>
                    </ul>
                </section>

                {/* BLOQUE 5 – CONDICIONES CLAVE */}
                <section className="fade-in-up" style={{ marginBottom: '80px' }}>
                    <div style={{
                        border: '1px solid rgba(212,175,55,0.3)',
                        background: 'rgba(212,175,55,0.05)',
                        padding: '40px',
                        borderRadius: '10px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: '20px', right: '30px',
                            fontSize: '5rem', color: '#D4AF37', opacity: '0.1'
                        }}>
                            <i className="fa-solid fa-triangle-exclamation"></i>
                        </div>
                        <h3 style={{
                            color: '#D4AF37',
                            fontSize: '1.3rem',
                            textTransform: 'uppercase',
                            letterSpacing: '1px',
                            marginBottom: '20px',
                            fontWeight: 'bold'
                        }}>Condiciones Clave</h3>

                        <ul style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {['Aplica a abolladuras que puedan resolverse sin necesidad de repintado.',
                                'La solicitud está sujeta a evaluación previa por parte del técnico.',
                                'Completar el formulario no garantiza el acceso a la demostración.',
                                'La confirmación final se realiza únicamente luego de una inspección presencial en el taller.',
                                'La demostración no tiene costo, pero se entrega una cotización informativa del trabajo realizado.',
                                'Cupos limitados – atención exclusiva con turno previo.'
                            ].map((item, i) => (
                                <li key={i} style={{ display: 'flex', gap: '10px', color: '#ccc', fontSize: '0.95rem' }}>
                                    <span style={{ color: '#D4AF37', fontWeight: 'bold' }}>•</span>
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>

                        <div style={{
                            marginTop: '30px',
                            paddingTop: '20px',
                            borderTop: '1px solid rgba(212,175,55,0.2)',
                            textAlign: 'center'
                        }}>
                            <p style={{ color: '#aaa', fontSize: '0.95rem' }}>
                                <i className="fa-solid fa-location-dot text-gold" style={{ marginRight: '10px' }}></i>
                                Ubicación del taller: <span style={{ color: '#fff', fontWeight: 'bold' }}>City Bell</span>
                            </p>
                        </div>
                    </div>
                </section>

                {/* BLOQUE 6 – FORMULARIO */}
                <section id="demo-form-section" style={{ scrollMarginTop: '100px' }}>
                    <DemoForm />
                </section>

            </div>
        </main>
    );
}
