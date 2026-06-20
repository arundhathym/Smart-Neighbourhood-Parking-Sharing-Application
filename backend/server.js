const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());

// INCREASE PAYLOAD SIZE LIMIT for Base64 profile images & space images
app.use(express.json({ limit: '10mb' })); 

// Replace this with your actual MongoDB connection string
const uri = 'mongodb://127.0.0.1:27017'; 
const client = new MongoClient(uri);
let db;

// Connect to Database
async function connectDB() {
  try {
    await client.connect();
    db = client.db('smart_parking'); // Your database name
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
  }
}
connectDB();

const JWT_SECRET = 'super_secret_key_change_me_in_production';

// ==========================================
// 1. REGISTER API ENDPOINT
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  try {
    const { fullName, email, phone, license, password, role, profilePic } = req.body;
    const usersCollection = db.collection('users');

    const existingUser = await usersCollection.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = {
      fullName,
      email,
      phone,
      license,
      password: hashedPassword,
      role: role || 'user',
      profilePic: profilePic || null, // Saves the base64 image string
      createdAt: new Date()
    };
    const result = await usersCollection.insertOne(newUser);

    const token = jwt.sign({ userId: result.insertedId, role: newUser.role }, JWT_SECRET);

    res.status(201).json({ message: 'User registered successfully', token, role: newUser.role });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// ==========================================
// 2. LOGIN API ENDPOINT
// ==========================================
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const usersCollection = db.collection('users');

    const user = await usersCollection.findOne({ email });
    if (!user) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET);

    res.status(200).json({ 
      message: 'Login successful', 
      token, 
      role: user.role 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// ==========================================
// MIDDLEWARE: Verify JWT Token
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 
  
  if (!token) return res.status(401).json({ error: 'Access denied. No token provided.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    req.user = user; 
    next();
  });
};

// ==========================================
// 3. USER PROFILE ENDPOINTS
// ==========================================
app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const usersCollection = db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectId(req.user.userId) });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
      id: user._id,
      name: user.fullName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      profilePic: user.profilePic || null 
    });

  } catch (error) {
    console.error('Fetch Profile Error:', error);
    res.status(500).json({ error: 'Server error while fetching profile' });
  }
});

app.put('/api/users/update', authenticateToken, async (req, res) => {
  try {
    const { name, email, phone, profilePic } = req.body;
    const usersCollection = db.collection('users');

    const result = await usersCollection.updateOne(
      { _id: new ObjectId(req.user.userId) },
      { $set: { fullName: name, email: email, phone: phone, profilePic: profilePic } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Server error while updating profile' });
  }
});

// ==========================================
// 4. ADD PARKING SPACE ENDPOINT
// ==========================================
app.post('/api/spaces', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'host') {
      return res.status(403).json({ error: 'Unauthorized: Only hosts can create parking spaces.' });
    }

    const spacesCollection = db.collection('spaces');
    
    const newSpace = {
      hostId: req.user.userId, 
      ...req.body,
      createdAt: new Date(),
      status: 'Active'
    };

    const result = await spacesCollection.insertOne(newSpace);

    res.status(201).json({ 
      message: 'Parking space listed successfully!', 
      spaceId: result.insertedId 
    });

  } catch (error) {
    console.error('Add Space Error:', error);
    res.status(500).json({ error: 'Server error while creating listing' });
  }
});

// ==========================================
// 5. GET LOGGED-IN HOST'S SPACES
// ==========================================
app.get('/api/spaces/me', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'host') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const spacesCollection = db.collection('spaces');
    const mySpaces = await spacesCollection.find({ hostId: req.user.userId }).toArray();

    res.status(200).json(mySpaces);

  } catch (error) {
    console.error('Fetch Spaces Error:', error);
    res.status(500).json({ error: 'Server error while fetching spaces' });
  }
});

// ==========================================
// 6. UPDATE PARKING SPACE STATUS
// ==========================================
app.put('/api/spaces/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'host') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const spaceId = req.params.id;
    const { status } = req.body;

    const spacesCollection = db.collection('spaces');

    const result = await spacesCollection.updateOne(
      { _id: new ObjectId(spaceId), hostId: req.user.userId },
      { $set: { status: status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Space not found or unauthorized.' });
    }

    res.status(200).json({ message: `Space status updated to ${status}` });

  } catch (error) {
    console.error('Update Status Error:', error);
    res.status(500).json({ error: 'Server error while updating status' });
  }
});

// ==========================================
// 7. GET NEARBY PARKING SPACES
// ==========================================
app.get('/api/spaces/nearby', async (req, res) => {
  try {
    const { city } = req.query;
    const spacesCollection = db.collection('spaces');

    let query = { status: 'Active' };
    
    if (city && city !== 'Unknown Location') {
      query.location = { $regex: city, $options: 'i' };
    }

    const nearbySpaces = await spacesCollection.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'spaceId',
          as: 'allBookings'
        }
      },
      {
        $addFields: {
          requestCount: {
            $size: {
              $filter: {
                input: "$allBookings",
                as: "booking",
                cond: { $in: ["$$booking.status", ["Pending", "Active", "Confirmed"]] }
              }
            }
          }
        }
      },
      { $project: { allBookings: 0 } }, 
      { $sort: { requestCount: -1 } }   
    ]).toArray();

    res.status(200).json(nearbySpaces);

  } catch (error) {
    console.error('Fetch Nearby Spaces Error:', error);
    res.status(500).json({ error: 'Server error while fetching spaces' });
  }
});

// ==========================================
// 8. GET BULK PARKING SPACES
// ==========================================
app.get('/api/spaces/bulk', async (req, res) => {
  try {
    const { city, cars, vans, buses } = req.query;
    const spacesCollection = db.collection('spaces');

    const reqCars = parseInt(cars) || 0;
    const reqVans = parseInt(vans) || 0;
    const reqBuses = parseInt(buses) || 0;

    let query = { 
      status: 'Active', 
      isBulkSpace: true,
      location: { $regex: city, $options: 'i' }
    };

    const spaces = await spacesCollection.find(query).toArray();

    const suitableSpaces = spaces.filter(space => {
      const v = space.vehicles;
      if (reqCars > 0 && (!v.car?.allowed || v.car.capacity < reqCars)) return false;
      if (reqVans > 0 && (!v.car?.allowed || v.car.capacity < reqVans)) return false;
      if (reqBuses > 0 && (!v.bus?.allowed || v.bus.capacity < reqBuses)) return false;
      return true;
    });

    res.status(200).json(suitableSpaces);

  } catch (error) {
    console.error('Fetch Bulk Spaces Error:', error);
    res.status(500).json({ error: 'Server error while fetching bulk spaces' });
  }
});

// ==========================================
// 9. DELETE PARKING SPACE (For Hosts)
// ==========================================
app.delete('/api/spaces/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'host') {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const spaceId = req.params.id;
    const spacesCollection = db.collection('spaces');

    const result = await spacesCollection.deleteOne({ 
      _id: new ObjectId(spaceId), 
      hostId: req.user.userId 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Space not found or unauthorized.' });
    }

    res.status(200).json({ message: 'Space deleted successfully.' });

  } catch (error) {
    console.error('Delete Space Error:', error);
    res.status(500).json({ error: 'Server error while deleting space.' });
  }
});

// ==========================================
// 10. CREATE A NEW BOOKING (MOCK / PAY ON ARRIVAL)
// ==========================================
app.post('/api/bookings/create', authenticateToken, async (req, res) => {
  try {
    const { spaceId, hostId, vehicleType, durationHours, totalAmount } = req.body;
    const bookingsCollection = db.collection('bookings');

    const newBooking = {
      userId: new ObjectId(req.user.userId), 
      spaceId: new ObjectId(spaceId), 
      hostId: hostId ? new ObjectId(hostId) : null, 
      vehicleType: vehicleType, 
      durationHours: durationHours, 
      totalAmount: totalAmount, 
      status: 'Pending',
      paymentStatus: 'Pay on Arrival', 
      createdAt: new Date() 
    };

    const result = await bookingsCollection.insertOne(newBooking);

    res.status(201).json({ 
      message: 'Booking confirmed successfully!', 
      bookingId: result.insertedId 
    });

  } catch (error) {
    console.error('Booking Creation Error:', error);
    res.status(500).json({ error: 'Server error while creating the booking.' });
  }
});

// ==========================================
// 11. GET LOGGED-IN USER'S BOOKINGS (UPDATED WITH HOST LOOKUP)
// ==========================================
app.get('/api/bookings/me', authenticateToken, async (req, res) => {
  try {
    const bookingsCollection = db.collection('bookings');

    const myBookings = await bookingsCollection.aggregate([
      { $match: { userId: new ObjectId(req.user.userId) } }, 
      { 
        $lookup: {
          from: 'spaces',
          localField: 'spaceId',
          foreignField: '_id',
          as: 'spaceDetails'
        }
      },
      { $unwind: { path: '$spaceDetails', preserveNullAndEmptyArrays: true } },
      
      // === THIS IS THE NEW CODE TO FETCH THE HOST'S DETAILS ===
      {
        $lookup: {
          from: 'users',
          localField: 'hostId',
          foreignField: '_id',
          as: 'hostDetails'
        }
      },
      { $unwind: { path: '$hostDetails', preserveNullAndEmptyArrays: true } },
      { 
        // Removes the host's password hash from the response for security
        $project: { "hostDetails.password": 0 } 
      },
      // ========================================================
      
      { $sort: { createdAt: -1 } } 
    ]).toArray();

    res.status(200).json(myBookings);

  } catch (error) {
    console.error('Fetch Bookings Error:', error);
    res.status(500).json({ error: 'Server error while fetching bookings.' });
  }
});

// ==========================================
// 12. CANCEL / DELETE A BOOKING
// ==========================================
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const bookingsCollection = db.collection('bookings');

    const result = await bookingsCollection.deleteOne({ 
      _id: new ObjectId(bookingId),
      userId: new ObjectId(req.user.userId) 
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Booking not found or unauthorized.' });
    }

    res.status(200).json({ message: 'Booking cancelled successfully.' });
  } catch (error) {
    console.error('Cancel Booking Error:', error);
    res.status(500).json({ error: 'Server error while cancelling booking.' });
  }
});

// ==========================================
// 13. GET BOOKINGS FOR LOGGED-IN HOST
// ==========================================
app.get('/api/bookings/host', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'host') return res.status(403).json({ error: 'Unauthorized.' });

    const bookingsCollection = db.collection('bookings');

    const hostBookings = await bookingsCollection.aggregate([
      { $match: { hostId: new ObjectId(req.user.userId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'driverDetails'
        }
      },
      { $unwind: { path: '$driverDetails', preserveNullAndEmptyArrays: true } },
      {
        $lookup: {
          from: 'spaces',
          localField: 'spaceId',
          foreignField: '_id',
          as: 'spaceDetails'
        }
      },
      { $unwind: { path: '$spaceDetails', preserveNullAndEmptyArrays: true } },
      { $sort: { createdAt: -1 } }
    ]).toArray();

    const safeBookings = hostBookings.map(b => ({
      ...b,
      driverDetails: {
        name: b.driverDetails?.fullName || 'Unknown Driver',
        phone: b.driverDetails?.phone || 'No phone number',
        profilePic: b.driverDetails?.profilePic || null
      }
    }));

    res.status(200).json(safeBookings);
  } catch (error) {
    console.error('Host Bookings Error:', error);
    res.status(500).json({ error: 'Server error fetching host bookings.' });
  }
});

// ==========================================
// 14. UPDATE BOOKING STATUS (For Hosts)
// ==========================================
app.put('/api/bookings/:id/status', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'host') return res.status(403).json({ error: 'Unauthorized.' });

    const bookingId = req.params.id;
    const { status } = req.body;

    const bookingsCollection = db.collection('bookings');
    
    const result = await bookingsCollection.updateOne(
      { _id: new ObjectId(bookingId), hostId: new ObjectId(req.user.userId) },
      { $set: { status: status } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Booking not found or unauthorized.' });
    }

    res.status(200).json({ message: `Booking marked as ${status}` });

  } catch (error) {
    console.error('Update Booking Status Error:', error);
    res.status(500).json({ error: 'Server error updating status.' });
  }
});

app.listen(5000, '0.0.0.0', () => {
  console.log('🚀 Server running on port 5000');
  console.log('📡 Listening on all network interfaces (0.0.0.0)');
});