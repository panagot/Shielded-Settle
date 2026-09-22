# Watch .wallet/sync-status.json until tDUST ready, then settle.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
Write-Host "Watching for tDUST ready..."
for ($i = 0; $i -lt 720; $i++) {
  Start-Sleep -Seconds 30
  $path = Join-Path (Get-Location) ".wallet\sync-status.json"
  if (-not (Test-Path $path)) { continue }
  $j = Get-Content $path -Raw | ConvertFrom-Json
  $dust = 0
  [void][decimal]::TryParse([string]$j.dust, [ref]$dust)
  if ($j.phase -eq "ready" -and $dust -gt 0) {
    Write-Host "READY dust=$dust - running settle:preprod"
    npx tsx scripts/settle-preprod.ts
    exit $LASTEXITCODE
  }
  if ($i % 4 -eq 0) {
    Write-Host ("[{0}] phase={1} dust={2} dustTree={3}%" -f $i, $j.phase, $j.dust, $j.dustSyncPct)
  }
}
Write-Host "Watcher timed out"
exit 3
