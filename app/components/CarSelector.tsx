'use client';

import React, { useState, useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment, useGLTF, Html, Center } from '@react-three/drei';
import * as THREE from 'three';

interface CarSelectorProps {
    onSelectionChange: (selectedParts: string[]) => void;
}

// Model Component
const CarModel = ({ selectedParts, onToggle }: { selectedParts: string[], onToggle: (part: string) => void }) => {

    // SUV Model
    const { scene } = useGLTF('/assets/suv_car.glb');
    const carScene = React.useMemo(() => {
        const c = scene.clone();
        return c;
    }, [scene]);

    // Clickable Zone Helper
    const ClickZone = ({ name, position, scale }: any) => {
        const isSelected = selectedParts.includes(name);
        const [hovered, setHovered] = useState(false);

        return (
            <mesh
                position={position}
                scale={scale}
                onClick={(e) => {
                    e.stopPropagation();
                    onToggle(name);
                }}
                onPointerOver={(e) => {
                    e.stopPropagation();
                    setHovered(true);
                    document.body.style.cursor = 'pointer';
                }}
                onPointerOut={(e) => {
                    setHovered(false);
                    document.body.style.cursor = 'auto';
                }}
                visible={isSelected || hovered} // Only render when relevant (optimization)
            >
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial
                    color={isSelected ? '#D4AF37' : '#ffffff'}
                    transparent
                    opacity={isSelected ? 0.5 : 0.2}
                    depthWrite={false}
                    side={THREE.DoubleSide}
                />
                {isSelected && (
                    <lineSegments>
                        <edgesGeometry args={[new THREE.BoxGeometry(1, 1, 1)]} />
                        <lineBasicMaterial color="white" linewidth={2} />
                    </lineSegments>
                )}
            </mesh>
        );
    };

    return (
        <group>
            {/*
        Using Center to automatically center the model.
        Trying scale=1 first as many models are in meters.
        If it's huge, we'll see it clipping or filling screen.
      */}
            <Center>
                <primitive object={carScene} scale={0.5} rotation={[0, -Math.PI / 4, 0]} />
            </Center>

            {/*
         INTERACTION ZONES (Approximate for an SUV)
         Assumes car is roughly centered at 0,0,0
         Scales are approximate to cover the volume of a standard SUV
      */}

            {/* Hood */}
            <ClickZone name="Capot" position={[0, 0.7, 1.6]} scale={[1.4, 0.5, 1.2]} />

            {/* Roof */}
            <ClickZone name="Techo" position={[0, 1.55, -0.2]} scale={[1.3, 0.2, 1.6]} />

            {/* Trunk (Back) */}
            <ClickZone name="Baúl" position={[0, 0.9, -2.1]} scale={[1.3, 0.8, 0.6]} />

            {/* Front Bumper */}
            <ClickZone name="Paragolpes Delantero" position={[0, 0.3, 2.2]} scale={[1.4, 0.5, 0.5]} />

            {/* Rear Bumper */}
            <ClickZone name="Paragolpes Trasero" position={[0, 0.3, -2.4]} scale={[1.4, 0.5, 0.5]} />

            {/* Doors Left */}
            <ClickZone name="Puerta Delantera Izq" position={[0.8, 0.8, 0.5]} scale={[0.2, 0.9, 0.9]} />
            <ClickZone name="Puerta Trasera Izq" position={[0.8, 0.8, -0.5]} scale={[0.2, 0.9, 0.9]} />

            {/* Doors Right */}
            <ClickZone name="Puerta Delantera Der" position={[-0.8, 0.8, 0.5]} scale={[0.2, 0.9, 0.9]} />
            <ClickZone name="Puerta Trasera Der" position={[-0.8, 0.8, -0.5]} scale={[0.2, 0.9, 0.9]} />

            {/* Fenders Front */}
            <ClickZone name="Guardabarros Delantero Izq" position={[0.8, 0.7, 1.5]} scale={[0.3, 0.6, 1.0]} />
            <ClickZone name="Guardabarros Delantero Der" position={[-0.8, 0.7, 1.5]} scale={[0.3, 0.6, 1.0]} />

            {/* Fenders Rear */}
            <ClickZone name="Guardabarros Trasero Izq" position={[0.8, 0.9, -1.6]} scale={[0.3, 0.7, 1.0]} />
            <ClickZone name="Guardabarros Trasero Der" position={[-0.8, 0.9, -1.6]} scale={[0.3, 0.7, 1.0]} />

        </group>
    );
};

export default function CarSelector({ onSelectionChange }: CarSelectorProps) {
    const [selectedParts, setSelectedParts] = useState<string[]>([]);

    // Use a ref to track if a toggle action recently happened to prevent race conditions
    // or simple state updates are usually fine in React unless strictly strict mode double invokes.
    // The user reported "often fails when selecting more than one". 
    // This is typically due to event propagation or state overriding.
    // We use functional state update in handleToggle to be safe.

    const handleToggle = (partName: string) => {
        setSelectedParts(prev => {
            let newSelected;
            if (prev.includes(partName)) {
                newSelected = prev.filter((p) => p !== partName);
            } else {
                newSelected = [...prev, partName];
            }

            // Notify parent inside the callback or effect?
            // Ideally effect, but for now simple direct call is okay if consistent.
            // Better to use useEffect to sync with parent if parent needs true sync,
            // but passing back up immediately is standard for uncontrolled compounds.
            // We will call parent outside to avoid render loop issues if parent updates prop.
            return newSelected;
        });
    };

    // Sync with parent when state changes
    React.useEffect(() => {
        if (onSelectionChange) {
            onSelectionChange(selectedParts);
        }
    }, [selectedParts]); // eslint-disable-line

    return (
        <div className="car-selector-container" style={{ height: '450px', width: '100%', position: 'relative', background: 'radial-gradient(circle at center, #2a2a2a 0%, #111 100%)', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>
            <small className="car-selector-title" style={{ position: 'absolute', top: '15px', left: '0', width: '100%', pointerEvents: 'none', zIndex: 10, textAlign: 'center', color: '#ccc', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.8rem' }}>
                <i className="fas fa-cube"></i> Rotá para ver 360° | <i className="fas fa-hand-pointer"></i> Clic para seleccionar
            </small>

            <Canvas shadows camera={{ position: [3.5, 2.0, 3.5], fov: 45 }}>
                {/* Improved Lighting for realism */}
                <ambientLight intensity={2.0} />
                <spotLight position={[10, 10, 10]} angle={0.3} penumbra={1} intensity={2} castShadow />
                <directionalLight position={[-5, 5, -5]} intensity={2} color="#ffffff" />

                <Suspense fallback={<Html center><div style={{ color: '#D4AF37', textAlign: 'center' }}>Cargando Modelo 3D...<br /><small>Por favor espere</small></div></Html>}>
                    <CarModel selectedParts={selectedParts} onToggle={handleToggle} />
                    <Environment preset="night" />
                    <ContactShadows position={[0, -0.6, 0]} opacity={0.6} scale={10} blur={2} far={1} />
                </Suspense>

                <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2 - 0.1} />
            </Canvas>

            {/* Selected Parts Overlay */}
            <div style={{ position: 'absolute', bottom: '20px', left: '0', width: '100%', pointerEvents: 'none', display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '5px', padding: '0 20px' }}>
                {selectedParts.length === 0 ? (
                    <span style={{ color: '#555', fontStyle: 'italic', fontSize: '0.9rem' }}>Ninguna parte seleccionada</span>
                ) : (
                    selectedParts.map(part => (
                        <span key={part} style={{
                            background: 'rgba(212, 175, 55, 0.2)',
                            border: '1px solid #D4AF37',
                            color: '#D4AF37',
                            padding: '4px 10px',
                            borderRadius: '15px',
                            fontSize: '0.8rem',
                            backdropFilter: 'blur(2px)'
                        }}>
                            {part}
                        </span>
                    ))
                )}
            </div>
        </div>
    );
}
