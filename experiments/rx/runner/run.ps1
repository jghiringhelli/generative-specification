# RX Runner (PowerShell) — generate → build → test → score via Claude CLI
#
# Usage:
#   .\runner\run.ps1              full run (P1 + P2 + P3)
#   .\runner\run.ps1 -Phase 1    infrastructure only
#   .\runner\run.ps1 -Phase 2    features only (requires P1 complete)
#   .\runner\run.ps1 -Phase 3    tests + evidence (requires P2 complete)
#   .\runner\run.ps1 -Verify     score existing generated/ output only

param(
  [ValidateSet('all','1','2','3')]
  [string]$Phase = 'all',
  [switch]$Verify
)

$ErrorActionPreference = 'Stop'

$RxDir     = Split-Path -Parent $PSScriptRoot
$Generated = Join-Path $RxDir 'generated'
$Evidence  = Join-Path $RxDir 'evidence'
$SpecFile  = Join-Path $RxDir 'spec\conduit-gs.md'
$PromptDir = Join-Path $PSScriptRoot 'prompts'
$DB_URL    = 'postgresql://rx_user:rx_password@localhost:5447/rx_conduit'

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Write-Error '[rx] claude CLI not found'; exit 1 }
if (-not (Test-Path $SpecFile)) { Write-Error "[rx] spec not found at $SpecFile"; exit 1 }

New-Item -ItemType Directory -Force -Path $Generated, $Evidence | Out-Null

function Invoke-ClaudeSession([string]$Name, [string]$PromptFile) {
  Write-Host "`n[rx] -- $Name --" -ForegroundColor Cyan
  $specText   = [System.IO.File]::ReadAllText($SpecFile)
  $promptText = [System.IO.File]::ReadAllText($PromptFile)
  $combined   = $promptText + "`n`n" + $specText
  $tmpFile    = [System.IO.Path]::GetTempFileName() + '.txt'
  [System.IO.File]::WriteAllText($tmpFile, $combined, [System.Text.Encoding]::UTF8)
  $logFile = Join-Path $Evidence ($Name + '.log')
  Push-Location $Generated
  try {
    Get-Content $tmpFile -Raw | claude -p - --dangerously-skip-permissions --output-format text 2>&1 | Tee-Object -FilePath $logFile
  } finally {
    Pop-Location
    Remove-Item $tmpFile -ErrorAction SilentlyContinue
  }
  Write-Host "[rx] $Name done. Log: $logFile" -ForegroundColor Green
}

function Invoke-P1 {
  Invoke-ClaudeSession 'p1-infrastructure' (Join-Path $PromptDir 'p1-infrastructure.md')
  $log = Join-Path $Evidence 'build-log.txt'
  Push-Location $Generated
  try {
    npm install 2>&1 | Tee-Object -FilePath $log
    $env:DATABASE_URL = $DB_URL
    npx prisma migrate dev --name init 2>&1 | Tee-Object -FilePath $log -Append
    npx tsc --noEmit 2>&1 | Tee-Object -FilePath $log -Append
  } finally { Pop-Location }
  Write-Host '[rx] P1 gate: passed' -ForegroundColor Green
}

function Invoke-P2 {
  Invoke-ClaudeSession 'p2-features' (Join-Path $PromptDir 'p2-features.md')
  $log = Join-Path $Evidence 'build-log.txt'
  Push-Location $Generated
  try {
    npx tsc --noEmit 2>&1 | Tee-Object -FilePath $log -Append
    npm audit --audit-level=high 2>&1 | Tee-Object -FilePath $log -Append
    if ($LASTEXITCODE -ne 0) { Write-Error '[rx] FAIL: high CVEs' }
  } finally { Pop-Location }
  Write-Host '[rx] P2 gate: passed' -ForegroundColor Green
}

function Invoke-P3 {
  Invoke-ClaudeSession 'p3-tests' (Join-Path $PromptDir 'p3-tests.md')
  $jestOut = Join-Path $Evidence 'jest-output.json'
  Push-Location $Generated
  try {
    $env:DATABASE_URL = $DB_URL
    npx jest --json --outputFile $jestOut --forceExit 2>&1 | Tee-Object -FilePath (Join-Path $Evidence 'p3-tests.log')
  } finally { Pop-Location }
}

function Invoke-Score {
  $date = (Get-Date).ToUniversalTime().ToString('yyyy-MM-ddTHH:mm:ssZ')
  @{ runDate = $date; model = 'claude-opus-4-5'; specFile = 'experiments/rx/spec/conduit-gs.md' } |
    ConvertTo-Json | Set-Content (Join-Path $Evidence 'run-metadata.json')
  Push-Location $RxDir
  try {
    npx ts-node score/score.ts --jest (Join-Path $Evidence 'jest-output.json') --build (Join-Path $Evidence 'build-log.txt') --rubric score/rubric.json --output (Join-Path $Evidence 'score.json')
  } finally { Pop-Location }
  Write-Host "`n[rx] Evidence:" -ForegroundColor Cyan
  Get-ChildItem $Evidence | Format-Table Name, Length, LastWriteTime
  $today = (Get-Date).ToString('yyyy-MM-dd')
  Write-Host "`n[rx] Commit: git add experiments/rx/evidence/ ; git commit -m 'test(rx): run evidence $today'"
}

if ($Verify) { Invoke-Score; exit 0 }

switch ($Phase) {
  'all' { Invoke-P1; Invoke-P2; Invoke-P3; Invoke-Score }
  '1'   { Invoke-P1 }
  '2'   { Invoke-P2 }
  '3'   { Invoke-P3; Invoke-Score }
}
