const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema({
  driverName: String,
  vehicleNo: { type: String, unique: true },
  vehicleType: String,
  password: String,
  status: { type: Number, default: 0 },
  allocatedTrip: {
    source: {
      lat: Number,
      long: Number,
    },
    destination: {
      lat: Number,
      long: Number,
    },
    start: {
      date: String,
      time: String,
    },
    end: {
      date: String,
      time: String,
    },
    time: Number // in hours
  }
}, { timestamps: true });

module.exports = mongoose.model('Driver', driverSchema);
