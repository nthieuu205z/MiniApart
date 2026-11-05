param([Parameter(Mandatory=$true)][ValidateSet('backend','frontend')][string]$Service)
$ErrorActionPreference = 'Stop'
$taskProject = Split-Path -Parent $PSScriptRoot
$taskRuntime = Join-Path $taskProject '.runtime'
New-Item -ItemType Directory -Path $taskRuntime -Force | Out-Null
if ($Service -eq 'backend') {
    Set-Location -LiteralPath (Join-Path $taskProject 'backend')
    & '.\gradlew.bat' bootRun --no-daemon *> (Join-Path $taskRuntime 'backend.log')
} else {
    Set-Location -LiteralPath (Join-Path $taskProject 'frontend')
    & npm.cmd run dev -- --host 127.0.0.1 --port 5173 --strictPort *> (Join-Path $taskRuntime 'frontend.log')
}
exit $LASTEXITCODE
