<div align="center">

# 🚗 Smart Neighbourhood Parking Sharing Application

### A full-stack React Native mobile app that connects residents who have unused parking spots with drivers who need them — with dual-role dashboards, bulk booking, heatmap visualization, and integrated payments.

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=jsonwebtokens&logoColor=white)

</div>

---

## 📖 About The Project

Urban neighbourhoods have two problems happening at the same time — drivers circling streets looking for parking, and residents with empty driveways they never use. The **Smart Neighbourhood Parking Sharing App** solves both.

Built as an MCA Main Project at College of Engineering Chengannur (APJ Abdul Kalam Technological University), this is a full-stack mobile application with a **dual-role system**: users can sign up as a **Host** (space owner) or as a **Driver** (space seeker), each getting their own tailored dashboard and feature set.

---

## ✨ Features

### 👥 Dual Role System
- **Role Selection** at onboarding — choose to be a Host or a Driver
- Separate dedicated dashboards per role

### 🏠 Host Features
- Add and manage parking space listings
- View and respond to booking requests
- Manage host profile and preferences
- Track booking history

### 🚗 Driver Features
- Browse and search available parking spots
- View detailed spot information
- Book individual spots or use **Bulk Booking** for multiple spots
- View bulk search results
- Save favourite spots for quick access
- View full booking history and individual booking details

### 🗺️ Maps & Visualization
- Real-time map view of available nearby spots
- **Heatmap visualization** of high-demand parking zones in the neighbourhood

### 💳 Payments
- Integrated payments screen for booking transactions

### 🔐 Authentication
- User registration and login
- JWT-based session management
- Personal details management

### 🛟 Support
- In-app Help Center screen

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React Native, Expo |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB |
| **Authentication** | JWT (JSON Web Tokens) |
| **API Design** | RESTful APIs |
| **Maps & Location** | Real-time GPS, Map integration |
| **Data Visualization** | Heatmap overlay |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────┐
│         React Native App (Expo)        │
│                                        │
│  Host Flow          Driver Flow        │
│  ─────────────      ─────────────      │
│  HostDashboard      UserDashboard      │
│  AddSpace           SpotDetails        │
│  HostProfile        BulkBooking        │
│  HostPreferences    SavedSpots         │
│  RequestDetails     UserBookingHistory │
│  BookingHistory     Payments           │
└──────────────┬─────────────────────────┘
               │ REST API (HTTP/JSON + JWT)
┌──────────────▼─────────────────────────┐
│       Node.js + Express.js Backend     │
│   Routes · Controllers · JWT Middleware│
└──────────────┬─────────────────────────┘
               │
┌──────────────▼─────────────────────────┐
│               MongoDB                  │
│  Users · Spots · Bookings · Payments   │
└────────────────────────────────────────┘
```

---

## 📂 Project Structure

```
Smart-Neighbourhood-Parking-Sharing-Application/
├── src/
│   └── screens/
│       ├── RoleSelectionScreen.js     # Onboarding — choose Host or Driver
│       ├── Login.js                   # User login
│       ├── Register.js                # New user registration
│       ├── PersonalDetails.js         # User profile info
│       │
│       ├── HostDashboard.js           # Main dashboard for Hosts
│       ├── AddSpace.js                # Add a new parking spot listing
│       ├── HostProfile.js             # Host profile management
│       ├── HostPreferences.js         # Host settings and preferences
│       ├── RequestDetails.js          # View and manage booking requests
│       ├── BookingHistory.js          # Host booking history
│       │
│       ├── UserDashboard.js           # Main dashboard for Drivers
│       ├── ParkingSpaceDetails.js     # Full details of a listing
│       ├── SpotDetails.js             # Spot view with map
│       ├── BulkBooking.js             # Book multiple spots at once
│       ├── BulkSearchResults.js       # Results from bulk search
│       ├── SavedSpots.js              # Driver's saved/favourite spots
│       ├── UserBookingHistory.js      # Driver's full booking history
│       ├── UserBookingDetails.js      # Individual booking detail view
│       ├── Payments.js                # Payment processing screen
│       │
│       ├── HeatmapDetail.js           # High-demand zone heatmap
│       └── HelpCenter.js             # In-app support and FAQs
│
├── src/config.js                      # API base URL and app config
├── App.js                             # Root component and navigation setup
├── app.json                           # Expo configuration
├── index.js                           # App entry point
└── package.json                       # Dependencies
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- Expo CLI (`npm install -g expo-cli`)
- MongoDB (local or MongoDB Atlas)
- Expo Go app on your phone (for testing)

### Installation

**1. Clone the repository**
```bash
git clone https://github.com/arundhathym/Smart-Neighbourhood-Parking-Sharing-Application.git
cd Smart-Neighbourhood-Parking-Sharing-Application
```

**2. Install frontend dependencies**
```bash
npm install
```

**3. Configure API base URL**

Open `src/config.js` and update the backend URL:
```js
export const BASE_URL = "http://your-backend-ip:5000";
```

**4. Start the Expo app**
```bash
npx expo start
```

Scan the QR code using **Expo Go** on your Android or iOS device.

### Backend Setup

```bash
# Navigate to your backend folder
npm install

# Create .env file
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key

# Start the server
npm start
```

---

## 📱 App Flow

```
Launch App
    │
    ▼
Role Selection ──► Host ──► Host Dashboard ──► Add Space
                                           ──► View Requests
                                           ──► Booking History
    │
    └──────────► Driver ──► User Dashboard ──► Browse Spots
                                           ──► Bulk Booking
                                           ──► Saved Spots
                                           ──► Booking History
                                           ──► Payments
```

---

## 🔮 Future Scope

- [ ] Real-time booking notifications (push notifications)
- [ ] In-app chat between Host and Driver
- [ ] Rating and review system for spots
- [ ] Google Maps / location-based spot discovery
- [ ] Admin dashboard for dispute management

---

## 🙋‍♀️ Developer

**Arundhathy Mohan**
MCA Graduate | Full Stack Developer
College of Engineering Chengannur, APJ Abdul Kalam Technological University

[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=flat&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/arundhathy)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=flat&logo=github&logoColor=white)](https://github.com/arundhathym)
[![Gmail](https://img.shields.io/badge/Gmail-D14836?style=flat&logo=gmail&logoColor=white)](mailto:arundhathymohan2003@gmail.com)

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">
⭐ If you found this useful, give it a star!
</div>
