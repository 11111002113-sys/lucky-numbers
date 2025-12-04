# Deployment Guide - Lucky Numbers Website

## 🚀 Free Hosting Options

### Option 1: Render.com (Recommended)

#### Step 1: Create GitHub Repository
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/lucky-numbers.git
git push -u origin main
```

#### Step 2: Deploy on Render
1. Go to https://render.com and sign up (free)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: lucky-numbers
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

#### Step 3: Add Environment Variables
In Render dashboard, add these environment variables:
- `MONGODB_URI` = mongodb+srv://wangchuk:WfQZ0m9IXxxCEeT0@cluster0.mpxlq3v.mongodb.net/teerresults
- `JWT_SECRET` = teer_results_jwt_secret_key_2024_secure
- `ADMIN_EMAIL` = admin@teerresults.com
- `ADMIN_PASSWORD` = Admin@123456
- `NODE_ENV` = production

#### Step 4: Access Your Site
- Free URL: `https://lucky-numbers.onrender.com`
- Add custom domain in Settings → Custom Domains

---

### Option 2: Railway.app

#### Deploy with Railway
1. Go to https://railway.app
2. Sign up with GitHub (free)
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your repository
5. Add environment variables (same as above)
6. Deploy!

**Free URL**: `https://lucky-numbers.up.railway.app`

---

### Option 3: Vercel

#### Deploy with Vercel
```bash
npm install -g vercel
vercel login
vercel
```

Follow prompts and add environment variables when asked.

---

## 🌐 Free Domain Options

### Option A: Use Platform Subdomain (Instant)
- Render: `yoursite.onrender.com`
- Vercel: `yoursite.vercel.app`
- Railway: `yoursite.up.railway.app`

### Option B: Free Domain Providers
1. **Freenom.com** - Free .tk, .ml, .ga, .cf, .gq domains
2. **InfinityFree.net** - Free .rf.gd subdomain
3. **000webhost.com** - Free hosting with subdomain

### Option C: Connect Custom Domain (If you buy one)
Most platforms support custom domains for free:
1. Buy domain from Namecheap ($8-12/year)
2. Add to your hosting platform
3. Update DNS records

---

## 📝 Pre-Deployment Checklist

- ✅ `.env` file NOT pushed to GitHub (add to .gitignore)
- ✅ MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- ✅ Environment variables configured on hosting platform
- ✅ `package.json` has correct start script
- ✅ Admin user created in database

---

## 🔧 Quick Commands

### Initialize Git Repository
```bash
git init
git add .
git commit -m "Deploy Lucky Numbers website"
```

### Create .gitignore
```bash
echo node_modules/ > .gitignore
echo .env >> .gitignore
```

### Push to GitHub
```bash
# Create repository on github.com first, then:
git remote add origin https://github.com/YOUR_USERNAME/lucky-numbers.git
git push -u origin main
```

---

## 💡 Recommended Path

**For beginners**: Render.com
- Easiest setup
- Free SSL certificate
- Auto-deploys from GitHub
- Free subdomain included
- Can add custom domain later

**Total Cost**: $0 (completely free with .onrender.com subdomain)

**To get .com domain**: Purchase from Namecheap ($10/year) and connect to Render

---

## 🆘 Need Help?

After deployment, your site will be live at:
- Homepage: `https://yoursite.onrender.com`
- Admin Panel: `https://yoursite.onrender.com/admin/login.html`
- API: `https://yoursite.onrender.com/api/results/today`
