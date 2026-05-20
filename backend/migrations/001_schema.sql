-- ============================================
-- Grupo Ardisa - Nine Box Matrix Schema
-- Version 1.0
-- ============================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================
-- ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO roles (name, description, permissions) VALUES
  ('admin', 'Administrador del sistema', '{"create_users": true, "edit_users": true, "delete_users": true, "create_employees": true, "edit_evaluations": true, "view_reports": true, "export_data": true}'),
  ('evaluador', 'Evaluador de talento', '{"create_employees": true, "edit_evaluations": true, "view_reports": true}'),
  ('viewer', 'Solo lectura', '{"view_reports": true}')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- USUARIOS
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id) DEFAULT 1,
  avatar_url TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÁREAS / DEPARTAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS areas (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE,
  description TEXT,
  head_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO areas (name, code, description) VALUES
  ('Gerencia General', 'GG', 'Dirección ejecutiva'),
  ('Recursos Humanos', 'RH', 'Gestión del talento humano'),
  ('Tecnología', 'TI', 'Sistemas e infraestructura'),
  ('Comercial', 'COM', 'Ventas y desarrollo de negocios'),
  ('Finanzas', 'FIN', 'Contabilidad y finanzas'),
  ('Operaciones', 'OPS', 'Procesos operativos'),
  ('Marketing', 'MKT', 'Estrategia y comunicación'),
  ('Legal', 'LEG', 'Asesoría jurídica')
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- CARGOS
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  level VARCHAR(50), -- directivo, gerencial, coordinacion, operativo
  area_id INTEGER REFERENCES areas(id),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- COLABORADORES
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name VARCHAR(255) NOT NULL,
  document_type VARCHAR(20) DEFAULT 'CC',
  document_number VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  position VARCHAR(255) NOT NULL,
  area_id INTEGER REFERENCES areas(id),
  direct_boss VARCHAR(255),
  hire_date DATE NOT NULL,
  birth_date DATE,
  status VARCHAR(20) DEFAULT 'activo', -- activo, inactivo, retirado
  avatar_url TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- FACTORES DE EVALUACIÓN
-- ============================================
CREATE TABLE IF NOT EXISTS evaluation_factors (
  id SERIAL PRIMARY KEY,
  dimension VARCHAR(20) NOT NULL, -- desempeno, potencial
  name VARCHAR(255) NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) DEFAULT 1.0,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Factores de Desempeño
INSERT INTO evaluation_factors (dimension, name, description, order_index) VALUES
  ('desempeno', 'Cumplimiento de metas', 'Grado de cumplimiento de objetivos establecidos', 1),
  ('desempeno', 'Calidad del trabajo', 'Precisión y excelencia en las tareas realizadas', 2),
  ('desempeno', 'Productividad', 'Eficiencia en el uso del tiempo y recursos', 3),
  ('desempeno', 'Responsabilidad', 'Compromiso con sus obligaciones y plazos', 4),
  ('desempeno', 'Trabajo en equipo', 'Colaboración efectiva con sus pares', 5),
  ('desempeno', 'Orientación a resultados', 'Enfoque en logros medibles', 6),
  ('desempeno', 'Cumplimiento de KPIs', 'Indicadores clave de rendimiento', 7),
  ('desempeno', 'Compromiso', 'Alineación con los valores de la organización', 8),
  -- Factores de Potencial
  ('potencial', 'Liderazgo', 'Capacidad de guiar e inspirar equipos', 1),
  ('potencial', 'Adaptabilidad', 'Facilidad para ajustarse a cambios', 2),
  ('potencial', 'Pensamiento estratégico', 'Visión de largo plazo y análisis complejo', 3),
  ('potencial', 'Aprendizaje rápido', 'Velocidad para adquirir nuevas competencias', 4),
  ('potencial', 'Innovación', 'Generación de ideas y soluciones creativas', 5),
  ('potencial', 'Capacidad de crecimiento', 'Proyección de desarrollo profesional', 6),
  ('potencial', 'Influencia', 'Capacidad de impactar positivamente el entorno', 7),
  ('potencial', 'Comunicación', 'Claridad y efectividad al comunicarse', 8),
  ('potencial', 'Toma de decisiones', 'Criterio y agilidad en decisiones', 9)
ON CONFLICT DO NOTHING;

-- ============================================
-- EVALUACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  evaluator_id UUID REFERENCES users(id),
  period VARCHAR(50) NOT NULL, -- ej: "2024-S1", "2024-Q3"
  period_year INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'borrador', -- borrador, completada, aprobada
  
  -- Puntajes calculados
  performance_score DECIMAL(4,2),
  potential_score DECIMAL(4,2),
  
  -- Clasificación calculada
  performance_level VARCHAR(10), -- bajo, medio, alto
  potential_level VARCHAR(10),   -- bajo, medio, alto
  
  -- Posición en Nine Box (1-9)
  ninebox_position INTEGER,
  ninebox_label VARCHAR(100),
  
  comments TEXT,
  strengths TEXT,
  development_areas TEXT,
  action_plan TEXT,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(employee_id, period)
);

-- ============================================
-- DETALLES DE EVALUACIÓN (respuestas por factor)
-- ============================================
CREATE TABLE IF NOT EXISTS evaluation_details (
  id SERIAL PRIMARY KEY,
  evaluation_id UUID REFERENCES evaluations(id) ON DELETE CASCADE,
  factor_id INTEGER REFERENCES evaluation_factors(id),
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- HISTÓRICO NINE BOX
-- ============================================
CREATE TABLE IF NOT EXISTS ninebox_history (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES employees(id),
  evaluation_id UUID REFERENCES evaluations(id),
  period VARCHAR(50),
  ninebox_position INTEGER,
  performance_score DECIMAL(4,2),
  potential_score DECIMAL(4,2),
  recorded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- NOTIFICACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_employees_area ON employees(area_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_name ON employees USING gin(full_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_evaluations_employee ON evaluations(employee_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_period ON evaluations(period_year, period);
CREATE INDEX IF NOT EXISTS idx_evaluations_ninebox ON evaluations(ninebox_position);
CREATE INDEX IF NOT EXISTS idx_eval_details_evaluation ON evaluation_details(evaluation_id);

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
  BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER evaluations_updated_at
  BEFORE UPDATE ON evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- FUNCIÓN CALCULAR NINE BOX POSITION
-- ============================================
-- 7 | 8 | 9
-- 4 | 5 | 6
-- 1 | 2 | 3
-- Eje X = Desempeño (1=bajo, 2=medio, 3=alto)
-- Eje Y = Potencial (1=bajo, 2=medio, 3=alto)
CREATE OR REPLACE FUNCTION calculate_ninebox_position(
  performance_level VARCHAR,
  potential_level VARCHAR
) RETURNS INTEGER AS $$
DECLARE
  perf_val INTEGER;
  pot_val INTEGER;
BEGIN
  perf_val := CASE performance_level
    WHEN 'bajo' THEN 1
    WHEN 'medio' THEN 2
    WHEN 'alto' THEN 3
    ELSE 2
  END;
  
  pot_val := CASE potential_level
    WHEN 'bajo' THEN 1
    WHEN 'medio' THEN 2
    WHEN 'alto' THEN 3
    ELSE 2
  END;
  
  RETURN ((pot_val - 1) * 3) + perf_val;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- DATOS DE PRUEBA
-- ============================================

-- Usuario administrador (password: Admin123!)
INSERT INTO users (username, email, password_hash, full_name, role_id) VALUES
  ('admin', 'admin@grupoardisa.com', '$2a$10$rOzJqRNkb0mGpJH9WtJ0Ae2aCpEhAIPBHOBJb.VBOlNHmGz0Rb9O2', 'Administrador Sistema', 1),
  ('evaluador1', 'evaluador@grupoardisa.com', '$2a$10$rOzJqRNkb0mGpJH9WtJ0Ae2aCpEhAIPBHOBJb.VBOlNHmGz0Rb9O2', 'María González', 2)
ON CONFLICT (username) DO NOTHING;

-- Colaboradores de prueba
INSERT INTO employees (full_name, document_number, email, position, area_id, direct_boss, hire_date, status) VALUES
  ('Carlos Andrés Martínez', '12345678', 'cmartinez@ardisa.com', 'Gerente Comercial', 4, 'Director General', '2019-03-15', 'activo'),
  ('Laura Patricia Rodríguez', '23456789', 'lrodriguez@ardisa.com', 'Coordinadora de RRHH', 2, 'Gerente RRHH', '2020-06-01', 'activo'),
  ('Juan Pablo Torres', '34567890', 'jtorres@ardisa.com', 'Desarrollador Senior', 3, 'Gerente TI', '2021-01-10', 'activo'),
  ('Ana María Vega', '45678901', 'avega@ardisa.com', 'Analista Financiero', 5, 'Gerente Financiero', '2018-08-20', 'activo'),
  ('Diego Fernando López', '56789012', 'dlopez@ardisa.com', 'Director de Operaciones', 6, 'CEO', '2017-05-12', 'activo'),
  ('Sandra Milena Herrera', '67890123', 'sherrera@ardisa.com', 'Ejecutiva de Ventas', 4, 'Gerente Comercial', '2022-02-28', 'activo'),
  ('Andrés Felipe Gómez', '78901234', 'agomez@ardisa.com', 'Arquitecto de Software', 3, 'Gerente TI', '2020-11-05', 'activo'),
  ('Patricia Elena Mora', '89012345', 'pmora@ardisa.com', 'Jefe de Marketing', 7, 'Director General', '2019-07-18', 'activo'),
  ('Roberto Emilio Sánchez', '90123456', 'rsanchez@ardisa.com', 'Contador Senior', 5, 'Gerente Financiero', '2016-09-30', 'activo'),
  ('Catalina Reyes Jiménez', '01234567', 'creyes@ardisa.com', 'Asesora Legal', 8, 'Director General', '2021-04-14', 'activo'),
  ('Miguel Ángel Díaz', '11223344', 'mdiaz@ardisa.com', 'Analista de Datos', 3, 'Gerente TI', '2022-07-01', 'activo'),
  ('Valentina Cruz Ortiz', '22334455', 'vcruz@ardisa.com', 'Especialista en Marca', 7, 'Jefe Marketing', '2023-01-15', 'activo')
ON CONFLICT (document_number) DO NOTHING;
