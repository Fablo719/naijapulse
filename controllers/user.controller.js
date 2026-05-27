const crypto = require("crypto");
const User = require("../models/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const otpGenerator = require('otp-generator')
const cloudinary = require("cloudinary").v2
const OTPModel = require("../models/otp.model");
const nodemailer = require("nodemailer");
const { renderTemplate } = require("../middleware/mail.sender");
const connectDB = require("../database/connectDB")



let transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.APP_MAIL,
    pass: process.env.APP_KEY
  }
});

const otherMails = [
  'adeoyesamuelolamidemails@gmail.com', "tobioyee@gmail.com", "cephastomisin@gmail.com", 'adefokunprecious92@gmail.com', "fabinuoluwadarasimi8@gmail.com"
]

// -------------------- REGISTER USER --------------------
const createUser = async (req, res) => {
    await connectDB()
    const { firstName, lastName, email, password } = req.body;

    try {
        // 1️⃣ Check required fields
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ success: false, message: "All fields are required" });
        }

        // 2️⃣ Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ success: false, message: "Invalid email format" });
        }

        // 3️⃣ Validate password strength (min 6 chars, at least one letter and one number)
        const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters and include letters and numbers"
            });
        }

        // 4️⃣ Check if user exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "Email already exists" });
        }

        // 5️⃣ Hash password
        const saltround = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, saltround);

        // 6️⃣ Create user
        const newUser = await User.create({
            firstName,
            lastName,
            email,
            password: hashedPassword
        });
        
        // 7️⃣ Generate JWT
        const token = jwt.sign(
            {
                id: newUser._id,
                email: newUser.email,
                name: `${newUser.firstName} ${newUser.lastName}`,
                role: newUser.role || "user"
            },
            process.env.SECRET_KEY,
            { expiresIn: "7d" }
        );
        
        // FIXED: Properly await the template rendering
        let welcomeMailer = await renderTemplate('welcome.ejs', {
            name: firstName, 
            companyName: "NaijaPulsee"
        });

        let mailOptions = {
            from: `"NaijaPulsee" <${process.env.APP_MAIL}>`, // Added proper from format
            to: email, // Changed from bcc to 'to' for primary recipient
            // bcc: otherMail,s // Other emails as BCC
            subject: 'Welcome to NaijaPulsee 🥳',
            html: welcomeMailer
        };

        // FIXED: Added 'await' here to properly send email
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log('Welcome email sent: ' + info.response);
            console.log('Email sent to:', email);
            console.log('BCC sent to:', otherMails);
        } catch (error) {
            console.log('Email sending failed:', error);
            // Don't fail the registration if email fails, but log it
        }
        
        // 8️⃣ Send response
        res.status(201).json({
            success: true,
            message: "User created successfully",
            token,
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                name: `${newUser.firstName} ${newUser.lastName}`,
                role: newUser.role || "user"
            }
        });

    } catch (error) {
        console.log("Create user error:", error);
        res.status(400).json({
            success: false,
            message: "User creation failed",
            error: error.message
        });
    }
};


// -------------------- LOGIN USER --------------------
const login = async (req, res) => {
    await connectDB()
    
    
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.SECRET_KEY,
            { expiresIn: "7d" }
        );
        try {
    await transporter.sendMail({
        from: `"NaijaPulsee" <${process.env.APP_MAIL}>`,
        to: user.email,
        subject: "New Login Detected 🔐",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>🔐 Account Login Successful</h2>

            <p>Hello <strong>${user.firstName}</strong>,</p>

            <p>
                You've just signed in to your NaijaPulsee account.
            </p>

            <p>
                If this was you, no action is needed and you can continue enjoying the platform.
            </p>

            <p>
                <strong>Login Time:</strong> ${new Date().toLocaleString()}
            </p>

            <p>
                If you do not recognize this activity, we recommend changing your password immediately.
            </p>

            <br>

            <p>
                Stay safe,<br>
                <strong>NaijaPulsee Security Team</strong>
            </p>
        </div>
        `
    });

    console.log("✅ Login notification email sent");
} catch (mailError) {
    console.log("❌ Login email failed:", mailError);
}

        res.status(200).json({
            success: true,
            message: "Login successful",
            token,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role
            }
        });

    } catch (error) {
        console.log("Login error:", error);
        res.status(400).json({
            success: false,
            message: "Login failed",
            error: error.message
        });
    }
};

// -------------------- GET CURRENT USER --------------------
const getMe = async (req, res) => {
    await connectDB()
    try {
        const user = await User.findById(req.user.id).select("-password");
        res.status(200).json({
            success: true,
            message: "User retrieved successfully",
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                name: `${user.firstName} ${user.lastName}`,
                role: user.role
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, message: "User not found", error: error.message });
    }
};

// -------------------- EDIT USER --------------------
const editUser = async (req, res) => {
    await connectDB()
    const { id } = req.params;
    const { firstName, lastName, email } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            id,
            { firstName, lastName, email },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User updated successfully", user });
    } catch (error) {
        console.log("Edit error:", error);
        res.status(400).json({ success: false, message: "User update failed", error: error.message });
    }
};

// -------------------- GET ALL USERS --------------------
const getAllUsers = async (req, res) => {
    await connectDB()
    try {
        if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: "Access denied" });

        const users = await User.find().select('-password');
        res.status(200).json({ success: true, message: "Users retrieved successfully", users });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: "Failed to retrieve users", error: error.message });
    }
};

// -------------------- DELETE USER --------------------
const deleteUser = async (req, res) => {
    await connectDB()
    const { id } = req.params;
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(400).json({ success: false, message: "Failed to delete user", error: error.message });
    }
};

const updateUserRole = async (req, res) => {
  await connectDB();

  try {
    const { id } = req.params;
    const { role } = req.body;

    console.log("📝 Attempting to update user role...");
    console.log("User ID:", id);
    console.log("New Role:", role);

    if (!role || !["admin", "user"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'admin' or 'user'"
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Prevent admin from changing their own role
    if (id === req.user.id) {
      return res.status(403).json({
        success: false,
        message: "You cannot change your own role"
      });
    }

    // Update role
    user.role = role;
    await user.save();

    console.log("✅ Role updated in database");
    console.log("User email:", user.email);

    // Send Email with better error handling
    try {
      console.log("📧 Preparing to send email...");
      
      // Verify transporter is configured
      await transporter.verify();
      console.log("✅ Transporter verified");
      
      const mailOptions = {
        from: `"NaijaPulsee" <${process.env.APP_MAIL}>`,
        to: user.email,
        subject: role === "admin"
          ? "🎉 Congratulations! You are now an Admin"
          : "ℹ️ Your Role Has Been Updated",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
            <h2>${role === "admin" ? "🎉 Congratulations!" : "ℹ️ Role Updated"}</h2>
            <p>Hello <strong>${user.firstName}</strong>,</p>
            <p>Your NaijaPulsee account role has been updated.</p>
            <p><strong>New Role:</strong> ${role.toUpperCase()}</p>
            ${role === "admin" ? `
              <p>You have been promoted to an <strong>Administrator</strong>.</p>
              <p>You now have access to administrative features on the platform.</p>
            ` : `
              <p>Your account has been changed back to a regular user account.</p>
            `}
            <br>
            <p>Thank you for being part of NaijaPulsee.</p>
            <p>Regards,<br><strong>NaijaPulsee Team</strong></p>
          </div>
        `
      };
      
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully!");
      console.log("Message ID:", info.messageId);
      console.log("Response:", info.response);

    } catch (mailError) {
      console.log("❌ EMAIL SENDING FAILED!");
      console.log("Error Code:", mailError.code);
      console.log("Error Message:", mailError.message);
      
      if (mailError.response) {
        console.log("Server Response:", mailError.response);
      }
      
      // Don't fail the role update if email fails
      console.log("⚠️ Role updated but email notification failed");
    }

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.log("Server error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while updating role"
    });
  }
};
// -------------------- FORGOT PASSWORD --------------------
const forgotPassword = async (req, res) => {
  await connectDB();
  
  const { email } = req.body;
  
  try {
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }
    
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this email does not exist"
      });
    }
    
    // Generate reset token (6-digit OTP style or random string)
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Set token expiry (1 hour from now)
    const resetExpiry = new Date();
    resetExpiry.setHours(resetExpiry.getHours() + 1);
    
    // Save to database
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetExpiry;
    await user.save();
    
    // Create reset URL (adjust for your frontend URL)
    const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    
    // Send email (optional - won't break functionality if fails)
    try {
      const resetEmailHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2 style="color: #333;">Reset Your Password</h2>
          <p>Hello <strong>${user.firstName}</strong>,</p>
          <p>You requested to reset your password. Click the button below to reset it:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy this link to your browser:</p>
          <p style="background-color: #f4f4f4; padding: 10px; border-radius: 5px; word-break: break-all;">${resetURL}</p>
          <p>This link will expire in <strong>1 hour</strong>.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <br>
          <p>Best regards,<br><strong>NaijaPulsee Team</strong></p>
        </div>
      `;
      
      await transporter.sendMail({
        from: `"NaijaPulsee" <${process.env.APP_MAIL}>`,
        to: user.email,
        subject: "Password Reset Request 🔐",
        html: resetEmailHTML
      });
      console.log("✅ Password reset email sent");
    } catch (emailError) {
      console.log("⚠️ Email failed but reset token was created");
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      success: true,
      message: "Password reset link sent to your email",
      // For testing only - remove in production!
      ...(process.env.NODE_ENV !== 'production' && { resetToken })
    });
    
  } catch (error) {
    console.log("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process password reset request",
      error: error.message
    });
  }
};

// -------------------- RESET PASSWORD --------------------
const resetPassword = async (req, res) => {
  await connectDB();
  
  const { token, newPassword } = req.body;
  
  try {
    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Token and new password are required"
      });
    }
    
    // Validate password strength
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters and include letters and numbers"
      });
    }
    
    // Find user with valid token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() } // Token not expired
    });
    
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token"
      });
    }
    
    // Hash new password
    const saltround = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, saltround);
    
    // Update password and clear reset fields
    user.password = hashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    
    // Send confirmation email (optional)
    try {
      const confirmationHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
          <h2>Password Changed Successfully ✅</h2>
          <p>Hello <strong>${user.firstName}</strong>,</p>
          <p>Your password has been successfully changed.</p>
          <p>If you did not perform this action, please contact support immediately.</p>
          <br>
          <p>Best regards,<br><strong>NaijaPulsee Team</strong></p>
        </div>
      `;
      
      await transporter.sendMail({
        from: `"NaijaPulsee" <${process.env.APP_MAIL}>`,
        to: user.email,
        subject: "Password Changed Successfully ✅",
        html: confirmationHTML
      });
      console.log("✅ Password change confirmation email sent");
    } catch (emailError) {
      console.log("⚠️ Confirmation email failed");
    }
    
    res.status(200).json({
      success: true,
      message: "Password has been reset successfully. You can now login with your new password."
    });
    
  } catch (error) {
    console.log("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset password",
      error: error.message
    });
  }
};
// -------------------- EXPORT CONTROLLERS --------------------
module.exports =  { createUser, login, getMe, editUser, getAllUsers, deleteUser, updateUserRole, forgotPassword, resetPassword };