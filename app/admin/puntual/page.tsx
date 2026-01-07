'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Link from 'next/link';

interface Client {
    name: string;
    phone: string;
    email: string;
    location: string;
}

interface Request {
    id: string;
    created_at: string;
    client_id: string;
    clients: Client; // Joined data
    make_model: string;
    year: string;
    damage_type: string;
    damage_location: string[];
    status: string;
    photos: string[];
    description?: string;
    admin_notes?: string;
    admin_attachments?: string[];
}

export default function AdminPuntualPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal & Selection
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [uploadingAdmin, setUploadingAdmin] = useState(false);

    // New Client State
    const [showNewClientModal, setShowNewClientModal] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: '',
        phone: '',
        email: '',
        make_model: '',
        year: '',
        damage_type: 'Granizo',
        damage_location: [] as string[],
        description: ''
    });
    const [savingClient, setSavingClient] = useState(false);

    // Budget State
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetData, setBudgetData] = useState({
        date: '',
        validity: 30,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        vehicle: '',
        items: [] as {
            zone: string;
            dents: string;
            size: string;
            complexity: string;
            price: number | string;
            observations: string;
        }[],
        notes: '',
        paymentTerms: 'Efectivo, Transferencia o Mercado Pago.',
        isCombo: false
    });

    const openBudgetModal = (req: Request) => {
        const fixedZones = [
            "Capó", "Techo", "Guardabarros del. der.", "Guardabarros del. izq.",
            "Puerta del. der.", "Puerta del. izq.", "Puerta tras. der.", "Puerta tras. izq.",
            "Parante techo der.", "Parante techo izq.", "Paragolpes delantero",
            "Paragolpes trasero", "Tapa de baúl"
        ];

        const initialItems = fixedZones.map(zone => ({
            zone: zone,
            dents: '',
            size: '',
            complexity: '',
            price: 0,
            observations: ''
        }));

        setBudgetData({
            date: new Date().toISOString().split('T')[0],
            validity: 30,
            clientName: req.clients?.name || '',
            clientPhone: req.clients?.phone || '',
            clientEmail: req.clients?.email || '',
            vehicle: `${req.make_model} ${req.year}`,
            items: initialItems,
            notes: req.description ? `Nota cliente: ${req.description}` : '',
            paymentTerms: 'Efectivo, Transferencia o Mercado Pago.',
            isCombo: false
        });

        setShowBudgetModal(true);
    };

    const handleNewClientChange = (field: string, value: any) => {
        setNewClientData({ ...newClientData, [field]: value });
    };

    const handleCreateClient = async () => {
        if (!newClientData.name || !newClientData.phone) {
            alert('Nombre y Teléfono son obligatorios');
            return;
        }

        setSavingClient(true);
        try {
            // 1. Create Client first
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .insert([{
                    name: newClientData.name,
                    phone: newClientData.phone,
                    email: newClientData.email,
                    location: 'Cargado por Admin'
                }])
                .select()
                .single();

            if (clientError) throw clientError;

            // 2. Create Service Request linked to client
            const { data, error } = await supabase
                .from('service_puntual')
                .insert([
                    {
                        client_id: clientData.id,
                        make_model: newClientData.make_model,
                        year: newClientData.year,
                        damage_type: newClientData.damage_type,
                        damage_location: newClientData.damage_location,
                        description: newClientData.description,
                        status: 'Pendiente',
                        photos: []
                    }
                ])
                .select(`
                    *,
                    clients (
                        name,
                        phone,
                        email,
                        location
                    )
                `);

            if (error) throw error;

            if (data && data.length > 0) {
                // Safe cast since we know the structure matches Request now
                const newReq = data[0] as unknown as Request;
                setRequests([newReq, ...requests]);
                alert('Cliente creado exitosamente');
                setShowNewClientModal(false);
                setNewClientData({
                    name: '',
                    phone: '',
                    email: '',
                    make_model: '',
                    year: '',
                    damage_type: 'Granizo',
                    damage_location: [],
                    description: ''
                });
                handleOpenDetail(newReq);
            }
        } catch (error) {
            console.error('Error creating client:', error);
            alert('Error al crear cliente');
        } finally {
            setSavingClient(false);
        }
    };

    // Search & Filter
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'created_at', direction: 'desc' });

    const filteredRequests = requests.filter(req => {
        const term = searchTerm.toLowerCase();
        const clientName = req.clients?.name?.toLowerCase() || '';
        const clientPhone = req.clients?.phone || '';
        const clientEmail = req.clients?.email?.toLowerCase() || '';
        const makeModel = req.make_model?.toLowerCase() || '';

        const matchesSearch = (
            clientName.includes(term) ||
            makeModel.includes(term) ||
            clientEmail.includes(term) ||
            clientPhone.includes(term)
        );
        const matchesStatus = statusFilter === 'Todos' || req.status === statusFilter;
        return matchesSearch && matchesStatus;
    }).sort((a, b) => {
        let aValue: any = '';
        let bValue: any = '';

        if (sortConfig.key === 'created_at') {
            aValue = a.created_at; bValue = b.created_at;
        } else if (sortConfig.key === 'name') {
            aValue = a.clients?.name || ''; bValue = b.clients?.name || '';
        } else if (sortConfig.key === 'make_model') {
            aValue = a.make_model || ''; bValue = b.make_model || '';
        } else if (sortConfig.key === 'status') {
            aValue = a.status || ''; bValue = b.status || '';
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchRequests();
        }
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        // Updated Query for new DB Structure
        const { data, error } = await supabase
            .from('service_puntual')
            .select(`
                *,
                clients (
                    name,
                    phone,
                    email,
                    location
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching requests:', error);
            alert('Error al cargar solicitudes');
        } else {
            // Need to cast because Supabase types might not infer the join deep enough by default without setup
            setRequests((data as any) || []);
        }
        setLoading(false);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === 'admin123') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'true');
            fetchRequests();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        setRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: newStatus } : req
        ));

        if (selectedRequest && selectedRequest.id === id) {
            setSelectedRequest({ ...selectedRequest, status: newStatus });
        }

        const { error } = await supabase
            .from('service_puntual')
            .update({ status: newStatus })
            .eq('id', id);

        if (error) {
            console.error('Error updating status:', error);
            alert('No se pudo actualizar el estado en la base de datos');
            fetchRequests();
        }
    };

    const handleOpenDetail = (req: Request) => {
        setSelectedRequest(req);
        setAdminNote(req.admin_notes || '');
        setShowBudgetModal(false);
    };

    const handleSaveAdminNote = async () => {
        if (!selectedRequest) return;

        const { error } = await supabase
            .from('service_puntual')
            .update({ admin_notes: adminNote })
            .eq('id', selectedRequest.id);

        if (error) {
            alert('Error al guardar nota');
        } else {
            alert('Nota guardada');
            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, admin_notes: adminNote } : r));
            setSelectedRequest({ ...selectedRequest, admin_notes: adminNote });
        }
    };

    const handleAdminFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !selectedRequest) return;
        setUploadingAdmin(true);
        const files = Array.from(e.target.files);
        const uploadedUrls: string[] = [];

        try {
            for (const file of files) {
                const fileExt = file.name.split('.').pop();
                const fileName = `admin_${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('presupuestos')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('presupuestos')
                    .getPublicUrl(fileName);

                uploadedUrls.push(publicUrl);
            }

            const currentAttachments = selectedRequest.admin_attachments || [];
            const newAttachments = [...currentAttachments, ...uploadedUrls];

            const { error: dbError } = await supabase
                .from('service_puntual')
                .update({ admin_attachments: newAttachments })
                .eq('id', selectedRequest.id);

            if (dbError) throw dbError;

            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, admin_attachments: newAttachments } : r));
            setSelectedRequest({ ...selectedRequest, admin_attachments: newAttachments });
            alert('Archivos subidos correctamente');

        } catch (error) {
            console.error(error);
            alert('Error al subir archivos');
        } finally {
            setUploadingAdmin(false);
        }
    };

    // Budget Functions
    const handleBudgetChange = (field: string, value: any) => {
        setBudgetData({ ...budgetData, [field]: value });
    };

    const handleItemChange = (index: number, field: string, value: any) => {
        const newItems = [...budgetData.items];
        newItems[index] = { ...newItems[index], [field]: value };
        setBudgetData({ ...budgetData, items: newItems });
    };

    const addItem = () => {
        setBudgetData({ ...budgetData, items: [...budgetData.items, { zone: '', dents: '', size: 'Leve', complexity: '', price: 0, observations: '' }] });
    };

    const removeItem = (index: number) => {
        setBudgetData({ ...budgetData, items: budgetData.items.filter((_, i) => i !== index) });
    };

    const calculateTotal = () => {
        const subtotal = budgetData.items.reduce((sum, item) => sum + Number(item.price), 0);
        return budgetData.isCombo ? subtotal * 0.8 : subtotal;
    };

    const generatePDF = async () => {
        if (!selectedRequest) return;

        const doc = new jsPDF();
        doc.setFillColor(20, 20, 20);
        doc.rect(0, 0, 210, 40, 'F');

        let logoBase64 = '';
        try {
            const response = await fetch('/assets/logoHeader.png');
            const blob = await response.blob();
            logoBase64 = await new Promise<string>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.readAsDataURL(blob);
            });
            doc.addImage(logoBase64, 'PNG', 15, 5, 30, 30);
        } catch (err) {
            console.error("Error loading logo:", err);
        }

        doc.setTextColor(212, 175, 55);
        doc.setFontSize(22);
        doc.setFont("helvetica", "bold");
        doc.text("DSP-MDS", 55, 20);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont("helvetica", "normal");
        doc.text("Técnico Sacabollos - Desabollado Sin Pintura", 55, 28);
        doc.setFontSize(9);
        doc.text("Calle 461 B entre 21 y 21 A, City Bell", 200, 15, { align: 'right' });
        doc.text("Tel: 221 522 2729", 200, 20, { align: 'right' });
        doc.text("Instagram: @dspmds.arg", 200, 25, { align: 'right' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text("PRESUPUESTO", 15, 55);
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Fecha: ${new Date(budgetData.date).toLocaleDateString()}`, 150, 55);
        doc.setDrawColor(200);
        doc.line(15, 60, 195, 60);

        doc.setFontSize(11);
        doc.text("Información del Cliente:", 15, 70);
        doc.setFont("helvetica", "bold");
        doc.text(budgetData.clientName, 15, 77);
        doc.setFont("helvetica", "normal");
        doc.text(`Vehículo: ${budgetData.vehicle}`, 15, 84);
        doc.text(`Tel: ${budgetData.clientPhone}`, 15, 91);
        doc.text(`Email: ${budgetData.clientEmail}`, 100, 91);

        const validItems = budgetData.items.filter(item =>
            (item.dents && item.dents.trim() !== '') ||
            Number(item.price) > 0 ||
            (item.observations && item.observations.trim() !== '')
        );

        const tableBody = validItems.map(item => {
            const obsv = item.observations ? `\n${item.observations}` : '';
            return [
                item.zone,
                item.dents,
                item.size,
                item.complexity,
                (Number(item.price) > 0 ? `$${Number(item.price).toLocaleString()}` : '') + obsv
            ];
        });

        const subtotal = validItems.reduce((sum, item) => sum + Number(item.price), 0);
        // We only add the subtotal/total row in the table if there is NO combo, or just the subtotal.
        // User requested special text for combo outside the table.
        if (!budgetData.isCombo) {
            tableBody.push(['', '', '', 'TOTAL', `$${subtotal.toLocaleString()}`]);
        } else {
            tableBody.push(['', '', '', 'Subtotal', `$${subtotal.toLocaleString()}`]);
        }

        autoTable(doc, {
            startY: 105,
            head: [['Zona / Autoparte', 'Golpes', 'Tamaño', 'Complejidad', 'Observaciones / Costo']],
            body: tableBody,
            headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            columnStyles: {
                0: { cellWidth: 50 },
                1: { cellWidth: 20 },
                2: { cellWidth: 25 },
                3: { cellWidth: 25 },
                4: { cellWidth: 'auto', halign: 'right' }
            }
        } as any);

        let finalY = (doc as any).lastAutoTable.finalY + 10;

        // Add Discount Text and Final Total if Combo is applied
        if (budgetData.isCombo) {
            const subtotal = validItems.reduce((sum, item) => sum + Number(item.price), 0);
            const finalTotal = subtotal * 0.8;

            doc.setFontSize(10);
            doc.setTextColor(0, 0, 0); // Black
            doc.setFont("helvetica", "bold");

            doc.text("20% DE DESCUENTO POR COMBO (cantidad de abolladuras a reparar en una sesión)", 15, finalY);
            finalY += 7;

            doc.setFontSize(14);
            doc.text(`Total final con descuento aplicado: $${finalTotal.toLocaleString()}`, 15, finalY);
            finalY += 10;
        }

        // Add Disclaimer
        doc.setFontSize(8);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(80);
        doc.text("Los valores indicados no incluyen impuestos ni cargos que pudieran corresponder según la condición fiscal y el medio de pago.", 15, finalY);
        finalY += 15;

        const pageHeight = doc.internal.pageSize.height;
        if (finalY + 80 > pageHeight) {
            doc.addPage();
            finalY = 20;
        }

        if (budgetData.notes) {
            doc.setFontSize(10);
            doc.setTextColor(50);
            doc.setFont("helvetica", "bold");
            doc.text("Observaciones Generales:", 15, finalY);
            doc.setFont("helvetica", "normal");
            const splitNotes = doc.splitTextToSize(budgetData.notes, 180);
            doc.text(splitNotes, 15, finalY + 6);
            finalY += 10 + (splitNotes.length * 5);
        }

        doc.setFontSize(8);
        doc.setTextColor(80);
        doc.setFont("helvetica", "bold");
        doc.text("Términos y Condiciones (síntesis)", 15, finalY);
        finalY += 5;
        doc.setFont("helvetica", "normal");
        const termsText = "El vehículo deberá entregarse limpio. El cliente acepta los métodos y técnicas de desabollado sin pintura y los riesgos naturales e inherentes al proceso. En casos poco probables en los que, durante tareas de desarme o desmontaje necesarias para la correcta reparación, pudiera dañarse algún accesorio, MDS asumirá su reposición sin costo adicional para el cliente. En vehículos con pintura repintada existe un mayor riesgo de desprendimiento o daño. En pintura original, la probabilidad de daño es muy baja (aprox. 1 en 100), aunque no nula. Si al iniciar la intervención se detectaran condiciones no visibles durante la inspección inicial, el cliente será informado antes de continuar el trabajo.";
        const splitTerms = doc.splitTextToSize(termsText, 180);
        doc.text(splitTerms, 15, finalY);
        finalY += (splitTerms.length * 4) + 10;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "bold");
        doc.text(`Vigencia: ${budgetData.validity} días`, 15, finalY);
        doc.text("Firma del Técnico (MDS): MATÍAS DA SILVA", 120, finalY);
        doc.line(120, finalY - 5, 200, finalY - 5);

        if (logoBase64) {
            const pageCount = (doc as any).internal.getNumberOfPages();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeightLocal = doc.internal.pageSize.getHeight();
            const imgWidth = 100;
            const imgHeight = 100;
            const x = (pageWidth - imgWidth) / 2;
            const y = (pageHeightLocal - imgHeight) / 2;

            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                try {
                    // @ts-ignore
                    doc.setGState(new doc.GState({ opacity: 0.1 }));
                    doc.addImage(logoBase64, 'PNG', x, y, imgWidth, imgHeight);
                    // @ts-ignore
                    doc.setGState(new doc.GState({ opacity: 1.0 }));
                } catch (e) {
                    doc.addImage(logoBase64, 'PNG', x, y, imgWidth, imgHeight);
                }
            }
        }

        const pdfFileName = `Presupuesto_${budgetData.clientName.replace(/\s+/g, '_')}.pdf`;
        doc.save(pdfFileName);
        const pdfBlob = doc.output('blob');

        try {
            setUploadingAdmin(true);
            const fileName = `budget_${budgetData.clientName.replace(/\s+/g, '')}_${Date.now()}.pdf`;
            const { error: uploadError } = await supabase.storage
                .from('presupuestos')
                .upload(fileName, pdfBlob);

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from('presupuestos')
                    .getPublicUrl(fileName);

                const currentAttachments = selectedRequest.admin_attachments || [];
                const newAttachments = [...currentAttachments, publicUrl];

                await supabase
                    .from('service_puntual')
                    .update({ admin_attachments: newAttachments, status: 'Presupuesto Enviado' })
                    .eq('id', selectedRequest.id);

                setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, admin_attachments: newAttachments, status: 'Presupuesto Enviado' } : r));
                setSelectedRequest({ ...selectedRequest, admin_attachments: newAttachments, status: 'Presupuesto Enviado' });
                alert('Presupuesto generado correctamente.');
                setShowBudgetModal(false);
            } else {
                throw uploadError;
            }
        } catch (e) {
            console.error(e);
            alert('Error al subir el presupuesto a la nube.');
        } finally {
            setUploadingAdmin(false);
        }
    };


    if (!isAuthenticated) {
        return (
            <div className="admin-login-container" style={{
                height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#111', color: '#fff'
            }}>
                <form onSubmit={handleLogin} style={{
                    padding: '2rem', border: '1px solid #333', borderRadius: '10px', textAlign: 'center', background: '#1a1a1a'
                }}>
                    <h2 style={{ marginBottom: '1.5rem', color: '#D4AF37' }}>Acceso Administrativo: PUNTUAL</h2>
                    <input
                        type="password" placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)}
                        style={{ padding: '10px', marginBottom: '1rem', width: '100%', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}
                    />
                    <button type="submit" className="btn-gold" style={{ width: '100%' }}>Ingresar</button>
                    <Link href="/admin" style={{ display: 'block', marginTop: '10px', color: '#888', textDecoration: 'none' }}>Volver al Panel General</Link>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-dashboard" style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '2rem', position: 'relative' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <div>
                        <Link href="/admin" style={{ color: '#D4AF37', textDecoration: 'none', marginRight: '10px' }}><i className="fas fa-arrow-left"></i> Volver</Link>
                        <h1 style={{ color: '#D4AF37', borderLeft: '3px solid #D4AF37', paddingLeft: '10px' }}>Gestión de Sacabollos Puntual</h1>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setShowNewClientModal(true)} className="btn-gold" style={{ padding: '0.5rem 1rem' }}>
                            <i className="fas fa-plus"></i> Nuevo Cliente
                        </button>
                        <button onClick={() => { setIsAuthenticated(false); localStorage.removeItem('admin_session'); }} style={{ padding: '0.5rem 1rem', background: '#333', border: 'none', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}>
                            Cerrar Sesión
                        </button>
                    </div>
                </header>

                <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <input
                        type="text" placeholder="Buscar por nombre, cliente, auto..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff' }}
                    />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ padding: '10px', borderRadius: '5px', border: '1px solid #444', backgroundColor: '#222', color: '#fff', minWidth: '150px' }}>
                        <option value="Todos">Todos los estados</option>
                        <option value="Pendiente">Pendiente</option>
                        <option value="Contactado">Contactado</option>
                        <option value="Presupuesto Enviado">Presupuesto Enviado</option>
                        <option value="Turno Agendado">Turno Agendado</option>
                        <option value="Reparado">Reparado</option>
                        <option value="Cancelado">Cancelado</option>
                    </select>
                </div>

                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #D4AF37', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('created_at')}>
                                    Fecha {sortConfig.key === 'created_at' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('name')}>
                                    Cliente {sortConfig.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('make_model')}>
                                    Vehículo {sortConfig.key === 'make_model' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1rem', cursor: 'pointer' }} onClick={() => handleSort('status')}>
                                    Estado {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </th>
                                <th style={{ padding: '1rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                            ) : filteredRequests.map(req => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{req.clients?.name || 'Cliente desconocido'}</div>
                                        <div style={{ color: '#888', fontSize: '0.8rem' }}>{req.clients?.location || 'Localidad N/A'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{req.make_model}</div>
                                        <small style={{ color: '#888' }}>{req.year}</small>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px',
                                            backgroundColor: req.status === 'Pendiente' ? '#d4af3733' : '#333',
                                            color: req.status === 'Pendiente' ? '#D4AF37' : '#fff',
                                            fontSize: '0.8em'
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button onClick={() => handleOpenDetail(req)} className="btn-gold" style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                                            Ver Detalles
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRequest && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
                }} onClick={() => setSelectedRequest(null)}>
                    <div style={{
                        backgroundColor: '#1a1a1a', width: '900px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: '10px', border: '1px solid #333', padding: '20px', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setSelectedRequest(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        <h2 style={{ color: '#D4AF37', marginBottom: '20px', paddingRight: '40px' }}>Solicitud #{selectedRequest.id ? selectedRequest.id.substring(0, 8) : ''}</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                            <div>
                                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>Información del Cliente</h3>
                                <div style={{ marginBottom: '10px' }}><strong>Nombre:</strong> {selectedRequest.clients?.name}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Teléfono:</strong> <a href={`https://wa.me/${selectedRequest.clients?.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#90EE90' }}>{selectedRequest.clients?.phone} <i className="fab fa-whatsapp"></i></a></div>
                                <div style={{ marginBottom: '10px' }}><strong>Email:</strong> {selectedRequest.clients?.email}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Ubicación:</strong> {selectedRequest.clients?.location}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Vehículo:</strong> {selectedRequest.make_model} ({selectedRequest.year})</div>
                                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', marginTop: '20px' }}>Detalles del Daño</h3>
                                <div style={{ marginBottom: '10px' }}><strong>Tipo:</strong> {selectedRequest.damage_type}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Ubicación:</strong> {(selectedRequest.damage_location || []).join(', ')}</div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Nota del Cliente:</strong>
                                    <p style={{ background: '#222', padding: '10px', borderRadius: '5px', marginTop: '5px', color: '#ccc' }}>{selectedRequest.description || 'Sin notas.'}</p>
                                </div>
                                <div style={{ marginTop: '20px' }}>
                                    <strong>Fotos del Cliente:</strong>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {selectedRequest.photos && selectedRequest.photos.map((url, idx) => (
                                            <button key={idx} onClick={() => setSelectedPhoto(url)} style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}>
                                                <img src={url} alt={`Foto ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #444' }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div style={{ background: '#222', padding: '20px', borderRadius: '10px' }}>
                                <h3 style={{ color: '#D4AF37', marginBottom: '20px' }}>Gestión Interna</h3>
                                <div style={{ marginBottom: '20px' }}>
                                    <button onClick={() => openBudgetModal(selectedRequest)} className="btn-gold" style={{ width: '100%', marginBottom: '10px', background: '#222', border: '1px solid #D4AF37', padding: '10px', color: '#D4AF37' }}>
                                        <i className="fas fa-file-invoice-dollar"></i> Generar Nuevo Presupuesto
                                    </button>
                                    <hr style={{ borderColor: '#444', margin: '20px 0' }} />
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Estado Actual</label>
                                    <select value={selectedRequest.status} onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)} style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }}>
                                        <option value="Pendiente">Pendiente</option>
                                        <option value="Contactado">Contactado</option>
                                        <option value="Presupuesto Enviado">Presupuesto Enviado</option>
                                        <option value="Turno Agendado">Turno Agendado</option>
                                        <option value="Reparado">Reparado</option>
                                        <option value="Cancelado">Cancelado</option>
                                    </select>
                                </div>
                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Notas Administrativas</label>
                                    <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Notas..." style={{ width: '100%', height: '100px', padding: '10px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px', resize: 'vertical' }} />
                                    <button onClick={handleSaveAdminNote} className="btn-gold" style={{ marginTop: '10px', width: '100%' }}>Guardar Nota</button>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Adjuntos (PDFs / Fotos Finales)</label>
                                    <div style={{ marginBottom: '10px' }}>
                                        {selectedRequest.admin_attachments && selectedRequest.admin_attachments.map((url, idx) => {
                                            const isPdf = url.toLowerCase().includes('.pdf');
                                            return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', fontSize: '0.9rem' }}>
                                                    <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-paperclip'} text-gold`}></i>
                                                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>{isPdf ? 'Ver PDF' : `Adjunto ${idx + 1}`}</a>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <input type="file" multiple onChange={handleAdminFileUpload} disabled={uploadingAdmin} style={{ fontSize: '0.9rem', color: '#ccc' }} />
                                    {uploadingAdmin && <p style={{ color: '#D4AF37', fontSize: '0.8rem' }}>Subiendo...</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {showNewClientModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
                }} onClick={() => setShowNewClientModal(false)}>
                    <div style={{
                        backgroundColor: '#1a1a1a', width: '500px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
                        borderRadius: '10px', border: '1px solid #333', padding: '20px', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowNewClientModal(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: '#fff', fontSize: '1.2rem', cursor: 'pointer' }}>&times;</button>
                        <h2 style={{ color: '#D4AF37', marginBottom: '20px', textAlign: 'center' }}>Nuevo Cliente</h2>

                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Nombre *</label>
                            <input type="text" value={newClientData.name} onChange={(e) => handleNewClientChange('name', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Teléfono *</label>
                            <input type="text" value={newClientData.phone} onChange={(e) => handleNewClientChange('phone', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Email</label>
                            <input type="email" value={newClientData.email} onChange={(e) => handleNewClientChange('email', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Vehículo (Marca/Modelo)</label>
                                <input type="text" value={newClientData.make_model} onChange={(e) => handleNewClientChange('make_model', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Año</label>
                                <input type="text" value={newClientData.year} onChange={(e) => handleNewClientChange('year', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tipo de Daño</label>
                            <select value={newClientData.damage_type} onChange={(e) => handleNewClientChange('damage_type', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}>
                                <option value="Granizo">Granizo</option>
                                <option value="Portazo">Portazo</option>
                                <option value="Choque">Choque</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Notas Iniciales</label>
                            <textarea value={newClientData.description} onChange={(e) => handleNewClientChange('description', e.target.value)} style={{ width: '100%', height: '80px', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff', resize: 'vertical' }}></textarea>
                        </div>

                        <button onClick={handleCreateClient} disabled={savingClient} className="btn-gold" style={{ width: '100%', padding: '12px' }}>
                            {savingClient ? 'Guardando...' : 'Crear Cliente'}
                        </button>
                    </div>
                </div>
            )}

            {showBudgetModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '20px'
                }} onClick={() => setShowBudgetModal(false)}>
                    <div style={{
                        backgroundColor: '#1a1a1a', width: '1000px', maxWidth: '98%', maxHeight: '95vh', overflowY: 'auto',
                        borderRadius: '10px', border: '1px solid #333', padding: '20px', position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setShowBudgetModal(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
                        <h2 style={{ color: '#D4AF37', marginBottom: '20px' }}>Generar Presupuesto PDF</h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px', background: '#222', padding: '15px', borderRadius: '5px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Fecha</label>
                                <input type="date" value={budgetData.date} onChange={(e) => handleBudgetChange('date', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Validez (días)</label>
                                <input type="number" value={budgetData.validity} onChange={(e) => handleBudgetChange('validity', parseInt(e.target.value))} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Vehículo</label>
                                <input type="text" value={budgetData.vehicle} onChange={(e) => handleBudgetChange('vehicle', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Cliente</label>
                                <input type="text" value={budgetData.clientName} onChange={(e) => handleBudgetChange('clientName', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Teléfono</label>
                                <input type="text" value={budgetData.clientPhone} onChange={(e) => handleBudgetChange('clientPhone', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Email</label>
                                <input type="text" value={budgetData.clientEmail} onChange={(e) => handleBudgetChange('clientEmail', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%' }} />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', marginBottom: '20px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead>
                                    <tr style={{ background: '#333', color: '#D4AF37' }}>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Zona</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Golpes</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Tamaño</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Complejidad</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Precio</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Observaciones</th>
                                        <th style={{ padding: '10px' }}></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {budgetData.items.map((item, index) => (
                                        <tr key={index} style={{ borderBottom: '1px solid #444' }}>
                                            <td style={{ padding: '5px' }}>
                                                <input type="text" value={item.zone} onChange={(e) => handleItemChange(index, 'zone', e.target.value)} placeholder="Zona" style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }} />
                                            </td>
                                            <td style={{ padding: '5px' }}>
                                                <input type="text" value={item.dents} onChange={(e) => handleItemChange(index, 'dents', e.target.value)} placeholder="Cant" style={{ width: '50px', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }} />
                                            </td>
                                            <td style={{ padding: '5px' }}>
                                                <select value={item.size} onChange={(e) => handleItemChange(index, 'size', e.target.value)} style={{ width: '80px', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }}>
                                                    <option value="Leve">Leve</option>
                                                    <option value="Medio">Medio</option>
                                                    <option value="Grave">Grave</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '5px' }}>
                                                <select value={item.complexity} onChange={(e) => handleItemChange(index, 'complexity', e.target.value)} style={{ background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }}>
                                                    <option value="">-</option>
                                                    <option value="Baja">Baja</option>
                                                    <option value="Media">Media</option>
                                                    <option value="Alta">Alta</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '5px' }}>
                                                <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="$" style={{ width: '80px', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }} />
                                            </td>
                                            <td style={{ padding: '5px' }}>
                                                <input type="text" value={item.observations} onChange={(e) => handleItemChange(index, 'observations', e.target.value)} placeholder="..." style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }} />
                                            </td>
                                            <td style={{ padding: '5px', textAlign: 'center' }}>
                                                <button onClick={() => removeItem(index)} style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}>&times;</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <button onClick={addItem} style={{ marginTop: '10px', background: 'none', border: '1px dashed #555', color: '#888', width: '100%', padding: '5px', cursor: 'pointer' }}>+ Agregar Ítem</button>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                            <div style={{ width: '60%' }}>
                                <label style={{ display: 'block', marginBottom: '5px' }}>Observaciones Generales</label>
                                <textarea value={budgetData.notes} onChange={(e) => handleBudgetChange('notes', e.target.value)} style={{ width: '100%', height: '80px', padding: '10px', background: '#222', border: '1px solid #444', color: '#fff', borderRadius: '5px' }}></textarea>
                            </div>
                            <div style={{ width: '35%', background: '#222', padding: '15px', borderRadius: '5px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1.2rem' }}>
                                    <span>Subtotal:</span>
                                    <span>${budgetData.items.reduce((sum, item) => sum + Number(item.price), 0).toLocaleString()}</span>
                                </div>
                                <div style={{ marginBottom: '10px' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={budgetData.isCombo} onChange={(e) => handleBudgetChange('isCombo', e.target.checked)} style={{ marginRight: '10px' }} />
                                        Aplicar Descuento Combo (20%)
                                    </label>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', borderTop: '1px solid #444', paddingTop: '10px', fontSize: '1.5rem', color: '#D4AF37', fontWeight: 'bold' }}>
                                    <span>Total:</span>
                                    <span>${calculateTotal().toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                            <button onClick={generatePDF} disabled={uploadingAdmin} className="btn-gold" style={{ padding: '15px 30px', fontSize: '1.1rem' }}>
                                {uploadingAdmin ? 'Generando...' : 'Generar PDF y Enviar'}
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {selectedPhoto && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px'
                }} onClick={() => setSelectedPhoto(null)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: '-40px', right: '-40px', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                        <img src={selectedPhoto} alt="Zoom" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '5px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()} />
                    </div>
                </div>
            )}
        </div>
    );
}

