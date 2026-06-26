<div align="center">

# 🚗 Smart Neighbourhood Parking Sharing App

### A real-time, community-driven parking platform that connects neighbours with unused parking spots to drivers who need them.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 📖 About The Project

Urban parking is a daily struggle — drivers circle blocks for minutes while nearby residents have empty driveways sitting unused. The **Smart Neighbourhood Parking Sharing App** bridges that gap by enabling residents to list their unused parking spots and allowing drivers to discover, book, and navigate to them in real time.

Built as a full-stack mobile application, this project integrates live location tracking, dynamic pricing, booking management, and an interactive heatmap — all wrapped in a secure, JWT-authenticated platform.

---

## ✨ Key Features

- 🗺️ **Real-Time Location & Map Integration** — live map view showing nearby available spots
- 📍 **Spot Listing by Residents** — homeowners can list, price, and manage their spots
- 📅 **Booking Management** — book, cancel, and track reservation status in real time
- 💰 **Dynamic Pricing** — pricing adjusts based on demand and availability
- 🔥 **Heatmap Visualization** — visual hotspot view of high-demand parking zones
- 🔐 **JWT Authentication** — secure login/signup with token-based session management
- 🔔 **Booking Notifications** — real-time updates for booking confirmations and cancellations
- 📱 **Cross-Platform** — runs on both Android and iOS via Expo

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native, Expo |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (NoSQL) |
| **Authentication** | JWT (JSON Web Tokens) |
| **API Design** | RESTful APIs |
| **Maps & Location** | Real-time GPS, Map APIs |
| **Data Visualization** | Heatmap Overlay |

---

## 🏗️ System Architecture

```
┌───────────────────────────────────┐
│        React Native App           │
│  (Expo | Maps | Booking UI)       │
└────────────────┬──────────────────┘
                 │ REST API calls (HTTPS)
┌────────────────▼──────────────────┐
│        Node.js + Express.js       │
│  (Routes | Controllers | Middleware│
│         JWT Auth Guard)           │
└────────────────┬──────────────────┘
                 │
┌────────────────▼──────────────────┐
│              MongoDB              │
│  Users | Spots | Bookings | Pricing│
└───────────────────────────────────┘
```

---

## 📡 API Endpoints

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login and receive JWT |

### Parking Spot Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/spots` | Get all available spots |
| POST | `/api/spots` | List a new parking spot |
| PUT | `/api/spots/:id` | Update spot details |
| DELETE | `/api/spots/:id` | Remove a spot listing |

### Booking Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/bookings` | Create a new booking |
| GET | `/api/bookings/:userId` | Get user's booking history |
| PUT | `/api/bookings/:id/cancel` | Cancel a booking |

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)
- Expo CLI
- Android/iOS emulator or Expo Go app

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/arundhathym/smart-parking-app.git
cd smart-parking-app
```

**2. Install Backend Dependencies**
```bash
cd backend
npm install
```

**3. Configure Environment Variables**

Create a `.env` file in the `/backend` folder:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

**4. Start the Backend Server**
```bash
npm start
```

**5. Install Frontend Dependencies**
```bash
cd ../frontend
npm install
```

**6. Start the Expo App**
```bash
npx expo start
```

Scan the QR code with the **Expo Go** app on your phone or run on an emulator.

---

## 📂 Folder Structure

```
smart-parking-app/
├── backend/
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── spotController.js
│   │   └── bookingController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Spot.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── spotRoutes.js
│   │   └── bookingRoutes.js
│   └── server.js
├── frontend/
│   ├── components/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── MapScreen.js
│   │   ├── BookingScreen.js
│   │   └── ProfileScreen.js
│   ├── navigation/
│   └── App.js
└── README.md
```

---

## 🔐 Security Features

- Password hashing with **bcrypt**
- Token-based session handling using **JWT**
- Protected routes with authentication middleware
- Environment variable management via `.env`

---

## 🙋‍♀️ Developer

**Arundhathy Mohan**
MCA Graduate | Full Stack Developer

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](http://www.linkedin.com/in/arundhathy-)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/arundhathym)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=flat&logo=gmail&logoColor=white)](mailto:arundhathymohan2003@gmail.com)

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
⭐ If you found this project interesting, give it a star!
</div>
