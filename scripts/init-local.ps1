$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$envPath = Join-Path $projectRoot '.env'
if (Test-Path -LiteralPath $envPath) {
    Write-Host '.env ya existe. No se modificaron tus contraseñas.'
    exit 0
}
function New-Password {
    $bytes = New-Object byte[] 24
    $generator = [Security.Cryptography.RandomNumberGenerator]::Create()
    try { $generator.GetBytes($bytes) } finally { $generator.Dispose() }
    return ([BitConverter]::ToString($bytes)).Replace('-', '').ToLowerInvariant()
}
$content = Get-Content -Raw -LiteralPath (Join-Path $projectRoot '.env.example')
$content = $content.Replace('REPLACE_WITH_RANDOM_ALPHANUMERIC_32', (New-Password))
# Generar una contraseña independiente para administrador.
$content = [regex]::Replace($content, '(?m)^ADMIN_PASSWORD=.*$', ('ADMIN_PASSWORD=' + (New-Password)))
[IO.File]::WriteAllText($envPath, $content, (New-Object Text.UTF8Encoding $false))
Write-Host '.env creado con contraseñas aleatorias independientes. No lo subas a Git.'
