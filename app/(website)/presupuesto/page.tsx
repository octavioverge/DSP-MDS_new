import type { Metadata } from 'next';
import PresupuestoContent from '../../components/PresupuestoContent';

export const metadata: Metadata = {
    title: 'Solicitar Presupuesto | DSP-MDS Sacabollos',
    description: 'Cotizá la reparación de tu vehículo online. Subí fotos del daño y recibí un presupuesto sin cargo. City Bell, La Plata.',
    alternates: {
        canonical: '/presupuesto',
    },
};

export default function PresupuestoPage() {
    return <PresupuestoContent />;
}
