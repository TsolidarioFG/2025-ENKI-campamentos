````markdown
# ENKI Camp Registration Management Application

<p align="center">
  <img src="docs/assets/enki-logo.png" alt="ENKI logo" width="180"/>
</p>

<p align="center">
  <strong>Web application for managing registrations for ENKI's inclusive summer camps.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Frontend-React-blue" alt="React"/>
  <img src="https://img.shields.io/badge/Backend-Node.js-green" alt="Node.js"/>
  <img src="https://img.shields.io/badge/Database-PostgreSQL-blue" alt="PostgreSQL"/>
  <img src="https://img.shields.io/badge/ORM-Prisma-2D3748" alt="Prisma"/>
  <img src="https://img.shields.io/badge/Deployment-Docker-2496ED" alt="Docker"/>
</p>

---

## Overview

This repository contains the source code of the web application developed as a Final Degree Project for the management of registrations for ENKI's inclusive summer camps.

ENKI organizes inclusive activities and summer camps for children with and without disabilities. Before this project, the registration process relied on generic forms and spreadsheets, which made it difficult to manage participant data, selected weeks, payments, discounts, disability-related information and administrative follow-up.

This application provides a tailored web system adapted to ENKI's registration workflow. It includes a public registration form for families or legal guardians, a token-based extra form for participants with additional support needs, and a private administration panel for ENKI staff.

---

## Screenshots

### Public registration form

![Public registration form](docs/screenshots/public-registration-form.png)

### Extra form for participants with support needs

![Extra form](docs/screenshots/extra-form.png)

### Administration dashboard

![Administration dashboard](docs/screenshots/admin-dashboard.png)

### Inscription detail page

![Inscription detail](docs/screenshots/inscription-detail.png)

### Camp week management

![Camp week management](docs/screenshots/week-management.png)

> The images above should be stored in `docs/screenshots/`.  
> The ENKI logo should be stored in `docs/assets/enki-logo.png`.

---

## Main Features

### Public area

- Public registration form for summer camp participants.
- Registration of participant, guardian, address and authorized people information.
- Selection of one or more camp weeks.
- Selection of additional services such as breakfast, lunch and early arrival.
- Support for participants with and without disabilities.
- Automatic calculation of expected payment amounts.
- Confirmation page after registration submission.
- PDF download of the submitted registration.

### Extra form

- Token-based access to a complementary form.
- Additional information for participants with support needs.
- Collection of information about routines, autonomy, mobility, communication, food sensitivities, sport, play and fears.
- Secure association between the extra form and the participant.

### Administration panel

- Private login for ENKI staff.
- Protected administration routes.
- Dashboard with registration information.
- Registration listing and detail view.
- Edition of participant, guardian, address and complementary data.
- Management of camp weeks and available places.
- Management of general places and disability places.
- Registration status management.
- Payment tracking and pending amount management.
- Extra payments for breakfast, lunch, early arrival or other concepts.
- Discount management.
- User management.
- Global application settings.
- CSV export for camp week information.
- Automatic handling of expired unpaid pending reservations.

---

## Technology Stack

### Frontend

- React
- JavaScript
- JSX
- CSS
- Vite
- React Router
- npm

### Backend

- Node.js
- Express
- Prisma
- PostgreSQL
- Zod
- bcrypt
- JSON Web Tokens
- CORS

### Deployment and development tools

- Docker
- Docker Compose
- Git
- GitHub
- pgAdmin
- SoapUI

---

## Project Structure

```text
2025-ENKI-campamentos/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── schemas/
│   │   └── services/
│   ├── scripts/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
│
├── docs/
│   ├── assets/
│   └── screenshots/
│
├── docker-compose.yml
└── README.md
````

The frontend contains the React application, including the public registration form, the extra form, the login page and the administration panel.

The backend contains the Express API, validation schemas, controllers, middleware, services, Prisma configuration and initialization scripts.

---

## Running the Project with Docker

The recommended way to run the complete application is using Docker Compose.

From the root of the project:

```bash
docker compose up -d --build
```

Check that the containers are running:

```bash
docker compose ps
```

The application will be available at:

```text
http://localhost:8080
```

The backend API is accessed through the frontend reverse proxy using:

```text
/api
```

---

## Database Setup with Docker

After starting the containers, apply the Prisma schema:

```bash
docker compose exec backend npx prisma db push
```

Create the initial administrator account:

```bash
docker compose exec backend node scripts/admin.creation.js
```

Create the default permanent discounts:

```bash
docker compose exec backend node scripts/discount.creation.js
```

If the project uses a different script name for administrator creation, run:

```bash
docker compose exec backend node scripts/createAdmin.js
```

---

## Rebuilding the Project

To rebuild the containers without deleting the database:

```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

To rebuild everything and delete the database volume:

```bash
docker compose down -v
docker compose build --no-cache
docker compose up -d
```

---

## Local Development without Docker

### Backend

Create a `.env` file inside the `backend/` folder:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1d"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

Install dependencies and start the backend:

```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```

### Frontend

Create a `.env` file inside the `frontend/` folder:

```env
VITE_API_URL="http://localhost:3000/api"
```

Install dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend development server will be available at:

```text
http://localhost:5173
```

---

## Initial Data

The project includes initialization logic for essential system data:

* Initial superadministrator account.
* Global application settings.
* Default permanent discounts.

These scripts should be executed after the database has been created and configured.

---

## Testing

During development, backend endpoints were tested using SoapUI before the frontend was fully completed. The final application was also tested manually through the browser, validating the main workflows:

* Registration creation.
* Week selection and capacity management.
* Registration in available weeks.
* Registration in waitlist when there are no available places.
* Registration for participants with and without disabilities.
* Extra form access by secure token.
* Edition of participant, guardian and address data.
* Edition of extra form information.
* Payment registration.
* Extra payments for breakfast, lunch, early arrival and other concepts.
* Discount application.
* Camp week activation and deactivation.
* Camp and form activation or deactivation.
* CSV export.
* Administration panel access.
* Protected routes.

---

## Notes

This project was developed as an academic Final Degree Project. It is focused on the management of inclusive summer camp registrations for ENKI and does not aim to replace all the digital tools used by the organization.

The payment gateway itself is outside the scope of the project. The application stores and manages payment information, but the actual payment operation is performed externally.

The Docker configuration provides a reproducible execution environment and a basis for future production deployment, but the application has not been deployed on a final public production server as part of this project.

---

## Author

**Raquel Canabal Fuentes**
Final Degree Project
University of A Coruña

```
```
