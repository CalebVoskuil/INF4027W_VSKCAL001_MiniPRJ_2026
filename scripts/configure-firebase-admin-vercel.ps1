param(
  [Parameter(Mandatory = $true)]
  [string]$ServiceAccountPath,

  [string]$Project = "technest-unify-store",

  [string]$Scope = "caleb-s-projects-28b6762a"
)

$ErrorActionPreference = "Stop"

$resolvedPath = (Resolve-Path -LiteralPath $ServiceAccountPath -ErrorAction Stop).Path
if ([IO.Path]::GetExtension($resolvedPath) -ne ".json") {
  throw "The Firebase service-account file must be JSON."
}

$serviceAccount = Get-Content -Raw -LiteralPath $resolvedPath | ConvertFrom-Json
if ($serviceAccount.type -ne "service_account") {
  throw "The selected JSON file is not a Google service account."
}

$requiredValues = [ordered]@{
  FIREBASE_ADMIN_PROJECT_ID  = [string]$serviceAccount.project_id
  FIREBASE_ADMIN_CLIENT_EMAIL = [string]$serviceAccount.client_email
  FIREBASE_ADMIN_PRIVATE_KEY = [string]$serviceAccount.private_key
}

foreach ($entry in $requiredValues.GetEnumerator()) {
  if ([string]::IsNullOrWhiteSpace($entry.Value)) {
    throw "The service-account JSON is missing $($entry.Key)."
  }
}

if (
  -not $requiredValues.FIREBASE_ADMIN_PRIVATE_KEY.StartsWith("-----BEGIN PRIVATE KEY-----") -or
  -not $requiredValues.FIREBASE_ADMIN_PRIVATE_KEY.TrimEnd().EndsWith("-----END PRIVATE KEY-----")
) {
  throw "The service-account private key has an unexpected format."
}

foreach ($entry in $requiredValues.GetEnumerator()) {
  $visibility = if ($entry.Key -eq "FIREBASE_ADMIN_PROJECT_ID") {
    "--no-sensitive"
  } else {
    "--sensitive"
  }

  $entry.Value | & npx vercel env add $entry.Key production `
    --project $Project `
    --scope $Scope `
    --force `
    --yes `
    $visibility | Out-Host

  if ($LASTEXITCODE -ne 0) {
    throw "Vercel rejected $($entry.Key)."
  }

  Write-Output "Configured $($entry.Key)."
}

Write-Output "Firebase Admin production credentials are configured. Redeploy the project before testing."
