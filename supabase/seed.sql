-- 1. Insertar Categorías de prueba
INSERT INTO "Category" (id_category, name, description, active) VALUES
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Redes e Infraestructura', 'Fallas de conectividad, switches, WiFi y cableado estructurado', true),
('b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12', 'Sistemas y Software', 'Errores en sistemas operativos, licencias y suites de oficina', true),
('c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a13', 'Equipos y Hardware', 'Mantenimiento y fallas en computadoras, impresoras y periféricos', true),
('d0eebc99-9c0b-4ef8-bb6d-6bb9bd380a14', 'Cuentas y Accesos', 'Gestión de credenciales, roles y permisos de usuarios', true)
ON CONFLICT (name) DO NOTHING;

-- 2. Insertar Usuarios de prueba
INSERT INTO "User" (id_user, name, email, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Jay Salas (DBA)', 'jay.salas@unipoli.edu.mx', 'ADMIN'),
('22222222-2222-2222-2222-222222222222', 'Soporte Técnico Auxiliar', 'soporte.aux@unipoli.edu.mx', 'TECNICO_SOPORTE'),
('33333333-3333-3333-3333-333333333333', 'Usuario Final Demo', 'usuario.demo@unipoli.edu.mx', 'USER_FINAL')
ON CONFLICT (email) DO NOTHING;

-- 3. Insertar Tickets de prueba
INSERT INTO "Ticket" (id_ticket, title, description, type, impact, urgency, priority, status, category_id, created_by, assigned_to) VALUES
(
  'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a15',
  'Falla de conexión en Laboratorio de Cómputo 2',
  'Los equipos de la fila b no reciben dirección IP por DHCP. Se requiere revisión del switch principal.',
  'Incidencia',
  'HIGH',
  'HIGH',
  'HIGH',
  'OPEN',
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222'
),
(
  'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a16',
  'Solicitud de instalación de software de modelado',
  'Se solicita la instalación de herramientas de minería de datos en el equipo asignado al área de desarrollo.',
  'Requerimiento',
  'LOW',
  'MEDIUM',
  'LOW',
  'IN_PROGRESS',
  'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a12',
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222'
);