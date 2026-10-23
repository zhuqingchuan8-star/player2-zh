param([string]$Out = "uia.txt")
Add-Type -AssemblyName UIAutomationClient
Add-Type -AssemblyName UIAutomationTypes
$p = Get-Process -Name player2 | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if (-not $p) { Write-Output "NO WINDOW"; exit 1 }
$root = [System.Windows.Automation.AutomationElement]::FromHandle($p.MainWindowHandle)
$walker = [System.Windows.Automation.TreeWalker]::ControlViewWalker
$names = New-Object System.Collections.Generic.List[string]
function Walk($el, $depth) {
  if ($depth -gt 40) { return }
  $name = $el.Current.Name
  if ($name) { $names.Add(("  " * $depth) + $name) }
  $child = $walker.GetFirstChild($el)
  while ($child -ne $null) {
    Walk $child ($depth + 1)
    $child = $walker.GetNextSibling($child)
  }
}
Walk $root 0
$names | Set-Content -Encoding UTF8 $Out
Write-Output ("elements with name: " + $names.Count)
