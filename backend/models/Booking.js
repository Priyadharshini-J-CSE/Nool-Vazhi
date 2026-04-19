const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true },
    trip: { type: mongoose.Schema.Types.ObjectId, ref: 'Trip', required: true },
    shipper: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    bookedWeight: { type: Number, required: true },  // kg
    pricePerKg: { type: Number, required: true },
    totalPrice: { type: Number, required: true },

    goodsType: { type: String, default: '' },
    goodsDescription: { type: String, default: '' },

    status: {
      type: String,
      enum: ['CONFIRMED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'],
      default: 'CONFIRMED',
    },
  },
  { timestamps: true }
);

bookingSchema.pre('save', function (next) {
  if (!this.bookingId) {
    this.bookingId = 'BK' + Date.now().toString().slice(-8);
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
