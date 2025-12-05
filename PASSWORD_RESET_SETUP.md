# Password Reset Setup Guide

## 🔐 Gmail SMTP Configuration

To enable password reset emails, you need to configure Gmail SMTP with an App Password.

### Step 1: Enable 2-Step Verification on Your Gmail Account

1. Go to your Google Account: https://myaccount.google.com
2. Click on **Security** in the left sidebar
3. Under "How you sign in to Google", click on **2-Step Verification**
4. Follow the steps to enable 2-Step Verification

### Step 2: Generate an App Password

1. Go to: https://myaccount.google.com/apppasswords
2. You may need to sign in again
3. Select **Mail** from the "Select app" dropdown
4. Select **Other (Custom name)** from the "Select device" dropdown
5. Enter a name like "Lucky Numbers Admin"
6. Click **Generate**
7. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 3: Configure Environment Variables

#### For Local Development:

Edit your `.env` file:

```env
EMAIL_USERNAME=your-gmail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password-here
```

#### For Render.com Deployment:

1. Go to your Render dashboard
2. Select your web service
3. Click on **Environment** in the left sidebar
4. Add these environment variables:
   - `EMAIL_USERNAME`: Your Gmail address
   - `EMAIL_PASSWORD`: The 16-character App Password

### Step 4: Test Password Reset

1. Go to login page: `/admin/login.html`
2. Click **Forgot Password?**
3. Enter your admin email
4. Check your inbox for the reset email
5. Click the reset link (valid for 10 minutes)
6. Enter your new password

## 🔒 Security Features

### IP Blocking
- **3 failed attempts** = IP blocked for **1 minute**
- Automatic unblock after duration
- Logs all failed attempts with IP addresses

### Rate Limiting
- Login: **3 attempts per 1 minute**
- Admin routes: **50 requests per 10 minutes**
- Public API: **100 requests per 15 minutes**

### Password Reset Security
- Reset tokens expire in **10 minutes**
- One-time use tokens (automatically invalidated after use)
- Tokens are hashed in database
- Email sent via secure Gmail SMTP

### Two-Factor Authentication (2FA)
- Optional additional security layer
- Uses TOTP (Time-based One-Time Password)
- Compatible with Google Authenticator, Authy, etc.
- Can be enabled/disabled in Settings

## 📧 Troubleshooting Email Issues

### "Email could not be sent"
- Check if 2-Step Verification is enabled on Gmail
- Verify you're using an App Password, not your regular password
- Make sure the App Password has no spaces (Render adds them automatically)
- Check Render logs for specific error messages

### Reset email not received
- Check spam/junk folder
- Verify the admin email in database matches
- Check Render logs for email sending errors
- Ensure EMAIL_USERNAME and EMAIL_PASSWORD are set correctly

### "Invalid or expired reset token"
- Reset link expires after 10 minutes
- Each link can only be used once
- Request a new reset link

## 🎯 Admin Settings Page

Access: `/admin/settings.html`

Features:
- **Change Email**: Update your admin email address
- **Change Password**: Change your password (requires current password)
- **2FA Management**: Enable/disable two-factor authentication

All changes require authentication and are logged for security.
