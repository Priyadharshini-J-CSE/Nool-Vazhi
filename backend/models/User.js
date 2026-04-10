const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    // Common fields
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    location: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['organization', 'driver', 'admin'], required: true },

    // Organization-specific
    businessName: { type: String, default: '' },
    gst: { type: String, default: '' },
    industry: { type: String, default: '' },

    // Driver-specific
    licenseNumber: { type: String, default: '' },
    vehicleType: { type: String, default: '' },
    vehicleNumber: { type: String, default: '' },
    capacity: { type: String, default: '' },

    rating: { type: Number, default: 0 },
    isVerified: { type: Boolean, default: false },

    // KYC Documents
    kyc: {
      // Organization docs
      orgProof: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
      gstCertificate: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
      // Driver docs
      licenseDoc: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
      insuranceDoc: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
      // Common
      aadharDoc: { url: { type: String, default: '' }, publicId: { type: String, default: '' } },
    },
    kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
