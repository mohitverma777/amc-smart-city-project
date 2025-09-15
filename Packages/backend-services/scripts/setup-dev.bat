@echo off
echo 🚀 Setting up AMC Smart City development environment...

REM Navigate to project root (3 levels up from scripts directory)
cd ..\..\..

echo 📦 Installing dependencies for all packages...

REM Install dependencies for each package
for /d %%d in (packages\*) do (
    if exist "%%d\package.json" (
        echo Installing dependencies for %%~nxd...
        cd "%%d"
        
        REM Use legacy peer deps for React packages to avoid version conflicts
        if "%%~nxd"=="amc-dashboard" (
            echo Using legacy peer deps for amc-dashboard to resolve React conflicts...
            call npm install --legacy-peer-deps
        ) else (
            call npm install
        )
        
        if errorlevel 1 (
            echo ⚠️ Warning: Failed to install dependencies for %%~nxd, but continuing...
        )
        cd ..\..
    )
)

echo 🐳 Starting database containers...
cd packages\backend-services\docker\development
docker-compose up -d

echo ⏳ Waiting for databases to be ready...
timeout /t 30 /nobreak > nul

echo ✅ Development environment setup complete!
echo 🎯 Next steps:
echo    1. Copy .env.example to .env in each service
echo    2. Update environment variables
echo    3. Run services with 'npm run dev'
echo ⚠️  Note: amc-dashboard may need manual dependency resolution