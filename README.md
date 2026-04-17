# ENKI Campamentos - Backend

Backend del sistema de gestión de campamentos inclusivos ENKI, desarrollado con **Node.js**, **Express** y **Prisma**.

---

## Tecnologías utilizadas

- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- node-cron

---

## Cómo ejecutar el proyecto

### 1. Clonar el repositorio

    git clone https://github.com/TsolidarioFG/2025-ENKI-campamentos.git
    cd 2025-ENKI-campamentos/proyecto/backend

### 2. Instalar dependencias

    npm install

### 3. Configurar variables de entorno

Crear un archivo `.env` en la carpeta `backend` con al menos estas variables:

    DATABASE_URL="postgresql://USUARIO:CONTRASEÑA@HOST:PUERTO/NOMBRE_BD?schema=public"
    PORT=3000
    JWT_SECRET=clave_secreta

### 4. Aplicar migraciones de base de datos

    npx prisma migrate dev
    npx prisma generate

### Si se quiere partir de una base de datos limpia

    npx prisma migrate reset
    npx prisma generate

### 5. Crear el superadmin inicial

    node src/scripts/createAdmin.js

### 6. Iniciar el servidor

    npm run dev

El backend quedará disponible en:

    http://localhost:3000

---

## Endpoints principales

### Auth

- `POST /api/auth/login`
- `GET /api/auth/me`

### Usuarios

- `GET /api/users`
- `POST /api/users`
- `PATCH /api/users/:id/status`

### Campamentos

- `GET /api/summercamps`
- `POST /api/summercamps`
- `PATCH /api/summercamps/:id`
- `DELETE /api/summercamps/:id`

### Semanas

- `GET /api/weeks`
- `POST /api/weeks`
- `PATCH /api/weeks/summercamp/:summerCampId/week/:number`
- `DELETE /api/weeks/summercamp/:summerCampId/week/:number`

### Precios

- `GET /api/prices`
- `POST /api/prices`
- `PATCH /api/prices`
- `POST /api/payments/extra`

### Inscripciones

- `POST /api/inscriptions`
- `GET /api/inscriptions`
- `GET /api/inscriptions/:id`
- `PATCH /api/inscriptions/:id/cancel`

### Reservas semanales

- `GET /api/signedup/week/:weekId`
- `GET /api/signedup/week/:weekId/waitlist`
- `PATCH /api/signedup/inscription/:inscriptionId/week/:weekId/status`
- `POST /api/signedup/cancel-expired`

### Administración

- `GET /api/admin/dashboard/:summerCampId`
- `GET /api/admin/inscriptions-table`
- `GET /api/admin/pending-payments`
- `GET /api/admin/debtors`

### Ajustes globales

- `GET /api/settings`
- `PATCH /api/settings`

---

## Autenticación y roles

El sistema utiliza **JWT**.

### Roles disponibles

- `SUPERADMIN`
- `ADMIN`
- `USER`

### Restricciones actuales

- Solo puede existir un `SUPERADMIN`
- Los usuarios creados desde la API solo pueden ser `ADMIN` o `USER`
- Las rutas administrativas están protegidas por autenticación y rol

---

## Automatizaciones

El sistema incluye una tarea programada con `node-cron` para revisar reservas `PENDING` caducadas y cancelarlas automáticamente según la configuración global del sistema.

---

## Estado actual del proyecto

Actualmente el backend cubre:

- gestión de campamentos
- semanas y precios
- inscripciones
- estados de reserva
- pagos iniciales y pagos extra
- autenticación y roles
- herramientas administrativas básicas

---

## Errores conocidos / trabajo pendiente

- Falta implementar completamente la lógica de descuentos
- Hay que revisar y validar en profundidad la transición automática de `PENDING` a `ACCEPTED` cuando se paga una reserva y cómo se registrará el pago
- Hay que revisar y validar en profundidad la cancelación automática de reservas `PENDING` cuando no se pagan en el tiempo configurado
- Faltan validaciones de formato para algunos campos:
  - teléfono
  - DNI
  - health card
  - email
- Falta implementar toda la lógica y endpoints del `ExtraForm`
- Faltan comprobaciones de casos específicos y casos límite en varias partes del sistema
- Falta revisar en detalle el comportamiento de:
  - `DELETE`
  - cancelaciones
  - relaciones encadenadas al cancelar o eliminar datos
- Falta implementar edición de información ya guardada en una inscripción, para corregir errores introducidos en el formulario por el usuario
- Falta terminar la validación completa de todos los endpoints con SoapUI
- El frontend todavía no está implementado
