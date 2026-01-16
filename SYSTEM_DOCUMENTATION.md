# Attendance Management System Documentation

## 1. System Architecture
The system follows a **MERN Stack** (MongoDB, Express.js, React, Node.js) architecture.

- **Frontend (Client)**: React.js (Vite) with Tailwind CSS. Handles UI, authentication state (Context API), and API interactions (Axios).
- **Backend (Server)**: Node.js with Express.js. Handles API requests, authentication, business logic, and database interactions.
- **Database**: MongoDB (via Mongoose). Stores Users, Attendance records, and Audit Logs.
- **Authentication**: JWT (JSON Web Tokens). Access tokens for API security.
- **External Services**:
  - **Google Maps**: For location visualization (links).
  - **File Storage**: Local filesystem (uploads/ directory) for selfies.

## 2. MongoDB Schema Design

### Users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String, // Acts as username
  password: String, // Hashed
  role: String, // 'Employee', 'Admin', 'SuperAdmin'
  department: String,
  designation: String,
  createdAt: Date
}
```

### Attendance Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (Ref: User),
  date: String, // 'YYYY-MM-DD'
  checkInTime: Date,
  checkOutTime: Date,
  workingHours: Number,
  attendanceType: String, // 'Office', 'WFH', 'Field'
  checkInLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  checkOutLocation: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  checkInImage: String, // Path to file
  checkOutImage: String, // Path to file
  status: String, // 'Present', 'Absent', 'Pending Approval'
  approvalStatus: String, // 'Pending', 'Approved', 'Rejected'
  remarks: String,
  createdAt: Date
}
```

### AuditLog Collection
```javascript
{
  _id: ObjectId,
  action: String, // e.g., 'RECTIFY_ATTENDANCE'
  performedBy: ObjectId (Ref: User),
  targetUser: ObjectId (Ref: User),
  details: Object, // Changed fields, remarks
  timestamp: Date
}
```

## 3. Backend API List

### Auth Routes (`/api/auth`)
- `POST /register`: Register new user (Admin/Employee).
- `POST /login`: Authenticate user and return JWT.

### Attendance Routes (`/api/attendance`)
- `POST /checkin`: Mark entry (requires image & location).
- `POST /checkout`: Mark exit (requires image & location).
- `GET /`: Get attendance history (Employee: own, Admin: all).
- `GET /analytics`: Get analytics data (Admin/SuperAdmin).
- `GET /export`: Download Excel report (Admin/SuperAdmin).
- `PUT /:id/rectify`: Edit attendance record (Admin).
- `PUT /:id/approve`: Approve/Reject attendance (Admin).

## 4. JWT Authentication Flow
1. **Login**: User sends credentials to `/api/auth/login`.
2. **Token Generation**: Server validates credentials and generates a JWT signed with `JWT_SECRET`.
3. **Storage**: Client stores the token (e.g., `localStorage`).
4. **Requests**: Client sends token in `Authorization` header (`Bearer <token>`) for protected routes.
5. **Validation**: `protect` middleware on server verifies token signature and decodes user ID.
6. **Authorization**: `authorize` middleware checks user role for specific actions.

## 5. Frontend UI Wireframes (Text-Based)

### Login Page
- [Input: Email]
- [Input: Password]
- [Button: Login]

### Employee Dashboard
- **Header**: User Name, Logout
- **Status Card**: "Checked In at 09:00 AM" or "Not Checked In"
- **Action Area**:
  - [Webcam Preview]
  - [Button: Check In] / [Button: Check Out]
  - Location Status: "Locating..." / "Lat: ..., Long: ..."
- **History Table**: Date, In, Out, Status.

### Admin Dashboard
- **Tabs**: [Attendance Management] [Create Employee] [Analytics]
- **Attendance Management**:
  - Filters: [Date Start] [Date End] [Type] [Button: Export]
  - Table: Employee, Date, In, Out, Loc, Image, Status, [Verify] [Rectify]
- **Analytics**:
  - [Pie Chart: Type Distribution]
  - [Line Chart: Daily Trend]
  - [Bar Chart: Employee Stats]
  - Metrics: Total Check-ins, Present, Avg Hours.
- **Verification Modal**:
  - Show Check-in/Out Images.
  - [Input: Remarks]
  - [Button: Approve] [Button: Reject]

## 6. Security Best Practices
- **Password Hashing**: Use bcryptjs to hash passwords before storage.
- **Environment Variables**: Store sensitive keys (MONGO_URI, JWT_SECRET) in `.env`.
- **Input Validation**: Validate all incoming data (e.g., required fields, valid dates).
- **Role-Based Access Control (RBAC)**: Middleware to restrict sensitive routes.
- **CORS**: Configure CORS to allow only trusted origins.
- **Audit Logging**: Track critical administrative actions.

## 7. Attendance Logic
- **Check-in**:
  - Verify user hasn't already checked in today.
  - Save `checkInTime`, `location`, `image`, `attendanceType`.
  - Set `status` to 'Pending Approval' (or 'Present' if auto-approve).
- **Check-out**:
  - Verify user has checked in but not checked out.
  - Save `checkOutTime`, `location`, `image`.
  - Calculate `workingHours` (CheckOut - CheckIn).
- **Validation**:
  - Ensure one record per user per day.
  - Exit not allowed without Entry.

## 8. Enterprise-Grade Recommendations
1. **Face Recognition**: Integrate AI face recognition to automatically verify identity from selfies.
2. **Geofencing**: Restrict check-in to specific coordinates (Office location) using polygon geofencing.
3. **IP Restriction**: Allow check-in only from office Wi-Fi/IP.
4. **Mobile App**: Native mobile app (React Native) for field employees with background GPS tracking.
5. **Notifications**: Email/Push notifications for missing punch-outs or approval status changes.
6. **Automated Reports**: Weekly/Monthly email reports to managers.

## 9. Folder Structure
```
/attendance-system
├── /client                # React Frontend
│   ├── /src
│   │   ├── /api          # Axios setup
│   │   ├── /components   # Reusable components
│   │   ├── /context      # Auth Context
│   │   ├── /dashboards   # Admin/Employee Dashboards
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
├── /server                # Node.js Backend
│   ├── /config           # DB connection
│   ├── /controllers      # Business logic
│   ├── /middleware       # Auth & Error handling
│   ├── /models           # Mongoose Schemas
│   ├── /routes           # API Routes
│   ├── /uploads          # Image storage
│   ├── .env
│   ├── index.js
│   └── package.json
└── README.md
```
