const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ message: 'Please provide email and password' });
        }

        console.log('Login attempt for email:', email);
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log('User not found:', email);
            // Check if database is empty
            const userCount = await User.countDocuments();
            if (userCount === 0) {
                return res.status(401).json({ 
                    message: 'No users found. Please run "npm run setup" in the server directory to create Super Admin account.' 
                });
            }
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isMatch = await user.matchPassword(password);
        
        if (!isMatch) {
            console.log('Password mismatch for user:', email);
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not set in environment variables');
            return res.status(500).json({ message: 'Server configuration error' });
        }

        console.log('Login successful for user:', email, 'Role:', user.role);
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Private/Admin
const registerUser = async (req, res) => {
    try {
        const { name, email, password, role, department, designation, phone, address } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({ message: 'Please provide name, email, and password' });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Password validation
        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters long' });
        }

        // Role validation - SuperAdmin can only create Admin and Employee
        const validRoles = ['SuperAdmin', 'Admin', 'Employee'];
        if (role && !validRoles.includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Must be SuperAdmin, Admin, or Employee' });
        }

        // Prevent creating another SuperAdmin - only setup script can do that
        if (role === 'SuperAdmin' && req.user.role !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Only system setup can create SuperAdmin accounts' });
        }

        // SuperAdmin can only create Admin and Employee, not another SuperAdmin
        if (req.user.role === 'SuperAdmin' && role === 'SuperAdmin') {
            return res.status(403).json({ message: 'Super Admin can only create Admin and Employee accounts' });
        }

        // Admin can only create Employee accounts
        if (req.user.role === 'Admin' && role !== 'Employee') {
            return res.status(403).json({ message: 'Admin can only create Employee accounts' });
        }

        console.log('Registering user:', { name, email, role });

        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }

        // Check if req.user exists (should be set by auth middleware)
        if (!req.user || !req.user._id) {
            console.error('Authentication error: req.user is missing');
            return res.status(401).json({ message: 'Authentication required to create users' });
        }

        try {
            const user = await User.create({
                name,
                email,
                password,
                role: role || 'Employee',
                department: department || undefined,
                designation: designation || undefined,
                phone: phone || undefined,
                address: address || undefined,
                createdBy: req.user._id
            });

            console.log('User created successfully:', user.email);
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            });
        } catch (createError) {
            console.error('User creation error:', createError);
            throw createError; // Re-throw to be caught by outer catch
        }
    } catch (error) {
        console.error('Register error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            name: error.name,
            stack: error.stack
        });
        
        // Handle duplicate key error (MongoDB unique constraint)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'User with this email already exists' });
        }
        
        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message).join(', ');
            return res.status(400).json({ message: `Validation error: ${messages}` });
        }
        
        res.status(500).json({ 
            message: error.message || 'Server error during registration',
            error: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                designation: user.designation,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Setup initial Super Admin
// @route   POST /api/auth/setup
// @access  Public (Run once)
const setupSuperAdmin = async (req, res) => {
    try {
        const userExists = await User.findOne({ role: 'SuperAdmin' });
        if (userExists) {
            return res.status(400).json({ message: 'Super Admin already exists' });
        }

        const user = await User.create({
            name: 'Super Admin',
            email: 'superhatboy@gmail.com',
            password: 'sudo@8848', // Should be changed immediately
            role: 'SuperAdmin',
            department: 'Management',
            designation: 'Director'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({ message: 'Server error during setup' });
    }
};

module.exports = { loginUser, registerUser, getMe, setupSuperAdmin };
