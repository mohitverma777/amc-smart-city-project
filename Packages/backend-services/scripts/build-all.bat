@echo off
echo 🏗️ Building all AMC Smart City services...

REM Navigate to project root
cd ..\..\..

echo 📦 Building services...

REM Build each service that has a build script
for /d %%d in (packages\*) do (
    if exist "%%d\package.json" (
        cd "%%d"
        echo Checking %%~nxd for build script...
        
        REM Check if package.json has a build script
        findstr /C:"\"build\"" package.json >nul
        if errorlevel 1 (
            echo No build script for %%~nxd
        ) else (
            echo Building %%~nxd...
            if "%%~nxd"=="backend-services" (
                REM Skip building backend-services as it's trying to build workspaces
                echo Skipping backend-services build (it's a workspace root)
            ) else (
                call npm run build
                if errorlevel 1 (
                    echo ⚠️ Warning: Build failed for %%~nxd, but continuing...
                )
            )
        )
        cd ..\..
    )
)

echo ✅ All services processed!