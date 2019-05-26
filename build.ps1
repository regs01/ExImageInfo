Write-Host "Building..."
Start-Process "web-ext" -ArgumentList 'build --artifacts-dir "../.artifacts" --ignore-files "img/" "screenshots/" "build.ps1" "package.json" "package-lock.json" --overwrite-dest' -NoNewWindow -Wait
Read-Host "Press Enter to close."