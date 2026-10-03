
Add-Type -AssemblyName System.Drawing
Add-Type -Namespace Nav -Name W -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
[DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
public struct RECT { public int L, T, R, B; }
'@
$p = Get-Process -Name player2 | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
[Nav.W]::ShowWindow($p.MainWindowHandle, 9) | Out-Null
[Nav.W]::SetForegroundWindow($p.MainWindowHandle) | Out-Null
Start-Sleep -Seconds 2
$r = New-Object Nav.W+RECT
[Nav.W]::GetWindowRect($p.MainWindowHandle, [ref]$r) | Out-Null
$w = $r.R - $r.L; $h = $r.B - $r.T
Write-Output ("rect {0},{1} {2}x{3}" -f $r.L, $r.T, $w, $h)
$bmp = New-Object System.Drawing.Bitmap $w, $h
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.CopyFromScreen($r.L, $r.T, 0, 0, $bmp.Size)
$out = $args[0]
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "saved $out"
