# Shillong Teer Results Website

A public website for displaying Shillong Teer results with real-time updates and admin management.

## Features

### Public Features
- **Today's Result Page**: Display current day results with F/R and S/R
- **Historical Results**: Browse and search previous results
- **Real-time Updates**: Automatic updates when admin declares results
- **Mobile Responsive**: Works perfectly on all devices

### Admin Features
- **Secure Login**: JWT-based authentication
- **Add/Update Results**: Manage daily results
- **Declare Results**: Separately declare F/R and S/R
- **Lock Results**: Prevent accidental changes
- **Edit History**: Update past results if needed

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose
- **Real-time**: Socket.io
- **Authentication**: JWT + bcrypt
- **Frontend**: HTML, CSS, JavaScript

## Installation

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd teerresult
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Set up MongoDB**
- Install MongoDB locally OR use MongoDB Atlas
- Update MONGODB_URI in .env

5. **Create admin user**
```bash
node scripts/createAdmin.js
```

6. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## API Endpoints

### Public Endpoints (No Authentication)

- `GET /api/results/today` - Get today's result
- `GET /api/results/:date` - Get result by date (YYYY-MM-DD)
- `GET /api/results` - Get results history (with query params: from, to, limit, page)

### Admin Endpoints (JWT Required)

- `POST /api/admin/login` - Admin login
- `POST /api/admin/results` - Add/update result
- `POST /api/admin/results/:date/declare/fr` - Declare First Round
- `POST /api/admin/results/:date/declare/sr` - Declare Second Round
- `POST /api/admin/results/:date/lock` - Lock result
- `PUT /api/admin/results/:date` - Edit result

## Frontend Pages

- `index.html` - Today's results (Homepage)
- `history.html` - Previous results with search
- `admin/login.html` - Admin login page
- `admin/dashboard.html` - Admin control panel

## Deployment

### Backend (Render/Railway/VPS)

1. Set environment variables
2. Deploy backend code
3. Ensure MongoDB connection is configured

### Frontend (Netlify/Vercel/Same Server)

1. Update API endpoints in frontend JS files
2. Deploy static files

### MongoDB Atlas

1. Create cluster on MongoDB Atlas
2. Get connection string
3. Update MONGODB_URI in .env

## Security Features

- JWT authentication for admin
- bcrypt password hashing
- Rate limiting on login (5 attempts / 10 min)
- CORS protection
- Environment variables for secrets

## License

ISC
