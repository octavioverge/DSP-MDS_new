import Link from 'next/link';
import ScrollAnimations from '../../components/ScrollAnimations';

export default function FormacionPage() {
    return (
        <main>
            <div className="internal-page-spacer"></div>
            <ScrollAnimations />
            <section className="section-padding">
                <div className="container text-center">
                    <span className="section-subtitle">CAPACITACIÓN PROFESIONAL</span>
                    <h1 className="section-title text-gold">FORMACIÓN TÉCNICA DSP</h1>
                    <div className="gold-line mx-auto"></div>

                    <p className="mb-5 fade-in-up">
                        Próximamente información sobre nuestros cursos y capacitaciones.
                    </p>

                    <div className="fade-in-up">
                        <Link href="/#contact" className="btn-gold-outline">
                            CONSULTAR AHORA
                        </Link>
                    </div>
                </div>
            </section>
        </main>
    );
}
