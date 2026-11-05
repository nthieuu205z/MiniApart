param([switch]$ForProduction)
$ErrorActionPreference = 'Stop'
$taskProject = Split-Path -Parent $PSScriptRoot
$taskEnvPath = Join-Path $taskProject '.env'
if (Test-Path -LiteralPath $taskEnvPath) {
    Write-Output '.env đã tồn tại; giữ nguyên các khoá hiện có.'
    exit 0
}
function New-PrivateValue {
    $taskBytes = New-Object byte[] 48
    $taskRng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $taskRng.GetBytes($taskBytes) } finally { $taskRng.Dispose() }
    return [Convert]::ToBase64String($taskBytes)
}
$taskProfile = if ($ForProduction) { 'production' } else { 'local' }
$taskLocalDelivery = if ($ForProduction) { 'false' } else { 'true' }
$taskLines = @(
    "POSTGRES_PASSWORD=$(New-PrivateValue)",
    "APP_DB_PASSWORD=$(New-PrivateValue)",
    "JWT_SECRET=$(New-PrivateValue)",
    "ANH_LINK_SECRET=$(New-PrivateValue)",
    "APP_PROFILE=$taskProfile",
    "LOCAL_CODE_DELIVERY=$taskLocalDelivery",
    'BIND_ADDRESS=127.0.0.1',
    'FRONTEND_PORT=5173'
)
[System.IO.File]::WriteAllLines($taskEnvPath, $taskLines, (New-Object System.Text.UTF8Encoding($false)))
Write-Output 'Đã tạo .env với khoá riêng. Không đưa tệp này lên Git.'
