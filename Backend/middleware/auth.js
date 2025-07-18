const jwt = require('jsonwebtoken');
const Admin = require('../models/adminModel');
const Organizer = require('../models/organizerModel');
const User = require('../models/userModel');

exports.protect = async (req, res, next) => {
    try {
        let token = req.cookies.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized to access this route'
            });
        }

        try {
            console.log('Token received:', token);
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            console.log('Decoded token:', decoded);

            switch (decoded.role) {
                case 'organizer':
                    req.organizer = await Organizer.findById(decoded.id);
                    if (!req.organizer) {
                        return res.status(401).json({
                            success: false,
                            message: 'Organizer not found'
                        });
                    }
                    break;

                case 'user':
                    req.user = await User.findById(decoded.id);
                    if (!req.user) {
                        return res.status(401).json({
                            success: false,
                            message: 'User not found'
                        });
                    }
                    break;

                case 'admin':
                    req.admin = await Admin.findById(decoded.id);
                    if (!req.admin) {
                        return res.status(401).json({
                            success: false,
                            message: 'Admin not found'
                        });
                    }
                    break;

                default:
                    return res.status(401).json({
                        success: false,
                        message: 'Invalid role'
                    });
            }

            console.log('User/Admin/Organizer found:', {
                user: req.user,
                admin: req.admin,
                organizer: req.organizer
            });

            next();
        } catch (err) {
            console.error('JWT verification error:', err);
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
}; 