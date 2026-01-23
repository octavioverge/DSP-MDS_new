-- ==============================================================================
-- TABLA DE CALENDARIO - DSP-MDS
-- ==============================================================================
-- Este script crea la tabla de eventos del calendario y agrega
-- el campo scheduled_date a service_puntual
-- ==============================================================================

-- 1. AGREGAR CAMPO DE FECHA AGENDADA A SERVICE_PUNTUAL
-- Este campo almacena cuándo está agendado el turno del cliente
ALTER TABLE public.service_puntual 
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMP WITH TIME ZONE;

-- Índice para búsquedas rápidas por fecha agendada
CREATE INDEX IF NOT EXISTS idx_service_puntual_scheduled_date 
ON public.service_puntual(scheduled_date);

-- 2. CREACIÓN DE TABLA DE EVENTOS DEL CALENDARIO
-- Esta tabla almacena eventos personalizados (no vinculados a un service_puntual)
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Información del Evento
    title TEXT NOT NULL,
    description TEXT,
    event_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE, -- Opcional, para eventos con duración
    
    -- Categorización
    event_type TEXT DEFAULT 'general', -- general, recordatorio, reunion, otro
    color TEXT DEFAULT '#D4AF37', -- Color para mostrar en el calendario
    
    -- Vinculación opcional a un cliente o service_puntual
    -- (NULL si es un evento manual sin vínculo)
    service_puntual_id UUID REFERENCES public.service_puntual(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    
    -- Estado del evento
    is_completed BOOLEAN DEFAULT false,
    notes TEXT
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_calendar_events_date ON public.calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_calendar_events_service ON public.calendar_events(service_puntual_id);

-- 3. POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

-- Políticas para permitir acceso (ajustar según necesidad)
CREATE POLICY "Enable read access for all users" ON "public"."calendar_events" FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON "public"."calendar_events" FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON "public"."calendar_events" FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON "public"."calendar_events" FOR DELETE USING (true);

-- 4. POLÍTICAS DE DELETE PARA SERVICE_PUNTUAL (si no existen)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_puntual' AND policyname = 'Enable delete access for all users'
    ) THEN
        CREATE POLICY "Enable delete access for all users" ON "public"."service_puntual" FOR DELETE USING (true);
    END IF;
END $$;
