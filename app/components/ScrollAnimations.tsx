'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function ScrollAnimations() {
    const pathname = usePathname();

    useEffect(() => {
        const observerOptions = {
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Small delay to ensure DOM is ready after navigation
        const timeoutId = setTimeout(() => {
            const animatedElements = document.querySelectorAll('.fade-in-up, .fade-in-left, .fade-in-right, .fade-in');
            animatedElements.forEach(el => observer.observe(el));
        }, 100);

        return () => {
            observer.disconnect();
            clearTimeout(timeoutId);
        };
    }, [pathname]);

    return null;
}
