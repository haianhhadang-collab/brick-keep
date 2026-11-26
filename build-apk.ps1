# Build APK Brick Keep.
# Thu muc du an co dau tieng Viet nen Gradle wrapper khong chay truc tiep duoc;
# script tam gan mot o dia ao (subst) de co duong dan khong dau, build xong thi go.
# Dung o G/H/I/J rieng cho Brick Keep (Word Runners: R/Q/P, Word Arena: W/X/Y/Z, Lumi: L/M/N/O).
$ErrorActionPreference = "Continue"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
$letter = @("G:", "H:", "I:", "J:") | Where-Object { -not (Test-Path "$_\") } | Select-Object -First 1
if (-not $letter) { throw "Khong con o dia trong de gan tam." }
subst $letter $here
try {
    Push-Location "$letter\android"
    # Daemon Gradle co the con nho o ao cua lan build du an khac -> dung truoc cho chac
    .\gradlew.bat --stop | Out-Null
    .\gradlew.bat assembleRelease --console=plain --no-watch-fs
    if ($LASTEXITCODE -ne 0) { throw "Build loi." }
    Pop-Location
    $out = Join-Path (Split-Path -Parent $here) "BrickKeep.apk"
    Copy-Item "$here\android\app\build\outputs\apk\release\app-release.apk" $out -Force
    Write-Host "Xong: $out"
} finally {
    if ((Get-Location).Path -like "$letter*") { Pop-Location }
    subst $letter /D
}
