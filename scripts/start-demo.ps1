# MiniApart Unified Presentation Demo Startup Script
$ErrorActionPreference = 'Stop'

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  MiniApart Presentation Demo Startup" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Environment Variables for Backend
$env:SPRING_DATASOURCE_URL = 'jdbc:postgresql://127.0.0.1:5432/miniapart_demo_unified'
$env:SPRING_DATASOURCE_USERNAME = 'miniapart'
$env:SPRING_DATASOURCE_PASSWORD = 'miniapart'
$env:SERVER_PORT = '8080'
$env:APP_SEED_DEMO = 'false'
$env:APP_PRESENTATION_DEMO_ENABLED = 'false'

Write-Host "[1/3] Database: miniapart_demo_unified (Postgres port 5432)" -ForegroundColor Green
Write-Host "[2/3] Checking Backend Jar..." -ForegroundColor Green

$backendJar = "D:\vscode\miniapart\MiniApart-main\backend\build\libs\miniapart-backend-0.0.1-SNAPSHOT.jar"
if (-not (Test-Path $backendJar)) {
    Write-Host "Building backend jar..." -ForegroundColor Yellow
    Set-Location -LiteralPath 'D:\vscode\miniapart\MiniApart-main\backend'
    & .\gradlew.bat assemble -x test --console=plain
}

Write-Host "[3/3] Starting Backend on http://localhost:8080 ..." -ForegroundColor Green
Write-Host "Frontend running on http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "DEMO ACCOUNTS (Password: DemoOnly2026!):" -ForegroundColor Yellow
Write-Host "  - CHỦ NHÀ:   0999000011 (Nguyễn Hoàng Phúc)" -ForegroundColor White
Write-Host "  - QUẢN LÝ:   0999000020 (Vũ Thu Hà)" -ForegroundColor White
Write-Host "  - THỢ:       0999000031 (Lê Quốc Huy)" -ForegroundColor White
Write-Host "  - KHÁCH THUÊ:0999100001 (Trần Quang Huy)" -ForegroundColor White
Write-Host "  - QTHT:      0999000001 (Phạm Minh Quân)" -ForegroundColor White
Write-Host "==========================================================" -ForegroundColor Cyan

Set-Location -LiteralPath 'D:\vscode\miniapart\MiniApart-main\backend'
java -jar $backendJar
