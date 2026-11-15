[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Play meat on the grill sizzle sound
try {
    $wavPath = "c:\Users\freet\OneDrive\Desktop\shelfsense\assets\grill-sizzle.wav"
    if (Test-Path $wavPath) {
        $player = New-Object System.Media.SoundPlayer $wavPath
        $player.PlaySync()
    }
} catch {}

# Output valid JSON for hook lifecycle contract
Write-Output '{"decision": "allow"}'
