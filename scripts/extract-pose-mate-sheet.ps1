param(
  [Parameter(Mandatory = $true)] [string] $Source,
  [Parameter(Mandatory = $true)] [string] $OutputDirectory,
  [Parameter(Mandatory = $true)] [string] $Prefix,
  [int] $Columns = 3,
  [int] $Rows = 2,
  [switch] $ChromaKey,
  [ValidateSet('neutral', 'peace', 'half-heart', 'seated', 'seated-wave', 'seated-heart')]
  [string] $OnlyPose
)

$ErrorActionPreference = 'Stop'
[void][System.Reflection.Assembly]::LoadWithPartialName('System.Drawing')

$poses = @('neutral', 'peace', 'half-heart', 'seated', 'seated-wave', 'seated-heart')
if ($OnlyPose) { $poses = @($OnlyPose) }
$targetSize = 1254
$targetWidth = 920
$targetHeight = 1000

function Get-ChromaAlpha([System.Drawing.Color] $color) {
  $dominance = $color.G - [Math]::Max($color.R, $color.B)
  if ($color.G -gt 125 -and $dominance -ge 56) { return 0 }
  if ($color.G -gt 105 -and $dominance -ge 12) { return [Math]::Max(0, [Math]::Min(255, [int][Math]::Round(255 * (56 - $dominance) / 44))) }
  return 255
}

function Get-SubjectBitmap([System.Drawing.Bitmap] $source, [int] $x, [int] $y, [int] $width, [int] $height) {
  $panel = [System.Drawing.Bitmap]::new($width, $height, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $graphics = [System.Drawing.Graphics]::FromImage($panel)
  $graphics.DrawImage($source, [System.Drawing.Rectangle]::new(0, 0, $width, $height), [System.Drawing.Rectangle]::new($x, $y, $width, $height), [System.Drawing.GraphicsUnit]::Pixel)
  $graphics.Dispose()

  for ($py = 0; $py -lt $height; $py++) {
    for ($px = 0; $px -lt $width; $px++) {
      $pixel = $panel.GetPixel($px, $py)
      $alpha = if ($ChromaKey) { Get-ChromaAlpha $pixel } else { if ($pixel.A -lt 20) { 0 } else { $pixel.A } }
      if ($alpha -eq 0) {
        $panel.SetPixel($px, $py, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      } else {
        $red = $pixel.R; $green = $pixel.G; $blue = $pixel.B
        if ($ChromaKey -and $green -gt [Math]::Max($red, $blue)) { $green = [Math]::Max($red, $blue) }
        $panel.SetPixel($px, $py, [System.Drawing.Color]::FromArgb($alpha, $red, $green, $blue))
      }
    }
  }

  # Keep only the largest connected subject. This removes tiny fragments that
  # sometimes bleed in from the neighboring cell of a generated contact sheet.
  $visited = New-Object bool[] ($width * $height)
  $largest = New-Object 'System.Collections.Generic.HashSet[int]'
  for ($start = 0; $start -lt ($width * $height); $start++) {
    if ($visited[$start]) { continue }
    $sx = $start % $width; $sy = [int][Math]::Floor($start / $width)
    if ($panel.GetPixel($sx, $sy).A -eq 0) { $visited[$start] = $true; continue }
    $component = New-Object 'System.Collections.Generic.List[int]'
    $queue = New-Object 'System.Collections.Generic.Queue[int]'
    $queue.Enqueue($start); $visited[$start] = $true
    while ($queue.Count -gt 0) {
      $current = $queue.Dequeue(); $component.Add($current)
      $cx = $current % $width; $cy = [int][Math]::Floor($current / $width)
      for ($dy = -1; $dy -le 1; $dy++) {
        for ($dx = -1; $dx -le 1; $dx++) {
          if ($dx -eq 0 -and $dy -eq 0) { continue }
          $nx = $cx + $dx; $ny = $cy + $dy
          if ($nx -lt 0 -or $nx -ge $width -or $ny -lt 0 -or $ny -ge $height) { continue }
          $next = ($ny * $width) + $nx
          if ($visited[$next] -or $panel.GetPixel($nx, $ny).A -eq 0) { continue }
          $visited[$next] = $true; $queue.Enqueue($next)
        }
      }
    }
    if ($component.Count -gt $largest.Count) {
      $largest = New-Object 'System.Collections.Generic.HashSet[int]'
      foreach ($item in $component) { [void]$largest.Add($item) }
    }
  }

  $minX = $width; $minY = $height; $maxX = -1; $maxY = -1
  for ($py = 0; $py -lt $height; $py++) {
    for ($px = 0; $px -lt $width; $px++) {
      $current = ($py * $width) + $px
      if (-not $largest.Contains($current)) {
        $panel.SetPixel($px, $py, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        continue
      }
      if ($px -lt $minX) { $minX = $px }; if ($px -gt $maxX) { $maxX = $px }
      if ($py -lt $minY) { $minY = $py }; if ($py -gt $maxY) { $maxY = $py }
    }
  }
  if ($maxX -lt 0) { throw "Pose panel at $x,$y is empty after alpha cleanup." }

  $subject = $panel.Clone([System.Drawing.Rectangle]::new($minX, $minY, ($maxX - $minX + 1), ($maxY - $minY + 1)), [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $panel.Dispose()
  return $subject
}

function Remove-WhiteRuleArtifacts([System.Drawing.Bitmap] $bitmap) {
  $width = $bitmap.Width
  $height = $bitmap.Height
  $nearWhite = New-Object bool[] ($width * $height)
  for ($py = 0; $py -lt $height; $py++) {
    for ($px = 0; $px -lt $width; $px++) {
      $pixel = $bitmap.GetPixel($px, $py)
      $nearWhite[($py * $width) + $px] = $pixel.A -gt 20 -and $pixel.R -gt 190 -and $pixel.G -gt 190 -and $pixel.B -gt 190 -and ([Math]::Max($pixel.R, [Math]::Max($pixel.G, $pixel.B)) - [Math]::Min($pixel.R, [Math]::Min($pixel.G, $pixel.B)) -lt 36)
    }
  }

  $ruleColumns = New-Object 'System.Collections.Generic.HashSet[int]'
  for ($px = 0; $px -lt $width; $px++) {
    $count = 0
    for ($py = [int]($height * 0.2); $py -lt [int]($height * 0.96); $py++) {
      if ($nearWhite[($py * $width) + $px]) { $count++ }
    }
    if ($count -gt ($height * 0.48) -and ($px -lt ($width * 0.34) -or $px -gt ($width * 0.66))) {
      [void]$ruleColumns.Add($px)
    }
  }

  $ruleRows = New-Object 'System.Collections.Generic.HashSet[int]'
  for ($py = [int]($height * 0.7); $py -lt $height; $py++) {
    $count = 0
    for ($px = [int]($width * 0.08); $px -lt [int]($width * 0.92); $px++) {
      if ($nearWhite[($py * $width) + $px]) { $count++ }
    }
    if ($count -gt ($width * 0.42)) { [void]$ruleRows.Add($py) }
  }

  if ($ruleColumns.Count -eq 0 -and $ruleRows.Count -eq 0) { return }
  for ($py = 0; $py -lt $height; $py++) {
    for ($px = 0; $px -lt $width; $px++) {
      $columnRule = $false
      foreach ($ruleColumn in $ruleColumns) {
        if ([Math]::Abs($px - $ruleColumn) -le 4) { $columnRule = $true; break }
      }
      $rowRule = $false
      foreach ($ruleRow in $ruleRows) {
        if ([Math]::Abs($py - $ruleRow) -le 4) { $rowRule = $true; break }
      }
      if ($columnRule -or $rowRule) {
        $bitmap.SetPixel($px, $py, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
      }
    }
  }
}

New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null
$sourceBitmap = [System.Drawing.Bitmap]::new($Source)
$panelWidth = [int][Math]::Floor($sourceBitmap.Width / $Columns)
$panelHeight = [int][Math]::Floor($sourceBitmap.Height / $Rows)

for ($index = 0; $index -lt $poses.Count; $index++) {
  $poseIndex = [Array]::IndexOf(@('neutral', 'peace', 'half-heart', 'seated', 'seated-wave', 'seated-heart'), $poses[$index])
  $column = $poseIndex % $Columns
  $row = [int][Math]::Floor($poseIndex / $Columns)
  # Imagegen grid sheets often add a one to three pixel white divider. Keep
  # the runtime cutout free of that divider before calculating the subject box.
  $inset = 4
  $subject = Get-SubjectBitmap $sourceBitmap (($column * $panelWidth) + $inset) (($row * $panelHeight) + $inset) ($panelWidth - ($inset * 2)) ($panelHeight - ($inset * 2))
  $scale = [Math]::Min($targetWidth / [double]$subject.Width, $targetHeight / [double]$subject.Height)
  $scaledWidth = [Math]::Max(1, [int][Math]::Round($subject.Width * $scale))
  $scaledHeight = [Math]::Max(1, [int][Math]::Round($subject.Height * $scale))
  $scaled = [System.Drawing.Bitmap]::new($scaledWidth, $scaledHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $scaledGraphics = [System.Drawing.Graphics]::FromImage($scaled)
  $scaledGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $scaledGraphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $scaledGraphics.DrawImage($subject, [System.Drawing.Rectangle]::new(0, 0, $scaledWidth, $scaledHeight))
  $scaledGraphics.Dispose(); $subject.Dispose()

  $output = [System.Drawing.Bitmap]::new($targetSize, $targetSize, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $outputGraphics = [System.Drawing.Graphics]::FromImage($output)
  $outputGraphics.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceCopy
  $outputGraphics.DrawImage($scaled, [int](($targetSize - $scaledWidth) / 2), ($targetSize - $scaledHeight - 28))
  $outputGraphics.Dispose(); $scaled.Dispose()
  Remove-WhiteRuleArtifacts $output

  $destination = Join-Path $OutputDirectory "$Prefix-$($poses[$index]).png"
  $output.Save($destination, [System.Drawing.Imaging.ImageFormat]::Png)
  $output.Dispose()
  Write-Output "[pose-mate] wrote $destination"
}
$sourceBitmap.Dispose()
