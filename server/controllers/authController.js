// controllers/authController.js - UPDATED verifyOtpAndLogin
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { sendOtp } = require("../utils/mailer");
const otpStorage = new Map();

// USER REGISTRATION (No changes)
exports.signup = async (req, res) => {
  const { name, email, phone, password, confirmPassword, companyName, location } = req.body;
  try {
    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const userExists = await User.findOne({ $or: [{ email }, { phone }] });
    if (userExists) {
      return res.status(400).json({ message: "User already exists with this email or phone" });
    }

    const userData = { 
      name, 
      email, 
      phone, 
      password, 
      companyName,
      location
    };

    const user = await User.create(userData);
    
    res.status(201).json({ 
      message: "Registration successful! Please login to continue.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        companyName: user.companyName,
        location: user.location
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
};

// LOGIN - Check suspension before sending OTP
exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // **NEW: Check if user is suspended**
        if (user.status === 'suspended') {
            return res.status(403).json({ 
                message: 'Your account has been suspended', 
                suspended: true,
                suspensionReason: user.suspensionReason || 'Please contact admin for details.',
                adminEmail: process.env.ADMIN_EMAIL || 'admin@upcycling.com'
            });
        }

        // Generate OTP
        const otp = crypto.randomInt(100000, 999999).toString(); 
        otpStorage.set(email, { otp, expiresAt: Date.now() + 5 * 60 * 1000 });

        // Send OTP
        await sendOtp(email, otp);

        res.status(200).json({ 
            message: "OTP sent to your email.", 
            email, 
            role: user.role
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// VERIFY OTP AND COMPLETE LOGIN - Double-check suspension
exports.verifyOtpAndLogin = async (req, res) => {
    const { email, userOtp } = req.body;
    try {
        const storedOtpData = otpStorage.get(email);
        
        if (!storedOtpData) {
            return res.status(400).json({ message: "No OTP request found for this email." });
        }

        if (Date.now() > storedOtpData.expiresAt) {
            otpStorage.delete(email);
            return res.status(400).json({ message: "OTP expired. Please request a new one." });
        }

        if (storedOtpData.otp !== userOtp) {
            return res.status(400).json({ message: "Invalid OTP." });
        }

        const user = await User.findOne({ email });
        
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // **NEW: Double-check suspension status (in case suspended between OTP request and verification)**
        if (user.status === 'suspended') {
            otpStorage.delete(email);
            return res.status(403).json({ 
                message: 'Your account has been suspended', 
                suspended: true,
                suspensionReason: user.suspensionReason || 'Please contact admin for details.',
                adminEmail: process.env.ADMIN_EMAIL || 'admin@upcyling.com'
            });
        }

        // Generate token with role
        const token = jwt.sign(
            { id: user._id, role: user.role }, 
            process.env.JWT_SECRET, 
            { expiresIn: "24h" }
        );
        
        otpStorage.delete(email);

        // Prepare response based on role
        const responseData = {
            token, 
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                status: user.status, // Include status
                isVerified: user.isVerified
            }
        };

        // Add user-specific fields only for regular users
        if (user.role === 'user') {
            responseData.user.companyName = user.companyName || null;
            responseData.user.location = user.location || null;
        }

        res.status(200).json(responseData);
        
    } catch (error) {
        res.status(500).json({ message: "Error verifying OTP", error: error.message });
    }
};

// GET USER PROFILE - UPDATED to handle both roles
exports.getUserProfile = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.params.id);
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let responseData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,

      // ✅ REQUIRED FOR PROFILE UI
      isVerified: user.isVerified,
      verifiedAt: user.verifiedAt,
      status: user.status,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      suspensionReason: user.suspensionReason || null,
    };

    // Extra fields only for regular users
    if (user.role === 'user') {
      responseData.companyName = user.companyName || null;
      responseData.location = user.location || null;
    }

    res.json(responseData);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};


// OTP GENERATION (No changes)
let otp;

exports.otp = async (req, res) => {
  try {
      const { email } = req.body;
  
      otp = crypto.randomInt(100000, 999999).toString();
  
      try {
          await sendOtp(email, otp);
          res.status(200).json({ message: 'OTP sent to your email.' });
      } catch (error) {
          console.error("Error sending email:", error);
          res.status(500).json({ message: 'Error sending OTP.' });
      }
  }
  catch (error) {
      res.status(500).json({ message: 'Error generating OTP', error });
  }
}

// VERIFY OTP (No changes)
exports.verifyOtp = async (req, res) => {
  try {
      const { userOtp } = req.body;
  
      if (userOtp === otp) {
          res.status(200).json({ message: 'OTP verified successfully.' });
      } else {
          res.status(400).json({ message: 'Invalid OTP.' });
      }
  } catch (error) {
      res.status(500).json({ message: 'Error verifying OTP', error });
  }
}

// CHANGE PASSWORD (No changes)
exports.changePassword = async (req, res) => {
  const { email, currentPassword, newPassword, otp } = req.body;

  if (otp !== req.body.otp) {
      return res.status(400).json({ message: 'Invalid OTP.' });
  }

  try {
      const user = await User.findOne({ email });
      
      if (!user) {
          return res.status(404).json({ message: 'User not found.' });
      }

      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
          return res.status(400).json({ message: 'Current password is incorrect.' });
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({ message: 'Password changed successfully!' });
  } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ message: 'Error changing password.' });
  }
};