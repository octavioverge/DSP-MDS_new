'use client';

import { useState, useEffect, ChangeEvent } from 'react';
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
        location: '',
        make_model: '',
        year: '',
        licensePlate: '',
        damage_type: 'ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)',
        damage_location: [] as string[],
        description: ''
    });
    const [newClientFiles, setNewClientFiles] = useState<FileList | null>(null);
    const [savingClient, setSavingClient] = useState(false);

    const damageLocations = [
        "CAPOT", "TECHO", "GUARDABARROS DELANTERO", "GUARDABARRO TRASERO",
        "PUERTA DELANTERA", "PUERTA TRASERA", "TAPA/PORTON- BAÚL",
        "PARAGOLPE", "PARANTE DE TECHO", "OTRO"
    ];

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<any>({});

    const startEditing = () => {
        if (!selectedRequest) return;
        const patenteMatch = selectedRequest.description?.match(/Patente:\s*([^\n]+)/i);
        const descriptionClean = selectedRequest.description?.replace(/Patente:\s*[^\n]+(\n\n)?/i, '') || '';

        setEditData({
            name: selectedRequest.clients?.name || '',
            phone: selectedRequest.clients?.phone || '',
            email: selectedRequest.clients?.email || '',
            location: selectedRequest.clients?.location || '',
            make_model: selectedRequest.make_model || '',
            year: selectedRequest.year || '',
            damage_type: selectedRequest.damage_type || '',
            description: descriptionClean,
            licensePlate: patenteMatch?.[1]?.trim() || ''
        });
        setIsEditing(true);
    };

    const handleEditChange = (field: string, value: any) => {
        setEditData({ ...editData, [field]: value });
    };

    const saveEditing = async () => {
        if (!selectedRequest) return;

        try {
            // Update Client
            const { error: clientError } = await supabase
                .from('clients')
                .update({
                    name: editData.name,
                    phone: editData.phone,
                    email: editData.email,
                    location: editData.location
                })
                .eq('id', selectedRequest.client_id);

            if (clientError) throw clientError;

            // Re-combine description
            const fullDescription = `${editData.licensePlate ? `Patente: ${editData.licensePlate}\n\n` : ''}${editData.description}`;

            // Update Request
            const { error: reqError } = await supabase
                .from('service_puntual')
                .update({
                    make_model: editData.make_model,
                    year: editData.year,
                    damage_type: editData.damage_type,
                    description: fullDescription
                })
                .eq('id', selectedRequest.id);

            if (reqError) throw reqError;

            // Update Local State
            const updatedRequest = {
                ...selectedRequest,
                make_model: editData.make_model,
                year: editData.year,
                damage_type: editData.damage_type,
                description: fullDescription,
                clients: {
                    ...selectedRequest.clients,
                    name: editData.name,
                    phone: editData.phone,
                    email: editData.email,
                    location: editData.location
                }
            };

            setRequests(prev => prev.map(r => r.id === selectedRequest.id ? updatedRequest : r));
            setSelectedRequest(updatedRequest);
            setIsEditing(false);
            alert('Datos actualizados correctamente');

        } catch (error) {
            console.error('Error updating:', error);
            alert('Error al actualizar los datos');
        }
    };

    // Budget State
    const [showBudgetModal, setShowBudgetModal] = useState(false);
    const [budgetData, setBudgetData] = useState({
        date: '',
        validity: 30,
        clientName: '',
        clientPhone: '',
        clientEmail: '',
        vehicle: '',
        licensePlate: '',
        items: [] as {
            zone: string;
            dents: string;
            size: string;
            complexity: string;
            price: number | string;
            observations: string;
            repairExpectation: string;
        }[],
        notes: '',
        paymentTerms: 'Efectivo, Transferencia o Mercado Pago.',
        isCombo: false,
        // New Technical Fields
        dspScale: {
            damageLevel: 'Leve', // Leve, Medio, Grave
            vehicleRange: 'Media', // Baja, Media, Alta
            paintType: 'Bicapa', // Monocapa, Bicapa, Tricapa, Metalizado, Perlado
            technicalRisk: 'Accesibilidad',
            repairExpectation: 'Alta', // Buena, Media, Alta
        },
        technicalObservations: {
            limitedAccess: false,
            designLines: false,
            internalReinforcements: false,
            priorRepaint: false,
            partsDisassembly: false,
        },
        appliedTechniques: {
            lateralTension: false,
            gluePull: false,
            stretchingBench: false,
            thermalTempering: false,
            combinedTechniques: false,
        }
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
            size: 'Leve',
            complexity: '',
            price: 0,
            observations: '',
            repairExpectation: 'Alta'
        }));

        setBudgetData({
            date: new Date().toISOString().split('T')[0],
            validity: 30,
            clientName: req.clients?.name || '',
            clientPhone: req.clients?.phone || '',
            clientEmail: req.clients?.email || '',
            vehicle: `${req.make_model} ${req.year}`,
            licensePlate: req.description?.match(/Patente:\s*([^\n]+)/i)?.[1]?.trim() || '',
            items: initialItems,
            notes: '',
            paymentTerms: 'Efectivo, Transferencia o Mercado Pago.',
            isCombo: false,
            dspScale: {
                damageLevel: 'Leve',
                vehicleRange: 'Media',
                paintType: 'Bicapa',
                technicalRisk: 'Accesibilidad',
                repairExpectation: 'Alta',
            },
            technicalObservations: {
                limitedAccess: false,
                designLines: false,
                internalReinforcements: false,
                priorRepaint: false,
                partsDisassembly: false,
            },
            appliedTechniques: {
                lateralTension: false,
                gluePull: false,
                stretchingBench: false,
                thermalTempering: false,
                combinedTechniques: false,
            }
        });

        setShowBudgetModal(true);
    };

    const handleNewClientChange = (field: string, value: any) => {
        setNewClientData({ ...newClientData, [field]: value });
    };

    const handleNewClientCheckChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setNewClientData(prev => {
            if (checked) {
                return { ...prev, damage_location: [...prev.damage_location, value] };
            } else {
                return { ...prev, damage_location: prev.damage_location.filter(loc => loc !== value) };
            }
        });
    };

    const handleNewClientFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setNewClientFiles(e.target.files);
        }
    };

    const handleCreateClient = async () => {
        if (!newClientData.name || !newClientData.phone) {
            alert('Nombre y Teléfono son obligatorios');
            return;
        }

        setSavingClient(true);
        try {
            const uploadedPhotoUrls: string[] = [];

            // 0. Upload Photos if any
            if (newClientFiles && newClientFiles.length > 0) {
                for (let i = 0; i < newClientFiles.length; i++) {
                    const file = newClientFiles[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

                    const { error: uploadError } = await supabase.storage
                        .from('presupuestos')
                        .upload(fileName, file);

                    if (uploadError) {
                        console.error('Error uploading file:', uploadError);
                        continue;
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('presupuestos')
                        .getPublicUrl(fileName);

                    uploadedPhotoUrls.push(publicUrl);
                }
            }

            // 1. Create Client first
            const { data: clientData, error: clientError } = await supabase
                .from('clients')
                .insert([{
                    name: newClientData.name,
                    phone: newClientData.phone,
                    email: newClientData.email,
                    location: newClientData.location || 'Localidad no especificada'
                }])
                .select()
                .single();

            if (clientError) throw clientError;

            // Prepare description with license plate
            // Prepare description with license plate
            const fullDescription = `${newClientData.licensePlate ? `Patente: ${newClientData.licensePlate}\n\n` : ''}${newClientData.description}`;

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
                        description: fullDescription,
                        status: 'Pendiente',
                        photos: uploadedPhotoUrls
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
                    location: '',
                    make_model: '',
                    year: '',
                    licensePlate: '',
                    damage_type: 'ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)',
                    damage_location: [],
                    description: ''
                });
                setNewClientFiles(null);
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
        if (password === '111355') {
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
        setIsEditing(false);
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
        setBudgetData({ ...budgetData, items: [...budgetData.items, { zone: '', dents: '', size: 'Leve', complexity: '', price: 0, observations: '', repairExpectation: 'Alta' }] });
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
        doc.text("Técnico sacabollos certificado - Desabollado Sin Pintura", 55, 28);
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
        doc.text(`Patente: ${budgetData.licensePlate}`, 15, 91);
        doc.text(`Tel: ${budgetData.clientPhone}`, 15, 98);
        doc.text(`Email: ${budgetData.clientEmail}`, 100, 98);

        const validItems = budgetData.items.filter(item =>
            (item.dents && item.dents.trim() !== '') ||
            Number(item.price) > 0 ||
            (item.observations && item.observations.trim() !== '')
        );

        const expectationMap: any = {
            'Buena': 'BAJA',
            'Baja': 'BAJA',
            'Media': 'MEDIA',
            'Alta': 'ALTA'
        };

        const hasObservations = validItems.some(item => item.observations && item.observations.trim() !== '');

        const tableHead = hasObservations
            ? [['Zona / Autoparte', 'Golpes', 'Tamaño', 'Complejidad', 'Expectativa de reparación', 'Observaciones', 'Costo']]
            : [['Zona / Autoparte', 'Golpes', 'Tamaño', 'Complejidad', 'Expectativa de reparación', 'Costo']];

        const tableBody = validItems.map(item => {
            const expKey = item.repairExpectation || 'Alta';
            const expLabel = expectationMap[expKey] || expKey;

            const row = [
                item.zone,
                item.dents,
                item.size,
                item.complexity,
                expLabel,
            ];

            if (hasObservations) {
                row.push(item.observations || '');
            }

            row.push(Number(item.price) > 0 ? `$${Number(item.price).toLocaleString()}` : '');
            return row;
        });

        const subtotal = validItems.reduce((sum, item) => sum + Number(item.price), 0);

        const totalLabel = budgetData.isCombo ? 'Subtotal' : 'TOTAL';
        const totalValue = `$${subtotal.toLocaleString()}`;

        const footerRow = [];
        const colCount = hasObservations ? 7 : 6;
        for (let i = 0; i < colCount - 2; i++) footerRow.push('');
        footerRow.push(totalLabel);
        footerRow.push(totalValue);

        tableBody.push(footerRow);

        autoTable(doc, {
            startY: 105,
            head: tableHead,
            body: tableBody,
            headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55], halign: 'center', valign: 'middle' },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 2, halign: 'center', valign: 'middle' }, // Default center align
            columnStyles: hasObservations ? {
                0: { cellWidth: 35, halign: 'left' }, // Zona
                1: { cellWidth: 15 }, // Golpes
                2: { cellWidth: 20 }, // Tamaño
                3: { cellWidth: 25 }, // Complejidad
                4: { cellWidth: 30 }, // Expectativa
                5: { cellWidth: 'auto', halign: 'left' }, // Observaciones
                6: { cellWidth: 25, halign: 'right' } // Costo
            } : {
                0: { cellWidth: 40, halign: 'left' }, // Zona
                1: { cellWidth: 20 }, // Golpes 
                2: { cellWidth: 25 }, // Tamaño
                3: { cellWidth: 30 }, // Complejidad
                4: { cellWidth: 35 }, // Expectativa
                5: { cellWidth: 30, halign: 'right' } // Costo
            }
        } as any);

        let finalY = (doc as any).lastAutoTable.finalY + 10;

        // --- NEW SECTIONS ---
        const pageHeight = doc.internal.pageSize.height;
        const checkPageBreak = (neededSpace: number) => {
            if (finalY + neededSpace > pageHeight - 20) {
                doc.addPage();
                finalY = 20;
            }
        };

        checkPageBreak(80);

        doc.setFontSize(11);
        doc.setTextColor(212, 175, 55); // Gold
        doc.setFont("helvetica", "bold");
        doc.text("Escala Técnica de Presupuestación DSP", 15, finalY);
        finalY += 7;

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        const scaleItems = [
            `• Nivel de daño: ${budgetData.dspScale.damageLevel.toUpperCase()}`,
            `• Gama del vehículo: ${budgetData.dspScale.vehicleRange.toUpperCase()}`,
            `• Tipo de pintura: ${budgetData.dspScale.paintType.toUpperCase()}`,
            `• Riesgo técnico: ${budgetData.dspScale.technicalRisk.toUpperCase()}`,
        ];
        scaleItems.forEach(item => {
            doc.text(item, 20, finalY);
            finalY += 5;
        });
        finalY += 5;

        // Tech Observations & Techniques Side by Side
        const startY_cols = finalY;

        // Col 1: Observations
        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.text("Observaciones Técnicas", 15, finalY);
        finalY += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        const obsMap: any = {
            limitedAccess: "Acceso interno limitado",
            designLines: "Líneas de diseño / bordes marcados",
            internalReinforcements: "Refuerzos internos / doble chapa",
            priorRepaint: "Posible repintado previo",
            partsDisassembly: "Desarme parcial de accesorios"
        };
        Object.keys(budgetData.technicalObservations).forEach((key) => {
            // @ts-ignore
            const val = budgetData.technicalObservations[key];
            const label = obsMap[key] || key;
            // Checkbox char replacement
            doc.text(`[ ${val ? 'X' : ' '} ] ${label}`, 20, finalY);
            finalY += 5;
        });

        // Col 2: Techniques
        let finalY_col2 = startY_cols;
        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.text("Técnicas Aplicadas", 110, finalY_col2);
        finalY_col2 += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");

        const techMap: any = {
            lateralTension: "Tensión lateral controlada",
            gluePull: "Glue Pull (tracción externa)",
            stretchingBench: "Bancada de estiramiento",
            thermalTempering: "Templado térmico",
            combinedTechniques: "Técnicas combinadas"
        };
        Object.keys(budgetData.appliedTechniques).forEach((key) => {
            // @ts-ignore
            const val = budgetData.appliedTechniques[key];
            const label = techMap[key] || key;
            doc.text(`[ ${val ? 'X' : ' '} ] ${label}`, 115, finalY_col2);
            finalY_col2 += 5;
        });

        finalY = Math.max(finalY, finalY_col2) + 10;

        checkPageBreak(60);

        // Criterio de Cálculo
        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.text("Criterio de Cálculo", 15, finalY);
        finalY += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const calcText = "Valor final del servicio = Valor base según nivel de daño + ajuste por gama del vehículo + ajuste por tipo de pintura + ajuste por riesgo técnico.";
        const splitCalc = doc.splitTextToSize(calcText, 180);
        doc.text(splitCalc, 15, finalY);
        finalY += (splitCalc.length * 4) + 5;

        // Criterios que definen...
        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Criterios que definen el valor del servicio DSP", 15, finalY);
        finalY += 7;
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const defText = "El valor del servicio de desabollado sin pintura no se define por los materiales utilizados, sino por la técnica aplicada, la experiencia del técnico y el resultado final obtenido. El proceso DSP prioriza la conservación de la pintura original, la intervención mínima sobre la estructura del vehículo, la reducción de tiempos de reparación, la precisión del resultado final y la preservación del valor de reventa.";
        const splitDef = doc.splitTextToSize(defText, 180);
        doc.text(splitDef, 15, finalY);
        finalY += (splitDef.length * 4) + 10;

        // Expectativa de Reparación - Definición de Alcance
        checkPageBreak(80);
        doc.setTextColor(212, 175, 55);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text("Expectativa de Reparación – Definición de Alcance", 15, finalY);
        finalY += 7;

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        const introExp = "Con el objetivo de brindar una gestión transparente y evitar malos entendidos, se establece previamente la expectativa de reparación acordada, la cual define el nivel de terminación y resultado esperado del servicio.";
        const splitIntroExp = doc.splitTextToSize(introExp, 180);
        doc.text(splitIntroExp, 15, finalY);
        finalY += (splitIntroExp.length * 4) + 5;

        // BAJA
        doc.setFont("helvetica", "bold");
        doc.text("Expectativa BAJA – Reparación para pintura", 15, finalY);
        finalY += 5;
        doc.setFont("helvetica", "normal");
        const textBaja = "Reparación orientada a recuperar la autoparte de su daño principal, enderezando el panel hasta llevarlo nuevamente a un plano funcional. No se busca una terminación final ni estética, ni la corrección total de daños estructurales menores o defectos en la pintura. Este tipo de reparación tiene como finalidad evitar el reemplazo de la autoparte y dejarla en condiciones para que posteriormente se realice un trabajo tradicional de chapa y pintura, donde se logrará el acabado final.";
        const splitBaja = doc.splitTextToSize(textBaja, 180);
        doc.text(splitBaja, 15, finalY);
        finalY += (splitBaja.length * 4) + 5;

        // MEDIA
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.text("Expectativa MEDIA – Terminación final muy buena", 15, finalY);
        finalY += 5;
        doc.setFont("helvetica", "normal");
        const textMedia = "Reparación con terminación final, logrando un panel al plano y funcional, con un resultado estético muy bueno. Pueden permanecer mínimas ondulaciones o texturas muy finas, difíciles de percibir a simple vista y que no afectan el uso ni el aspecto general del vehículo.";
        const splitMedia = doc.splitTextToSize(textMedia, 180);
        doc.text(splitMedia, 15, finalY);
        finalY += (splitMedia.length * 4) + 5;

        // ALTA
        checkPageBreak(30);
        doc.setFont("helvetica", "bold");
        doc.text("Expectativa ALTA – Terminación final premium", 15, finalY);
        finalY += 5;
        doc.setFont("helvetica", "normal");
        const textAlta = "Reparación con terminación final de máximo nivel, donde el panel recupera su forma, textura y apariencia original. El resultado es equivalente al estado de fábrica, sin evidencias visibles del daño previo, dentro de las posibilidades técnicas del desabollado sin pintura.";
        const splitAlta = doc.splitTextToSize(textAlta, 180);
        doc.text(splitAlta, 15, finalY);
        finalY += (splitAlta.length * 4) + 5;

        // Conclusión
        doc.setFont("helvetica", "italic");
        const conclusion = "La expectativa de reparación seleccionada influye directamente en el tiempo de trabajo, complejidad técnica y valor del servicio.";
        const splitConclusion = doc.splitTextToSize(conclusion, 180);
        doc.text(splitConclusion, 15, finalY);
        finalY += (splitConclusion.length * 4) + 10;

        // --- END NEW SECTIONS ---

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
        doc.text("Términos y Condiciones", 15, finalY);
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

        const pdfArrayBuffer = doc.output('arraybuffer');
        const pdfBlob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });

        try {
            setUploadingAdmin(true);
            const cleanClientName = budgetData.clientName.replace(/[^a-zA-Z0-9]/g, '_');
            const fileName = `budget_${cleanClientName}_${Date.now()}.pdf`;

            const { error: uploadError } = await supabase.storage
                .from('presupuestos')
                .upload(fileName, pdfBlob, {
                    contentType: 'application/pdf',
                    upsert: false
                });

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
                alert('¡Presupuesto generado y subido a la nube correctamente!');
                setShowBudgetModal(false);
            } else {
                throw uploadError;
            }
        } catch (e: any) {
            console.error(e);
            alert(`Error al subir el presupuesto a la nube: ${e.message || JSON.stringify(e) || 'Error desconocido'}. El archivo se descargará localmente de todos modos.`);
        } finally {
            setUploadingAdmin(false);
            const pdfFileName = `Presupuesto_${budgetData.clientName.replace(/\s+/g, '_')}.pdf`;
            doc.save(pdfFileName);
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
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>
                                    <h3 style={{ margin: 0 }}>Información del Cliente</h3>
                                    {!isEditing ? (
                                        <button onClick={startEditing} style={{ background: 'none', border: 'none', color: '#D4AF37', cursor: 'pointer' }}>
                                            <i className="fas fa-edit"></i> Editar
                                        </button>
                                    ) : (
                                        <div>
                                            <button onClick={saveEditing} style={{ marginRight: '10px', color: '#90EE90', background: 'none', border: 'none', cursor: 'pointer' }}>Guardar</button>
                                            <button onClick={() => setIsEditing(false)} style={{ color: '#ff6b6b', background: 'none', border: 'none', cursor: 'pointer' }}>Cancelar</button>
                                        </div>
                                    )}
                                </div>

                                {!isEditing ? (
                                    <>
                                        <div style={{ marginBottom: '10px' }}><strong>Nombre:</strong> {selectedRequest.clients?.name}</div>
                                        <div style={{ marginBottom: '10px' }}><strong>Teléfono:</strong> <a href={`https://wa.me/${selectedRequest.clients?.phone?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#90EE90' }}>{selectedRequest.clients?.phone} <i className="fab fa-whatsapp"></i></a></div>
                                        <div style={{ marginBottom: '10px' }}><strong>Email:</strong> {selectedRequest.clients?.email}</div>
                                        <div style={{ marginBottom: '10px' }}><strong>Ubicación:</strong> {selectedRequest.clients?.location}</div>
                                        <div style={{ marginBottom: '10px' }}><strong>Vehículo:</strong> {selectedRequest.make_model} ({selectedRequest.year})</div>
                                        <div style={{ marginBottom: '10px', color: '#D4AF37' }}>
                                            <strong>Patente:</strong> {selectedRequest.description?.match(/Patente:\s*([^\n]+)/i)?.[1]?.trim() || 'No especificada'}
                                        </div>

                                        <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', marginTop: '20px' }}>Detalles del Daño</h3>
                                        <div style={{ marginBottom: '10px' }}><strong>Tipo:</strong> {selectedRequest.damage_type}</div>
                                        <div style={{ marginBottom: '10px' }}><strong>Ubicación:</strong> {(selectedRequest.damage_location || []).join(', ')}</div>
                                        <div style={{ marginBottom: '10px' }}>
                                            <strong>Nota del Cliente:</strong>
                                            <p style={{ background: '#222', padding: '10px', borderRadius: '5px', marginTop: '5px', color: '#ccc', whiteSpace: 'pre-wrap' }}>
                                                {selectedRequest.description?.replace(/Patente:\s*[^\n]+(\n\n)?/i, '') || 'Sin notas.'}
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <input type="text" value={editData.name} onChange={(e) => handleEditChange('name', e.target.value)} placeholder="Nombre" style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }} />
                                        <input type="text" value={editData.phone} onChange={(e) => handleEditChange('phone', e.target.value)} placeholder="Teléfono" style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }} />
                                        <input type="email" value={editData.email} onChange={(e) => handleEditChange('email', e.target.value)} placeholder="Email" style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }} />
                                        <input type="text" value={editData.location} onChange={(e) => handleEditChange('location', e.target.value)} placeholder="Ubicación" style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }} />
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                            <input type="text" value={editData.make_model} onChange={(e) => handleEditChange('make_model', e.target.value)} placeholder="Vehículo" style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }} />
                                            <input type="text" value={editData.year} onChange={(e) => handleEditChange('year', e.target.value)} placeholder="Año" style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }} />
                                        </div>
                                        <input type="text" value={editData.licensePlate} onChange={(e) => handleEditChange('licensePlate', e.target.value)} placeholder="Patente" style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px', borderColor: '#D4AF37' }} />
                                        <h4 style={{ marginTop: '15px', color: '#888' }}>Detalles</h4>
                                        <select value={editData.damage_type} onChange={(e) => handleEditChange('damage_type', e.target.value)} style={{ width: '100%', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }}>
                                            <option value="ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)">ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)</option>
                                            <option value="ABOLLADURA MEDIANA (TAMAÑO PUÑO)">ABOLLADURA MEDIANA (TAMAÑO PUÑO)</option>
                                            <option value="ABOLLADURA GRANDE">ABOLLADURA GRANDE</option>
                                            <option value="GOLPE DE ESTACIONAMIENTO">GOLPE DE ESTACIONAMIENTO</option>
                                            <option value="GOLPE DE ESTACIONAMIENTO/DAÑO URBANO">GOLPE DE ESTACIONAMIENTO/DAÑO URBANO</option>
                                            <option value="CHOQUE MENOR">CHOQUE MENOR</option>
                                            <option value="DAÑO POR GRANIZO">DAÑO POR GRANIZO</option>
                                            <option value="NO ESTOY SEGURO">NO ESTOY SEGURO</option>
                                            <option value="Otro">Otro</option>
                                        </select>
                                        <textarea value={editData.description} onChange={(e) => handleEditChange('description', e.target.value)} placeholder="Descripción / Notas" style={{ width: '100%', height: '100px', padding: '8px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }} />
                                    </div>
                                )}

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
                        backgroundColor: '#1a1a1a', width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto',
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
                            <label style={{ display: 'block', marginBottom: '5px' }}>Localidad *</label>
                            <input type="text" value={newClientData.location} onChange={(e) => handleNewClientChange('location', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
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
                            <label style={{ display: 'block', marginBottom: '5px' }}>Patente</label>
                            <input type="text" value={newClientData.licensePlate} onChange={(e) => handleNewClientChange('licensePlate', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Tipo de Daño</label>
                            <select value={newClientData.damage_type} onChange={(e) => handleNewClientChange('damage_type', e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }}>
                                <option value="ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)">ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)</option>
                                <option value="ABOLLADURA MEDIANA (TAMAÑO PUÑO)">ABOLLADURA MEDIANA (TAMAÑO PUÑO)</option>
                                <option value="ABOLLADURA GRANDE">ABOLLADURA GRANDE</option>
                                <option value="GOLPE DE ESTACIONAMIENTO">GOLPE DE ESTACIONAMIENTO</option>
                                <option value="GOLPE DE ESTACIONAMIENTO/DAÑO URBANO">GOLPE DE ESTACIONAMIENTO/DAÑO URBANO</option>
                                <option value="CHOQUE MENOR">CHOQUE MENOR</option>
                                <option value="DAÑO POR GRANIZO">DAÑO POR GRANIZO</option>
                                <option value="NO ESTOY SEGURO">NO ESTOY SEGURO</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Ubicación del Daño</label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
                                {damageLocations.map(loc => (
                                    <label key={loc} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                                        <input
                                            type="checkbox"
                                            value={loc}
                                            checked={newClientData.damage_location.includes(loc)}
                                            onChange={handleNewClientCheckChange}
                                            style={{ marginRight: '8px' }}
                                        />
                                        {loc}
                                    </label>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginBottom: '15px' }}>
                            <label style={{ display: 'block', marginBottom: '5px' }}>Fotos del Daño</label>
                            <input type="file" multiple accept="image/*" onChange={handleNewClientFileChange} style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #444', background: '#222', color: '#fff' }} />
                            <small style={{ color: '#aaa' }}>Se pueden subir múltiples fotos.</small>
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
                                <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Patente</label>
                                <input type="text" value={budgetData.licensePlate} onChange={(e) => handleBudgetChange('licensePlate', e.target.value)} style={{ background: 'transparent', border: 'none', color: '#fff', width: '100%' }} />
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

                        {/* Technical Data Section */}
                        <div style={{ marginBottom: '20px', background: '#222', padding: '15px', borderRadius: '5px' }}>
                            <h3 style={{ color: '#D4AF37', borderBottom: '1px solid #444', paddingBottom: '5px', marginBottom: '15px' }}>Escala Técnica y Observaciones</h3>

                            {/* Escala Técnica */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <h4 style={{ color: '#ccc', marginBottom: '10px' }}>Escala Técnica DSP</h4>
                                    <div style={{ display: 'grid', gap: '10px' }}>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Nivel de Daño</label>
                                            <select
                                                value={budgetData.dspScale.damageLevel}
                                                onChange={(e) => setBudgetData({ ...budgetData, dspScale: { ...budgetData.dspScale, damageLevel: e.target.value } })}
                                                style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px' }}
                                            >
                                                <option value="Leve">Leve</option>
                                                <option value="Medio">Medio</option>
                                                <option value="Grave">Grave</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Gama del Vehículo</label>
                                            <select
                                                value={budgetData.dspScale.vehicleRange}
                                                onChange={(e) => setBudgetData({ ...budgetData, dspScale: { ...budgetData.dspScale, vehicleRange: e.target.value } })}
                                                style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px' }}
                                            >
                                                <option value="Baja">Baja</option>
                                                <option value="Media">Media</option>
                                                <option value="Alta">Alta</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Tipo de Pintura</label>
                                            <select
                                                value={budgetData.dspScale.paintType}
                                                onChange={(e) => setBudgetData({ ...budgetData, dspScale: { ...budgetData.dspScale, paintType: e.target.value } })}
                                                style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px' }}
                                            >
                                                <option value="Monocapa">Monocapa</option>
                                                <option value="Bicapa">Bicapa</option>
                                                <option value="Tricapa">Tricapa</option>
                                                <option value="Metalizado">Metalizado</option>
                                                <option value="Perlado">Perlado</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.8rem', color: '#888' }}>Riesgo Técnico</label>
                                            <input
                                                type="text"
                                                value={budgetData.dspScale.technicalRisk}
                                                onChange={(e) => setBudgetData({ ...budgetData, dspScale: { ...budgetData.dspScale, technicalRisk: e.target.value } })}
                                                style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px' }}
                                            />
                                        </div>

                                    </div>
                                </div>

                                <div>
                                    <h4 style={{ color: '#ccc', marginBottom: '10px' }}>Observaciones Técnicas</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
                                        {[
                                            { key: 'limitedAccess', label: 'Acceso interno limitado' },
                                            { key: 'designLines', label: 'Líneas de diseño / bordes marcados' },
                                            { key: 'internalReinforcements', label: 'Refuerzos internos / doble chapa' },
                                            { key: 'priorRepaint', label: 'Posible repintado previo' },
                                            { key: 'partsDisassembly', label: 'Desarme parcial de accesorios' },
                                        ].map((item: any) => (
                                            <label key={item.key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input
                                                    type="checkbox"
                                                    // @ts-ignore
                                                    checked={budgetData.technicalObservations[item.key]}
                                                    // @ts-ignore
                                                    onChange={(e) => setBudgetData({ ...budgetData, technicalObservations: { ...budgetData.technicalObservations, [item.key]: e.target.checked } })}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                {item.label}
                                            </label>
                                        ))}
                                    </div>

                                    <h4 style={{ color: '#ccc', marginBottom: '10px', marginTop: '15px' }}>Técnicas Aplicadas</h4>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '5px' }}>
                                        {[
                                            { key: 'lateralTension', label: 'Tensión lateral controlada' },
                                            { key: 'gluePull', label: 'Glue Pull (tracción externa)' },
                                            { key: 'stretchingBench', label: 'Bancada de estiramiento' },
                                            { key: 'thermalTempering', label: 'Templado térmico' },
                                            { key: 'combinedTechniques', label: 'Técnicas combinadas' },
                                        ].map((item: any) => (
                                            <label key={item.key} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', fontSize: '0.9rem' }}>
                                                <input
                                                    type="checkbox"
                                                    // @ts-ignore
                                                    checked={budgetData.appliedTechniques[item.key]}
                                                    // @ts-ignore
                                                    onChange={(e) => setBudgetData({ ...budgetData, appliedTechniques: { ...budgetData.appliedTechniques, [item.key]: e.target.checked } })}
                                                    style={{ marginRight: '8px' }}
                                                />
                                                {item.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
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
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Expectativa</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Observaciones</th>
                                        <th style={{ padding: '10px', textAlign: 'left' }}>Precio</th>
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
                                                    <option value="Grande">Grande</option>
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
                                                <select
                                                    value={item.repairExpectation || 'Alta'}
                                                    onChange={(e) => handleItemChange(index, 'repairExpectation', e.target.value)}
                                                    style={{ width: '100px', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }}
                                                >
                                                    <option value="Baja">Baja</option>
                                                    <option value="Media">Media</option>
                                                    <option value="Alta">Alta</option>
                                                </select>
                                            </td>
                                            <td style={{ padding: '5px' }}>
                                                <input type="text" value={item.observations} onChange={(e) => handleItemChange(index, 'observations', e.target.value)} placeholder="..." style={{ width: '100%', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }} />
                                            </td>
                                            <td style={{ padding: '5px' }}>
                                                <input type="number" value={item.price} onChange={(e) => handleItemChange(index, 'price', e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="$" style={{ width: '80px', background: '#333', border: '1px solid #444', color: '#fff', padding: '5px', borderRadius: '3px' }} />
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
                </div >
            )
            }

            {
                selectedPhoto && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, padding: '20px'
                    }} onClick={() => setSelectedPhoto(null)}>
                        <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                            <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: '-40px', right: '-40px', background: 'none', border: 'none', color: '#fff', fontSize: '2rem', cursor: 'pointer' }}>&times;</button>
                            <img src={selectedPhoto} alt="Zoom" style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '5px', boxShadow: '0 0 20px rgba(0,0,0,0.5)' }} onClick={(e) => e.stopPropagation()} />
                        </div>
                    </div>
                )
            }
        </div >
    );
}

