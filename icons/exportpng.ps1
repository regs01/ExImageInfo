$InkscapeExecutable = "c:/Program Files/Inkscape/inkscape.exe"
$Sizes = 16, 24, 32, 48, 64, 96, 128, 192, 256, 512, 1024
$OriginalFile = "imageinfo.svg"
$ExportedFileTemplate = "image{0}.png"

if (!(Test-Path $InkscapeExecutable)) {
  Write-Output "Inkscape is not found."
  Read-Host
  Exit
}

foreach ($size in $Sizes) {
  Write-Host "Exporting size: $size"
  $ExportedFile = $ExportedFileTemplate -f $size
  Start-Process $InkscapeExecutable -ArgumentList "--export-png $ExportedFile --export-area-page --export-width $size --export-height $size $OriginalFile" -Wait
}

Read-Host "Press Enter to close."