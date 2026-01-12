'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function DemoForm() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        make: '',
        model: '',
        year: '',
        color: '',
        damageLocation: [] as string[],
        damageOrigin: '',
        paintStatus: 'No sabe',
        damageCount: '',
        description: '',
        availability: '',
        terms1: false,
        terms2: false
    });

    const damageLocations = [
        "CAPOT", "TECHO", "GUARDABARROS DELANTERO", "GUARDABARRO TRASERO",
        "PUERTA DELANTERA", "PUERTA TRASERA", "TAPA/PORTON- BAÚL",
        "PARAGOLPE", "PARANTE DE TECHO", "OTRO"
    ];

    const [files, setFiles] = useState<FileList | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        // Checkbox handling
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            const currentList = prev.damageLocation;
            if (checked) {
                return { ...prev, damageLocation: [...currentList, value] };
            } else {
                return { ...prev, damageLocation: currentList.filter(loc => loc !== value) };
            }
        });
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(e.target.files);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();

        if (!formData.terms1 || !formData.terms2) {
            setResultMessage({ type: 'error', text: 'Debes aceptar las condiciones y bases para continuar.' });
            return;
        }

        setIsSubmitting(true);
        setUploadProgress(0);
        setResultMessage(null);

        try {
            // Upload Files
            const uploadedPhotoUrls: string[] = [];
            if (files && files.length > 0) {
                const totalFiles = files.length;
                let processedFiles = 0;
                for (let i = 0; i < totalFiles; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('presupuestos').upload(fileName, file);
                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage.from('presupuestos').getPublicUrl(fileName);
                        uploadedPhotoUrls.push(publicUrl);
                    }
                    processedFiles++;
                    setUploadProgress(Math.round((processedFiles / totalFiles) * 80));
                }
            }

            // Insert into Database
            const { error: dbError } = await supabase.from('service_demos').insert([{
                client_name: formData.name,
                client_phone: formData.phone,
                client_email: formData.email,
                vehicle_make: formData.make,
                vehicle_year: formData.year,
                vehicle_color: formData.color,
                damage_location: formData.damageLocation.join(', '),
                damage_origin: formData.damageOrigin,
                paint_status: formData.paintStatus,
                damage_count: formData.damageCount,
                description: formData.description,
                availability: formData.availability,
                photos: uploadedPhotoUrls,
                status: 'pending'
            }]);

            if (dbError) {
                console.error('Database Error:', dbError);
                throw dbError;
            }

            // Build Email Content
            const emailHtml = `
                <div style="font-family: Arial, sans-serif; color: #333;">
                    <h2 style="color: #D4AF37;">Nueva Solicitud de Demostración Técnica</h2>
                    <hr />
                    <h3>Datos del Solicitante</h3>
                    <p><strong>Nombre:</strong> ${formData.name}</p>
                    <p><strong>Teléfono:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></p>
                    <p><strong>Email:</strong> ${formData.email || 'No especificado'}</p>
                    
                    <h3>Datos del Vehículo</h3>
                    <p><strong>Vehículo:</strong> ${formData.make} ${formData.model}</p>
                    <p><strong>Año:</strong> ${formData.year}</p>
                    <p><strong>Color:</strong> ${formData.color}</p>

                    <h3>Información del Daño</h3>
                    <p><strong>Ubicación:</strong> ${formData.damageLocation.join(', ')}</p>
                    <p><strong>Origen:</strong> ${formData.damageOrigin}</p>
                    <p><strong>Estado Pintura:</strong> ${formData.paintStatus}</p>
                    <p><strong>Cantidad Aprox:</strong> ${formData.damageCount}</p>
                    <p><strong>Descripción:</strong> ${formData.description}</p>
                    
                    <h3>Disponibilidad</h3>
                    <p><strong>Preferencia:</strong> ${formData.availability}</p>

                    <hr />
                    ${uploadedPhotoUrls.length > 0 ? `<h3>Fotos Adjuntas:</h3><ul>${uploadedPhotoUrls.map(url => `<li><a href="${url}">Ver foto</a></li>`).join('')}</ul>` : '<p>Sin fotos adjuntas</p>'}
                </div>
            `;

            // Send Email
            await fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subject: `Solicitud Demo - ${formData.name} - ${formData.model}`,
                    html: emailHtml
                })
            });

            setUploadProgress(100);
            setResultMessage({
                type: 'success',
                text: 'Gracias por completar la solicitud. Vamos a evaluar la información y, si el caso podría calificar, nos contactaremos para coordinar una inspección presencial en el taller.'
            });

        } catch (error: any) {
            console.error(error);
            setResultMessage({ type: 'error', text: 'Hubo un error al enviar la solicitud. Por favor contactanos por WhatsApp si el problema persiste.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div id="demo-form" className="form-container fade-in-up" style={{
            marginTop: '50px',
            border: '1px solid #D4AF37',
            background: 'linear-gradient(145deg, #1a1a1a, #0a0a0a)',
            padding: '40px',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
        }}>
            <h2 className="section-title text-center text-gold mb-5" style={{ fontSize: '2rem' }}>Solicitar Demostración</h2>

            {resultMessage ? (
                <div style={{
                    padding: '20px',
                    background: resultMessage.type === 'success' ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255, 0, 0, 0.1)',
                    border: `1px solid ${resultMessage.type === 'success' ? '#D4AF37' : 'red'}`,
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ marginBottom: '10px', color: resultMessage.type === 'success' ? '#D4AF37' : '#ff4444' }}>
                        {resultMessage.type === 'success' ? '¡Solicitud Enviada!' : 'Error'}
                    </h3>
                    <p style={{ fontSize: '1.1rem', color: '#fff' }}>{resultMessage.text}</p>
                    {resultMessage.type === 'error' && (
                        <button onClick={() => setResultMessage(null)} className="btn-gold" style={{ marginTop: '20px' }}>Intentar de nuevo</button>
                    )}
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="budget-form">
                    {/* Datos Personales */}
                    <div>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.2rem' }}>Datos del Solicitante</h4>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Nombre y Apellido *</label>
                                <input type="text" name="name" required value={formData.name} onChange={handleInputChange} />
                            </div>
                            <div className="form-group">
                                <label>Teléfono / WhatsApp *</label>
                                <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} />
                            </div>
                        </div>
                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label>Email (Opcional)</label>
                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} />
                        </div>
                    </div>

                    {/* Datos Vehículo */}
                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.2rem' }}>Datos del Vehículo</h4>
                        <div className="form-group" style={{ marginBottom: '20px' }}>
                            <label>Marca y Modelo *</label>
                            <input type="text" name="make" required value={formData.make} onChange={handleInputChange} />
                        </div>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Año</label>
                                <input type="number" name="year" value={formData.year} onChange={handleInputChange} min="1900" max="2099" />
                            </div>
                            <div className="form-group">
                                <label>Color</label>
                                <input type="text" name="color" value={formData.color} onChange={handleInputChange} />
                            </div>
                        </div>
                    </div>

                    {/* Información del Daño */}
                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.2rem' }}>Información del Daño</h4>
                        <div className="form-row">
                            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                <label style={{ display: 'block', marginBottom: '10px', color: '#D4AF37' }}>UBICACIÓN DEL DAÑO *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                                    {damageLocations.map(loc => (
                                        <label key={loc} style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal', cursor: 'pointer', color: '#ccc' }}>
                                            <input
                                                type="checkbox"
                                                name="locationGroup"
                                                value={loc}
                                                checked={formData.damageLocation.includes(loc)}
                                                onChange={handleLocationChange}
                                                className="checkbox-custom"
                                                style={{ marginRight: '10px', width: '20px' }}
                                            />
                                            {loc}
                                        </label>
                                    ))}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Origen del daño</label>
                                <select name="damageOrigin" value={formData.damageOrigin} onChange={handleInputChange}>
                                    <option value="">Seleccionar...</option>
                                    <option value="Portazo">Portazo</option>
                                    <option value="Golpe urbano">Golpe urbano</option>
                                    <option value="Granizo">Granizo</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-row" style={{ marginTop: '20px' }}>
                            <div className="form-group">
                                <label>¿La pintura está intacta?</label>
                                <select name="paintStatus" value={formData.paintStatus} onChange={handleInputChange}>
                                    <option value="Si">Sí</option>
                                    <option value="No">No</option>
                                    <option value="No sabe">No sabe</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label>Cantidad aprox. de abolladuras</label>
                                <input type="number" name="damageCount" value={formData.damageCount} onChange={handleInputChange} min="0" />
                            </div>
                        </div>

                        <div className="form-group" style={{ marginTop: '20px' }}>
                            <label>Descripción breve del daño</label>
                            <textarea name="description" rows={3} value={formData.description} onChange={handleInputChange} />
                        </div>
                    </div>

                    {/* Adjuntos */}
                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.2rem' }}>Fotos del Daño *</h4>
                        <div className="form-group" style={{ background: '#1e1e1e', padding: '20px', borderRadius: '5px', border: '1px dashed #555' }}>
                            <input type="file" onChange={handleFileChange} multiple accept="image/*" required style={{ width: '100%', color: '#ccc' }} />
                            <p style={{ fontSize: '0.9rem', color: '#aaa', marginTop: '10px' }}>Por favor subí al menos una vista general y una foto de detalle (preferentemente con reflejo).</p>
                        </div>
                    </div>

                    {/* Disponibilidad */}
                    <div style={{ marginTop: '30px' }}>
                        <h4 style={{ color: '#fff', borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '20px', fontSize: '1.2rem' }}>Disponibilidad</h4>
                        <div className="form-group">
                            <label>Preferencias horarias</label>
                            <select name="availability" value={formData.availability} onChange={handleInputChange}>
                                <option value="">Seleccionar...</option>
                                <option value="Sábados">Sábados</option>
                                <option value="Semana - Mañana">Semana - Mañana</option>
                                <option value="Semana - Tarde">Semana - Tarde</option>
                                <option value="Consultar">Consultar otros horarios</option>
                            </select>
                        </div>
                    </div>

                    {/* Términos */}
                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '20px', borderRadius: '5px', marginTop: '30px', border: '1px solid #333' }}>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginBottom: '15px', cursor: 'pointer' }}>
                            <input type="checkbox" name="terms1" checked={formData.terms1} onChange={handleInputChange} className="checkbox-custom" style={{ width: '20px' }} />
                            <span style={{ fontSize: '0.9rem', color: '#ddd' }}>Declaro haber leído y comprendido las Bases y Condiciones de la Demostración Técnica.</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer' }}>
                            <input type="checkbox" name="terms2" checked={formData.terms2} onChange={handleInputChange} className="checkbox-custom" style={{ width: '20px' }} />
                            <span style={{ fontSize: '0.9rem', color: '#ddd' }}>Entiendo que la solicitud no garantiza el acceso y que la confirmación requiere una inspección presencial en el taller.</span>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !formData.terms1 || !formData.terms2}
                        className="btn-gold"
                        style={{
                            width: '100%',
                            marginTop: '30px',
                            padding: '15px',
                            fontSize: '1.1rem',
                            opacity: (!formData.terms1 || !formData.terms2 || isSubmitting) ? 0.5 : 1,
                            cursor: (!formData.terms1 || !formData.terms2 || isSubmitting) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? `Enviando... ${uploadProgress}%` : 'SOLICITAR DEMOSTRACIÓN'}
                    </button>

                </form>
            )}
        </div>
    );
}
