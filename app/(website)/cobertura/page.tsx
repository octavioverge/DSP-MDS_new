import type { Metadata } from 'next';
import CoberturaContent from '../../components/CoberturaContent';

export const metadata: Metadata = {
    title: 'Plan de Cobertura DSP | Mantenimiento de Carrocería',
    description: 'Gestión inteligente del daño urbano en City Bell. Sistema de cobertura para reparación de bollos sin pintura.',
    alternates: {
        canonical: '/cobertura',
    },
};

export default function CoberturaPage() {
    return <CoberturaContent />;
}
