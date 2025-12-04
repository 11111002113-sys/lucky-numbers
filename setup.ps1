# Setup Instructions for Windows PowerShell

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Shillong Teer Results - Setup Script" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if MongoDB is installed (optional)
Write-Host "Checking MongoDB installation..." -ForegroundColor Yellow
try {
    $mongoVersion = mongod --version
    Write-Host "✓ MongoDB is installed" -ForegroundColor Green
} catch {
    Write-Host "⚠ MongoDB is not installed locally" -ForegroundColor Yellow
    Write-Host "  You can use MongoDB Atlas (cloud) instead" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Starting Setup..." -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install dependencies
Write-Host "Step 1: Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Dependencies installed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Check .env file
Write-Host "Step 2: Checking environment configuration..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "✓ .env file exists" -ForegroundColor Green
} else {
    Write-Host "⚠ .env file not found, creating from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host "⚠ Please update MongoDB URI in .env file if needed" -ForegroundColor Yellow
}

Write-Host ""

# Step 3: Create admin user
Write-Host "Step 3: Creating admin user..." -ForegroundColor Yellow
Write-Host "⚠ Make sure MongoDB is running!" -ForegroundColor Yellow
Write-Host ""
$createAdmin = Read-Host "Do you want to create admin user now? (Y/N)"
if ($createAdmin -eq "Y" -or $createAdmin -eq "y") {
    node scripts/createAdmin.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Admin user created!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to create admin user" -ForegroundColor Red
        Write-Host "  Make sure MongoDB is running" -ForegroundColor Yellow
    }
} else {
    Write-Host "⊙ Skipped admin creation" -ForegroundColor Yellow
    Write-Host "  Run 'node scripts/createAdmin.js' later" -ForegroundColor Yellow
}

Write-Host ""

# Step 4: Seed sample data (optional)
Write-Host "Step 4: Sample data (optional)..." -ForegroundColor Yellow
$seedData = Read-Host "Do you want to add sample results? (Y/N)"
if ($seedData -eq "Y" -or $seedData -eq "y") {
    node scripts/seedResults.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Sample data added!" -ForegroundColor Green
    } else {
        Write-Host "✗ Failed to seed data" -ForegroundColor Red
    }
} else {
    Write-Host "⊙ Skipped sample data" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "Setup Complete!" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Make sure MongoDB is running" -ForegroundColor White
Write-Host "   - Local: Run 'mongod' in another terminal" -ForegroundColor White
Write-Host "   - Or use MongoDB Atlas (cloud)" -ForegroundColor White
Write-Host ""
Write-Host "2. Start the server:" -ForegroundColor White
Write-Host "   npm start" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Visit the website:" -ForegroundColor White
Write-Host "   Homepage: http://localhost:5000" -ForegroundColor Cyan
Write-Host "   Admin: http://localhost:5000/admin/login.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Admin Credentials:" -ForegroundColor Yellow
Write-Host "   Email: admin@teerresults.com" -ForegroundColor White
Write-Host "   Password: Admin@123456" -ForegroundColor White
Write-Host ""
Write-Host "⚠ Change the password after first login!" -ForegroundColor Yellow
Write-Host ""
Write-Host "For more help, see:" -ForegroundColor Yellow
Write-Host "   - QUICKSTART.md" -ForegroundColor Cyan
Write-Host "   - README.md" -ForegroundColor Cyan
Write-Host "   - DEPLOYMENT.md" -ForegroundColor Cyan
Write-Host ""
