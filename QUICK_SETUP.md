# 🚀 QUICK SETUP - Password Reset Email

## ⚡ Fast Setup (5 minutes)

### 1️⃣ Get Gmail App Password

1. **Go to**: https://myaccount.google.com/apppasswords
2. **Sign in** to your Gmail account
3. **Select**: "Mail" → "Other (Custom name)"
4. **Name it**: "Lucky Numbers"
5. **Click Generate**
6. **COPY** the 16-character password (looks like: `abcd efgh ijkl mnop`)

### 2️⃣ Add to Render

1. **Go to**: https://dashboard.render.com
2. **Select** your "lucky-numbers" service
3. **Click** "Environment" in left menu
4. **Add** these two variables:

```
EMAIL_USERNAME = your-gmail@gmail.com
EMAIL_PASSWORD = abcdefghijklmnop (no spaces!)
```

5. **Click** "Save Changes"
6. Wait for auto-deploy (3-5 minutes)

### 3️⃣ Test It! ✅

1. Go to your site: `https://your-app.onrender.com/admin/login.html`
2. Click **"Forgot Password?"**
3. Enter admin email: `admin@teerresults.com`
4. Check your Gmail inbox
5. Click reset link
6. Enter new password
7. Login with new password!

---

## 🔐 What Changed

### Security Improvements:
✅ **IP Block**: 3 failed attempts = blocked for **1 minute** (was 15-30 min)
✅ **Rate Limit**: 3 login attempts per **1 minute** (was 15 min)
✅ **Password Reset**: Via secure email with 10-minute expiry
✅ **Reset Tokens**: One-time use, hashed in database
✅ **Email Sending**: Gmail SMTP (secure, reliable)

### New Pages:
- `/admin/forgot-password.html` - Request password reset
- `/admin/reset-password.html` - Enter new password
- `/admin/settings.html` - Change email, password, manage 2FA

### How Password Reset Works:
1. User enters email on forgot password page
2. System generates secure token (expires in 10 minutes)
3. Email sent with reset link
4. User clicks link, enters new password
5. Token invalidated, password updated
6. User logs in with new password

---

## ⚠️ Important Notes

### Gmail App Password Requirements:
- ❌ **DON'T** use your regular Gmail password
- ✅ **DO** use the 16-character App Password
- ❌ **DON'T** include spaces when copying to Render
- ✅ **DO** enable 2-Step Verification on Gmail first

### If Email Not Sending:
1. Check Render logs for errors
2. Verify App Password is correct (no spaces)
3. Make sure 2-Step Verification is enabled on Gmail
4. Check spam folder
5. Try generating a new App Password

---

## 🎯 Complete Security Stack

Your admin panel now has:

1. **Hidden URL** - No public links to admin
2. **Rate Limiting** - 3 attempts per minute
3. **IP Blocking** - Automatic 1-minute blocks
4. **Email/Password** - Strong authentication
5. **2FA (Optional)** - Extra security layer via authenticator app
6. **Password Reset** - Secure email recovery
7. **Settings Page** - Self-service email/password changes
8. **Access Logging** - All attempts logged with IPs
9. **Security Headers** - CSP, X-Frame-Options, etc.
10. **Honeypot Traps** - Catch automated attacks

---

## 📞 Need Help?

Check the detailed guide: `PASSWORD_RESET_SETUP.md`
