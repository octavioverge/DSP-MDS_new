import ScrollAnimations from '@/app/components/ScrollAnimations';
import Link from 'next/link';
import ReviewsCarousel from '@/app/components/ReviewsCarousel';

export default function Home() {
  return (
    <>
      <ScrollAnimations />
      {/* Hero Section */}
      <header id="hero" className="hero">
        <div className="hero-overlay"></div>
        <div className="container hero-content fade-in-up">
          <h2 className="hero-subtitle">DESABOLLADO SIN PINTURA</h2>
          <h1 className="hero-title">CALIDAD ORIGINAL <br /> <span className="text-gold">SIN REPINTAR</span></h1>
          <p className="hero-text">
            Técnico certificado con más de 10 años de experiencia.
            Recuperamos la estética de tu vehículo conservando la pintura de fábrica.
          </p>
          <div className="hero-buttons" style={{ justifyContent: 'center' }}>
            <Link href="/presupuesto" className="btn-gold">Solicitar Presupuesto</Link>
          </div>
        </div>
      </header>

      {/* Features / Info Bar */}
      <section className="features-bar">
        <div className="container features-grid">
          <div className="feature-item">
            <i className="fas fa-medal"></i>
            <h3>Certificado</h3>
            <p>ACSAA & CESVI</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-award"></i>
            <h3>Calidad</h3>
            <p>Acabado Original</p>
          </div>
          <div className="feature-item">
            <i className="fas fa-clock"></i>
            <h3>Rápido</h3>
            <p>Sin demoras de pintura</p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about section-padding">
        <div className="container about-grid">
          <div className="about-content fade-in-left">
            <h3 className="section-subtitle">SOBRE NOSOTROS</h3>
            <h2 className="section-title">Excelencia en <span className="text-gold">Sacabollos</span></h2>
            <div className="gold-line"></div>
            <p>
              Soy técnico especialista en el sistema PDR (Paintless Dent Repair), con taller propio en
              <strong> City Bell</strong>.
              Mi misión es ofrecer reparaciones profesionales que priorizan la conservación de la pintura original
              y la calidad del resultado final.
            </p>
            <ul className="about-list">
              <li><i className="fas fa-check-circle text-gold"></i> Formación en carrocerías (CESVI Argentina).</li>
              <li><i className="fas fa-check-circle text-gold"></i> Capacitación en Gestión de Calidad ISO 9001:2015.
              </li>
              <li><i className="fas fa-check-circle text-gold"></i> Certificación profesional por ACSAA.</li>

            </ul>
          </div>
          <div className="about-image fade-in-right">
            <div className="image-frame">
              <img src="/assets/icon.jpg" alt="Taller DSP-MDS" />
            </div>
          </div>
        </div>
      </section>

      {/* Certificates Section */}
      <section id="certificates" className="certificates section-padding bg-darker">
        <div className="container">
          <div className="text-center mb-5 fade-in-up">
            <h2 className="section-title">Mis <span className="text-gold">Certificaciones</span></h2>
            <div className="gold-line mx-auto"></div>
            <p>Avalado por las instituciones más importantes del sector.</p>
          </div>

          <div className="certificates-grid">
            <div className="cert-card fade-in-up delay-100">
              <img src="/assets/certificado1.jpg" alt="Certificado CESVI/ACSAA" />
              <div className="cert-info">
                <h3>Certificación Profesional</h3>
                <p>ACSAA - Asociación Civil de Sacabollos</p>
              </div>
            </div>
            <div className="cert-card fade-in-up delay-200">
              <img src="/assets/certificado2.jpg" alt="Certificado CESVI/ACSAA" />
              <div className="cert-info">
                <h3>Capacitación Técnica</h3>
                <p>CESVI Argentina</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section id="reviews" className="reviews section-padding" style={{ backgroundColor: '#111' }}>
        <div className="container">
          <div className="text-center mb-5 fade-in-up">
            <h2 className="section-title">Opiniones de <span className="text-gold">Clientes</span></h2>
            <div className="gold-line mx-auto"></div>
            <p className="mb-4">Lo que dicen quienes ya confiaron en nosotros.</p>

            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginBottom: '30px' }}>
              <span style={{ fontSize: '2rem', fontWeight: 'bold', color: '#fff' }}>5.0</span>
              <div style={{ color: '#D4AF37' }}>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
              </div>
              <span style={{ color: '#888' }}>en Google Maps</span>
            </div>
          </div>

          <ReviewsCarousel />


          <div className="text-center">
            <a href="https://maps.app.goo.gl/xEx31qHu9ckUGTpB8" target="_blank" rel="noopener noreferrer" className="btn-gold">
              <i className="fab fa-google" style={{ marginRight: '8px' }}></i> Ver todas las reseñas en Google Maps
            </a>
          </div>
        </div>
      </section>

      {/* Contact & Map Section */}
      <section id="contact" className="contact section-padding">
        <div className="container contact-wrapper">
          <div className="contact-info fade-in-left">
            <h3 className="section-subtitle">UBICACIÓN</h3>
            <h2 className="section-title">Estamos en <span className="text-gold">City Bell</span></h2>
            <div className="gold-line"></div>

            <div className="contact-item">
              <div className="icon-box">
                <i className="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <h4>Dirección</h4>
                <p>Calle 461 B entre 21 y 21 A, City Bell, Buenos Aires</p>
                <a href="https://www.google.com/maps/place/DSP-MDS+T%C3%89CNICO+SACABOLLOS/@-34.8753842,-58.0616247,17z/data=!3m1!4b1!4m6!3m5!1s0x95a2dfb3cea76169:0x68faf33d8bfcee89!8m2!3d-34.8753842!4d-58.0616247!16s%2Fg%2F11r7n1_pdg?entry=ttu"
                  target="_blank" rel="noopener noreferrer" className="link-gold">Ver en Google Maps</a>
              </div>
            </div>

            <div className="contact-item">
              <div className="icon-box">
                <i className="fab fa-whatsapp"></i>
              </div>
              <div>
                <h4>WhatsApp</h4>
                <p>Enviá fotos de tu vehículo para un presupuesto.</p>
                <a href="https://wa.me/5492215222729" className="btn-whatsapp">
                  <i className="fab fa-whatsapp"></i> Contactar por WhatsApp
                </a>
              </div>
            </div>

            <div className="contact-item">
              <div className="icon-box">
                <i className="fas fa-clipboard-list"></i>
              </div>
              <div>
                <h4>Presupuesto Online</h4>
                <p>Completá el formulario para recibir una cotización.</p>
                <Link href="/presupuesto" className="btn-gold-outline">
                  Ir al Formulario
                </Link>
              </div>
            </div>

            <div className="contact-item">
              <div className="icon-box">
                <i className="fab fa-instagram"></i>
              </div>
              <div>
                <h4>Instagram</h4>
                <p>Seguinos para ver nuestros últimos trabajos.</p>
                <a href="https://www.instagram.com/dspmds.arg/" target="_blank" rel="noopener noreferrer"
                  className="link-gold">@dspmds.arg</a>
              </div>
            </div>
          </div>

          <div className="map-container fade-in-right">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3274.0722379361545!2d-58.0616247!3d-34.8753842!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x95a2dfb3cea76169%3A0x68faf33d8bfcee89!2sDSP-MDS%20T%C3%89CNICO%20SACABOLLOS!5e0!3m2!1ses!2sar!4v1709480000000!5m2!1ses!2sar"
              width="100%" height="100%" style={{ border: 0 }} allowFullScreen loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"></iframe>
          </div>
        </div>
      </section>
    </>
  );
}
