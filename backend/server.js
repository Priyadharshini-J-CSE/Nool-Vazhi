const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/shipments', require('./routes/shipmentRoutes'));
app.use('/api/trips', require('./routes/tripRoutes'));
app.use('/api/auctions', require('./routes/auctionRoutes'));
app.use('/api/tracking', require('./routes/trackingRoutes'));
app.use('/api/pricing', require('./routes/pricingRoutes'));

// Health check
app.get('/', (req, res) => res.json({ message: 'Nool-Vazhi API running' }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT, () =>
      console.log(`Server running on port ${process.env.PORT}`)
    );
  })
  .catch((err) => console.error(err));
