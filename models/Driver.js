const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  driverName: { type: String, required: true },
  vehicleNo: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true },
  password: { type: String, required: true },
  status: {
    type: Number, // Changed from String to Number
    enum: [0, 1], // 0 = stop, 1 = running
    default: 0,
  },
});




module.exports = mongoose.model('Driver', driverSchema);
