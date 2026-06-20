$content = Get-Content app.js -Raw
$content = $content.Replace('const role = window.location.href.includes("tablet") ? "tablet" : "tahta";', 'const role = (window.location.href.includes("tablet") || window._isExplicitTablet) ? "tablet" : "tahta";')
$content = $content.Replace('(typeof window.myRoomCode !== ''undefined'' ? window.myRoomCode : '''');', '(typeof myRoomCode !== ''undefined'' ? myRoomCode : '''');')
$content = $content.Replace('const roomCode = myConnection.peer || window.myRoomCode;', 'const roomCode = myConnection.peer || myRoomCode;')
$content = $content.Replace('if (typeof myConnection !== ''undefined'' && myConnection && isConnected && isTablet) {', 'if (typeof myConnection !== ''undefined'' && myConnection && isConnected && (isTablet || window._isExplicitTablet)) {')
$content = $content.Replace('document.getElementById(''connection-status'').innerText = "Bağlanıyor \u2026";', 'document.getElementById(''connection-status'').innerText = "Bağlanıyor \u2026";' + [Environment]::NewLine + '                window._isExplicitTablet = true;')
Set-Content app.js -Value $content -NoNewline
