# HATBOY - Attendance Management System

A professional Attendance Management System built with the MERN stack.

## Features

- **Role-Based Access Control**: Super Admin, Admin, Employee.
- **Attendance Marking**: Webcam capture, Geolocation tagging, Timestamp.
- **Dashboards**: Dedicated dashboards for each role with charts and stats.
- **Reports**: Excel export for attendance records.
- **Rectification**: Managed rectification flow with limits.
- **Notifications**: 11:00 AM reminder.

## Tech Stack

- **Frontend**: React, Tailwind CSS, Chart.js, Axios.
- **Backend**: Node.js, Express, MongoDB, Mongoose, JWT.
- **Tools**: Multer (File Uploads), ExcelJS (Reports), Node-cron (Scheduling).

## Prerequisites

- Node.js installed.
- MongoDB installed and running locally on `mongodb://localhost:27017`.

## Setup & Installation

### 1. Backend

```bash
cd server
npm install
# Start the server
npm start
# Server runs on http://localhost:5000
```

### 2. Frontend

```bash
cd client
npm install
# Start the client
npm run dev
# Client runs on http://localhost:5173
```

## Getting Started

1.  Make sure MongoDB is running.
2.  Start the Backend server.
3.  Start the Frontend client.
4.  Open the browser at `http://localhost:5173`.
5.  **First Run**: Click "Initialize System (First Run Only)" on the login page to create the Super Admin account.
6.  **Super Admin Credentials**:
    -   Email: `admin@planningguru.com`
    -   Password: `it is safe`
7.  Login and start creating Admins and Employees.

## Project Structure

- `server/`: Backend API and Database Logic.
- `client/`: Frontend React Application.
- `server/uploads/`: Stores attendance images locally.

## License

Internal Use Only - Planning Guru


