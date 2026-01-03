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

    // Helper to determine active state or adjust link path if needed
    // For this simple site, absolute paths /#section work best

    return (
        <>
            <nav className="navbar" style={scrolled ? { background: 'rgba(18, 18, 18, 1)', padding: '10px 0' } : {}}>
                <div className="container nav-container">
                    <div className="logo">
                        <img src="/assets/icon.jpg" alt="DSP-MDS Logo" />
                        <span>DSP-MDS</span>
                    </div>
                    <ul className="nav-links">
                        <li><Link href="/#hero">Inicio</Link></li>
                        <li><Link href="/#about">Nosotros</Link></li>
                        <li><Link href="/#certificates">Certificaciones</Link></li>
                        <li><Link href="/#gallery">Trabajos</Link></li>
                        <li><Link href="/presupuesto" className="btn-gold-outline">Solicitar Presupuesto</Link></li>
                    </ul>
                    <div className="hamburger" onClick={toggleMenu}>
                        <i className="fas fa-bars"></i>
                    </div>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-menu ${isOpen ? 'active' : ''}`}>
                <i className="fas fa-times close-menu" onClick={toggleMenu}></i>
                <Link href="/#hero" onClick={closeMenu}>Inicio</Link>
                <Link href="/#about" onClick={closeMenu}>Nosotros</Link>
                <Link href="/#certificates" onClick={closeMenu}>Certificaciones</Link>
                <Link href="/#gallery" onClick={closeMenu}>Trabajos</Link>
                <Link href="/presupuesto" onClick={closeMenu}>Presupuesto</Link>
                <Link href="/#contact" onClick={closeMenu}>Contacto</Link>
            </div>
        </>
    );
}
