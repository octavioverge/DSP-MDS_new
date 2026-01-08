-- IMPORTANTE: Antes de correr esto, asegurate de que los nombres de las restricciones (constraints) sean correctos.
-- Por defecto Supabase/Postgres suelen nombrarlos como "tabla_columna_fkey".

-- 1. Modificar la tabla de presupuestos puntuales (service_puntual)
-- Primero borramos la restricción actual (que impide borrar el cliente si tiene servicios)
ALTER TABLE service_puntual
DROP CONSTRAINT IF EXISTS service_puntual_client_id_fkey;

-- Agregamos la nueva restricción con ON DELETE CASCADE
ALTER TABLE service_puntual
ADD CONSTRAINT service_puntual_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;


-- 2. Modificar la tabla de planes de cobertura (service_cobertura)
ALTER TABLE service_cobertura
DROP CONSTRAINT IF EXISTS service_cobertura_client_id_fkey;

ALTER TABLE service_cobertura
ADD CONSTRAINT service_cobertura_client_id_fkey
FOREIGN KEY (client_id)
REFERENCES clients(id)
ON DELETE CASCADE;


-- EXPLICACIÓN:
-- Ahora, cuando ejecutes "DELETE FROM clients WHERE id = '...'", 
-- automáticamente se borrarán todas las filas en service_puntual y service_cobertura
-- que pertenezcan a ese cliente.
