# ENKI Camp Registration Management Application

This repository contains the source code of the web application developed as a Final Degree Project for the management of registrations for ENKI's inclusive summer camps.

The application replaces a manual workflow based on generic forms and spreadsheets with a custom web system adapted to ENKI's registration process. It includes a public registration form for families or legal guardians and a private administration panel for ENKI staff.

## Main Features

* Public registration form for summer camp participants.
* Registration of participant, guardian, address and authorized people information.
* Selection of one or more camp weeks.
* Selection of additional services such as breakfast, lunch and early arrival.
* Management of general places and disability places.
* Calculation of expected payment amounts.
* Payment tracking and pending amount management.
* Discount management.
* Token-based extra form for additional participant information.
* Private administration panel for ENKI staff.
* Authentication and protected administration routes.
* Camp week, user, price, discount and registration management.
* Automatic handling of expired unpaid pending reservations.

## Technology Stack

### Frontend

* React
* JavaScript
* JSX
* CSS
* Vite
* React Router
* npm

### Backend

* Node.js
* Express
* Prisma
* PostgreSQL
* Zod
* bcrypt
* JSON Web Tokens
* CORS

### Development and Testing Tools

* Git
* GitHub
* pgAdmin
* SoapUI

## Project Structure

The project is divided into two main parts:

```text
frontend/
backend/
```

The frontend contains the React application, including the public registration form, the extra form, the login page and the administration panel.

The backend contains the Express API, validation schemas, controllers, middleware, services, Prisma configuration and initialization scripts.

## Environment Variables

The application requires environment variables for both the backend and frontend.

### Backend environment variables

Create a `.env` file in the backend folder with values similar to the following:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
JWT_SECRET="your_jwt_secret"
JWT_EXPIRES_IN="1d"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
```

### Frontend environment variables

Create a `.env` file in the frontend folder with values similar to the following:

```env
VITE_API_URL="http://localhost:3000/api"
```

The exact values may change depending on the local or deployment environment.

## Installation

Clone the repository:

```bash
git clone https://github.com/TsolidarioFG/2025-ENKI-campamentos.git
cd 2025-ENKI-campamentos
```

Install backend dependencies:

```bash
cd backend
npm install
```

Install frontend dependencies:

```bash
cd ../frontend
npm install
```

## Database Setup

The backend uses PostgreSQL and Prisma.

After configuring the backend `.env` file, generate the Prisma client:

```bash
cd backend
npx prisma generate
```

Apply the database schema:

```bash
npx prisma migrate dev
```

or, during development:

```bash
npx prisma db push
```

## Initial Data

The project includes initialization logic for essential system data, such as:

* Initial superadministrator account.
* Global application settings.
* Default permanent discounts.

These scripts should be executed after the database has been created and configured.

## Running the Application

Run the backend development server:

```bash
cd backend
npm run dev
```

Run the frontend development server:

```bash
cd frontend
npm run dev
```

The frontend will be available through the Vite development server, and it will communicate with the backend API using the configured `VITE_API_URL`.

## Testing

During development, backend endpoints were tested using SoapUI before the frontend was fully completed. The final application was also tested manually through the browser, validating the main workflows:

* Registration creation.
* Validation of invalid data.
* Week selection and capacity management.
* Payment updates.
* Discount management.
* Extra form access by token.
* Administration panel access.
* Protected routes.

## Notes

This project was developed as an academic Final Degree Project. It is focused on the management of inclusive summer camp registrations for ENKI and does not aim to replace all the digital tools used by the organization.

The payment gateway itself is outside the scope of the project. The application stores and manages payment information, but the actual payment operation is performed externally.
