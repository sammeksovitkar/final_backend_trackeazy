const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Driver = require('../models/Driver');

const router = express.Router();

// Admin Login
router.post('/admin/login', (req, res) => {
  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USERNAME &&
    password === process.env.ADMIN_PASSWORD
  ) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });
    return res.json({ message: '✅ Admin logged in', token });
  } else {
    return res.status(401).json({ error: 'Invalid admin credentials' });
  }
});

// 🚗 Register Driver
router.post('/register', async (req, res) => {
  const { driverName, vehicleNo, vehicleType, password } = req.body;
  console.log(driverName, vehicleNo, vehicleType, password, "info");

  if (!driverName || !vehicleNo || !vehicleType || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // Case-insensitive vehicleNo check
    const existing = await Driver.findOne({ vehicleNo: new RegExp(`^${vehicleNo}$`, 'i') });
    if (existing) {
      return res.status(400).json({ error: 'Vehicle already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const driver = new Driver({
      driverName,
      vehicleNo,
      vehicleType,
      password: hashedPassword,
    });

    await driver.save();
    res.status(201).json({ message: '✅ Driver registered successfully' });
  } catch (error) {
    console.error('❌ Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/driver/edit-driver
router.post('/edit-driver', async (req, res) => {
  const { vehicleNo, driverName, vehicleType, password, newVehicleNo } = req.body;

  if (!vehicleNo) {
    return res.status(400).json({ error: 'Current vehicleNo is required to identify driver' });
  }

  try {
    const driver = await Driver.findOne({ vehicleNo });

    if (!driver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    // If newVehicleNo is provided, check for duplicate
    if (newVehicleNo && newVehicleNo !== vehicleNo) {
      const existing = await Driver.findOne({ vehicleNo: newVehicleNo });
      if (existing) {
        return res.status(400).json({ error: 'New vehicle number already exists' });
      }
      driver.vehicleNo = newVehicleNo;
    }

    if (driverName) driver.driverName = driverName;
    if (vehicleType) driver.vehicleType = vehicleType;

    if (password) {
      driver.password = await bcrypt.hash(password, 10);
    }

    await driver.save();

    res.json({ message: '✏️ Driver updated successfully', driver });
  } catch (error) {
    console.error('❌ Error editing driver:', error);
    res.status(500).json({ error: 'Server error while editing driver' });
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



const Location = require('../models/Location'); // ✅ import the model



//  send location 
router.post('/sendLocation', async (req, res) => {
  try {
    const { latlong, time, vehicleType, vehicleNo, driverName } = req.body;

    const newLocation = new Location({
      latlong,
      time,
      vehicleType,
      vehicleNo,
      driverName,
    });

    await newLocation.save();

    res.status(201).json({ message: '✅ Location saved successfully', newLocation });
  } catch (error) {
    console.error('❌ Error saving location:', error);
    res.status(500).json({ error: 'Server error while saving location' });
  }
});


// get all locations

router.get('/getLocations', async (req, res) => {
  try {
    const locations = await Location.find().sort({ createdAt: -1 }).limit(100); // latest 100 entries
    res.json(locations);
  } catch (error) {
    console.error('❌ Error fetching locations:', error);
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});




const verifyAdmin = require('../verifyAdmin');




// 👇 GET unique drivers with vehicle type
router.get('/getDrivers', verifyAdmin, async (req, res) => {
  try {
    const uniqueDrivers = await Driver.aggregate([
      {
        $group: {
          _id: {
            vehicleNo: "$vehicleNo",
            driverName: "$driverName",
            vehicleType: "$vehicleType",
            status:"$status"
          }
        }
      },
      {
        $project: {
          _id: 0,
          vehicleNo: "$_id.vehicleNo",
          driverName: "$_id.driverName",
          vehicleType: "$_id.vehicleType",
          status: "$_id.status"
        }
      }
    ]);

    res.json(uniqueDrivers);
  } catch (error) {
    console.error('❌ Error fetching unique drivers:', error);
    res.status(500).json({ error: 'Failed to fetch unique drivers' });
  }
});

// GET all lat/long data for a specific vehicle
router.get('/getVehicleLocations/:vehicleNo', async (req, res) => {
  const { vehicleNo } = req.params;

  try {
    const locations = await Location.find({ vehicleNo })
      .sort({ createdAt: 1 }) // oldest to newest (for history)
      .select('latlong time -_id'); // only return latlong and time

    if (!locations || locations.length === 0) {
      return res.status(404).json({ error: 'No location data found for this vehicle' });
    }

    res.json({ vehicleNo, totalPoints: locations.length, locations });
  } catch (error) {
    console.error('❌ Error fetching vehicle locations:', error);
    res.status(500).json({ error: 'Server error while fetching vehicle locations' });
  }
});


// POST /api/driver/update-status
router.post('/update-status', async (req, res) => {
  const { vehicleNo, statusFlag } = req.body;

  if (!vehicleNo || typeof statusFlag !== 'number') {
    return res.status(400).json({ message: 'vehicleNo and statusFlag (0 or 1) are required' });
  }

  try {
    const driver = await Driver.findOneAndUpdate(
      { vehicleNo },
      { $set: { status: statusFlag } },
      { new: true }
    );

    if (!driver) {
      return res.status(404).json({ message: 'Driver not found' });
    }

    res.json({ message: 'Status updated successfully', driver });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/driver/assign-trip
router.post('/assign-trip', async (req, res) => {
  const { vehicleNo, source, destination, start, end, time } = req.body;

  if (!vehicleNo) return res.status(400).json({ error: 'vehicleNo is required' });

  const updateFields = {};

  if (source) updateFields['allocatedTrip.source'] = source;
  if (destination) updateFields['allocatedTrip.destination'] = destination;
  if (start) updateFields['allocatedTrip.start'] = start;
  if (end) updateFields['allocatedTrip.end'] = end;

  // ✅ Always set time, even if others are empty
  if (typeof time === 'number') updateFields['allocatedTrip.time'] = time;

  try {
    const driver = await Driver.findOneAndUpdate(
      { vehicleNo },
      { $set: updateFields },
      { new: true }
    );

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    res.json({ message: 'Trip data updated', driver });
  } catch (err) {
    console.error('Error updating trip:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/driver/edit-trip
// 🚀 Update or assign trip for a driver
router.post('/update-trip', async (req, res) => {
  const { vehicleNo, source, destination, start, end, time } = req.body;

  // Validate
  if (!vehicleNo) {
    return res.status(400).json({ error: 'vehicleNo is required' });
  }

  const updateFields = {};

  // ✅ Only set fields that are provided
  if (source) updateFields['allocatedTrip.source'] = source;
  if (destination) updateFields['allocatedTrip.destination'] = destination;
  if (start) updateFields['allocatedTrip.start'] = start;
  if (end) updateFields['allocatedTrip.end'] = end;
  if (typeof time === 'number') updateFields['allocatedTrip.time'] = time;

  try {
    const updatedDriver = await Driver.findOneAndUpdate(
      { vehicleNo },
      { $set: updateFields },
      { new: true }
    );

    if (!updatedDriver) {
      return res.status(404).json({ error: 'Driver not found' });
    }

    res.json({
      message: '✅ Trip details updated successfully',
      driver: updatedDriver
    });
  } catch (err) {
    console.error('❌ Error updating trip:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/driver/getDriver/:vehicleNo
router.get('/getDriver/:vehicleNo', async (req, res) => {
  const { vehicleNo } = req.params;

  try {
    const driver = await Driver.findOne({ vehicleNo });

    if (!driver) return res.status(404).json({ error: 'Driver not found' });

    const { driverName, vehicleType, allocatedTrip = {} } = driver;

    res.json({
      vehicleNo,
      driverName,
      vehicleType,
      source: allocatedTrip.source || {},
      destination: allocatedTrip.destination || {},
      start: allocatedTrip.start || {},
      end: allocatedTrip.end || {},
      time: typeof allocatedTrip.time === 'number' ? allocatedTrip.time : null
    });
  } catch (err) {
    console.error('Error getting driver:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
