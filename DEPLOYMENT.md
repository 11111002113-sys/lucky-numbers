# Deployment Guide - Shillong Teer Results Website

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- Git (for deployment)

## Local Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Edit `.env` file with your configuration:

```env
PORT=5000
NODE_ENV=production
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret_key
JWT_EXPIRE=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourSecurePassword123
CORS_ORIGIN=http://localhost:5000
```

### 3. Create Admin User

```bash
node scripts/createAdmin.js
```

### 4. (Optional) Seed Sample Data

```bash
node scripts/seedResults.js
```

### 5. Start the Server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

The server will run on `http://localhost:5000`

---

## Deployment Options

### Option 1: Deploy to Render

#### Backend Deployment

1. **Create a Render Account**: Go to [render.com](https://render.com)

2. **Create New Web Service**:
   - Connect your GitHub repository
   - Choose "Web Service"
   - Set build command: `npm install`
   - Set start command: `npm start`

3. **Environment Variables**:
   Add the following in Render dashboard:
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/teerresults
   JWT_SECRET=your_strong_secret_key_here
   JWT_EXPIRE=7d
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=SecurePassword123
   CORS_ORIGIN=https://your-frontend-url.com
   ```

4. **Deploy**: Click "Create Web Service"

5. **Create Admin User**: After deployment, use Render's shell:
   ```bash
   node scripts/createAdmin.js
   ```

#### Frontend on Render (Static Site)

If you want to serve frontend separately:
1. Create a new "Static Site" on Render
2. Set publish directory to `public`
3. Update API URLs in frontend JS files

---

### Option 2: Deploy to Railway

1. **Create Railway Account**: Go to [railway.app](https://railway.app)

2. **New Project**:
   - Click "New Project"
   - Choose "Deploy from GitHub repo"
   - Select your repository

3. **Add MongoDB**:
   - Click "New" → "Database" → "MongoDB"
   - Railway will automatically create MONGODB_URI

4. **Environment Variables**:
   Add in Railway dashboard:
   ```
   NODE_ENV=production
   JWT_SECRET=your_strong_secret_key
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=SecurePassword123
   CORS_ORIGIN=*
   ```

5. **Deploy**: Railway automatically deploys on push

---

### Option 3: Deploy to VPS (Ubuntu Server)

#### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb

# Install PM2 (Process Manager)
sudo npm install -g pm2

# Install Nginx (Reverse Proxy)
sudo apt install -y nginx
```

#### 2. Deploy Application

```bash
# Clone repository
cd /var/www
sudo git clone <your-repo-url> teerresult
cd teerresult

# Install dependencies
npm install

# Create .env file
sudo nano .env
# Add your environment variables

# Create admin user
node scripts/createAdmin.js

# Start with PM2
pm2 start server.js --name teerresult
pm2 save
pm2 startup
```

#### 3. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/teerresult
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # WebSocket support for Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/teerresult /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4. Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

### Option 4: Deploy Frontend to Netlify/Vercel

If deploying frontend separately:

#### Netlify:

1. Create `netlify.toml` in root:
   ```toml
   [build]
     publish = "public"
   
   [[redirects]]
     from = "/*"
     to = "/index.html"
     status = 200
   ```

2. Update API URLs in frontend JS files to your backend URL

3. Deploy via Netlify CLI or GitHub integration

#### Vercel:

1. Create `vercel.json`:
   ```json
   {
     "version": 2,
     "routes": [
       { "handle": "filesystem" },
       { "src": "/(.*)", "dest": "/public/$1" }
     ]
   }
   ```

2. Deploy: `vercel --prod`

---

## MongoDB Atlas Setup

1. **Create Account**: Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)

2. **Create Cluster**:
   - Choose free tier (M0)
   - Select region closest to your server

3. **Create Database User**:
   - Go to "Database Access"
   - Add new user with password

4. **Whitelist IP**:
   - Go to "Network Access"
   - Add IP: `0.0.0.0/0` (allow from anywhere) or your server IP

5. **Get Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy connection string
   - Replace `<password>` with your database password
   - Add to `.env` as `MONGODB_URI`

---

## Post-Deployment Steps

### 1. Test the Application

- Visit your website
- Check today's results page
- Browse history page
- Login to admin panel
- Declare test results

### 2. Create Admin User (if not done)

```bash
node scripts/createAdmin.js
```

### 3. Security Checklist

- ✅ Change default admin password
- ✅ Use strong JWT_SECRET
- ✅ Enable HTTPS/SSL
- ✅ Configure CORS properly
- ✅ Set up MongoDB authentication
- ✅ Regular backups of database
- ✅ Monitor server logs

### 4. Monitoring

#### PM2 (VPS):
```bash
pm2 logs teerresult
pm2 monit
```

#### Render/Railway:
- Check logs in dashboard
- Set up alerts for errors

---

## Maintenance

### Update Application

```bash
git pull origin main
npm install
pm2 restart teerresult
```

### Backup Database

```bash
# MongoDB dump
mongodump --uri="your_mongodb_uri" --out=/backup/$(date +%Y%m%d)
```

### View Logs

```bash
# PM2
pm2 logs teerresult

# System logs
tail -f /var/log/nginx/access.log
```

---

## Troubleshooting

### Server won't start
- Check `.env` file exists and has correct values
- Verify MongoDB connection string
- Check port availability: `netstat -tulpn | grep 5000`

### Can't login to admin
- Verify admin user exists: `node scripts/createAdmin.js`
- Check JWT_SECRET is set
- Clear browser cache and cookies

### Real-time updates not working
- Check Socket.io connection in browser console
- Verify CORS settings
- Ensure WebSocket is not blocked by firewall

### Database connection failed
- Test MongoDB connection string
- Check network access in MongoDB Atlas
- Verify database user credentials

---

## Support

For issues or questions:
1. Check logs for error messages
2. Verify environment variables
3. Test MongoDB connection separately
4. Check firewall/security group settings

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Admin user created
- [ ] MongoDB Atlas setup (or local MongoDB secured)
- [ ] HTTPS/SSL certificate installed
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Error logging setup
- [ ] Database backups scheduled
- [ ] Server monitoring active
- [ ] Default passwords changed
- [ ] Firewall configured
- [ ] Application tested end-to-end
