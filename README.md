# Employees Attendance Management System

Live Demo: https://attendance-management-system-client-tttw.onrender.com/login

A professional attendance tracking app built with the MERN stack. Simple, secure, and a strict way to manage employee attendance.

---

## What It Does

- **Three Roles:** Super Admin, Admin, Employee — each with their own dashboard.
- **Mark Attendance:** Snap a selfie + allow location. Timestamps get logged automatically.
- **Auto Absent:** If you don't mark attendance, you're marked absent — no exceptions.
- **Leave Requests:** Employees apply, admins approve or reject.
- **Dashboards & Charts:** Each role gets stats and visual summaries.
- **Excel Reports:** Download attendance records as XLSX.
- **Rectification:** Controlled rectification flow with usage limits.
- **Daily Reminder:** Automated 11:00 AM notification so nobody forgets.
- **Secure:** JWT auth, encrypted logins, safe all around.

---

## Tech Stack

- **Frontend:** React, Tailwind CSS, Chart.js, Axios
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT
- **Tools:** Multer (image uploads), ExcelJS (reports), Node-cron (scheduler)

---

## Before You Start

- Install Node.js
- Install MongoDB and make sure it's running on `mongodb://localhost:27017`

---

## Setup

### 1. Backend (port 5000)

```bash
cd server
npm install
npm start
```

### 2. Frontend (port 5173)

```bash
cd client
npm install
npm run dev
```

---

## How to Run

1. Make sure MongoDB is running.
2. Start the backend server (`npm start` inside `server/`).
3. Start the frontend client (`npm run dev` inside `client/`).
4. Open your browser and go to `http://localhost:5173`.

### First Run

On the login page, click **"Initialize System (First Run Only)"** to create the Super Admin account.

Or run the setup script:

```bash
cd server
npm run setup
```

---

## Demo Accounts

**Super Admin**
- Email: `superhatboy@gmail.com`
- Password: `sudo@8848`

**Employee (Demo)**
- Email: `Demo11@gmail.com`
- Password: `Hatboy@#$77`

Login and start creating Admins and Employees from the dashboard.

---

## Project Structure

```
server/     Backend API, routes, and database logic
client/     React frontend app
server/uploads/   Attendance selfies stored here
```

---

## License

Internal use only. Paid license. All rights reserved.
