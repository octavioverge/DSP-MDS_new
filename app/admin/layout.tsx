import Link from 'next/link';
import React from 'react';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <>
            <header style={{
                backgroundColor: '#111',
                padding: '1rem 2rem',
                borderBottom: '1px solid #333',
                display: 'flex',
                alignItems: 'center'
            }}>
                <Link href="/" style={{
                    color: '#D4AF37',
                    textDecoration: 'none',
                    fontWeight: 'bold',
                    fontSize: '1.5rem',
                    fontFamily: 'var(--font-playfair)'
                }}>
                    DSP-MDS
                </Link>
            </header>
            {children}
        </>
    );
}
