# Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Step 1: Install Dependencies

Open PowerShell/Terminal in the project folder and run:

```powershell
npm install
```

### Step 2: Start MongoDB

**Option A - Local MongoDB:**
```powershell
# If MongoDB is installed locally
mongod
```

**Option B - MongoDB Atlas (Cloud - Recommended):**
1. Create free account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Get connection string
4. Update `MONGODB_URI` in `.env` file

### Step 3: Create Admin User

```powershell
node scripts/createAdmin.js
```

**Default Admin Credentials:**
- Email: `admin@teerresults.com`
- Password: `Admin@123456`

### Step 4: (Optional) Add Sample Data

```powershell
node scripts/seedResults.js
```

### Step 5: Start the Server

```powershell
npm start
```

Or for development mode with auto-reload:

```powershell
npm run dev
```

### Step 6: Access the Website

Open your browser and visit:
- **Homepage:** http://localhost:5000
- **History:** http://localhost:5000/history.html
- **Admin Login:** http://localhost:5000/admin/login.html

---

## 📱 How to Use

### For Public Users (No Login Required)

1. **View Today's Results:**
   - Go to homepage
   - See First Round and Second Round results
   - Results update in real-time when admin declares them

2. **Browse Previous Results:**
   - Click "Previous Results"
   - Search by date or browse all results
   - Pagination available for easy navigation

### For Admin Users

1. **Login:**
   - Go to http://localhost:5000/admin/login.html
   - Use your admin credentials
   - Default: `admin@teerresults.com` / `Admin@123456`

2. **Declare Results:**
   - Enter First Round result (0-99)
   - Click "Declare F/R"
   - Later, enter Second Round result
   - Click "Declare S/R"

3. **Lock Results:**
   - After declaring both results
   - Click "Lock Result" to prevent accidental changes

4. **Edit Past Results:**
   - Select a date from calendar
   - Click "Load Result"
   - Edit and save

---

## 🔧 Configuration

### Change Admin Password

1. Login to admin panel
2. OR edit `.env` file and recreate admin:
   ```env
   ADMIN_EMAIL=youremail@example.com
   ADMIN_PASSWORD=YourSecurePassword
   ```
3. Run: `node scripts/createAdmin.js`

### Change Shooting Times

Default times are:
- First Round: 3:15 PM
- Second Round: 4:15 PM

To change:
1. Login to admin panel
2. Update times in the form
3. Save

---

## 📊 Features

### Public Features
✅ Real-time result updates  
✅ Today's results with shooting times  
✅ Historical results with search  
✅ Mobile responsive design  
✅ Auto-refresh fallback  
✅ Clean and modern UI  

### Admin Features
✅ Secure JWT authentication  
✅ Declare F/R and S/R separately  
✅ Lock/unlock results  
✅ Edit past results  
✅ Update shooting times  
✅ View recent results  
✅ Real-time updates to public site  

---

## 🛠️ Troubleshooting

### "Cannot connect to MongoDB"
- **If using local MongoDB:** Make sure MongoDB is running
  ```powershell
  mongod
  ```
- **If using MongoDB Atlas:** Check your connection string in `.env`

### "Port 5000 already in use"
- Change port in `.env` file:
  ```env
  PORT=3000
  ```

### "Admin already exists"
- Admin user is already created
- Use existing credentials or delete from database first

### Real-time updates not working
- Make sure server is running
- Check browser console for errors
- Refresh the page

### Can't login to admin
- Verify credentials
- Make sure admin user is created
- Clear browser cache

---

## 📦 Project Structure

```
teerresult/
├── config/              # Configuration files
│   └── db.js           # Database connection
├── middleware/          # Express middleware
│   ├── auth.js         # JWT authentication
│   └── rateLimiter.js  # Rate limiting
├── models/             # MongoDB models
│   ├── Admin.js        # Admin user model
│   └── Result.js       # Result model
├── public/             # Frontend files
│   ├── admin/          # Admin panel
│   │   ├── dashboard.html
│   │   └── login.html
│   ├── css/            # Stylesheets
│   ├── js/             # JavaScript files
│   ├── history.html    # Previous results page
│   └── index.html      # Homepage
├── routes/             # API routes
│   ├── admin.js        # Admin endpoints
│   └── results.js      # Public endpoints
├── scripts/            # Utility scripts
│   ├── createAdmin.js  # Create admin user
│   └── seedResults.js  # Seed sample data
├── utils/              # Helper functions
│   └── helpers.js
├── .env                # Environment variables
├── .env.example        # Environment template
├── package.json        # Dependencies
├── server.js           # Main server file
├── DEPLOYMENT.md       # Deployment guide
└── README.md           # Documentation
```

---

## 🌐 API Endpoints

### Public Endpoints (No Authentication)

```
GET  /api/results/today          # Get today's result
GET  /api/results/:date          # Get result by date
GET  /api/results                # Get all results (with pagination)
```

### Admin Endpoints (JWT Required)

```
POST /api/admin/login                      # Admin login
POST /api/admin/results                    # Add/update result
POST /api/admin/results/:date/declare/fr   # Declare F/R
POST /api/admin/results/:date/declare/sr   # Declare S/R
POST /api/admin/results/:date/lock         # Lock result
POST /api/admin/results/:date/unlock       # Unlock result
PUT  /api/admin/results/:date              # Edit result
```

---

## 🔐 Security Features

- ✅ JWT token-based authentication
- ✅ bcrypt password hashing
- ✅ Rate limiting (5 login attempts per 10 minutes)
- ✅ CORS protection
- ✅ Environment variable secrets
- ✅ Input validation
- ✅ Result locking mechanism

---

## 📝 Notes

1. **Change Default Password:** After first login, change the default admin password

2. **Backup Database:** Regularly backup your MongoDB database

3. **HTTPS in Production:** Always use HTTPS/SSL in production

4. **MongoDB Atlas:** Free tier is sufficient for small to medium traffic

5. **Environment Variables:** Never commit `.env` file to Git

---

## 🚀 Next Steps

1. ✅ Setup and run locally
2. ✅ Test all features
3. ✅ Change admin password
4. ✅ Deploy to production (see DEPLOYMENT.md)
5. ✅ Set up MongoDB Atlas
6. ✅ Configure domain and SSL
7. ✅ Set up monitoring

---

## 📞 Need Help?

- Check DEPLOYMENT.md for deployment guides
- Review error logs in console
- Test API endpoints with Postman
- Check MongoDB connection

---

**Ready to go live? See DEPLOYMENT.md for production deployment guides!**
