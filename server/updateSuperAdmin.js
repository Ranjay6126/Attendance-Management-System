const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config();

// Define User schema inline
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

const updateSuperAdmin = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/attendance_system');
        console.log('MongoDB Connected');

        // Find the existing Super Admin
        const superAdmin = await User.findOne({ role: 'SuperAdmin' });
        
        if (!superAdmin) {
            console.log('❌ No Super Admin found!');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log('Found Super Admin:', superAdmin.email);

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('sudo@8848', salt);

        // Update email and password
        superAdmin.email = 'superhatboy@gmail.com';
        superAdmin.password = hashedPassword;
        
        await superAdmin.save();

        console.log('✅ Super Admin updated successfully!');
        console.log('New Email: superhatboy@gmail.com');
        console.log('New Password: sudo@8848');
        
        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error updating Super Admin:', error.message);
        console.error(error);
        await mongoose.disconnect();
        process.exit(1);
    }
};

updateSuperAdmin();
