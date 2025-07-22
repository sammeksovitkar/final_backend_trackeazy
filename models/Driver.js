const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  driverName: { type: String, required: true },
  vehicleNo: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true }, // 🚨 NEW FIELD
  password: { type: String, required: true },    // Hashed password
});

module.exports = mongoose.model('Driver', driverSchema);
