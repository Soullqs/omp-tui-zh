# Install OMP TUI Chinese localization
# Run from the cloned omp-tui-zh directory:
#   powershell -ExecutionPolicy Bypass -File install.ps1

$home = $env:USERPROFILE
$root = $PWD.Path  # must be run from the cloned repo
$extDir = "$home\.omp\agent\extensions"
$i18nDir = "$home\.omp\i18n"

New-Item -ItemType Directory -Force -Path $extDir | Out-Null
New-Item -ItemType Directory -Force -Path $i18nDir | Out-Null

Copy-Item -Force "$root\extensions\tui-zh.ts" "$extDir\tui-zh.ts"
Copy-Item -Force "$root\i18n\zh-patch.ts" "$i18nDir\zh-patch.ts"
Copy-Item -Force "$root\i18n\zh-tui.json" "$i18nDir\zh-tui.json"

Write-Output "TUI Chinese patch installed to $extDir"
Write-Output "Restart omp to take effect (first launch: English + notice, second launch: Chinese)"