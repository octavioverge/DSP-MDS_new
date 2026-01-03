'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
/* Firebase removed
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
*/
import CarSelector from '../components/CarSelector';
import ScrollAnimations from '../components/ScrollAnimations';
import { supabase } from '@/lib/supabaseClient';

export default function Presupuesto() {
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        location: '',
        email: '',
        makeModel: '', // Unified as per user request
        year: '',
        licensePlate: '',
        damageType: 'ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)',
        damageLocation: [] as string[], // Multi-select simulation or checkboxes
        description: ''
    });

    // Using simple string array for damage locations instead of 3D selector for now
    const damageLocations = [
        "CAPOT", "TECHO", "GUARDABARROS DELANTERO", "GUARDABARRO TRASERO",
        "PUERTA DELANTERA", "PUERTA TRASERA", "TAPA/PORTON- BAÚL",
        "PARAGOLPE", "PARANTE DE TECHO", "OTRO"
    ];

    const [files, setFiles] = useState<FileList | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleLocationChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { value, checked } = e.target;
        setFormData(prev => {
            if (checked) {
                return { ...prev, damageLocation: [...prev.damageLocation, value] };
            } else {
                return { ...prev, damageLocation: prev.damageLocation.filter(loc => loc !== value) };
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
        setIsSubmitting(true);
        setUploadProgress(0);

        try {
            const uploadedPhotoUrls: string[] = [];

            // 1. Upload Images to Supabase Storage
            if (files && files.length > 0) {
                const totalFiles = files.length;
                let processedFiles = 0;

                for (let i = 0; i < totalFiles; i++) {
                    const file = files[i];
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
                    const filePath = `${fileName}`;

                    const { error: uploadError } = await supabase.storage
                        .from('presupuestos')
                        .upload(filePath, file);

                    if (uploadError) {
                        console.error('Error uploading file:', uploadError);
                        console.error('Error details:', uploadError.message);
                        continue; // Skip failed upload
                    }

                    const { data: { publicUrl } } = supabase.storage
                        .from('presupuestos')
                        .getPublicUrl(filePath);

                    uploadedPhotoUrls.push(publicUrl);

                    processedFiles++;
                    setUploadProgress(Math.round((processedFiles / totalFiles) * 80)); // 80% for upload steps
                }
            }

            // 2. Insert Data into Supabase Database
            const { error: dbError } = await supabase
                .from('requests')
                .insert([
                    {
                        name: formData.name,
                        phone: formData.phone,
                        email: formData.email,
                        location: formData.location, // Added location field
                        make_model: formData.makeModel,
                        year: formData.year,
                        damage_type: formData.damageType,
                        damage_location: formData.damageLocation,
                        photos: uploadedPhotoUrls,
                        description: formData.description, // Added description
                        status: 'Pendiente'
                    }
                ]);

            if (dbError) {
                console.error('Database Insert Error:', dbError);
                console.error('Database Error details:', dbError.message, dbError.details);
                throw dbError;
            }

            setUploadProgress(100);
            alert('¡Presupuesto enviado correctamente! Nos pondremos en contacto pronto.');

            // Reset form
            setFormData({
                name: '',
                phone: '',
                location: '',
                email: '',
                makeModel: '',
                year: '',
                licensePlate: '',
                damageType: 'ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)',
                damageLocation: [],
                description: ''
            });

            setFiles(null);
            setUploadProgress(0);

            // Reset file input
            const fileInput = document.getElementById('attachment') as HTMLInputElement;
            if (fileInput) fileInput.value = '';

        } catch (error: any) {
            console.error("Full Error Object:", error);
            console.error("Error message:", error.message || 'No message');
            console.error("Error stack:", error.stack || 'No stack');
            alert(`Hubo un error: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <>
            <ScrollAnimations />
            <div className="internal-page-spacer"></div>

            <section id="budget" className="budget section-padding bg-darker">
                <div className="container">
                    <div className="text-center mb-5 fade-in-up">
                        <h2 className="section-title">Solicitar <span className="text-gold">Presupuesto</span></h2>
                        <div className="gold-line mx-auto"></div>
                        <p>Completá el formulario y nos pondremos en contacto a la brevedad.</p>
                    </div>
                    <div className="form-container fade-in-up">
                        <form id="budgetForm" className="budget-form" onSubmit={handleSubmit}>
                            {/* Personal Info */}
                            <div className="form-group">
                                <label htmlFor="name">Nombre y Apellido *</label>
                                <input type="text" id="name" name="name" placeholder="Tu nombre" required
                                    value={formData.name} onChange={handleInputChange} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="phone">Número de telefono (incluir código de área) *</label>
                                <small style={{ display: 'block', color: '#888', marginBottom: '5px' }}>Solo será utilizado si es necesario coordinar una inspección presencial.</small>
                                <input type="tel" id="phone" name="phone" placeholder="Ej: 221 123 4567" required
                                    value={formData.phone} onChange={handleInputChange} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="location">Localidad/ciudad *</label>
                                <input type="text" id="location" name="location" placeholder="Tu localidad" required
                                    value={formData.location} onChange={handleInputChange} />
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">CORREO ELECTRONICO *</label>
                                <small style={{ display: 'block', color: '#888', marginBottom: '5px' }}>(ATENCIÓN: el presupuesto estimado será enviado solo a esta dirección.)</small>
                                <input type="email" id="email" name="email" placeholder="ejemplo@email.com" required
                                    value={formData.email} onChange={handleInputChange} />
                            </div>

                            {/* Vehicle Info */}
                            <div className="form-row">
                                <div className="form-group">
                                    <label htmlFor="makeModel">MARCA Y MODELO *</label>
                                    <input type="text" id="makeModel" name="makeModel" placeholder="Ej: Volkswagen Gol Trend" required
                                        value={formData.makeModel} onChange={handleInputChange} />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="year">AÑO DEL VEHÍCULO *</label>
                                    <input type="number" id="year" name="year" placeholder="Ej: 2020" min="1900" max="2099" required
                                        value={formData.year} onChange={handleInputChange} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="licensePlate">PATENTE *</label>
                                <input type="text" id="licensePlate" name="licensePlate" placeholder="Ej: AA123BB" required
                                    value={formData.licensePlate} onChange={handleInputChange} />
                            </div>

                            {/* Damage Info */}
                            <div className="form-group">
                                <label htmlFor="damageType">TIPO DE DAÑO A REPARAR *</label>
                                <select id="damageType" name="damageType" value={formData.damageType} onChange={handleInputChange} required>
                                    <option value="ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)">ABOLLADURA PEQUEÑA (TAMAÑO MONEDA)</option>
                                    <option value="ABOLLADURA MEDIANA (TAMAÑO PUÑO)">ABOLLADURA MEDIANA (TAMAÑO PUÑO)</option>
                                    <option value="ABOLLADURA GRANDE">ABOLLADURA GRANDE</option>
                                    <option value="GOLPE DE ESTACIONAMIENTO">GOLPE DE ESTACIONAMIENTO</option>
                                    <option value="CHOQUE MENOR">CHOQUE MENOR</option>
                                    <option value="DAÑO POR GRANIZO">DAÑO POR GRANIZO</option>
                                    <option value="NO ESTOY SEGURO">NO ESTOY SEGURO</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '20px' }}>
                                <label>UBICACIÓN DEL DAÑO *</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginTop: '10px' }}>
                                    {damageLocations.map(loc => (
                                        <label key={loc} style={{ display: 'flex', alignItems: 'center', fontWeight: 'normal', cursor: 'pointer' }}>
                                            <input
                                                type="checkbox"
                                                name="locationGroup"
                                                value={loc}
                                                checked={formData.damageLocation.includes(loc)}
                                                onChange={handleLocationChange}
                                                style={{ marginRight: '10px', width: 'auto' }}
                                            />
                                            {loc}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* Temporarily Hidden 3D Selector
                            <div className="form-group">
                                <label>Seleccioná las zonas afectadas:</label>
                                <CarSelector onSelectionChange={setSelectedParts} />
                            </div>
                            */}

                            <div className="form-group">
                                <label htmlFor="attachment">FOTOS DEL DAÑO *</label>
                                <div style={{ fontSize: '0.85rem', color: '#ccc', marginBottom: '10px', lineHeight: '1.4' }}>
                                    <p>PARA TOMAR LAS FOTOS DEL DAÑO ELEGIR UN LUGAR CON LUZ TENUE (NO SOL DIRECTO), YA QUE LA LUZ INTENSA PUEDE DISTORSIONAR LA APARIENCIA DEL DAÑO.</p>
                                    <p>SI NO LOGRAS SUBIR LAS FOTOS, PODES ENVIARLAS POR WS CON TU NUMERO DE PATENTE AL 2215222729.</p>
                                    <p>SUBA ENTRE 4 Y 6 FOTOS. ACLARACION IMPORTANTE: AL MENOS UNA FOTO DEBE SER PANORAMICA PARA QUE SE VEA TODO EL AUTO E IDENTIFICAR CON CLARIDAD EN QUE SECTOR ESTA EL DAÑO. TOME DE DISTINTOS ANGULOS MOSTRANDO EL ÁREA AFECTADA COMPLETA.</p>
                                    <p>SUBI AL MENOS 4 FOTOS DEL DAÑO EN DIFERENTES ANGULOS DE ENFOQUE.</p>
                                </div>
                                <input type="file" id="attachment" name="attachment" accept="image/*,video/*" multiple onChange={handleFileChange} />
                                <small style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sube hasta 5 archivos compatibles. Tamaño máximo por archivo: 10 MB.</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="description">QUERES AGREGAR ALGO MAS SOBRE EL DAÑO O COMO OCURRIO?</label>
                                <textarea id="description" name="description" placeholder="Descripción adicional..."
                                    value={formData.description} onChange={handleInputChange} style={{ minHeight: '100px' }}></textarea>
                            </div>

                            {/* Progress Bar */}
                            {isSubmitting && (
                                <div id="upload-progress" style={{ marginTop: '10px' }}>
                                    <div style={{ backgroundColor: '#333', borderRadius: '5px', width: '100%', height: '10px' }}>
                                        <div id="progress-bar"
                                            style={{ backgroundColor: 'var(--primary-gold)', width: `${uploadProgress}%`, height: '100%', borderRadius: '5px', transition: 'width 0.3s' }}>
                                        </div>
                                    </div>
                                    <p style={{ textAlign: 'center', fontSize: '0.8rem', color: '#aaa', marginTop: '5px' }}>
                                        {uploadProgress < 100 ? 'Subiendo archivos...' : 'Guardando...'}
                                    </p>
                                </div>
                            )}

                            <button type="submit" className="btn-gold" style={{ width: '100%', marginTop: '10px' }} disabled={isSubmitting}>
                                {isSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
                            </button>
                        </form>
                    </div>
                </div>
            </section>
        </>
    );
}
