const User = require('../models/User');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

const respond = (user, res, status = 200) => {
  res.status(status).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
  });
};

const registerOrg = async (req, res) => {
  const { name, phone, email, location, businessName, gst, industry, password } = req.body;
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, phone, email, location, businessName, gst, industry, password, role: 'organization' });
    respond(user, res, 201);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const registerDriver = async (req, res) => {
  const { name, phone, email, location, licenseNumber, vehicleType, vehicleNumber, capacity, password } = req.body;
  try {
    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, phone, email, location, licenseNumber, vehicleType, vehicleNumber, capacity, password, role: 'driver' });
    respond(user, res, 201);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const loginOrg = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, role: 'organization' });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    respond(user, res);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const loginDriver = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email, role: 'driver' });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid credentials' });
    respond(user, res);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

const getProfile = async (req, res) => {
  res.json(req.user);
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'No account found with this email' });

    const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET + user.password, { expiresIn: '15m' });
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${user._id}/${resetToken}`;

    let transporter;
    if (process.env.EMAIL_PASS && process.env.EMAIL_PASS !== 'your_gmail_app_password') {
      transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
        tls: { rejectUnauthorized: true },
      });
    } else {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
    }

    const info = await transporter.sendMail({
      from: `"Nool-Vazhi" <${process.env.EMAIL_USER || 'noreply@nool-vazhi.in'}>`,
      to: user.email,
      subject: 'Reset Your Password — Nool-Vazhi',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
          <h2 style="color:#1E3A8A">Nool-Vazhi Password Reset</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Click the button below to reset your password. This link expires in <strong>15 minutes</strong>.</p>
          <a href="${resetUrl}" style="display:inline-block;margin:20px 0;padding:12px 28px;background:#F97316;color:white;border-radius:8px;text-decoration:none;font-weight:700">Reset Password</a>
          <p style="color:#64748b;font-size:13px">Or copy this link: ${resetUrl}</p>
          <p style="color:#64748b;font-size:13px">If you didn't request this, ignore this email.</p>
        </div>
      `,
    });

    // For development: log preview URL if using Ethereal
    if (nodemailer.getTestMessageUrl(info)) {
      console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
      return res.json({ message: 'Reset link generated. Check server console for preview URL (dev mode).', previewUrl: nodemailer.getTestMessageUrl(info), resetUrl });
    }

    res.json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error('Email error:', err.message);
    res.status(500).json({ message: 'Failed to send email. Try again.' });
  }
};

const resetPassword = async (req, res) => {
  const { userId, token } = req.params;
  const { password } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'Invalid link' });

    jwt.verify(token, process.env.JWT_SECRET + user.password);
    user.password = password;
    await user.save();
    res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    res.status(400).json({ message: 'Reset link is invalid or expired' });
  }
};

module.exports = { registerOrg, registerDriver, loginOrg, loginDriver, getProfile, forgotPassword, resetPassword };
