[CmdletBinding()]
param()
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$out = Join-Path $root 'artifacts\branding'
New-Item -ItemType Directory -Force -Path $out | Out-Null
$portraitPath = Join-Path $root 'public\assets\hafiz-profile.png'
$logoPath = Join-Path $root 'public\assets\aistudio\image_caee2680.png'
$portrait = [Drawing.Image]::FromFile($portraitPath)
$logo = [Drawing.Image]::FromFile($logoPath)
function Draw-Fit($g,$image,[int]$x,[int]$y,[int]$w,[int]$h) {
    $scale = [Math]::Min($w / $image.Width, $h / $image.Height)
    $dw = [int][Math]::Round($image.Width*$scale)
    $dh = [int][Math]::Round($image.Height*$scale)
    $g.DrawImage($image, [Drawing.Rectangle]::new([int]($x+($w-$dw)/2),[int]($y+($h-$dh)/2),$dw,$dh))
}
function New-Canvas([int]$w,[int]$h) {
    $b = [Drawing.Bitmap]::new($w,$h,[Drawing.Imaging.PixelFormat]::Format32bppArgb)
    return $b
}
function Set-Quality($g) {
    $g.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [Drawing.Drawing2D.PixelOffsetMode]::HighQuality
}
try {
    # Use the existing approved avatar, never synthesize or alter its facial features.
    $sizes = @(16,24,32,48,64,128,256)
    $frames = [Collections.Generic.List[byte[]]]::new()
    foreach ($s in $sizes) {
        $b = New-Canvas $s $s
        $g = [Drawing.Graphics]::FromImage($b)
        $m = [IO.MemoryStream]::new()
        try {
            Set-Quality $g
            $g.Clear([Drawing.Color]::Transparent)
            Draw-Fit $g $portrait 0 0 $s $s
            $b.Save($m,[Drawing.Imaging.ImageFormat]::Png)
            $frames.Add($m.ToArray())
        } finally { $m.Dispose(); $g.Dispose(); $b.Dispose() }
    }
    $stream = [IO.File]::Create((Join-Path $out 'HAFIZ.ico'))
    $writer = [IO.BinaryWriter]::new($stream)
    try {
        $writer.Write([uint16]0); $writer.Write([uint16]1); $writer.Write([uint16]$sizes.Count)
        $offset = 6 + 16*$sizes.Count
        for ($i=0; $i -lt $sizes.Count; $i++) {
            $s = $sizes[$i]; $f = $frames[$i]
            $dimension = if ($s -eq 256) { [byte]0 } else { [byte]$s }
            $writer.Write($dimension); $writer.Write($dimension)
            $writer.Write([byte]0); $writer.Write([byte]0)
            $writer.Write([uint16]1); $writer.Write([uint16]32)
            $writer.Write([uint32]$f.Length); $writer.Write([uint32]$offset)
            $offset += $f.Length
        }
        foreach ($f in $frames) { $writer.Write([byte[]]$f) }
    } finally { $writer.Dispose() }
    # Installer art: original full logo and original portrait on HAFIZ midnight navy.
    $b = New-Canvas 328 628; $g = [Drawing.Graphics]::FromImage($b)
    try {
        Set-Quality $g
        $g.Clear([Drawing.ColorTranslator]::FromHtml('#07101E'))
        $pen = [Drawing.Pen]::new([Drawing.ColorTranslator]::FromHtml('#00B7FF'),2)
        try {
            $g.DrawEllipse($pen,24,100,280,280)
            $g.DrawLine($pen,28,492,300,492)
        } finally { $pen.Dispose() }
        Draw-Fit $g $portrait 12 76 304 360
        Draw-Fit $g $logo 12 440 304 110
        $b.Save((Join-Path $out 'WizardPortrait.bmp'),[Drawing.Imaging.ImageFormat]::Bmp)
    } finally { $g.Dispose(); $b.Dispose() }
    $b = New-Canvas 110 110; $g = [Drawing.Graphics]::FromImage($b)
    try {
        Set-Quality $g
        $g.Clear([Drawing.ColorTranslator]::FromHtml('#07101E'))
        Draw-Fit $g $portrait 3 3 104 104
        $b.Save((Join-Path $out 'WizardSmall.bmp'),[Drawing.Imaging.ImageFormat]::Bmp)
    } finally { $g.Dispose(); $b.Dispose() }
    Copy-Item -LiteralPath $logoPath -Destination (Join-Path $out 'HAFIZ-logo.png') -Force
} finally { $portrait.Dispose(); $logo.Dispose() }
Write-Host 'Generated HAFIZ icon and installer assets from approved source PNGs.'
