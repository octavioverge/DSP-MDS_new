'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) {
                setScrolled(true);
            } else {
                setScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const toggleMenu = () => {
        setIsOpen(!isOpen);
        document.body.style.overflow = !isOpen ? 'hidden' : 'auto';
    };

    const closeMenu = () => {
        setIsOpen(false);
        document.body.style.overflow = 'auto';
    };

    const handleScroll = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>, id: string) => {
        // If we are on the home page, manually scroll
        if (pathname === '/' || pathname.startsWith('/#')) {
            e.preventDefault();
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                // Optional: Update URL without reloading or jumping
                window.history.pushState(null, '', `/#${id}`);
            }
        }
        // If not on home page, let the Link handle navigation to /#id naturally
        closeMenu();
    };

    // Helper to determine active state or adjust link path if needed
    // For this simple site, absolute paths /#section work best

    return (
        <>
            <nav className="navbar" style={scrolled ? { background: 'rgba(18, 18, 18, 1)', padding: '10px 0' } : {}}>
                <div className="container nav-container">
                    <div className="logo">
                        <Link href="/" style={{ display: 'flex', alignItems: 'center', color: 'inherit', textDecoration: 'none' }}>
                            <img src="/assets/logoHeader.png" alt="DSP-MDS Logo" style={{ height: '80px', width: 'auto' }} />
                        </Link>
                    </div>
                    <ul className="nav-links">
                        <li><Link href="/">Inicio</Link></li>
                        <li><Link href="/#about" onClick={(e) => handleScroll(e, 'about')}>Nosotros</Link></li>
                        <li><Link href="/#certificates" onClick={(e) => handleScroll(e, 'certificates')}>Certificaciones</Link></li>
                        <li>
                            <Link href="/cobertura" style={{
                                border: '1px solid #D4AF37',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                color: '#D4AF37',
                                display: 'inline-block',
                                textAlign: 'center',
                                fontSize: '0.8rem',
                                lineHeight: '1.2'
                            }}>
                                COBERTURA
                            </Link>
                        </li>

                        <li>
                            <Link href="/formacion" style={{
                                border: '1px solid #D4AF37',
                                padding: '8px 12px',
                                borderRadius: '4px',
                                color: '#D4AF37',
                                display: 'inline-block',
                                textAlign: 'center',
                                fontSize: '0.8rem',
                                lineHeight: '1.2'
                            }}>
                                FORMACIÓN
                            </Link>
                        </li>
                        <li><Link href="/presupuesto" className="btn-gold-outline">Presupuesto</Link></li>
                    </ul>
                    <div className="hamburger" onClick={toggleMenu}>
                        <i className="fas fa-bars"></i>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu ${isOpen ? 'active' : ''}`}>
                <i className="fas fa-times close-menu" onClick={toggleMenu}></i>
                <Link href="/" onClick={closeMenu}>Inicio</Link>
                <Link href="/#about" onClick={(e) => handleScroll(e, 'about')}>Nosotros</Link>
                <Link href="/#certificates" onClick={(e) => handleScroll(e, 'certificates')}>Certificaciones</Link>
                <Link href="/cobertura" onClick={closeMenu} style={{ color: '#D4AF37', border: '1px solid #D4AF37', padding: '10px 20px', borderRadius: '5px' }}>COBERTURA</Link>
                <Link href="/formacion" onClick={closeMenu} style={{ color: '#D4AF37', border: '1px solid #D4AF37', padding: '10px 20px', borderRadius: '5px' }}>FORMACIÓN</Link>
                <Link href="/presupuesto" onClick={closeMenu} style={{ backgroundColor: '#D4AF37', color: '#121212', border: '1px solid #D4AF37', padding: '10px 20px', borderRadius: '5px', fontWeight: 'bold' }}>PRESUPUESTO</Link>
            </div>
        </>
    );
}
