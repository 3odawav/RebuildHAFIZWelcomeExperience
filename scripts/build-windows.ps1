<#
.SYNOPSIS
  Reproducible Windows 11 x64 native build and installer packaging script for HAFIZ In Slang.
.DESCRIPTION
  1. Verifies .NET 8 SDK, Windows App SDK target, Python 3.11, and optional Inno Setup 6 (ISCC.exe).
  2. Runs native xUnit tests (HAFIZ.Tests) and Python backend worker tests.
  3. Publishes unpackaged self-contained WinUI 3 x64 HAFIZ.exe into artifacts/win-x64/publish.
  4. Compiles installer/HAFIZ_Setup.iss into artifacts/installer/HAFIZ_Setup.exe.
  5. Writes SHA-256 checksums for all release artifacts.
#>
[CmdletBinding()]
param(
    [ValidateSet("Release", "Debug")]
    [string]$Configuration = "Release",
    [switch]$SkipInstaller
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $true
$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$NativeSln = Join-Path $RepoRoot "native\HAFIZ.Native.sln"
$AppCsproj = Join-Path $RepoRoot "native\HAFIZ.App\HAFIZ.App.csproj"
$TestsCsproj = Join-Path $RepoRoot "native\HAFIZ.Tests\HAFIZ.Tests.csproj"
$PublishDir = Join-Path $RepoRoot "artifacts\win-x64\publish"
$InstallerScript = Join-Path $RepoRoot "installer\HAFIZ_Setup.iss"
$ChecksumFile = Join-Path $RepoRoot "artifacts\SHA256SUMS.txt"

Write-Host "==> Verifying .NET SDK..." -ForegroundColor Cyan
Set-Location $RepoRoot
$sdkVersion = dotnet --version
if ($sdkVersion -notmatch '^8\.') { throw "Expected .NET 8 SDK, found $sdkVersion" }
dotnet --info | Select-Object -First 8

Write-Host "==> Restoring native WinUI 3 solution..." -ForegroundColor Cyan
dotnet restore $NativeSln -r win-x64

Write-Host "==> Running native C# xUnit test suite..." -ForegroundColor Cyan
dotnet test $TestsCsproj -c $Configuration --logger "console;verbosity=normal"

Write-Host "==> Running Python backend worker unit tests..." -ForegroundColor Cyan
python -m unittest discover -s (Join-Path $RepoRoot "backend\workers") -v

Write-Host "==> Publishing self-contained unpackaged WinUI 3 HAFIZ.exe (win-x64)..." -ForegroundColor Cyan
if (Test-Path $PublishDir) { Remove-Item -Recurse -Force $PublishDir }
# Windows App SDK 1.6 requires the Visual Studio PRI build tasks.
$VsWhere = Join-Path ${env:ProgramFiles(x86)} "Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $VsWhere)) { throw "Visual Studio Installer (vswhere.exe) is required for WinUI 3 publishing." }
$VsInstallations = @(& $VsWhere -products '*' -requires Microsoft.Component.MSBuild -property installationPath)
$MSBuild = $null
$PriTasks = $null
foreach ($VsRoot in $VsInstallations) {
    $Candidate = Join-Path $VsRoot "MSBuild\Current\Bin\amd64\MSBuild.exe"
    if (-not (Test-Path $Candidate)) { $Candidate = Join-Path $VsRoot "MSBuild\Current\Bin\MSBuild.exe" }
    $PriCandidate = Get-ChildItem (Join-Path $VsRoot "MSBuild\Microsoft\VisualStudio") -Filter "Microsoft.Build.Packaging.Pri.Tasks.dll" -Recurse -File -ErrorAction SilentlyContinue | Select-Object -First 1
    if ((Test-Path $Candidate) -and $PriCandidate) { $MSBuild = $Candidate; $PriTasks = $PriCandidate; break }
}
if (-not $MSBuild) { throw "Visual Studio MSBuild with Appx/PRI packaging tools is required. Install the Windows application development workload." }
Write-Host "Using Visual Studio MSBuild: $MSBuild"
Write-Host "PRI tasks: $($PriTasks.FullName)"
& $MSBuild $AppCsproj /restore /t:Publish /m /nologo `
    "/p:Configuration=$Configuration" `
    /p:RuntimeIdentifier=win-x64 `
    /p:Platform=x64 `
    /p:SelfContained=true `
    /p:WindowsPackageType=None `
    /p:WindowsAppSDKSelfContained=true `
    "/p:PublishDir=$PublishDir\" 
if ($LASTEXITCODE -ne 0) { throw "Native WinUI publish failed" }

$ExePath = Join-Path $PublishDir "HAFIZ.exe"
if (-not (Test-Path $ExePath)) {
    throw "Expected native executable was not produced at $ExePath"
}
Write-Host "Built native WinUI 3 binary: $ExePath" -ForegroundColor Green

$ChecksumLines = @()
$ExeHash = (Get-FileHash -Algorithm SHA256 $ExePath).Hash.ToLowerInvariant()
$ChecksumLines += "$ExeHash  artifacts/win-x64/publish/HAFIZ.exe"

if (-not $SkipInstaller) {
    $Iscc = Get-Command iscc.exe -ErrorAction SilentlyContinue
    if (-not $Iscc) {
        $DefaultIscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
        if (Test-Path $DefaultIscc) {
            $Iscc = Get-Item $DefaultIscc
        }
    }

    if ($Iscc) {
        Write-Host "==> Compiling HAFIZ_Setup.exe with Inno Setup 6..." -ForegroundColor Cyan
        & $(if ($Iscc -is [System.IO.FileInfo]) { $Iscc.FullName } else { $Iscc.Source }) $InstallerScript
        $SetupExe = Join-Path $RepoRoot "artifacts\installer\HAFIZ_Setup.exe"
        if (-not (Test-Path $SetupExe)) {
            throw "Inno Setup completed without producing $SetupExe"
        }
        $SetupHash = (Get-FileHash -Algorithm SHA256 $SetupExe).Hash.ToLowerInvariant()
        $ChecksumLines += "$SetupHash  artifacts/installer/HAFIZ_Setup.exe"
        Write-Host "Built installer: $SetupExe" -ForegroundColor Green
    } else {
        throw "Inno Setup 6 is required unless -SkipInstaller is specified."
    }
}

New-Item -ItemType Directory -Force -Path (Split-Path $ChecksumFile) | Out-Null
$ChecksumLines | Set-Content -Encoding UTF8 $ChecksumFile
Write-Host "==> Wrote SHA-256 release checksums to $ChecksumFile" -ForegroundColor Green
