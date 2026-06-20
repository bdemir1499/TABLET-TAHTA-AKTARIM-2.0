// =========================================================================
// --- CANLI SINIF (PEERJS) AĞ MOTORU (GÖLGE SENKRONİZASYON) ---
// =========================================================================

// Askeri Kalkan: Sadece aynı Wi-Fi/Ağ üzerinden bağlantıya izin verir, internete çıkışı kapatır.
const askeriKalkan = {
    config: {
        'iceServers': []
    },
    debug: 2
};

let myPeer = null;
let myConnection = null;
let isConnected = false;

// URL Parametrelerini Oku
const urlParams = new URLSearchParams(window.location.search);
const userRole = urlParams.get('role'); // 'tahta' veya 'tablet'
const roomCode = urlParams.get('room');
const sessionPin = urlParams.get('pin');

// Geri Dön Butonu İptal Edildi (Iframe üzerinden yönetiliyor)
document.addEventListener('DOMContentLoaded', () => {
    // Splash screen (açılış ekranı) artık Tahta'da da gösterilecek
});

// P2P Başlat
if (userRole === 'tahta' && roomCode) {
    // TAHTA: Odayı kuran taraf (Host)
    myPeer = new Peer(roomCode + '-game', askeriKalkan);

    myPeer.on('open', (id) => {
        console.log("Tahta P2P Hazır. Oda Kodu:", id);
        document.body.style.pointerEvents = 'none'; // Fiziksel tıklamayı engelle (Tablet yönetecek)
    });

    myPeer.on('connection', function (conn) {
        // PIN Kontrolü (Güvenlik İhlali Koruması)
        if (!conn.metadata || conn.metadata.password !== sessionPin) {
            console.warn("🚨 Güvenlik İhlali: Hatalı şifre denemesi reddedildi!", conn.peer);
            setTimeout(() => conn.close(), 500);
            return;
        }

        console.log("Tablet başarıyla bağlandı (Şifre Doğrulandı):", conn.peer);
        myConnection = conn;
        isConnected = true;

        // Veri Alma ve İşleme (Gölge Senkronizasyon)
        myConnection.on('data', handleIncomingData);
    });

} else if (userRole === 'tablet' && roomCode) {
    // TABLET: Odaya bağlanan taraf (Client)
    myPeer = new Peer(askeriKalkan);

    function connectToTahtaGame() {
        console.log("Tablet P2P Hazır. Bağlanılıyor:", roomCode);
        
        myConnection = myPeer.connect(roomCode + '-game', {
            metadata: { password: sessionPin },
            reliable: true
        });

        myConnection.on('open', () => {
            console.log("Tahtaya bağlantı sağlandı!");
            isConnected = true;
            setupShadowSyncSender(); // Tablet hareketleri dinlemeye başlasın
        });
        
        myConnection.on('data', handleIncomingData);

        myConnection.on('close', () => {
            isConnected = false;
        });
    }

    myPeer.on('open', (id) => {
        // Tahtanın iframe'i ve odayı kurması için ufak bir avans ver (Race condition engeli)
        setTimeout(connectToTahtaGame, 1000);
    });

    myPeer.on('error', (err) => {
        // Eğer tahta henüz hazır değilse, tekrar dene
        if (err.type === 'peer-unavailable') {
            console.log("Tahta henüz oyunu açmadı, 2 saniye sonra tekrar deneniyor...");
            setTimeout(connectToTahtaGame, 2000);
        }
    });
}

// --- GÖLGE SENKRONİZASYON (TABLET -> TAHTA) ---

// Elementin tam yolunu (path) bulan yardımcı fonksiyon
function getElementPath(el) {
    if (!el) return '';
    if (el.id) return '#' + el.id;
    let path = [];
    while (el && el.nodeType === Node.ELEMENT_NODE) {
        let selector = el.nodeName.toLowerCase();
        if (el.id) {
            selector += '#' + el.id;
            path.unshift(selector);
            break;
        } else {
            let sib = el, nth = 1;
            while (sib = sib.previousElementSibling) {
                if (sib.nodeName.toLowerCase() == selector) nth++;
            }
            if (nth != 1) selector += ":nth-of-type(" + nth + ")";
        }
        path.unshift(selector);
        el = el.parentNode;
    }
    return path.join(' > ');
}

// Tablet Üzerinde Dinleyicileri Kur
function setupShadowSyncSender() {
    // Tüm tıklamaları dinle
    document.addEventListener('click', (e) => {
        if (!e.isTrusted) return; // Sadece gerçek kullanıcı tıklamalarını al (kodsal tıklamaları yoksay)
        
        const path = getElementPath(e.target);
        if (path && myConnection && isConnected) {
            myConnection.send({ type: 'sync_click', path: path });
        }
    }, true); // Capture phase (öne geç)
}

// Tahta Üzerinde Gelen Veriyi İşle
function handleIncomingData(data) {
    if (!data) return;

    if (data.type === 'go_back') {
        window.location.href = '../index.html';
    } 
    else if (data.type === 'force_start_game') {
        const btn = document.getElementById('startGameBtn');
        if (btn) {
            const oldPE = btn.style.pointerEvents;
            btn.style.pointerEvents = 'auto';
            btn.click();
            btn.style.pointerEvents = oldPE;
        }
    }
    else if (data.type === 'sync_click') {
        const el = document.querySelector(data.path);
        if (el) {
            // Fiziksel engeli geçici kaldırıp tıklat, sonra tekrar koy
            const oldPE = el.style.pointerEvents;
            el.style.pointerEvents = 'auto';
            el.click();
            el.style.pointerEvents = oldPE;
        }
    }
    else if (data.type === 'sync_draw') {
        // Çizim işlemi (app.js içerisindeki p2pDrawHandle fonksiyonu karşılayacak)
        if (typeof window.p2pDrawHandle === 'function') {
            window.p2pDrawHandle(data);
        }
    }
}

// Çizim için genel gönderici fonksiyon (app.js içinden çağrılacak)
window.sendP2PDrawEvent = function(payload) {
    if (userRole === 'tablet' && myConnection && isConnected) {
        myConnection.send({ type: 'sync_draw', payload: payload });
    }
};
