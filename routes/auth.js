const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

const router = express.Router();

// 🚗 Register Driver
router.post('/register', async (req, res) => {
  const { driverName, vehicleNo, vehicleType, password } = req.body;

  if (!driverName || !vehicleNo || !vehicleType || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const existing = await Driver.findOne({ vehicleNo });
    if (existing) return res.status(400).json({ error: 'Vehicle already registered' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = new Driver({
      driverName,
      vehicleNo,
      vehicleType, // ✅ Save vehicleType
      password: hashedPassword,
    });

    await driver.save();

    res.status(201).json({ message: '✅ Driver registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});

// 🔑 Login Driver
router.post('/login', async (req, res) => {
  const { vehicleNo, password } = req.body;

  try {
    const driver = await Driver.findOne({ vehicleNo });
    if (!driver) return res.status(400).json({ error: 'Driver not found' });

    const valid = await bcrypt.compare(password, driver.password);
    if (!valid) return res.status(400).json({ error: 'Invalid password' });

    const token = jwt.sign({ driverId: driver._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      message: '✅ Login successful',
      token,
      driver: {
        id: driver._id,
        driverName: driver.driverName,
        vehicleNo: driver.vehicleNo,
        vehicleType: driver.vehicleType, // ✅ return this too
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Server Error' });
  }
});
// DELETE /api/auth/delete/:vehicleNo
router.delete('/delete/:vehicleNo', async (req, res) => {
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

module.exports = router;
