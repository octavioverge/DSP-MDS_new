-- =====================================================
-- TABLA DE INSUMOS - DSP-MDS
-- Registro de gastos y compras de insumos del negocio
-- =====================================================

-- Crear la tabla de insumos
CREATE TABLE IF NOT EXISTS insumos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Información del producto
    producto VARCHAR(255) NOT NULL,
    descripcion TEXT,
    cantidad INTEGER DEFAULT 1,
    
    -- Información de costos
    precio DECIMAL(10, 2) NOT NULL,
    
    -- Información del proveedor/vendedor
    vendedor VARCHAR(255) NOT NULL,
    
    -- Información del empleado que realizó la compra
    empleado VARCHAR(255) NOT NULL,
    
    -- Fecha de compra (puede ser diferente a created_at)
    fecha_compra DATE NOT NULL,
    
    -- Categoría del insumo (opcional, para filtrado)
    categoria VARCHAR(100),
    
    -- Método de pago (opcional)
    metodo_pago VARCHAR(50),
    
    -- Notas adicionales
    notas TEXT,
    
    -- Soft delete: NULL = activo, fecha = eliminado
    deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Crear índices para optimizar búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_insumos_fecha_compra ON insumos(fecha_compra DESC);
CREATE INDEX IF NOT EXISTS idx_insumos_empleado ON insumos(empleado);
CREATE INDEX IF NOT EXISTS idx_insumos_vendedor ON insumos(vendedor);
CREATE INDEX IF NOT EXISTS idx_insumos_categoria ON insumos(categoria);
CREATE INDEX IF NOT EXISTS idx_insumos_deleted_at ON insumos(deleted_at);

-- Habilitar Row Level Security (RLS) si es necesario
-- ALTER TABLE insumos ENABLE ROW LEVEL SECURITY;

-- Política de acceso público (para desarrollo, ajustar en producción)
-- CREATE POLICY "Acceso público a insumos" ON insumos FOR ALL USING (true);

-- =====================================================
-- COMENTARIOS DE LA TABLA
-- =====================================================
COMMENT ON TABLE insumos IS 'Registro de gastos y compras de insumos del negocio DSP-MDS';
COMMENT ON COLUMN insumos.producto IS 'Nombre del producto o insumo comprado';
COMMENT ON COLUMN insumos.descripcion IS 'Descripción detallada del producto';
COMMENT ON COLUMN insumos.cantidad IS 'Cantidad de unidades compradas';
COMMENT ON COLUMN insumos.precio IS 'Precio total de la compra';
COMMENT ON COLUMN insumos.vendedor IS 'Nombre del proveedor o vendedor';
COMMENT ON COLUMN insumos.empleado IS 'Nombre del empleado que realizó la compra';
COMMENT ON COLUMN insumos.fecha_compra IS 'Fecha en que se realizó la compra';
COMMENT ON COLUMN insumos.categoria IS 'Categoría del insumo (ej: herramientas, consumibles, limpieza)';
COMMENT ON COLUMN insumos.metodo_pago IS 'Método de pago utilizado (efectivo, transferencia, tarjeta)';
COMMENT ON COLUMN insumos.notas IS 'Observaciones o notas adicionales sobre la compra';
COMMENT ON COLUMN insumos.deleted_at IS 'Fecha de eliminación lógica. NULL = registro activo, con valor = en papelera';

-- =====================================================
-- MIGRACIÓN: Si la tabla ya existe, agregar el campo deleted_at
-- =====================================================
-- ALTER TABLE insumos ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
-- CREATE INDEX IF NOT EXISTS idx_insumos_deleted_at ON insumos(deleted_at);
