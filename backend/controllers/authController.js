const User = require('../models/User');
const jwt = require('jsonwebtoken');

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

module.exports = { registerOrg, registerDriver, loginOrg, loginDriver, getProfile };
