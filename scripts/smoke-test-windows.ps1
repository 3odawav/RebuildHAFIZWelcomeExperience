[CmdletBinding()]
param(
    [string]$PublishDirectory = "artifacts\win-x64\publish",
    [string]$InstallerPath = "artifacts\installer\HAFIZ_Setup.exe",
    [int]$StartupTimeoutSeconds = 20
)

$ErrorActionPreference = "Stop"

function Resolve-RepoPath([string]$Path) {
    if ([System.IO.Path]::IsPathRooted($Path)) { return $Path }
    return [System.IO.Path]::GetFullPath((Join-Path (Get-Location).Path $Path))
}

function Assert-HafizPayload([string]$Directory, [string]$Label) {
    $required = @(
        "HAFIZ.exe",
        "HAFIZ.pri",
        "App.xbf",
        "MainWindow.xbf",
        "Themes\ThemeResources.xbf",
        "Controls\FloatingHafizOverlay.xbf",
        "Controls\LivingHafizAvatarControl.xbf",
        "Views\StartupStagePage.xbf",
        "Views\LyricsStudioPage.xbf",
        "Views\AudioWebPage.xbf",
        "Views\VoiceStemsPage.xbf",
        "Views\SettingsCenterPage.xbf",
        "Microsoft.UI.Xaml.dll",
        "Microsoft.WindowsAppRuntime.dll",
        "Microsoft.WinUI.dll",
        "WinRT.Runtime.dll",
        "HAFIZ.runtimeconfig.json",
        "HAFIZ.deps.json"
    )

    $missing = @($required | Where-Object {
        $candidate = Join-Path $Directory $_
        -not (Test-Path -LiteralPath $candidate -PathType Leaf) -or
        ((Get-Item -LiteralPath $candidate -ErrorAction SilentlyContinue).Length -le 0)
    })

    if ($missing.Count -gt 0) {
        throw "$Label is incomplete. Missing or empty runtime files: $($missing -join ', ')"
    }

    Write-Host "[PASS] $Label contains the executable, WinUI PRI/XBF resources, and self-contained runtime." -ForegroundColor Green
}

function Invoke-HafizStartupSmokeTest([string]$ExecutablePath, [string]$Label) {
    $workingDirectory = Split-Path -Parent $ExecutablePath
    $startedAt = Get-Date
    $process = $null

    try {
        Write-Host ($Label + ": " + $ExecutablePath) -ForegroundColor Cyan
        $process = Start-Process -FilePath $ExecutablePath -WorkingDirectory $workingDirectory -PassThru

        $deadline = (Get-Date).AddSeconds($StartupTimeoutSeconds)
        $windowHandle = [IntPtr]::Zero

        while ((Get-Date) -lt $deadline) {
            Start-Sleep -Milliseconds 500
            $process.Refresh()

            if ($process.HasExited) {
                $details = @()
                try {
                    $details = @(Get-WinEvent -FilterHashtable @{
                        LogName = "Application"
                        StartTime = $startedAt
                    } -MaxEvents 30 -ErrorAction Stop |
                    Where-Object {
                        $_.Id -in 1000, 1001 -and $_.Message -match "HAFIZ\.exe"
                    } |
                    Select-Object -First 4 -ExpandProperty Message)
                } catch {
                    $details = @("Application Error event details unavailable: $($_.Exception.Message)")
                }

                $separator = [Environment]::NewLine + "---" + [Environment]::NewLine
                $diagnostics = if ($details.Count -gt 0) { $details -join $separator } else { "No matching Application Error event was found." }
                throw ("$Label exited during startup (exit code $($process.ExitCode))." + [Environment]::NewLine + $diagnostics)
            }

            $windowHandle = $process.MainWindowHandle
            if ($windowHandle -ne [IntPtr]::Zero) { break }
        }

        $process.Refresh()
        if ($process.HasExited) {
            throw "$Label exited immediately after creating its window (exit code $($process.ExitCode))."
        }
        if ($windowHandle -eq [IntPtr]::Zero) {
            throw "$Label stayed alive but did not create a main window within $StartupTimeoutSeconds seconds."
        }

        Start-Sleep -Seconds 3
        $process.Refresh()
        if ($process.HasExited) {
            throw "$Label crashed shortly after creating its main window (exit code $($process.ExitCode))."
        }

        Write-Host "[PASS] $Label created a native window and remained alive for the startup verification period (PID $($process.Id))." -ForegroundColor Green
    }
    finally {
        if ($null -ne $process) {
            try {
                $process.Refresh()
                if (-not $process.HasExited) {
                    Stop-Process -Id $process.Id -Force -ErrorAction Stop
                    $process.WaitForExit(5000) | Out-Null
                }
            } catch {
                Write-Warning "Could not clean up smoke-test process $($process.Id): $($_.Exception.Message)"
            }
        }
    }
}

$publishRoot = Resolve-RepoPath $PublishDirectory
$installer = Resolve-RepoPath $InstallerPath

Assert-HafizPayload -Directory $publishRoot -Label "Published WinUI payload"
Invoke-HafizStartupSmokeTest -ExecutablePath (Join-Path $publishRoot "HAFIZ.exe") -Label "Published HAFIZ.exe"

if (-not (Test-Path -LiteralPath $installer -PathType Leaf)) {
    throw "Installer was not found: $installer"
}

$installRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("HAFIZ-Smoke-" + [Guid]::NewGuid().ToString("N"))
$installerLog = Join-Path ([System.IO.Path]::GetTempPath()) ("HAFIZ-Setup-Smoke-" + [Guid]::NewGuid().ToString("N") + ".log")

try {
    Write-Host "Installing the generated Inno Setup package into an isolated temporary directory..." -ForegroundColor Cyan
    $arguments = @(
        "/VERYSILENT",
        "/SUPPRESSMSGBOXES",
        "/NORESTART",
        "/SP-",
        "/NOICONS",
        "/DIR=$installRoot",
        "/LOG=$installerLog"
    )

    $setupProcess = Start-Process -FilePath $installer -ArgumentList $arguments -PassThru -Wait
    if ($setupProcess.ExitCode -ne 0) {
        $logTail = if (Test-Path $installerLog) { (Get-Content $installerLog -Tail 50) -join [Environment]::NewLine } else { "Installer log was not created." }
        throw ("Silent installer returned exit code $($setupProcess.ExitCode)." + [Environment]::NewLine + $logTail)
    }

    Assert-HafizPayload -Directory $installRoot -Label "Installed Inno Setup payload"

    $bootstrapPath = Join-Path $env:LOCALAPPDATA "HAFIZ_In_Slang\installer-bootstrap.json"
    if (-not (Test-Path -LiteralPath $bootstrapPath -PathType Leaf)) {
        throw "Installer did not create its expected bootstrap settings file: $bootstrapPath"
    }

    $bootstrap = Get-Content -LiteralPath $bootstrapPath -Raw | ConvertFrom-Json
    if ([System.IO.Path]::GetFullPath([string]$bootstrap.installRootPath).TrimEnd('\') -ne
        [System.IO.Path]::GetFullPath($installRoot).TrimEnd('\')) {
        throw "Installer bootstrap installRootPath does not match the isolated test install directory."
    }

    Invoke-HafizStartupSmokeTest -ExecutablePath (Join-Path $installRoot "HAFIZ.exe") -Label "Installed HAFIZ.exe"
    Write-Host "[PASS] The generated installer installed the complete app and the installed app launched successfully." -ForegroundColor Green
}
finally {
    $uninstaller = Join-Path $installRoot "unins000.exe"
    if (Test-Path -LiteralPath $uninstaller -PathType Leaf) {
        try {
            $uninstallProcess = Start-Process -FilePath $uninstaller -ArgumentList @("/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART") -PassThru -Wait
            if ($uninstallProcess.ExitCode -ne 0) {
                Write-Warning "Smoke-test uninstall returned exit code $($uninstallProcess.ExitCode)."
            }
        } catch {
            Write-Warning "Smoke-test uninstall failed: $($_.Exception.Message)"
        }
    }

    if (Test-Path -LiteralPath $installerLog) {
        Remove-Item -LiteralPath $installerLog -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "HAFIZ publish + installer runtime smoke tests passed." -ForegroundColor Green
