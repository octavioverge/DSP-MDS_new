'use client';
import Link from 'next/link';
import { useState } from 'react';
import ScrollAnimations from '../../components/ScrollAnimations';
import CoberturaForm from '../../components/CoberturaForm';

export default function CoberturaPage() {
    const [preSelectedPlan, setPreSelectedPlan] = useState<string | null>(null);

    const handlePlanClick = (planName: string) => {
        setPreSelectedPlan(planName);
        const element = document.getElementById('application-form');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <main>
            <div className="internal-page-spacer"></div>
            <ScrollAnimations />

            {/* Hero Section */}
            <header className="hero" style={{ minHeight: '50vh', marginTop: '-100px', paddingTop: '150px' }}>
                <div className="hero-overlay"></div>
                <div className="container hero-content text-center fade-in-up">
                    <span className="hero-subtitle">DSP-MDS</span>
                    <h1 className="hero-title text-white">
                        PLAN DE <span className="text-gold">COBERTURA</span>
                    </h1>
                    <p className="hero-text text-white mt-3" style={{ fontSize: '1.2rem' }}>
                        DESABOLLADO SIN PINTURA (DSP)
                    </p>
                </div>
            </header>

            <section className="section-padding">
                <div className="container">

                    {/* Intro */}
                    <div className="mb-5 fade-in-up">
                        <h2 className="section-title text-gold mb-3">Gestión Inteligente del Daño Urbano</h2>
                        <div className="gold-line"></div>
                        <p className="mb-4">
                            En el uso diario del auto, los golpes menores son inevitables. No son daños graves, pero afectan la estética y la percepción general del vehículo. Las franquicias altas de los seguros hacen que estos daños queden fuera del sistema, provocando su postergación y acumulación en el tiempo.
                        </p>
                        <p>
                            Frente a esta problemática, desarrollamos una forma distinta de abordar el daño urbano: con criterio técnico, planificación y preservando la pintura original.
                        </p>
                    </div>

                    {/* What is it */}
                    <div className="mb-5 fade-in-up">
                        <h3 className="text-white mb-3" style={{ fontSize: '1.5rem' }}>¿Qué es el Plan de Cobertura DSP?</h3>
                        <p>
                            El Plan de Cobertura DSP es un sistema de gestión y mantenimiento correctivo de carrocería, orientado a la reparación de golpes menores sin pintura. No es un seguro ni reemplaza la póliza del vehículo. Este documento tiene carácter informativo y no implica compromiso de contratación.
                        </p>
                    </div>

                    {/* Plans Grid */}
                    <h2 className="section-title text-center text-gold mb-5 fade-in-up">Planes Disponibles</h2>
                    <div className="features-grid mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                        {/* Plan Base */}
                        <div className="cert-card fade-in-up delay-100" style={{ padding: '30px', border: '1px solid #D4AF37', textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h3 className="text-gold mb-2" style={{ fontSize: '1.8rem' }}>PLAN BASE</h3>
                            <p className="mb-4" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$80.000 <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/ mes</span></p>
                            <ul style={{ listStyle: 'none', marginBottom: '20px', flex: 1 }}>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Paquete de reparación</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Hasta 3 abolladuras leves</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Hasta en 2 paneles distintos</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> 1 abolladura media + 1 corrección de pulido focalizada</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> 1 intervención mensual (por cada ítem)</li>
                            </ul>
                            <div className="mt-4 text-center">
                                <button onClick={() => handlePlanClick('Plan Base')} className="btn-gold" style={{ border: 'none', width: '100%' }}>SELECCIONAR PLAN BASE</button>
                            </div>
                        </div>

                        {/* Plan Intermedio */}
                        <div className="cert-card fade-in-up delay-200" style={{ padding: '30px', border: '1px solid #fff', textAlign: 'left', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <h3 className="text-white mb-2" style={{ fontSize: '1.8rem' }}>PLAN INTERMEDIO</h3>
                            <p className="mb-4" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$120.000 <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/ mes</span></p>
                            <ul style={{ listStyle: 'none', marginBottom: '20px', flex: 1 }}>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Transferible hasta 2 vehículos registrados</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Independientemente de su titularidad</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Los vehículos deberán estar declarados al momento de la suscripción</li>
                            </ul>
                            <div className="mt-4 text-center">
                                <button onClick={() => handlePlanClick('Plan Intermedio')} className="btn-gold-outline" style={{ width: '100%' }}>SELECCIONAR PLAN INTERMEDIO</button>
                            </div>
                        </div>

                        {/* Plan Premium */}
                        <div className="cert-card fade-in-up delay-100" style={{ padding: '30px', border: '2px solid #D4AF37', textAlign: 'left', transform: 'scale(1.02)', position: 'relative', display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <div style={{ position: 'absolute', top: 0, right: 0, background: '#D4AF37', color: '#000', padding: '5px 10px', fontSize: '0.8rem', fontWeight: 'bold' }}>RECOMENDADO</div>
                            <h3 className="text-gold mb-2" style={{ fontSize: '1.8rem' }}>PLAN PREMIUM</h3>
                            <p className="mb-4" style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>$150.000 <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/ mes</span></p>
                            <ul style={{ listStyle: 'none', marginBottom: '20px', flex: 1 }}>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Transferible hasta 2 vehículos registrados</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Independientemente de su titularidad</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Atención a domicilio (vehículos registrados)</li>
                                <li className="mb-2"><i className="fas fa-check text-gold mr-2"></i> Cobertura ampliada (choque menor)</li>
                            </ul>
                            <div className="mt-4 text-center">
                                <button onClick={() => handlePlanClick('Plan Premium')} className="btn-gold" style={{ border: 'none', width: '100%' }}>SELECCIONAR PLAN PREMIUM</button>
                            </div>
                        </div>
                    </div>

                    {/* Premium Details & Extensions */}
                    <div className="mb-5 fade-in-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px' }}>
                        <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '10px' }}>
                            <h3 className="text-gold mb-3">Por qué elegir el Plan Premium</h3>
                            <p>
                                El Plan Premium concentra el mayor alcance del sistema de Cobertura DSP. Está pensado para clientes que buscan una solución integral, flexible y de alto nivel técnico, incluyendo la posibilidad de resolver incluso un choque menor sin pintura, acceder a atención a domicilio y evitar traslados innecesarios.
                            </p>
                            <p className="mt-3">
                                Es el único plan que permite contratación mensual sin plazo mínimo y el que mejor responde a situaciones de uso intensivo, viajes o vehículos de alto valor.
                            </p>
                        </div>

                        <div style={{ background: '#1e1e1e', padding: '30px', borderRadius: '10px' }}>
                            <h3 className="text-gold mb-3">Extensión de cobertura – tercer vehículo</h3>
                            <p>
                                El Plan Premium puede extender su cobertura a un tercer vehículo registrado del mismo titular mediante el pago de un adicional del treinta por ciento (30%) sobre el valor del plan vigente.
                            </p>
                            <p className="mt-3 font-bold text-white">Valor adicional de referencia: $45.000 mensuales.</p>
                            <p className="mt-1 text-sm text-muted">Esta extensión se mantiene mientras el plan esté activo y al día con los pagos.</p>
                        </div>
                    </div>

                    {/* Terms */}
                    <div className="mb-5 fade-in-up">
                        <h3 className="text-white mb-4">Bases y Condiciones (informativas)</h3>
                        <h4 className="text-gold mb-2" style={{ fontSize: '1.1rem' }}>Diagnóstico técnico y alcance del sistema DSP</h4>
                        <p className="mb-4">
                            Cada abolladura será evaluada y diagnosticada previamente por el técnico responsable, quien determinará su clasificación como abolladura leve, media, grande (choque menor), grave o daño fuera del rango de reparación mediante técnicas de Desabollado Sin Pintura (DSP). Se considera abolladura grande o choque menor a aquella que involucra el cincuenta por ciento (50%) o más de la superficie total del panel afectado, siempre que conserve viabilidad técnica de reparación sin afectar la pintura original.
                        </p>
                        <p className="mb-4">
                            El cliente acepta el diagnóstico técnico emitido, aun cuando se determine que el daño requiere reparación mediante el método tradicional de chapa y pintura.
                        </p>

                        <ul className="about-list">
                            <li><i className="fas fa-info-circle text-gold"></i> Duración mínima de 3 meses para los planes Base e Intermedio.</li>
                            <li><i className="fas fa-info-circle text-gold"></i> El Plan Premium puede contratarse por un mes o bajo el mismo esquema de 3 meses.</li>
                            <li><i className="fas fa-info-circle text-gold"></i> Aplica únicamente a vehículos con pintura original. Daños preexistentes quedan excluidos.</li>
                            <li><i className="fas fa-info-circle text-gold"></i> Las intervenciones no son acumulables entre meses.</li>
                            <li><i className="fas fa-info-circle text-gold"></i> Pago mensual por adelantado. La falta de pago suspende el servicio.</li>
                            <li><i className="fas fa-info-circle text-gold"></i> La atención a domicilio aplica solo a vehículos registrados en el Plan Premium.</li>
                        </ul>
                    </div>

                    <CoberturaForm preSelectedPlan={preSelectedPlan} />

                    <div className="text-center mt-5 pt-3 fade-in-up">
                        <p className="text-muted small">
                            Este documento tiene carácter informativo y fue desarrollado para explicar el enfoque, alcance y funcionamiento del sistema. La contratación del servicio se rige por condiciones específicas que se detallan en los documentos de prestación correspondientes.
                        </p>

                    </div>

                </div>
            </section>
        </main>
    );
}
