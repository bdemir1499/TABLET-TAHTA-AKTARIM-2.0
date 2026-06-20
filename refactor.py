import re

with open('app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add dogrusalButton
content = content.replace(
    "const oyunlarButton = document.getElementById('btn-oyunlar');",
    "const dogrusalButton = document.getElementById('btn-dogrusal');\nconst oyunlarButton = document.getElementById('btn-oyunlar');"
)

# 2. Add event listeners and iframe logic
iframe_logic = """
// IFRAME OYUN MANTIĞI
if (dogrusalButton) {
    dogrusalButton.addEventListener('click', (e) => {
        e.stopPropagation();
        if (typeof setActiveTool === 'function') setActiveTool('none');
        
        if (typeof myConnection !== 'undefined' && myConnection && window.isConnected) {
            myConnection.send({ type: 'open_iframe' });
        }
        openGameIframe();
    });
}

const btnCloseGame = document.getElementById('btn-close-game');
if (btnCloseGame) {
    btnCloseGame.addEventListener('click', () => {
        if (typeof myConnection !== 'undefined' && myConnection && window.isConnected) {
            myConnection.send({ type: 'close_iframe' });
        }
        closeGameIframe();
    });
}

function openGameIframe() {
    const overlay = document.getElementById('game-overlay');
    const iframe = document.getElementById('game-iframe');
    if (overlay && iframe) {
        const roomCode = typeof window.myRoomCode !== 'undefined' ? window.myRoomCode : '';
        const pin = window.sessionPassword || '';
        const role = window.location.href.includes("tablet") ? "tablet" : "tahta";
        // Her zaman güncel roomCode'u ilet
        iframe.src = `./dogrusal-denklemler/index.html?role=${role}&room=${roomCode}&pin=${pin}`;
        overlay.style.display = 'block';
    }
}

function closeGameIframe() {
    const overlay = document.getElementById('game-overlay');
    const iframe = document.getElementById('game-iframe');
    if (overlay && iframe) {
        overlay.style.display = 'none';
        iframe.src = '';
    }
}

oyunlarButton.addEventListener('click', (e) => {
"""
content = content.replace("oyunlarButton.addEventListener('click', (e) => {\n    e.stopPropagation();", iframe_logic + "    e.stopPropagation();")

# 3. Replace navigate_game block in veriyiIsle
navigate_game_pattern = re.compile(r"// --- YENİ OYUNA P2P GEÇİŞ \(TAHTA\) ---[\s\S]*?try\{window\.location\.href = finalLink;\}catch\(e\)\{console\.error\(e\);\}\s*return;\s*\}", re.MULTILINE)

new_p2p_logic = """// --- YENİ OYUNA P2P GEÇİŞ (TAHTA/TABLET IFRAME) ---
            if (d.type === 'open_iframe') {
                openGameIframe();
                return;
            }
            if (d.type === 'close_iframe') {
                closeGameIframe();
                return;
            }"""

if navigate_game_pattern.search(content):
    content = navigate_game_pattern.sub(new_p2p_logic, content)
else:
    # Try an alternative regex in case my recent changes failed
    alt_pattern = re.compile(r"// --- YENİ OYUNA P2P GEÇİŞ \(TAHTA\) ---[\s\S]*?if\s*\(d\.type\s*===\s*'navigate_game'[\s\S]*?return;\s*\}", re.MULTILINE)
    content = alt_pattern.sub(new_p2p_logic, content)

# 4. Simplify linkiAc (remove P2P navigate_game sending)
linki_ac_pattern = re.compile(r"const linkiAc = \(ae\) => \{[\s\S]*?window\.open\(finalLink, '_blank'\);\s*return;\s*\}", re.MULTILINE)

new_linki_ac = """const linkiAc = (ae) => {
                    if (isScrolling) return;
                    ae.preventDefault();
                    ae.stopPropagation();
                    // Artık iç oyunlar yok, hepsi dış bağlantı
                    window.open(oyun.link, '_blank');
                    return;
                }"""

content = linki_ac_pattern.sub(new_linki_ac, content)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Refactor complete.")
