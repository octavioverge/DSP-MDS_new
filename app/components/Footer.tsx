import Link from 'next/link';

export default function Footer() {
    return (
        <footer>
            <div className="container footer-content">
                <p>&copy; 2024 DSP-MDS Técnico Sacabollos. Todos los derechos reservados.</p>
                <div className="social-links">
                    <a href="https://www.instagram.com/dspmds.arg/" target="_blank" rel="noopener noreferrer">
                        <i className="fab fa-instagram"></i>
                    </a>
                </div>
            </div>
        </footer>
    );
}
