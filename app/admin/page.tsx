'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Request {
    id: string;
    created_at: string;
    name: string;
    phone: string;
    email: string;
    make_model: string;
    year: string;
    damage_type: string;
    damage_location: string[];
    status: string;
    location: string;
    photos: string[];
    description?: string;
    admin_notes?: string;
    admin_attachments?: string[];
}

export default function AdminPage() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(false);

    // Modal & Selection
    const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
    const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [uploadingAdmin, setUploadingAdmin] = useState(false);

    // Budget
    const [showBudgetForm, setShowBudgetForm] = useState(false);
    const [budgetItems, setBudgetItems] = useState<{ desc: string; price: number }[]>([{ desc: '', price: 0 }]);

    useEffect(() => {
        const session = localStorage.getItem('admin_session');
        if (session === 'true') {
            setIsAuthenticated(true);
            fetchRequests();
        }
    }, []);

    const fetchRequests = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching requests:', error);
            alert('Error al cargar solicitudes');
        } else {
            setRequests(data || []);
        }
        setLoading(false);
    };

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Hardcoded password for demo
        if (password === 'admin123') {
            setIsAuthenticated(true);
            localStorage.setItem('admin_session', 'true');
            fetchRequests();
        } else {
            alert('Contraseña incorrecta');
        }
    };

    const handleStatusChange = async (id: string, newStatus: string) => {
        // Optimistic update
        setRequests(prev => prev.map(req =>
            req.id === id ? { ...req, status: newStatus } : req
        ));

        if (selectedRequest && selectedRequest.id === id) {
            setSelectedRequest({ ...selectedRequest, status: newStatus });
        }

        const { error } = await supabase
            .from('requests')
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
        setShowBudgetForm(false);
        setBudgetItems([{ desc: '', price: 0 }]);
    };

    const handleSaveAdminNote = async () => {
        if (!selectedRequest) return;

        const { error } = await supabase
            .from('requests')
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
                .from('requests')
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
    const handleAddBudgetItem = () => {
        setBudgetItems([...budgetItems, { desc: '', price: 0 }]);
    };

    const handleBudgetItemChange = (index: number, field: 'desc' | 'price', value: string | number) => {
        const newItems = [...budgetItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setBudgetItems(newItems);
    };

    const handleRemoveBudgetItem = (index: number) => {
        setBudgetItems(budgetItems.filter((_, i) => i !== index));
    };

    const generatePDF = async () => {
        if (!selectedRequest) return;

        const doc = new jsPDF();

        // --- Header ---
        doc.setFillColor(20, 20, 20); // Dark background header
        doc.rect(0, 0, 210, 40, 'F');

        doc.setTextColor(212, 175, 55); // Gold color
        doc.setFontSize(22);
        doc.text("DSP-MDS", 15, 20);

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.text("Técnico Sacabollos - Desabollado Sin Pintura", 15, 28);

        doc.setFontSize(10);
        doc.text("Calle 461 B entre 21 y 21 A, City Bell", 140, 15);
        doc.text("Tel: 221 522 2729", 140, 20);
        doc.text("Instagram: @dspmds.arg", 140, 25);

        // --- Client Info ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text("PRESUPUESTO", 15, 55);

        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 150, 55);

        doc.setDrawColor(200);
        doc.line(15, 58, 195, 58);

        doc.setFontSize(11);
        doc.text(`Cliente: ${selectedRequest.name}`, 15, 70);
        doc.text(`Vehículo: ${selectedRequest.make_model} (${selectedRequest.year})`, 15, 77);
        doc.text(`Email: ${selectedRequest.email}`, 15, 84);

        // --- Table ---
        const tableBody = budgetItems.map(item => [item.desc, `$${item.price}`]);
        const total = budgetItems.reduce((sum, item) => sum + Number(item.price), 0);
        tableBody.push(['TOTAL', `$${total}`]);

        autoTable(doc, {
            startY: 95,
            head: [['Descripción del Trabajo', 'Precio']],
            body: tableBody,
            headStyles: { fillColor: [20, 20, 20], textColor: [212, 175, 55] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
            theme: 'grid',
        });

        // --- Footer ---
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text("Presupuesto válido por 15 días.", 15, finalY);
        doc.text("Gracias por confiar en DSP-MDS.", 15, finalY + 5);

        // Save PDF
        const pdfBlob = doc.output('blob');
        const pdfFileName = `Presupuesto_${selectedRequest.name.replace(/\s+/g, '_')}.pdf`;
        doc.save(pdfFileName);

        // Upload to Supabase automatically
        try {
            const fileName = `budget_${Date.now()}.pdf`;
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
                    .from('requests')
                    .update({ admin_attachments: newAttachments })
                    .eq('id', selectedRequest.id);

                // Update local state
                setRequests(prev => prev.map(r => r.id === selectedRequest.id ? { ...r, admin_attachments: newAttachments } : r));
                setSelectedRequest({ ...selectedRequest, admin_attachments: newAttachments });
                alert('Presupuesto generado y guardado en adjuntos.');
                setShowBudgetForm(false);
            }
        } catch (e) {
            console.error(e);
            alert('Presupuesto descargado, pero error al guardar online.');
        }
    };


    if (!isAuthenticated) {
        return (
            <div className="admin-login-container" style={{
                height: '100vh',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: '#111',
                color: '#fff'
            }}>
                <form onSubmit={handleLogin} style={{
                    padding: '2rem',
                    border: '1px solid #333',
                    borderRadius: '10px',
                    textAlign: 'center',
                    background: '#1a1a1a'
                }}>
                    <h2 style={{ marginBottom: '1.5rem', color: '#D4AF37' }}>Acceso Administrativo</h2>
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={{
                            padding: '10px',
                            marginBottom: '1rem',
                            width: '100%',
                            borderRadius: '5px',
                            border: '1px solid #444',
                            background: '#222',
                            color: '#fff'
                        }}
                    />
                    <button type="submit" className="btn-gold" style={{ width: '100%' }}>Ingresar</button>
                </form>
            </div>
        );
    }

    return (
        <div className="admin-dashboard" style={{ backgroundColor: '#111', minHeight: '100vh', color: '#eee', padding: '2rem', position: 'relative' }}>
            <div className="container" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', borderBottom: '1px solid #333', paddingBottom: '1rem' }}>
                    <h1 style={{ color: '#D4AF37' }}>Panel de Solicitudes</h1>
                    <button onClick={() => {
                        setIsAuthenticated(false);
                        localStorage.removeItem('admin_session');
                    }} style={{ padding: '0.5rem 1rem', background: '#333', border: 'none', color: '#fff', borderRadius: '5px', cursor: 'pointer' }}>
                        Cerrar Sesión
                    </button>
                </header>

                <div className="table-responsive" style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid #D4AF37', textAlign: 'left' }}>
                                <th style={{ padding: '1rem' }}>Fecha</th>
                                <th style={{ padding: '1rem' }}>Cliente</th>
                                <th style={{ padding: '1rem' }}>Vehículo</th>
                                <th style={{ padding: '1rem' }}>Estado</th>
                                <th style={{ padding: '1rem' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>Cargando...</td></tr>
                            ) : requests.map(req => (
                                <tr key={req.id} style={{ borderBottom: '1px solid #333' }}>
                                    <td style={{ padding: '1rem' }}>{new Date(req.created_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ fontWeight: 'bold' }}>{req.name}</div>
                                        <div style={{ color: '#888', fontSize: '0.8rem' }}>{req.location || 'Localidad N/A'}</div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div>{req.make_model}</div>
                                        <small style={{ color: '#888' }}>{req.year}</small>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            backgroundColor: req.status === 'Pendiente' ? '#d4af3733' : '#333',
                                            color: req.status === 'Pendiente' ? '#D4AF37' : '#fff',
                                            fontSize: '0.8em'
                                        }}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <button
                                            onClick={() => handleOpenDetail(req)}
                                            className="btn-gold"
                                            style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                                        >
                                            Ver Detalles / Gestionar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Request Detail Modal */}
            {selectedRequest && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000,
                    padding: '20px'
                }} onClick={() => setSelectedRequest(null)}>
                    <div style={{
                        backgroundColor: '#1a1a1a',
                        width: '900px',
                        maxWidth: '95%',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        borderRadius: '10px',
                        border: '1px solid #333',
                        padding: '20px',
                        position: 'relative'
                    }} onClick={(e) => e.stopPropagation()}>

                        <button
                            onClick={() => setSelectedRequest(null)}
                            style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}
                        >
                            &times;
                        </button>

                        <h2 style={{ color: '#D4AF37', marginBottom: '20px', paddingRight: '40px' }}>
                            Solicitud #{selectedRequest.id.substring(0, 8)}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '30px', marginBottom: '30px' }}>
                            {/* Column 1: Client & Damage Info */}
                            <div>
                                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px' }}>Información del Cliente</h3>
                                <div style={{ marginBottom: '10px' }}><strong>Nombre:</strong> {selectedRequest.name}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Teléfono:</strong> <a href={`https://wa.me/${selectedRequest.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" style={{ color: '#90EE90' }}>{selectedRequest.phone} <i className="fab fa-whatsapp"></i></a></div>
                                <div style={{ marginBottom: '10px' }}><strong>Email:</strong> {selectedRequest.email}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Ubicación:</strong> {selectedRequest.location}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Vehículo:</strong> {selectedRequest.make_model} ({selectedRequest.year})</div>

                                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '15px', marginTop: '20px' }}>Detalles del Daño</h3>
                                <div style={{ marginBottom: '10px' }}><strong>Tipo:</strong> {selectedRequest.damage_type}</div>
                                <div style={{ marginBottom: '10px' }}><strong>Ubicación:</strong> {(selectedRequest.damage_location || []).join(', ')}</div>
                                <div style={{ marginBottom: '10px' }}>
                                    <strong>Nota del Cliente:</strong>
                                    <p style={{ background: '#222', padding: '10px', borderRadius: '5px', marginTop: '5px', color: '#ccc' }}>
                                        {selectedRequest.description || 'Sin notas adicionales.'}
                                    </p>
                                </div>

                                <div style={{ marginTop: '20px' }}>
                                    <strong>Fotos del Cliente:</strong>
                                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
                                        {selectedRequest.photos && selectedRequest.photos.map((url, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedPhoto(url)}
                                                style={{ border: 'none', background: 'none', padding: 0, cursor: 'pointer' }}
                                            >
                                                <img src={url} alt={`Foto ${idx}`} style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '5px', border: '1px solid #444' }} />
                                            </button>
                                        ))}
                                        {(!selectedRequest.photos || selectedRequest.photos.length === 0) && <span style={{ color: '#666' }}>No hay fotos.</span>}
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Management */}
                            <div style={{ background: '#222', padding: '20px', borderRadius: '10px' }}>
                                <h3 style={{ color: '#D4AF37', marginBottom: '20px' }}>Gestión Interna</h3>

                                <div style={{ marginBottom: '20px' }}>

                                    <button
                                        onClick={() => setShowBudgetForm(!showBudgetForm)}
                                        className="btn-gold"
                                        style={{ width: '100%', marginBottom: '10px', background: '#222', border: '1px solid #D4AF37', padding: '10px' }}
                                    >
                                        <i className="fas fa-file-invoice-dollar"></i> {showBudgetForm ? 'Cancelar Presupuesto' : 'Crear Presupuesto PDF'}
                                    </button>

                                    {showBudgetForm && (
                                        <div style={{ background: '#333', padding: '15px', borderRadius: '5px', marginBottom: '15px', border: '1px solid #444' }}>
                                            <h4 style={{ color: '#D4AF37', marginBottom: '10px', marginTop: 0 }}>Items del Presupuesto</h4>
                                            {budgetItems.map((item, index) => (
                                                <div key={index} style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Descripción"
                                                        value={item.desc}
                                                        onChange={(e) => handleBudgetItemChange(index, 'desc', e.target.value)}
                                                        style={{ flex: 1, padding: '8px', borderRadius: '3px', border: 'none', background: '#222', color: '#fff' }}
                                                    />
                                                    <input
                                                        type="number"
                                                        placeholder="$$$"
                                                        value={item.price}
                                                        onChange={(e) => handleBudgetItemChange(index, 'price', e.target.value as any)}
                                                        style={{ width: '80px', padding: '8px', borderRadius: '3px', border: 'none', background: '#222', color: '#fff' }}
                                                    />
                                                    <button onClick={() => handleRemoveBudgetItem(index)} style={{ color: '#ff5555', background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>&times;</button>
                                                </div>
                                            ))}
                                            <button onClick={handleAddBudgetItem} style={{ color: '#ccc', background: 'none', border: 'none', fontSize: '0.9rem', textDecoration: 'underline', marginBottom: '15px', display: 'block', cursor: 'pointer' }}>
                                                + Agregar Item
                                            </button>
                                            <button onClick={generatePDF} className="btn-gold" style={{ width: '100%' }}>
                                                Generar y Guardar PDF
                                            </button>
                                        </div>
                                    )}

                                    <hr style={{ borderColor: '#444', margin: '20px 0' }} />

                                    <label style={{ display: 'block', marginBottom: '5px' }}>Estado Actual</label>
                                    <select
                                        value={selectedRequest.status}
                                        onChange={(e) => handleStatusChange(selectedRequest.id, e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px' }}
                                    >
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
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Escribe notas sobre el presupuesto, reparaciones realizadas, etc..."
                                        style={{ width: '100%', height: '100px', padding: '10px', background: '#333', border: '1px solid #555', color: '#fff', borderRadius: '5px', resize: 'vertical' }}
                                    />
                                    <button onClick={handleSaveAdminNote} className="btn-gold" style={{ marginTop: '10px', width: '100%' }}>
                                        Guardar Nota
                                    </button>
                                </div>

                                <div>
                                    <label style={{ display: 'block', marginBottom: '5px' }}>Adjuntos (PDFs / Fotos Finales)</label>
                                    <div style={{ marginBottom: '10px' }}>
                                        {selectedRequest.admin_attachments && selectedRequest.admin_attachments.map((url, idx) => {
                                            const isPdf = url.toLowerCase().includes('.pdf');
                                            return (
                                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px', fontSize: '0.9rem' }}>
                                                    <i className={`fas ${isPdf ? 'fa-file-pdf' : 'fa-paperclip'} text-gold`}></i>
                                                    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: '#fff', textDecoration: 'underline' }}>
                                                        {isPdf ? 'Ver PDF Presupuesto' : `Adjunto ${idx + 1}`}
                                                    </a>
                                                </div>
                                            );
                                        })}
                                        {(!selectedRequest.admin_attachments || selectedRequest.admin_attachments.length === 0) && <span style={{ color: '#666', fontSize: '0.9rem' }}>No hay adjuntos.</span>}
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleAdminFileUpload}
                                        disabled={uploadingAdmin}
                                        style={{ fontSize: '0.9rem', color: '#ccc' }}
                                    />
                                    {uploadingAdmin && <p style={{ color: '#D4AF37', fontSize: '0.8rem', marginTop: '5px' }}>Subiendo...</p>}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* Photo Modal */}
            {selectedPhoto && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 2000,
                    padding: '20px'
                }} onClick={() => setSelectedPhoto(null)}>
                    <div style={{ position: 'relative', maxWidth: '90%', maxHeight: '90%' }}>
                        <button
                            onClick={() => setSelectedPhoto(null)}
                            style={{
                                position: 'absolute',
                                top: '-40px',
                                right: '-40px',
                                background: 'transparent',
                                border: 'none',
                                color: '#fff',
                                fontSize: '2rem',
                                cursor: 'pointer'
                            }}
                        >
                            <i className="fas fa-times"></i> &times;
                        </button>
                        <img
                            src={selectedPhoto}
                            alt="Detalle"
                            style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '5px' }}
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
