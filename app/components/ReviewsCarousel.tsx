'use client';

import { useState, useEffect } from 'react';

const reviews = [
    {
        name: "Omar Aboy",
        initial: "O",
        stars: 5,
        text: "Excelente servicio, técnica, conocimiento y precisión para el tratamiento de abolladoras en la chapa sin tocar la pintura. Un especialista, preparado y capacitado. Además buena onda. Definitivamente recomendable."
    },
    {
        name: "Octavio Verge",
        initial: "O",
        stars: 5,
        text: "Excelente experiencia. Muy amable, súper detallista y prolijo con el trabajo. Me explicó todo con claridad y el resultado fue impecable, el auto quedó como nuevo. Se nota que le pone dedicación y cuidado a lo que hace. Totalmente recomendable."
    },
    {
        name: "Federico Kinzly",
        initial: "F",
        stars: 5,
        text: "Lleve 2 vehiculos con diferentes niveles de complegidad, tanto uno como otro quedaron exelente, a nivel visual como 0km. Totalmente recomendable. Matias muy profesional en todo momento. Muchas gracias!"
    },
    {
        name: "Ricardo Villa",
        initial: "R",
        stars: 5,
        text: "Muy buena atención y predisposición de Matias. Aún no concrete el trabajo, pero se tomó el tiempo, con mucho profesionalidad, para evaluar la situación y presupuestar. Recomiendo 100 %"
    },
    {
        name: "Daniela Bento",
        initial: "D",
        stars: 5,
        text: "Excelente trabajo! Me reparó un bollo que tenía en el baúl en el día y quedó muy prolijo. Excelente atención, recomiendo"
    }
];

export default function ReviewsCarousel() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerPage, setItemsPerPage] = useState(1);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 1024) {
                setItemsPerPage(3);
            } else if (window.innerWidth >= 768) {
                setItemsPerPage(2);
            } else {
                setItemsPerPage(1);
            }
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const nextSlide = () => {
        setCurrentIndex((prev) => (prev + 1) % reviews.length);
    };

    const prevSlide = () => {
        setCurrentIndex((prev) => (prev - 1 + reviews.length) % reviews.length);
    };

    // Auto-advance
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 5000);
        return () => clearInterval(interval);
    }, [itemsPerPage]); // Reset timer if layout changes? Not strictly necessary but okay.

    // Calculate visible items based on infinite loop logic equivalent or just simple slice?
    // Simple carousel often behaves better if we just translate a track.
    // Let's do a simple translation logic.

    return (
        <div style={{ position: 'relative', overflow: 'hidden', padding: '20px 0' }}>
            <div
                style={{
                    display: 'flex',
                    transition: 'transform 0.5s ease-in-out',
                    transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                    width: `${(reviews.length / itemsPerPage) * 100}%` // This width logic is tricky for responsive.
                    // Better approach: width: 100% * reviews.length / itemsPerPage ? No.
                    // Let's use flex-basis.
                }}
            >
                {reviews.map((review, index) => (
                    <div
                        key={index}
                        style={{
                            flex: `0 0 ${100 / itemsPerPage}%`,
                            padding: '0 10px',
                            boxSizing: 'border-box'
                        }}
                    >
                        <div style={{ background: '#1a1a1a', padding: '20px', borderRadius: '10px', border: '1px solid #333', height: '100%' }}>
                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '10px', color: '#fff', fontWeight: 'bold' }}>
                                    {review.initial}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '1rem', color: '#fff' }}>{review.name}</h4>
                                    <div style={{ color: '#D4AF37', fontSize: '0.8rem' }}>
                                        {[...Array(review.stars)].map((_, i) => <i key={i} className="fas fa-star"></i>)}
                                    </div>
                                </div>
                            </div>
                            <p style={{ color: '#ccc', fontStyle: 'italic', fontSize: '0.9rem' }}>"{review.text}"</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Controls */}
            <button
                onClick={prevSlide}
                style={{
                    position: 'absolute', top: '50%', left: '0', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: 'none', color: '#D4AF37',
                    padding: '10px', cursor: 'pointer', zIndex: 10, borderRadius: '0 5px 5px 0'
                }}
            >
                <i className="fas fa-chevron-left"></i>
            </button>
            <button
                onClick={nextSlide}
                style={{
                    position: 'absolute', top: '50%', right: '0', transform: 'translateY(-50%)',
                    background: 'rgba(0,0,0,0.5)', border: 'none', color: '#D4AF37',
                    padding: '10px', cursor: 'pointer', zIndex: 10, borderRadius: '5px 0 0 5px'
                }}
            >
                <i className="fas fa-chevron-right"></i>
            </button>

            {/* Dots */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '15px', gap: '5px' }}>
                {reviews.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => setCurrentIndex(idx)}
                        style={{
                            width: '10px', height: '10px', borderRadius: '50%', border: 'none',
                            background: idx === currentIndex ? '#D4AF37' : '#444', cursor: 'pointer'
                        }}
                    />
                ))}
            </div>
        </div>
    );
}
