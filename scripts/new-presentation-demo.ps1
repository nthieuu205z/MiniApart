param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^miniapart_demo_[a-z0-9_]+$')]
    [string]$DatabaseName,
    [Parameter(Mandatory = $true)]
    [string]$PsqlPath,
    [string]$DatabaseUser = 'miniapart',
    [int]$Port = 8082,
    [datetime]$ReferenceDate = (Get-Date)
)

$ErrorActionPreference = 'Stop'
# Only localhost is supported by this helper. Passwords are supplied in process
# environment, never command arguments, output, source files or checked-in config.
if (-not (Test-Path -LiteralPath $PsqlPath -PathType Leaf)) { throw 'psql executable not found.' }
if ([string]::IsNullOrWhiteSpace($env:PGPASSWORD)) { throw 'Set PGPASSWORD for the local PostgreSQL demo owner first.' }
if ([string]::IsNullOrWhiteSpace($env:APP_PRESENTATION_DEMO_PASSWORD) -or $env:APP_PRESENTATION_DEMO_PASSWORD.Length -lt 12) {
    throw 'Set APP_PRESENTATION_DEMO_PASSWORD to a demo-only password of at least 12 characters.'
}
# Deliberately no IF NOT EXISTS: refuse existing databases before Flyway can run.
& $PsqlPath -X -w -h localhost -p 5432 -U $DatabaseUser -d postgres -v ON_ERROR_STOP=1 -c "CREATE DATABASE `"$DatabaseName`""
if ($LASTEXITCODE -ne 0) { throw 'Database creation failed. Existing databases were not modified.' }

$values = @{
    'SPRING_DATASOURCE_URL' = "jdbc:postgresql://localhost:5432/$DatabaseName"
    'SPRING_DATASOURCE_USERNAME' = $DatabaseUser
    'SPRING_DATASOURCE_PASSWORD' = $env:PGPASSWORD
    'SPRING_PROFILES_ACTIVE' = 'presentation-demo'
    'APP_SEED_DEMO' = 'false'
    'APP_PRESENTATION_DEMO_ENABLED' = 'true'
    'APP_PRESENTATION_DEMO_EXPECTED_DATABASE' = $DatabaseName
    'APP_PRESENTATION_DEMO_REFERENCE_DATE' = $ReferenceDate.ToString('yyyy-MM-dd')
    'SERVER_PORT' = [string]$Port
}
$previous = @{}
foreach ($key in $values.Keys) {
    $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process')
    [Environment]::SetEnvironmentVariable($key, $values[$key], 'Process')
}
$backendPath = Join-Path (Split-Path $PSScriptRoot -Parent) 'backend'
try {
    Push-Location -LiteralPath $backendPath
    try {
        Write-Host "Starting isolated demo backend on port $Port, database $DatabaseName. No existing backend is stopped."
        & .\gradlew.bat --offline bootRun
        if ($LASTEXITCODE -ne 0) { throw 'Demo startup failed. Keep the new database for inspection; no automatic cleanup is performed.' }
    } finally { Pop-Location }
} finally {
    foreach ($key in $previous.Keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
}
