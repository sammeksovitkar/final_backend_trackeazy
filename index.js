// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// require('dotenv').config();

// const authRoutes = require('./routes/auth');

// const app = express();
// const port = process.env.PORT || 3000;


// app.use(cors({
//   origin: '*', // or: ['https://trackeazy-frontend-8i23.vercel.app']
// }));
// app.use(express.json());

// // MongoDB Connection
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// })
// .then(() => console.log('✅ MongoDB Connected'))
// .catch((err) => console.error('❌ MongoDB Error:', err));

// // Routes
// app.use('/api/auth', authRoutes);

// app.get('/', (req, res) => {
//   res.send('🚀 Driver Auth API Running');
// });



// // Delete driver by vehicleNo
// router.delete('/delete/:vehicleNo', async (req, res) => {
//   const { vehicleNo } = req.params;

//   try {
//     const deletedDriver = await Driver.findOneAndDelete({ vehicleNo });

//     if (!deletedDriver) {
//       return res.status(404).json({ error: 'Driver not found' });
//     }

//     res.json({ message: '🗑️ Driver deleted successfully', deletedDriver });
//   } catch (error) {
//     res.status(500).json({ error: 'Server error while deleting driver' });
//   }
// });

// app.listen(port, () => {
//   console.log(`🚗 Server running at http://localhost:${port}`);
// });



const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Driver = require('./models/Driver'); // 👈 Make sure this exists
const authRoutes = require('./routes/auth');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*', // or: ['https://trackeazy-frontend-8i23.vercel.app']
}));
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB Connected'))
.catch((err) => console.error('❌ MongoDB Error:', err));

// Routes
app.use('/api/auth', authRoutes);

// Home Route
app.get('/', (req, res) => {
  res.send('🚀 Driver Auth API Running');
});

// ✅ Delete driver by vehicleNo (admin can use)
app.delete('/api/auth/delete/:vehicleNo', async (req, res) => {
  const { vehicleNo } = req.params;

  try {
    const deletedDriver = await Driver.findOneAndDelete({ vehicleNo });

    if (!deletedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({ message: '🗑️ Driver deleted successfully', deletedDriver });
  } catch (error) {
    res.status(500).json({ error: 'Server error while deleting driver' });
  }
});

// Start Server
// app.listen(port, () => {
//   console.log(`🚗 Server running at http://localhost:${port}`);
// });

// Export the app for Vercel
module.exports = app;
