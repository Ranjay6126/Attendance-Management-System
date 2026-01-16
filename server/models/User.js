const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        enum: ['SuperAdmin', 'Admin', 'Employee'],
        default: 'Employee',
    },
    department: {
        type: String,
    },
    designation: {
        type: String,
    },
    phone: {
        type: String, // Kept for bio, but login is username/password
    },
    address: {
        type: String,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

// Encrypt password using bcrypt
UserSchema.pre('save', async function () {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password')) {
        return;
    }
    
    // Skip hashing if password is already hashed (starts with $2a$, $2b$, etc.)
    if (this.password && this.password.startsWith('$2')) {
        return;
    }
    
    // Generate salt and hash password using async/await
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
