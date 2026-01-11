const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Define User schema inline to avoid pre-save hook issues during setup
const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['SuperAdmin', 'Admin', 'Employee'], default: 'Employee' },
    department: { type: String },
    designation: { type: String },
    phone: { type: String },
    address: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.models.User || mongoose.model('User', UserSchema);

const setupSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system');
        console.log('MongoDB Connected');

        // Check if Super Admin already exists
        const existingAdmin = await User.findOne({ role: 'SuperAdmin' });
        if (existingAdmin) {
            console.log('Super Admin already exists!');
            console.log('Email:', existingAdmin.email);
            console.log('To reset password, delete the user from database first.');
            await mongoose.disconnect();
            process.exit(0);
        }

        // Hash password manually to avoid pre-save hook issues
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        
        // Create Super Admin
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'admin@planningguru.com',
            password: hashedPassword,
            role: 'SuperAdmin',
            department: 'Management',
            designation: 'Director'
        });

        console.log('✅ Super Admin created successfully!');
        console.log('Email: admin@planningguru.com');
        console.log('Password: admin123');
        console.log('\n⚠️  IMPORTANT: Change the password after first login!');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error setting up Super Admin:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

setupSuperAdmin();
