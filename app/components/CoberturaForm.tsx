'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';

interface Props {
    preSelectedPlan?: string | null;
}

export default function CoberturaForm({ preSelectedPlan }: Props) {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        location: '',
        plan: 'Plan Base',
        franchise: '',
        insuranceCompany: '',
        make: '',
        model: '',
        year: '',
        originalPaint: 'Si',
        visibleDamage: 'No',
    });

    useEffect(() => {
        if (preSelectedPlan) {
            setFormData(prev => ({ ...prev, plan: preSelectedPlan }));
        }
    }, [preSelectedPlan]);

    const [files, setFiles] = useState<FileList | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [resultMessage, setResultMessage] = useState<{ type: 'success' | 'manual' | 'error', text: string } | null>(null);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(e.target.files);
        }
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setUploadProgress(0);
        setResultMessage(null);

        try {
            // Logic Pre-calibration
            const year = parseInt(formData.year) || 0;
            const franchise = parseInt(formData.franchise) || 0;
            const isStructuralDamage = formData.visibleDamage === 'Golpe Grande'; // Assuming 'Golpe Grande' maps to structural/severe for this logic, or just manual review
            const isOriginalPaint = formData.originalPaint === 'Si';

            let preStatus = 'Solicitud';
            let messageType: 'success' | 'manual' = 'manual';

            if (isOriginalPaint && year >= 2010 && franchise >= 300000 && formData.visibleDamage !== 'Golpe Grande') {
                preStatus = 'Pre-Calificado';
                messageType = 'success';
            } else {
                preStatus = 'Evaluacion Manual';
                messageType = 'manual';
            }

            // Upload Files if any
            const uploadedPhotoUrls: string[] = [];
            if (files && files.length > 0) {
                const totalFiles = files.length;
                let processedFiles = 0;
                for (let i = 0; i < totalFiles; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `cobertura_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
                    const { error: uploadError } = await supabase.storage.from('presupuestos').upload(fileName, file); // reusing bucket
                    if (!uploadError) {
                        const { data: { publicUrl } } = supabase.storage.from('presupuestos').getPublicUrl(fileName);
                        uploadedPhotoUrls.push(publicUrl);
                    }
                    processedFiles++;
                    setUploadProgress(Math.round((processedFiles / totalFiles) * 80));
                }
            }

            // Manage Client
            let clientId: string | null = null;
            const { data: existingClients } = await supabase.from('clients').select('id').eq('email', formData.email).limit(1);
            const existingClient = existingClients && existingClients.length > 0 ? existingClients[0] : null;

            if (existingClient) {
                clientId = existingClient.id;
            } else {
                const { data: newClient, error: clientError } = await supabase.from('clients').insert([{
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    location: formData.location
                }]).select().single();
                if (clientError) throw clientError;
                clientId = newClient.id;
            }

            // Insert Request
            const { error: reqError } = await supabase.from('service_cobertura').insert([{
                client_id: clientId,
                plan_name: formData.plan,
                vehicle_make: formData.make,
                vehicle_model: formData.model,
                vehicle_year: year,
                franchise_amount: franchise,
                insurance_company: formData.insuranceCompany,
                is_original_paint: formData.originalPaint,
                visible_damage: formData.visibleDamage,
                photos: uploadedPhotoUrls,
                status: preStatus
            }]);

            if (reqError) throw reqError;

            setUploadProgress(100);

            // Enviar notificación por email
            try {
                const emailHtml = `
                    <div style="font-family: Arial, sans-serif; color: #333;">
                        <h2 style="color: #D4AF37;">Nueva Solicitud de Cobertura</h2>
                        <p><strong>Cliente:</strong> ${formData.name}</p>
                        <p><strong>Email:</strong> ${formData.email}</p>
                        <p><strong>Teléfono:</strong> <a href="tel:${formData.phone}">${formData.phone}</a></p>
                        <p><strong>Localidad:</strong> ${formData.location}</p>
                        <hr style="border: 1px solid #eee;" />
                        <h3>Detalles del Vehículo</h3>
                        <p><strong>Vehículo:</strong> ${formData.make} ${formData.model} (${year})</p>
                        <p><strong>Pintura Original:</strong> ${formData.originalPaint}</p>
                        <p><strong>Daños Visibles:</strong> ${formData.visibleDamage}</p>
                        <hr style="border: 1px solid #eee;" />
                        <h3>Plan y Seguro</h3>
                        <p><strong>Plan Solicitado:</strong> ${formData.plan}</p>
                        <p><strong>Franquicia:</strong> $${franchise}</p>
                        <p><strong>Compañía:</strong> ${formData.insuranceCompany || 'No especificada'}</p>
                        <hr style="border: 1px solid #eee;" />
                        <p><strong>Resultado Pre-calificación:</strong> ${preStatus}</p>
                        ${uploadedPhotoUrls.length > 0 ? `<h3>Fotos Adjuntas:</h3><ul>${uploadedPhotoUrls.map(url => `<li><a href="${url}">Ver foto</a></li>`).join('')}</ul>` : ''}
                    </div>
                `;

                await fetch('/api/send-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        subject: `Nueva Solicitud de Cobertura - ${formData.name}`,
                        html: emailHtml
                    })
                });
            } catch (emailError) {
                console.error('Error enviando email:', emailError);
                // No bloqueamos el flujo si falla el email, pero lo logueamos
            }

            if (messageType === 'success') {
                setResultMessage({
                    type: 'success',
                    text: 'Gracias por tu solicitud. Según la información ingresada, tu vehículo pre-califica para el Plan de Cobertura DSP. Nos pondremos en contacto para coordinar una inspección presencial en el taller.'
                });
            } else {
                setResultMessage({
                    type: 'manual',
                    text: 'Gracias por tu solicitud. Vamos a analizar la información y nos comunicaremos para evaluar el vehículo y definir los próximos pasos.'
                });
            }

            // Optional: Clear form
            // setFormData(...) 

        } catch (error: any) {
            console.error(error);
            setResultMessage({ type: 'error', text: 'Hubo un error al enviar la solicitud. Por favor intenta nuevamente.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div id="application-form" className="form-container fade-in-up" style={{ marginTop: '50px', border: '1px solid #D4AF37', background: '#1a1a1a' }}>
            <h2 className="section-title text-center text-gold mb-3">Solicitud de Suscripción</h2>
            <p className="text-center mb-5" style={{ color: '#ccc' }}>
                Completá este formulario para solicitar la evaluación inicial de tu vehículo. En función de la información ingresada, podremos pre-calificar tu solicitud.
            </p>

            {resultMessage ? (
                <div style={{
                    padding: '20px',
                    background: resultMessage.type === 'success' ? 'rgba(212, 175, 55, 0.2)' : '#333',
                    border: `1px solid ${resultMessage.type === 'success' ? '#D4AF37' : '#555'}`,
                    borderRadius: '10px',
                    textAlign: 'center'
                }}>
                    <h3 style={{ color: resultMessage.type === 'success' ? '#D4AF37' : '#fff', marginBottom: '10px' }}>
                        {resultMessage.type === 'success' ? '¡Pre-Calificación Exitosa!' : 'Solicitud Recibida'}
                    </h3>
                    <p>{resultMessage.text}</p>
                    <button onClick={() => setResultMessage(null)} className="btn-gold" style={{ marginTop: '20px' }}>Nueva Solicitud</button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="budget-form">
                    {/* 1. Datos del Cliente */}
                    <h4 className="text-white mb-2" style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>1. Datos Personales</h4>
                    <div className="form-group">
                        <label>Nombre y Apellido *</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Teléfono *</label>
                            <input type="tel" name="phone" required value={formData.phone} onChange={handleInputChange} placeholder="Con prefijo (ej: 221...)" />
                        </div>
                        <div className="form-group">
                            <label>Email *</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Localidad *</label>
                        <input type="text" name="location" required value={formData.location} onChange={handleInputChange} />
                    </div>

                    {/* 2. Plan */}
                    <h4 className="text-white mb-2 mt-4" style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>2. Plan de Interés</h4>
                    <div className="form-group">
                        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                            {['Plan Base', 'Plan Intermedio', 'Plan Premium'].map(plan => (
                                <label key={plan} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                                    <input
                                        type="radio"
                                        name="plan"
                                        value={plan}
                                        checked={formData.plan === plan}
                                        onChange={handleInputChange}
                                        style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    {plan}
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* 3. Contexto Seguro */}
                    <h4 className="text-white mb-2 mt-4" style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>3. Contexto del Seguro</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Monto de Franquicia ($) *</label>
                            <input type="number" name="franchise" required value={formData.franchise} onChange={handleInputChange} placeholder="Ej: 300000" />
                        </div>
                        <div className="form-group">
                            <label>Compañía de Seguros (Opcional)</label>
                            <input type="text" name="insuranceCompany" value={formData.insuranceCompany} onChange={handleInputChange} />
                        </div>
                    </div>

                    {/* 4. Datos Vehículo */}
                    <h4 className="text-white mb-2 mt-4" style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>4. Datos del Vehículo</h4>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Marca *</label>
                            <input type="text" name="make" required value={formData.make} onChange={handleInputChange} />
                        </div>
                        <div className="form-group">
                            <label>Modelo *</label>
                            <input type="text" name="model" required value={formData.model} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Año *</label>
                            <input type="number" name="year" required value={formData.year} onChange={handleInputChange} min="1990" />
                        </div>
                        <div className="form-group">
                            <label>¿Conserva pintura original? *</label>
                            <select name="originalPaint" value={formData.originalPaint} onChange={handleInputChange} required>
                                <option value="Si">Sí</option>
                                <option value="No">No</option>
                                <option value="No lo se">No lo sé</option>
                            </select>
                        </div>
                    </div>

                    {/* 5. Estado */}
                    <h4 className="text-white mb-2 mt-4" style={{ borderBottom: '1px solid #333', paddingBottom: '5px' }}>5. Estado General</h4>
                    <div className="form-group">
                        <label>¿El vehículo presenta golpes visibles? *</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '5px' }}>
                            {['No', 'Sí, leves', 'Sí, varios', 'Golpe Grande'].map(opt => (
                                <label key={opt} style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', color: '#fff' }}>
                                    <input
                                        type="radio"
                                        name="visibleDamage"
                                        value={opt}
                                        checked={formData.visibleDamage === opt}
                                        onChange={handleInputChange}
                                        style={{ width: 'auto', marginRight: '8px' }}
                                    />
                                    {opt}
                                </label>
                            ))}
                        </div>
                    </div>

                    {formData.visibleDamage !== 'No' && (
                        <div className="form-group fade-in-up">
                            <label>Adjuntar fotos del daño (1 o 2 fotos)</label>
                            <input type="file" onChange={handleFileChange} multiple accept="image/*" />
                            <small className="text-muted">Si tenés fotos, nos ayuda a evaluar mejor.</small>
                        </div>
                    )}

                    {isSubmitting && (
                        <div className="mt-3">
                            <p style={{ color: '#D4AF37', textAlign: 'center' }}>Procesando solicitud... {uploadProgress}%</p>
                        </div>
                    )}

                    <button type="submit" className="btn-gold mt-4" style={{ width: '100%' }} disabled={isSubmitting}>
                        {isSubmitting ? 'Enviando...' : 'Enviar Solicitud de Evaluación'}
                    </button>

                    <p className="text-center mt-3 small text-muted">
                        El formulario no cobra ni confirma contratación. El pago y el alta del plan se realizan únicamente en taller.
                    </p>
                </form>
            )}
        </div>
    );
}
