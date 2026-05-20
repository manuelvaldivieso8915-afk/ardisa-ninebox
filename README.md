# Grupo Ardisa — Plataforma de Gestión de Talento Nine Box

Aplicación web empresarial para gestión de talento humano basada en la metodología Nine Box.

---

## Stack Tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TailwindCSS |
| Backend | Node.js + Express |
| Base de datos | PostgreSQL 14+ |
| Auth | JWT (jsonwebtoken) |
| Gráficas | Recharts |
| Exportación | xlsx (Excel) |

---

## Requisitos Previos

- **Node.js** v18 o superior → https://nodejs.org
- **PostgreSQL** v14 o superior → https://www.postgresql.org
- **npm** v9+

---

## Instalación Paso a Paso

### 1. Clonar / descomprimir el proyecto

```bash
# Si tienes git:
git clone <url-del-repo>
cd ardisa

# O descomprimir el ZIP y entrar a la carpeta
```

---

### 2. Configurar la Base de Datos

#### 2.1 Crear la base de datos en PostgreSQL

```sql
-- Conectarse como superusuario (psql -U postgres)
CREATE DATABASE ardisa_db;
CREATE USER ardisa_user WITH PASSWORD 'ardisa_pass_2024';
GRANT ALL PRIVILEGES ON DATABASE ardisa_db TO ardisa_user;
\c ardisa_db
GRANT ALL ON SCHEMA public TO ardisa_user;
```

#### 2.2 Ejecutar el script de migración

```bash
psql -U ardisa_user -d ardisa_db -f backend/migrations/001_schema.sql
```

Esto crea todas las tablas e inserta:
- 2 usuarios de prueba
- 8 áreas empresariales
- 12 colaboradores de ejemplo
- 17 factores de evaluación

---

### 3. Configurar el Backend

```bash
cd backend
cp .env.example .env
```

Editar `.env` con tus valores:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ardisa_db
DB_USER=ardisa_user
DB_PASSWORD=ardisa_pass_2024
JWT_SECRET=ardisa_super_secret_jwt_key_2024_cambiar_en_produccion
FRONTEND_URL=http://localhost:3000
```

Instalar dependencias e iniciar:

```bash
npm install
npm run dev        # Desarrollo (nodemon)
# ó
npm start          # Producción
```

El backend corre en: **http://localhost:5000**

---

### 4. Configurar el Frontend

```bash
cd ../frontend
npm install
npm run dev
```

El frontend corre en: **http://localhost:3000**

---

## Credenciales de Acceso

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| `admin` | `Admin123!` | Administrador |
| `evaluador1` | `Admin123!` | Evaluador |

---

## Estructura del Proyecto

```
ardisa/
├── backend/
│   ├── migrations/
│   │   └── 001_schema.sql          # Schema completo + datos semilla
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js         # Conexión PostgreSQL
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── employeeController.js
│   │   │   ├── evaluationController.js
│   │   │   ├── dashboardController.js
│   │   │   ├── reportController.js
│   │   │   └── userController.js
│   │   ├── middleware/
│   │   │   └── auth.js             # JWT middleware
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── employees.js
│   │   │   ├── evaluations.js
│   │   │   ├── users.js
│   │   │   ├── dashboard.js
│   │   │   ├── reports.js
│   │   │   ├── areas.js
│   │   │   └── factors.js
│   │   └── index.js                # Entry point Express
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── layout/
    │   │       ├── Layout.jsx
    │   │       ├── Sidebar.jsx
    │   │       └── Header.jsx
    │   ├── context/
    │   │   └── AuthContext.jsx
    │   ├── pages/
    │   │   ├── LoginPage.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── EmployeesPage.jsx
    │   │   ├── EmployeeForm.jsx
    │   │   ├── EmployeeDetail.jsx
    │   │   ├── EvaluationsPage.jsx
    │   │   ├── EvaluationForm.jsx
    │   │   ├── EvaluationDetail.jsx
    │   │   ├── NineBoxPage.jsx
    │   │   ├── ReportsPage.jsx
    │   │   └── UsersPage.jsx
    │   ├── utils/
    │   │   └── api.js              # Axios + interceptors
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css               # Design system completo
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Módulos de la Aplicación

### Dashboard Ejecutivo
- KPIs: total empleados, alto potencial, riesgo, evaluaciones
- Gráfica de distribución por área
- Distribución Nine Box (pie chart)
- Top talento y evaluaciones recientes

### Colaboradores
- Listado con búsqueda y filtros
- Crear / editar / desactivar
- Vista de perfil con historial completo

### Evaluaciones Nine Box
- Formulario dinámico con 17 factores (8 desempeño + 9 potencial)
- Calificación 1–5 con preview visual en tiempo real
- Cálculo automático de posición Nine Box
- Vista detalle con gráfica radar y breakdown de factores

### Matriz Nine Box Visual
- Grid 3×3 interactivo con todos los colaboradores
- Hover con información de puntajes
- Click para abrir perfil
- Filtros por área

### Reportes
- Por área (BarChart desempeño/potencial)
- Por cuadrante Nine Box
- Exportación a Excel (.xlsx)

### Gestión de Usuarios (Solo Admin)
- Crear / editar / eliminar cuentas
- Roles: Administrador / Evaluador

---

## Lógica Nine Box

```
Promedio desempeño → nivel (bajo < 2.5 | medio < 3.75 | alto ≥ 3.75)
Promedio potencial → nivel (bajo | medio | alto)

Posición = ((pot_nivel-1) * 3) + perf_nivel

Grid visual:
┌─────┬─────┬─────┐  ↑
│  7  │  8  │  9  │  │
├─────┼─────┼─────┤  POTENCIAL
│  4  │  5  │  6  │  │
├─────┼─────┼─────┤  ↓
│  1  │  2  │  3  │
└─────┴─────┴─────┘
  → DESEMPEÑO →
```

---

## API Endpoints

```
POST   /api/auth/login
GET    /api/auth/me
PUT    /api/auth/change-password

GET    /api/employees
POST   /api/employees
GET    /api/employees/:id
PUT    /api/employees/:id
DELETE /api/employees/:id

GET    /api/evaluations
POST   /api/evaluations
GET    /api/evaluations/:id
PUT    /api/evaluations/:id
GET    /api/evaluations/ninebox-matrix

GET    /api/dashboard/stats

GET    /api/reports/by-area
GET    /api/reports/by-quadrant
GET    /api/reports/export-excel

GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

GET    /api/areas
GET    /api/factors
```

---

## Variables de Entorno de Producción

```env
NODE_ENV=production
PORT=5000
DB_HOST=<host-produccion>
DB_NAME=ardisa_db
DB_USER=<usuario-db>
DB_PASSWORD=<password-segura>
JWT_SECRET=<secreto-muy-largo-y-aleatorio>
FRONTEND_URL=https://tudominio.com
```

---

## Notas de Seguridad

- Cambiar `JWT_SECRET` antes de ir a producción
- Usar HTTPS en producción
- Configurar CORS correctamente en `src/index.js`
- Usar variables de entorno reales (nunca hardcodear credenciales)
- El password mínimo recomendado: 12 caracteres alfanuméricos con especiales

---

## Soporte

Para dudas técnicas o personalizaciones contactar al equipo de desarrollo de Grupo Ardisa.
