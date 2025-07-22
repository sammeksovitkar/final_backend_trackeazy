const mongoose = require('mongoose');

const locationSchema = new mongoose.Schema({
  latlong: {
    lat: String,
    long: String,
  },
  time: {
    type: Date,
    default: Date.now,
  },
  vehicleType: String,
  vehicleNo: String,
  driverName: String,
});

module.exports = mongoose.model('Location', locationSchema);
