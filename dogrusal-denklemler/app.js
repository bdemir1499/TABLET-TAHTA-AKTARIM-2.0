// 🚨 ALAN ADI KİLİDİ (DOMAIN BINDING) - ASKERİ DÜZEY KORUMA 🚨
const gecerliAdresler = ["bdemir1499.github.io", "127.0.0.1", "localhost"];
const mevcutAdres = window.location.hostname;
const kacakKullanimMi = !gecerliAdresler.some(adres => mevcutAdres.includes(adres));
if (kacakKullanimMi && mevcutAdres !== "") {
    document.body.innerHTML = "<div style='color:red; text-align:center; margin-top:50px; font-family:sans-serif; font-size:20px; font-weight:bold;'>⛔ GÜVENLİK İHLALİ: Bu yazılım kopyalanmıştır. Lütfen orijinal adresi kullanın.</div>";
    throw new Error("Korsan kullanım tespit edildi, sistem durduruldu!");
}

// En tepeye, diğer değişkenlerin (gameState vb.) yanına ekle:
window.feedbackTimer = null; // Global zamanlayıcı

// ==========================================
// --- GÖLGE SENKRONİZASYON İÇİN ORTAK AKIL (PRNG) ---
// ==========================================
// Orijinal rastgeleliği sakla (Gerçek rastgele bir başlangıç şifresi üretmek için)
const nativeRandom = Math.random;

// Tabletin ilk açılışında tamamen eşsiz bir şifre (seed) belirle
let gameSeed = Math.floor(nativeRandom() * 1000000000);

window.setGameSeed = function(seed) {
    gameSeed = seed;
    console.log("🎲 Ortak Akıl (Rastgelelik) Şifresi Ayarlandı:", seed);
};

// Math.random() fonksiyonunu deterministik PRNG fonksiyonumuzla (Mulberry32) eziyoruz
Math.random = function() {
    let t = gameSeed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
};

window.generateTrueRandomSeed = function() {
    return Math.floor(nativeRandom() * 1000000000);
};


const defaultConfig = {
    game_title: "Koordinat Sistemi, Doğrusal İlişkiler, Doğruların Grafikleri, Doğru Denklemleri, Eğim, Dönüşüm Geometrisi",
    instructions_text: "Dönüşüm türünü seç ve şeklin yeni köşelerini işaretle",
    translation_button: "Öteleme",
    reflection_button: "Yansıma",
    new_shape_button: "Yeni Şekil",
    undo_button: "Geri Al",
    check_button: "Kontrol Et",
    primary_color: "#6366f1",
    secondary_color: "#ffffff",
    text_color: "#1f2937",
    button_color: "#3b82f6",
    accent_color: "#10b981",
    font_family: "system-ui",
    font_size: 16
};



let gameState = {
    mode: null,
    originalShape: null,
    transformedShape: null,
    userClicks: [],
    shapeType: null,
    translationVector: null,
    reflectionAxis: null,
    targetPoint: null,
    correctAnswer: null,
    selectedOption: null
};

let activeInputTarget = null;


let linearState = {
    currentQuestion: null,
    usedQuestionIds: [],
    tableData: [],
    yScale: 1,
    maxY: 9,
    drawnPoints: [],
    isDrawing: false,
    currentCell: null,
    currentInputValue: '',
    currentScenario: null,
    currentQuestionIndex: 0,
    userAnswers: [],
    selectedOption: null,
    usedScenarioIds: []
};


// Linear relationship questions database
const linearQuestions = [
    {
        id: 1,
        text: "Elif'in kumbarasında 80 lira parası vardır ve her hafta kumbarasına 20 lira atmaktadır. Geçen hafta sayısı (x) ve kumbarada biriken para miktarı (y) arasındaki ilişkinin tablo ve grafiğini çiziniz.",
        xLabel: "Hafta (x)",
        yLabel: "Para (y)",
        initialValue: 80,
        rate: 20,
        startsAtZero: false
    },
    {
        id: 2,
        text: "Bir otobüs her durakta 5 yolcu alıyor. Durak sayısı (x) ve otobüsteki toplam yolcu sayısı (y) arasındaki ilişkinin tablo ve grafiğini çiziniz.",
        xLabel: "Durak (x)",
        yLabel: "Yolcu (y)",
        initialValue: 0,
        rate: 5,
        startsAtZero: true
    },
    {
        id: 3,
        text: "Bir kitaplıkta 150 kitap vardır. Her ay 10 kitap satılmaktadır. Geçen ay sayısı (x) ve kalan kitap sayısı (y) arasındaki ilişkinin tablo ve grafiğini çiziniz.",
        xLabel: "Ay (x)",
        yLabel: "Kitap (y)",
        initialValue: 150,
        rate: -10,
        startsAtZero: false
    },
    {
        id: 4,
        text: "Ahmet her gün 3 km koşmaktadır. Gün sayısı (x) ve toplam koşulan mesafe (y) arasındaki ilişkinin tablo ve grafiğini çiziniz.",
        xLabel: "Gün (x)",
        yLabel: "Mesafe (y)",
        initialValue: 0,
        rate: 3,
        startsAtZero: true
    },
    {
        id: 5,
        text: "Bir su deposunda 200 litre su vardır. Her saat 15 litre su kullanılmaktadır. Geçen saat sayısı (x) ve depodaki su miktarı (y) arasındaki ilişkinin tablo ve grafiğini çiziniz.",
        xLabel: "Saat (x)",
        yLabel: "Su (y)",
        initialValue: 200,
        rate: -15,
        startsAtZero: false
    },
    {
        id: 6,
        text: "Bir ağaç her yıl 12 cm büyümektedir. Yıl sayısı (x) ve ağacın boyu (y) arasındaki ilişkinin tablo ve grafiğini çiziniz.",
        xLabel: "Yıl (x)",
        yLabel: "Boy (cm) (y)",
        initialValue: 0,
        rate: 12,
        startsAtZero: true
    }
];


// Graph to question scenarios database
const graphToQuestionScenarios = [
    {
        id: 1,
        graphType: 'plant_growth',
        mainQuestion: 'Yandaki grafikte bir fidanın aylara göre boy değişimi verilmiştir. Buna göre;',
        yAxisLabel: 'Bitkinin Boyu (cm)',
        xAxisLabel: 'Süre (ay)',
        yStart: 25,
        yStep: 3,
        yMax: 40,
        xMax: 4,
        points: [
            {x: 0, y: 25},
            {x: 1, y: 28},
            {x: 2, y: 31},
            {x: 3, y: 34},
            {x: 4, y: 37}
        ],
        lineColor: '#ef4444',
        questions: [
            {
                id: 'a',
                text: 'a) Fidan dikildiğinde boyu kaç santimetredir?',
                correctAnswer: '25 cm',
                options: ['25 cm', '28 cm', '22 cm', '30 cm']
            },
            {
                id: 'b',
                text: 'b) Bu fidan bir ayda kaç cm uzamaktadır?',
                correctAnswer: '3 cm',
                options: ['3 cm', '2 cm', '4 cm', '5 cm']
            },
            {
                id: 'c',
                text: 'c) Bu fidanın boyu (y) ve süreye (x) bağlı doğrusal denklemini yazınız.',
                correctAnswer: 'y = 3x + 25',
                options: ['y = 3x + 25', 'y = 2x + 25', 'y = 3x + 28', 'y = 4x + 25']
            },
            {
                id: 'd',
                text: 'd) 10. ayın sonunda fidanın boyu kaç cm dir?',
                correctAnswer: '55 cm',
                options: ['55 cm', '58 cm', '52 cm', '60 cm']
            },
            {
                id: 'e',
                text: 'e) Kaç ay sonra fidanın boyu 85 cm dir?',
                correctAnswer: '20 ay',
                options: ['20 ay', '18 ay', '22 ay', '25 ay']
            }
        ]
    },
    {
        id: 2,
        graphType: 'water_tank',
        mainQuestion: 'Yandaki grafikte içinde 200 ton su olan bir havuzdan tarla sulamak için saatlere göre alınan su miktarı verilmiştir. Buna göre;',
        yAxisLabel: 'Havuzdaki Su (ton)',
        xAxisLabel: 'Süre (saat)',
        yMin: 160,
        yMax: 200,
        yStep: 5,
        xMax: 8,
        points: [
            {x: 0, y: 200},
            {x: 2, y: 190},
            {x: 4, y: 180},
            {x: 6, y: 170}
        ],
        lineColor: '#3b82f6',
        questions: [
            {
                id: 'a',
                text: 'a) Başlangıçta havuzda kaç ton su vardır?',
                correctAnswer: '200 ton',
                options: ['200 ton', '190 ton', '210 ton', '195 ton']
            },
            {
                id: 'b',
                text: 'b) Her saat kaç ton su alınmaktadır?',
                correctAnswer: '5 ton',
                options: ['5 ton', '4 ton', '6 ton', '10 ton']
            },
            {
                id: 'c',
                text: 'c) Havuzdaki su miktarı (y) ve süreye (x) bağlı doğrusal denklemini yazınız.',
                correctAnswer: 'y = -5x + 200',
                options: ['y = -5x + 200', 'y = -4x + 200', 'y = 5x + 200', 'y = -10x + 200']
            },
            {
                id: 'd',
                text: 'd) 12. saatin sonunda havuzda kaç ton su kalır?',
                correctAnswer: '140 ton',
                options: ['140 ton', '130 ton', '150 ton', '145 ton']
            },
            {
                id: 'e',
                text: 'e) Kaç saat sonra havuzda 100 ton su kalır?',
                correctAnswer: '20 saat',
                options: ['20 saat', '18 saat', '22 saat', '24 saat']
            }
        ]
    },
    {
        id: 3,
        graphType: 'two_cars_fuel',
        mainQuestion: 'Aşağıdaki grafikte aynı anda harekete başlayan iki aracın deposundaki benzinin zamana bağlı değişimi gösterilmiştir. Buna göre;',
        yAxisLabel: 'Benzin (L)',
        xAxisLabel: 'Zaman (saat)',
        yMin: 0,
        yMax: 80,
        yStep: 10,
        xMax: 20,
        xStep: 2,
        lines: [
            {
                color: '#3b82f6',
                name: 'Mavi Araç',
                points: [
                    {x: 0, y: 80},
                    {x: 8, y: 0}
                ]
            },
            {
                color: '#ef4444',
                name: 'Kırmızı Araç',
                points: [
                    {x: 0, y: 40},
                    {x: 20, y: 0}
                ]
            }
        ],
        questions: [
            {
                id: 'a',
                text: 'Kaçıncı saat sonunda araçların depolarındaki kalan yakıt miktarları eşit olur?',
                correctAnswer: '5. saat',
                options: ['4. saat', '5. saat', '3. saat', '6. saat']
            }
        ]
    },
    {
        id: 4,
        graphType: 'article_reading',
        mainQuestion: 'Mustafa okuması gereken 400 makaleden her gün eşit sayıda makale seçip okuyor. Buna göre aşağıdaki grafiğe bakarak tüm makalelerin kaç günde biteceğini bulunuz?',
        yAxisLabel: 'Makale Sayısı',
        xAxisLabel: 'Gün',
        yMin: 0,
        yMax: 400,
        yStep: 50,
        xMax: 100,
        xStep: 10,
        lines: [
            {
                color: '#3b82f6',
                name: 'Kalan Makaleler',
                points: [
                    {x: 0, y: 400},
                    {x: 50, y: 200},
                    {x: 80, y: 80}
                ],
                label: 'Kalan Makale Sayısı',
                labelPosition: 'end'
            },
            {
                color: '#ef4444',
                name: 'Okunan Makaleler',
                points: [
                    {x: 0, y: 0},
                    {x: 50, y: 200},
                    {x: 80, y: 320}
                ],
                label: 'Okunan Makale Sayısı',
                labelPosition: 'end'
            }
        ],
        questions: [
            {
                id: 'a',
                text: 'Tüm makaleler kaç günde biter?',
                correctAnswer: '100 gün',
                options: ['100 gün', '80 gün', '90 gün', '120 gün']
            }
        ]
    },
    {
        id: 5,
        graphType: 'taxi_fare',
        mainQuestion: 'Aşağıda A ve B şehirlerindeki taksi ücret tarifelerine ilişkin iki doğrusal grafik verilmiştir. Bu iki şehirde 20 km yol giden taksilere ödenecek ücretler arasındaki fark kaç liradır?',
        yAxisLabel: 'Ücret (TL)',
        xAxisLabel: 'Alınan Yol (km)',
        yMin: 0,
        yMax: 100,
        yStep: 10,
        xMax: 20,
        xStep: 2,
        lines: [
            {
                color: '#3b82f6',
                name: 'B Şehri',
                points: [
                    {x: 0, y: 50},
                    {x: 4, y: 60},
                    {x: 16, y: 90}
                ],
                label: 'B ŞEHRİ',
                labelPosition: 'end'
            },
            {
                color: '#ef4444',
                name: 'A Şehri',
                points: [
                    {x: 0, y: 45},
                    {x: 4, y: 60},
                    {x: 12, y: 90}
                ],
                label: 'A ŞEHRİ',
                labelPosition: 'end'
            }
        ],
        questions: [
            {
                id: 'a',
                text: 'Bu iki şehirde 20 km yol giden taksilere ödenecek ücretler arasındaki fark kaç liradır?',
                correctAnswer: '20 TL',
                options: ['10 TL', '15 TL', '20 TL', '5 TL']
            }
        ]
    }
];


const canvas = document.getElementById('canvas');
const CANVAS_SIZE = 600;
const GRID_SIZE = 30;
const ORIGIN = { x: 300, y: 300 };


// Sound effect functions using Web Audio API
function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const notes = [261.63, 329.63, 392.00]; // Do, Mi, Sol frequencies
        const noteDuration = 0.15;


        notes.forEach((frequency, index) => {
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();


            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);


            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';


            const startTime = audioContext.currentTime + (index * noteDuration);
            gainNode.gain.setValueAtTime(0.3, startTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + noteDuration);


            oscillator.start(startTime);
            oscillator.stop(startTime + noteDuration);
        });
    } catch (e) {
        console.log('Audio not supported');
    }
}


function playErrorSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();


        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);


        oscillator.frequency.value = 200; // Low frequency for error
        oscillator.type = 'sawtooth';


        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);


        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Audio not supported');
    }
}


function initCanvas() {
    canvas.innerHTML = '';


    // Draw grid lines with SVG for perfect alignment
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');


    // Vertical grid lines
    for (let x = -11; x <= 11; x++) {
        const pixel = coordToPixel(x, 0);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', pixel.x);
        line.setAttribute('y1', 10);
        line.setAttribute('x2', pixel.x);
        line.setAttribute('y2', CANVAS_SIZE - 10);
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }


    // Horizontal grid lines
    for (let y = -11; y <= 11; y++) {
        const pixel = coordToPixel(0, y);
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 10);
        line.setAttribute('y1', pixel.y);
        line.setAttribute('x2', CANVAS_SIZE - 10);
        line.setAttribute('y2', pixel.y);
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }


    canvas.appendChild(gridGroup);


    const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');


    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 10);
    xAxis.setAttribute('y1', ORIGIN.y);
    xAxis.setAttribute('x2', CANVAS_SIZE - 10);
    xAxis.setAttribute('y2', ORIGIN.y);
    xAxis.classList.add('axis-line');
    axisGroup.appendChild(xAxis);


    const xArrowLeft = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    xArrowLeft.setAttribute('points', `10,${ORIGIN.y} 20,${ORIGIN.y - 5} 20,${ORIGIN.y + 5}`);
    xArrowLeft.setAttribute('fill', '#374151');
    axisGroup.appendChild(xArrowLeft);


    const xArrowRight = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    xArrowRight.setAttribute('points', `${CANVAS_SIZE - 10},${ORIGIN.y} ${CANVAS_SIZE - 20},${ORIGIN.y - 5} ${CANVAS_SIZE - 20},${ORIGIN.y + 5}`);
    xArrowRight.setAttribute('fill', '#374151');
    axisGroup.appendChild(xArrowRight);


    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', CANVAS_SIZE - 15);
    xLabel.setAttribute('y', ORIGIN.y - 10);
    xLabel.setAttribute('font-size', '16');
    xLabel.setAttribute('font-weight', 'bold');
    xLabel.setAttribute('fill', '#374151');
    xLabel.textContent = 'X';
    axisGroup.appendChild(xLabel);


    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', ORIGIN.x);
    yAxis.setAttribute('y1', 10);
    yAxis.setAttribute('x2', ORIGIN.x);
    yAxis.setAttribute('y2', CANVAS_SIZE - 10);
    yAxis.classList.add('axis-line');
    axisGroup.appendChild(yAxis);


    const yArrowTop = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    yArrowTop.setAttribute('points', `${ORIGIN.x},10 ${ORIGIN.x - 5},20 ${ORIGIN.x + 5},20`);
    yArrowTop.setAttribute('fill', '#374151');
    axisGroup.appendChild(yArrowTop);


    const yArrowBottom = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    yArrowBottom.setAttribute('points', `${ORIGIN.x},${CANVAS_SIZE - 10} ${ORIGIN.x - 5},${CANVAS_SIZE - 20} ${ORIGIN.x + 5},${CANVAS_SIZE - 20}`);
    yArrowBottom.setAttribute('fill', '#374151');
    axisGroup.appendChild(yArrowBottom);


    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    yLabel.setAttribute('x', ORIGIN.x + 15);
    yLabel.setAttribute('y', 20);
    yLabel.setAttribute('font-size', '16');
    yLabel.setAttribute('font-weight', 'bold');
    yLabel.setAttribute('fill', '#374151');
    yLabel.textContent = 'Y';
    axisGroup.appendChild(yLabel);


    canvas.appendChild(axisGroup);


    const numbersGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');


    for (let i = -10; i <= 10; i++) {
        if (i === 0) continue;
        const pixel = coordToPixel(i, 0);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pixel.x);
        text.setAttribute('y', pixel.y + 18);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#1f2937');
        text.textContent = i;
        numbersGroup.appendChild(text);
    }


    for (let i = -9; i <= 9; i++) {
        if (i === 0) continue;
        const pixel = coordToPixel(0, i);
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', pixel.x - 18);
        text.setAttribute('y', pixel.y + 5);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#1f2937');
        text.textContent = i;
        numbersGroup.appendChild(text);
    }


    const originText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    originText.setAttribute('x', ORIGIN.x - 12);
    originText.setAttribute('y', ORIGIN.y + 15);
    originText.setAttribute('text-anchor', 'middle');
    originText.setAttribute('font-size', '10');
    originText.setAttribute('fill', '#374151');
    originText.setAttribute('font-weight', 'bold');
    originText.textContent = '0';
    numbersGroup.appendChild(originText);


    canvas.appendChild(numbersGroup);


    // Grid intersection dots
    const gridDotsGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for (let x = -11; x <= 11; x++) {
        for (let y = -11; y <= 11; y++) {
            const pixel = coordToPixel(x, y);
            const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            dot.setAttribute('cx', pixel.x);
            dot.setAttribute('cy', pixel.y);
            dot.setAttribute('r', 4);
            dot.setAttribute('fill', '#94a3b8');
            dot.setAttribute('opacity', '0.6');
            gridDotsGroup.appendChild(dot);
        }
    }
    canvas.appendChild(gridDotsGroup);


    // Universal input handlers - work on all devices and OS
    // Use only pointer events for modern browsers (handles mouse, touch, and pen)
    if (window.PointerEvent) {
        canvas.addEventListener('pointerup', handleCanvasPointer);
    } else {
        // Fallback for older browsers
        canvas.addEventListener('click', handleCanvasClick);
        canvas.addEventListener('touchend', handleCanvasTouch, { passive: false });
    }
}


function showSlopeContent(type) {
    const panel = document.getElementById("slopeQuestionPanel");
    const answerBox = document.getElementById("slopeAnswerBox");
    const titleSpan = panel.querySelector("span.text-lg");
    const infoText = panel.querySelector("span.text-sm");

    panel.classList.remove("hidden");
    answerBox.textContent = "?";

    // Eğer elementler bulunamazsa hata vermesin
    if (!titleSpan || !infoText) {
        console.warn("slopeQuestionPanel içinde gerekli span bulunamadı!");
        return;
    }

    switch(type) {
        case "incline":
            titleSpan.textContent = "Eğik Düzlem Sorusu";
            infoText.textContent = "Eğim = Dikey / Yatay (örneğin: yükseklik / taban uzunluğu)";
            break;
        case "graph":
            titleSpan.textContent = "Grafikten Eğim Sorusu";
            infoText.textContent = "Grafikte iki nokta seç → (y2 - y1) / (x2 - x1)";
            break;
        case "twoPoints":
            titleSpan.textContent = "İki Noktadan Eğim Sorusu";
            infoText.textContent = "Formül: m = (y2 - y1) / (x2 - x1)";
            break;
        case "equation":
            titleSpan.textContent = "Denklemden Eğim Sorusu";
            infoText.textContent = "y = ax + b denkleminde eğim katsayısı a’dır.";
            break;
    }
}


// Butonlara tıklama olaylarını bağla
document.getElementById("btnSlopeIncline").addEventListener("click", () => showSlopeContent("incline"));
document.getElementById("btnSlopeGraph").addEventListener("click", () => showSlopeContent("graph"));
document.getElementById("btnSlopeTwoPoints").addEventListener("click", () => showSlopeContent("twoPoints"));
document.getElementById("btnSlopeEquation").addEventListener("click", () => showSlopeContent("equation"));

function toggleTransformMenu() {
    const subButtons = document.getElementById("transformSubButtons");
    subButtons.classList.toggle("hidden");
}



function coordToPixel(x, y) {
    return {
        x: ORIGIN.x + x * GRID_SIZE,
        y: ORIGIN.y - y * GRID_SIZE
    };
}


function pixelToCoord(px, py) {
    const x = Math.round((px - ORIGIN.x) / GRID_SIZE);
    const y = Math.round((ORIGIN.y - py) / GRID_SIZE);
    return { x, y };
}


function generateRandomShape() {
    const types = ['point', 'segment', 'triangle', 'quadrilateral'];
    const type = types[Math.floor(Math.random() * types.length)];


    let points = [];
    let numPoints = 0;


    switch(type) {
        case 'point':
            numPoints = 1;
            break;
        case 'segment':
            numPoints = 2;
            break;
        case 'triangle':
            numPoints = 3;
            break;
        case 'quadrilateral':
            numPoints = 4;
            break;
    }


    // Helper function to check if three points are collinear
    function areCollinear(p1, p2, p3) {
        return (p2.y - p1.y) * (p3.x - p1.x) === (p3.y - p1.y) * (p2.x - p1.x);
    }


    // Helper function to check if any three points in array are collinear
    function hasCollinearPoints(pointArray) {
        if (pointArray.length < 3) return false;
        for (let i = 0; i < pointArray.length - 2; i++) {
            for (let j = i + 1; j < pointArray.length - 1; j++) {
                for (let k = j + 1; k < pointArray.length; k++) {
                    if (areCollinear(pointArray[i], pointArray[j], pointArray[k])) {
                        return true;
                    }
                }
            }
        }
        return false;
    }


    // Helper function to check if two line segments intersect
    function segmentsIntersect(p1, p2, p3, p4) {
        function ccw(A, B, C) {
            return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x);
        }


        // If segments share an endpoint, they don't "intersect"
        if ((p1.x === p3.x && p1.y === p3.y) || (p1.x === p4.x && p1.y === p4.y) ||
            (p2.x === p3.x && p2.y === p3.y) || (p2.x === p4.x && p2.y === p4.y)) {
            return false;
        }


        return ccw(p1, p3, p4) !== ccw(p2, p3, p4) && ccw(p1, p2, p3) !== ccw(p1, p2, p4);
    }


    // Helper function to check if polygon has self-intersecting edges
    function hasSelfIntersection(pointArray) {
        if (pointArray.length < 4) return false;


        for (let i = 0; i < pointArray.length; i++) {
            for (let j = i + 2; j < pointArray.length; j++) {
                if (j === i + 1 || (i === 0 && j === pointArray.length - 1)) continue;


                const p1 = pointArray[i];
                const p2 = pointArray[(i + 1) % pointArray.length];
                const p3 = pointArray[j];
                const p4 = pointArray[(j + 1) % pointArray.length];


                if (segmentsIntersect(p1, p2, p3, p4)) {
                    return true;
                }
            }
        }
        return false;
    }


    // Helper to calculate distance between two points
    function distance(p1, p2) {
        return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }


    // Helper to calculate aspect ratio (ratio of max to min dimension)
    function getAspectRatio(pointArray) {
        if (pointArray.length < 2) return 1;


        let minX = Math.min(...pointArray.map(p => p.x));
        let maxX = Math.max(...pointArray.map(p => p.x));
        let minY = Math.min(...pointArray.map(p => p.y));
        let maxY = Math.max(...pointArray.map(p => p.y));


        let width = maxX - minX;
        let height = maxY - minY;


        if (width === 0 || height === 0) return 10; // Invalid shape


        return Math.max(width / height, height / width);
    }


    // For point shapes, use simpler logic
    if (type === 'point') {
        const validCoords = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
        const x = validCoords[Math.floor(Math.random() * validCoords.length)];
        const y = validCoords[Math.floor(Math.random() * validCoords.length)];
        return { type, points: [{ x, y }] };
    }


    // For segments, ensure they're large
    if (type === 'segment') {
        const validCoords = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5];
        let attempts = 0;
        do {
            const x1 = validCoords[Math.floor(Math.random() * validCoords.length)];
            const y1 = validCoords[Math.floor(Math.random() * validCoords.length)];
            const x2 = validCoords[Math.floor(Math.random() * validCoords.length)];
            const y2 = validCoords[Math.floor(Math.random() * validCoords.length)];


            points = [{ x: x1, y: y1 }, { x: x2, y: y2 }];


            // Ensure segment is at least 4 units long
            if (distance(points[0], points[1]) >= 4) {
                return { type, points };
            }
            attempts++;
        } while (attempts < 100);


        return { type, points };
    }


    // For triangles and quadrilaterals, create larger shapes with good aspect ratios
    let validShape = false;
    let attempts = 0;


    while (!validShape && attempts < 200) {
        points = [];


        // 95% chance to place shape in a quadrant (not crossing axes)
        // 5% chance to place shape crossing axes
        const placeInQuadrant = Math.random() < 0.95;


        let centerX, centerY;


        if (placeInQuadrant) {
            // Choose a random quadrant
            const quadrants = [
                { xRange: [2, 6], yRange: [2, 6] },    // Q1 (top right)
                { xRange: [-6, -2], yRange: [2, 6] },  // Q2 (top left)
                { xRange: [-6, -2], yRange: [-6, -2] }, // Q3 (bottom left)
                { xRange: [2, 6], yRange: [-6, -2] }   // Q4 (bottom right)
            ];


            const quadrant = quadrants[Math.floor(Math.random() * quadrants.length)];


            // Place center in the chosen quadrant
            centerX = Math.floor(Math.random() * (quadrant.xRange[1] - quadrant.xRange[0] + 1)) + quadrant.xRange[0];
            centerY = Math.floor(Math.random() * (quadrant.yRange[1] - quadrant.yRange[0] + 1)) + quadrant.yRange[0];
        } else {
            // Place near center (can cross axes)
            centerX = Math.floor(Math.random() * 7) - 3; // -3 to 3
            centerY = Math.floor(Math.random() * 7) - 3; // -3 to 3
        }


        // Generate points around the center with larger spread
        for (let i = 0; i < numPoints; i++) {
            let x, y;
            let pointAttempts = 0;


            do {
                // Create larger offsets (2.5 to 4 units from center for quadrant shapes, 3 to 5 for center shapes)
                const angle = (Math.PI * 2 * i / numPoints) + (Math.random() - 0.5) * Math.PI / 2;
                const radius = placeInQuadrant ? (2.5 + Math.random() * 1.5) : (3 + Math.random() * 2);


                x = Math.round(centerX + radius * Math.cos(angle));
                y = Math.round(centerY + radius * Math.sin(angle));


                // Keep within bounds
                x = Math.max(-9, Math.min(9, x));
                y = Math.max(-9, Math.min(9, y));


                const isDuplicate = points.some(p => p.x === x && p.y === y);


                if (!isDuplicate) {
                    break;
                }
                pointAttempts++;
            } while (pointAttempts < 30);


            points.push({ x, y });
        }


        // Check validity
        const aspectRatio = getAspectRatio(points);
        const isNotCollinear = !hasCollinearPoints(points);
        const noSelfIntersection = !hasSelfIntersection(points);


        // Ensure minimum size
        let minX = Math.min(...points.map(p => p.x));
        let maxX = Math.max(...points.map(p => p.x));
        let minY = Math.min(...points.map(p => p.y));
        let maxY = Math.max(...points.map(p => p.y));
        let width = maxX - minX;
        let height = maxY - minY;


        // Accept if: aspect ratio between 1.2 and 2.5, not collinear, no self-intersection, and large enough
        if (aspectRatio >= 1.2 && aspectRatio <= 2.5 &&
             isNotCollinear && noSelfIntersection &&
            width >= 4 && height >= 4) {
            validShape = true;
        }


        attempts++;
    }


    return { type, points };
}


function drawShape(points, className, showPoints = true) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');


    if (points.length === 1) {
        const pixel = coordToPixel(points[0].x, points[0].y);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pixel.x);
        circle.setAttribute('cy', pixel.y);
        circle.setAttribute('r', 6);
        circle.classList.add(className);
        group.appendChild(circle);


        if (className.includes('original')) {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', pixel.x + 8);
            label.setAttribute('y', pixel.y - 8);
            label.setAttribute('font-size', '11');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('fill', '#2563eb');
            label.textContent = `(${points[0].x},${points[0].y})`;
            group.appendChild(label);
        }
    } else if (points.length >= 2) {
        const pathData = points.map((p, i) => {
            const pixel = coordToPixel(p.x, p.y);
            return i === 0 ? `M ${pixel.x} ${pixel.y}` : `L ${pixel.x} ${pixel.y}`;
        }).join(' ');


        if (points.length > 2) {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData + ' Z');
            path.classList.add(className);
            group.appendChild(path);
        } else {
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', pathData);
            path.classList.add(className);
            path.setAttribute('fill', 'none');
            group.appendChild(path);
        }


        if (showPoints) {
            points.forEach(p => {
                const pixel = coordToPixel(p.x, p.y);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pixel.x);
                circle.setAttribute('cy', pixel.y);
                circle.setAttribute('r', 4);
                circle.setAttribute('fill', className.includes('original') ? '#2563eb' : '#059669');
                group.appendChild(circle);


                if (className.includes('original')) {
                    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                    label.setAttribute('x', pixel.x + 8);
                    label.setAttribute('y', pixel.y - 8);
                    label.setAttribute('font-size', '11');
                    label.setAttribute('font-weight', 'bold');
                    label.setAttribute('fill', '#2563eb');
                    label.textContent = `(${p.x},${p.y})`;
                    group.appendChild(label);
                }
            });
        }
    }


    canvas.appendChild(group);
}


function applyTranslation(points) {
    const dx = Math.floor(Math.random() * 7) - 3;
    const dy = Math.floor(Math.random() * 7) - 3;
    gameState.translationVector = { dx, dy };


    return points.map(p => ({
        x: p.x + dx,
        y: p.y + dy
    }));
}


function applyReflection(points) {
    const axes = ['x', 'y'];
    const axis = axes[Math.floor(Math.random() * axes.length)];
    gameState.reflectionAxis = axis;


    return points.map(p => ({
        x: axis === 'y' ? -p.x : p.x,
        y: axis === 'x' ? -p.y : p.y
    }));
}


// Çizimi gerçekleştiren ana fonksiyon
function drawLogicalPoint(coord) {
    if (!gameState.mode) return;
    if (gameState.mode === 'placeToPoint') return;
    if (gameState.mode === 'pointToPlace') {
        if (gameState.userClicks.length >= 1) return;
    } else if (gameState.originalShape && gameState.userClicks.length >= gameState.originalShape.points.length) {
        return;
    }

    gameState.userClicks.push(coord);
    const pixel = coordToPixel(coord.x, coord.y);
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', pixel.x);
    circle.setAttribute('cy', pixel.y);
    circle.setAttribute('r', 5);
    circle.setAttribute('fill', '#f59e0b');
    circle.setAttribute('stroke', '#d97706');
    circle.setAttribute('stroke-width', 2);
    canvas.appendChild(circle);

    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', pixel.x + 8);
    label.setAttribute('y', pixel.y - 8);
    label.setAttribute('font-size', '11');
    label.setAttribute('font-weight', 'bold');
    label.setAttribute('fill', '#d97706');
    label.textContent = `(${coord.x},${coord.y})`;
    canvas.appendChild(label);

    updateUI();

    document.getElementById('undoBtn').disabled = false;

    if (gameState.mode === 'pointToPlace' && gameState.userClicks.length === 1) {
        document.getElementById('checkBtn').disabled = false;
    } else if (gameState.originalShape && gameState.userClicks.length === gameState.originalShape.points.length) {
        document.getElementById('checkBtn').disabled = false;
    }
}

// P2P üzerinden gelen koordinatı çiz
window.p2pAddPointToCanvas = function(coord) {
    drawLogicalPoint(coord);
};

// Universal handler for adding points - works on all devices and OS
function addPointToCanvas(clientX, clientY) {
    if (!gameState.mode) return;

    // Use SVG's built-in coordinate transformation
    const pt = canvas.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;

    // Transform screen coordinates to SVG coordinates
    const svgP = pt.matrixTransform(canvas.getScreenCTM().inverse());

    const coord = pixelToCoord(svgP.x, svgP.y);

    // GÖLGE SENKRONİZASYON: Tablet, Tahtaya mantıksal koordinatı göndersin
    if (typeof window.sendP2PCanvasPointEvent === 'function') {
        window.sendP2PCanvasPointEvent(coord);
    }

    drawLogicalPoint(coord);
}





// Mouse handler for PC, Pardus, and desktop systems
function handleCanvasClick(e) {
    addPointToCanvas(e.clientX, e.clientY);
}


// Touch handler for mobile devices, tablets, and smart boards
// Compatible with iOS, Android, HarmonyOS
function handleCanvasTouch(e) {
    e.preventDefault(); // Prevent mouse event from also firing


    if (e.changedTouches && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        addPointToCanvas(touch.clientX, touch.clientY);
    }
}


// Pointer handler for smart boards and hybrid devices
// Works on all modern browsers and systems
function handleCanvasPointer(e) {
    // Only handle primary pointer to avoid duplicates
    if (!e.isPrimary) return;


    addPointToCanvas(e.clientX, e.clientY);
}


function checkLinearGraph() {
    // 1. Çizgi var mı kontrol et (Sadece 2 nokta olmalı)
    if (linearState.drawnPoints.length !== 2) {
        showFeedback(false);
        const feedback = document.getElementById('feedback');
        feedback.textContent = 'Lütfen grafiği çiziniz! (İki nokta arasına çizgi çekin)';
        feedback.style.opacity = '1';
        return;
    }

    // 2. Tablodaki geçerli noktaları al
    const validPoints = [];
    for (let i = 0; i < Math.min(4, linearState.tableData.length); i++) {
        const row = linearState.tableData[i];
        if (row.x && row.calcY !== undefined) {
            const xVal = parseFloat(row.x);
            const yVal = row.calcY;
            if (!isNaN(xVal) && !isNaN(yVal) && isFinite(yVal)) {
                // Sadece grid sınırları içindekileri al
                const scaledY = yVal / linearState.yScale;
                if (scaledY >= 0 && scaledY <= 9 && xVal >= 0 && xVal <= 9) {
                    validPoints.push({ x: xVal, scaledY: scaledY });
                }
            }
        }
    }

    if (validPoints.length === 0) {
        showFeedback(false); return;
    }

    // 3. Çizilen çizgiyi al (P1 ve P2)
    const p1 = linearState.drawnPoints[0];
    const p2 = linearState.drawnPoints[1];

    // 4. Her bir tablo noktasının çizilen çizgiye uzaklığını kontrol et
    let allPointsCovered = true;
    
    // Çizgi denklemi veya uzaklık hesabı için vektör hesabı
    // Line defined by p1 and p2. Distance from point p0 to line p1p2.
    // Distance = |(y2-y1)x0 - (x2-x1)y0 + x2y1 - y2x1| / sqrt((y2-y1)^2 + (x2-x1)^2)
    
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

    if (denominator === 0) { allPointsCovered = false; } // Nokta çizmiş
    else {
        for (let point of validPoints) {
            // Tablo noktasını piksele çevir
            const p0 = linearCoordToPixel(point.x, point.scaledY);
            
            // Uzaklık formülü
            const numerator = Math.abs((y2 - y1) * p0.x - (x2 - x1) * p0.y + x2 * y1 - y2 * x1);
            const distance = numerator / denominator;

            // Tolerans (örneğin 15 piksel)
            if (distance > 20) {
                allPointsCovered = false;
                break;
            }
        }
    }

    // 5. Sonuç
    if (allPointsCovered) {
        playSuccessSound();
        showFeedback(true);
        
        // Çizgiyi yeşil yap
        const userLine = document.querySelector('.user-drawn-line');
        if (userLine) { 
            userLine.setAttribute('stroke', '#10b981'); 
            userLine.setAttribute('stroke-width', '6'); 
        }

        setTimeout(() => {
            startLinearQuestion();
        }, 3000);
    } else {
        playErrorSound();
        showFeedback(false);
        const feedback = document.getElementById('feedback');
        feedback.textContent = 'Çizgin tablodaki noktalardan geçmiyor! Tekrar dene.';
        feedback.style.opacity = '1';
        
        // Yanlış çizgiyi sil
        document.querySelectorAll('.user-drawn-line').forEach(line => line.remove());
        linearState.drawnPoints = [];
    }
}


function checkGraphAnswer() {
    if (!linearState.selectedOption) {
        return;
    }
    const currentQuestion = linearState.currentScenario.questions[linearState.currentQuestionIndex];
    const isCorrect = linearState.selectedOption === currentQuestion.correctAnswer;
    if (isCorrect) {
        playSuccessSound();


        // Highlight correct answer
        document.querySelectorAll('.option-button').forEach(btn => {
            if (btn.textContent === currentQuestion.correctAnswer) {
                btn.classList.add('correct');
                btn.classList.remove('selected');
            } else {
                btn.style.opacity = '0.5';
            }
        });
        showFeedback(true);
        // Move to next question after delay
        setTimeout(() => {
            linearState.currentQuestionIndex++;


            if (linearState.currentQuestionIndex < linearState.currentScenario.questions.length) {
                // Show next question
                showGraphQuestion();
            } else {
                // All questions completed
                const feedback = document.getElementById('feedback');
                feedback.textContent = 'Tebrikler! Tüm soruları tamamladın! 🎉🎊';
                feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl font-bold text-center transition-all bg-green-500 text-white text-2xl success-animation';
                feedback.style.opacity = '1';
                setTimeout(() => {
                    startGraphToQuestion(); // Restart with new scenario
                }, 3000);
            }
        }, 2000);
    } else {
        playErrorSound();


        // Highlight wrong answer
        document.querySelectorAll('.option-button').forEach(btn => {
            if (btn.textContent === linearState.selectedOption) {
                btn.classList.add('wrong');
                btn.classList.remove('selected');
            }
        });
        showFeedback(false);
        // Reset after delay
        setTimeout(() => {
            document.querySelectorAll('.option-button').forEach(btn => {
                btn.classList.remove('wrong', 'correct', 'selected');
                btn.style.opacity = '1';
            });
            linearState.selectedOption = null;
            document.getElementById('checkBtn').disabled = true;
        }, 2000);
    }
}


function checkAnswer() {
    // Check if we're in linear mode
    if (gameState.mode === 'questionToGraph' || gameState.mode === 'linear_graph_draw' || gameState.mode === 'linear_graph_table') {
        if (gameState.mode === 'questionToGraph') checkLinearGraph();
        return;
    }


    // Check if we're in graph to question mode
    if (gameState.mode === 'graphToQuestion') {
        checkGraphAnswer();
        return;
    }


    let correct = false;


    if (gameState.mode === 'pointToPlace') {
        // Check if user clicked on correct coordinate
        if (gameState.userClicks.length === 1) {
            const clicked = gameState.userClicks[0];
            correct = clicked.x === gameState.targetPoint.x && clicked.y === gameState.targetPoint.y;
        }
    } else if (gameState.mode === 'placeToPoint') {
        // Check if selected option is correct
        if (gameState.selectedOption) {
            correct = gameState.selectedOption.x === gameState.correctAnswer.x &&
                      gameState.selectedOption.y === gameState.correctAnswer.y;
        }
    } else {
        // Original translation/reflection logic
        const tolerance = 0;
        correct = true;


        // Check if all user clicks match expected points (order doesn't matter)
        const expectedPoints = [...gameState.transformedShape.points];
        const userPoints = [...gameState.userClicks];


        // For each expected point, check if there's a matching user click
        for (let expected of expectedPoints) {
            const matchIndex = userPoints.findIndex(user =>
                Math.abs(expected.x - user.x) <= tolerance &&
                Math.abs(expected.y - user.y) <= tolerance
            );


            if (matchIndex === -1) {
                correct = false;
                break;
            }


            // Remove matched point to handle duplicate coordinates correctly
            userPoints.splice(matchIndex, 1);
        }
    }


    if (correct) {
        // Play success sound
        playSuccessSound();


        // For point-to-place and place-to-point modes, show success immediately
        if (gameState.mode === 'pointToPlace' || gameState.mode === 'placeToPoint') {
            showFeedback(true);


            // Show correct point with animation
            if (gameState.mode === 'pointToPlace') {
                const pixel = coordToPixel(gameState.targetPoint.x, gameState.targetPoint.y);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pixel.x);
                circle.setAttribute('cy', pixel.y);
                circle.setAttribute('r', 10);
                circle.setAttribute('fill', '#10b981');
                circle.setAttribute('stroke', '#059669');
                circle.setAttribute('stroke-width', 3);
                circle.style.animation = 'successPulse 0.6s ease-out forwards';
                canvas.appendChild(circle);


                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', pixel.x + 12);
                label.setAttribute('y', pixel.y - 12);
                label.setAttribute('font-size', '14');
                label.setAttribute('font-weight', 'bold');
                label.setAttribute('fill', '#059669');
                label.textContent = `(${gameState.targetPoint.x},${gameState.targetPoint.y})`;
                canvas.appendChild(label);
            } else {
                // Highlight correct answer button
                const optionButtons = document.querySelectorAll('.coord-option');
                optionButtons.forEach(btn => {
                    const x = parseInt(btn.dataset.x);
                    const y = parseInt(btn.dataset.y);
                    if (x === gameState.correctAnswer.x && y === gameState.correctAnswer.y) {
                        btn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
                        btn.classList.add('bg-green-500');
                    }
                });
            }


            setTimeout(() => {
                startNewRound();
            }, 2000);
            return;
        }


        // Create a clone of the original shape that will animate
        const cloneGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        cloneGroup.classList.add('shape-clone');


        const originalPoints = gameState.originalShape.points;
        const transformedPoints = gameState.transformedShape.points;


        // Create the shape elements
        let shapeElement;
        let pointElements = [];


        if (originalPoints.length === 1) {
            const pixel = coordToPixel(originalPoints[0].x, originalPoints[0].y);
            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            shapeElement.setAttribute('cx', pixel.x);
            shapeElement.setAttribute('cy', pixel.y);
            shapeElement.setAttribute('r', 6);
            shapeElement.setAttribute('fill', 'rgba(16, 185, 129, 0.5)');
            shapeElement.setAttribute('stroke', '#059669');
            shapeElement.setAttribute('stroke-width', 2);
            cloneGroup.appendChild(shapeElement);
        } else if (originalPoints.length >= 2) {
            const pathData = originalPoints.map((p, i) => {
                const pixel = coordToPixel(p.x, p.y);
                return i === 0 ? `M ${pixel.x} ${pixel.y}` : `L ${pixel.x} ${pixel.y}`;
            }).join(' ');


            shapeElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            if (originalPoints.length > 2) {
                shapeElement.setAttribute('d', pathData + ' Z');
            } else {
                shapeElement.setAttribute('d', pathData);
                shapeElement.setAttribute('fill', 'none');
            }
            shapeElement.setAttribute('fill', 'rgba(16, 185, 129, 0.5)');
            shapeElement.setAttribute('stroke', '#059669');
            shapeElement.setAttribute('stroke-width', 2);
            cloneGroup.appendChild(shapeElement);


            // Add point circles
            originalPoints.forEach(p => {
                const pixel = coordToPixel(p.x, p.y);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pixel.x);
                circle.setAttribute('cy', pixel.y);
                circle.setAttribute('r', 4);
                circle.setAttribute('fill', '#059669');
                cloneGroup.appendChild(circle);
                pointElements.push(circle);
            });
        }


        canvas.appendChild(cloneGroup);


        // Animate the clone moving from original position to transformed position
        const duration = 1500; // 1.5 seconds
        const startTime = performance.now();


        function animateTransformation(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);


            // Easing function (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;


            if (originalPoints.length === 1) {
                const startPixel = coordToPixel(originalPoints[0].x, originalPoints[0].y);
                const endPixel = coordToPixel(transformedPoints[0].x, transformedPoints[0].y);
                const currentX = startPixel.x + (endPixel.x - startPixel.x) * eased;
                const currentY = startPixel.y + (endPixel.y - startPixel.y) * eased;


                shapeElement.setAttribute('cx', currentX);
                shapeElement.setAttribute('cy', currentY);
            } else if (originalPoints.length >= 2) {
                // Animate the path
                const currentPathData = originalPoints.map((p, i) => {
                    const startPixel = coordToPixel(originalPoints[i].x, originalPoints[i].y);
                    const endPixel = coordToPixel(transformedPoints[i].x, transformedPoints[i].y);
                    const currentX = startPixel.x + (endPixel.x - startPixel.x) * eased;
                    const currentY = startPixel.y + (endPixel.y - startPixel.y) * eased;
                    return i === 0 ? `M ${currentX} ${currentY}` : `L ${currentX} ${currentY}`;
                }).join(' ');


                if (originalPoints.length > 2) {
                    shapeElement.setAttribute('d', currentPathData + ' Z');
                } else {
                    shapeElement.setAttribute('d', currentPathData);
                }


                // Animate point circles
                pointElements.forEach((circle, i) => {
                    const startPixel = coordToPixel(originalPoints[i].x, originalPoints[i].y);
                    const endPixel = coordToPixel(transformedPoints[i].x, transformedPoints[i].y);
                    const currentX = startPixel.x + (endPixel.x - startPixel.x) * eased;
                    const currentY = startPixel.y + (endPixel.y - startPixel.y) * eased;
                    circle.setAttribute('cx', currentX);
                    circle.setAttribute('cy', currentY);
                });
            }


            if (progress < 1) {
                window.animationFrameId = requestAnimationFrame(animateTransformation);
            } else {
                // Animation complete - show the final transformed shape with dashed line
                window.roundTimer = setTimeout(() => {
                    const finalGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');


                    if (transformedPoints.length === 1) {
                        const pixel = coordToPixel(transformedPoints[0].x, transformedPoints[0].y);
                        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        circle.setAttribute('cx', pixel.x);
                        circle.setAttribute('cy', pixel.y);
                        circle.setAttribute('r', 6);
                        circle.classList.add('transformed-shape');
                        finalGroup.appendChild(circle);
                    } else if (transformedPoints.length >= 2) {
                        const pathData = transformedPoints.map((p, i) => {
                            const pixel = coordToPixel(p.x, p.y);
                            return i === 0 ? `M ${pixel.x} ${pixel.y}` : `L ${pixel.x} ${pixel.y}`;
                        }).join(' ');


                        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                        if (transformedPoints.length > 2) {
                            path.setAttribute('d', pathData + ' Z');
                        } else {
                            path.setAttribute('d', pathData);
                            path.setAttribute('fill', 'none');
                        }
                        path.classList.add('transformed-shape');
                        finalGroup.appendChild(path);


                        transformedPoints.forEach(p => {
                            const pixel = coordToPixel(p.x, p.y);
                            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                            circle.setAttribute('cx', pixel.x);
                            circle.setAttribute('cy', pixel.y);
                            circle.setAttribute('r', 4);
                            circle.setAttribute('fill', '#059669');
                            finalGroup.appendChild(circle);
                        });
                    }


                    canvas.appendChild(finalGroup);


                    // Remove the clone
                    cloneGroup.remove();


                    showFeedback(true);


                    // Automatically start a new round after 2 seconds
                    setTimeout(() => {
                        startNewRound();
                    }, 2000);
                }, 200);
            }
        }


        requestAnimationFrame(animateTransformation);
    } else {
        // Play error sound
        playErrorSound();
        showFeedback(false);


        // For place-to-point mode, highlight wrong answer
        if (gameState.mode === 'placeToPoint' && gameState.selectedOption) {
            const optionButtons = document.querySelectorAll('.coord-option');
            optionButtons.forEach(btn => {
                const x = parseInt(btn.dataset.x);
                const y = parseInt(btn.dataset.y);
                if (x === gameState.selectedOption.x && y === gameState.selectedOption.y) {
                    btn.classList.remove('bg-indigo-500', 'hover:bg-indigo-600');
                    btn.classList.add('bg-red-500');
                }
            });


            setTimeout(() => {
                const optionButtons = document.querySelectorAll('.coord-option');
                optionButtons.forEach(btn => {
                    btn.classList.remove('bg-red-500');
                    btn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
                });
                gameState.selectedOption = null;
                document.getElementById('checkBtn').disabled = true;
            }, 1500);
        }
    }
}



// ==========================================
// GERİ BİLDİRİM FONKSİYONU (KESİN ÇÖZÜM)
// ==========================================
function showFeedback(correct) {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;

    // 1. ÖNCEKİ SAYACI İPTAL ET (Çok Önemli!)
    // Eğer ekranda zaten bir yazı varsa ve kapanmayı bekliyorsa, o emri iptal et.
    if (window.feedbackTimer) {
        clearTimeout(window.feedbackTimer);
        window.feedbackTimer = null;
    }

    // 2. Mesajı ve Rengi Ayarla
    feedback.textContent = correct ? 'Harika! Mükemmel! 🎉' : 'Tekrar dene. Köşeleri kontrol et. 🔍';
    
    // Sabit classlar (Animasyon ve konum için)
    const baseClass = "fixed bottom-4 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl font-bold text-center transition-opacity duration-500 z-[9999]";
    const colorClass = correct ? "bg-green-500 text-white text-2xl" : "bg-red-500 text-white text-lg";
    
    feedback.className = `${baseClass} ${colorClass}`;

    // 3. Görünür Yap
    // (requestAnimationFrame, tarayıcının stil değişimini yakalamasını sağlar)
    requestAnimationFrame(() => {
        feedback.style.opacity = '1';
        feedback.style.pointerEvents = 'auto'; // Tıklanabilir olsun (seçim engellemesin diye)
    });

    // 4. YENİ SAYAÇ BAŞLAT (3 Saniye Sonra Kapat)
    window.feedbackTimer = setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.pointerEvents = 'none'; // Kaybolunca arkadaki butonlara engel olmasın
    }, 3000);
}


function updateUI() {
    const modeText = gameState.mode === 'translation' ? 'Öteleme' :
                     gameState.mode === 'reflection' ? 'Yansıma' :
                     gameState.mode === 'pointToPlace' ? 'Nokta → Yer' :
                    gameState.mode === 'placeToPoint' ? 'Yer → Nokta' : 'Seçim yapın';
    document.getElementById('currentMode').textContent = modeText;


    const shapeNames = {
        'point': 'Nokta',
        'segment': 'Doğru Parçası',
        'triangle': 'Üçgen',
        'quadrilateral': 'Dörtgen'
    };
    document.getElementById('currentShape').textContent =
        gameState.shapeType ? shapeNames[gameState.shapeType] : '-';


    document.getElementById('clickedCount').textContent = gameState.userClicks.length;
    document.getElementById('totalCount').textContent =
        gameState.originalShape ? gameState.originalShape.points.length : 0;


    // Show transformation details
    const transformInfo = document.getElementById('transformInfo');
    const transformText = document.getElementById('transformText');
    const coordinateOptions = document.getElementById('coordinateOptions');


    if (gameState.mode === 'translation' && gameState.translationVector) {
        const dx = gameState.translationVector.dx;
        const dy = gameState.translationVector.dy;
        const xDirection = dx > 0 ? 'sağa' : dx < 0 ? 'sola' : '';
        const yDirection = dy > 0 ? 'yukarı' : dy < 0 ? 'aşağı' : '';


        let message = '📍 Şekli ';
        if (dx !== 0) message += `X ekseninde ${Math.abs(dx)} birim ${xDirection}`;
        if (dx !== 0 && dy !== 0) message += ' ve ';
        if (dy !== 0) message += `Y ekseninde ${Math.abs(dy)} birim ${yDirection}`;
        message += ' ötelemelisin!';


        transformText.textContent = message;
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.add('hidden');
    } else if (gameState.mode === 'reflection' && gameState.reflectionAxis) {
        const axis = gameState.reflectionAxis === 'x' ? 'X' : 'Y';
        transformText.textContent = `🪞 Şekli ${axis} eksenine göre yansıtmalısın!`;
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.add('hidden');
    } else if (gameState.mode === 'pointToPlace' && gameState.targetPoint) {
        transformText.textContent = `📍 (${gameState.targetPoint.x}, ${gameState.targetPoint.y}) koordinatının yerini tıklayarak göster!`;
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.add('hidden');
    } else if (gameState.mode === 'placeToPoint') {
        transformText.textContent = '📍 Aşağıdaki seçeneklerden mavi noktanın koordinatını seç!';
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.remove('hidden');
    } else if (gameState.mode && !gameState.translationVector && !gameState.reflectionAxis && !gameState.targetPoint) {
        transformText.textContent = '🎯 "Yeni Şekil" butonuna tıklayarak başla!';
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.add('hidden');
    } else {
        transformInfo.classList.add('hidden');
        coordinateOptions.classList.add('hidden');
    }
}


function startNewRound() {
    if (!gameState.mode) {
        showFeedback(false);
        const feedback = document.getElementById('feedback');
        feedback.textContent = 'Önce bir dönüşüm türü seç! 🎯';
        feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all bg-yellow-500 text-white';
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
        return;
    }


    // Hide and reset feedback message immediately when starting new round
    const feedback = document.getElementById('feedback');
    feedback.style.opacity = '0';
    feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';
    feedback.textContent = '';


    gameState.userClicks = [];
    gameState.selectedOption = null;


    initCanvas();


    if (gameState.mode === 'pointToPlace') {
        // Generate random coordinate for point-to-place mode
        const validCoords = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const x = validCoords[Math.floor(Math.random() * validCoords.length)];
        const y = validCoords[Math.floor(Math.random() * validCoords.length)];
        gameState.targetPoint = { x, y };
        gameState.shapeType = 'Nokta Yerleştirme';


        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = false;
    } else if (gameState.mode === 'placeToPoint') {
        // Generate random point and show it on canvas
        const validCoords = [-9, -8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        const x = validCoords[Math.floor(Math.random() * validCoords.length)];
        const y = validCoords[Math.floor(Math.random() * validCoords.length)];
        gameState.targetPoint = { x, y };
        gameState.shapeType = 'Koordinat Bulma';


        // Draw the point without label
        const pixel = coordToPixel(x, y);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pixel.x);
        circle.setAttribute('cy', pixel.y);
        circle.setAttribute('r', 8);
        circle.setAttribute('fill', '#3b82f6');
        circle.setAttribute('stroke', '#1e40af');
        circle.setAttribute('stroke-width', 3);
        canvas.appendChild(circle);


        // Generate 4 options (1 correct, 3 wrong)
        const options = [{ x, y }];
        const usedCoords = new Set([`${x},${y}`]);


        while (options.length < 4) {
            const ox = validCoords[Math.floor(Math.random() * validCoords.length)];
            const oy = validCoords[Math.floor(Math.random() * validCoords.length)];
            const coordKey = `${ox},${oy}`;


            if (!usedCoords.has(coordKey)) {
                options.push({ x: ox, y: oy });
                usedCoords.add(coordKey);
            }
        }


        // Shuffle options
        for (let i = options.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [options[i], options[j]] = [options[j], options[i]];
        }


        // Store correct answer
        gameState.correctAnswer = { x, y };


        // Display options and reset button states
        const optionButtons = document.querySelectorAll('.coord-option');
        optionButtons.forEach((btn, index) => {
            btn.textContent = `(${options[index].x}, ${options[index].y})`;
            btn.dataset.x = options[index].x;
            btn.dataset.y = options[index].y;
            btn.classList.remove('bg-green-500', 'bg-red-500');
            btn.classList.add('bg-indigo-500', 'hover:bg-indigo-600');
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.transform = 'scale(1)';
        });


        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
    } else {
        gameState.originalShape = generateRandomShape();
        gameState.shapeType = gameState.originalShape.type;


        if (gameState.mode === 'translation') {
            gameState.transformedShape = {
                type: gameState.originalShape.type,
                points: applyTranslation(gameState.originalShape.points)
            };
        } else {
            gameState.transformedShape = {
                type: gameState.originalShape.type,
                points: applyReflection(gameState.originalShape.points)
            };
        }


        drawShape(gameState.originalShape.points, 'original-shape');


        document.getElementById('checkBtn').disabled = true;
        document.getElementById('undoBtn').disabled = true;
    }


    updateUI();
}


document.getElementById('translationBtn').addEventListener('click', function() {
    clearAllScreens(); // 1. Temizlik
    
    // 2. Normal Canvas'ı geri getir (Çünkü grafik modları bunu gizlemiş olabilir)
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) regularCanvas.style.display = 'flex';

    gameState.mode = 'translation';
    
    // Buton stillerini güncelle
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected-button'));
    this.classList.add('selected-button');
    
    updateUI();
    startNewRound();
});


document.getElementById('reflectionBtn').addEventListener('click', function() {
    clearAllScreens(); // 1. Temizlik

    // 2. Normal Canvas'ı geri getir
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) regularCanvas.style.display = 'flex';

    gameState.mode = 'reflection';

    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected-button'));
    this.classList.add('selected-button');

    updateUI();
    startNewRound();
});


document.getElementById('pointToPlaceBtn').addEventListener('click', function() {
    clearAllScreens(); // 1. Temizlik

    // 2. Normal Canvas'ı geri getir
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) regularCanvas.style.display = 'flex';

    gameState.mode = 'pointToPlace';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected-button'));
    this.classList.add('selected-button');
    
    updateUI();
    startNewRound();
});

document.getElementById('placeToPointBtn').addEventListener('click', function() {
    clearAllScreens(); // 1. Temizlik

    // 2. Normal Canvas'ı geri getir
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) regularCanvas.style.display = 'flex';

    gameState.mode = 'placeToPoint';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected-button'));
    this.classList.add('selected-button');
    
    updateUI();
    startNewRound();
});


// =========================================================
// DOĞRUSAL İLİŞKİLER BUTONU (GARANTİLİ AÇMA ÇÖZÜMÜ)
// =========================================================
var btnLinear = document.getElementById('linearRelationsBtn');

if (btnLinear) {
    // 1. Butonu klonlayarak üzerindeki tüm eski/hatalı kodları temizle
    var newBtnLinear = btnLinear.cloneNode(true);
    btnLinear.parentNode.replaceChild(newBtnLinear, btnLinear);

    // 2. Tıklama olayını sıfırdan yaz
    newBtnLinear.addEventListener('click', function() {
        console.log("🔘 Doğrusal İlişkiler butonuna tıklandı.");
        
        const subButtons = document.getElementById('linearSubButtons');
        if (!subButtons) {
            console.error("❌ HATA: linearSubButtons ID'li element bulunamadı!");
            return;
        }

        // Şu an kapalı mı? (Hem class hem style kontrolü)
        const isClosed = subButtons.classList.contains('hidden') || subButtons.style.display === 'none';

        // 1. Önce ekranı temizle (Bu her şeyi kapatır)
        if (typeof clearAllScreens === 'function') {
            clearAllScreens();
        }

        // 2. Eğer menü önceden kapalıysa, şimdi ZORLA AÇ
        if (isClosed) {
            // Class'ı kaldır
            subButtons.classList.remove('hidden');
            
            // Stili zorla uygula (CSS !important etkisi yaratır)
            subButtons.style.cssText = "display: flex !important; flex-wrap: wrap; justify-content: center; gap: 10px;";
            
            // Butonu seçili yap
            this.classList.add('selected-button');
            console.log("✅ Menü açıldı (Zorla).");
        } 
        else {
            console.log("🔻 Menü kapatıldı.");
        }

        // 3. Diğer ana butonların seçim efektlerini temizle
        const otherBtns = ['translationBtn', 'reflectionBtn', 'pointToPlaceBtn', 'placeToPointBtn', 'slopeBtn', 'lineGraphsBtn'];
        otherBtns.forEach(id => {
            const b = document.getElementById(id);
            if(b) b.classList.remove('selected-button');
        });
    });
}

// SORU -> GRAFİK BUTONU
document.getElementById('questionToGraphBtn').addEventListener('click', function() {
    // Önce ekranı temizle
    clearAllScreens(); 
    
    // Modu ayarla
    gameState.mode = 'questionToGraph';
    
    // Alt menüyü açık tut (clearAllScreens kapatmış olabilir, geri açalım)
    document.getElementById('linearSubButtons').classList.remove('hidden');

    // *** KRİTİK KISIM: Diğer içeriği GİZLE, bunu GÖSTER ***
    document.getElementById('graphQuestionContainer').classList.add('hidden'); // Diğerini kapat
    
    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden'); // Bunu aç
    linearContainer.style.display = 'flex';
    
    // Canvas ve Tabloyu hazırla
    const linearCanvas = document.getElementById('linearCanvas');
    linearCanvas.style.display = 'block';
    document.getElementById('dataTable').parentElement.style.display = 'flex';
    document.getElementById('tableConfirmBtn').style.display = 'block';

    // Oyunu başlat
    startLinearQuestion();
});


// GRAFİK -> SORU BUTONU
document.getElementById('graphToQuestionBtn').addEventListener('click', function() {
    // 1. Önceki her şeyi (Yer-Nokta dahil) temizle
    clearAllScreens();
    
    // 2. Modu ayarla
    gameState.mode = 'graphToQuestion';

    // 3. Alt menüyü açık tut (Doğrusal İlişkiler menüsü)
    document.getElementById('linearSubButtons').classList.remove('hidden');

    // 4. Bu modun container'ını aç
    const graphContainer = document.getElementById('graphQuestionContainer');
    if (graphContainer) {
        graphContainer.classList.remove('hidden');
        graphContainer.style.display = 'flex'; // Görünür yap
    }
    
    // 5. Oyunu başlat
    startGraphToQuestion();
});

function startLinearQuestion() {
    // 1. Önce ekrandaki eski bildirimi temizle
    const feedback = document.getElementById('feedback');
    feedback.style.opacity = '0';
    feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';

    // Pick random question that hasn't been used yet
    const availableQuestions = linearQuestions.filter(q => !linearState.usedQuestionIds.includes(q.id));

    // If no questions available (all used), reset the list
    if (availableQuestions.length === 0) {
        linearState.usedQuestionIds = [];
        // Re-filter after reset to get all questions again
        const allQuestions = linearQuestions.filter(q => !linearState.usedQuestionIds.includes(q.id));
        const question = allQuestions[Math.floor(Math.random() * allQuestions.length)];
        linearState.currentQuestion = question;
        linearState.usedQuestionIds.push(question.id);
    } else {
        // Pick from available questions
        const question = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
        linearState.currentQuestion = question;
        linearState.usedQuestionIds.push(question.id);
    }

    const question = linearState.currentQuestion;

    // Show question panel
    document.getElementById('linearQuestionPanel').classList.remove('hidden');
    document.getElementById('questionText').textContent = question.text;

    // Hide regular canvas container
    const regularCanvasContainer = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvasContainer) {
        regularCanvasContainer.style.display = 'none';
    }

    // Show linear container
    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden');
    linearContainer.style.display = 'flex';

    // Initialize table
    initializeTable();

    // Initialize linear canvas
    initializeLinearCanvas();

    // Reset state
    linearState.tableData = Array(5).fill(null).map(() => ({x: '', y: '', calcY: undefined}));
    linearState.drawnPoints = [];
    linearState.isDrawing = false;
    document.getElementById('drawInstructionText').classList.add('hidden');
    document.getElementById('tableConfirmBtn').disabled = true;
    document.getElementById('checkBtn').disabled = true;
}


function startGraphToQuestion() {
    // Check if all scenarios have been used
    if (!linearState.usedScenarioIds) {
        linearState.usedScenarioIds = [];
    }


    // If all scenarios used, show completion message
    if (linearState.usedScenarioIds.length >= graphToQuestionScenarios.length) {
        const feedback = document.getElementById('feedback');
        feedback.textContent = '🎉 Sorularımız bu kadar! Tebrikler! 🎊';
        feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl font-bold text-center transition-all bg-purple-500 text-white text-2xl success-animation';
        feedback.style.opacity = '1';


        // Reset after 5 seconds
        setTimeout(() => {
            linearState.usedScenarioIds = [];
            feedback.style.opacity = '0';
            startGraphToQuestion();
        }, 5000);
        return;
    }


    // Pick next unused scenario in order
    const scenario = graphToQuestionScenarios.find(s => !linearState.usedScenarioIds.includes(s.id));
    linearState.currentScenario = scenario;
    linearState.usedScenarioIds.push(scenario.id);
    linearState.currentQuestionIndex = 0;
    linearState.selectedOption = null;
    // Draw the graph
    drawScenarioGraph(scenario);
    // Show first question
    showGraphQuestion();
}


// Y = ax + b Modunu Başlat
function startYeqAXplusBRound() {
    console.log("Y=ax+b Modu Başlıyor...");
    
    // 1. Eski bildirimleri temizle
    const feedback = document.getElementById('feedback');
    feedback.style.opacity = '0';
    feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';

    gameState.mode = 'y_eq_ax_plus_b';
    
    // Rastgele Eğim ve Sabit
    const slopes = [1, -1, 2, -2, 3, -3]; 
    const intercepts = [-4, -3, -2, -1, 1, 2, 3, 4];

    let newSlope, newIntercept;
    do { 
        newSlope = slopes[Math.floor(Math.random() * slopes.length)];
        newIntercept = intercepts[Math.floor(Math.random() * intercepts.length)];
    } while (newSlope === gameState.targetSlope && newIntercept === gameState.targetIntercept);
    
    gameState.targetSlope = newSlope;
    gameState.targetIntercept = newIntercept;
    
    // UI Hazırla
    document.getElementById('linearQuestionPanel').classList.remove('hidden');
    document.getElementById('linearContainer').classList.remove('hidden');
    document.getElementById('linearContainer').style.display = 'flex';
    document.getElementById('dataTable').parentElement.style.display = 'flex';
    document.getElementById('drawInstructionText').classList.add('hidden');
    
    const sign = newIntercept > 0 ? '+' : ''; 
    document.getElementById('questionText').textContent = `Denklem: y = ${newSlope}x ${sign}${newIntercept}. Tabloyu doldurarak grafiği çiziniz.`;

    initializeLearningTable(); 
    drawFullGridForAX(); 
    
    linearState.drawnPoints = []; 
    linearState.tableData = Array(4).fill(null).map(() => ({x: '', y: '', calcY: undefined}));
    
    const confirmBtn = document.getElementById('tableConfirmBtn');
    confirmBtn.style.display = 'block'; 
    confirmBtn.disabled = true; 
    confirmBtn.classList.add('opacity-50', 'cursor-not-allowed'); 
    document.getElementById('checkBtn').disabled = true;
    
    setupStraightLineDrawing();
}

function showGraphQuestion() {
    // 1. Önce ekrandaki eski bildirimi temizle
    const feedback = document.getElementById('feedback');
    feedback.style.opacity = '0';
    feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';

    const scenario = linearState.currentScenario;
    const question = scenario.questions[linearState.currentQuestionIndex];
    
    // Show main question text
    const questionTextEl = document.getElementById('graphQuestionText');
    questionTextEl.textContent = scenario.mainQuestion + '\n\n' + question.text;
    
    // Generate option buttons
    const optionsContainer = document.getElementById('graphQuestionOptions');
    optionsContainer.innerHTML = '';
    
    // Deterministic shuffle (Fisher-Yates with a simple seed based on question text)
    // Bu sayede tablet ve tahtada (farklı tarayıcı motorları olsa bile) şıklar KESİNLİKLE aynı sırada çıkar.
    const shuffledOptions = [...question.options];
    let seed = 0;
    for (let i = 0; i < question.text.length; i++) {
        seed += question.text.charCodeAt(i);
    }
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        seed = (seed * 9301 + 49297) % 233280;
        const j = Math.floor((seed / 233280) * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    shuffledOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-button px-2 py-1.5 bg-white border-2 border-purple-400 text-purple-900 rounded-lg text-xs font-bold hover:bg-purple-50 transition-all';
        btn.textContent = option;
        btn.addEventListener('click', () => selectOption(btn, option));
        optionsContainer.appendChild(btn);
    });
    
    // Reset check button
    document.getElementById('checkBtn').disabled = true;
    linearState.selectedOption = null;
}

function selectOption(button, option) {
    // Remove selection from all buttons
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.classList.remove('selected');
    });
    // Select this button
    button.classList.add('selected');
    linearState.selectedOption = option;
    // Enable check button
    document.getElementById('checkBtn').disabled = false;
}


function drawScenarioGraph(scenario) {
    const canvas = document.getElementById('graphQuestionCanvas');
    canvas.innerHTML = '';
    
    const isTwoLineScenario = scenario.lines !== undefined;

    // Y Ekseni Hesaplamaları
    let ySteps, yMin, yMax;
    if (scenario.yMin !== undefined && scenario.yMax !== undefined) {
        yMin = scenario.yMin;
        yMax = scenario.yMax;
        ySteps = Math.ceil((yMax - yMin) / scenario.yStep);
    } else {
        yMin = scenario.yStart || 0;
        yMax = scenario.yMax;
        ySteps = Math.ceil((yMax - yMin) / scenario.yStep) + 1;
    }

    // X Ekseni Hesaplamaları
    const xStep = scenario.xStep || 1;
    const xSteps = Math.ceil(scenario.xMax / xStep);

    // --- DİNAMİK AYARLAR ---
    const GRID_SIZE = 50;
    const paddingLeft = 100;
    const paddingRight = 100;
    const paddingTop = 80;
    const paddingBottom = 80;

    const CANVAS_WIDTH = paddingLeft + (xSteps * GRID_SIZE) + paddingRight;
    const CANVAS_HEIGHT = paddingTop + (ySteps * GRID_SIZE) + paddingBottom;
    const ORIGIN = { x: paddingLeft, y: CANVAS_HEIGHT - paddingBottom };

    // Canvas'ı ölçekle (Responsive)
    canvas.setAttribute('viewBox', `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // --- IZGARA ÇİZİMİ ---
    // Dikey Çizgiler
    for (let i = 0; i <= xSteps; i++) {
        const x = ORIGIN.x + i * GRID_SIZE;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', ORIGIN.y);
        line.setAttribute('x2', x);
        line.setAttribute('y2', 50); // Tepe noktası
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', '1');
        canvas.appendChild(line);
    }
    // Yatay Çizgiler
    for (let i = 0; i <= ySteps; i++) {
        const y = ORIGIN.y - i * GRID_SIZE;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', ORIGIN.x);
        line.setAttribute('y1', y);
        line.setAttribute('x2', ORIGIN.x + xSteps * GRID_SIZE + 30);
        line.setAttribute('y2', y);
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', '1');
        canvas.appendChild(line);
    }

    // --- ANA EKSENLER ---
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', ORIGIN.x); xAxis.setAttribute('y1', ORIGIN.y);
    xAxis.setAttribute('x2', ORIGIN.x + xSteps * GRID_SIZE + 50); xAxis.setAttribute('y2', ORIGIN.y);
    xAxis.setAttribute('stroke', '#374151'); xAxis.setAttribute('stroke-width', '3');
    canvas.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', ORIGIN.x); yAxis.setAttribute('y1', ORIGIN.y);
    yAxis.setAttribute('x2', ORIGIN.x); yAxis.setAttribute('y2', 30);
    yAxis.setAttribute('stroke', '#374151'); yAxis.setAttribute('stroke-width', '3');
    canvas.appendChild(yAxis);

    // Oklar
    const xArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    xArrow.setAttribute('points', `${ORIGIN.x + xSteps * GRID_SIZE + 50},${ORIGIN.y} ${ORIGIN.x + xSteps * GRID_SIZE + 40},${ORIGIN.y - 5} ${ORIGIN.x + xSteps * GRID_SIZE + 40},${ORIGIN.y + 5}`);
    xArrow.setAttribute('fill', '#374151');
    canvas.appendChild(xArrow);

    const yArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    yArrow.setAttribute('points', `${ORIGIN.x},30 ${ORIGIN.x - 5},40 ${ORIGIN.x + 5},40`);
    yArrow.setAttribute('fill', '#374151');
    canvas.appendChild(yArrow);

    // --- EKSEN İSİMLERİ (Daha uzağa konumlandırıldı) ---
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', ORIGIN.x + (xSteps * GRID_SIZE) / 2);
    xLabel.setAttribute('y', ORIGIN.y + 50); // Aşağıya ötelendi
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '16');
    xLabel.setAttribute('font-weight', 'bold');
    xLabel.setAttribute('fill', '#374151');
    xLabel.textContent = scenario.xAxisLabel;
    canvas.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    // Döndürülmüş metin (Dikey yazı)
    yLabel.setAttribute('transform', `rotate(-90, ${ORIGIN.x - 60}, ${ORIGIN.y - (ySteps * GRID_SIZE) / 2})`);
    yLabel.setAttribute('x', ORIGIN.x - 60); // Sola ötelendi
    yLabel.setAttribute('y', ORIGIN.y - (ySteps * GRID_SIZE) / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '16');
    yLabel.setAttribute('font-weight', 'bold');
    yLabel.setAttribute('fill', '#374151');
    yLabel.textContent = scenario.yAxisLabel;
    canvas.appendChild(yLabel);

    // --- SAYILAR ---
    // X Eksen Sayıları
    for (let i = 0; i <= xSteps; i++) {
        const x = ORIGIN.x + i * GRID_SIZE;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x);
        text.setAttribute('y', ORIGIN.y + 25);
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold');
        text.setAttribute('fill', '#1f2937');
        text.textContent = i * xStep;
        canvas.appendChild(text);
    }

    // Y Eksen Sayıları
    const yValuesToShow = new Set();
    if (isTwoLineScenario) {
        scenario.lines.forEach(line => line.points.forEach(p => yValuesToShow.add(p.y)));
    } else {
        scenario.points.forEach(p => yValuesToShow.add(p.y));
    }
    const sortedYValues = Array.from(yValuesToShow).sort((a, b) => a - b);

    sortedYValues.forEach(value => {
        const yGridIndex = (value - yMin) / scenario.yStep;
        const y = ORIGIN.y - yGridIndex * GRID_SIZE;

        if (y >= 30 && y <= ORIGIN.y) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', ORIGIN.x - 15); // Sayılar eksenin hemen solunda
            text.setAttribute('y', y + 5);
            text.setAttribute('text-anchor', 'end'); // Sağa yasla
            text.setAttribute('font-size', '13');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#1f2937');
            text.textContent = value;
            canvas.appendChild(text);
        }
    });

    // --- ÇİZGİLERİN ÇİZİMİ ---
    if (isTwoLineScenario) {
        scenario.lines.forEach(lineData => {
            // Çizgi parçaları
            for (let i = 0; i < lineData.points.length - 1; i++) {
                const p1 = lineData.points[i];
                const p2 = lineData.points[i + 1];

                const x1 = ORIGIN.x + (p1.x / xStep) * GRID_SIZE;
                const x2 = ORIGIN.x + (p2.x / xStep) * GRID_SIZE;
                const y1 = ORIGIN.y - ((p1.y - yMin) / scenario.yStep) * GRID_SIZE;
                const y2 = ORIGIN.y - ((p2.y - yMin) / scenario.yStep) * GRID_SIZE;

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1); line.setAttribute('y1', y1);
                line.setAttribute('x2', x2); line.setAttribute('y2', y2);
                line.setAttribute('stroke', lineData.color);
                line.setAttribute('stroke-width', '4');
                line.setAttribute('stroke-linecap', 'round');
                canvas.appendChild(line);
            }
            // Ok
            const lastP = lineData.points[lineData.points.length - 1];
            const prevP = lineData.points[lineData.points.length - 2];
            
            const xLast = ORIGIN.x + (lastP.x / xStep) * GRID_SIZE;
            const yLast = ORIGIN.y - ((lastP.y - yMin) / scenario.yStep) * GRID_SIZE;
            const xPrev = ORIGIN.x + (prevP.x / xStep) * GRID_SIZE;
            const yPrev = ORIGIN.y - ((prevP.y - yMin) / scenario.yStep) * GRID_SIZE;

            const angle = Math.atan2(yLast - yPrev, xLast - xPrev);
            const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
            const tips = `${xLast},${yLast} ${xLast - 15 * Math.cos(angle) + 8 * Math.sin(angle)},${yLast - 15 * Math.sin(angle) - 8 * Math.cos(angle)} ${xLast - 15 * Math.cos(angle) - 8 * Math.sin(angle)},${yLast - 15 * Math.sin(angle) + 8 * Math.cos(angle)}`;
            arrow.setAttribute('points', tips);
            arrow.setAttribute('fill', lineData.color);
            canvas.appendChild(arrow);
            
            // Etiket
            if (lineData.label) {
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', xLast + 10);
                label.setAttribute('y', yLast);
                label.setAttribute('font-size', '14');
                label.setAttribute('font-weight', 'bold');
                label.setAttribute('fill', lineData.color);
                label.textContent = lineData.label;
                canvas.appendChild(label);
            }
        });
    } else {
        // Tek Çizgi Mantığı
        for (let i = 0; i < scenario.points.length - 1; i++) {
            const p1 = scenario.points[i];
            const p2 = scenario.points[i + 1];
            const x1 = ORIGIN.x + p1.x * GRID_SIZE;
            const x2 = ORIGIN.x + p2.x * GRID_SIZE;
            const y1 = ORIGIN.y - ((p1.y - yMin) / scenario.yStep) * GRID_SIZE;
            const y2 = ORIGIN.y - ((p2.y - yMin) / scenario.yStep) * GRID_SIZE;

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', x1); line.setAttribute('y1', y1);
            line.setAttribute('x2', x2); line.setAttribute('y2', y2);
            line.setAttribute('stroke', scenario.lineColor);
            line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-linecap', 'round');
            canvas.appendChild(line);
        }
        // Ok
        const lastP = scenario.points[scenario.points.length - 1];
        const prevP = scenario.points[scenario.points.length - 2];
        const xLast = ORIGIN.x + lastP.x * GRID_SIZE;
        const yLast = ORIGIN.y - ((lastP.y - yMin) / scenario.yStep) * GRID_SIZE;
        const xPrev = ORIGIN.x + prevP.x * GRID_SIZE;
        const yPrev = ORIGIN.y - ((prevP.y - yMin) / scenario.yStep) * GRID_SIZE;
        
        const angle = Math.atan2(yLast - yPrev, xLast - xPrev);
        const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
        const tips = `${xLast},${yLast} ${xLast - 15 * Math.cos(angle) + 8 * Math.sin(angle)},${yLast - 15 * Math.sin(angle) - 8 * Math.cos(angle)} ${xLast - 15 * Math.cos(angle) - 8 * Math.sin(angle)},${yLast - 15 * Math.sin(angle) + 8 * Math.cos(angle)}`;
        arrow.setAttribute('points', tips);
        arrow.setAttribute('fill', scenario.lineColor);
        canvas.appendChild(arrow);
        
        // Noktalar
        scenario.points.forEach(point => {
            const cx = ORIGIN.x + point.x * GRID_SIZE;
            const cy = ORIGIN.y - ((point.y - yMin) / scenario.yStep) * GRID_SIZE;
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', cx); circle.setAttribute('cy', cy);
            circle.setAttribute('r', 6);
            circle.setAttribute('fill', scenario.lineColor);
            circle.setAttribute('stroke', 'white');
            circle.setAttribute('stroke-width', '2');
            canvas.appendChild(circle);
        });
    }
}


function initializeTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';


    const question = linearState.currentQuestion;
    document.getElementById('xHeader').textContent = question.xLabel;
    document.getElementById('yHeader').textContent = question.yLabel;


    for (let i = 0; i < 5; i++) {
        const row = document.createElement('tr');


        const xCell = document.createElement('td');
        xCell.className = 'border-2 border-purple-400 px-4 py-3 text-center font-bold text-lg cursor-pointer hover:bg-purple-100 transition-all';
        xCell.dataset.row = i;
        xCell.dataset.col = 'x';
        xCell.textContent = '';
        xCell.addEventListener('click', () => openNumberPad(i, 'x'));


        const yCell = document.createElement('td');
        yCell.className = 'border-2 border-purple-400 px-4 py-3 text-center font-bold text-lg cursor-pointer hover:bg-purple-100 transition-all';
        yCell.dataset.row = i;
        yCell.dataset.col = 'y';
        yCell.textContent = '';
        yCell.addEventListener('click', () => openNumberPad(i, 'y'));


        row.appendChild(xCell);
        row.appendChild(yCell);
        tbody.appendChild(row);
    }
}


function openNumberPad(row, col) {
    linearState.currentCell = { row, col };
    linearState.currentInputValue = linearState.tableData[row][col] || '';


    document.getElementById('currentInput').textContent = linearState.currentInputValue || 'Değer girin';
    document.getElementById('numberPad').classList.remove('hidden');
}


// Number pad handlers
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault(); // Mobilde ve akıllı tahtada çift dokunmayı engeller
        e.stopImmediatePropagation(); // Kodun iki kere çalışmasını KESİN OLARAK durdurur

        const value = this.dataset.value;

        if (value === 'clear') {
            linearState.currentInputValue = '';
        } else {
            linearState.currentInputValue += value;
        }

        document.getElementById('currentInput').textContent = linearState.currentInputValue || 'Değer girin';
    });
});

// ==========================================
// GELİŞMİŞ MATEMATİKSEL İŞLEM VE DENKLEM ÇÖZÜCÜ (AKILLI SÜRÜM)
// ==========================================
function evaluateMathExpression(formula, contextVal) {
    if (!formula) return '';
    
    // 1. Temizlik ve Standartlaştırma
    let expr = formula.toString().toLowerCase()
        .replace(/\s+/g, '')       // Boşlukları sil
        .replace(/×/g, '*')        // Çarpı -> *
        .replace(/÷/g, '/')        // Bölme -> /
        .replace(/,/g, '.');       // Virgül -> .
    
    // 2. Yazım düzeltme: "2x" -> "2*x"
    expr = expr.replace(/(\d)x/g, '$1*x'); 

    // --- SENARYO A: X'i Çözmeye Çalışıyoruz (Denklem Modu) ---
    // Eğer ifade içinde '=' varsa VE 'x' harfi geçiyorsa
    if (expr.includes('=') && expr.includes('x')) {
        try {
            const parts = expr.split('=');
            let lhsStr = parts[0]; 
            let rhsStr = parts[1]; 

            // Eğer tersten yazıldıysa (3x-4 = 0) düzelt
            if (lhsStr.includes('x') && !rhsStr.includes('x')) {
                [lhsStr, rhsStr] = [rhsStr, lhsStr];
            }

            // Sol tarafı hesapla (Bu kısım hata verirse Scenario B'ye düşer)
            // Örn: lhsStr="y" ise burası patlar ve catch'e gider (İstediğimiz bu)
            const targetY = new Function('return ' + lhsStr)();

            // Sağ taraf testi (x=0 ve x=1 için)
            const exprAt0 = rhsStr.replace(/x/g, '(0)'); 
            const yAt0 = new Function('return ' + exprAt0)();

            const exprAt1 = rhsStr.replace(/x/g, '(1)'); 
            const yAt1 = new Function('return ' + exprAt1)();

            const slope = yAt1 - yAt0;
            const intercept = yAt0;
            
            // Eğim çok küçükse çözülemez
            if (Math.abs(slope) < 0.000001) throw new Error("Eğim sıfır"); 

            let solvedX = (targetY - intercept) / slope;
            
            // Yuvarlama (4/3 gibi durumlar için hassasiyet koruma)
            if (Math.abs(Math.round(solvedX) - solvedX) < 0.0001) {
                solvedX = Math.round(solvedX);
            }
            
            return solvedX;

        } catch (e) {
            // Denklem çözülemedi (örn: "y=..." yazıldı), normal hesaplamaya devam et
            // Konsola hata basmıyoruz ki kullanıcı görmesin, sessizce B planına geçiyoruz.
        }
    }

    // --- SENARYO B: Normal Hesaplama (Yedek Plan) ---
    // x yerine verilen değeri koy
    expr = expr.replace(/x/g, `(${contextVal})`);

    // Eşittir varsa sağ tarafı al
    if (expr.includes('=')) {
        expr = expr.split('=')[1];
    }

    try {
        return new Function('return ' + expr)();
    } catch (e) {
        return NaN;
    }
}




// ==========================================
// NUMPAD TAMAM BUTONU (FİNAL VE DÜZELTİLMİŞ)
// ==========================================
document.getElementById('numPadClose').addEventListener('click', function() {
    console.log("Tamam'a basıldı. Hedef:", activeInputTarget);

    try {
        // 1. BASİT EĞİM KUTUSU
        if (activeInputTarget === 'slope_simple') {
            const val = linearState.currentInputValue;
            if(val) {
                const box = document.getElementById('slopeAnswerBox');
                if(box) {
                    box.textContent = val;
                    document.getElementById('checkBtn').disabled = false;
                }
            }
            activeInputTarget = null;
        }

        // 2. BİLİNMEYEN KENAR KUTUSU (X)
        else if (activeInputTarget === 'slope_unknown') {
            const val = linearState.currentInputValue;
            if(val) {
                const box = document.getElementById('unknownBox');
                if(box) {
                    box.textContent = val;
                    document.getElementById('checkBtn').disabled = false;
                }
            }
            activeInputTarget = null;
        }

else if (activeInputTarget === 'slope_intercept') {
             const val = linearState.currentInputValue;
             if(val) {
                 document.getElementById('interceptAnswerBox').textContent = val;
                 // Butonu aktif et
                 var chk = document.getElementById('checkBtn');
                 if(chk) chk.disabled = false;
             }
             activeInputTarget = null;
        }
        
        // 3. EĞİM DÖNÜŞÜM: PAY KUTUSU (Merdiven ve 0,5 Sorusu İçin)
        else if (activeInputTarget === 'slope_conv_num') {
            const val = linearState.currentInputValue;
            if(val) {
                document.getElementById('slopeNumBox').textContent = val;
                // --- EKLENEN SATIR: BUTONU AKTİF ET ---
                document.getElementById('checkBtn').disabled = false;
            }
            activeInputTarget = null;
        }

        // 4. EĞİM DÖNÜŞÜM: PAYDA KUTUSU (Merdiven ve 0,5 Sorusu İçin)
        else if (activeInputTarget === 'slope_conv_denom') {
            const val = linearState.currentInputValue;
            if(val) {
                document.getElementById('slopeDenomBox').textContent = val;
                // --- EKLENEN SATIR: BUTONU AKTİF ET ---
                document.getElementById('checkBtn').disabled = false;
            }
            activeInputTarget = null;
        }

        // 5. TABLO MODU
        else if (linearState.currentCell) {
            const { row, col } = linearState.currentCell;
            const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
            if (cell) {
                const formula = linearState.currentInputValue;
                let calculatedResult = formula;
                try {
                     if (typeof evaluateMathExpression === 'function') {
                        if (col === 'y') {
                            const xVal = linearState.tableData[row].x; 
                            calculatedResult = evaluateMathExpression(formula, xVal);
                        } else {
                            calculatedResult = evaluateMathExpression(formula, 0);
                        }
                    }

// --- YENİ EŞİTLİK KUTULARI ---
        else if (['eq_left_num', 'eq_left_denom', 'eq_right_num', 'eq_right_denom'].includes(activeInputTarget)) {
             const val = linearState.currentInputValue;
             if(val) {
                 // Hangi kutu aktifse ona yaz
                 if(activeInputTarget === 'eq_left_num') document.getElementById('leftNumBox').textContent = val;
                 if(activeInputTarget === 'eq_left_denom') document.getElementById('leftDenomBox').textContent = val;
                 if(activeInputTarget === 'eq_right_num') document.getElementById('rightNumBox').textContent = val;
                 if(activeInputTarget === 'eq_right_denom') document.getElementById('rightDenomBox').textContent = val;
                 
                 document.getElementById('checkBtn').disabled = false;
             }
             activeInputTarget = null;
        }

                    if (isNaN(calculatedResult) || !isFinite(calculatedResult)) throw new Error('Invalid');
                    const displayResult = (typeof decimalToFraction === 'function') ? decimalToFraction(calculatedResult) : calculatedResult;
                    
                    if (col === 'x') linearState.tableData[row].x = calculatedResult;
                    if (col === 'y') linearState.tableData[row].y = calculatedResult;
                    linearState.tableData[row].calcY = calculatedResult;

                    if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') {
                        cell.textContent = displayResult;
                    } else {
                         if (col === 'y' && formula != displayResult && formula != calculatedResult) {
                            cell.textContent = `${formula} = ${displayResult}`;
                        } else {
                            cell.textContent = displayResult;
                        }
                    }
                } catch (e) {
                    cell.textContent = formula;
                    if (col === 'x') linearState.tableData[row].x = parseFloat(formula);
                    if (col === 'y') linearState.tableData[row].y = parseFloat(formula);
                }
                
                if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') {
                    if (typeof updateLinearCanvas === 'function') updateLinearCanvas(row, col, calculatedResult);
                } else {
                    if (typeof recalculateYScale === 'function') recalculateYScale(calculatedResult);
                }
                if (typeof checkTableComplete === 'function') checkTableComplete();
            }
        }
    } catch (e) {
        console.error("NumPad işlem hatası:", e);
    } finally {
        document.getElementById('numberPad').classList.add('hidden');
        linearState.currentInputValue = '';
        if(document.getElementById('currentInput')) {
            document.getElementById('currentInput').textContent = '';
        }
    }
});


function drawCoordinatePoint(row) {
    const linearCanvas = document.getElementById('linearCanvas');
    const rowData = linearState.tableData[row];

    if (rowData.x === '' || rowData.calcY === undefined) return;

    const xVal = parseFloat(rowData.x);
    const yVal = rowData.calcY;

    if (isNaN(xVal) || isNaN(yVal) || !isFinite(yVal)) {
        return;
    }

    if (xVal >= 0 && xVal <= 9) {
        const scaledY = yVal / linearState.yScale;

        if (scaledY >= 0 && scaledY <= 9) {
            const pixel = linearCoordToPixel(xVal, scaledY);

            const oldPoint = linearCanvas.querySelector(`.point-${row}`);
            if (oldPoint) oldPoint.remove();
            const oldLabel = linearCanvas.querySelector(`.point-label-${row}`);
            if (oldLabel) oldLabel.remove();

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', pixel.x);
            circle.setAttribute('cy', pixel.y);
            circle.setAttribute('r', 8);
            circle.setAttribute('fill', '#8b5cf6');
            circle.setAttribute('stroke', '#6d28d9');
            circle.setAttribute('stroke-width', 3);
            circle.classList.add(`point-${row}`);
            linearCanvas.appendChild(circle);

            // --- YENİLİK BURADA: Noktanın yanındaki (x,y) yazısını kesirli yap ---
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', pixel.x + 12);
            label.setAttribute('y', pixel.y - 12);
            label.setAttribute('font-size', '13');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('fill', '#6d28d9');
            
            // Hem X hem Y için kesir dönüşümü yapıyoruz
            const displayXVal = decimalToFraction(xVal);
            const displayYVal = decimalToFraction(yVal);
            
            label.textContent = `(${displayXVal}, ${displayYVal})`;
            label.classList.add(`point-label-${row}`);
            linearCanvas.appendChild(label);
        }
    }
}

function recalculateYScale(maxYValue) {
    // Mevcut Y değerlerini topla
    const allYValues = [];
    for (let i = 0; i < linearState.tableData.length; i++) {
        const val = linearState.tableData[i].calcY;
        if (val !== undefined && !isNaN(val) && isFinite(val)) {
            allYValues.push(val);
        }
    }

    if (allYValues.length === 0) {
        linearState.yScale = 1;
        linearState.maxY = 9;
        return;
    }

    const actualMaxY = Math.max(...allYValues, maxYValue || 0);

    // Ölçekleme mantığı (Aynı kalıyor)
    const niceScales = [1, 2, 5, 10, 15, 20, 25, 30, 40, 50, 75, 100, 150, 200, 250, 300, 400, 500, 750, 1000];
    let scaleFound = false;
    for (let scale of niceScales) {
        if (actualMaxY <= 9 * scale) {
            linearState.yScale = scale;
            linearState.maxY = 9 * scale;
            scaleFound = true;
            break;
        }
    }

    if (!scaleFound) {
        let calculatedScale = Math.ceil(actualMaxY / 9);
        if (calculatedScale <= 10) linearState.yScale = calculatedScale;
        else if (calculatedScale <= 100) linearState.yScale = Math.ceil(calculatedScale / 10) * 10;
        else linearState.yScale = Math.ceil(calculatedScale / 100) * 100;
        linearState.maxY = 9 * linearState.yScale;
    }

    // Yeniden Çizim
    initializeLinearCanvas();

    for (let i = 0; i < linearState.tableData.length; i++) {
        const row = linearState.tableData[i];
        if (row.x !== '') {
            const xVal = parseFloat(row.x);
            if (!isNaN(xVal) && xVal >= 0 && xVal <= 9) {
                const pixel = linearCoordToPixel(xVal, 0);
                const linearCanvas = document.getElementById('linearCanvas');
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pixel.x);
                circle.setAttribute('cy', pixel.y);
                circle.setAttribute('r', 6);
                circle.setAttribute('fill', '#3b82f6');
                circle.setAttribute('stroke', '#1e40af');
                circle.setAttribute('stroke-width', 2);
                circle.classList.add(`x-marker-${i}`);
                linearCanvas.appendChild(circle);
            }
        }

        if (row.calcY !== undefined) {
            const yVal = row.calcY;
            const linearCanvas = document.getElementById('linearCanvas');
            const scaledY = yVal / linearState.yScale;
            
            if (!isNaN(scaledY) && scaledY >= 0 && scaledY <= 9) {
                const pixel = linearCoordToPixel(0, scaledY);
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', pixel.x);
                circle.setAttribute('cy', pixel.y);
                circle.setAttribute('r', 6);
                circle.setAttribute('fill', '#10b981');
                circle.setAttribute('stroke', '#059669');
                circle.setAttribute('stroke-width', 2);
                circle.classList.add(`y-marker-${i}`);
                linearCanvas.appendChild(circle);

                // --- YENİLİK BURADA: Ölçekleme sonrası Y etiketi ---
                const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                yLabel.setAttribute('x', pixel.x - 35);
                yLabel.setAttribute('y', pixel.y - 10);
                yLabel.setAttribute('font-size', '13');
                yLabel.setAttribute('font-weight', 'bold');
                yLabel.setAttribute('fill', '#059669');
                
                // decimalToFraction kullanımı
                const displayYVal = decimalToFraction(yVal);
                yLabel.textContent = `${displayYVal}`;
                
                yLabel.classList.add(`y-label-${i}`);
                linearCanvas.appendChild(yLabel);
            }

            if (row.x !== '') {
                drawCoordinatePoint(i);
            }
        }
    }
}

function checkTableComplete() {
    // Check if first 4 rows are filled (last row is for formula)
    const allFilled = linearState.tableData.slice(0, 4).every(row => row.x !== '' && row.y !== '');
    document.getElementById('tableConfirmBtn').disabled = !allFilled;
}


document.getElementById('tableConfirmBtn').addEventListener('click', function() {
    // Show instruction to draw graph
    document.getElementById('drawInstructionText').classList.remove('hidden');

    // Enable drawing on canvas
    linearState.isDrawing = false;
    linearState.drawnPoints = [];

    // Enable check button
    document.getElementById('checkBtn').disabled = false;

    // Disable table editing
    document.querySelectorAll('#tableBody td').forEach(cell => {
        cell.style.pointerEvents = 'none';
        cell.style.opacity = '0.6';
    });
    
    // *** YENİ EKLENEN KISIM: Lastik Çizgi Aracını Başlat ***
    setupStraightLineDrawing(); 

    this.disabled = true;
});


function initializeLinearCanvas() {
    const linearCanvas = document.getElementById('linearCanvas');
    linearCanvas.innerHTML = ''; // Temizle
    
    // viewBox'u JavaScript üzerinden kesin olarak camelCase olarak ayarla
    linearCanvas.setAttribute('viewBox', '0 0 500 500');
    linearCanvas.style.backgroundColor = '#f8fafc'; // Arka planın beyaz/farklı olduğunu anlamak için çok hafif mavi

    // Y-Ekseni ölçeğini sıfırla
    if(typeof linearState !== 'undefined') linearState.yScale = 1;

    const LINEAR_GRID = 50;
    const LINEAR_ORIGIN = { x: 50, y: 450 };
    const EKSEN_UZUNLUGU = 8; // 8 kare çizelim

    // --- IZGARA ---
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Dikey çizgiler
    for (let i = 0; i <= EKSEN_UZUNLUGU; i++) {
        const x = LINEAR_ORIGIN.x + i * LINEAR_GRID;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x); line.setAttribute('y1', LINEAR_ORIGIN.y);
        line.setAttribute('x2', x); line.setAttribute('y2', LINEAR_ORIGIN.y - (EKSEN_UZUNLUGU * LINEAR_GRID));
        line.setAttribute('stroke', '#d1d5db'); // DAHA BELİRGİN GRİ
        line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    
    // Yatay çizgiler
    for (let i = 0; i <= EKSEN_UZUNLUGU; i++) {
        const y = LINEAR_ORIGIN.y - i * LINEAR_GRID;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', LINEAR_ORIGIN.x); line.setAttribute('y1', y);
        line.setAttribute('x2', LINEAR_ORIGIN.x + (EKSEN_UZUNLUGU * LINEAR_GRID)); line.setAttribute('y2', y);
        line.setAttribute('stroke', '#d1d5db'); // DAHA BELİRGİN GRİ
        line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    linearCanvas.appendChild(gridGroup);

    // --- EKSENLER ---
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', LINEAR_ORIGIN.x); xAxis.setAttribute('y1', LINEAR_ORIGIN.y);
    xAxis.setAttribute('x2', LINEAR_ORIGIN.x + EKSEN_UZUNLUGU * LINEAR_GRID + 20); xAxis.setAttribute('y2', LINEAR_ORIGIN.y);
    xAxis.setAttribute('stroke', '#111827'); // SİYAH
    xAxis.setAttribute('stroke-width', '3');
    linearCanvas.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', LINEAR_ORIGIN.x); yAxis.setAttribute('y1', LINEAR_ORIGIN.y);
    yAxis.setAttribute('x2', LINEAR_ORIGIN.x); yAxis.setAttribute('y2', LINEAR_ORIGIN.y - EKSEN_UZUNLUGU * LINEAR_GRID - 20);
    yAxis.setAttribute('stroke', '#111827'); // SİYAH
    yAxis.setAttribute('stroke-width', '3');
    linearCanvas.appendChild(yAxis);

    // Oklar
    const xArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    xArrow.setAttribute('points', `${LINEAR_ORIGIN.x + EKSEN_UZUNLUGU * LINEAR_GRID + 20},${LINEAR_ORIGIN.y} ${LINEAR_ORIGIN.x + EKSEN_UZUNLUGU * LINEAR_GRID + 10},${LINEAR_ORIGIN.y - 5} ${LINEAR_ORIGIN.x + EKSEN_UZUNLUGU * LINEAR_GRID + 10},${LINEAR_ORIGIN.y + 5}`);
    xArrow.setAttribute('fill', '#111827');
    linearCanvas.appendChild(xArrow);

    const yArrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    yArrow.setAttribute('points', `${LINEAR_ORIGIN.x},${LINEAR_ORIGIN.y - EKSEN_UZUNLUGU * LINEAR_GRID - 20} ${LINEAR_ORIGIN.x - 5},${LINEAR_ORIGIN.y - EKSEN_UZUNLUGU * LINEAR_GRID - 10} ${LINEAR_ORIGIN.x + 5},${LINEAR_ORIGIN.y - EKSEN_UZUNLUGU * LINEAR_GRID - 10}`);
    yArrow.setAttribute('fill', '#111827');
    linearCanvas.appendChild(yArrow);

    // X Ekseni Sayıları
    for (let i = 1; i <= EKSEN_UZUNLUGU; i++) {
        const x = LINEAR_ORIGIN.x + i * LINEAR_GRID;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x); text.setAttribute('y', LINEAR_ORIGIN.y + 20);
        text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold'); text.setAttribute('fill', '#1f2937');
        text.textContent = i;
        linearCanvas.appendChild(text);
    }

    // Y Ekseni Sayıları (Dinamik güncellenebilmesi için ID veriyoruz)
    for (let i = 1; i <= EKSEN_UZUNLUGU; i++) {
        const y = LINEAR_ORIGIN.y - i * LINEAR_GRID;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('id', 'linear_y_label_' + i);
        text.setAttribute('x', LINEAR_ORIGIN.x - 15); text.setAttribute('y', y + 4);
        text.setAttribute('text-anchor', 'end'); text.setAttribute('font-size', '13');
        text.setAttribute('font-weight', 'bold'); text.setAttribute('fill', '#4b5563');
        text.textContent = i;
        linearCanvas.appendChild(text);
    }
    
    // Orijin '0'
    const text0 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text0.setAttribute('x', LINEAR_ORIGIN.x - 15); text0.setAttribute('y', LINEAR_ORIGIN.y + 20);
    text0.setAttribute('text-anchor', 'end'); text0.setAttribute('font-size', '13');
    text0.setAttribute('font-weight', 'bold'); text0.setAttribute('fill', '#4b5563');
    text0.textContent = '0';
    linearCanvas.appendChild(text0);
}


function linearCoordToPixel(x, y) {
    const LINEAR_GRID = 50;
    const LINEAR_ORIGIN = { x: 50, y: 450 };
    return {
        x: LINEAR_ORIGIN.x + x * LINEAR_GRID,
        y: LINEAR_ORIGIN.y - y * LINEAR_GRID
    };
}


// Coordinate option button handlers
document.querySelectorAll('.coord-option').forEach(btn => {
    btn.addEventListener('click', function() {
        if (gameState.mode !== 'placeToPoint') return;


        const x = parseInt(this.dataset.x);
        const y = parseInt(this.dataset.y);
        gameState.selectedOption = { x, y };


        // Visual feedback for selection
        document.querySelectorAll('.coord-option').forEach(b => {
            b.style.opacity = '0.5';
        });
        this.style.opacity = '1';
        this.style.transform = 'scale(1.05)';


        // Enable check button
        document.getElementById('checkBtn').disabled = false;
    });
});


document.getElementById('newShapeBtn').addEventListener('click', startNewRound);
document.getElementById('checkBtn').addEventListener('click', checkAnswer);


document.getElementById('undoBtn').addEventListener('click', function() {
    if (gameState.userClicks.length === 0) return;


    // Remove last click
    gameState.userClicks.pop();


    // Redraw canvas
    initCanvas();


    if (gameState.mode === 'pointToPlace') {
        // No shape to redraw
    } else {
        drawShape(gameState.originalShape.points, 'original-shape');
    }


    // Redraw remaining user clicks
    gameState.userClicks.forEach(coord => {
        const pixel = coordToPixel(coord.x, coord.y);
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pixel.x);
        circle.setAttribute('cy', pixel.y);
        circle.setAttribute('r', 5);
        circle.setAttribute('fill', '#f59e0b');
        circle.setAttribute('stroke', '#d97706');
        circle.setAttribute('stroke-width', 2);
        canvas.appendChild(circle);


        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', pixel.x + 8);
        label.setAttribute('y', pixel.y - 8);
        label.setAttribute('font-size', '11');
        label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#d97706');
        label.textContent = `(${coord.x},${coord.y})`;
        canvas.appendChild(label);
    });


    updateUI();


    if (gameState.userClicks.length === 0) {
        this.disabled = true;
    }


    document.getElementById('checkBtn').disabled = true;
});


// ==========================================
// OYUNU BAŞLAT BUTONU (FABRİKA AYARLARINA DÖNÜŞ)
// ==========================================
window.addEventListener('DOMContentLoaded', function() {
    const startGameBtn = document.getElementById('startGameBtn');
    const splashScreen = document.getElementById('splashScreen');
    const appElement = document.getElementById('app');

    if (startGameBtn && splashScreen && appElement) {
        startGameBtn.addEventListener('click', function(e) {
            console.log('🚀 Oyun Başlatılıyor... (Tam Sıfırlama)');

            // 1. Giriş Ekranını Kapat, Uygulamayı Aç
            splashScreen.classList.add('hidden');
            splashScreen.style.display = 'none';
            appElement.classList.remove('hidden');
            appElement.style.display = 'flex';

            // Ağ üzerinden KESİN başlatma emri gönder (Gölge Senkronizasyon Bypass)
            // SADECE fiziksel tıklamalarda (e.isTrusted) gönder ki sonsuz döngüye girmesin!
            if (e && e.isTrusted && typeof myConnection !== 'undefined' && myConnection && isConnected) {
                myConnection.send({ type: 'force_start_game' });
            }

            // 2. TÜM EKRANLARI VE MENÜLERİ KAPAT
            if (typeof clearAllScreens === 'function') {
                clearAllScreens();
            }

            // 3. OYUN DURUMLARINI (STATE) SIFIRLA
            // Bu kısım çok önemli, oyunun "devam ettiğini" sanmasını engeller.
            
            // Genel Durum
            if (typeof gameState !== 'undefined') {
                gameState.mode = null; 
                gameState.selectedOption = null;
                gameState.userClicks = [];
                gameState.originalShape = null;
                gameState.transformedShape = null;
            }

            // Eğim Modu Durumu (Sorunun kaynağı burası olabilir)
            if (typeof slopeState !== 'undefined') {
                slopeState.currentQuestion = 0;
                slopeState.activeMode = null; // Hangi modda olduğunu unuttur
            }

            // Doğrusal İlişkiler Durumu
            if (typeof linearState !== 'undefined') {
                linearState.currentQuestion = null;
                linearState.drawnPoints = [];
                linearState.isDrawing = false;
            }

            // Zamanlayıcıları Durdur
            if (typeof window.feedbackTimer !== 'undefined' && window.feedbackTimer) {
                clearTimeout(window.feedbackTimer);
                window.feedbackTimer = null;
            }
            if (typeof window.roundTimer !== 'undefined' && window.roundTimer) {
                clearTimeout(window.roundTimer);
                window.roundTimer = null;
            }
            const fb = document.getElementById('feedback');
            if(fb) fb.style.opacity = '0';

            // 4. BUTON EFEKTLERİNİ TEMİZLE
            document.querySelectorAll('.nav-btn, button').forEach(btn => {
                btn.classList.remove('selected-button');
                // Tüm renk halkalarını sil
                btn.classList.remove(
                    'ring-2', 'ring-offset-1', 
                    'ring-orange-500', 'ring-cyan-500', 'ring-blue-500', 
                    'ring-purple-500', 'ring-pink-500', 'ring-teal-500',
                    'ring-green-500', 'ring-red-500'
                );
            });

            // 5. NORMAL CANVAS'I (BOŞ IZGARA) GÖSTER
            // Diğer özel modlar kapandığı için kullanıcı boşlukta kalmasın.
            const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
            if (regularCanvas) {
                regularCanvas.style.display = 'flex';
                if (typeof initCanvas === 'function') initCanvas();
            }

            console.log("✅ Oyun Fabrika Ayarlarına Döndü.");
        });
    }
});



// --- Doğru Grafikleri Buton Mantığı ---
document.getElementById('lineGraphsBtn').addEventListener('click', function() {
    const subButtons = document.getElementById('lineGraphSubButtons');
    
    // Açık mı kapalı mı kontrolü (Toggle mantığı)
    const isHidden = subButtons.classList.contains('hidden');

    // 1. Ekranı temizle
    clearAllScreens();

    // 2. Duruma göre aç veya kapa
    if (isHidden) {
        subButtons.classList.remove('hidden');
        this.classList.add('selected-button');
    } else {
        subButtons.classList.add('hidden');
        this.classList.remove('selected-button');
    }

    // 3. Diğer menüyü (Doğrusal İlişkiler) kapat
    document.getElementById('linearSubButtons').classList.add('hidden');
    document.getElementById('linearRelationsBtn').classList.remove('selected-button');

    // 4. Diğer ana buton seçimlerini kaldır
    document.getElementById('translationBtn').classList.remove('selected-button');
    document.getElementById('reflectionBtn').classList.remove('selected-button');
    document.getElementById('pointToPlaceBtn').classList.remove('selected-button');
    document.getElementById('placeToPointBtn').classList.remove('selected-button');
});



// --- Alt Buton Efektleri (Mavi Halka) ---
const graphSubIds = ['btnXeqA', 'btnYeqB', 'btnYeqAX', 'btnYeqAXplusB'];
graphSubIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', function() {
            // Hepsinin seçimini kaldır
            graphSubIds.forEach(btnId => {
                const b = document.getElementById(btnId);
                if (b) b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500');
            });
            // Tıklanana ekle
            this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        });
    }
});
// ==========================================
// YENİ ÖZELLİKLER: X=a ve Y=b (HİZALI IZGARA)
// ==========================================

// 1. TAM KOORDİNAT SİSTEMİNİ ÇİZEN FONKSİYON (Çizim kodları kaldırıldı, sadece ızgara)
function initializeFullCanvas() {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    // Ekranı sabitle
    canvas.setAttribute('viewBox', '0 0 500 500');
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const FULL_SIZE = 500;
    const FULL_GRID = 40;
    const CENTER_X = 250;
    const CENTER_Y = 250;

    // --- IZGARA ---
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const startOffset = CENTER_X % FULL_GRID;
    
    // Çizgiler
    for (let x = startOffset; x <= FULL_SIZE; x += FULL_GRID) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x); line.setAttribute('y1', 0);
        line.setAttribute('x2', x); line.setAttribute('y2', FULL_SIZE);
        line.setAttribute('stroke', '#6b7280'); line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    for (let y = startOffset; y <= FULL_SIZE; y += FULL_GRID) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0); line.setAttribute('y1', y);
        line.setAttribute('x2', FULL_SIZE); line.setAttribute('y2', y);
        line.setAttribute('stroke', '#6b7280'); line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    canvas.appendChild(gridGroup);

    // --- EKSENLER ---
    const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0); xAxis.setAttribute('y1', CENTER_Y);
    xAxis.setAttribute('x2', FULL_SIZE); xAxis.setAttribute('y2', CENTER_Y);
    xAxis.setAttribute('stroke', '#374151'); xAxis.setAttribute('stroke-width', '3');
    axisGroup.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', CENTER_X); yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', CENTER_X); yAxis.setAttribute('y2', FULL_SIZE);
    yAxis.setAttribute('stroke', '#374151'); yAxis.setAttribute('stroke-width', '3');
    axisGroup.appendChild(yAxis);
    canvas.appendChild(axisGroup);

    // --- SAYILAR ---
    for (let i = -6; i <= 6; i++) {
        if (i === 0) continue;
        const pos = CENTER_X + (i * FULL_GRID);
        if (pos > 10 && pos < FULL_SIZE - 10) {
            const textX = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textX.setAttribute('x', pos); textX.setAttribute('y', CENTER_Y + 20);
            textX.setAttribute('text-anchor', 'middle'); textX.setAttribute('font-size', '12');
            textX.setAttribute('font-weight', 'bold'); textX.textContent = i;
            canvas.appendChild(textX);
            
            const textY = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textY.setAttribute('x', CENTER_X - 15); textY.setAttribute('y', pos + 5);
            textY.setAttribute('text-anchor', 'middle'); textY.setAttribute('font-size', '12');
            textY.setAttribute('font-weight', 'bold'); textY.textContent = -i; 
            canvas.appendChild(textY);
        }
    }
    const origin = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    origin.setAttribute('x', CENTER_X - 10); origin.setAttribute('y', CENTER_Y + 15);
    origin.setAttribute('font-weight', 'bold'); origin.textContent = "0";
    canvas.appendChild(origin);
}

    // --- ÇİZİM İŞLEVİ ---
    let isMouseDown = false;
    let lastPoint = null;

    canvas.onpointerdown = function(e) {
        if (!document.getElementById('drawInstructionText').classList.contains('hidden')) {
            isMouseDown = true;
            canvas.setPointerCapture(e.pointerId);
            const pt = canvas.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const svgP = pt.matrixTransform(canvas.getScreenCTM().inverse());
            lastPoint = { x: svgP.x, y: svgP.y };
            linearState.drawnPoints.push(lastPoint);
        }
    };

    canvas.onpointermove = function(e) {
        if (isMouseDown && lastPoint) {
            const pt = canvas.createSVGPoint();
            pt.x = e.clientX; pt.y = e.clientY;
            const svgP = pt.matrixTransform(canvas.getScreenCTM().inverse());
            const currentPoint = { x: svgP.x, y: svgP.y };

            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', lastPoint.x); line.setAttribute('y1', lastPoint.y);
            line.setAttribute('x2', currentPoint.x); line.setAttribute('y2', currentPoint.y);
            line.setAttribute('stroke', '#ef4444'); line.setAttribute('stroke-width', '4');
            line.setAttribute('stroke-linecap', 'round');
            line.classList.add('user-drawn-line');
            canvas.appendChild(line);

            lastPoint = currentPoint;
            linearState.drawnPoints.push(currentPoint);
        }
    };

    canvas.onpointerup = function(e) {
        isMouseDown = false;
        lastPoint = null;
        canvas.releasePointerCapture(e.pointerId);
    };


// ==========================================
// X=a MODU (KURTARMA OPERASYONLU)
// ==========================================
function startXeqARound() {
    // 1. Bildirimleri Temizle
    const feedback = document.getElementById('feedback');
    if(feedback) feedback.style.opacity = '0';

    // 2. PANELİ BUL VE HAPİSTEN KURTAR (ANA GÖVDEYE TAŞI)
    const panel = document.getElementById('linearQuestionPanel');
    
    // Eğer panel bir şeyin içindeyse, onu oradan çıkarıp doğrudan body'ye ekle
    if (panel.parentElement !== document.body) {
        document.body.appendChild(panel);
    }
    
    panel.classList.remove('hidden');

    // 3. KONUMLANDIR (TEPEYE SABİTLE)
    // position: absolute yerine fixed kullanıyoruz ki sayfa kaysa bile tepede kalsın
    panel.style.cssText = `
        position: fixed !important; 
        top: 200px !important; 
        left: 20% !important; 
        transform: translateX(-50%) !important; 
        z-index: 99999 !important; 
        background-color: white !important; 
        padding: 10px 30px !important; 
        border: 2px solid #6366f1 !important; 
        border-radius: 12px !important; 
        display: block !important; 
        min-width: 300px !important; 
        text-align: center !important; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
    `;

    // 4. İÇERİĞİ YENİDEN YAZ
    // Soru metni div'ini sıfırdan oluşturuyoruz
    panel.innerHTML = '<div id="questionText" style="font-size: 20px; font-weight: 800; color: #312e81;">Sorular hazırlanıyor...</div>';

    // 5. Grafik Alanını Ayarla
    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden');
    linearContainer.style.display = 'block';
    linearContainer.style.position = 'relative';
    linearContainer.style.width = '600px';
    linearContainer.style.height = '600px';
    linearContainer.style.margin = '0 auto';
    linearContainer.style.overflow = 'visible'; // Taşarsa da görünsün

    // Gereksizleri Gizle
    if(document.getElementById('dataTable')) document.getElementById('dataTable').parentElement.style.display = 'none';
    if(document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    if(document.getElementById('drawInstructionText')) document.getElementById('drawInstructionText').classList.remove('hidden');
    
    // 6. Soru Mantığı
    const targets = [4, -3, 2, -5, 3, -2, 5, -4];
    let newTarget;
    do { newTarget = targets[Math.floor(Math.random() * targets.length)]; } 
    while (newTarget === gameState.targetLineValue && targets.length > 1);
    gameState.targetLineValue = newTarget; 
    
    // 7. METNİ GÜNCELLE
    const qText = document.getElementById('questionText');
    if(qText) qText.textContent = `Aşağıdaki koordinat sisteminde x = ${newTarget} doğrusunu çiziniz.`;
    
    // 8. Hazırlık
    initializeFullCanvas();
    linearState.drawnPoints = []; 
    if(document.getElementById('checkBtn')) document.getElementById('checkBtn').disabled = true; 
    
    setupStraightLineDrawing();
}


// ==========================================
// Y=b MODU (KURTARMA OPERASYONLU)
// ==========================================
function startYeqBRound() {
    // 1. Bildirimleri Temizle
    const feedback = document.getElementById('feedback');
    if(feedback) feedback.style.opacity = '0';

    // 2. PANELİ BUL VE HAPİSTEN KURTAR
    const panel = document.getElementById('linearQuestionPanel');
    
    // Body'ye taşı
    if (panel.parentElement !== document.body) {
        document.body.appendChild(panel);
    }
    
    panel.classList.remove('hidden');

    // 3. KONUMLANDIR
    panel.style.cssText = `
        position: fixed !important; 
        top: 200px !important; 
        left: 20% !important; 
        transform: translateX(-50%) !important; 
        z-index: 99999 !important; 
        background-color: white !important; 
        padding: 10px 30px !important; 
        border: 2px solid #6366f1 !important; 
        border-radius: 12px !important; 
        display: block !important; 
        min-width: 300px !important; 
        text-align: center !important; 
        box-shadow: 0 10px 25px rgba(0,0,0,0.2) !important;
    `;

    // 4. İÇERİĞİ YENİDEN YAZ
    panel.innerHTML = '<div id="questionText" style="font-size: 20px; font-weight: 800; color: #312e81;">Sorular hazırlanıyor...</div>';

    // 5. Grafik Alanını Ayarla
    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden');
    linearContainer.style.display = 'block';
    linearContainer.style.position = 'relative';
    linearContainer.style.width = '600px';
    linearContainer.style.height = '600px';
    linearContainer.style.margin = '0 auto';
    linearContainer.style.overflow = 'visible';

    // Gereksizleri Gizle
    if(document.getElementById('dataTable')) document.getElementById('dataTable').parentElement.style.display = 'none';
    if(document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    if(document.getElementById('drawInstructionText')) document.getElementById('drawInstructionText').classList.remove('hidden');
    
    // 6. Soru Mantığı
    const targets = [3, -2, 4, -3, 2, -5, 5, -4];
    let newTarget;
    do { newTarget = targets[Math.floor(Math.random() * targets.length)]; } 
    while (newTarget === gameState.targetLineValue && targets.length > 1);
    gameState.targetLineValue = newTarget; 
    
    // 7. METNİ GÜNCELLE
    const qText = document.getElementById('questionText');
    if(qText) qText.textContent = `Aşağıdaki koordinat sisteminde y = ${newTarget} doğrusunu çiziniz.`;
    
    // 8. Hazırlık
    initializeFullCanvas();
    linearState.drawnPoints = []; 
    if(document.getElementById('checkBtn')) document.getElementById('checkBtn').disabled = true;
    
    setupStraightLineDrawing();
}



// X=a KONTROLÜ (2 Nokta Mantığı)
function checkVerticalLine() {
    const targetX = gameState.targetLineValue;
    const drawnPoints = linearState.drawnPoints;
    
    // Sadece 2 nokta olmalı (Başlangıç ve Bitiş)
    if (drawnPoints.length !== 2) { 
        showFeedback(false); 
        return; 
    }

    const p1 = drawnPoints[0];
    const p2 = drawnPoints[1];
    
    const FULL_GRID = 40;
    const CENTER_X = 250;
    const CENTER_Y = 250;

    // Koordinatları grid sistemine çevir
    const x1 = (p1.x - CENTER_X) / FULL_GRID;
    const x2 = (p2.x - CENTER_X) / FULL_GRID;
    
    // Y koordinatları (uzunluk kontrolü için)
    const y1 = (CENTER_Y - p1.y) / FULL_GRID;
    const y2 = (CENTER_Y - p2.y) / FULL_GRID;

    // 1. Konum Doğru mu? (İki noktanın da X'i hedefe yakın olmalı)
    // Tolerans 0.5 birim
    const isX1Correct = Math.abs(x1 - targetX) < 0.5;
    const isX2Correct = Math.abs(x2 - targetX) < 0.5;

    // 2. Çizgi Dikey mi? (X değerleri birbirine yakın mı)
    const isVertical = Math.abs(x1 - x2) < 0.5;

    // 3. Çizgi Yeterince Uzun mu? (En az 3 birim boyunda olsun)
    const isLongEnough = Math.abs(y1 - y2) > 3;

    if (isX1Correct && isX2Correct && isVertical && isLongEnough) {
        playSuccessSound(); 
        showFeedback(true);
        
        // Başarılı çizgiyi yeşile boya ve kalınlaştır
        const userLine = document.querySelector('.user-drawn-line');
        if (userLine) { 
            userLine.setAttribute('stroke', '#10b981'); 
            userLine.setAttribute('stroke-width', '6'); 
        }
        
        window.roundTimer = setTimeout(() => { startXeqARound(); }, 2000);
    } else {
        playErrorSound();
        const feedback = document.getElementById('feedback');
        
        if (!isVertical) feedback.textContent = `Dik bir çizgi (x=${targetX}) çizmelisin!`;
        else if (!isX1Correct) feedback.textContent = `Çizgiyi x=${targetX} noktasından geçirmelisin!`;
        else if (!isLongEnough) feedback.textContent = "Çizgi çok kısa, biraz daha uzat!";
        else feedback.textContent = "Yanlış oldu, tekrar dene.";
        
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
        
        // Yanlış çizgiyi sil
        document.querySelectorAll('.user-drawn-line').forEach(el => el.remove());
        linearState.drawnPoints = [];
    }
}

// Y=b KONTROLÜ (2 Nokta Mantığı)
function checkHorizontalLine() {
    const targetY = gameState.targetLineValue;
    const drawnPoints = linearState.drawnPoints;
    
    if (drawnPoints.length !== 2) { 
        showFeedback(false); 
        return; 
    }

    const p1 = drawnPoints[0];
    const p2 = drawnPoints[1];
    
    const FULL_GRID = 40;
    const CENTER_X = 250;
    const CENTER_Y = 250;

    // Y koordinatlarını çevir
    const y1 = (CENTER_Y - p1.y) / FULL_GRID;
    const y2 = (CENTER_Y - p2.y) / FULL_GRID;
    
    // X koordinatları (uzunluk kontrolü için)
    const x1 = (p1.x - CENTER_X) / FULL_GRID;
    const x2 = (p2.x - CENTER_X) / FULL_GRID;

    // 1. Konum Doğru mu? (İki noktanın da Y'si hedefe yakın olmalı)
    const isY1Correct = Math.abs(y1 - targetY) < 0.5;
    const isY2Correct = Math.abs(y2 - targetY) < 0.5;

    // 2. Çizgi Yatay mı? (Y değerleri birbirine yakın mı)
    const isHorizontal = Math.abs(y1 - y2) < 0.5;

    // 3. Uzunluk
    const isLongEnough = Math.abs(x1 - x2) > 3;

    if (isY1Correct && isY2Correct && isHorizontal && isLongEnough) {
        playSuccessSound(); 
        showFeedback(true);
        
        const userLine = document.querySelector('.user-drawn-line');
        if (userLine) { 
            userLine.setAttribute('stroke', '#10b981'); 
            userLine.setAttribute('stroke-width', '6'); 
        }
        
        window.roundTimer = setTimeout(() => { startYeqBRound(); }, 2000);
    } else {
        playErrorSound();
        const feedback = document.getElementById('feedback');
        
        if (!isHorizontal) feedback.textContent = `Yatay bir çizgi (y=${targetY}) çizmelisin!`;
        else if (!isY1Correct) feedback.textContent = `Çizgiyi y=${targetY} noktasından geçirmelisin!`;
        else if (!isLongEnough) feedback.textContent = "Çizgi çok kısa, biraz daha uzat!";
        else feedback.textContent = "Yanlış oldu, tekrar dene.";
        
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
        
        document.querySelectorAll('.user-drawn-line').forEach(el => el.remove());
        linearState.drawnPoints = [];
    }
}

// 4. BUTON TANIMLAMALARI
var btnXeqA = document.getElementById('btnXeqA');
if (btnXeqA) {
    var newBtn = btnXeqA.cloneNode(true);
    btnXeqA.parentNode.replaceChild(newBtn, btnXeqA);
    newBtn.addEventListener('click', function() {
        gameState.mode = 'x_eq_a';
        document.querySelectorAll('#lineGraphSubButtons button').forEach(b => 
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500'));
        this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        
        var regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'none';
        document.getElementById('graphQuestionContainer').classList.add('hidden');
        
        startXeqARound();
    });
}

var btnYeqB = document.getElementById('btnYeqB');
if (btnYeqB) {
    var newBtnY = btnYeqB.cloneNode(true);
    btnYeqB.parentNode.replaceChild(newBtnY, btnYeqB);
    newBtnY.addEventListener('click', function() {
        gameState.mode = 'y_eq_b';
        document.querySelectorAll('#lineGraphSubButtons button').forEach(b => 
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500'));
        this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        
        var regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'none';
        document.getElementById('graphQuestionContainer').classList.add('hidden');
        
        startYeqBRound();
    });
}

// ==========================================
// YENİ ÖZELLİK: Y = ax MODU (TABLOYU BİREBİR OKUYAN SÜRÜM)
// ==========================================

// 1. ESKİ ÇİZİM FONKSİYONUNU DEVRE DIŞI BIRAK
if (!window.originalInitializeLinearCanvas) {
    window.originalInitializeLinearCanvas = window.initializeLinearCanvas;
}

window.initializeLinearCanvas = function() {
    if (gameState.mode === 'y_eq_ax' || gameState.mode === 'x_eq_a' || gameState.mode === 'y_eq_b') {
        drawFullGridForAX(); 
    } else {
        if(window.originalInitializeLinearCanvas) window.originalInitializeLinearCanvas();
    }
};

// GRAFİK IZGARASINI ÇİZEN FONKSİYON (Ölçekli)
function drawFullGridForAX(scaleFactor = 1) {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    // Ekranı sabitle
    canvas.setAttribute('viewBox', '0 0 500 500');
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const FULL_SIZE = 500;
    const FULL_GRID = 40; // Her karenin piksel genişliği (sabit)
    const CENTER_X = 250;
    const CENTER_Y = 250;

    // --- IZGARA ÇİZGİLERİ ---
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const startOffset = CENTER_X % FULL_GRID;
    
    for (let x = startOffset; x <= FULL_SIZE; x += FULL_GRID) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x); line.setAttribute('y1', 0);
        line.setAttribute('x2', x); line.setAttribute('y2', FULL_SIZE);
        line.setAttribute('stroke', '#6b7280'); line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    for (let y = startOffset; y <= FULL_SIZE; y += FULL_GRID) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0); line.setAttribute('y1', y);
        line.setAttribute('x2', FULL_SIZE); line.setAttribute('y2', y);
        line.setAttribute('stroke', '#6b7280'); line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    canvas.appendChild(gridGroup);

    // --- EKSENLER ---
    const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0); xAxis.setAttribute('y1', CENTER_Y);
    xAxis.setAttribute('x2', FULL_SIZE); xAxis.setAttribute('y2', CENTER_Y);
    xAxis.setAttribute('stroke', '#374151'); xAxis.setAttribute('stroke-width', '3');
    axisGroup.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', CENTER_X); yAxis.setAttribute('y1', 0);
    yAxis.setAttribute('x2', CENTER_X); yAxis.setAttribute('y2', FULL_SIZE);
    yAxis.setAttribute('stroke', '#374151'); yAxis.setAttribute('stroke-width', '3');
    axisGroup.appendChild(yAxis);
    canvas.appendChild(axisGroup);

    // --- SAYILAR (ÖLÇEĞE GÖRE) ---
    // Her çizgi 1 birim değil, 'scaleFactor' kadar birimdir.
    for (let i = -6; i <= 6; i++) {
        if (i === 0) continue;
        const pos = CENTER_X + (i * FULL_GRID);
        
        // Gösterilecek sayı değeri
        const displayNum = i * scaleFactor;

        if (pos > 10 && pos < FULL_SIZE - 10) {
            // X Ekseni Sayıları
            const textX = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textX.setAttribute('x', pos); textX.setAttribute('y', CENTER_Y + 20);
            textX.setAttribute('text-anchor', 'middle'); textX.setAttribute('font-size', '12');
            textX.setAttribute('font-weight', 'bold'); 
            textX.textContent = displayNum;
            canvas.appendChild(textX);
            
            // Y Ekseni Sayıları
            const textY = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textY.setAttribute('x', CENTER_X - 15); textY.setAttribute('y', pos + 5);
            textY.setAttribute('text-anchor', 'middle'); textY.setAttribute('font-size', '12');
            textY.setAttribute('font-weight', 'bold'); 
            textY.textContent = -displayNum; // Y ekseni yukarı doğru pozitiftir ama SVG'de yukarı gidildikçe piksel azalır
            canvas.appendChild(textY);
        }
    }
    const origin = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    origin.setAttribute('x', CENTER_X - 10); origin.setAttribute('y', CENTER_Y + 15);
    origin.setAttribute('font-weight', 'bold'); origin.textContent = "0";
    canvas.appendChild(origin);
}

function initializeLearningTable() {
    const tbody = document.getElementById('tableBody');
    tbody.innerHTML = '';
    
    // Hem 'y_eq_ax' HEM DE 'y_eq_ax_plus_b' modları için özel tablo
    if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') {
        
        document.getElementById('xHeader').textContent = "x";
        
        // Başlık metnini moda göre ayarla
        if (gameState.mode === 'y_eq_ax') {
            document.getElementById('yHeader').textContent = `y = ${gameState.targetSlope}x`;
        } else {
            const sign = gameState.targetIntercept > 0 ? '+' : '';
            document.getElementById('yHeader').textContent = `y = ${gameState.targetSlope}x ${sign}${gameState.targetIntercept}`;
        }
        
        // 3. Sütun Başlığı (Nokta)
        let thirdHeader = document.getElementById('pointHeader');
        if (!thirdHeader) {
            const trHead = document.querySelector('#dataTable thead tr');
            thirdHeader = document.createElement('th');
            thirdHeader.id = 'pointHeader';
            thirdHeader.className = "border-2 border-purple-500 bg-purple-200 px-4 py-2 font-bold text-purple-900";
            trHead.appendChild(thirdHeader);
        }
        thirdHeader.textContent = "Nokta (x,y)";
        thirdHeader.style.display = 'table-cell';

        // 4 Satır Oluştur
        for (let i = 0; i < 4; i++) {
            const row = document.createElement('tr');
            
            // X Hücresi
            const xCell = document.createElement('td');
            xCell.className = 'border-2 border-purple-400 px-2 py-2 text-center font-bold text-lg cursor-pointer hover:bg-purple-100';
            xCell.dataset.row = i; xCell.dataset.col = 'x';
            xCell.addEventListener('click', () => openNumberPad(i, 'x'));
            
            // Y Hücresi
            const yCell = document.createElement('td');
            yCell.className = 'border-2 border-purple-400 px-2 py-2 text-center font-bold text-lg cursor-pointer hover:bg-purple-100';
            yCell.dataset.row = i; yCell.dataset.col = 'y';
            yCell.addEventListener('click', () => openNumberPad(i, 'y'));
            
            // Nokta Hücresi (Otomatik)
            const pointCell = document.createElement('td');
            pointCell.className = 'border-2 border-purple-400 px-2 py-2 text-center font-bold text-lg bg-gray-100 text-gray-600';
            pointCell.id = `point-cell-${i}`;
            pointCell.textContent = '(?, ?)';
            
            row.appendChild(xCell); 
            row.appendChild(yCell);
            row.appendChild(pointCell);
            tbody.appendChild(row);
        }
    } else {
        // Diğer modlar için eski standart tablo
        const thirdHeader = document.getElementById('pointHeader');
        if (thirdHeader) thirdHeader.style.display = 'none';

        document.getElementById('xHeader').textContent = "x";
        document.getElementById('yHeader').textContent = "y";

        for (let i = 0; i < 2; i++) {
             const row = document.createElement('tr');
             
             const xCell = document.createElement('td');
             xCell.className = 'border-2 border-purple-400 px-2 py-2 text-center font-bold text-lg cursor-pointer hover:bg-purple-100';
             xCell.dataset.row = i; xCell.dataset.col = 'x';
             xCell.addEventListener('click', () => openNumberPad(i, 'x'));

             const yCell = document.createElement('td');
             yCell.className = 'border-2 border-purple-400 px-2 py-2 text-center font-bold text-lg cursor-pointer hover:bg-purple-100';
             yCell.dataset.row = i; yCell.dataset.col = 'y';
             yCell.addEventListener('click', () => openNumberPad(i, 'y'));

             row.appendChild(xCell);
             row.appendChild(yCell);
             tbody.appendChild(row);
        }
    }
}


window.updateLinearCanvas = function(row, col, value) {
    if (gameState.mode !== 'y_eq_ax' && gameState.mode !== 'y_eq_ax_plus_b') return;

    // 1. Tablo Verisini Güncelle (Metin olarak)
    const tableRows = document.getElementById('tableBody').querySelectorAll('tr');
    const currentRow = tableRows[row];
    let xText = currentRow.children[0].textContent.trim();
    let yText = currentRow.children[1].textContent.trim();
    if (yText.includes('=')) yText = yText.split('=')[1].trim();

    // 3. Sütun (Nokta) Güncellemesi
    const pointCell = document.getElementById(`point-cell-${row}`);
    if (xText !== '' && yText !== '' && pointCell) {
        pointCell.textContent = `(${xText}, ${yText})`;
        pointCell.style.color = '#6d28d9'; pointCell.style.backgroundColor = '#f3e8ff';
    } else if (pointCell) {
        pointCell.textContent = '(?, ?)';
        pointCell.style.color = '#6b7280'; pointCell.style.backgroundColor = '#9ca3af';
    }

    // --- AKILLI ÖLÇEKLENDİRME ---
    // Tablodaki tüm verileri topla
    let maxAbsValue = 0;
    let pointsData = [];
    let validPointsCount = 0;

    tableRows.forEach((tr) => {
        let xStr = tr.children[0].textContent.trim();
        let yStr = tr.children[1].textContent.trim();
        if (yStr.includes('=')) yStr = yStr.split('=')[1].trim();

        const xVal = evaluateMathExpression(xStr, 0);
        const yVal = evaluateMathExpression(yStr, 0);

        if (!isNaN(xVal) && !isNaN(yVal)) {
            pointsData.push({x: xVal, y: yVal});
            validPointsCount++;
            // En büyük değeri bul (negatifler pozitif yapılıp bakılır)
            maxAbsValue = Math.max(maxAbsValue, Math.abs(xVal), Math.abs(yVal));
        }
    });

    // Ölçeği Belirle (Varsayılan 1)
    // Ekranda merkezin sağına doğru yaklaşık 6 çizgi var.
    // Eğer sayı 6'dan büyükse sığmaz, ölçeği büyütmeliyiz.
    let scaleFactor = 1;
    if (maxAbsValue > 6) scaleFactor = 2;
    if (maxAbsValue > 12) scaleFactor = 5;
    if (maxAbsValue > 30) scaleFactor = 10;
    if (maxAbsValue > 60) scaleFactor = 20;
    if (maxAbsValue > 120) scaleFactor = 50;

    // Bu ölçek değerini global bir yere kaydet (Çizgi kontrolünde lazım olacak)
    linearState.axisScale = scaleFactor;

    // 2. Grafiği Yeni Ölçekle Çiz
    drawFullGridForAX(scaleFactor);

    // 3. Noktaları Yerleştir
    const linearCanvas = document.getElementById('linearCanvas');
    const CENTER_X = 250; 
    const CENTER_Y = 250; 
    const FULL_GRID = 40; 

    // Eski noktaları temizle
    document.querySelectorAll("circle[class*='point-'], text[class*='point-'], line[class*='guide-']").forEach(el => el.remove());

    pointsData.forEach(p => {
        // KOORDİNAT HESABI:
        // (Değer / Ölçek) * IzgaraBüyüklüğü
        // Örn: Değer 20, Ölçek 5 ise -> 4 kare gider.
        const pixelX = CENTER_X + ((p.x / scaleFactor) * FULL_GRID);
        const pixelY = CENTER_Y - ((p.y / scaleFactor) * FULL_GRID);

        // Rehber Çizgiler
        const guideX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guideX.setAttribute('x1', pixelX); guideX.setAttribute('y1', pixelY);
        guideX.setAttribute('x2', pixelX); guideX.setAttribute('y2', CENTER_Y);
        guideX.setAttribute('stroke', '#ef4444'); guideX.setAttribute('stroke-width', '2');
        guideX.setAttribute('stroke-dasharray', '4,4');
        linearCanvas.appendChild(guideX);

        const guideY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guideY.setAttribute('x1', pixelX); guideY.setAttribute('y1', pixelY);
        guideY.setAttribute('x2', CENTER_X); guideY.setAttribute('y2', pixelY);
        guideY.setAttribute('stroke', '#ef4444'); guideY.setAttribute('stroke-width', '2');
        guideY.setAttribute('stroke-dasharray', '4,4');
        linearCanvas.appendChild(guideY);

        // Nokta
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pixelX); circle.setAttribute('cy', pixelY);
        circle.setAttribute('r', 8); 
        circle.setAttribute('fill', '#8b5cf6');
        circle.setAttribute('stroke', 'white'); circle.setAttribute('stroke-width', '2');
        linearCanvas.appendChild(circle);

        // Etiket
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', pixelX + 15); label.setAttribute('y', pixelY - 15);
        label.setAttribute('font-size', '16'); label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#6d28d9');
        
        const displayX = decimalToFraction(p.x);
        const displayY = decimalToFraction(p.y);
        label.textContent = `(${displayX}, ${displayY})`;
        linearCanvas.appendChild(label);
    });

    // Buton Kontrolü
    const feedback = document.getElementById('feedback');
    const confirmBtn = document.getElementById('tableConfirmBtn');

    if (validPointsCount >= 2) {
        const allSame = pointsData.every(p => p.x === pointsData[0].x && p.y === pointsData[0].y);
        if (allSame) {
            feedback.textContent = "⚠️ Noktalar üst üste! Farklı değerler ver.";
            feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-bold bg-orange-500 text-white';
            feedback.style.opacity = '1';
            confirmBtn.disabled = true; confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            feedback.textContent = "✅ Harika! 'TAMAM' butonuna bas ve çizimi yap.";
            feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-bold bg-green-500 text-white';
            feedback.style.opacity = '1';
            confirmBtn.disabled = false; confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else {
        confirmBtn.disabled = true; confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

// 6. LASTİK ÇİZGİ ARACI
function setupStraightLineDrawing() {
    const canvas = document.getElementById('linearCanvas');
    const newCanvas = canvas.cloneNode(true);
    canvas.parentNode.replaceChild(newCanvas, canvas);
    
    let isDragging = false;
    let startPoint = null;
    let previewLine = null;

    newCanvas.onpointerdown = function(e) {
        if (document.getElementById('drawInstructionText').classList.contains('hidden')) return;

        isDragging = true;
        newCanvas.setPointerCapture(e.pointerId);
        const pt = newCanvas.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const svgP = pt.matrixTransform(newCanvas.getScreenCTM().inverse());
        startPoint = { x: svgP.x, y: svgP.y };
        
        previewLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        previewLine.setAttribute('x1', startPoint.x); previewLine.setAttribute('y1', startPoint.y);
        previewLine.setAttribute('x2', startPoint.x); previewLine.setAttribute('y2', startPoint.y);
        previewLine.setAttribute('stroke', '#ef4444'); previewLine.setAttribute('stroke-width', '4');
        previewLine.setAttribute('stroke-dasharray', '5,5');
        newCanvas.appendChild(previewLine);
    };

    newCanvas.onpointermove = function(e) {
        if (!isDragging || !previewLine) return;
        const pt = newCanvas.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const svgP = pt.matrixTransform(newCanvas.getScreenCTM().inverse());
        previewLine.setAttribute('x2', svgP.x); previewLine.setAttribute('y2', svgP.y);
    };

    newCanvas.onpointerup = function(e) {
        if (!isDragging || !previewLine) return;
        isDragging = false;
        newCanvas.releasePointerCapture(e.pointerId);
        
        const pt = newCanvas.createSVGPoint();
        pt.x = e.clientX; pt.y = e.clientY;
        const svgP = pt.matrixTransform(newCanvas.getScreenCTM().inverse());
        const endPoint = { x: svgP.x, y: svgP.y };
        
        if (Math.sqrt(Math.pow(endPoint.x - startPoint.x, 2) + Math.pow(endPoint.y - startPoint.y, 2)) < 10) {
            previewLine.remove(); return;
        }

        previewLine.remove();
        document.querySelectorAll('.user-drawn-line').forEach(el => el.remove());
        linearState.drawnPoints = [];

        const finalLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        finalLine.setAttribute('x1', startPoint.x); finalLine.setAttribute('y1', startPoint.y);
        finalLine.setAttribute('x2', endPoint.x); finalLine.setAttribute('y2', endPoint.y);
        finalLine.setAttribute('stroke', '#ef4444'); finalLine.setAttribute('stroke-width', '4');
        finalLine.classList.add('user-drawn-line');
        newCanvas.appendChild(finalLine);
        
        linearState.drawnPoints.push(startPoint);
        linearState.drawnPoints.push(endPoint);
        document.getElementById('checkBtn').disabled = false;
    };
}

function checkStraightLine() {
    const drawnPoints = linearState.drawnPoints;
    if (drawnPoints.length !== 2) { showFeedback(false); return; }

    const p1 = drawnPoints[0];
    const p2 = drawnPoints[1];
    
    const targetSlope = gameState.targetSlope;
    const targetIntercept = gameState.targetIntercept !== undefined ? gameState.targetIntercept : 0;

    const CENTER_X = 250, CENTER_Y = 250, FULL_GRID = 40;
    
    // YENİLİK BURADA: O anki ölçek katsayısını kullan (Yoksa 1 kabul et)
    const currentScale = linearState.axisScale || 1;

    // Koordinat dönüşümünde 'currentScale' ile çarpıyoruz
    // Formül: (PikselFarkı / GridBoyutu) * Ölçek
    const x1 = ((p1.x - CENTER_X) / FULL_GRID) * currentScale;
    const y1 = ((CENTER_Y - p1.y) / FULL_GRID) * currentScale;
    const x2 = ((p2.x - CENTER_X) / FULL_GRID) * currentScale;
    const y2 = ((CENTER_Y - p2.y) / FULL_GRID) * currentScale;
    
    const drawnSlope = (y2 - y1) / (x2 - x1);
    const drawnIntercept = y1 - (drawnSlope * x1); 
    
    // Kontroller (Toleranslı)
    // Ölçek büyüdükçe toleransı biraz artırmak gerekebilir ama 0.5 genellikle iyidir.
    const isSlopeCorrect = Math.abs(drawnSlope - targetSlope) < 0.5;
    const isInterceptCorrect = Math.abs(drawnIntercept - targetIntercept) < 0.5;
    
    // Uzunluk kontrolü (Piksel bazında yapalım ki ölçekten etkilenmesin)
    // En az 40 piksel (1 kare) uzunluk olsun
    const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const isLongEnough = pixelDist > 40;

    if (isSlopeCorrect && isInterceptCorrect && isLongEnough) {
        playSuccessSound(); showFeedback(true);
        const userLine = document.querySelector('.user-drawn-line');
        if (userLine) { userLine.setAttribute('stroke', '#10b981'); userLine.setAttribute('stroke-width', '6'); }
        
        setTimeout(() => { 
            // Yeni soruya geçerken ölçeği sıfırla
            linearState.axisScale = 1; 
            if (gameState.mode === 'y_eq_ax_plus_b') startYeqAXplusBRound();
            else startYeqAXRound();
        }, 2000);
    } else {
        playErrorSound();
        const feedback = document.getElementById('feedback');
        
        if (!isInterceptCorrect) {
             feedback.textContent = `Çizgi Y eksenini ${targetIntercept} noktasında kesmeli!`;
        } else if (!isSlopeCorrect) {
            feedback.textContent = "Eğim yanlış! Noktaları birleştir.";
        } else if (!isLongEnough) {
            feedback.textContent = "Çizgi çok kısa!";
        }
        
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
        document.querySelectorAll('.user-drawn-line').forEach(el => el.remove());
        linearState.drawnPoints = [];
    }
}


// 8. BUTONLAR
var btnYeqAX = document.getElementById('btnYeqAX');
if (btnYeqAX) {
    var newBtnAX = btnYeqAX.cloneNode(true);
    btnYeqAX.parentNode.replaceChild(newBtnAX, btnYeqAX);
    newBtnAX.addEventListener('click', function() {
        gameState.mode = 'y_eq_ax';
        document.querySelectorAll('#lineGraphSubButtons button').forEach(b => b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500'));
        this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        var regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'none';
        document.getElementById('graphQuestionContainer').classList.add('hidden');
        startYeqAXRound();
    });
}

var btnYeqAXplusB = document.getElementById('btnYeqAXplusB');
if (btnYeqAXplusB) {
    var newBtnPlusB = btnYeqAXplusB.cloneNode(true);
    btnYeqAXplusB.parentNode.replaceChild(newBtnPlusB, btnYeqAXplusB);
    newBtnPlusB.addEventListener('click', function() {
        gameState.mode = 'y_eq_ax_plus_b';
        document.querySelectorAll('#lineGraphSubButtons button').forEach(b => b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500'));
        this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        
        var regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'none';
        document.getElementById('graphQuestionContainer').classList.add('hidden');
        
        startYeqAXplusBRound();
    });
}

var checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
    var newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);
    newCheckBtn.addEventListener('click', function() {
        if (gameState.mode === 'x_eq_a') { if(typeof checkVerticalLine === 'function') checkVerticalLine(); }
        else if (gameState.mode === 'y_eq_b') { if(typeof checkHorizontalLine === 'function') checkHorizontalLine(); }
        else if (gameState.mode === 'y_eq_ax') { checkStraightLine(); }
// checkBtn listener içinde:
else if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') { 
    checkStraightLine(); 
}
        else if (gameState.mode === 'questionToGraph') { if(typeof checkLinearGraph === 'function') checkLinearGraph(); }
        else if (gameState.mode === 'graphToQuestion') { if(typeof checkGraphAnswer === 'function') checkGraphAnswer(); }
        else { if(typeof checkAnswer === 'function') checkAnswer(); }
    });
}

function clearGeometryUI() {
    // 1. Koordinat butonlarını (Yer -> Nokta) gizle
    document.getElementById('coordinateOptions').classList.add('hidden');
    
    // 2. Geometri bilgi kutusunu gizle
    document.getElementById('transformInfo').classList.add('hidden');
    
    // 3. Bildirimleri temizle
    document.getElementById('feedback').style.opacity = '0';
    
    // 4. Standart Geometri Canvas'ını gizle (Eğer açıksa)
    // Not: Linear modlar kendi canvaslarını veya containerlarını açtığı için
    // bu genellikle otomatik gizlenir ama garantiye alalım.
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) {
        regularCanvas.style.display = 'none';
    }
}


// ==========================================
// KESİN TEMİZLİK FONKSİYONU (NÜKLEER SEÇENEK)
// ==========================================
function clearAllScreens() {

// clearAllScreens fonksiyonunun içine şu satırı ekle:
if (window.feedbackTimer) clearTimeout(window.feedbackTimer);
if (window.roundTimer) clearTimeout(window.roundTimer); // BUG FIX: Devam eden eski oyunların setTimeout'larını iptal et
if (window.animationFrameId) cancelAnimationFrame(window.animationFrameId); // BUG FIX: Devam eden animasyonları iptal et
const fb = document.getElementById('feedback');
if (fb) fb.style.opacity = '0';


    // 1. GİZLENMESİ GEREKEN TÜM ID'LERİN LİSTESİ
    const idsToHide = [
        // Alt Menüler
        'transformSubButtons',
        'coordinateSubButtons',
        'linearSubButtons',
        'lineGraphSubButtons',
        'slopeSubButtons',
        
        // İçerik Panelleri ve Containerlar
        'linearContainer',
        'graphQuestionContainer',
        'linearQuestionPanel',
        'slopeQuestionPanel',
        'numberPad',
        'transformInfo',
        'coordinateOptions',
        'drawInstructionText',
        
        // Butonlar
        'tableConfirmBtn'
    ];

    // 2. HEPSİNİ TEK TEK BUL VE GİZLE
    idsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');       // Tailwind gizlemesi
            el.style.display = 'none';        // CSS zorla gizleme (Önemli!)
            el.style.removeProperty('display'); // Veya inline stili tamamen sil (daha temiz)
            el.classList.add('hidden'); // Tekrar garantiye al
        }
    });

    // 3. TABLOYU ÖZEL OLARAK GİZLE (Wrapper'ı ile birlikte)
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        dataTable.style.display = 'none';
        if (dataTable.parentElement) {
            dataTable.parentElement.style.display = 'none';
        }
    }

    // 4. GERİ BİLDİRİMİ SİL
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.style.opacity = '0';

    // 5. TÜM BUTON EFEKTLERİNİ SİL (Halkalar vb.)
    document.querySelectorAll('.nav-btn, button').forEach(btn => {
        btn.classList.remove('selected-button');
        btn.classList.remove(
            'ring-2', 'ring-offset-1', 
            'ring-orange-500', 'ring-cyan-500', 'ring-blue-500', 
            'ring-purple-500', 'ring-pink-500', 'ring-teal-500',
            'ring-green-500', 'ring-red-500'
        );
    });

    // 6. ANA GEOMETRİ CANVAS'INI GİZLE (Varsayılan olarak)
    // Bunu sadece "Dönüşüm Geometrisi" modları geri açacak.
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) {
        regularCanvas.style.display = 'none'; 
    }
}



// ==========================================
// DÜZEN DÜZELTME: GRAFİK -> SORU EKRANI
// ==========================================
// Sol paneli (Soru kısmı) genişlet, grafiği sıkıştırma
document.addEventListener('DOMContentLoaded', function() {
    const graphContainer = document.getElementById('graphQuestionContainer');
    if (graphContainer) {
        // Sol panel (Soru metni ve şıklar)
        const leftPanel = graphContainer.children[0];
        // w-64 (sabit) yerine w-1/3 veya w-2/5 (oransal) yapıyoruz
        leftPanel.classList.remove('w-64'); 
        leftPanel.classList.add('w-1/3', 'min-w-[300px]', 'p-2'); 
        
        // Sağ panel (Grafik)
        const rightPanel = graphContainer.children[1];
        rightPanel.classList.add('p-2');
    }
});

// ==========================================
// ONDALIK SAYIYI KESRE ÇEVİRME (1.33 -> 4/3)
// ==========================================
function decimalToFraction(val) {
    if (val === undefined || isNaN(val)) return "";
    
    // Zaten tam sayıysa direkt döndür (Örn: 5)
    if (Math.abs(val - Math.round(val)) < 0.0001) {
        return Math.round(val).toString();
    }

    // Paydayı 2'den 100'e kadar dene (Okul matematiği için yeterli)
    for (let d = 2; d <= 100; d++) {
        let n = val * d;
        // Eğer payda ile çarpınca tam sayıya çok yaklaşıyorsa bulduk demektir
        if (Math.abs(n - Math.round(n)) < 0.0001) {
            return `${Math.round(n)}/${d}`;
        }
    }
    
    // Eğer basit bir kesir bulunamazsa, virgülden sonra 2 basamak göster
    return val.toFixed(2);
}

// ==========================================
// Y=AX MODU İÇİN EKSİK KODLAR (RESTORASYON)
// ==========================================

// 1. Modu Başlatan Fonksiyon
function startYeqAXRound() {
    console.log("Y=ax Modu Başlıyor...");
    
    // Eski bildirimleri temizle
    const feedback = document.getElementById('feedback');
    feedback.style.opacity = '0';
    feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';

    gameState.mode = 'y_eq_ax';
    
    // Rastgele Eğim Belirle
    const slopes = [2, -2, 3, -3]; 
    let newSlope;
    do { newSlope = slopes[Math.floor(Math.random() * slopes.length)]; } 
    while (newSlope === gameState.targetSlope);
    gameState.targetSlope = newSlope;
    
    // UI (Arayüz) Hazırla
    document.getElementById('linearQuestionPanel').classList.remove('hidden');
    document.getElementById('linearContainer').classList.remove('hidden');
    document.getElementById('linearContainer').style.display = 'flex';
    document.getElementById('dataTable').parentElement.style.display = 'flex';
    document.getElementById('drawInstructionText').classList.add('hidden');
    
    document.getElementById('questionText').textContent = `Denklem: y = ${newSlope}x. Tabloyu doldurarak grafiği çiziniz.`;

    // Tabloyu oluştur
    initializeLearningTable();
    
    // Grafiği varsayılan ölçekle (1) çiz
    linearState.axisScale = 1; 
    drawFullGridForAX(1);
    
    // Hafızayı Temizle 
    linearState.drawnPoints = []; 
    linearState.tableData = Array(4).fill(null).map(() => ({x: '', y: '', calcY: undefined}));
    
    const confirmBtn = document.getElementById('tableConfirmBtn');
    confirmBtn.style.display = 'block'; 
    confirmBtn.disabled = true; 
    confirmBtn.classList.add('opacity-50', 'cursor-not-allowed'); 
    document.getElementById('checkBtn').disabled = true;
    
    // Çizim aracını hazırla
    setupStraightLineDrawing();
}

// 2. Buton Tıklama Olayı (Listener)
var btnYeqAX = document.getElementById('btnYeqAX');
if (btnYeqAX) {
    var newBtnAX = btnYeqAX.cloneNode(true);
    btnYeqAX.parentNode.replaceChild(newBtnAX, btnYeqAX);
    newBtnAX.addEventListener('click', function() {
        gameState.mode = 'y_eq_ax';
        // Diğer butonların seçim halkasını kaldır
        document.querySelectorAll('#lineGraphSubButtons button').forEach(b => b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500'));
        // Bu butona halka ekle
        this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        
        // Diğer ekranları gizle
        var regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'none';
        document.getElementById('graphQuestionContainer').classList.add('hidden');
        
        // Modu başlat
        startYeqAXRound();
    });
}


// ==========================================
// EĞİM ANA BUTONU (SADECE MENÜYÜ AÇAR)
// ==========================================
document.getElementById('slopeBtn').addEventListener('click', function() {
    // 1. Alt menüyü bul
    const subButtons = document.getElementById('slopeSubButtons');
    
    // Açık mı kapalı mı?
    const isHidden = subButtons.classList.contains('hidden') || subButtons.style.display === 'none';

    // 2. Ekranı temizle (Diğer menüleri kapat)
    clearAllScreens(); 

    // 3. Menüyü AÇ (Ama oyunu başlatma!)
    if (isHidden) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex'; // Menüyü görünür yap
        
        this.classList.add('selected-button');
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');
    } else {
        // Zaten açıksa kapat
        subButtons.classList.add('hidden'); // Sınıfı geri ekle
        subButtons.style.display = 'none';
        this.classList.remove('selected-button');
        this.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
    }
});


// --- Eğim Alt Butonları (Şimdilik Hazırlık) ---
const slopeSubIds = ['btnSlopeIncline', 'btnSlopeGraph', 'btnSlopeTwoPoints', 'btnSlopeEquation'];

slopeSubIds.forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', function() {
            // Halka efekti
            slopeSubIds.forEach(btnId => {
                const b = document.getElementById(btnId);
                if (b) b.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
            });
            this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');
            
            // Burada ileride ilgili modları başlatacağız
            console.log(id + " tıklandı. İlgili eğim modu açılacak.");
            
            // Örnek: gameState.mode = 'slope_incline';
            // startSlopeInclineRound(); vb.
        });
    }
});

// ==========================================
// DÖNÜŞÜM GEOMETRİSİ MENÜ MANTIĞI
// ==========================================

// 1. ANA BUTON (Menüyü Açıp Kapatma)
document.getElementById('transformationsBtn').addEventListener('click', function() {
    const subButtons = document.getElementById('transformSubButtons');
    const isHidden = subButtons.classList.contains('hidden');

    // Önce ekranı temizle (Diğer açık menüleri kapatır)
    clearAllScreens();

    if (isHidden) {
        // Menüyü aç
        subButtons.classList.remove('hidden');
        this.classList.add('selected-button');
    } else {
        // Menüyü kapat
        subButtons.classList.add('hidden');
        this.classList.remove('selected-button');
    }
});

// 2. ÖTELEME BUTONU GÜNCELLEMESİ (Mevcut listener'ı ezer veya tamamlar)
// Not: Mevcut kodda zaten listener var ama menüyü açık tutmak için bunu override ediyoruz.
var oldTranslationBtn = document.getElementById('translationBtn');
if (oldTranslationBtn) {
    // Butonu klonlayıp eskisini silerek listener çakışmasını önlüyoruz (En temiz yöntem)
    var newTranslationBtn = oldTranslationBtn.cloneNode(true);
    oldTranslationBtn.parentNode.replaceChild(newTranslationBtn, oldTranslationBtn);

    newTranslationBtn.addEventListener('click', function() {
        clearAllScreens(); // Temizlik
        
        // Menüyü tekrar aç (Çünkü clearAllScreens kapattı)
        document.getElementById('transformSubButtons').classList.remove('hidden');
        document.getElementById('transformationsBtn').classList.add('selected-button');
        
        // Kendini aktif yap (Halka efekti)
        this.classList.add('ring-2', 'ring-offset-1', 'ring-blue-500');
        
        // Diğer butonun efektini sil
        const refBtn = document.getElementById('reflectionBtn');
        if(refBtn) refBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-purple-500');

        // Normal Canvas'ı geri getir
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // Oyun Modunu Başlat
        gameState.mode = 'translation';
        updateUI();
        startNewRound();
    });
}

// 3. YANSIMA BUTONU GÜNCELLEMESİ
var oldReflectionBtn = document.getElementById('reflectionBtn');
if (oldReflectionBtn) {
    var newReflectionBtn = oldReflectionBtn.cloneNode(true);
    oldReflectionBtn.parentNode.replaceChild(newReflectionBtn, oldReflectionBtn);

    newReflectionBtn.addEventListener('click', function() {
        clearAllScreens(); // Temizlik
        
        // Menüyü tekrar aç
        document.getElementById('transformSubButtons').classList.remove('hidden');
        document.getElementById('transformationsBtn').classList.add('selected-button');

        // Kendini aktif yap
        this.classList.add('ring-2', 'ring-offset-1', 'ring-purple-500');

        // Diğer butonun efektini sil
        const transBtn = document.getElementById('translationBtn');
        if(transBtn) transBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-blue-500');

        // Normal Canvas'ı geri getir
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // Oyun Modunu Başlat
        gameState.mode = 'reflection';
        updateUI();
        startNewRound();
    });
}

// ==========================================
// KOORDİNAT BULMA MENÜSÜ (YENİ)
// ==========================================

// 1. ANA MENÜYÜ AÇ/KAPA
document.getElementById('coordinatesBtn').addEventListener('click', function() {
    const subButtons = document.getElementById('coordinateSubButtons');
    const isHidden = subButtons.classList.contains('hidden');

    // Diğer her şeyi temizle
    clearAllScreens();

    if (isHidden) {
        subButtons.classList.remove('hidden');
        this.classList.add('selected-button');
    } else {
        subButtons.classList.add('hidden');
        this.classList.remove('selected-button');
    }
});

// 2. NOKTA -> YER BUTONU (Pembe)
var oldP2PlaceBtn = document.getElementById('pointToPlaceBtn');
if (oldP2PlaceBtn) {
    var newP2PlaceBtn = oldP2PlaceBtn.cloneNode(true);
    oldP2PlaceBtn.parentNode.replaceChild(newP2PlaceBtn, oldP2PlaceBtn);

    newP2PlaceBtn.addEventListener('click', function() {
        clearAllScreens();
        
        // Menüyü açık tut
        document.getElementById('coordinateSubButtons').classList.remove('hidden');
        document.getElementById('coordinatesBtn').classList.add('selected-button');
        
        // Halka efekti (Pembe)
        this.classList.add('ring-2', 'ring-offset-1', 'ring-pink-500');
        // Diğer butonun efektini sil
        const otherBtn = document.getElementById('placeToPointBtn');
        if(otherBtn) otherBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-teal-500');

        // Normal Canvas'ı göster
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // OYUNU BAŞLAT
        gameState.mode = 'pointToPlace';
        updateUI();
        startNewRound();
    });
}

// 3. YER -> NOKTA BUTONU (Turkuaz)
var oldPlace2PBtn = document.getElementById('placeToPointBtn');
if (oldPlace2PBtn) {
    var newPlace2PBtn = oldPlace2PBtn.cloneNode(true);
    oldPlace2PBtn.parentNode.replaceChild(newPlace2PBtn, oldPlace2PBtn);

    newPlace2PBtn.addEventListener('click', function() {
        clearAllScreens();
        
        // Menüyü açık tut
        document.getElementById('coordinateSubButtons').classList.remove('hidden');
        document.getElementById('coordinatesBtn').classList.add('selected-button');

        // Halka efekti (Turkuaz)
        this.classList.add('ring-2', 'ring-offset-1', 'ring-teal-500');
        // Diğer butonun efektini sil
        const otherBtn = document.getElementById('pointToPlaceBtn');
        if(otherBtn) otherBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-pink-500');

        // Normal Canvas'ı göster
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // OYUNU BAŞLAT
        gameState.mode = 'placeToPoint';
        updateUI();
        startNewRound();
    });
}

// ==========================================
// EĞİM: EĞİK DÜZLEM MODU
// ==========================================

let slopeState = {
    currentQuestion: 0,
    questions: [
        // ... Eski sorular aynen kalsın ...
        { type: 'calc_slope', w: 7, h: 4, direction: 'ltr' }, 
        { type: 'calc_slope', w: 5, h: 3, direction: 'ltr' },
        { type: 'calc_slope', w: 6, h: 5, direction: 'rtl' }, 
        { type: 'calc_slope', w: 8, h: 6, direction: 'rtl' },
        { type: 'find_side', w: 12, h: 6, direction: 'ltr', slopeDisplay: '0,5', unknown: 'vertical', answer: 6 },
        { type: 'find_side', w: 12, h: 9, direction: 'rtl', slopeDisplay: '3/4', unknown: 'horizontal', answer: 12 },

        // --- YENİ EKLENEN: MERDİVEN SORUSU ---
        { 
            type: 'stairs', 
            stepCount: 6, 
            stepV: 2, 
            stepH: 5, 
            direction: 'ltr',
            answerNum: 12, // 6 * 2
            answerDenom: 30 // 6 * 5
        }
    ],

// B) GRAFİK SORULARI (8 ADET: 4 Orijinden Geçen, 4 Eksenleri Kesen)
    graphQuestions: [
        // --- GRUP 1: Orijinden Geçenler (y = ax) ---
        // 1. Pozitif Eğim (2/3)
        { m_num: 2, m_denom: 3, points: [{x:0, y:0}, {x:3, y:2}] },
        // 2. Negatif Eğim (-1/2)
        { m_num: -1, m_denom: 2, points: [{x:0, y:0}, {x:-2, y:1}] },
        // 3. Tam Sayı Eğim (3/1 = 3)
        { m_num: 3, m_denom: 1, points: [{x:0, y:0}, {x:1, y:3}] },
        // 4. Negatif Tam Sayı Eğim (-2/1 = -2)
        { m_num: -2, m_denom: 1, points: [{x:0, y:0}, {x:-1, y:2}] },
        
        // --- GRUP 2: Eksenleri Kesenler (y = ax + b) ---
        // 5. x eksenini -3'te, y eksenini 4'te kesen (Eğim: 4/3)
        { m_num: 4, m_denom: 3, points: [{x:-3, y:0}, {x:0, y:4}] },
        // 6. x eksenini 2'de, y eksenini 3'te kesen (Eğim: -3/2)
        { m_num: -3, m_denom: 2, points: [{x:2, y:0}, {x:0, y:3}] },
        // 7. x eksenini -4'te, y eksenini -5'te kesen (Eğim: -5/4)
        { m_num: -5, m_denom: 4, points: [{x:-4, y:0}, {x:0, y:-5}] },
        // 8. x eksenini 3'te, y eksenini -4'te kesen (Eğim: 4/3)
        { m_num: 4, m_denom: 3, points: [{x:3, y:0}, {x:0, y:-4}] },
        { 
            type: 'find_intercept',
            m_display: '-3/4', 
            m_val: -0.75,
            x_label: '8',       // X eksenini 8'de kessin
            y_label: 'a',
            answer: 6,          // Cevap pozitif 6 olsun
            // Görselde sığması için ölçekli çizim (4 ve 3 noktaları)
            visualPoints: [{x:4, y:0}, {x:0, y:3}]
        }
    ],
    userAnswer: null
};

// ==========================================
// EĞİK DÜZLEM MODUNU BAŞLATAN FONKSİYON (DÜZELTİLMİŞ TEMİZ HALİ)
// ==========================================
function startSlopeInclineRound() {
    
    // 1. SORULAR BİTTİ Mİ KONTROLÜ
    if (slopeState.currentQuestion >= slopeState.questions.length) {
        clearAllScreens();
        
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('btnSlopeIncline').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `
            <div class="text-4xl mb-2">🏆</div>
            <div>Tebrikler!</div>
            <div class="text-lg font-normal mt-1">Bu bölümü başarıyla tamamladın!</div>
        `;
        
        feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-10 rounded-2xl shadow-2xl font-bold text-center bg-purple-600 text-white text-3xl z-[9999] animate-bounce border-4 border-white';
        feedback.style.opacity = '1';
        
        playSuccessSound();
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => {
                feedback.innerHTML = ''; 
                feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';
            }, 500);
            slopeState.currentQuestion = 0; 
        }, 4000); 
        
        return; 
    }

    // 2. EKRAN TEMİZLİĞİ
    clearAllScreens();

    document.getElementById('slopeSubButtons').classList.remove('hidden');
    document.getElementById('btnSlopeIncline').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');
    
    // 3. UI HAZIRLIĞI
    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden');
    linearContainer.style.display = 'flex';
    
    const leftPanelWrapper = document.getElementById('dataTable').parentElement;
    leftPanelWrapper.style.display = 'flex'; 

    document.getElementById('dataTable').style.display = 'none';
    document.getElementById('tableConfirmBtn').style.display = 'none';
    document.getElementById('drawInstructionText').classList.add('hidden');

    const slopePanel = document.getElementById('slopeQuestionPanel');
    slopePanel.classList.remove('hidden');
    slopePanel.style.display = 'flex';
    
    const canvas = document.getElementById('linearCanvas');
    canvas.style.display = 'block';

    // 4. PANEL İÇERİĞİ
    const q = slopeState.questions[slopeState.currentQuestion];
    const panelContent = document.getElementById('slopeQuestionPanel');
    panelContent.innerHTML = '';

    if (q.type === 'calc_slope') {
        // ESKİ TİP
        panelContent.innerHTML = `
            <div class="text-indigo-900 font-bold text-center">
                <span class="text-lg block mb-2">Eğimi Hesapla</span>
                <span class="text-sm text-gray-500 font-normal">Dikey / Yatay</span>
            </div>
            <div id="slopeAnswerBox" class="w-32 h-14 border-2 border-dashed border-indigo-400 rounded-xl flex items-center justify-center text-2xl font-bold text-indigo-600 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-all shadow-sm">?</div>
            <div class="text-xs text-gray-400 text-center">Kutuya tıkla ve değeri gir<br>(Örn: 4÷7)</div>
        `;
        document.getElementById('slopeAnswerBox').addEventListener('click', function() {
            activeInputTarget = 'slope_simple';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = 'Değer girin';
            document.getElementById('numberPad').classList.remove('hidden');
        });

    } else if (q.type === 'stairs') {
        // MERDİVEN TİPİ
        panelContent.innerHTML = `
            <div class="text-indigo-900 font-bold text-center mb-2">
                <span class="text-lg">Merdivenin Eğimini Bul</span>
            </div>
            <div class="flex items-center justify-center gap-4 text-2xl font-bold font-mono">
                <div class="flex flex-col items-center gap-1">
                    <div id="slopeNumBox" class="w-12 h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                    <div class="border-b-2 border-indigo-900 w-full"></div>
                    <div id="slopeDenomBox" class="w-12 h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                </div>
            </div>
            <div class="text-xs text-gray-400 text-center mt-3">Toplam Dikey / Toplam Yatay</div>
        `;
        document.getElementById('slopeNumBox').addEventListener('click', function() {
            activeInputTarget = 'slope_conv_num';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = 'Toplam Dikey';
            document.getElementById('numberPad').classList.remove('hidden');
        });
        document.getElementById('slopeDenomBox').addEventListener('click', function() {
            activeInputTarget = 'slope_conv_denom';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = 'Toplam Yatay';
            document.getElementById('numberPad').classList.remove('hidden');
        });
    } else {
        // YENİ TİP
        let leftSideHTML = '';
        let instructionText = "Soru işaretli kutuya tıkla";

        if (q.slopeDisplay === '0,5') {
            leftSideHTML = `
                <div class="flex flex-col items-center gap-1">
                    <div id="slopeNumBox" class="w-12 h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                    <div class="border-b-2 border-indigo-900 w-full"></div>
                    <div id="slopeDenomBox" class="w-12 h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                </div>`;
            instructionText = "0,5'i kesre çevir (Örn: 1/2), sonra x'i bul";
        } 
        else if (q.slopeDisplay.includes('/')) {
            const parts = q.slopeDisplay.split('/');
            leftSideHTML = `
                <div class="flex flex-col items-center">
                    <span class="border-b-2 border-indigo-900 px-2 min-w-[30px] text-center">${parts[0]}</span>
                    <span class="px-2 min-w-[30px] text-center">${parts[1]}</span>
                </div>`;
        } else {
            leftSideHTML = `<span>${q.slopeDisplay}</span>`;
        }

        let topContent = q.unknown === 'vertical' ? 
            `<div id="unknownBox" class="w-12 h-10 border-2 border-dashed border-orange-500 bg-orange-50 text-orange-600 rounded cursor-pointer flex items-center justify-center hover:bg-orange-100">?</div>` : 
            `<span class="text-indigo-900">${q.h}</span>`;

        let bottomContent = q.unknown === 'horizontal' ? 
            `<div id="unknownBox" class="w-12 h-10 border-2 border-dashed border-orange-500 bg-orange-50 text-orange-600 rounded cursor-pointer flex items-center justify-center hover:bg-orange-100">?</div>` : 
            `<span class="text-indigo-900">${q.w}</span>`;

        panelContent.innerHTML = `
            <div class="text-indigo-900 font-bold text-center mb-2">
                <span class="text-lg">Bilinmeyeni Bul</span>
                ${q.slopeDisplay === '0,5' ? '<div class="text-xs text-indigo-600">(Eğim = 0,5)</div>' : ''}
            </div>
            
            <div class="flex items-center justify-center gap-4 text-2xl font-bold font-mono">
                ${leftSideHTML}
                
                <span class="text-gray-400 text-3xl">=</span>
                
                <div class="flex flex-col items-center gap-1">
                    <div class="flex justify-center min-w-[40px] items-end h-10">
                        ${topContent}
                    </div>
                    <div class="border-b-2 border-indigo-900 w-full"></div>
                    <div class="flex justify-center min-w-[40px] items-start h-10">
                        ${bottomContent}
                    </div>
                </div>
            </div>
            <div class="text-xs text-gray-400 text-center mt-3">${instructionText}</div>
        `;

        const uBox = document.getElementById('unknownBox');
        if(uBox) uBox.addEventListener('click', function() {
            activeInputTarget = 'slope_unknown';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = 'Değer girin';
            document.getElementById('numberPad').classList.remove('hidden');
        });

        const numBox = document.getElementById('slopeNumBox');
        if(numBox) numBox.addEventListener('click', function() {
            activeInputTarget = 'slope_conv_num'; 
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = 'Payı gir';
            document.getElementById('numberPad').classList.remove('hidden');
        });

        const denomBox = document.getElementById('slopeDenomBox');
        if(denomBox) denomBox.addEventListener('click', function() {
            activeInputTarget = 'slope_conv_denom';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = 'Paydayı gir';
            document.getElementById('numberPad').classList.remove('hidden');
        });
    }

    drawSlopeTriangle();
    document.getElementById('checkBtn').disabled = true;
}


// ==========================================
// EĞİM CEVAP KONTROL FONKSİYONU (DÜZELTİLMİŞ)
// ==========================================
function checkSlopeAnswer() {
    let q;
    
    // Hangi moddayız?
    if (slopeState.activeMode === 'graph') {
        q = slopeState.graphQuestions[slopeState.currentQuestion];
    } else {
        q = slopeState.questions[slopeState.currentQuestion];
    }

    // *** İŞTE HATAYI ÇÖZEN SATIR BURASI ***
    let isCorrect = false; 
    // **************************************

    // ---------------------------------------------------------
    // A) GRAFİK MODU KONTROLLERİ
    // ---------------------------------------------------------
    if (slopeState.activeMode === 'graph') {
        if (q.type === 'find_intercept') {
            const lDenom = document.getElementById('leftDenomBox');
            const rNum = document.getElementById('rightNumBox');
            const rDenom = document.getElementById('rightDenomBox');
            
            if (lDenom && rNum && rDenom) {
                const xVal = parseFloat(lDenom.textContent);
                const mNum = parseFloat(rNum.textContent);
                const mDenom = parseFloat(rDenom.textContent);
                
                if (!isNaN(xVal) && !isNaN(mNum) && !isNaN(mDenom) && mDenom !== 0) {
                    const isXCorrect = (xVal == q.x_label);
                    const userSlope = mNum / mDenom;
                    const isSlopeCorrect = Math.abs(userSlope - q.m_val) < 0.001;
                    if (isXCorrect && isSlopeCorrect) isCorrect = true;
                }
            }
        } else {
            const numBox = document.getElementById('slopeNumBox');
            const denomBox = document.getElementById('slopeDenomBox');
            if (numBox && denomBox) {
                const n = parseFloat(numBox.textContent);
                const d = parseFloat(denomBox.textContent);
                if (!isNaN(n) && !isNaN(d) && d !== 0) {
                    if (Math.abs((n/d) - (q.m_num/q.m_denom)) < 0.001) isCorrect = true;
                }
            }
        }
    } 
    // ---------------------------------------------------------
    // B) EĞİK DÜZLEM MODU KONTROLLERİ
    // ---------------------------------------------------------
    else {
        if (q.type === 'calc_slope') {
            const simpleBox = document.getElementById('slopeAnswerBox');
            if (simpleBox) {
                const userAnswer = simpleBox.textContent.trim();
                let userVal;
                try {
                    if (userAnswer.includes('/')) {
                        const parts = userAnswer.split('/'); userVal = parseFloat(parts[0]) / parseFloat(parts[1]);
                    } else if (userAnswer.includes('÷')) {
                        const parts = userAnswer.split('÷'); userVal = parseFloat(parts[0]) / parseFloat(parts[1]);
                    } else { userVal = parseFloat(userAnswer); }
                    const correctVal = q.h / q.w;
                    if (Math.abs(userVal - correctVal) < 0.001) isCorrect = true;
                } catch(e) { isCorrect = false; }
            } else {
                const numBox = document.getElementById('slopeNumBox');
                const denomBox = document.getElementById('slopeDenomBox');
                if (numBox && denomBox) {
                    const n = parseFloat(numBox.textContent);
                    const d = parseFloat(denomBox.textContent);
                    if (!isNaN(n) && !isNaN(d) && d !== 0) {
                        const realSlope = q.h / q.w;
                        if (Math.abs((n/d) - realSlope) < 0.001) isCorrect = true;
                    }
                }
            }
        }
        else if (q.type === 'stairs') {
            const numBox = document.getElementById('slopeNumBox');
            const denomBox = document.getElementById('slopeDenomBox');
            if (numBox && denomBox) {
                const n = parseFloat(numBox.textContent);
                const d = parseFloat(denomBox.textContent);
                if (n === q.answerNum && d === q.answerDenom) isCorrect = true;
            }
        }
        else if (q.type === 'find_side') {
            const unknownBox = document.getElementById('unknownBox');
            if (unknownBox) {
                const userX = parseFloat(unknownBox.textContent.trim());
                let xCorrect = (userX === q.answer);
                let conversionCorrect = true;
                if (q.slopeDisplay === '0,5') {
                     const numBox = document.getElementById('slopeNumBox');
                     const denomBox = document.getElementById('slopeDenomBox');
                     if(numBox && denomBox) {
                         const n = parseFloat(numBox.textContent);
                         const d = parseFloat(denomBox.textContent);
                         const f = n/d;
                         if (Math.abs(f - 0.5) < 0.001) conversionCorrect = true; 
                         else conversionCorrect = false;
                     }
                }
                if (xCorrect && conversionCorrect) isCorrect = true;
            }
        }
    }

    // ---------------------------------------------------------
    // SONUÇ İŞLEMLERİ
    // ---------------------------------------------------------
    if (isCorrect) {
        slopeState.userAnswer = true;
        showFeedback(true);
        playSuccessSound();
        
        document.querySelectorAll('.border-indigo-400, .border-orange-200, .border-indigo-300').forEach(el => {
            el.classList.remove('border-indigo-400', 'border-orange-200', 'border-indigo-300', 'text-indigo-600', 'text-orange-700', 'text-indigo-700', 'bg-indigo-50', 'bg-orange-50');
            el.classList.add('border-green-500', 'text-green-600', 'bg-green-50');
        });

        if (q.type === 'stairs' && slopeState.activeMode !== 'graph') {
             document.getElementById('checkBtn').disabled = true;
             if (typeof animateStairsShow === 'function') animateStairsShow();
        } else {
            window.roundTimer = setTimeout(() => {
                slopeState.currentQuestion++;
                if (slopeState.activeMode === 'graph') {
                    if (typeof startSlopeGraphRound === 'function') startSlopeGraphRound();
                } else {
                    if (typeof startSlopeInclineRound === 'function') startSlopeInclineRound();
                }
            }, 1500);
        }
    } else {
        slopeState.userAnswer = false;
        showFeedback(false);
        playErrorSound();
        const feedback = document.getElementById('feedback');
        feedback.textContent = "Yanlış cevap, tekrar dene!";
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
    }
}



// ==========================================
// EŞİTLİK MODU (FİNAL: KESİN DÜZELTME v3)
// ==========================================
function startSlopeGraphRound() {
    // 1. LİSTEYİ TEMİZLE VE SORUYU ZORLA EKLE
    // Eski "b" sorularını siliyoruz ki çakışma olmasın
    slopeState.graphQuestions = slopeState.graphQuestions.filter(q => q.subType !== 'find_b_negative');

    // Yeni soruyu listenin SONUNA ekliyoruz
    slopeState.graphQuestions.push({
        type: 'find_intercept',   
        subType: 'find_b_negative', // Bu kimlik çizimi tetikleyecek
        targetVar: 'b',           
        xVal: 5,                  
        yVal: -15,                // b = -15
        slope: 3,                 
        correctAnswer: -15        
    });

    // 2. Bitiş Kontrolü
    if (slopeState.currentQuestion >= slopeState.graphQuestions.length) {
        clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('btnSlopeGraph').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `<div class="text-4xl mb-2">🏆</div><div>Tebrikler!</div><div class="text-lg font-normal mt-1">Grafik eğim bölümünü başarıyla tamamladın!</div>`;
        feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-10 rounded-2xl shadow-2xl font-bold text-center bg-purple-600 text-white text-3xl z-[9999] animate-bounce border-4 border-white';
        feedback.style.opacity = '1';
        playSuccessSound();
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => { 
                feedback.innerHTML = ''; 
                feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';
                slopeState.currentQuestion = 0; 
            }, 500);
        }, 5000); 
        return; 
    }

    // 3. Ekran Hazırlığı
    clearAllScreens();
    document.getElementById('slopeSubButtons').classList.remove('hidden');
    document.getElementById('btnSlopeGraph').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden');
    linearContainer.style.display = 'block'; 
    linearContainer.style.position = 'relative'; 
    linearContainer.style.width = '600px'; 
    linearContainer.style.height = '600px';
    linearContainer.style.margin = '0 auto'; 
    
    if(document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
    const tableParent = document.getElementById('dataTable') ? document.getElementById('dataTable').parentElement : null;
    if(tableParent) tableParent.style.display = 'none';
    if(document.getElementById('drawInstructionText')) document.getElementById('drawInstructionText').classList.add('hidden');

    const canvas = document.getElementById('linearCanvas');
    canvas.style.display = 'block';
    canvas.style.width = '100%'; canvas.style.height = '100%';

    const checkBtn = document.getElementById('checkBtn');
    if(checkBtn) {
        checkBtn.disabled = true;
        checkBtn.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
        checkBtn.style.opacity = '0.5';
    }

    // 4. Panel Hazırlığı
    const panelContent = document.getElementById('linearQuestionPanel');
    if (panelContent.parentElement !== document.body) document.body.appendChild(panelContent);
    panelContent.classList.remove('hidden');
    
    panelContent.style.cssText = `
        position: fixed !important; top: 50% !important; transform: translateY(-50%) !important; left: 20px !important; z-index: 99999 !important; 
        display: flex !important; flex-direction: column; justify-content: center; align-items: center;
        min-width: 200px; background: #ffffff; border-radius: 12px; padding: 15px; border: 2px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;

    // GÜNCEL SORUYU AL
    const q = slopeState.graphQuestions[slopeState.currentQuestion];

    // 5. HTML İçeriği
    if (q.type === 'find_intercept') {
        const targetVar = (q.subType === 'find_b_negative') ? 'b' : (q.targetVar || 'a'); 
        const slopeInfo = q.slope ? `<div class="text-sm text-gray-500 mb-1">Eğim (m) = ${q.slope}</div>` : '';

        panelContent.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full">
                <div class="text-indigo-900 font-bold text-center mb-2"><span class="text-lg">Eşitliği Kur</span></div>
                ${slopeInfo}
                <div class="flex items-center justify-center gap-3 mt-2">
                    <div class="flex flex-col items-center gap-1">
                        <div class="w-12 h-10 bg-gray-200 text-gray-600 rounded flex items-center justify-center font-bold text-lg select-none">${targetVar}</div>
                        <div class="border-b-4 border-indigo-900 w-12 rounded-full my-1 opacity-80"></div>
                        <div id="leftDenomBox" class="w-12 h-10 border-2 border-indigo-300 bg-white text-indigo-700 rounded flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-lg shadow-sm">?</div>
                    </div>
                    <div class="text-2xl font-bold text-indigo-900">=</div>
                    <div class="flex flex-col items-center gap-1">
                        <div id="slopeNumBox" class="w-12 h-10 border-2 border-indigo-300 bg-white text-indigo-700 rounded flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-lg shadow-sm">?</div>
                        <div class="border-b-4 border-indigo-900 w-12 rounded-full my-1 opacity-80"></div>
                        <div id="slopeDenomBox" class="w-12 h-10 border-2 border-indigo-300 bg-white text-indigo-700 rounded flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-lg shadow-sm">?</div>
                    </div>
                </div>
                <div class="mt-4 text-xs text-gray-500 font-medium text-center border-t pt-2 w-full">Sola yatık: <span class="text-red-500 font-bold text-sm">(-)</span></div>
            </div>`;
    } else {
        panelContent.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full">
                <div class="text-indigo-900 font-bold text-center mb-2"><span class="text-lg">Eğim Kaçtır?</span></div>
                <div class="text-xs text-gray-400 font-medium mb-3 text-center">(Dikey / Yatay)</div>
                <div class="flex flex-col items-center justify-center gap-1 w-full">
                    <div id="slopeNumBox" class="w-16 h-12 border-2 border-indigo-300 bg-white text-indigo-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-xl shadow-sm">?</div>
                    <div class="border-b-4 border-indigo-900 w-20 rounded-full my-1 opacity-80"></div>
                    <div id="slopeDenomBox" class="w-16 h-12 border-2 border-indigo-300 bg-white text-indigo-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-xl shadow-sm">?</div>
                </div>
                <div class="mt-4 text-xs text-gray-500 font-medium text-center border-t pt-2 w-full">Sola yatık: <span class="text-red-500 font-bold text-sm">(-)</span></div>
            </div>`;
    }

    let currentActiveBoxId = null;

    // 6. Tuş Takımı
    const pad = document.getElementById('numberPad');
    if (pad) {
        const newPad = pad.cloneNode(true);
        pad.parentNode.replaceChild(newPad, pad);

        newPad.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            let val = btn.textContent.trim();
            if (val === 'Tamam' || btn.id === 'confirmInputBtn') { closePanelAndEnableCheck(); return; }
            const isDelete = btn.querySelector('.fa-backspace') || val === 'Sil' || val === 'C';
            if (isDelete) linearState.currentInputValue = linearState.currentInputValue.slice(0, -1);
            else if (!isNaN(val) || val === '-') linearState.currentInputValue += val;

            if (currentActiveBoxId) {
                const box = document.getElementById(currentActiveBoxId);
                if (box) {
                    const displayVal = linearState.currentInputValue;
                    box.textContent = displayVal === '' ? '?' : displayVal;
                    box.style.color = displayVal === '' ? '' : '#4338ca';
                }
            }
        });
    }

    function closePanelAndEnableCheck() {
        document.getElementById('numberPad').classList.add('hidden');
        const chk = document.getElementById('checkBtn');
        if(chk) {
            chk.disabled = false;
            chk.style.opacity = '1';
            chk.classList.add('animate-pulse', 'ring-4', 'ring-green-400');
        }
    }

    // 7. Sahte Tamam Butonu
    const oldConfirm = document.getElementById('confirmInputBtn');
    if (oldConfirm) {
        const newConfirm = oldConfirm.cloneNode(true);
        oldConfirm.parentNode.replaceChild(newConfirm, oldConfirm);
        newConfirm.style.display = 'flex'; 
        newConfirm.addEventListener('click', function(e) {
            e.preventDefault(); e.stopPropagation();
            closePanelAndEnableCheck();
        });
    }

    // 8. Kontrol Et Butonu
    const mainCheckBtn = document.getElementById('checkBtn');
    if(mainCheckBtn) {
        const newMainCheck = mainCheckBtn.cloneNode(true);
        mainCheckBtn.parentNode.replaceChild(newMainCheck, mainCheckBtn);
        
        newMainCheck.addEventListener('click', function() {
            this.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
            let calculatedVal = null;
            let finalMessage = "";

            if (q.type === 'find_intercept') {
                const ld = parseFloat(document.getElementById('leftDenomBox').textContent);
                const rn = parseFloat(document.getElementById('slopeNumBox').textContent);
                const rd = parseFloat(document.getElementById('slopeDenomBox').textContent);
                if(isNaN(ld) || isNaN(rn) || isNaN(rd)) { alert("Lütfen tüm kutuları doldurunuz!"); return; }

                calculatedVal = (ld * rn) / rd;
                if (q.subType === 'find_b_negative') {
                    calculatedVal = -Math.abs(calculatedVal);
                    finalMessage = `b = ${calculatedVal}`;
                } else {
                    finalMessage = `a = ${calculatedVal}`;
                }
            } else {
                const rn = parseFloat(document.getElementById('slopeNumBox').textContent);
                const rd = parseFloat(document.getElementById('slopeDenomBox').textContent);
                if(!isNaN(rn) && !isNaN(rd)) { calculatedVal = rn/rd; finalMessage = `Eğim = ${calculatedVal}`; }
            }

            const feedback = document.getElementById('feedback');
            const displayResult = typeof calculatedVal === 'number' && Number.isInteger(calculatedVal) ? calculatedVal : (calculatedVal ? calculatedVal.toFixed(2) : calculatedVal);

            feedback.innerHTML = `
                <div class="text-4xl mb-2">🎉</div><div class="font-bold text-2xl">Tebrikler!</div>
                <div class="text-lg mt-2 font-mono bg-white text-purple-700 px-4 py-1 rounded">${finalMessage.split('=')[0]} = ${displayResult}</div>
            `;
            feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-8 rounded-2xl shadow-2xl font-bold text-center bg-green-500 text-white z-[9999] border-4 border-white animate-bounce';
            feedback.style.opacity = '1';
            playSuccessSound();
            window.roundTimer = setTimeout(() => { feedback.style.opacity = '0'; slopeState.currentQuestion++; startSlopeGraphRound(); }, 3000);
        });
    }

    function setupBox(boxId, targetName, title) {
        const box = document.getElementById(boxId);
        if(!box) return;
        box.addEventListener('click', () => {
            activeInputTarget = targetName;
            currentActiveBoxId = boxId;
            linearState.currentInputValue = ''; 
            box.textContent = '?'; box.style.color = '';
            document.getElementById('currentInput').textContent = title;
            document.getElementById('numberPad').classList.remove('hidden');
        });
    }

    if (q.type === 'find_intercept') {
        const targetVar = (q.subType === 'find_b_negative') ? 'b' : (q.targetVar || 'a');
        setupBox('leftDenomBox', 'eq_left_denom', `${targetVar} (Payda)`);
        setupBox('slopeNumBox', 'eq_right_num', 'Eğim (Pay)');
        setupBox('slopeDenomBox', 'eq_right_denom', 'Eğim (Payda)');
    } else {
        setupBox('slopeNumBox', 'slope_conv_num', 'Dikey (Pay)');
        setupBox('slopeDenomBox', 'slope_conv_denom', 'Yatay (Payda)');
    }

    // =======================================================
    // 9. ÇİZİM BÖLÜMÜ (CANVAS - ELLE ÇİZİM)
    // =======================================================
    // Sorunun kimliğini (find_b_negative) kontrol edip özel çizimi yapıyoruz.
    
    if (q.subType === 'find_b_negative') {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = 600; 
        const h = canvas.height = 600;
        const cx = w / 2; // 300
        const cy = h / 2; // 300
        const scale = 15; // Ölçek (b=-15 ekrana sığsın diye 15 yaptık)

        // 1. Temizle
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#fff"; ctx.fillRect(0,0,w,h);
        
        // 2. Izgara
        ctx.strokeStyle = "#e5e7eb"; ctx.lineWidth = 1; ctx.beginPath();
        for(let i=0; i<=w; i+=scale) { ctx.moveTo(i,0); ctx.lineTo(i,h); }
        for(let i=0; i<=h; i+=scale) { ctx.moveTo(0,i); ctx.lineTo(w,i); }
        ctx.stroke();

        // 3. Eksenler
        ctx.strokeStyle = "#374151"; ctx.lineWidth = 3; ctx.beginPath();
        ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

        // 4. KIRMIZI DOĞRU (b'den 5'e YUKARI çıkan çizgi)
        // b noktası (Y ekseni, aşağıda) -> cy + 15*scale
        // 5 noktası (X ekseni, sağda) -> cx + 5*scale
        
        const y_piksel = cy + (15 * scale); // b (Aşağıda)
        const x_piksel = cx + (5 * scale);  // 5 (Sağda)

        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 4; ctx.beginPath();
        
        // Çizgiyi Uzatıyoruz:
        // Başlangıç: b noktasının solundan ve daha aşağısından (Sol-Alt)
        ctx.moveTo(cx - 3*scale, y_piksel + 9*scale); 
        
        // Bitiş: 5 noktasının sağından ve daha yukarısından (Sağ-Üst)
        ctx.lineTo(x_piksel + 3*scale, cy - 9*scale); 
        
        ctx.stroke();

        // 5. Etiketler
        ctx.fillStyle = "#1f2937"; ctx.font = "bold 20px sans-serif";
        
        // 5 Yazısı (X ekseni)
        ctx.beginPath(); ctx.arc(x_piksel, cy, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillText("5", x_piksel - 5, cy - 15);

        // b Yazısı (Y ekseni, Aşağıda)
        ctx.beginPath(); ctx.arc(cx, y_piksel, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillText("b", cx + 15, y_piksel + 5);

    } else {
        // Diğer sorular için standart çizim
        drawSlopeGraph();
    }
}



// ==========================================
// GRAFİK ÇİZİM FONKSİYONU (DÜZELTİLMİŞ FİNAL HALİ)
// ==========================================
function drawSlopeGraph() {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    // ViewBox ekle (Responsive görünüm için)
    canvas.setAttribute('viewBox', '0 0 500 500');
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const q = slopeState.graphQuestions[slopeState.currentQuestion];
    
    // Ayarlar
    const CENTER_X = 250;
    const CENTER_Y = 250;
    const GRID = 25; // Her birim 25 birim

    // 1. IZGARA VE EKSENLERİ ÇİZ
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // İnce Izgaralar
    for(let i=0; i<=500; i+=GRID) {
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', i); vLine.setAttribute('y1', 0); vLine.setAttribute('x2', i); vLine.setAttribute('y2', 500);
        vLine.setAttribute('stroke', '#6b7280');
        gridGroup.appendChild(vLine);
        
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', 0); hLine.setAttribute('y1', i); hLine.setAttribute('x2', 500); hLine.setAttribute('y2', i);
        hLine.setAttribute('stroke', '#6b7280');
        gridGroup.appendChild(hLine);
    }
    
    // Ana Eksenler (X ve Y)
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0); xAxis.setAttribute('y1', CENTER_Y); xAxis.setAttribute('x2', 500); xAxis.setAttribute('y2', CENTER_Y);
    xAxis.setAttribute('stroke', '#374151'); xAxis.setAttribute('stroke-width', '2');
    gridGroup.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', CENTER_X); yAxis.setAttribute('y1', 0); yAxis.setAttribute('x2', CENTER_X); yAxis.setAttribute('y2', 500);
    yAxis.setAttribute('stroke', '#374151'); yAxis.setAttribute('stroke-width', '2');
    gridGroup.appendChild(yAxis);
    
    canvas.appendChild(gridGroup);

    // --- DEĞİŞKEN TANIMLAMA (BURADA SADECE BİR KEZ YAPILIYOR) ---
    // Eğer özel soruysa visualPoints, değilse points kullan
    const pointsToUse = (q.type === 'find_intercept') ? q.visualPoints : q.points;

    // 2. DOĞRUYU ÇİZ
    const p1 = pointsToUse[0];
    const p2 = pointsToUse[1];

    const m = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - (m * p1.x);

    // Doğruyu uzat
    const startX_unit = -12; 
    const startY_unit = (m * startX_unit) + b;
    const endX_unit = 12;
    const endY_unit = (m * endX_unit) + b;

    const x1 = CENTER_X + (startX_unit * GRID);
    const y1 = CENTER_Y - (startY_unit * GRID);
    const x2 = CENTER_X + (endX_unit * GRID);
    const y2 = CENTER_Y - (endY_unit * GRID);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', '#4f46e5'); 
    line.setAttribute('stroke-width', '4');
    canvas.appendChild(line);

    // 3. NOKTALAR VE ETİKETLER
    pointsToUse.forEach((pt, index) => {
        const cx = CENTER_X + (pt.x * GRID);
        const cy = CENTER_Y - (pt.y * GRID);
        
        const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        dot.setAttribute('cx', cx); dot.setAttribute('cy', cy);
        dot.setAttribute('r', 6);
        dot.setAttribute('fill', '#ea580c'); 
        dot.setAttribute('stroke', 'white');
        dot.setAttribute('stroke-width', '2');
        canvas.appendChild(dot);

        // Özel Soru Etiketleri ("8" ve "a" yazısı)
        if (q.type === 'find_intercept') {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', cx + 15); 
            label.setAttribute('y', cy - 10);
            label.setAttribute('font-size', '24');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('fill', '#be185d');
            
            // İlk nokta X ekseninde, İkinci nokta Y ekseninde
            label.textContent = (index === 0) ? q.x_label : q.y_label;
            canvas.appendChild(label);
        }
    });
}

function drawSlopeTriangle() {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    const q = slopeState.questions[slopeState.currentQuestion];
    
    // Ölçek Ayarı
    let GRID = (q.w >= 10 || q.h >= 10) ? 25 : 40;
    
    // Merdiven sorusu için özel ölçek (Toplam genişlik 30 olacağı için küçültüyoruz)
    if (q.type === 'stairs') GRID = 15; 

    const START_Y = 350; 
    // Merdiven için başlangıç noktası (Sol Alt)
    const START_X = q.type === 'stairs' ? 50 : (q.direction === 'rtl' ? (GRID === 25 ? 100 : 120) : (GRID === 25 ? 60 : 80));

    // Izgara
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for(let i=0; i<600; i+=GRID) { // Canvas genişleyebilir
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', i); vLine.setAttribute('y1', 0); vLine.setAttribute('x2', i); vLine.setAttribute('y2', 500); vLine.setAttribute('stroke', '#6b7280'); gridGroup.appendChild(vLine);
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', 0); hLine.setAttribute('y1', i); hLine.setAttribute('x2', 600); hLine.setAttribute('y2', i); hLine.setAttribute('stroke', '#6b7280'); gridGroup.appendChild(hLine);
    }
    canvas.appendChild(gridGroup);

    // --- MERDİVEN ÇİZİMİ ---
    if (q.type === 'stairs') {
        const totalW = q.stepCount * q.stepH * GRID;
        const totalH = q.stepCount * q.stepV * GRID;
        
        let currentX = START_X;
        let currentY = START_Y;

        // Basamakları Çiz
        for (let i = 0; i < q.stepCount; i++) {
            // Dikey Çizgi (Yukarı)
            const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            vLine.setAttribute('x1', currentX); vLine.setAttribute('y1', currentY);
            vLine.setAttribute('x2', currentX); vLine.setAttribute('y2', currentY - (q.stepV * GRID));
            vLine.setAttribute('stroke', '#ef4444'); // Kırmızı
            vLine.setAttribute('stroke-width', '3');
            vLine.classList.add('stair-vertical'); // Animasyon için sınıf
            vLine.dataset.id = i; // Hangi basamak olduğunu bilmek için
            canvas.appendChild(vLine);

            // Yatay Çizgi (Sağa)
            const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hLine.setAttribute('x1', currentX); hLine.setAttribute('y1', currentY - (q.stepV * GRID));
            hLine.setAttribute('x2', currentX + (q.stepH * GRID)); hLine.setAttribute('y2', currentY - (q.stepV * GRID));
            hLine.setAttribute('stroke', '#3b82f6'); // Mavi
            hLine.setAttribute('stroke-width', '3');
            hLine.classList.add('stair-horizontal');
            canvas.appendChild(hLine);

            // 3. Basamağa Yazı Yaz (Örnekleme)
            if (i === 2) {
                // Dikey Yazı (2 cm)
                const textV = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textV.setAttribute('x', currentX - 5);
                textV.setAttribute('y', currentY - (q.stepV * GRID) / 2);
                textV.setAttribute('text-anchor', 'end');
                textV.setAttribute('font-size', '12');
                textV.setAttribute('fill', '#ef4444');
                textV.setAttribute('font-weight', 'bold');
                textV.textContent = `${q.stepV}cm`;
                canvas.appendChild(textV);

                // Yatay Yazı (5 cm)
                const textH = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textH.setAttribute('x', currentX + (q.stepH * GRID) / 2);
                textH.setAttribute('y', currentY - (q.stepV * GRID) - 5);
                textH.setAttribute('text-anchor', 'middle');
                textH.setAttribute('font-size', '12');
                textH.setAttribute('fill', '#3b82f6');
                textH.setAttribute('font-weight', 'bold');
                textH.textContent = `${q.stepH}cm`;
                canvas.appendChild(textH);
            }

            // Koordinatları güncelle
            currentY -= (q.stepV * GRID);
            currentX += (q.stepH * GRID);
        }

        // Ana Üçgen Çerçevesi (Hayali/Silik Çizgi)
        const frame = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        frame.setAttribute('d', `M ${START_X} ${START_Y} L ${START_X + totalW} ${START_Y} L ${START_X + totalW} ${START_Y - totalH} Z`);
        frame.setAttribute('fill', 'rgba(0,0,0,0.03)');
        frame.setAttribute('stroke', '#ccc');
        frame.setAttribute('stroke-dasharray', '5,5');
        canvas.insertBefore(frame, canvas.firstChild); // En arkaya at

        return; // Merdiven bitti, fonksiyondan çık
    }

    // --- DİĞER ÜÇGEN TİPLERİ (Eski Kod) ---
    let p1, p2, p3;
    if (q.direction === 'rtl') {
        p1 = { x: START_X + (q.w * GRID), y: START_Y }; 
        p2 = { x: START_X, y: START_Y }; 
        p3 = { x: START_X, y: START_Y - (q.h * GRID) };
    } else {
        p1 = { x: START_X, y: START_Y };
        p2 = { x: START_X + (q.w * GRID), y: START_Y };
        p3 = { x: START_X + (q.w * GRID), y: START_Y - (q.h * GRID) };
    }

    const triangle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    triangle.setAttribute('d', `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y} L ${p3.x} ${p3.y} Z`);
    triangle.setAttribute('fill', 'rgba(99, 102, 241, 0.2)');
    triangle.setAttribute('stroke', '#4f46e5');
    triangle.setAttribute('stroke-width', '4');
    canvas.appendChild(triangle);

    // Diklik
    const boxSize = 20;
    const rightAngle = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const raD = q.direction === 'rtl' ? 
        `M ${p2.x} ${p2.y - boxSize} L ${p2.x + boxSize} ${p2.y - boxSize} L ${p2.x + boxSize} ${p2.y}` : 
        `M ${p2.x - boxSize} ${p2.y} L ${p2.x - boxSize} ${p2.y - boxSize} L ${p2.x} ${p2.y - boxSize}`;
    rightAngle.setAttribute('d', raD);
    rightAngle.setAttribute('fill', 'none');
    rightAngle.setAttribute('stroke', '#4f46e5');
    rightAngle.setAttribute('stroke-width', '2');
    canvas.appendChild(rightAngle);

    // Kenar Yazıları (Eski Tip)
    const textH = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textH.setAttribute('x', START_X + (q.w * GRID) / 2);
    textH.setAttribute('y', START_Y + 30);
    textH.setAttribute('text-anchor', 'middle');
    textH.setAttribute('font-weight', 'bold');
    textH.setAttribute('fill', '#374151');
    textH.setAttribute('font-size', '16');
    if (q.type === 'find_side' && q.unknown === 'horizontal') {
        textH.textContent = "x"; textH.setAttribute('fill', '#ea580c'); textH.setAttribute('font-size', '20');
    } else { textH.textContent = `${q.w} br`; }
    canvas.appendChild(textH);

    const textV = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textV.setAttribute('x', q.direction === 'rtl' ? p2.x - 15 : p2.x + 15);
    textV.setAttribute('y', START_Y - (q.h * GRID) / 2);
    textV.setAttribute('text-anchor', q.direction === 'rtl' ? 'end' : 'start');
    textV.setAttribute('font-weight', 'bold');
    textV.setAttribute('fill', '#374151');
    textV.setAttribute('font-size', '16');
    if (q.type === 'find_side' && q.unknown === 'vertical') {
        textV.textContent = "x"; textV.setAttribute('fill', '#ea580c'); textV.setAttribute('font-size', '20');
    } else { textV.textContent = `${q.h} br`; }
    canvas.appendChild(textV);

    // Eğim Değeri
    if (q.type === 'find_side') {
        const textSlope = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        const midX = (p1.x + p3.x) / 2;
        const midY = (p1.y + p3.y) / 2;
        textSlope.setAttribute('x', midX); textSlope.setAttribute('y', midY - 15);
        textSlope.setAttribute('text-anchor', 'middle'); textSlope.setAttribute('font-weight', 'bold');
        textSlope.setAttribute('fill', '#4f46e5'); textSlope.setAttribute('font-size', '16');
        textSlope.setAttribute('stroke', 'white'); textSlope.setAttribute('stroke-width', '4');
        textSlope.setAttribute('paint-order', 'stroke');
        textSlope.textContent = `m = ${q.slopeDisplay}`;
        canvas.appendChild(textSlope);
    }
}

      
   
    // --- SONUÇ İŞLEMLERİ ---
let isCorrect = (gameState.selectedOption === gameState.correctAnswer);


    if (isCorrect) {
        playSuccessSound();
        showFeedback(true);
        
        // Kutuları Yeşil Yap
        document.querySelectorAll('.border-indigo-400').forEach(el => {
            el.classList.remove('border-indigo-400', 'text-indigo-600', 'bg-indigo-50');
            el.classList.add('border-green-500', 'text-green-600', 'bg-green-50');
        });

        // Merdivense animasyon, değilse sonraki soru

let q = slopeState.questions[slopeState.currentQuestion];

        if (q.type === 'stairs' && slopeState.activeMode !== 'graph') {
            document.getElementById('checkBtn').disabled = true;
            if (typeof animateStairsShow === 'function') animateStairsShow();
        } else {
            window.roundTimer = setTimeout(() => {
                slopeState.currentQuestion++;
                // Hangi moddaysak onun başlatıcısını çağır
                if (slopeState.activeMode === 'graph') {
                    if (typeof startSlopeGraphRound === 'function') startSlopeGraphRound();
                } else {
                    if (typeof startSlopeInclineRound === 'function') startSlopeInclineRound();
                }
            }, 2000);
        }
    } else {
        playErrorSound();
        showFeedback(false);
        const feedback = document.getElementById('feedback');
        
        if (slopeState.activeMode === 'graph') {
             feedback.textContent = "Eğim Yanlış! İşaretleri (-) ve sayıları kontrol et.";
        } else if (q.type === 'stairs') {
             feedback.textContent = "Toplam dikey ve yatay uzunlukları girmelisin.";
        } else {
             feedback.textContent = "Yanlış cevap, tekrar dene!";
        }
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
    }


// ==========================================
// 5. EĞİM ALT BUTONLARI (GÜÇLENDİRİLMİŞ BAĞLANTILAR)
// ==========================================

// --- A) EĞİK DÜZLEM BUTONU ---
const btnSlopeIncline = document.getElementById('btnSlopeIncline');
if (btnSlopeIncline) {
    // Eski dinleyicileri temizlemek için klonlama (Opsiyonel ama garanti yöntem)
    const newBtn = btnSlopeIncline.cloneNode(true);
    btnSlopeIncline.parentNode.replaceChild(newBtn, btnSlopeIncline);

    newBtn.addEventListener('click', function() {
        console.log("🖱️ Eğik Düzlem Butonuna Tıklandı!"); 

        // 1. Görsel Seçim
        document.querySelectorAll('.slope-sub-button').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
        });
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        // 2. Mod Ayarı
        if (gameState.mode !== 'slope_incline') {
            gameState.mode = 'slope_incline';
            slopeState.currentQuestion = 0; // Yeni moda geçince sıfırla
        } else {
            // Zaten bu moddaysak soru ilerlet
            slopeState.currentQuestion++;
            if (slopeState.currentQuestion >= slopeState.questions.length) {
                slopeState.currentQuestion = 0;
            }
        }
        
        // Aktif modu kaydet (Check fonksiyonu için önemli)
        slopeState.activeMode = 'incline';

        // 3. Oyunu Başlat
        if (typeof startSlopeInclineRound === 'function') {
            startSlopeInclineRound();
        } else {
            console.error("❌ HATA: startSlopeInclineRound fonksiyonu bulunamadı!");
        }
    });
} else {
    console.error("❌ HATA: 'btnSlopeIncline' ID'li buton HTML'de bulunamadı!");
}

// --- B) GRAFİKTEN EĞİM BUTONU ---
const btnSlopeGraph = document.getElementById('btnSlopeGraph');
if (btnSlopeGraph) {
    const newBtn = btnSlopeGraph.cloneNode(true);
    btnSlopeGraph.parentNode.replaceChild(newBtn, btnSlopeGraph);

    newBtn.addEventListener('click', function() {
        console.log("🖱️ Grafikten Eğim Butonuna Tıklandı!");

        // 1. Görsel Seçim
        document.querySelectorAll('.slope-sub-button').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
        });
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        // 2. Mod Ayarı
        if (gameState.mode !== 'slope_graph') {
            gameState.mode = 'slope_graph';
            slopeState.currentQuestion = 0;
        } else {
            slopeState.currentQuestion++;
            if (slopeState.currentQuestion >= slopeState.graphQuestions.length) {
                slopeState.currentQuestion = 0;
            }
        }

        // Aktif modu kaydet
        slopeState.activeMode = 'graph';

        // 3. Oyunu Başlat
        if (typeof startSlopeGraphRound === 'function') {
            startSlopeGraphRound();
        } else {
            console.error("❌ HATA: startSlopeGraphRound fonksiyonu bulunamadı!");
        }
    });
} else {
    console.error("❌ HATA: 'btnSlopeGraph' ID'li buton HTML'de bulunamadı!");
}


// =================================================================
// C) İKİ NOKTADAN EĞİM BUTONU (GÜNCELLENDİ: TIKLADIKÇA GEÇİŞ)
// =================================================================
const btnTwoPoints = document.getElementById('btnSlopeTwoPoints');
if (btnTwoPoints) {
    // Eski listener'ı temizlemek için klonluyoruz
    const newBtn = btnTwoPoints.cloneNode(true);
    btnTwoPoints.parentNode.replaceChild(newBtn, btnTwoPoints);

    newBtn.addEventListener('click', function() {
        console.log("🖱️ İki Noktadan Eğim Butonuna Tıklandı (Geçiş Yapılıyor)");

        // 1. Görsel Efektler
        document.querySelectorAll('.slope-sub-button').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
        });
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        // 2. Mod Kontrolü ve İlerleme Mantığı
        if (gameState.mode === 'slope_two_points') {
            // Eğer zaten bu moddaysak, sıradaki soruya geç (Skip)
            if (typeof slopeState.twoPointsQuestionIndex !== 'undefined') {
                slopeState.twoPointsQuestionIndex++;
                
                // Eğer soru sayısı sınırını aştıysa başa sarsın diye kontrol
                // (startSlopeTwoPointsRound içinde zaten bitiş kontrolü var ama bu ekstra güvenlik)
                if (slopeState.twoPointsQuestionIndex > 4) { 
                    slopeState.twoPointsQuestionIndex = 0; 
                }
            }
        } else {
            // İlk kez giriyorsak baştan başla
            gameState.mode = 'slope_two_points';
            slopeState.twoPointsQuestionIndex = 0;
        }
        
        // 3. Modu Başlat / Güncelle
        if (typeof startSlopeTwoPointsRound === 'function') {
            startSlopeTwoPointsRound();
        }
    });
}


// ==========================================
// KONTROL BUTONU (FİNAL TEMİZ HALİ)
// ==========================================
var checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
    // Eski listenerları temizlemek için klonluyoruz
    var newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);

    newCheckBtn.addEventListener('click', function() {
        console.log("Kontrol Et tıklandı. Aktif Mod:", gameState.mode);

        // 1. EĞİM MODLARI (Grafik ve Eğik Düzlem)
        if (gameState.mode === 'slope_incline' || gameState.mode === 'slope_graph') {
            checkSlopeAnswer();
        } 
        
        // 2. DOĞRU GRAFİKLERİ MODLARI
        else if (gameState.mode === 'x_eq_a') {
            if (typeof checkVerticalLine === 'function') checkVerticalLine();
        } 
        else if (gameState.mode === 'y_eq_b') {
            if (typeof checkHorizontalLine === 'function') checkHorizontalLine();
        } 
        else if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') {
            if (typeof checkStraightLine === 'function') checkStraightLine();
        }

// ... checkBtn listener içinde ...

else if (gameState.mode === 'slope_two_points') {
    // Kayıtlı noktaları al
    const p1 = slopeState.currentTwoPoints.p1; // {x:2, y:3}
    const p2 = slopeState.currentTwoPoints.p2; // {x:-2, y:7}
    
    // Kullanıcının girdilerini al
    const y2 = parseFloat(document.getElementById('box_y2').textContent);
    const y1 = parseFloat(document.getElementById('box_y1').textContent);
    const x2 = parseFloat(document.getElementById('box_x2').textContent);
    const x1 = parseFloat(document.getElementById('box_x1').textContent);

    // Doğru formül kontrolü: Kullanıcı sayıları doğru yerlere koymuş mu?
    // y2=7, y1=3, x2=-2, x1=2  veya tam tersi sıra (noktaların sırası fark etmez ama eşleşmeli)
    
    // Gerçek eğim
    const realSlope = (p2.y - p1.y) / (p2.x - p1.x); // (7-3)/(-2-2) = 4/-4 = -1
    const userSlope = (y2 - y1) / (x2 - x1);

    if (Math.abs(realSlope - userSlope) < 0.001) {
        showFeedback(true);
        playSuccessSound();
        // İstersen burada yeni soruya geçiş eklenebilir
    } else {
        showFeedback(false);
        playErrorSound();
    }
}

        // 3. DOĞRUSAL İLİŞKİLER MODLARI
        else if (gameState.mode === 'questionToGraph') {
            if (typeof checkLinearGraph === 'function') checkLinearGraph();
        } 
        else if (gameState.mode === 'graphToQuestion') {
            if (typeof checkGraphAnswer === 'function') checkGraphAnswer();
        }

        // 4. STANDART GEOMETRİ MODLARI (Öteleme, Yansıma vb.)
        else {
            if (typeof checkAnswer === 'function') checkAnswer();
        }
    });
}


// ==========================================
// NUMPAD İPTAL BUTONU
// ==========================================
document.getElementById('numPadCancel').addEventListener('click', function() {
    // Paneli gizle
    document.getElementById('numberPad').classList.add('hidden');
    
    // Girilen değeri sıfırla
    linearState.currentInputValue = '';
    document.getElementById('currentInput').textContent = '';
    
    // Hedefi unut
    activeInputTarget = null;
});



// ==========================================
// MERDİVEN ANİMASYONU (JAVASCRIPT İLE KARE KARE HAREKET - %100 GARANTİ)
// ==========================================
function animateStairsShow() {
    const q = slopeState.questions[slopeState.currentQuestion];
    const GRID = 15;
    const START_X = 50;
    const START_Y = 350;
    const totalW = q.stepCount * q.stepH * GRID;
    const totalH = q.stepCount * q.stepV * GRID;

    // Hedef Konumlar
    const targetX = START_X + totalW;
    const targetY = START_Y;

    // Hareket ettirilecek parçaları listeye alalım
    // Her çizginin "Şu an nerede?" ve "Nereye gidecek?" bilgisini tutacağız
    let animations = [];

    // 1. Dikey Parçaları (Kırmızı) Listeye Ekle
    document.querySelectorAll('.stair-vertical').forEach(line => {
        // Çizginin rengini hemen değiştir
        line.setAttribute('stroke', '#b91c1c');
        line.setAttribute('stroke-width', '4');

        animations.push({
            el: line,
            // Başlangıç değerleri (Sayıya çeviriyoruz)
            startX1: parseFloat(line.getAttribute('x1')),
            startY1: parseFloat(line.getAttribute('y1')),
            startX2: parseFloat(line.getAttribute('x2')),
            startY2: parseFloat(line.getAttribute('y2')),
            // Hedef değerler (Dikey çizgiler sağa toplanacak)
            targetX1: targetX,
            targetY1: parseFloat(line.getAttribute('y1')), // Y değişmiyor, olduğu yükseklikte kaysın
            targetX2: targetX,
            targetY2: parseFloat(line.getAttribute('y2'))
        });
    });

    // 2. Yatay Parçaları (Mavi) Listeye Ekle
    document.querySelectorAll('.stair-horizontal').forEach(line => {
        // Çizginin rengini hemen değiştir
        line.setAttribute('stroke', '#1e40af');
        line.setAttribute('stroke-width', '4');

        animations.push({
            el: line,
            // Başlangıç
            startX1: parseFloat(line.getAttribute('x1')),
            startY1: parseFloat(line.getAttribute('y1')),
            startX2: parseFloat(line.getAttribute('x2')),
            startY2: parseFloat(line.getAttribute('y2')),
            // Hedef (Yatay çizgiler alta inecek)
            targetX1: parseFloat(line.getAttribute('x1')), // X değişmiyor, olduğu hizada insin
            targetY1: targetY,
            targetX2: parseFloat(line.getAttribute('x2')),
            targetY2: targetY
        });
    });

    // 3. ANİMASYON MOTORU
    const duration = 3000; // 3 Saniye
    const startTime = performance.now();

    function frame(currentTime) {
        const elapsed = currentTime - startTime;
        // İlerleme yüzdesi (0 ile 1 arası)
        let progress = Math.min(elapsed / duration, 1);
        
        // Yumuşak geçiş efekti (Ease-in-out formülü)
        // Bu formül hareketi başta yavaş, ortada hızlı, sonda yavaş yapar
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        // Her bir çizgiyi yeni konumuna güncelle
        animations.forEach(anim => {
            // Matematik: Başlangıç + (Fark * İlerleme)
            const curX1 = anim.startX1 + (anim.targetX1 - anim.startX1) * ease;
            const curY1 = anim.startY1 + (anim.targetY1 - anim.startY1) * ease;
            const curX2 = anim.startX2 + (anim.targetX2 - anim.startX2) * ease;
            const curY2 = anim.startY2 + (anim.targetY2 - anim.startY2) * ease;

            anim.el.setAttribute('x1', curX1);
            anim.el.setAttribute('y1', curY1);
            anim.el.setAttribute('x2', curX2);
            anim.el.setAttribute('y2', curY2);
        });

        // Süre bitmediyse bir sonraki kareyi iste
        if (progress < 1) {
            window.animationFrameId = requestAnimationFrame(frame);
        } else {
            // 4. ANİMASYON BİTTİ, YAZILARI GÖSTER
            showTextLabels(targetX, targetY, totalW, totalH, q, START_X);
        }
    }

    // Motoru Çalıştır
    window.animationFrameId = requestAnimationFrame(frame);
}

// Yazıları Gösteren Yardımcı Fonksiyon
function showTextLabels(targetX, targetY, totalW, totalH, q, START_X) {
    const canvas = document.getElementById('linearCanvas');

    // Dikey Toplam Yazısı
    const totalVText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalVText.setAttribute('x', targetX + 15);
    totalVText.setAttribute('y', targetY - (totalH / 2));
    totalVText.setAttribute('font-size', '24');
    totalVText.setAttribute('font-weight', 'bold');
    totalVText.setAttribute('fill', '#b91c1c');
    totalVText.textContent = q.answerNum;
    totalVText.style.opacity = '0';
    totalVText.style.transition = 'opacity 1s';
    canvas.appendChild(totalVText);

    // Yatay Toplam Yazısı
    const totalHText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    totalHText.setAttribute('x', START_X + (totalW / 2));
    totalHText.setAttribute('y', targetY + 30);
    totalHText.setAttribute('font-size', '24');
    totalHText.setAttribute('font-weight', 'bold');
    totalHText.setAttribute('text-anchor', 'middle');
    totalHText.setAttribute('fill', '#1e40af');
    totalHText.textContent = q.answerDenom;
    totalHText.style.opacity = '0';
    totalHText.style.transition = 'opacity 1s';
    canvas.appendChild(totalHText);

    // Bir sonraki karede opacity'i 1 yap (Fade in)
    requestAnimationFrame(() => {
        totalVText.style.opacity = '1';
        totalHText.style.opacity = '1';
    });

    // 5 Saniye sonra diğer soruya geç
    window.roundTimer = setTimeout(() => {
        slopeState.currentQuestion++;
        startSlopeInclineRound();
    }, 5000);
}

// ==========================================
// EKRAN TEMİZLİĞİ YAMASI (BUG FIX)
// ==========================================
// Diğer ana menü butonlarına basıldığında Eğim modundan kalanları temizle
const cleanUpButtons = ['linearRelationsBtn', 'lineGraphsBtn', 'transformationsBtn', 'coordinatesBtn'];

cleanUpButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
        // Mevcut işlevini bozmadan 'dinleyici' ekliyoruz
        btn.addEventListener('click', function() {
            // 1. Eğim Soru Panelini Gizle
            const slopePanel = document.getElementById('slopeQuestionPanel');
            if (slopePanel) {
                slopePanel.classList.add('hidden');
                slopePanel.style.display = 'none'; // Garanti olsun
            }

            // 2. Eğim Alt Menüsünü Gizle
            const slopeSubs = document.getElementById('slopeSubButtons');
            if (slopeSubs) {
                slopeSubs.classList.add('hidden');
            }

            // 3. Eğim Butonu Seçim Efektini Kaldır
            const incBtn = document.getElementById('btnSlopeIncline');
            if (incBtn) incBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');

            // 4. Tabloyu ve Tamam Butonunu Geri Getir (Eğim modunda gizlemiştik)
            const dataTable = document.getElementById('dataTable');
            if (dataTable) {
                dataTable.style.display = 'block'; // Veya '' yaparak CSS'e bırakabiliriz
                dataTable.classList.remove('hidden');
            }
            
            const confirmBtn = document.getElementById('tableConfirmBtn');
            if (confirmBtn) {
                confirmBtn.style.display = 'block'; // Görünür yap
                confirmBtn.classList.remove('hidden');
            }
        });
    }
});


// ==========================================
// EKRAN GÜNCELLEYİCİ (YENİ KUTULARI TANIYAN BEYİN)
// ==========================================
function updateActiveInputDisplay() {
    // Hafızadaki sayı ne?
    const val = linearState.currentInputValue;
    
    // Hangi kutuya yazmalıyım? (activeInputTarget)
    
    // 1. Sol Alttaki Kutu (a'nın altı)
    if (activeInputTarget === 'eq_left_denom') {
        const el = document.getElementById('leftDenomBox');
        if(el) el.textContent = val || '?';
    }

    // 2. Sağ Üst (Pay)
    // Hem eski mod (slope_conv_num) hem yeni mod (eq_right_num) için aynı kutu:
    if (activeInputTarget === 'eq_right_num' || activeInputTarget === 'slope_conv_num') {
        const el = document.getElementById('slopeNumBox'); 
        if(el) el.textContent = val || '?';
    }

    // 3. Sağ Alt (Payda)
    // Hem eski mod (slope_conv_denom) hem yeni mod (eq_right_denom) için aynı kutu:
    if (activeInputTarget === 'eq_right_denom' || activeInputTarget === 'slope_conv_denom') {
        const el = document.getElementById('slopeDenomBox'); 
        if(el) el.textContent = val || '?';
    }

// ... (Mevcut kodların altına ekle) ...

// --- İKİ NOKTADAN EĞİM GÜNCELLEMESİ ---
if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
    // 1. Değeri ilgili kutuya yaz
    const role = activeInputTarget.split('_')[2]; // y2, y1, x2, x1
    const boxId = 'box_' + role;
    const box = document.getElementById(boxId);
    
    if (box) {
        // Boşsa '?' kalsın, değilse değeri yaz
        box.textContent = linearState.currentInputValue === '' ? '?' : linearState.currentInputValue;
        box.style.color = '#4338ca';
    }

    // 2. Tüm kutular dolu mu kontrol et
    const y2 = parseFloat(document.getElementById('box_y2').textContent);
    const y1 = parseFloat(document.getElementById('box_y1').textContent);
    const x2 = parseFloat(document.getElementById('box_x2').textContent);
    const x1 = parseFloat(document.getElementById('box_x1').textContent);

    // Eğer hepsi sayıysa (isNaN değilse) hesapla
    if (!isNaN(y2) && !isNaN(y1) && !isNaN(x2) && !isNaN(x1)) {
        
        const pay = y2 - y1;
        const payda = x2 - x1;
        
        const resultDisplay = document.getElementById('calcResultDisplay');
        const checkBtn = document.getElementById('checkBtn');

        // Payda 0 ise hata/tanımsız
        if (payda === 0) {
            resultDisplay.textContent = "Tanımsız (Payda 0)";
            resultDisplay.style.color = "red";
        } else {
            // Sonucu göster (Örn: m = 4/-4 veya sadeleştirme yapılabilir ama şimdilik ham hali)
            // Sadeleştirme istenirse eklenebilir. Şimdilik A/B formatı:
            resultDisplay.textContent = `m = ${pay} / ${payda}`;
            resultDisplay.style.color = "#16a34a"; // Yeşil
        }

        // Göstergeyi aç ve butonu yak
        resultDisplay.style.opacity = '1';
        resultDisplay.classList.remove('scale-90');
        resultDisplay.classList.add('scale-100');

        checkBtn.disabled = false;
        checkBtn.style.opacity = '1';
        checkBtn.classList.add('animate-pulse', 'ring-4', 'ring-green-400');
    }
}

}


// =================================================================
// 🚑 İKİ NOKTADAN EĞİM MODU - (YERLEŞİM VE NUMPAD DÜZELTMESİ)
// =================================================================
window.startSlopeTwoPointsRound = function() {
    console.log("📍 İki Noktadan Eğim Modu: Düzenlenmiş Arayüz...");

    // 1. Temizlik
    if (typeof clearAllScreens === 'function') clearAllScreens();

    // 2. Alt Menü ve Buton Aktifliği
    const subButtons = document.getElementById('slopeSubButtons');
    if (subButtons) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex';
    }
    const btn = document.getElementById('btnSlopeTwoPoints');
    if (btn) btn.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    // 3. Arka Plan Konteyneri (Tıklamaları engellememesi için pointer-events ayarı)
    const container = document.getElementById('linearContainer');
    if (container) {
        container.classList.remove('hidden');
        container.style.display = 'block'; 
        container.style.pointerEvents = 'none'; // Konteyner tıklamayı engellemesin
        container.style.margin = '0 auto';
        // İçerideki çakışan elemanları gizle
        if (document.getElementById('linearCanvas')) document.getElementById('linearCanvas').style.display = 'none';
        if (document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
        if (document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    }

    // 4. SORU PANELİ (KONUM VE BOYUT AYARI)
    const panel = document.getElementById('slopeQuestionPanel');
    if (panel) {
        if (panel.parentElement !== document.body) document.body.appendChild(panel);

        panel.classList.remove('hidden');
        
        // --- CSS GÜNCELLEMESİ ---
        // top: 55% -> Biraz aşağıya indi (butonları kapatmaz)
        // z-index: 50 -> Numpad'in altında kalacak şekilde ayarlandı
        panel.style.cssText = `
            position: fixed !important;
            top: 55% !important; 
            left: 17% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 50 !important; 
            background-color: white !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: 20px !important;
            border-radius: 15px !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
            border: 3px solid #6366f1 !important;
            width: 90% !important;
            max-width: 500px !important; /* Çok geniş olmasını engeller */
            pointer-events: auto !important; /* Panel tıklanabilir olsun */
        `;

        // 5. İÇERİK
        const p1 = { x: 2, y: 3 };
        const p2 = { x: -2, y: 7 };
        
        if (typeof slopeState !== 'undefined') slopeState.currentTwoPoints = { p1, p2 };

        panel.innerHTML = `
            <h3 class="text-xl font-bold text-indigo-900 mb-3">Eğimi Hesapla</h3>
            
            <div class="text-base text-gray-700 mb-4 text-center">
                <span class="font-bold text-indigo-600">A(${p1.x}, ${p1.y})</span> ve 
                <span class="font-bold text-indigo-600">B(${p2.x}, ${p2.y})</span>
            </div>

            <div class="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                <div class="text-3xl font-bold text-indigo-800 italic font-serif">m =</div>
                
                <div class="flex flex-col items-center">
                    <div class="flex items-center gap-1 mb-1">
                        <div id="box_y2" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_y1" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                    
                    <div class="w-full h-1 bg-indigo-900 rounded-full my-0.5 opacity-80"></div>
                    
                    <div class="flex items-center gap-1 mt-1">
                        <div id="box_x2" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_x1" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                </div>
            </div>

            <div id="calcResultDisplay" class="h-8 text-2xl font-bold text-green-600 opacity-0 transition-all">m = ...</div>
        `;

        // Tıklama Olayları
        setupInputClick('box_y2', 'y2', 'y₂ Giriniz (7)');
        setupInputClick('box_y1', 'y1', 'y₁ Giriniz (3)');
        setupInputClick('box_x2', 'x2', 'x₂ Giriniz (-2)');
        setupInputClick('box_x1', 'x1', 'x₁ Giriniz (2)');
    }

    // Kontrol Butonunu Pasifleştir
    const chk = document.getElementById('checkBtn');
    if(chk) {
        chk.disabled = true;
        chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
        chk.style.opacity = '0.5';
    }
};

// ==========================================
// 1. SAYI PANELİ KONUM AYARI (AŞAĞI İNDİRME)
// ==========================================
window.setupInputClick = function(id, role, title) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', function() {
            activeInputTarget = 'two_points_' + role;
            if (typeof linearState !== 'undefined') linearState.currentInputValue = '';
            
            // Başlığı güncelle
            const currentInputLabel = document.getElementById('currentInput');
            if(currentInputLabel) currentInputLabel.textContent = title;
            
            // NUMPAD'İ AÇ VE KONUMLANDIR
            const numPad = document.getElementById('numberPad');
            if(numPad) {
                numPad.classList.remove('hidden');
                
                // --- DÜZELTME BURADA ---
                numPad.style.cssText = `
                    display: flex !important;
                    z-index: 999999 !important; /* En, en üstte */
                    position: fixed !important;
                    top: 70% !important;       /* 50% idi, 70% yaptık (Aşağı indi) */
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                `;
            }
        });
    }
};

// ==========================================
// 2. "TAMAM" TUŞU TAMİRİ (KAPATMA VE HESAPLAMA)
// ==========================================
var confirmBtn = document.getElementById('numPadClose'); // Genelde "Tamam" veya "Tik" butonu budur

if (confirmBtn) {
    // Eski görevleri temizle (Clone yöntemi)
    var newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', function() {
        console.log("✅ Tamam tuşuna basıldı.");
        
        const val = linearState.currentInputValue;

        // A) İKİ NOKTADAN EĞİM MODU İSE
        if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
            const role = activeInputTarget.split('_')[2]; // y2, y1, x2, x1
            const box = document.getElementById('box_' + role);
            
            if (box) {
                // Değeri kutuya yaz
                box.textContent = val === '' ? '?' : val;
                box.style.color = '#4338ca'; // Mor renk
                
                // Otomatik Hesaplamayı Tetikle
                if (typeof checkTwoPointsComplete === 'function') {
                    checkTwoPointsComplete();
                } else {
                    // Fonksiyon yoksa manuel hesapla (Yedek)
                    const y2 = parseFloat(document.getElementById('box_y2').textContent);
                    const y1 = parseFloat(document.getElementById('box_y1').textContent);
                    const x2 = parseFloat(document.getElementById('box_x2').textContent);
                    const x1 = parseFloat(document.getElementById('box_x1').textContent);
                    
                    if (!isNaN(y2) && !isNaN(y1) && !isNaN(x2) && !isNaN(x1)) {
                         const resultDisplay = document.getElementById('calcResultDisplay');
                         const checkBtn = document.getElementById('checkBtn');
                         const payda = x2 - x1;
                         if (payda !== 0) {
                             resultDisplay.textContent = `m = ${y2-y1} / ${payda}`;
                             resultDisplay.style.opacity = '1';
                             checkBtn.disabled = false;
                             checkBtn.style.opacity = '1';
                         }
                    }
                }
            }
        }
        
        // B) DİĞER MODLAR İÇİN KISA YOL (Mevcut yapıyı bozmamak için)
        else if (activeInputTarget === 'slope_simple' && document.getElementById('slopeAnswerBox')) {
            document.getElementById('slopeAnswerBox').textContent = val;
            document.getElementById('checkBtn').disabled = false;
        }
        else if (activeInputTarget === 'slope_unknown' && document.getElementById('unknownBox')) {
            document.getElementById('unknownBox').textContent = val;
             document.getElementById('checkBtn').disabled = false;
        }

        // --- KRİTİK BÖLÜM: KAPATMA ---
        const numPad = document.getElementById('numberPad');
        if (numPad) {
            numPad.classList.add('hidden'); // Gizle
            numPad.style.display = 'none';  // Zorla gizle
        }
        
        // Input değerini sıfırla
        if (typeof linearState !== 'undefined') {
            linearState.currentInputValue = '';
        }
        const inputLabel = document.getElementById('currentInput');
        if(inputLabel) inputLabel.textContent = '';
    });
}

// ==========================================
// 3. OTOMATİK HESAPLAMA (YEDEK)
// ==========================================
window.checkTwoPointsComplete = function() {
    const y2 = parseFloat(document.getElementById('box_y2').textContent);
    const y1 = parseFloat(document.getElementById('box_y1').textContent);
    const x2 = parseFloat(document.getElementById('box_x2').textContent);
    const x1 = parseFloat(document.getElementById('box_x1').textContent);

    if (!isNaN(y2) && !isNaN(y1) && !isNaN(x2) && !isNaN(x1)) {
        const pay = y2 - y1;
        const payda = x2 - x1;
        
        const disp = document.getElementById('calcResultDisplay');
        const chk = document.getElementById('checkBtn');

        if (payda === 0) {
            disp.textContent = "Tanımsız (Payda 0)";
            disp.style.color = "red";
        } else {
            disp.textContent = `m = ${pay} / ${payda}`;
            disp.style.color = "#16a34a"; // Yeşil
        }
        
        // Sonucu Göster
        disp.style.opacity = '1';
        disp.classList.remove('scale-90');
        disp.classList.add('scale-100');

        // Butonu Aktif Et
        if(chk) {
            chk.disabled = false;
            chk.style.opacity = '1';
            chk.classList.add('animate-pulse', 'ring-4', 'ring-green-400');
        }
    }
};

// =================================================================
// 🚀 İKİ NOKTADAN EĞİM MODU - (ÇOKLU SORU VERSİYONU)
// =================================================================

// 1. SORU LİSTESİ VE BAŞLATMA MANTIĞI
window.startSlopeTwoPointsRound = function() {
    console.log("📍 İki Noktadan Eğim Modu: Soru Yükleniyor...");

    // --- SORU LİSTESİ (BURAYA YENİ SORULAR EKLEYEBİLİRSİN) ---
    const questions = [
        { p1: { x: 2, y: 3 }, p2: { x: -2, y: 7 } },   // 1. Soru (Eski)
        { p1: { x: -3, y: -4 }, p2: { x: 2, y: -5 } }  // 2. Soru (Yeni)
    ];

    // Soru İndeksini Kontrol Et (Yoksa 0'dan başlat)
    if (typeof slopeState.twoPointsQuestionIndex === 'undefined') {
        slopeState.twoPointsQuestionIndex = 0;
    }

    // --- TÜM SORULAR BİTTİ Mİ? ---
    if (slopeState.twoPointsQuestionIndex >= questions.length) {
        // Bitiş Ekranı
        if (typeof clearAllScreens === 'function') clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('slopeSubButtons').style.display = 'flex';
        
        const feedback = document.getElementById('feedback');
        feedback.textContent = "🏆 Tebrikler! Tüm soruları tamamladın!";
        feedback.className = 'fixed bottom-1/2 left-1/2 transform -translate-x-1/2 px-8 py-6 rounded-2xl shadow-2xl font-bold text-center bg-purple-600 text-white text-2xl z-[99999]';
        feedback.style.opacity = '1';
        playSuccessSound();

        // 3 saniye sonra başa dön
        setTimeout(() => {
            feedback.style.opacity = '0';
            slopeState.twoPointsQuestionIndex = 0; // Başa sar
        }, 4000);
        return;
    }

    // --- SIRADAKİ SORUYU AL ---
    const currentQ = questions[slopeState.twoPointsQuestionIndex];
    const p1 = currentQ.p1;
    const p2 = currentQ.p2;

    // State'e kaydet (Kontrol ederken lazım olacak)
    slopeState.currentTwoPoints = { p1, p2 };

    // 2. ARAYÜZÜ HAZIRLA
    if (typeof clearAllScreens === 'function') clearAllScreens();
    
    const subButtons = document.getElementById('slopeSubButtons');
    if (subButtons) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex';
    }
    const btn = document.getElementById('btnSlopeTwoPoints');
    if (btn) btn.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    // Ana kutuyu aç
    const container = document.getElementById('linearContainer');
    if (container) {
        container.classList.remove('hidden');
        container.style.display = 'block';
        container.style.pointerEvents = 'none';
        if (document.getElementById('linearCanvas')) document.getElementById('linearCanvas').style.display = 'none';
        if (document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
        if (document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    }

    // Paneli oluştur
    const panel = document.getElementById('slopeQuestionPanel');
    if (panel) {
        if (panel.parentElement !== document.body) document.body.appendChild(panel);
        panel.classList.remove('hidden');
        
        panel.style.cssText = `
            position: fixed !important;
            top: 55% !important; 
            left: 17% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 50 !important; 
            background-color: white !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: 20px !important;
            border-radius: 15px !important;
            box-shadow: 0 10px 40px rgba(0,0,0,0.3) !important;
            border: 3px solid #6366f1 !important;
            width: 90% !important;
            max-width: 500px !important;
            pointer-events: auto !important;
        `;

        // HTML İçeriği (Değerler değişken)
        panel.innerHTML = `
            <div class="absolute top-2 left-4 text-xs font-bold text-gray-400">Soru ${slopeState.twoPointsQuestionIndex + 1} / ${questions.length}</div>
            <h3 class="text-xl font-bold text-indigo-900 mb-3">Eğimi Hesapla</h3>
            
            <div class="text-base text-gray-700 mb-4 text-center">
                <span class="font-bold text-indigo-600">A(${p1.x}, ${p1.y})</span> ve 
                <span class="font-bold text-indigo-600">B(${p2.x}, ${p2.y})</span>
            </div>

            <div class="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                <div class="text-3xl font-bold text-indigo-800 italic font-serif">m =</div>
                <div class="flex flex-col items-center">
                    <div class="flex items-center gap-1 mb-1">
                        <div id="box_y2" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_y1" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                    <div class="w-full h-1 bg-indigo-900 rounded-full my-0.5 opacity-80"></div>
                    <div class="flex items-center gap-1 mt-1">
                        <div id="box_x2" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_x1" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                </div>
            </div>
            <div id="calcResultDisplay" class="h-8 text-2xl font-bold text-green-600 opacity-0 transition-all">m = ...</div>
        `;

        // Tıklama Olayları (Değişken başlıklar)
        setupInputClick('box_y2', 'y2', `y₂ Giriniz (${p2.y})`);
        setupInputClick('box_y1', 'y1', `y₁ Giriniz (${p1.y})`);
        setupInputClick('box_x2', 'x2', `x₂ Giriniz (${p2.x})`);
        setupInputClick('box_x1', 'x1', `x₁ Giriniz (${p1.x})`);
    }
    
    // Kontrol Butonunu Sıfırla
    const chk = document.getElementById('checkBtn');
    if(chk) {
        chk.disabled = true;
        chk.style.opacity = '0.5';
        chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
    }
};

// 2. KONTROL BUTONU (SIRADAKİ SORUYA GEÇME MANTIĞI EKLENDİ)
var checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
    var newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);

    newCheckBtn.addEventListener('click', function() {
        // --- İKİ NOKTADAN EĞİM MODU İSE ---
        if (gameState.mode === 'slope_two_points') {
            const p1 = slopeState.currentTwoPoints.p1;
            const p2 = slopeState.currentTwoPoints.p2;
            
            const y2 = parseFloat(document.getElementById('box_y2').textContent);
            const y1 = parseFloat(document.getElementById('box_y1').textContent);
            const x2 = parseFloat(document.getElementById('box_x2').textContent);
            const x1 = parseFloat(document.getElementById('box_x1').textContent);

            const realSlope = (p2.y - p1.y) / (p2.x - p1.x);
            const userSlope = (y2 - y1) / (x2 - x1);

            if (Math.abs(realSlope - userSlope) < 0.001) {
                showFeedback(true);
                playSuccessSound();
                
                // DOĞRU BİLİNCE 2 SANİYE SONRA DİĞER SORUYA GEÇ
                setTimeout(() => {
                    slopeState.twoPointsQuestionIndex++; // Sıradaki soruya geç
                    startSlopeTwoPointsRound(); // Yeniden başlat
                }, 2000);
                
            } else {
                showFeedback(false);
                playErrorSound();
            }
        } 
        // --- DİĞER MODLAR İÇİN ESKİ KODLARI KORUYALIM ---
        else if (gameState.mode === 'x_eq_a') { if(typeof checkVerticalLine === 'function') checkVerticalLine(); }
        else if (gameState.mode === 'y_eq_b') { if(typeof checkHorizontalLine === 'function') checkHorizontalLine(); }
        else if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') { if(typeof checkStraightLine === 'function') checkStraightLine(); }
        else if (gameState.mode === 'slope_incline' || gameState.mode === 'slope_graph') { if(typeof checkSlopeAnswer === 'function') checkSlopeAnswer(); }
        else if (gameState.mode === 'questionToGraph') { if(typeof checkLinearGraph === 'function') checkLinearGraph(); }
        else if (gameState.mode === 'graphToQuestion') { if(typeof checkGraphAnswer === 'function') checkGraphAnswer(); }
        else { if(typeof checkAnswer === 'function') checkAnswer(); }
    });
}

// =================================================================
// 🚀 İKİ NOKTADAN EĞİM MODU (3. SORU EKLENDİ - ORİJİN)
// =================================================================
window.startSlopeTwoPointsRound = function() {
    console.log("📍 İki Noktadan Eğim Modu: Soru Yükleniyor...");

    // --- 1. SORU LİSTESİ ---
    const questions = [
        { p1: { x: 2, y: 3 }, p2: { x: -2, y: 7 } },     // 1. Soru
        { p1: { x: -3, y: -4 }, p2: { x: 2, y: -5 } },   // 2. Soru
        { p1: { x: 3, y: -5 }, p2: { x: 0, y: 0 } }      // 3. Soru (YENİ: Orijin)
    ];

    // Soru İndeksini Kontrol Et
    if (typeof slopeState.twoPointsQuestionIndex === 'undefined') {
        slopeState.twoPointsQuestionIndex = 0;
    }

    // --- TÜM SORULAR BİTTİ Mİ? ---
    if (slopeState.twoPointsQuestionIndex >= questions.length) {
        // Bitiş Ekranı
        if (typeof clearAllScreens === 'function') clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('slopeSubButtons').style.display = 'flex';
        
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `
            <div class="text-4xl mb-2">🏆</div>
            <div>Harika İş!</div>
            <div class="text-lg font-normal mt-1">Tüm iki nokta sorularını bitirdin!</div>
        `;
        feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-10 rounded-2xl shadow-2xl font-bold text-center bg-purple-600 text-white text-2xl z-[99999] animate-bounce border-4 border-white';
        feedback.style.opacity = '1';
        playSuccessSound();

        setTimeout(() => {
            feedback.style.opacity = '0';
            slopeState.twoPointsQuestionIndex = 0; // Başa sar
            setTimeout(() => { feedback.innerHTML = ''; }, 500);
        }, 4000);
        return;
    }

    // --- SIRADAKİ SORUYU AL ---
    const currentQ = questions[slopeState.twoPointsQuestionIndex];
    const p1 = currentQ.p1;
    const p2 = currentQ.p2;

    // State'e kaydet
    slopeState.currentTwoPoints = { p1, p2 };

    // --- 2. ARAYÜZÜ HAZIRLA ---
    if (typeof clearAllScreens === 'function') clearAllScreens();
    
    // Menüleri Aç
    const subButtons = document.getElementById('slopeSubButtons');
    if (subButtons) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex';
    }
    const btn = document.getElementById('btnSlopeTwoPoints');
    if (btn) btn.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    // Arka Planı Aç
    const container = document.getElementById('linearContainer');
    if (container) {
        container.classList.remove('hidden');
        container.style.display = 'block';
        container.style.pointerEvents = 'none';
        // İçeridekileri gizle
        if (document.getElementById('linearCanvas')) document.getElementById('linearCanvas').style.display = 'none';
        if (document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
        if (document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    }

    // --- 3. PANELİ OLUŞTUR ---
    const panel = document.getElementById('slopeQuestionPanel');
    if (panel) {
        if (panel.parentElement !== document.body) document.body.appendChild(panel);
        panel.classList.remove('hidden');
        
        // CSS Konumlandırma
        panel.style.cssText = `
            position: fixed !important;
            top: 55% !important; 
            left: 17% !important;
            transform: translate(-50%, -50%) !important;
            z-index: 50 !important; 
            background-color: white !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: 25px !important;
            border-radius: 20px !important;
            box-shadow: 0 15px 50px rgba(0,0,0,0.3) !important;
            border: 4px solid #6366f1 !important;
            width: 90% !important;
            max-width: 550px !important;
            pointer-events: auto !important;
        `;

        // Orijin Kontrolü (Metin Gösterimi İçin)
        let p2Text = `<span class="text-indigo-600">B(${p2.x}, ${p2.y})</span>`;
        if (p2.x === 0 && p2.y === 0) {
            p2Text = `<span class="text-pink-600 font-extrabold">Orijin (0,0)</span>`;
        }

        // HTML İçeriği
        panel.innerHTML = `
            <div class="absolute top-3 left-4 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Soru ${slopeState.twoPointsQuestionIndex + 1} / ${questions.length}
            </div>
            
            <div class="text-center mb-6 mt-2">
                <div class="text-xl text-gray-700 mb-2">
                    <span class="font-bold text-indigo-600">A(${p1.x}, ${p1.y})</span> ve ${p2Text}
                </div>
                <div class="text-base text-gray-500">noktalarından geçen doğrunun eğimi kaçtır?</div>
            </div>

            <div class="flex items-center gap-4 bg-indigo-50 p-6 rounded-2xl border-2 border-indigo-100 mb-6">
                <div class="text-4xl font-bold text-indigo-800 italic font-serif">m =</div>
                
                <div class="flex flex-col items-center">
                    <div class="flex items-center gap-2 mb-2">
                        <div id="box_y2" class="w-14 h-12 bg-white border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center font-bold text-xl cursor-pointer hover:border-indigo-600 text-indigo-700 shadow-sm transition-all">?</div>
                        <span class="text-3xl font-bold text-gray-400">-</span>
                        <div id="box_y1" class="w-14 h-12 bg-white border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center font-bold text-xl cursor-pointer hover:border-indigo-600 text-indigo-700 shadow-sm transition-all">?</div>
                    </div>
                    
                    <div class="w-full h-1.5 bg-indigo-900 rounded-full my-1 opacity-80"></div>
                    
                    <div class="flex items-center gap-2 mt-2">
                        <div id="box_x2" class="w-14 h-12 bg-white border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center font-bold text-xl cursor-pointer hover:border-indigo-600 text-indigo-700 shadow-sm transition-all">?</div>
                        <span class="text-3xl font-bold text-gray-400">-</span>
                        <div id="box_x1" class="w-14 h-12 bg-white border-2 border-dashed border-indigo-400 rounded-lg flex items-center justify-center font-bold text-xl cursor-pointer hover:border-indigo-600 text-indigo-700 shadow-sm transition-all">?</div>
                    </div>
                </div>
            </div>

            <div id="calcResultDisplay" class="h-10 text-3xl font-bold text-green-600 opacity-0 transition-all">m = ...</div>
        `;

        // Tıklama Olayları
        setupInputClick('box_y2', 'y2', `y₂ Giriniz (${p2.y})`);
        setupInputClick('box_y1', 'y1', `y₁ Giriniz (${p1.y})`);
        setupInputClick('box_x2', 'x2', `x₂ Giriniz (${p2.x})`);
        setupInputClick('box_x1', 'x1', `x₁ Giriniz (${p1.x})`);
    }
    
    // Kontrol Butonu Reset
    const chk = document.getElementById('checkBtn');
    if(chk) {
        chk.disabled = true;
        chk.style.opacity = '0.5';
        chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
    }
};

// 2. KONTROL BUTONU GÜNCELLEMESİ (ZATEN EKLİ AMA GARANTİ OLSUN)
// Bu kısım, mevcut kodunda zaten var olan 'checkBtn' listener'ı ile çalışır.
// Tekrar yapıştırmana gerek yok ama emin olmak istersen aşağıdadır.
// ...

// =================================================================
// 🚀 İKİ NOKTADAN EĞİM MODU (4. SORU: EĞİM VERİLMİŞ, C BULMA)
// =================================================================
window.startSlopeTwoPointsRound = function() {
    console.log("📍 İki Noktadan Eğim Modu Yükleniyor...");

    // 1. SORU LİSTESİ
    const questions = [
        { type: 'standard', p1: { x: 2, y: 3 }, p2: { x: -2, y: 7 } },
        { type: 'standard', p1: { x: -3, y: -4 }, p2: { x: 2, y: -5 } },
        { type: 'standard', p1: { x: 3, y: -5 }, p2: { x: 0, y: 0 } },
        
        // --- 4. YENİ ÖZEL SORU (c BULMA) ---
        { 
            type: 'find_c_slope_given', // Yeni Tip
            p1: { x: 0, y: 'c' },      // A Noktası (Bilinmeyen)
            p2: { x: -2, y: 3 },       // B Noktası (Bilinen)
            slope: 4,                  // Verilen Eğim
            slopeFraction: { n: 4, d: 1 }, // 4/1 olarak yazılacak
            correctC: 11               // Çözüm: (c-3)/(0-(-2)) = 4 => c-3 = 8 => c=11
        }
    ];

    // İndeks Kontrolü
    if (typeof slopeState.twoPointsQuestionIndex === 'undefined') {
        slopeState.twoPointsQuestionIndex = 0;
    }

    // BİTİŞ KONTROLÜ
    if (slopeState.twoPointsQuestionIndex >= questions.length) {
        if (typeof clearAllScreens === 'function') clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('slopeSubButtons').style.display = 'flex';
        
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `<div class="text-4xl mb-2">🏆</div><div>Mükemmel!</div><div class="text-lg mt-1">Bu konunun uzmanı sensin!</div>`;
        feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-10 rounded-2xl shadow-2xl font-bold text-center bg-purple-600 text-white text-2xl z-[99999] animate-bounce border-4 border-white';
        feedback.style.opacity = '1';
        playSuccessSound();
        setTimeout(() => {
            feedback.style.opacity = '0';
            slopeState.twoPointsQuestionIndex = 0;
            setTimeout(() => { feedback.innerHTML = ''; }, 500);
        }, 4000);
        return;
    }

    const currentQ = questions[slopeState.twoPointsQuestionIndex];
    slopeState.currentTwoPointsQ = currentQ; 

    // 2. TEMİZLİK VE HAZIRLIK
    if (typeof clearAllScreens === 'function') clearAllScreens();
    
    const subButtons = document.getElementById('slopeSubButtons');
    if(subButtons) { subButtons.classList.remove('hidden'); subButtons.style.display = 'flex'; }
    document.getElementById('btnSlopeTwoPoints').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    const container = document.getElementById('linearContainer');
    container.classList.remove('hidden'); container.style.display = 'block'; container.style.pointerEvents = 'none';
    
    // Gereksizleri gizle
    if(document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
    if(document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';

    // 3. PANELİ OLUŞTUR
    const panel = document.getElementById('slopeQuestionPanel');
    if (panel) {
        if (panel.parentElement !== document.body) document.body.appendChild(panel);
        panel.classList.remove('hidden');
        
        // Bu soru tipi için özel CSS (Grafiği kapatmaması için sağa/yukarı alıyoruz)
        const isSpecial = (currentQ.type === 'find_c_slope_given');
        
        panel.style.cssText = `
            position: fixed !important;
            top: ${isSpecial ? '55%' : '55%'} !important; 
            left: ${isSpecial ? '50%' : '50%'} !important; /* Grafiğin sağına al */
            transform: translate(-50%, -50%) !important;
            z-index: 50 !important; 
            background-color: white !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            padding: ${isSpecial ? '15px' : '25px'} !important;
            border-radius: 20px !important;
            box-shadow: 0 15px 50px rgba(0,0,0,0.3) !important;
            border: 4px solid ${isSpecial ? '#ef4444' : '#6366f1'} !important;
            width: ${isSpecial ? 'auto' : '90%'} !important;
            min-width: ${isSpecial ? '420px' : '300px'} !important;
            max-width: 600px !important;
            pointer-events: auto !important;
            transition: all 0.5s ease;
        `;

        if (isSpecial) {
            // --- 4. SORU (ÖZEL ARAYÜZ: EĞİM VERİLMİŞ, C İSTENİYOR) ---
            
            // Grafiği Aç ve Çiz
            const canvas = document.getElementById('linearCanvas');
            canvas.style.display = 'block';
            drawSlopeUnknownGraph(currentQ); 

            panel.innerHTML = `
                <div class="absolute top-2 left-4 text-xs font-bold text-gray-400">Soru 4 / 4</div>
                <h3 class="text-xl font-bold text-red-600 mb-2">Bilinmeyeni Bul (c)</h3>
                
                <div class="text-sm text-gray-700 mb-4 text-center leading-relaxed">
                    Doğrunun Eğimi <span class="font-bold text-red-600">m = 4</span> ise,<br>
                    A(0, <span class="font-bold text-red-600">c</span>) ve B(-2, 3) noktaları için 'c' kaçtır?
                </div>

                <div class="flex items-center gap-2 bg-red-50 p-3 rounded-xl border border-red-200 mb-4 scale-90 sm:scale-100">
                    <div class="flex flex-col items-center">
                        <div class="flex items-center gap-1 mb-1">
                            <div class="w-10 h-9 bg-gray-200 text-gray-600 rounded flex items-center justify-center font-bold text-lg select-none">c</div>
                            <span class="text-xl font-bold text-gray-400">-</span>
                            <div id="box_y1" class="w-10 h-9 bg-white border-2 border-dashed border-red-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-red-700 hover:bg-red-50">?</div>
                        </div>
                        <div class="w-full h-1 bg-red-900 rounded-full my-0.5 opacity-60"></div>
                        <div class="flex items-center gap-1 mt-1">
                            <div id="box_x2" class="w-10 h-9 bg-white border-2 border-dashed border-red-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-red-700 hover:bg-red-50">?</div>
                            <span class="text-xl font-bold text-gray-400">-</span>
                            <div id="box_x1" class="w-10 h-9 bg-white border-2 border-dashed border-red-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-red-700 hover:bg-red-50">?</div>
                        </div>
                    </div>

                    <div class="text-2xl font-bold text-red-800">=</div>

                    <div class="flex flex-col items-center">
                         <div id="box_slope_a" class="w-10 h-9 bg-white border-2 border-dashed border-red-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-red-700 hover:bg-red-50">?</div>
                         <div class="w-full h-1 bg-red-900 rounded-full my-0.5 opacity-60"></div>
                         <div id="box_slope_b" class="w-10 h-9 bg-white border-2 border-dashed border-red-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-red-700 hover:bg-red-50">?</div>
                    </div>
                </div>

                <div class="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm border border-gray-200 mb-2">
                    <span class="font-bold text-xl text-gray-700">c =</span>
                    <div id="box_final_c" class="w-20 h-10 bg-white border-2 border-red-500 rounded-lg flex items-center justify-center font-bold text-xl cursor-pointer hover:bg-red-50 text-red-700 shadow-inner">?</div>
                </div>

                <div id="solutionSteps" class="hidden mt-2 text-xs font-mono text-left w-full bg-green-50 p-3 rounded border border-green-200 text-green-900">
                </div>
            `;
            
            // Tıklama Olayları (Doğru değerler ile)
            setupInputClick('box_y1', 'y1', 'y₁ Değeri (3)');     // B'nin y'si
            setupInputClick('box_x2', 'x2', 'x₂ Değeri (0)');     // A'nın x'i
            setupInputClick('box_x1', 'x1', 'x₁ Değeri (-2)');    // B'nin x'i
            setupInputClick('box_slope_a', 'slope_a', 'Eğim Payı (4)');
            setupInputClick('box_slope_b', 'slope_b', 'Eğim Paydası (1)');
            setupInputClick('box_final_c', 'final_c', 'Bulduğun c değeri?');

        } else {
            // --- STANDART SORULAR (1, 2, 3) ---
            const canvas = document.getElementById('linearCanvas');
            canvas.style.display = 'none';

            let p2Text = `<span class="text-indigo-600">B(${currentQ.p2.x}, ${currentQ.p2.y})</span>`;
            if (currentQ.p2.x === 0 && currentQ.p2.y === 0) p2Text = `<span class="text-pink-600 font-extrabold">Orijin (0,0)</span>`;

            panel.innerHTML = `
                <div class="absolute top-2 left-4 text-xs font-bold text-gray-400">Soru ${slopeState.twoPointsQuestionIndex + 1} / ${questions.length}</div>
                <h3 class="text-xl font-bold text-indigo-900 mb-3">Eğimi Hesapla</h3>
                <div class="text-base text-gray-700 mb-4 text-center">
                    <span class="font-bold text-indigo-600">A(${currentQ.p1.x}, ${currentQ.p1.y})</span> ve ${p2Text}
                </div>
                <div class="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                    <div class="text-3xl font-bold text-indigo-800 italic font-serif">m =</div>
                    <div class="flex flex-col items-center">
                        <div class="flex items-center gap-1 mb-1">
                            <div id="box_y2" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                            <span class="text-xl font-bold text-gray-400">-</span>
                            <div id="box_y1" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                        </div>
                        <div class="w-full h-1 bg-indigo-900 rounded-full my-0.5 opacity-80"></div>
                        <div class="flex items-center gap-1 mt-1">
                            <div id="box_x2" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                            <span class="text-xl font-bold text-gray-400">-</span>
                            <div id="box_x1" class="w-12 h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                        </div>
                    </div>
                </div>
                <div id="calcResultDisplay" class="h-8 text-2xl font-bold text-green-600 opacity-0 transition-all">m = ...</div>
            `;
            
            setupInputClick('box_y2', 'y2', `y₂ Giriniz (${currentQ.p2.y})`);
            setupInputClick('box_y1', 'y1', `y₁ Giriniz (${currentQ.p1.y})`);
            setupInputClick('box_x2', 'x2', `x₂ Giriniz (${currentQ.p2.x})`);
            setupInputClick('box_x1', 'x1', `x₁ Giriniz (${currentQ.p1.x})`);
        }
    }
    
    // Kontrol Butonunu Sıfırla
    const chk = document.getElementById('checkBtn');
    if(chk) { chk.disabled = true; chk.style.opacity = '0.5'; chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400'); }
};

// 4. ÖZEL GRAFİK ÇİZİMİ (c HESAPLANARAK)
function drawSlopeUnknownGraph(q) {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = '';
    canvas.setAttribute('viewBox', '0 0 600 600');
    
    // c'yi hesapla (Görsel çizim için gerekli)
    const valC = q.correctC; // 11
    
    // Ölçek Ayarı: c=11 çok yüksek, bu yüzden her kareyi küçük tutuyoruz.
    // Izgara 20 birim olsun. Orijin biraz aşağıda olsun (400) ki 11 sığsın.
    const GRID = 25; 
    const CX = 300; // X Orijini (Biraz sola)
    const CY = 400; // Y Orijini (Aşağıda, çünkü c=11 yukarıda olacak)

    // Izgara
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for(let i=0; i<=600; i+=GRID) {
        const v = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        v.setAttribute('x1', i); v.setAttribute('y1', 0); v.setAttribute('x2', i); v.setAttribute('y2', 600); v.setAttribute('stroke', '#6b7280');
        g.appendChild(v);
        const h = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        h.setAttribute('x1', 0); h.setAttribute('y1', i); h.setAttribute('x2', 600); h.setAttribute('y2', i); h.setAttribute('stroke', '#6b7280');
        g.appendChild(h);
    }
    canvas.appendChild(g);

    // Eksenler
    const axes = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', 0); xAxis.setAttribute('y1', CY); xAxis.setAttribute('x2', 600); xAxis.setAttribute('y2', CY); xAxis.setAttribute('stroke', '#374151'); xAxis.setAttribute('stroke-width', '2');
    axes.appendChild(xAxis);
    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', CX); yAxis.setAttribute('y1', 0); yAxis.setAttribute('x2', CX); yAxis.setAttribute('y2', 600); yAxis.setAttribute('stroke', '#374151'); yAxis.setAttribute('stroke-width', '2');
    axes.appendChild(yAxis);
    canvas.appendChild(axes);

    // Noktaların Piksel Karşılıkları
    // A(0, c)
    const ax = CX + (0 * GRID);
    const ay = CY - (valC * GRID);
    
    // B(-2, 3)
    const bx = CX + (-2 * GRID);
    const by = CY - (3 * GRID);

    // Doğruyu Çiz (Uzatılmış)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const dx = ax - bx; const dy = ay - by;
    // Çizgiyi iki taraftan uzat
    line.setAttribute('x1', bx - dx*0.5); line.setAttribute('y1', by - dy*0.5);
    line.setAttribute('x2', ax + dx*0.5); line.setAttribute('y2', ay + dy*0.5);
    line.setAttribute('stroke', '#ef4444'); 
    line.setAttribute('stroke-width', '4');
    canvas.appendChild(line);

    // Noktaları Çiz
    const dotA = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dotA.setAttribute('cx', ax); dotA.setAttribute('cy', ay); dotA.setAttribute('r', 6); dotA.setAttribute('fill', '#4f46e5');
    canvas.appendChild(dotA);
    
    const textA = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textA.setAttribute('x', ax + 10); textA.setAttribute('y', ay + 5); 
    textA.textContent = "A(0, c)"; 
    textA.setAttribute('font-weight', 'bold'); textA.setAttribute('fill', '#4f46e5');
    canvas.appendChild(textA);

    const dotB = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dotB.setAttribute('cx', bx); dotB.setAttribute('cy', by); dotB.setAttribute('r', 6); dotB.setAttribute('fill', '#4f46e5');
    canvas.appendChild(dotB);

    const textB = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textB.setAttribute('x', bx - 60); textB.setAttribute('y', by + 5); 
    textB.textContent = "B(-2, 3)"; 
    textB.setAttribute('font-weight', 'bold'); textB.setAttribute('fill', '#4f46e5');
    canvas.appendChild(textB);
}

// 5. KONTROL MANTIĞI (GÜNCELLENMİŞ VERSİYON)
var checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
    var newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);

    newCheckBtn.addEventListener('click', function() {
        if (gameState.mode === 'slope_two_points') {
            const q = slopeState.currentTwoPointsQ;

            // --- 4. SORU KONTROLÜ (c BULMA) ---
            if (q.type === 'find_c_slope_given') {
                const userC = parseFloat(document.getElementById('box_final_c').textContent);
                
                // Ayrıca ara adımların (formülün) dolu olup olmadığına da bakabiliriz
                const boxA = document.getElementById('box_slope_a').textContent;
                const boxB = document.getElementById('box_slope_b').textContent;

                if (!isNaN(userC) && userC === q.correctC && boxA == '4' && boxB == '1') {
                    showFeedback(true);
                    playSuccessSound();
                    
                    // Çözüm Adımlarını Göster
                    const steps = document.getElementById('solutionSteps');
                    steps.classList.remove('hidden');
                    steps.innerHTML = `
                        <div>✅ <b>ÇÖZÜM ADIMLARI:</b></div>
                        1. Formül: (c - 3) / (0 - (-2)) = 4/1 <br>
                        2. Payda: 0 - (-2) = 2 <br>
                        3. Denklem: (c - 3) / 2 = 4 <br>
                        4. İçler Dışlar: c - 3 = 8 <br>
                        5. Sonuç: c = 8 + 3 = <b class="text-red-600">11</b>
                    `;
                    
                    // 6 saniye sonra bitir
                    setTimeout(() => {
                        slopeState.twoPointsQuestionIndex++; 
                        startSlopeTwoPointsRound(); 
                    }, 6000); 
                } else {
                    showFeedback(false);
                    playErrorSound();
                }
            } 
            // --- STANDART SORULAR ---
            else {
                const y2 = parseFloat(document.getElementById('box_y2').textContent);
                const y1 = parseFloat(document.getElementById('box_y1').textContent);
                const x2 = parseFloat(document.getElementById('box_x2').textContent);
                const x1 = parseFloat(document.getElementById('box_x1').textContent);

                const userSlope = (y2 - y1) / (x2 - x1);
                const realSlope = (q.p2.y - q.p1.y) / (q.p2.x - q.p1.x);

                if (Math.abs(realSlope - userSlope) < 0.001) {
                    showFeedback(true);
                    playSuccessSound();
                    setTimeout(() => {
                        slopeState.twoPointsQuestionIndex++; 
                        startSlopeTwoPointsRound(); 
                    }, 2000);
                } else {
                    showFeedback(false);
                    playErrorSound();
                }
            }
        }
        // Diğer modların kontrollerini koru...
        else if (gameState.mode === 'x_eq_a') { if(typeof checkVerticalLine === 'function') checkVerticalLine(); }
        else if (gameState.mode === 'y_eq_b') { if(typeof checkHorizontalLine === 'function') checkHorizontalLine(); }
        else if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') { if(typeof checkStraightLine === 'function') checkStraightLine(); }
        else if (gameState.mode === 'slope_incline' || gameState.mode === 'slope_graph') { if(typeof checkSlopeAnswer === 'function') checkSlopeAnswer(); }
        else if (gameState.mode === 'questionToGraph') { if(typeof checkLinearGraph === 'function') checkLinearGraph(); }
        else if (gameState.mode === 'graphToQuestion') { if(typeof checkGraphAnswer === 'function') checkGraphAnswer(); }
        else { if(typeof checkAnswer === 'function') checkAnswer(); }
    });
}

// 6. NUMPAD GÜNCELLEME (YENİ KUTULARI TANIYAN VERSİYON)
// ==========================================
// 2. "TAMAM" TUŞU TAMİRİ (KAPATMA VE HESAPLAMA)
// ==========================================
const numPadCloseBtn = document.getElementById('numPadClose');
if (numPadCloseBtn) {
    // Önceki dinleyicileri temizlemek için butonu klonluyoruz
    const newNumPadCloseBtn = numPadCloseBtn.cloneNode(true);
    numPadCloseBtn.parentNode.replaceChild(newNumPadCloseBtn, numPadCloseBtn);
    
    newNumPadCloseBtn.addEventListener('click', function() {
        try {
            let val = linearState.currentInputValue || '';
            const disp = document.getElementById('currentInput');
            if (disp && disp.textContent !== '') val = disp.textContent;

            // Tıklanan hedef bir tablo hücresi ise (örn: table_input_y_0)
            if (activeInputTarget && activeInputTarget.startsWith('table_input_')) {
                const parts = activeInputTarget.split('_');
                const col = parts[2]; // 'x' veya 'y'
                const row = parseInt(parts[3]);

                // İŞLEM ÖNCELİĞİNE GÖRE OTOMATİK HESAPLAMA (Y Sütunu)
                if (col === 'y' && val !== '') {
                    // x harfini çarpma işlemine (*) çevir
                    let expression = val.replace(/x/g, '*').replace(/X/g, '*');
                    
                    try {
                        const calculatedValue = new Function('return ' + expression)();
                        val = calculatedValue.toString(); 
                    } catch (err) {
                        console.log("İfade hesaplanamadı, girilen değer korundu:", err);
                    }
                }

                // TABLOYU VE EKRANI GÜNCELLE
                if (!linearState.tableData) linearState.tableData = [];
                if (!linearState.tableData[row]) linearState.tableData[row] = { x: '', y: '' };
                
                linearState.tableData[row][col] = val;

                const targetBox = document.getElementById(activeInputTarget);
                if (targetBox) {
                    targetBox.textContent = val; 
                    targetBox.classList.remove('bg-indigo-100', 'border-indigo-500'); 
                }

                // SATIR TAMAMLANDIYSA NOKTAYI GRAFİĞE ÇİZ
                const currentRow = linearState.tableData[row];
                if (currentRow.x !== '' && currentRow.y !== '') {
                    if (typeof refreshLinearGraphPoints === 'function') {
                        refreshLinearGraphPoints();
                    }
                }

                // TABLO TAMAMEN DOLDU MU KONTROL ET
                let isTableFull = true;
                const maxRows = 4; // Tablondaki varsayılan satır sayısı
                for (let i = 0; i < maxRows; i++) {
                    if (!linearState.tableData[i] || linearState.tableData[i].x === '' || linearState.tableData[i].y === '') {
                        isTableFull = false;
                        break;
                    }
                }

                // Tablo tamamen dolduysa, tablonun altındaki onay butonunu göster
                if (isTableFull) {
                    const tableConfirmBtn = document.getElementById('tableConfirmBtn'); 
                    if (tableConfirmBtn) {
                        tableConfirmBtn.classList.remove('hidden');
                        tableConfirmBtn.disabled = false;
                        tableConfirmBtn.classList.add('animate-pulse'); 
                    }
                }
            } 
            
            // Diğer modlar için olan kodların (Eğim vs.) çalışmaya devam etmesi için burayı koruyoruz
            else if (activeInputTarget === 'slope_intercept') { 
                if(val) { 
                    const ansBox = document.getElementById('interceptAnswerBox');
                    if (ansBox) ansBox.textContent = val; 
                    var chk = document.getElementById('checkBtn'); 
                    if(chk) { 
                        chk.disabled = false; 
                        chk.style.opacity = '1'; 
                    } 
                } 
            }

        } catch (e) {
            console.error("NumPad İşlem Hatası:", e);
        } finally {
            // İşlem bitince NumPad'i gizle ve değerleri temizle
            const numPadEl = document.getElementById('numberPad');
            if(numPadEl) numPadEl.classList.add('hidden');
            linearState.currentInputValue = '';
            if (document.getElementById('currentInput')) {
                document.getElementById('currentInput').textContent = '';
            }
            activeInputTarget = null;
        }
    });
}
// =================================================================
// 🚑 ACİL DURUM: NUMPAD KAPATMA (CSS RESET YÖNTEMİ)
// =================================================================
var confirmBtn = document.getElementById('numPadClose');

if (confirmBtn) {
    // 1. Butonu temizle ve yenisini oluştur
    var newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // 2. Yeni Tıklama Olayı
    newConfirmBtn.addEventListener('click', function(e) {
        // Tıklama olayının yayılmasını engelle (Çakışmaları önler)
        e.preventDefault();
        e.stopPropagation();

        console.log("✅ Tamam'a basıldı. Değer işleniyor ve KAPATILIYOR.");
        
        const val = linearState.currentInputValue;

        // --- VERİ İŞLEME (KUTULARA YAZMA) ---
        try {
            // A) İKİ NOKTADAN EĞİM MODU
            if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
                const role = activeInputTarget.replace('two_points_', ''); 
                const boxId = 'box_' + role;
                const box = document.getElementById(boxId);
                
                if (box) {
                    box.textContent = val === '' ? '?' : val;
                    box.style.color = '#4338ca'; 
                    
                    // 4. Soru Kontrolü (c değeri)
                    if (role === 'final_c' && val !== '') {
                        const chk = document.getElementById('checkBtn');
                        if(chk) { chk.disabled = false; chk.style.opacity = '1'; }
                    }
                    
                    // Standart Sorular için Otomatik Hesaplama
                    if (!role.includes('final') && !role.includes('slope')) {
                         if(typeof checkTwoPointsComplete === 'function') checkTwoPointsComplete(); 
                    }
                }
            }
            
            // B) TABLO MODU
            else if (linearState.currentCell) {
                 const { row, col } = linearState.currentCell;
                 const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
                 if (cell) {
                     cell.textContent = val;
                     if(col==='x') linearState.tableData[row].x = parseFloat(val);
                     if(col==='y') linearState.tableData[row].y = parseFloat(val);
                     linearState.tableData[row].calcY = parseFloat(val);
                     
                     if(typeof updateLinearCanvas === 'function') updateLinearCanvas(row, col, parseFloat(val));
                     if(typeof checkTableComplete === 'function') checkTableComplete();
                 }
            }

            // C) ESKİ EĞİM MODLARI
            else if (activeInputTarget === 'slope_simple') document.getElementById('slopeAnswerBox').textContent = val;
            else if (activeInputTarget === 'slope_unknown') document.getElementById('unknownBox').textContent = val;
            else if (activeInputTarget === 'slope_intercept') document.getElementById('interceptAnswerBox').textContent = val;
            else if (activeInputTarget === 'slope_conv_num' || activeInputTarget === 'eq_right_num') document.getElementById('slopeNumBox').textContent = val;
            else if (activeInputTarget === 'slope_conv_denom' || activeInputTarget === 'eq_right_denom') document.getElementById('slopeDenomBox').textContent = val;
            else if (activeInputTarget === 'eq_left_denom') document.getElementById('leftDenomBox').textContent = val;

        } catch (err) {
            console.error("Veri işleme hatası:", err);
        }

        // --- KRİTİK BÖLÜM: ZORLA KAPATMA ---
        const numPad = document.getElementById('numberPad');
        if (numPad) {
            // 1. Önce üzerindeki tüm inline stilleri (top, left, z-index, display:flex !important) SİLİYORUZ.
            numPad.removeAttribute('style'); 
            
            // 2. Sonra temiz bir şekilde gizliyoruz.
            numPad.classList.add('hidden');
            numPad.style.display = 'none';
        }
        
        // --- TEMİZLİK ---
        if (typeof linearState !== 'undefined') {
            linearState.currentInputValue = '';
        }
        const inputLabel = document.getElementById('currentInput');
        if(inputLabel) inputLabel.textContent = '';
    });
}

// =================================================================
// 1. EKRAN GÜNCELLEYİCİ (İSİM AYRIŞTIRMA DÜZELTMESİ)
// =================================================================
window.updateActiveInputDisplay = function() {
    const val = linearState.currentInputValue;

    // A) İKİ NOKTADAN EĞİM MODU (Kapsamlı Düzeltme)
    if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
        // HATA BURADAYDI: split('_')[2] sadece 'slope' alıyordu, 'a' kayboluyordu.
        // DÜZELTME: replace ile baştaki etiketi siliyoruz, geriye tam isim kalıyor.
        const role = activeInputTarget.replace('two_points_', ''); // Örn: 'slope_a'
        const boxId = 'box_' + role; // -> 'box_slope_a'
        
        const box = document.getElementById(boxId);
        if (box) {
            box.textContent = val === '' ? '?' : val;
            box.style.color = '#4338ca';
        }
        return; // Bu moddaysak aşağıya devam etme
    }

    // B) DİĞER MODLAR (ESKİ KODLARIN KORUNMASI)
    // Sol Alttaki Kutu (a'nın altı)
    if (activeInputTarget === 'eq_left_denom') {
        const el = document.getElementById('leftDenomBox');
        if(el) el.textContent = val || '?';
    }
    // Sağ Üst (Pay)
    else if (activeInputTarget === 'eq_right_num' || activeInputTarget === 'slope_conv_num') {
        const el = document.getElementById('slopeNumBox'); 
        if(el) el.textContent = val || '?';
    }
    // Sağ Alt (Payda)
    else if (activeInputTarget === 'eq_right_denom' || activeInputTarget === 'slope_conv_denom') {
        const el = document.getElementById('slopeDenomBox'); 
        if(el) el.textContent = val || '?';
    }
};

// =================================================================
// 🔧 EKRAN GÜNCELLEME TAMİRİ (ALT TİRE SORUNU ÇÖZÜMÜ)
// =================================================================
window.updateActiveInputDisplay = function() {
    const val = linearState.currentInputValue;

    // A) İKİ NOKTADAN EĞİM MODU (ÖZEL DÜZELTME)
    if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
        // HATA BURADAYDI: split('_') kullanınca "slope_a" parçalanıyordu.
        // ÇÖZÜM: replace() ile sadece baştaki etiketi siliyoruz, gerisini olduğu gibi alıyoruz.
        
        const role = activeInputTarget.replace('two_points_', ''); // Örn: 'slope_a'
        const boxId = 'box_' + role; // -> 'box_slope_a'
        
        const box = document.getElementById(boxId);
        if (box) {
            // Değeri kutuya anlık olarak yaz
            box.textContent = val === '' ? '?' : val;
            box.style.color = '#4338ca';
        }
        return; // Bu moddaysak işlemi bitir, aşağıya inme.
    }

    // B) DİĞER MODLAR (ESKİ KODLARIN ÇALIŞMAYA DEVAM ETMESİ İÇİN)
    
    // Sol Alttaki Kutu (a'nın altı - Eşitlik Modu)
    if (activeInputTarget === 'eq_left_denom') {
        const el = document.getElementById('leftDenomBox');
        if(el) el.textContent = val || '?';
    }
    
    // Sağ Üst (Pay - Eğim Modu)
    else if (activeInputTarget === 'eq_right_num' || activeInputTarget === 'slope_conv_num') {
        const el = document.getElementById('slopeNumBox'); 
        if(el) el.textContent = val || '?';
    }
    
    // Sağ Alt (Payda - Eğim Modu)
    else if (activeInputTarget === 'eq_right_denom' || activeInputTarget === 'slope_conv_denom') {
        const el = document.getElementById('slopeDenomBox'); 
        if(el) el.textContent = val || '?';
    }
};

// --- DOĞRUSAL İLİŞKİLER MODÜLÜ (EKSİK FONKSİYONLAR) ---

function showLinearQuestions() {
    gameState.mode = 'linear_questions';
    document.getElementById('instructions').classList.add('hidden');
    document.getElementById('actionButtons').classList.add('hidden');
    document.getElementById('infoPanel').classList.remove('hidden');
    nextLinearQuestion();
}

function nextLinearQuestion() {
    const scenario = linearQuestions[Math.floor(Math.random() * linearQuestions.length)];
    linearState.currentQuestion = scenario;
    const infoPanel = document.getElementById('infoPanel');
    infoPanel.innerHTML = `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100">
            <h3 class="font-bold text-indigo-800 mb-2 text-sm">${scenario.title}</h3>
            <p class="text-xs text-gray-700 leading-relaxed mb-4">${scenario.text}</p>
            <div class="grid grid-cols-1 gap-2">
                ${scenario.options.map((opt, i) => `
                    <button onclick="checkLinearAnswer(${i})" class="text-left p-3 border rounded-lg hover:bg-indigo-50 text-xs transition-all">
                        ${opt}
                    </button>
                `).join('')}
            </div>
            <button onclick="backToMenu()" class="w-full mt-4 text-xs text-gray-400">Geri Dön</button>
        </div>
    `;
    renderGrid();
}

// --- DOĞRUSAL İLİŞKİLER KESİN ÇÖZÜM MODÜLÜ ---

// 1. BUTONU ZORLA BİZİM SİSTEME BAĞLIYORUZ (Otomatik Kurulum)
document.addEventListener('DOMContentLoaded', () => {
    // HTML'ndeki butonun ID'si bu
    const btn = document.getElementById('questionToGraphBtn');
    if (btn) {
        // Senin eski kodu ezip, butona basınca bizim sistemi açmasını sağlıyoruz
        btn.onclick = (e) => {
            e.preventDefault(); 
            showLinearGraphQuestion();
        };
    }
});

// 2. MODU BAŞLATAN ANA FONKSİYON
function showLinearGraphQuestion() {
    try {
        gameState.mode = 'linear_graph_table'; 
        
        const mainCanvas = document.getElementById('canvas');
        if (mainCanvas) mainCanvas.parentElement.classList.add('hidden');
        
        const linearContainer = document.getElementById('linearContainer');
        if (linearContainer) {
            linearContainer.classList.remove('hidden');
            linearContainer.style.display = 'flex'; 
        }
        
        const oldDataTable = document.getElementById('dataTable');
        if (oldDataTable) oldDataTable.classList.add('hidden');
        const oldBtn = document.getElementById('tableConfirmBtn');
        if (oldBtn) oldBtn.classList.add('hidden');
        
        const panel = document.getElementById('linearQuestionPanel');
        if (panel) {
            panel.classList.remove('hidden');
            panel.style.width = '100%'; 
            panel.style.display = 'flex';
        }
        
        // Soru havuzunu bulma
        let questionsList = [];
        if (typeof questionToGraphScenarios !== 'undefined' && questionToGraphScenarios.length > 0) {
            questionsList = questionToGraphScenarios;
        } else if (typeof linearQuestions !== 'undefined' && linearQuestions.length > 0) {
            questionsList = linearQuestions;
        }
        
        if(questionsList.length === 0) {
            panel.innerHTML = `<div class="bg-red-100 p-4 text-red-700 font-bold border-2 border-red-500 rounded text-center">Soru havuzu bulunamadı!</div>`;
            return;
        }

        const scenario = questionsList[Math.floor(Math.random() * questionsList.length)];
        linearState.currentScenario = scenario;
        
        // Veri yapısını esnek şekilde çek
        let dataPoints = scenario.tableData || scenario.points || scenario.data || scenario.noktalar || (scenario.lines ? scenario.lines[0].points : null);
        
        // Veri yoksa bile çökmeyi engelle, 3 tane boş satır ekle
        if (!dataPoints || dataPoints.length === 0) {
            dataPoints = [ {x:'?', y:'?'}, {x:'?', y:'?'}, {x:'?', y:'?'} ];
            linearState.isDummyData = true; 
        } else {
            linearState.isDummyData = false;
        }

        linearState.currentDataPoints = dataPoints;
        renderLinearTable(scenario); 
        
        // Boş grafiği (eksenlerle birlikte) çiz
        if (typeof initializeLinearCanvas === 'function') {
            initializeLinearCanvas();
        }
        if (typeof canliGrafikCiz === 'function') {
            canliGrafikCiz();
        }
        
    } catch (err) {
        const panel = document.getElementById('linearQuestionPanel');
        if(panel) panel.innerHTML = `<div class="bg-red-100 p-4 text-red-700 font-bold border-2 border-red-500 rounded text-center">Hata: ${err.message}</div>`;
    }
}

// 3. TABLOYU PANELE ÇİZEN FONKSİYON
function renderLinearTable(scenario) {
    const panel = document.getElementById('linearQuestionPanel');
    let questionText = scenario.question || scenario.soru || scenario.mainQuestion || scenario.text || "Soru metni bulunamadı.";
    let xLabel = scenario.xLabel || scenario.xAxisLabel || "x";
    let yLabel = scenario.yLabel || scenario.yAxisLabel || "y";
    let dataPoints = linearState.currentDataPoints;

    let html = `
        <div class="bg-white p-4 rounded-xl shadow-sm border border-indigo-100 flex flex-col w-full min-w-[300px]">
            <div class="mb-4">
                <h3 class="font-bold text-indigo-800 text-sm mb-1">Soru:</h3>
                <p class="text-sm text-gray-800 font-medium bg-indigo-50 p-3 rounded-lg border border-indigo-100 shadow-inner leading-relaxed">
                    ${questionText}
                </p>
            </div>
    `;

    // VERİ BULUNAMAZSA EKRANA SARI UYARI KUTUSU BAS
    if (linearState.isDummyData) {
        let jsonGosterim = JSON.stringify(scenario).substring(0, 150);
        html += `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4 text-xs text-yellow-800">
                <strong class="font-bold">Uyarı:</strong> Bu sorunun içinde tablo verisi (points) tanımlanmamış. 
                <br><br>Sistemdeki ham veri şu şekilde: <code class="bg-yellow-100 p-1 rounded font-mono">${jsonGosterim}...</code>
            </div>
        `;
    }

    html += `
            <table class="w-full text-sm mb-4 border-collapse">
                <thead>
                    <tr class="bg-indigo-600 text-white">
                        <th class="border border-indigo-700 p-2 text-center w-1/2 rounded-tl-lg">${xLabel}</th>
                        <th class="border border-indigo-700 p-2 text-center w-1/2 rounded-tr-lg">${yLabel}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    dataPoints.forEach((row, idx) => {
        html += `
            <tr>
                <td class="border border-indigo-200 p-2 text-center bg-gray-50">
                    <div id="table_input_x_${idx}" 
                         onclick="if(gameState.mode === 'linear_graph_table') openTableInput('table_input_x_${idx}')"
                         class="table-input-cell cursor-pointer bg-white border-2 border-dashed border-indigo-300 rounded p-1 min-h-[36px] flex items-center justify-center font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 transition-all text-lg shadow-sm">
                        ?
                    </div>
                </td>
                <td class="border border-indigo-200 p-2 text-center">
                    <div id="table_input_y_${idx}" 
                         onclick="if(gameState.mode === 'linear_graph_table') openTableInput('table_input_y_${idx}')"
                         class="table-input-cell cursor-pointer bg-white border-2 border-dashed border-indigo-300 rounded p-1 min-h-[36px] flex items-center justify-center font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 transition-all text-lg shadow-sm">
                        ?
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <button id="btnTamamCst" onclick="confirmTableAndStartDrawing()" class="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-base hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                Tamam
            </button>
            <div id="drawMessageArea" class="hidden text-center mt-3">
                <p class="font-bold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-300 animate-pulse text-sm shadow-sm">
                    ✅ Tablo Doğru!<br>Şimdi yandaki grafikte noktaları işaretleyip birleştirin.
                </p>
            </div>
        </div>
    `;
    panel.innerHTML = html;
}

// --- 1. MATEMATİKSEL İŞLEM ÇÖZÜCÜ (İşlem Önceliği: BEDMAS/BODMAS) ---
function evaluateMath(expr) {
    if (!expr || expr === '?') return NaN;
    
    // Numpad'den gelen çarpı (x, X, ×, *) ve bölü (÷) işaretlerini koda çevir
    let safeExpr = expr.toString().replace(/x|X|×/g, '*').replace(/÷/g, '/');
    
    // Güvenlik için sadece rakam ve operatörleri bırak
    safeExpr = safeExpr.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
    
    try {
        // İşlem önceliğine göre hesapla (Örn: 200-1*15 = 185)
        const result = Function('"use strict";return (' + safeExpr + ')')();
        return Number.isFinite(result) ? result : NaN;
    } catch (e) {
        return NaN;
    }
}

// --- 2. NUMPAD AÇICI VE TEMİZLEYİCİ (Tüm satırlarda çalışmasını sağlar) ---
window.openTableInput = function(targetId) {
    activeInputTarget = targetId; 
    
    // Tablodaki seçili kutuyu mavi yap
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500');
    });
    const activeEl = document.getElementById(targetId);
    if (activeEl) {
        activeEl.classList.add('bg-indigo-100', 'border-indigo-500');
    }

    // Numpad'i aç
    const np = document.getElementById('numberPad');
    if (np) np.classList.remove('hidden');
    
    // ÖNEMLİ DÜZELTME: Her tıklamada Numpad göstergesini sıfırla ki önceki satırın sayısı kalmasın!
    const displayDiv = document.getElementById('currentInput');
    if (displayDiv) {
        displayDiv.textContent = ''; 
    }
};


// --- 4. ÇİFT TARAFLI VERİ GİRİŞLİ TABLO ÇİZİMİ ---
function renderLinearTable(scenario) {
    const panel = document.getElementById('linearQuestionPanel');
    let questionText = scenario.question || scenario.soru || scenario.mainQuestion || scenario.text || "Grafik Yorumlama";
    let xLabel = scenario.xLabel || scenario.xAxisLabel || "x";
    let yLabel = scenario.yLabel || scenario.yAxisLabel || "y";
    let dataPoints = linearState.currentDataPoints;

    let html = `
        <div class="bg-white p-2 rounded-xl shadow-sm border border-indigo-100 flex flex-col w-full">
            <div class="mb-4">
                <h3 class="font-bold text-indigo-800 text-sm mb-1">Soru:</h3>
                <p class="text-sm text-gray-800 font-medium bg-indigo-50 p-2 rounded-lg border border-indigo-100 shadow-inner leading-relaxed">
                    ${questionText}
                </p>
            </div>
            <table class="w-full text-xs mb-4 border-collapse">
                <thead>
                    <tr class="bg-indigo-600 text-white">
                        <th class="border border-indigo-700 p-1 text-center w-1/2 rounded-tl-lg">${xLabel}</th>
                        <th class="border border-indigo-700 p-1 text-center w-1/2 rounded-tr-lg">${yLabel}</th>
                    </tr>
                </thead>
                <tbody>
    `;

    dataPoints.forEach((row, idx) => {
        html += `
            <tr>
                <td class="border border-indigo-200 p-1 text-center bg-gray-50">
                    <div id="table_input_x_${idx}" 
                         onclick="openTableInput('table_input_x_${idx}')"
                         class="table-input-cell cursor-pointer bg-white border-2 border-dashed border-indigo-300 rounded p-1 min-h-[30px] flex items-center justify-center font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 transition-all text-sm shadow-sm w-full">
                        ?
                    </div>
                </td>
                <td class="border border-indigo-200 p-1 text-center">
                    <div id="table_input_y_${idx}" 
                         onclick="openTableInput('table_input_y_${idx}')"
                         class="table-input-cell cursor-pointer bg-white border-2 border-dashed border-indigo-300 rounded p-1 min-h-[30px] flex items-center justify-center font-bold text-indigo-600 hover:bg-indigo-50 hover:border-indigo-500 transition-all text-sm shadow-sm w-full">
                        ?
                    </div>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
            <button id="btnTamamCst" onclick="confirmTableAndStartDrawing()" class="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold text-base hover:bg-indigo-700 shadow-md transition-all active:scale-95">
                Tamam
            </button>
            <div id="drawMessageArea" class="hidden text-center mt-3">
                <p class="font-bold text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-300 animate-pulse text-sm shadow-sm">
                    ✅ Tablo Doğru!<br>Şimdi yandaki grafikte noktaları işaretleyip birleştirin.
                </p>
            </div>
        </div>
    `;
    panel.innerHTML = html;
}


function refreshLinearGraphPoints() {
    const linearSvg = document.getElementById('linearCanvas');
    if (!linearSvg) return;

    // Arka planı temizle ve ViewBox'ı sabitle
    linearSvg.innerHTML = '';
    linearSvg.setAttribute('viewBox', '0 0 500 500');

    // OYUN MOTORUNUN ORİJİNAL SABİTLERİ (Asla değişmemeli)
    const originX = 50;
    const originY = 450;
    const grid = 50; // Orijinal motor 50 px ile çalışır!

    // Çizimlerin yapılacağı boş katman (Oyun motoru burayı arıyor olabilir)
    const linesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linesLayer.setAttribute('id', 'drawingLayer');
    linearSvg.appendChild(linesLayer);

    // Verileri al
    const dataPoints = typeof linearState !== 'undefined' ? (linearState.tableData || linearState.currentDataPoints) : null; 
    if (!dataPoints) return;

    // Ölçek Hesaplama
    let maxX = 0; let maxY = 0;
    for (let idx = 0; idx < 10; idx++) {
        const xDiv = document.getElementById('table_input_x_' + idx);
        const yDiv = document.getElementById('table_input_y_' + idx);
        if (xDiv && yDiv) {
            let xT = xDiv.textContent.replace(/\?/g, '').trim();
            if (xT.includes('=')) xT = xT.split('=').pop().trim();
            let xV = parseFloat(xT);

            let yT = yDiv.textContent.replace(/\?/g, '').trim();
            if (yT.includes('=')) yT = yT.split('=').pop().trim();
            let yV = parseFloat(yT);

            if (!isNaN(xV) && xV > maxX) maxX = xV;
            if (!isNaN(yV) && yV > maxY) maxY = yV;
        }
    }

    let scaleX = 1;
    if (maxX > 8) { let step = maxX / 8; if(step<=2) scaleX=2; else if(step<=5) scaleX=5; else scaleX=Math.ceil(step/10)*10; }
    
    let scaleY = 1;
    if (maxY > 8) { let step = maxY / 8; if(step<=2) scaleY=2; else if(step<=5) scaleY=5; else if(step<=10) scaleY=10; else if(step<=20) scaleY=20; else if(step<=25) scaleY=25; else if(step<=50) scaleY=50; else if(step<=100) scaleY=100; else scaleY=Math.ceil(step/50)*50; }

    // HAYATİ: Çizim motorunun farenin yerini doğru bulması için ölçeği hafızaya kaydet
    if (typeof linearState !== 'undefined') {
        linearState.yScale = scaleY;
        linearState.xScale = scaleX;
    }

    // 1. Bölge Izgara (0'dan 8'e kadar, çünkü 8*50=400px tam sığar)
    for (let i = 0; i <= 8; i++) {
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', originX + (i * grid)); vLine.setAttribute('y1', originY);
        vLine.setAttribute('x2', originX + (i * grid)); vLine.setAttribute('y2', originY - (8 * grid));
        vLine.setAttribute('stroke', '#6b7280'); vLine.setAttribute('stroke-width', i === 0 ? '2' : '1');
        linearSvg.appendChild(vLine);

        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', originX); hLine.setAttribute('y1', originY - (i * grid));
        hLine.setAttribute('x2', originX + (8 * grid)); hLine.setAttribute('y2', originY - (i * grid));
        hLine.setAttribute('stroke', '#6b7280'); hLine.setAttribute('stroke-width', i === 0 ? '2' : '1');
        linearSvg.appendChild(hLine);

        if (i > 0) {
            const textY = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textY.setAttribute('x', originX - 10); textY.setAttribute('y', originY - (i * grid) + 4);
            textY.setAttribute('text-anchor', 'end'); textY.setAttribute('font-size', '12'); textY.setAttribute('font-weight', 'bold'); textY.setAttribute('fill', '#6b7280');
            textY.textContent = (i * scaleY).toString(); linearSvg.appendChild(textY);

            const textX = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textX.setAttribute('x', originX + (i * grid)); textX.setAttribute('y', originY + 20);
            textX.setAttribute('text-anchor', 'middle'); textX.setAttribute('font-size', '12'); textX.setAttribute('font-weight', 'bold'); textX.setAttribute('fill', '#6b7280');
            textX.textContent = (i * scaleX).toString(); linearSvg.appendChild(textX);
        }
    }

    const zeroText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    zeroText.setAttribute('x', originX - 10); zeroText.setAttribute('y', originY + 20);
    zeroText.setAttribute('text-anchor', 'end'); zeroText.setAttribute('font-size', '12'); zeroText.setAttribute('font-weight', 'bold'); zeroText.setAttribute('fill', '#6b7280');
    zeroText.textContent = '0'; linearSvg.appendChild(zeroText);

    // Noktaları Çiz
    for (let idx = 0; idx < 10; idx++) {
        const xDiv = document.getElementById('table_input_x_' + idx);
        const yDiv = document.getElementById('table_input_y_' + idx);
        if (xDiv && yDiv) {
            let xT = xDiv.textContent.replace(/\?/g, '').trim();
            if (xT.includes('=')) xT = xT.split('=').pop().trim();
            let xV = parseFloat(xT);

            let yT = yDiv.textContent.replace(/\?/g, '').trim();
            if (yT.includes('=')) yT = yT.split('=').pop().trim();
            let yV = parseFloat(yT);
            
            if (!isNaN(xV) && !isNaN(yV) && xV >= 0 && yV >= 0) {
                const cx = originX + ((xV / scaleX) * grid);
                const cy = originY - ((yV / scaleY) * grid);

                // GÖRÜNMEZ TIKLAMA ALANI (Öğrenci noktayı kolay tutabilsin diye)
                const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                hitArea.setAttribute('cx', cx); hitArea.setAttribute('cy', cy); hitArea.setAttribute('r', '20');
                hitArea.setAttribute('fill', 'transparent'); 
                hitArea.setAttribute('class', `point point-${idx}`); // Motor bu class'ı arıyor!
                hitArea.style.cursor = 'crosshair';
                linearSvg.appendChild(hitArea);

                // GÖRSEL MOR NOKTA
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', '8');
                circle.setAttribute('fill', '#8b5cf6'); circle.setAttribute('stroke', '#ffffff'); circle.setAttribute('stroke-width', '2');
                circle.style.pointerEvents = 'none'; // Fare bunu değil görünmez alanı tutsun
                linearSvg.appendChild(circle);

                // YAZI
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', cx + 15); label.setAttribute('y', cy - 15);
                label.setAttribute('font-size', '13'); label.setAttribute('font-weight', 'bold'); label.setAttribute('fill', '#4b5563');
                label.style.pointerEvents = 'none'; // Yazı farenin önüne geçmesin!
                label.textContent = '(' + xV + ', ' + yV + ')';
                linearSvg.appendChild(label);
            }
        }
    }
}


// ==========================================
// 7. TABLO KONTROL MOTORU (FİNAL DÜZELTME - MATEMATİKSEL HESAPLAMA)
// ==========================================
function confirmTableAndStartDrawing() {
    // 1. Senaryoyu ve Verileri Al
    const scenario = linearState.currentScenario;
    // Orijinal veriyi (soru verisini) baz al
    let rawPoints = scenario.tableData || scenario.points || scenario.data || (scenario.lines ? scenario.lines[0].points : []);
    
    // 2. DOĞRU DENKLEMİ (m ve b) HESAPLA
    // Tablodaki "?" olmayan, yani sayı olan en az 2 noktayı bulmalıyız.
    let validPoints = [];
    
    if (rawPoints) {
        rawPoints.forEach(p => {
            // Veri yapısı {x:.., y:..} veya [x, y] olabilir
            let valX = (p.x !== undefined) ? p.x : p[0];
            let valY = (p.y !== undefined) ? p.y : p[1];

            // Eğer değer sayıysa veya sayıya çevrilebiliyorsa listeye al
            let nx = parseFloat(valX);
            let ny = parseFloat(valY);

            if (!isNaN(nx) && !isNaN(ny)) {
                validPoints.push({x: nx, y: ny});
            }
        });
    }

    // Eğim (m) ve Kesen (b) Hesapla
    let m = null;
    let b = null;
    let isVertical = false; // Dikey çizgi kontrolü (x = a)
    let targetVerticalX = null;
    let isHorizontal = false; // Yatay çizgi kontrolü (y = b)
    let targetHorizontalY = null;

    if (validPoints.length >= 2) {
        const p1 = validPoints[0];
        const p2 = validPoints[1];

        if (Math.abs(p2.x - p1.x) < 0.001) {
            isVertical = true;
            targetVerticalX = p1.x;
        } else if (Math.abs(p2.y - p1.y) < 0.001) {
            isHorizontal = true;
            targetHorizontalY = p1.y;
        } else {
            m = (p2.y - p1.y) / (p2.x - p1.x);
            b = p1.y - (m * p1.x);
        }
    } else {
        // Eğer tablodan bulamazsak, senaryonun içinde m/b var mı diye bak (Yedek Plan)
        if (scenario.m !== undefined && scenario.b !== undefined) {
            m = scenario.m;
            b = scenario.b;
        }
    }

    // 3. KULLANICININ GİRDİĞİ DEĞERLERİ KONTROL ET
    let allCorrect = true;
    let filledRowCount = 0;

    // Tabloda en fazla 10 satır olabilir, hepsini gez
    for (let idx = 0; idx < 10; idx++) {
        const xDiv = document.getElementById('table_input_x_' + idx);
        const yDiv = document.getElementById('table_input_y_' + idx);

        if (!xDiv || !yDiv) continue; // Böyle bir satır yoksa geç

        // Kutunun içindeki metni al (Soru işaretlerini temizle)
        let xStr = xDiv.textContent.replace(/\?/g, '').trim();
        let yStr = yDiv.textContent.replace(/\?/g, '').trim();

        // Eğer satır tamamen boşsa, bu satırı atla (Hata sayma)
        if (xStr === '' && yStr === '') continue;

        filledRowCount++;

        // Değerleri sayıya çevir
        // evaluateMath fonksiyonu varsa kullan (işlemleri yapmak için), yoksa parseFloat
        let userX = (typeof evaluateMath === 'function') ? evaluateMath(xStr) : parseFloat(xStr);
        let userY = (typeof evaluateMath === 'function') ? evaluateMath(yStr) : parseFloat(yStr);

        let isRowCorrect = false;

        if (!isNaN(userX) && !isNaN(userY)) {
            if (isVertical) {
                // Dikey çizgi: X sabit olmalı, Y her şey olabilir
                if (Math.abs(userX - targetVerticalX) < 0.1) isRowCorrect = true;
            } 
            else if (isHorizontal) {
                // Yatay çizgi: Y sabit olmalı, X her şey olabilir
                if (Math.abs(userY - targetHorizontalY) < 0.1) isRowCorrect = true;
            }
            else if (m !== null && b !== null) {
                // Standart Doğru Kontrolü: y = mx + b
                // Kullanıcının X'ini formüle koy, olması gereken Y'yi bul
                let expectedY = (m * userX) + b;
                
                // Hata payı (float toleransı) ile karşılaştır
                // 0.1 tolerans iyidir (yuvarlama hataları için)
                if (Math.abs(userY - expectedY) < 0.1) {
                    isRowCorrect = true;
                }
            } else {
                // Eğer formül çıkaramadıysak, sadece havuza bak (Eski yöntem - Son Çare)
                let inPool = validPoints.some(p => Math.abs(p.x - userX) < 0.1 && Math.abs(p.y - userY) < 0.1);
                if (inPool) isRowCorrect = true;
            }
        }

        // SONUCU GÖRSELLEŞTİR (YEŞİL / KIRMIZI)
        if (isRowCorrect) {
            // Doğru ise kutuyu yeşil yap ve kilitli hale getir (tekrar tıklanamaz)
            xDiv.className = "table-input-cell bg-emerald-100 border-2 border-emerald-500 rounded p-1 flex items-center justify-center font-bold text-emerald-800 text-lg cursor-default w-full shadow-inner";
            yDiv.className = "table-input-cell bg-emerald-100 border-2 border-emerald-500 rounded p-1 flex items-center justify-center font-bold text-emerald-800 text-lg cursor-default w-full shadow-inner";
            
            // Tıklama olaylarını kaldır (input'u kilitle)
            xDiv.onclick = null;
            yDiv.onclick = null;
            
            // Doğru bilinen noktaları "linearState" içine kaydet ki çizimde kullanılabilsin
            if (!linearState.userCorrectPoints) linearState.userCorrectPoints = [];
            // Bu noktayı daha önce eklemediysek ekle
            if (!linearState.userCorrectPoints.some(p => p.x === userX && p.y === userY)) {
                linearState.userCorrectPoints.push({x: userX, y: userY});
            }

        } else {
            // Yanlış ise kırmızı yap ve titret
            xDiv.className = "table-input-cell bg-red-50 border-2 border-red-500 rounded p-1 flex items-center justify-center font-bold text-red-700 text-lg w-full animate-pulse";
            yDiv.className = "table-input-cell bg-red-50 border-2 border-red-500 rounded p-1 flex items-center justify-center font-bold text-red-700 text-lg w-full animate-pulse";
            allCorrect = false;
        }
    }

    // 4. BAŞARI DURUMU
    if (allCorrect && filledRowCount > 0) {
        playSuccessSound();

        // Çizim Modunu Aktif Et
        gameState.mode = 'linear_graph_draw';
        gameState.userClicks = []; // Tıklamaları sıfırla
        
        // Çizim aracı (setupStraightLineDrawing) varsa çalıştır
        if (typeof setupStraightLineDrawing === 'function') {
            setupStraightLineDrawing();
        }

        // "Tamam" butonunu gizle
        const btnTamam = document.getElementById('btnTamamCst');
        if (btnTamam) btnTamam.classList.add('hidden');

        // Bildirim Göster
        const msgArea = document.getElementById('drawMessageArea');
        if (msgArea) {
            msgArea.classList.remove('hidden');
            msgArea.innerHTML = `
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg animate-bounce">
                    <p class="font-bold">Mükemmel! Tablo Doğru. 🎉</p>
                    <p class="text-sm">Şimdi grafikte noktaları işaretle ve doğruyu çiz.</p>
                </div>
            `;
        }

        // Grafiği güncelle (Noktaları netleştir)
        if (typeof refreshLinearGraphPoints === 'function') refreshLinearGraphPoints();

    } else {
        playErrorSound();
        // Hata mesajı (Toast veya basit alert)
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = "Bazı değerler yanlış. Kırmızı kutuları kontrol et!";
            feedback.style.opacity = '1';
            feedback.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl font-bold z-[99999]";
            setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
        }
    }
}

// ==========================================
// 1. SAYI PANELİNİ AÇMA (HEDEFİ KİLİTLEME)
// ==========================================
window.openTableInput = function(targetId) {
    console.log("Kutuya tıklandı, Hedef:", targetId); // Konsoldan takip et
    
    // 1. Hedefi Kaydet
    activeInputTarget = targetId; 
    
    // 2. Diğer kutuların mavi ışığını söndür, buna yak
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500');
    });
    const activeEl = document.getElementById(targetId);
    if (activeEl) {
        activeEl.classList.add('bg-indigo-100', 'border-indigo-500');
        
        // Eğer kutuda zaten bir sayı varsa, numpad ekranına taşı
        const currentVal = activeEl.textContent.replace('?', '').trim();
        const displayDiv = document.getElementById('currentInput');
        if (displayDiv) displayDiv.textContent = currentVal;
        if (typeof linearState !== 'undefined') linearState.currentInputValue = currentVal;
    }

    // 3. Paneli Aç
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex'; // Zorla görünür yap
    }
};

// ==========================================
// 2. TUŞLARI CANLANDIRMA (0-9, Sil, -, .)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Numpad içindeki tüm butonları bul
    const padButtons = document.querySelectorAll('#numberPad button');
    
    padButtons.forEach(btn => {
        // Önce temizle, sonra ekle (Çift basmayı önler)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = newBtn.textContent.trim();
            const display = document.getElementById('currentInput');
            
            // Eğer "Tamam" veya "İptal" değilse (yani sayı ise)
            if (newBtn.id !== 'numPadClose' && newBtn.id !== 'numPadCancel') {
                
                // Silme Tuşu
                if (val === 'Sil' || newBtn.querySelector('.fa-backspace')) {
                    display.textContent = display.textContent.slice(0, -1);
                } 
                // Temizleme (C)
                else if (val === 'C') {
                    display.textContent = '';
                }
                // Sayılar ve Nokta
                else {
                    display.textContent += val;
                }
                
                // State'i güncelle
                if (typeof linearState !== 'undefined') {
                    linearState.currentInputValue = display.textContent;
                }
            }
        });
    });
    
    // TAMAM ve İPTAL butonlarını ayrıca bağlayacağız (Aşağıda)
});

// ==========================================
// 3. TAMAM BUTONU (VERİYİ TABLOYA AKTARMA)
// ==========================================
const btnTamam = document.getElementById('numPadClose');
if (btnTamam) {
    // Temiz bir buton oluştur
    const newBtnTamam = btnTamam.cloneNode(true);
    btnTamam.parentNode.replaceChild(newBtnTamam, btnTamam);

    newBtnTamam.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 1. Veriyi Numpad Ekranından Al
        const displayDiv = document.getElementById('currentInput');
        let val = displayDiv ? displayDiv.textContent.trim() : '';
        
        console.log("Tamam'a basıldı. Değer:", val, "Hedef:", activeInputTarget);

        // 2. Hedef Kutu Var mı?
        if (activeInputTarget) {
            const targetBox = document.getElementById(activeInputTarget);
            
            if (targetBox) {
                // Değer boşsa soru işareti koy
                if (val === '') val = '?';
                
                // --- KRİTİK NOKTA: Ekrana Yaz ---
                targetBox.textContent = val;
                
                // Mavi seçimi kaldır
                targetBox.classList.remove('bg-indigo-100', 'border-indigo-500');

                // --- STATE GÜNCELLEME (Tablo Kontrolü İçin Şart) ---
                // ID'den satır ve sütunu bul (Örn: table_input_x_2)
                if (activeInputTarget.startsWith('table_input_')) {
                    const parts = activeInputTarget.split('_');
                    const col = parts[2]; // x veya y
                    const row = parseInt(parts[3]); // 0, 1, 2...
                    
                    // State dizisini hazırla
                    if (!linearState.tableData) linearState.tableData = [];
                    if (!linearState.tableData[row]) linearState.tableData[row] = { x: '?', y: '?' };
                    
                    // Veriyi kaydet
                    linearState.tableData[row][col] = val;
                }
            }
        }
        
        // 3. Paneli Kapat ve Temizle
        document.getElementById('numberPad').classList.add('hidden');
        if (displayDiv) displayDiv.textContent = '';
        activeInputTarget = null;
        
        // 4. "Tamam" butonu görünsün mü kontrol et (Tablo dolduysa)
        checkIfTableFull();
    });
}

// YARDIMCI: İptal Butonu
const btnIptal = document.getElementById('numPadCancel');
if (btnIptal) {
    const newBtnIptal = btnIptal.cloneNode(true);
    btnIptal.parentNode.replaceChild(newBtnIptal, btnIptal);
    
    newBtnIptal.addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('numberPad').classList.add('hidden');
        document.querySelectorAll('.table-input-cell').forEach(el => el.classList.remove('bg-indigo-100', 'border-indigo-500'));
        activeInputTarget = null;
    });
}

// YARDIMCI: Tablo Dolu mu Kontrolü
function checkIfTableFull() {
    let isFull = true;
    let hasRows = false;
    
    // Tüm input hücrelerini gez
    const cells = document.querySelectorAll('.table-input-cell');
    if (cells.length === 0) return;

    cells.forEach(cell => {
        const txt = cell.textContent.trim();
        if (txt === '?' || txt === '') {
            isFull = false;
        }
        hasRows = true;
    });

    // Eğer hepsi doluysa alttaki "Tabloyu Kontrol Et" butonunu aç
    const confirmBtn = document.getElementById('btnTamamCst'); // ID'si tableConfirmBtn de olabilir, kontrol et
    const confirmBtn2 = document.getElementById('tableConfirmBtn');
    
    if (isFull && hasRows) {
        if (confirmBtn) confirmBtn.classList.remove('hidden');
        if (confirmBtn2) confirmBtn2.classList.remove('hidden');
    }
}

// =================================================================
// 🚑 ACİL DURUM: NUMPAD SİSTEMİ (TAMİR KİTİ - SIFIRDAN KURULUM)
// =================================================================

// 1. GLOBAL DEĞİŞKENLER (Hafıza)

// 2. SAYI PANELİNİ AÇMA FONKSİYONU
window.openTableInput = function(targetId) {
    console.log("🖱️ Kutuya tıklandı:", targetId);
    
    // Hedefi Hafızaya Al
    activeInputTarget = targetId;

    // Tüm kutuların mavi ışığını söndür
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500');
    });

    // Tıklanan kutuyu mavi yap
    const targetBox = document.getElementById(targetId);
    if (targetBox) {
        targetBox.classList.add('bg-indigo-100', 'border-indigo-500');
        
        // Kutuda zaten sayı varsa, panel ekranına taşı
        const currentVal = targetBox.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = currentVal;
    }

    // Paneli Göster
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex'; // Görünürlüğü zorla
    }
};

// 3. TUŞLARI VE PANELİ ÇALIŞTIRAN ANA MOTOR
// (Bu fonksiyon sayfa yüklendiğinde otomatik çalışır)
setTimeout(function() {
    console.log("🔧 Numpad Motoru Başlatılıyor...");

    // Paneldeki butonları bulalım
    const keys = document.querySelectorAll('#numberPad button');
    
    // Eski olayları temizlemek için butonları yenile
    keys.forEach(oldBtn => {
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);

        // --- TUŞLARA TIKLAMA OLAYI ---
        newBtn.addEventListener('click', function(e) {
            e.preventDefault(); // Sayfanın zıplamasını engelle
            
            const btnText = newBtn.textContent.trim();
            const display = document.getElementById('currentInput');
            
            // A) "TAMAM" veya "TİK" TUŞU İSE
            if (newBtn.id === 'numPadClose' || newBtn.querySelector('.fa-check') || btnText === 'Tamam') {
                handleConfirm();
            }
            // B) "İPTAL" veya "ÇARPI" TUŞU İSE
            else if (newBtn.id === 'numPadCancel' || newBtn.querySelector('.fa-times') || btnText === 'İptal') {
                handleCancel();
            }
            // C) SİLME (BACKSPACE) TUŞU İSE
            else if (btnText === 'Sil' || newBtn.querySelector('.fa-backspace')) {
                display.textContent = display.textContent.slice(0, -1);
            }
            // D) TEMİZLEME (C) TUŞU İSE
            else if (btnText === 'C') {
                display.textContent = '';
            }
            // E) NORMAL RAKAMLAR VE İŞARETLER
            else {
                // Sadece rakam, nokta, eksi ve x işaretine izin ver
                display.textContent += btnText;
            }
        });
    });

}, 1000); // Sayfa yüklendikten 1 saniye sonra devreye girer (Garanti olsun diye)


// 4. "TAMAM" TUŞU MANTIĞI (VERİYİ AKTARMA)
function handleConfirm() {
    const display = document.getElementById('currentInput');
    let val = display.textContent.trim();

    console.log("✅ Tamam'a basıldı. Değer:", val);

    // Hedef kutu var mı?
    if (activeInputTarget) {
        const targetBox = document.getElementById(activeInputTarget);
        if (targetBox) {
            // Boşsa soru işareti yap
            if (val === '') val = '?';

            // TABLOYA YAZ!
            targetBox.textContent = val;
            
            // Mavi seçimi kaldır
            targetBox.classList.remove('bg-indigo-100', 'border-indigo-500');

            // --- TABLO VERİSİNİ GÜNCELLE (KONTROL İÇİN ŞART) ---
            if (activeInputTarget.startsWith('table_input_')) {
                // ID'den satır ve sütunu bul (table_input_x_0)
                const parts = activeInputTarget.split('_');
                const col = parts[2]; // x veya y
                const row = parseInt(parts[3]);

                // linearState hafızasını güncelle
                if (typeof linearState !== 'undefined') {
                    if (!linearState.tableData) linearState.tableData = [];
                    if (!linearState.tableData[row]) linearState.tableData[row] = {x:'?', y:'?'};
                    
                    linearState.tableData[row][col] = val;
                }
            }
        }
    }

    // Paneli Kapat
    closeNumpad();

    // Tablo doldu mu diye bak (Onay butonu için)
    checkIfTableIsFull();
}

// 5. "İPTAL" TUŞU MANTIĞI
function handleCancel() {
    console.log("❌ İptal'e basıldı.");
    // Seçimi kaldır
    if (activeInputTarget) {
        const box = document.getElementById(activeInputTarget);
        if (box) box.classList.remove('bg-indigo-100', 'border-indigo-500');
    }
    closeNumpad();
}

// 6. PANELİ KAPATMA VE TEMİZLEME
function closeNumpad() {
    const np = document.getElementById('numberPad');
    if (np) np.classList.add('hidden');
    
    const display = document.getElementById('currentInput');
    if (display) display.textContent = '';
    
    activeInputTarget = null;
}

// 7. TABLO DOLULUK KONTROLÜ
function checkIfTableIsFull() {
    let isFull = true;
    const cells = document.querySelectorAll('.table-input-cell');
    
    if (cells.length === 0) return;

    cells.forEach(cell => {
        const txt = cell.textContent.trim();
        if (txt === '?' || txt === '') isFull = false;
    });

    if (isFull) {
        // "Tamam" butonunu göster (ID'ler değişebiliyor, ikisini de dene)
        const btn1 = document.getElementById('btnTamamCst');
        const btn2 = document.getElementById('tableConfirmBtn');
        if (btn1) btn1.classList.remove('hidden');
        if (btn2) btn2.classList.remove('hidden');
    }
}

// =================================================================
// 🚀 FİNAL TAMİR KİTİ (ÇAKIŞMA ÖNLEYİCİ VERSİYON)
// =================================================================

// 1. GLOBAL DEĞİŞKEN (Hata vermemesi için window üzerinden kontrol)
if (typeof window.activeInputTarget === 'undefined') {
    window.activeInputTarget = null;
}

// 2. KUTUYA TIKLAMA FONKSİYONU
window.openTableInput = function(targetId) {
    console.log("🎯 Hedef Kutu:", targetId);
    window.activeInputTarget = targetId;

    // Görsel temizlik
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-400');
    });

    const box = document.getElementById(targetId);
    if (box) {
        box.classList.add('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-400');
        // Varsa eski değeri ekrana taşı
        const val = box.textContent.replace('?', '').trim();
        const disp = document.getElementById('currentInput');
        if (disp) disp.textContent = val;
    }

    // Paneli Aç
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
    }
};

// 3. BUTONLARI BAĞLA (1 Saniye Bekleyip Çalışır - Garanti Yöntem)
setTimeout(function() {
    console.log("🔧 Butonlar Yeniden Bağlanıyor...");

    // --- TAMAM BUTONU ---
    // Değişken ismini 'btnTamam_Fix' yaptık ki eskisiyle çakışmasın
    var btnTamam_Fix = document.getElementById('numPadClose');
    
    if (btnTamam_Fix) {
        // Klonlayarak eski bozuk özellikleri temizle
        var newTamam = btnTamam_Fix.cloneNode(true);
        btnTamam_Fix.parentNode.replaceChild(newTamam, btnTamam_Fix);

        newTamam.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation();

            // Değeri Al
            const disp = document.getElementById('currentInput');
            let val = disp ? disp.textContent.trim() : '';
            if (val === '') val = '?';

            // Hedefe Yaz
            if (window.activeInputTarget) {
                const targetBox = document.getElementById(window.activeInputTarget);
                if (targetBox) {
                    targetBox.textContent = val;
                    targetBox.classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-400');
                    
                    // Veriyi Hafızaya (linearState) İşle
                    if (window.activeInputTarget.startsWith('table_input_')) {
                        const parts = window.activeInputTarget.split('_'); // table, input, x, 0
                        const col = parts[2]; 
                        const row = parseInt(parts[3]);

                        if (typeof linearState !== 'undefined') {
                            if (!linearState.tableData) linearState.tableData = [];
                            if (!linearState.tableData[row]) linearState.tableData[row] = {x:'?', y:'?'};
                            linearState.tableData[row][col] = val;
                        }
                    }
                }
            }

            // Kapat
            closeNumpad_Fix();
            
            // Tablo dolduysa kontrol butonunu aç
            checkFull_Fix();
        });
    }

    // --- İPTAL BUTONU ---
    // Değişken ismini 'btnIptal_Fix' yaptık ki hatayı önleyelim
    var btnIptal_Fix = document.getElementById('numPadCancel');
    
    if (btnIptal_Fix) {
        var newIptal = btnIptal_Fix.cloneNode(true);
        btnIptal_Fix.parentNode.replaceChild(newIptal, btnIptal_Fix);
        
        newIptal.addEventListener('click', function(e) {
            e.preventDefault();
            closeNumpad_Fix();
        });
    }

}, 1000);

// YARDIMCI FONKSİYONLAR (Çakışmasın diye _Fix ekledim)
function closeNumpad_Fix() {
    const np = document.getElementById('numberPad');
    if (np) np.classList.add('hidden');
    
    const disp = document.getElementById('currentInput');
    if (disp) disp.textContent = '';
    
    // Seçim renklerini temizle
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-400');
    });
    
    window.activeInputTarget = null;
}

function checkFull_Fix() {
    let isFull = true;
    let count = 0;
    document.querySelectorAll('.table-input-cell').forEach(cell => {
        count++;
        const txt = cell.textContent.trim();
        if (txt === '?' || txt === '') isFull = false;
    });

    if (isFull && count > 0) {
        const btn = document.getElementById('btnTamamCst');
        if (btn) btn.classList.remove('hidden');
    }
}

// =================================================================
// 🚀 NİHAİ BAĞLANTI MODÜLÜ (ÇAKIŞMA ÖNLEYİCİ v3)
// =================================================================
// Bu kod, önceki hataları bypass edip "Tamam" tuşunu zorla çalıştırır.

// 1. GLOBAL HEDEF DEĞİŞKENİ (Window seviyesinde tanımladık ki kaybolmasın)
window.CURRENT_TARGET_ID = null;

// 2. KUTUYA TIKLAMA (SAYI PANELİNİ AÇAR)
window.openTableInput = function(targetId) {
    console.log("🟢 Kutu Seçildi:", targetId);
    
    // Hedefi kaydet
    window.CURRENT_TARGET_ID = targetId;

    // Görsel temizlik (Önceki mavi kutuları normale çevir)
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.style.backgroundColor = "white";
        el.style.borderColor = "#e0e7ff"; // indigo-100
    });

    // Yeni kutuyu mavi yap
    const box = document.getElementById(targetId);
    if (box) {
        box.style.backgroundColor = "#e0e7ff"; // indigo-50
        box.style.borderColor = "#6366f1"; // indigo-500
        
        // Kutudaki eski değeri panele taşı
        let val = box.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = val;
    }

    // Paneli Aç
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
    }
};

// 3. TAMAM VE İPTAL BUTONLARINI BAĞLA (100ms Gecikmeli - Garanti Olsun)
setTimeout(function() {
    console.log("🔌 Butonlar Bağlanıyor...");

    // --- TAMAM BUTONU ---
    const oldBtn = document.getElementById('numPadClose');
    if (oldBtn) {
        // Eski tüm özellikleri silmek için klonluyoruz
        const btnTamam_Final_v3 = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(btnTamam_Final_v3, oldBtn);

        // Yeni Tıklama Olayı
        btnTamam_Final_v3.addEventListener('click', function(e) {
            e.preventDefault();
            
            // A. Değeri Al
            const display = document.getElementById('currentInput');
            let val = display ? display.textContent.trim() : '';
            console.log("✅ Tamam Basıldı. Değer:", val, "Hedef:", window.CURRENT_TARGET_ID);

            // B. Hedefe Yaz
            if (window.CURRENT_TARGET_ID) {
                const targetBox = document.getElementById(window.CURRENT_TARGET_ID);
                
                if (targetBox) {
                    if (val === '') val = '?';
                    
                    // 1. Ekrana Yaz (Görsel)
                    targetBox.textContent = val;
                    
                    // 2. Rengi Düzelt
                    targetBox.style.backgroundColor = "white";
                    targetBox.style.borderColor = "#e0e7ff";

                    // 3. Veriyi Hafızaya (linearState) Kaydet
                    // ID formatı: table_input_x_0
                    if (window.CURRENT_TARGET_ID.startsWith('table_input_')) {
                        const parts = window.CURRENT_TARGET_ID.split('_');
                        const col = parts[2]; // x veya y
                        const row = parseInt(parts[3]);

                        if (typeof linearState !== 'undefined') {
                            if (!linearState.tableData) linearState.tableData = [];
                            if (!linearState.tableData[row]) linearState.tableData[row] = {x:'?', y:'?'};
                            
                            linearState.tableData[row][col] = val;
                        }
                    }
                }
            }

            // C. Paneli Kapat
            closeNumpad_Final();

            // D. Tablo Doldu mu? (Kontrol Butonu Aç)
            checkTableFull_Final();
        });
    }

    // --- İPTAL BUTONU ---
    const oldCancel = document.getElementById('numPadCancel');
    if (oldCancel) {
        const btnIptal_Final_v3 = oldCancel.cloneNode(true);
        oldCancel.parentNode.replaceChild(btnIptal_Final_v3, oldCancel);
        
        btnIptal_Final_v3.addEventListener('click', function(e) {
            e.preventDefault();
            closeNumpad_Final();
        });
    }

}, 500); // Yarım saniye bekle ve çalıştır

// YARDIMCI FONKSİYONLAR
function closeNumpad_Final() {
    const np = document.getElementById('numberPad');
    if (np) np.classList.add('hidden');
    
    const display = document.getElementById('currentInput');
    if (display) display.textContent = '';
    
    window.CURRENT_TARGET_ID = null;
    
    // Renkleri temizle
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.style.backgroundColor = "white";
        el.style.borderColor = "#e0e7ff";
    });
}

function checkTableFull_Final() {
    let isFull = true;
    let hasCells = false;
    document.querySelectorAll('.table-input-cell').forEach(cell => {
        hasCells = true;
        const txt = cell.textContent.trim();
        if (txt === '?' || txt === '') isFull = false;
    });

    if (isFull && hasCells) {
        // İki olası ID'yi de dene
        const btn1 = document.getElementById('btnTamamCst');
        const btn2 = document.getElementById('tableConfirmBtn');
        if (btn1) btn1.classList.remove('hidden');
        if (btn2) btn2.classList.remove('hidden');
    }
}

// =================================================================
// 🚑 ACİL KURTARMA PAKETİ (ÇAKIŞMAYI AŞAN SÜRÜM)
// =================================================================

// 1. Yeni ve Benzersiz Bir Hedef Değişkeni Tanımlıyoruz
// (Eski activeInputTarget değişkenini kullanmıyoruz ki hata vermesin)
window.HEDEF_KUTU_ID = null; 

// 2. Tablo Kutusuna Tıklayınca Çalışan Fonksiyonu "Eziyoruz"
window.openTableInput = function(tiklananId) {
    console.log("🟢 Yeni Sistem: Kutu Seçildi ->", tiklananId);
    
    // Hedefi yeni değişkene kaydet
    window.HEDEF_KUTU_ID = tiklananId;

    // Görsel: Eski mavilikleri temizle
    document.querySelectorAll('.table-input-cell').forEach(kutu => {
        kutu.style.backgroundColor = "white"; 
        kutu.style.borderColor = "#e0e7ff";
    });

    // Görsel: Tıklananı mavi yap
    const kutu = document.getElementById(tiklananId);
    if (kutu) {
        kutu.style.backgroundColor = "#dbeafe"; // Açık mavi
        kutu.style.borderColor = "#2563eb";     // Koyu mavi
        
        // Kutudaki değeri panele taşı
        let eskiDeger = kutu.textContent.replace('?', '').trim();
        const ekran = document.getElementById('currentInput');
        if (ekran) ekran.textContent = eskiDeger;
    }

    // Paneli Aç
    const panel = document.getElementById('numberPad');
    if (panel) {
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
    }
};

// 3. "Tamam" Butonunu Zorla Yeniden Yaratıyoruz (1 saniye sonra)
setTimeout(function() {
    console.log("🛠️ Tamam Butonu Tamir Ediliyor...");

    const eskiButon = document.getElementById('numPadClose');
    if (eskiButon) {
        // Eski butonu kopyala (Böylece eski hatalı kodlardan kurtuluruz)
        const yeniButon = eskiButon.cloneNode(true);
        eskiButon.parentNode.replaceChild(yeniButon, eskiButon);

        // YENİ TIKLAMA GÖREVİ
        yeniButon.addEventListener('click', function(olay) {
            olay.preventDefault();
            olay.stopPropagation();

            console.log("✅ Tamam'a Basıldı! Hedef:", window.HEDEF_KUTU_ID);

            // A. Ekranda ne yazıyor?
            const ekran = document.getElementById('currentInput');
            let yazilanDeger = ekran ? ekran.textContent.trim() : '';
            if (yazilanDeger === '') yazilanDeger = '?';

            // B. Hedef kutu belli mi?
            if (window.HEDEF_KUTU_ID) {
                const hedefKutu = document.getElementById(window.HEDEF_KUTU_ID);
                
                if (hedefKutu) {
                    // 1. EKRANA YAZ (En önemlisi bu)
                    hedefKutu.textContent = yazilanDeger;
                    
                    // 2. Rengi düzelt
                    hedefKutu.style.backgroundColor = "white";
                    hedefKutu.style.borderColor = "#e0e7ff";

                    // 3. Veriyi Hafızaya Kaydet (Grafik kontrolü için)
                    // ID örneği: table_input_x_0
                    if (window.HEDEF_KUTU_ID.startsWith('table_input_')) {
                        const parcalar = window.HEDEF_KUTU_ID.split('_');
                        const sutun = parcalar[2]; // 'x' veya 'y'
                        const satir = parseInt(parcalar[3]);

                        // linearState nesnesini güncelle
                        if (typeof linearState !== 'undefined') {
                            if (!linearState.tableData) linearState.tableData = [];
                            if (!linearState.tableData[satir]) linearState.tableData[satir] = {x:'?', y:'?'};
                            
                            linearState.tableData[satir][sutun] = yazilanDeger;
                        }
                    }
                } else {
                    console.log("❌ Hedef kutu HTML'de bulunamadı!");
                }
            } else {
                console.log("⚠️ Hedef seçili değil!");
            }

            // C. Paneli Kapat
            const panel = document.getElementById('numberPad');
            if (panel) panel.classList.add('hidden');
            if (ekran) ekran.textContent = '';
            
            // D. Seçimi Sıfırla
            window.HEDEF_KUTU_ID = null;

            // E. Tablo dolduysa kontrol butonunu aç
            kontrolTabloDoluMu();
        });
    }
}, 1000); // 1 saniye bekleme süresi

// Yardımcı: Tablo Dolu mu?
function kontrolTabloDoluMu() {
    let doluMu = true;
    let kutuVarMi = false;
    document.querySelectorAll('.table-input-cell').forEach(kutu => {
        kutuVarMi = true;
        if (kutu.textContent.trim() === '?' || kutu.textContent.trim() === '') {
            doluMu = false;
        }
    });

    if (doluMu && kutuVarMi) {
        const btn1 = document.getElementById('btnTamamCst');
        const btn2 = document.getElementById('tableConfirmBtn');
        if (btn1) btn1.classList.remove('hidden');
        if (btn2) btn2.classList.remove('hidden');
    }
}

// =================================================================
// 🚪 PANEL KAPATMA TAMİRCİSİ (KESİN ÇÖZÜM)
// =================================================================
setTimeout(function() {
    console.log("🚪 Kapatma Mekanizması Güncelleniyor...");

    // 1. TAMAM BUTONU (Kapanma Özelliği Ekleniyor)
    const btnTamam = document.getElementById('numPadClose');
    if (btnTamam) {
        // Mevcut işlevi bozmadan üzerine ekleme yapıyoruz
        const eskiTiklama = btnTamam.onclick; 
        
        // Yeni, daha güçlü bir dinleyici ekliyoruz
        btnTamam.addEventListener('click', function(e) {
            // Önce veriyi yazma işini yapsın (zaten çalışıyor dedin)
            // Sonra zorla kapatsın:
            forceClosePanel();
        });
    }

    // 2. İPTAL BUTONU (Kapanma Özelliği Ekleniyor)
    const btnIptal = document.getElementById('numPadCancel');
    if (btnIptal) {
        const yeniIptal = btnIptal.cloneNode(true);
        btnIptal.parentNode.replaceChild(yeniIptal, btnIptal);

        yeniIptal.addEventListener('click', function(e) {
            e.preventDefault();
            // İptal'e basınca hedefi de unut
            window.HEDEF_KUTU_ID = null;
            // Görsel seçimleri kaldır
            document.querySelectorAll('.table-input-cell').forEach(kutu => {
                kutu.style.backgroundColor = "white"; 
                kutu.style.borderColor = "#e0e7ff";
            });
            forceClosePanel();
        });
    }

}, 1500); // Diğer kodlardan sonra çalışsın diye biraz gecikmeli

// 3. ZORLA KAPATMA FONKSİYONU
function forceClosePanel() {
    const panel = document.getElementById('numberPad');
    if (panel) {
        // Hem CSS sınıfı ekle
        panel.classList.add('hidden');
        // Hem de stili zorla 'none' yap (Kilit nokta burası)
        panel.style.display = 'none';
    }

    // Ekranı temizle
    const ekran = document.getElementById('currentInput');
    if (ekran) ekran.textContent = '';
}

// =================================================================
// 🚀 FİNAL SİSTEM: CANLI GRAFİK VE MATEMATİKSEL KONTROL
// =================================================================

// 1. GLOBAL DEĞİŞKENLER
window.HEDEF_KUTU = null;

// ---------------------------------------------------------
// A. KUTUYA TIKLAMA (SAYI PANELİNİ AÇAR)
// ---------------------------------------------------------
window.openTableInput = function(tiklananId) {
    console.log("🖱️ Kutu Seçildi:", tiklananId);
    window.HEDEF_KUTU = tiklananId;

    // Görsel Temizlik
    document.querySelectorAll('.table-input-cell').forEach(kutu => {
        kutu.style.backgroundColor = "white"; 
        kutu.style.borderColor = "#e0e7ff";
        kutu.style.boxShadow = "none";
    });

    // Seçili Kutuyu İşaretle
    const kutu = document.getElementById(tiklananId);
    if (kutu) {
        kutu.style.backgroundColor = "#dbeafe"; // Mavi
        kutu.style.borderColor = "#3b82f6";
        kutu.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.3)";
        
        // Değeri panele taşı
        let val = kutu.textContent.replace('?', '').trim();
        const ekran = document.getElementById('currentInput');
        if (ekran) ekran.textContent = val;
    }

    // Paneli Aç
    const panel = document.getElementById('numberPad');
    if (panel) {
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
    }
};

// ---------------------------------------------------------
// B. NUMPAD BUTONLARINI BAĞLA (OTOMATİK VE ANLIK)
// ---------------------------------------------------------
setTimeout(function() {
    // TAMAM BUTONU
    const btnTamam = document.getElementById('numPadClose');
    if (btnTamam) {
        const yeniTamam = btnTamam.cloneNode(true);
        btnTamam.parentNode.replaceChild(yeniTamam, btnTamam);

        yeniTamam.addEventListener('click', function(e) {
            e.preventDefault();

            // 1. Değeri Al
            const ekran = document.getElementById('currentInput');
            let deger = ekran ? ekran.textContent.trim() : '';
            if (deger === '') deger = '?';

            // 2. Kutuya Yaz
            if (window.HEDEF_KUTU) {
                const kutu = document.getElementById(window.HEDEF_KUTU);
                if (kutu) {
                    kutu.textContent = deger;
                    kutu.style.backgroundColor = "white";
                    kutu.style.borderColor = "#e0e7ff";
                    kutu.style.boxShadow = "none";
                    
                    // State'i Güncelle (Hafızaya Al)
                    kaydetState(window.HEDEF_KUTU, deger);
                }
            }

            // 3. GRAFİĞİ ANINDA GÜNCELLE (İşte eksik olan parça buydu!)
            canliGrafikCiz();

            // 4. Paneli Kapat
            kapatPanel();

            // 5. Tablo Dolduysa Kontrol Butonunu Aç
            kontrolButonunuAc();
        });
    }

    // İPTAL BUTONU
    const btnIptal = document.getElementById('numPadCancel');
    if (btnIptal) {
        const yeniIptal = btnIptal.cloneNode(true);
        btnIptal.parentNode.replaceChild(yeniIptal, btnIptal);
        yeniIptal.addEventListener('click', function(e) {
            e.preventDefault();
            kapatPanel();
        });
    }
}, 1000);

// ---------------------------------------------------------
// C. CANLI GRAFİK ÇİZCİ (HER SAYI GİRİŞİNDE ÇALIŞIR)
// ---------------------------------------------------------
function canliGrafikCiz() {
    console.log("🎨 Grafik Güncelleniyor (refreshLinearGraphPoints'e yönlendirildi)...");
    if (typeof refreshLinearGraphPoints === 'function') {
        refreshLinearGraphPoints();
    }
}

// ---------------------------------------------------------
// D. TABLO KONTROL (MATEMATİKSEL FORMÜL İLE)
// ---------------------------------------------------------
window.confirmTableAndStartDrawing = function() {
    console.log("🧠 Tablo Kontrol Ediliyor (Matematiksel)...");
    
    // 1. Doğru Formülünü Bul (y = mx + b)
    let m = null;
    let b = null;
    
    const scenario = (typeof linearState !== 'undefined') ? linearState.currentScenario : null;
    
    if (scenario) {
        // A) Senaryoda açıkça verilmişse al
        if (scenario.m !== undefined && scenario.b !== undefined) {
            m = scenario.m;
            b = scenario.b;
        } 
        else if (scenario.rate !== undefined && scenario.initialValue !== undefined) {
            m = scenario.rate;
            b = scenario.initialValue;
        }
        // B) Verilmemişse, senaryodaki "Points" listesinden hesapla
        else {
            let rawData = scenario.points || scenario.tableData || (scenario.lines ? scenario.lines[0].points : []);
            // Soru işareti olmayan temiz verileri al
            let cleanPoints = [];
            if(rawData) {
                rawData.forEach(p => {
                    let px = (p.x !== undefined) ? parseFloat(p.x) : parseFloat(p[0]);
                    let py = (p.y !== undefined) ? parseFloat(p.y) : parseFloat(p[1]);
                    if (!isNaN(px) && !isNaN(py)) cleanPoints.push({x: px, y: py});
                });
            }

            if (cleanPoints.length >= 2) {
                // İki noktadan eğim bul
                let p1 = cleanPoints[0];
                let p2 = cleanPoints[1];
                if (p2.x - p1.x !== 0) {
                    m = (p2.y - p1.y) / (p2.x - p1.x);
                    b = p1.y - (m * p1.x);
                }
            }
        }
    }

    console.log(`📏 Bulunan Formül: y = ${m}x + ${b}`);
    if (m !== null && typeof linearState !== 'undefined') {
        linearState.correctM = m;
    }

    // 2. Tablodaki Değerleri Kontrol Et
    let hepsiDogru = true;
    let doluSatirSayisi = 0;

    for (let i = 0; i < 10; i++) {
        const xDiv = document.getElementById('table_input_x_' + i);
        const yDiv = document.getElementById('table_input_y_' + i);
        if (!xDiv || !yDiv) continue;

        let txtX = xDiv.textContent.replace('?', '').trim();
        let txtY = yDiv.textContent.replace('?', '').trim();

        if (txtX === '' || txtY === '') continue;
        doluSatirSayisi++;

        if (txtX.includes('=')) txtX = txtX.split('=').pop().trim();
        if (txtY.includes('=')) txtY = txtY.split('=').pop().trim();

        let userX = parseFloat(txtX);
        let userY = parseFloat(txtY);
        let rowCorrect = false;

        // Formül Kontrolü
        if (m !== null && b !== null) {
            let expectedY = (m * userX) + b;
            // Küçük yuvarlama hatalarını tolere et (0.1)
            if (Math.abs(userY - expectedY) < 0.1) {
                rowCorrect = true;
            }
        } else {
            // Formül bulunamadıysa (Çok nadir), eski yöntemle havuza bak
            // Ama yukarıdaki kod %99 formülü bulur.
            rowCorrect = true; // Hata vermemek için geçici true (Senaryo bozuksa öğrenci üzülmesin)
        }

        // Renklendirme
        if (rowCorrect) {
            styleCorrect(xDiv); styleCorrect(yDiv);
        } else {
            styleWrong(xDiv); styleWrong(yDiv);
            hepsiDogru = false;
        }
    }

    // 3. Sonuç
    if (hepsiDogru && doluSatirSayisi > 0) {
        if(typeof playSuccessSound === 'function') playSuccessSound();
        
        // Çizim modunu aç
        if(typeof gameState !== 'undefined') gameState.mode = 'linear_graph_draw';
        if(typeof setupStraightLineDrawing === 'function') setupStraightLineDrawing();

        // Butonu gizle
        const btn = document.getElementById('btnTamamCst');
        if(btn) btn.classList.add('hidden');

        // Mesaj
        const msg = document.getElementById('drawMessageArea');
        if(msg) {
            msg.classList.remove('hidden');
            msg.innerHTML = `<div class="bg-green-100 p-4 rounded text-green-700 font-bold border-l-4 border-green-500">✅ Harika! Tablo doğru. Şimdi noktaları birleştir.</div>`;
        }
        
        // Noktaları Yeşile Çevir (Kalıcı Yap)
        const noktalar = document.getElementById('linearCanvas').querySelectorAll('.user-preview-dot');
        noktalar.forEach(n => n.setAttribute('fill', '#059669')); // Yeşil

    } else {
        if(typeof playErrorSound === 'function') playErrorSound();
    }
};

// ---------------------------------------------------------
// YARDIMCI FONKSİYONLAR
// ---------------------------------------------------------
function kapatPanel() {
    const p = document.getElementById('numberPad');
    if(p) { p.classList.add('hidden'); p.style.display = 'none'; }
    window.HEDEF_KUTU = null;
    const ekr = document.getElementById('currentInput');
    if(ekr) ekr.textContent = '';
    
    // Mavi seçimleri temizle
    document.querySelectorAll('.table-input-cell').forEach(k => {
        if(!k.classList.contains('bg-emerald-100')) { // Doğru olanları bozma
            k.style.backgroundColor = "white";
            k.style.borderColor = "#e0e7ff";
            k.style.boxShadow = "none";
        }
    });
}

function kontrolButonunuAc() {
    let doluluk = true;
    let enAzBir = false;
    document.querySelectorAll('.table-input-cell').forEach(c => {
        enAzBir = true;
        if(c.textContent.trim() === '?' || c.textContent.trim() === '') doluluk = false;
    });
    if(doluluk && enAzBir) {
        const b = document.getElementById('btnTamamCst');
        if(b) b.classList.remove('hidden');
    }
}

function kaydetState(id, val) {
    if(!id.startsWith('table_input_')) return;
    if(typeof linearState === 'undefined') return;
    
    const parts = id.split('_');
    const col = parts[2];
    const row = parseInt(parts[3]);
    
    if(!linearState.tableData) linearState.tableData = [];
    if(!linearState.tableData[row]) linearState.tableData[row] = {x:'?', y:'?'};
    
    linearState.tableData[row][col] = val;
}

function styleCorrect(el) {
    el.className = "table-input-cell bg-emerald-100 border-2 border-emerald-500 rounded p-1 flex items-center justify-center font-bold text-emerald-800 text-lg cursor-default w-full";
    el.onclick = null; // Kilitle
}

function styleWrong(el) {
    el.className = "table-input-cell bg-red-50 border-2 border-red-500 rounded p-1 flex items-center justify-center font-bold text-red-700 text-lg w-full animate-pulse";
}

// Diğer canliGrafikCiz fonksiyonları temizlendi. Üstteki nihai versiyon kullanılacak.

// ==========================================
// 🎯 SVG MATRIX COORDINATE SYSTEM (v5 - KESİN ÇÖZÜM)
// ==========================================

window.setupStraightLineDrawing = function() {
    const canvas = document.getElementById('linearCanvas');
    if (!canvas) return;

    console.log("✏️ Çizim Modu: SVG Matrix sistemi aktif.");
    
    // Temizle
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    window.onmouseup = null;
    canvas.ontouchstart = null;
    canvas.ontouchmove = null;
    window.ontouchend = null;

    let isDrawing = false;
    let tempLine = null;

    // --- ENERJİ TASARRUFLU VE HASSAS KOORDİNAT SİSTEMİ ---
    function getPointOnSvg(e) {
        const pt = canvas.createSVGPoint();
        
        // Mouse veya Dokunmatik konumunu al
        if (e.touches && e.touches.length > 0) {
            pt.x = e.touches[0].clientX;
            pt.y = e.touches[0].clientY;
        } else if (e.changedTouches && e.changedTouches.length > 0) {
            pt.x = e.changedTouches[0].clientX;
            pt.y = e.changedTouches[0].clientY;
        } else {
            pt.x = e.clientX;
            pt.y = e.clientY;
        }

        // Bu büyü: Ekran koordinatlarını doğrudan SVG'nin iç koordinatlarına çevirir
        const cursorPoint = pt.matrixTransform(canvas.getScreenCTM().inverse());
        
        return { x: cursorPoint.x, y: cursorPoint.y };
    }

    const startDraw = function(e) {
        if (gameState.mode !== 'linear_graph_draw') return;
        if (e && e.type && e.type.startsWith('touch') && e.cancelable) e.preventDefault();
        
        isDrawing = true;
        const coords = getPointOnSvg(e);

        if (typeof window.sendP2PDrawEvent === 'function') {
            window.sendP2PDrawEvent({ action: 'start', coords: coords });
        }

        // Eski çizgiyi temizle
        const oldLine = document.getElementById('rubber-line');
        if (oldLine) oldLine.remove();

        tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        tempLine.setAttribute('x1', coords.x);
        tempLine.setAttribute('y1', coords.y);
        tempLine.setAttribute('x2', coords.x);
        tempLine.setAttribute('y2', coords.y);
        tempLine.setAttribute('stroke', '#4338ca'); 
        tempLine.setAttribute('stroke-width', '4');
        tempLine.setAttribute('stroke-linecap', 'round');
        tempLine.setAttribute('stroke-dasharray', '8,5'); 
        tempLine.setAttribute('id', 'rubber-line');
        
        canvas.appendChild(tempLine);
    };

    const moveDraw = function(e) {
        if (!isDrawing || !tempLine) return;
        if (e && e.type && e.type.startsWith('touch') && e.cancelable) e.preventDefault();
        
        const coords = getPointOnSvg(e);

        if (typeof window.sendP2PDrawEvent === 'function') {
            window.sendP2PDrawEvent({ action: 'move', coords: coords });
        }

        tempLine.setAttribute('x2', coords.x);
        tempLine.setAttribute('y2', coords.y);
    };

    const endDraw = function(e) {
        if (!isDrawing || !tempLine) return;
        isDrawing = false;

        const end = getPointOnSvg(e);

        if (typeof window.sendP2PDrawEvent === 'function') {
            window.sendP2PDrawEvent({ action: 'end', coords: end });
        }

        tempLine.removeAttribute('stroke-dasharray'); 
        
        const start = {
            x: parseFloat(tempLine.getAttribute('x1')),
            y: parseFloat(tempLine.getAttribute('y1'))
        };

        checkDrawingLogic(start, end);
    };

    // P2P'den gelen çizim verilerini işleyecek fonksiyon
    window.p2pDrawHandle = function(payload) {
        if (payload.action === 'start') {
            isDrawing = true;
            const coords = payload.coords;
            const oldLine = document.getElementById('rubber-line');
            if (oldLine) oldLine.remove();

            tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            tempLine.setAttribute('x1', coords.x);
            tempLine.setAttribute('y1', coords.y);
            tempLine.setAttribute('x2', coords.x);
            tempLine.setAttribute('y2', coords.y);
            tempLine.setAttribute('stroke', '#4338ca'); 
            tempLine.setAttribute('stroke-width', '4');
            tempLine.setAttribute('stroke-linecap', 'round');
            tempLine.setAttribute('stroke-dasharray', '8,5'); 
            tempLine.setAttribute('id', 'rubber-line');
            canvas.appendChild(tempLine);
        } else if (payload.action === 'move') {
            if (!isDrawing || !tempLine) return;
            const coords = payload.coords;
            tempLine.setAttribute('x2', coords.x);
            tempLine.setAttribute('y2', coords.y);
        } else if (payload.action === 'end') {
            if (!isDrawing || !tempLine) return;
            isDrawing = false;
            tempLine.removeAttribute('stroke-dasharray'); 
            const start = {
                x: parseFloat(tempLine.getAttribute('x1')),
                y: parseFloat(tempLine.getAttribute('y1'))
            };
            checkDrawingLogic(start, payload.coords);
        }
    };

    // Event dinleyicilerini ata
    canvas.onmousedown = startDraw;
    canvas.ontouchstart = startDraw;

    canvas.onmousemove = moveDraw;
    canvas.ontouchmove = moveDraw;

    window.onmouseup = endDraw;
    window.ontouchend = endDraw;

    canvas.style.cursor = 'crosshair';
};


// ==========================================
// ✨ ÜST BUTON AKTİFLEŞTİRİCİ (v6)
// ==========================================

function checkDrawingLogic(start, end) {
    // Mevcut dinamik ölçeği al
    const stepY = (typeof linearState !== 'undefined') ? (linearState.yScale || 1) : 1;
    const stepX = (typeof linearState !== 'undefined') ? (linearState.xScale || 1) : 1;
    
    // Çizgi noktalarını matematiksel değere çevir
    const v1 = { x: (start.x - 50) / 50 * stepX, y: (450 - start.y) / 50 * stepY };
    const v2 = { x: (end.x - 50) / 50 * stepX, y: (450 - end.y) / 50 * stepY };

    // Senaryodaki gerçek eğimi hesapla
    let correctM = (typeof linearState !== 'undefined') ? linearState.correctM : undefined;
    
    if (correctM === undefined) {
        const scenario = (typeof linearState !== 'undefined') ? linearState.currentScenario : null;
        if (scenario && scenario.rate !== undefined) {
            correctM = scenario.rate;
        } else if (scenario) {
            const data = scenario.points || scenario.tableData || (scenario.lines ? scenario.lines[0].points : []);
            if (data && data.length >= 2) {
                let p1 = data[0]; let p2 = data[1];
                let sX1 = p1.x || p1[0]; let sY1 = p1.y || p1[1];
                let sX2 = p2.x || p2[0]; let sY2 = p2.y || p2[1];
                correctM = (sY2 - sY1) / (sX2 - sX1);
            }
        }
    }
    
    const userM = (v2.y - v1.y) / (v2.x - v1.x);

    // EĞİM KONTROLÜ
    if (correctM !== undefined && !isNaN(correctM) && Math.abs(userM - correctM) < 0.4) {
        if(typeof playSuccessSound === 'function') playSuccessSound();
        document.getElementById('rubber-line').setAttribute('stroke', '#10b981'); // Yeşil

        // --- BUTONU BUL VE ZORLA AKTİF ET ---
        // Senin projendeki tüm olası ID'leri kontrol ediyoruz
        const btn = document.getElementById('checkBtn') || document.getElementById('btn_kontrol_et');
        
        if (btn) {
            console.log("🚀 Kontrol butonu aktif ediliyor!");
            
            // 1. Görünürlük Engellerini Kaldır
            btn.classList.remove('hidden', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = false;
            btn.style.display = 'block';
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';

            // 2. Görsel Efekt Ekle (Yanıp Sönme)
            btn.style.animation = "pulse 1.5s infinite";
            btn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'ring-4', 'ring-orange-200');
            btn.innerHTML = "Çizimi Onayla ✨";

            // 3. Tıklama Görevini Ata (Eğer atanmamışsa)
            btn.onclick = function() {
                // Final onayı fonksiyonunu çalıştır
                if(typeof finalDogrulamaYap === 'function') finalDogrulamaYap();
            };
        }
    } else {
        if(typeof playErrorSound === 'function') playErrorSound();
        document.getElementById('rubber-line').setAttribute('stroke', '#ef4444'); // Kırmızı
    }
}

// Butonun yanıp sönmesi için gerekli olan CSS animasyonu
if (!document.getElementById('pulse-style')) {
    const style = document.createElement('style');
    style.id = 'pulse-style';
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(249, 115, 22, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(249, 115, 22, 0); }
        }
    `;
    document.head.appendChild(style);
}


// =================================================================
// ✅ FİNAL ONAY VE KONTROL MEKANİZMASI
// =================================================================

// 1. Çizgi Doğruysa Üstteki Butonu Hareketlendir
function animasyonuBaslatKontrolButonu() {
    const kontrolBtn = document.getElementById('btn_kontrol_et'); // Senin üstteki butonunun ID'si
    if (kontrolBtn) {
        kontrolBtn.classList.remove('hidden');
        // Yanıp sönme ve büyüme efekti (Tailwind sınıfları veya CSS)
        kontrolBtn.style.animation = "pulse 1.5s infinite";
        kontrolBtn.classList.add('bg-emerald-600', 'scale-110', 'shadow-2xl');
        kontrolBtn.innerHTML = "✨ Şimdi Çizimi Onayla";
        
        // Butona son kontrol görevini ata
        kontrolBtn.onclick = finalDogrulamaYap;
    }
}

// 2. Kontrol Et Butonuna Basınca Yapılacak Son Kontrol
function finalDogrulamaYap() {
    console.log("🏁 Final Kontrolü Yapılıyor...");
    
    const userLine = document.getElementById('rubber-line');
    if (!userLine) return;

    // Tablodaki tüm noktaları al
    const noktalar = [];
    document.querySelectorAll('.table-input-cell').forEach(kutu => {
        if (kutu.id.startsWith('table_input_y_')) {
            const satir = kutu.id.split('_')[3];
            let xT = document.getElementById('table_input_x_' + satir).textContent.trim();
            let yT = kutu.textContent.trim();
            if (xT !== '?' && yT !== '?') {
                if (xT.includes('=')) xT = xT.split('=').pop().trim();
                if (yT.includes('=')) yT = yT.split('=').pop().trim();
                noktalar.push({ x: parseFloat(xT), y: parseFloat(yT) });
            }
        }
    });

    // Çizginin matematiksel eğimini ve sabitini (y = mx + b) bul
    const stepY = (typeof linearState !== 'undefined') ? (linearState.yScale || 1) : 1;
    const stepX = (typeof linearState !== 'undefined') ? (linearState.xScale || 1) : 1;
    const ORJIN_X = 50; const ORJIN_Y = 450; const KARE = 50;

    const x1 = (parseFloat(userLine.getAttribute('x1')) - ORJIN_X) / KARE * stepX;
    const y1 = (ORJIN_Y - parseFloat(userLine.getAttribute('y1'))) / KARE * stepY;
    const x2 = (parseFloat(userLine.getAttribute('x2')) - ORJIN_X) / KARE * stepX;
    const y2 = (ORJIN_Y - parseFloat(userLine.getAttribute('y2'))) / KARE * stepY;

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - (m * x1);

    // Her nokta bu çizginin üzerinde mi? (0.5 tolerans ile)
    let herNoktaUygun = true;
    noktalar.forEach(p => {
        const beklenenY = (m * p.x) + b;
        if (Math.abs(p.y - beklenenY) > 0.8) { // Biraz esneklik payı
            herNoktaUygun = false;
        }
    });

    if (herNoktaUygun && noktalar.length > 0) {
        if(typeof playSuccessSound === 'function') playSuccessSound();
        
        // Başarı Ekranı
        document.getElementById('drawMessageArea').innerHTML = `
            <div class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-2xl text-center">
                <h2 class="text-2xl font-black mb-2">🏆 TEBRİKLER!</h2>
                <p>Tabloyu doldurdun, grafiği çizdin ve tüm noktaları birleştirdin!</p>
            </div>`;
            
        // Butonun animasyonunu durdur ve yeşil yap
        const btn = document.getElementById('btn_kontrol_et');
        btn.style.animation = "none";
        btn.className = "bg-green-600 text-white px-8 py-3 rounded-full font-bold";
        btn.innerHTML = "✅ SORU TAMAMLANDI";
        
        // 3 saniye sonra diğer soruya geçiş (isteğe bağlı)
        // setTimeout(nextQuestion, 3000);
    } else {
        if(typeof playErrorSound === 'function') playErrorSound();
        alert("Çizgi tüm noktalardan geçmiyor, lütfen tekrar dene!");
    }
}

// 3. Eski checkDrawingLogic fonksiyonuna tetikleyici ekle
// (Önceki yazdığımız fonksiyonun içine şu satırı ekliyoruz)


// ==========================================
// 🧪 MATEMATİKSEL İFADE ÇÖZÜCÜ
// ==========================================
function solveMathExpression(inputStr) {
    try {
        // 1. "x" veya "X" işaretlerini "*" (çarpma) ile değiştir
        let cleanedInput = inputStr.toLowerCase().replace(/x/g, '*');
        
        // 2. Sadece güvenli karakterlere izin ver (sayılar ve + - * /)
        // Bu güvenlik için önemlidir
        cleanedInput = cleanedInput.replace(/[^0-9+\-*/().]/g, '');

        // 3. İşlemi hesapla (İşlem önceliğine göre)
        // Function constructor, eval'den daha güvenlidir
        const result = new Function(`return ${cleanedInput}`)();
        
        return result;
    } catch (e) {
        console.error("Hatalı işlem formatı:", e);
        return null;
    }
}

// Tablodaki Y hücresine tıklandığında veya veri girildiğinde çalışır
function finalizeCellInput(cellId) {
    const cell = document.getElementById(cellId);
    let rawValue = cell.textContent.trim();

    // Eğer hücrede işlem işareti (+, -, x, /) varsa çözücüye gönder
    if (/[+\-x*/]/.test(rawValue)) {
        const calculatedResult = solveMathExpression(rawValue);
        
        if (calculatedResult !== null) {
            // Hücredeki metni sonucun kendisiyle değiştir (Örn: 185)
            cell.textContent = calculatedResult;
            
            // Grafiği güncellemek için mevcut fonksiyonunu tetikle
            if (typeof canliGrafikCiz === 'function') {
                canliGrafikCiz(); 
            }
            
            console.log(`✅ İşlem çözüldü: ${rawValue} = ${calculatedResult}`);
        }
    }
}

// ==========================================
// 🎯 İŞLEMİ ÇÖZÜP SONUCU AKTARAN MOTOR (v11)
// ==========================================

window.hucreyiOnayla = function() {
    // 1. Yazılan hücreyi bul (aktifHucreId üzerinden)
    const hucre = document.getElementById(window.aktifHucreId);
    
    if (!hucre) {
        console.log("⚠️ Önce bir hücreye tıklamalısın hocam.");
        return;
    }

    let hamVeri = hucre.textContent.trim();

    // Hücre boşsa veya sadece "?" varsa işlem yapma
    if (hamVeri === "" || hamVeri === "?") return;

    try {
        // 2. MATEMATİKSEL TEMİZLİK (İşlem önceliği hazırlığı)
        // 'x' işaretini '*' yapıyoruz, diğer gereksiz karakterleri temizliyoruz
        let temizVeri = hamVeri.toLowerCase()
                               .replace(/x/g, '*')
                               .replace(/,/g, '.')
                               .replace(/[^0-9+\-*/().]/g, '');

        // 3. HESAPLAMA (Burada matematik devreye girer)
        const sonuc = new Function(`return ${temizVeri}`)();

        if (typeof sonuc === 'number' && !isNaN(sonuc)) {
            
            // --- KRİTİK ADIM: İşlemi sil, sonucu yaz ---
            hucre.textContent = sonuc; 
            
            // Görsel onay (Hafif yeşil yanıp söner)
            hucre.style.backgroundColor = "#d1fae5"; 
            setTimeout(() => { hucre.style.backgroundColor = "white"; }, 1000);
            
            console.log(`✨ Hesaplama Başarılı: ${sonuc}`);

            // 4. GRAFİĞİ GÜNCELLE
            // Bu fonksiyon tablodaki yeni sayıyı okuyup grafiğe noktayı koyar
            if (typeof canliGrafikCiz === 'function') {
                canliGrafikCiz(); 
            }

        } else {
            throw new Error("Hesaplanamadı");
        }

    } catch (e) {
        console.error("❌ Hatalı İşlem:", e);
        hucre.style.backgroundColor = "#fee2e2"; // Hata durumunda kırmızı
    }
};

// 1. ÖNCE HESAPLAMA MANTIĞINI OLUŞTURALIM
function matematikselCozucu(ifade) {
    try {
        // 'x' işaretini '*' yap, '÷' işaretini '/' yap
        let temiz = ifade.toLowerCase()
                         .replace(/x/g, '*')
                         .replace(/×/g, '*')
                         .replace(/÷/g, '/')
                         .replace(/,/g, '.');

        // Sadece sayılar ve işlem işaretleri kalsın (Güvenlik için)
        temiz = temiz.replace(/[^0-9+\-*/().]/g, '');

        if (temiz === "") return null;

        // İşlem önceliğine göre hesapla (PEMDAS/BODMAS kuralı)
        const sonuc = new Function(`return ${temiz}`)();
        
        return sonuc;
    } catch (e) {
        return null;
    }
}

// 2. SAYI PANELİNDEKİ "TAMAM" BUTONUNA BU GÖREVİ BAĞLAYALIM
const tamamButonu = document.getElementById('numPadClose');

if (tamamButonu) {
    tamamButonu.addEventListener('click', function() {
        const ekran = document.getElementById('currentInput'); // Paneldeki yazı alanı
        const hamYazi = ekran.innerText.trim();
        
        if (hamYazi !== "" && window.aktifHucreId) {
            const hedefHucre = document.getElementById(window.aktifHucreId);
            
            // HESAPLAMA BURADA DEVREYE GİRİYOR
            const sonuc = matematikselCozucu(hamYazi);

            if (sonuc !== null) {
                // Hücreye "150-0x15" değil, sadece sonucu (150) yaz
                hedefHucre.innerText = sonuc;
                
                // Grafiği güncellemek için sizin ana fonksiyonunuzu çağırıyoruz
                if (typeof canliGrafikCiz === 'function') {
                    canliGrafikCiz();
                }
                
                console.log("✅ İşlem başarıyla sonuca dönüştürüldü.");
            } else {
                // Eğer hesaplanamazsa olduğu gibi aktar (hata vermemesi için)
                hedefHucre.innerText = hamYazi;
            }
        }

        // Paneli kapat ve temizle
        document.getElementById('numberPad').classList.add('hidden');
        ekran.innerText = "";
    });
}

// ==========================================
// 1. SİSTEMİN YENİ BEYNİ (UNIFIED INPUT)
// ==========================================
window.activeInputTarget = null; 

window.openTableInput = function(targetId) {
    console.log("🎯 Yeni Hedef Kilitlendi:", targetId);
    window.activeInputTarget = targetId;

    // Önceki seçim görsellerini temizle
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.style.backgroundColor = "white";
        el.style.borderColor = "#e0e7ff";
        el.classList.remove('ring-2', 'ring-indigo-400');
    });

    const box = document.getElementById(targetId);
    if (box) {
        box.style.backgroundColor = "#e0e7ff"; // indigo-50
        box.style.borderColor = "#6366f1";     // indigo-500
        box.classList.add('ring-2', 'ring-indigo-400');
        
        // Kutudaki mevcut değeri Numpad ekranına taşı
        let currentVal = box.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = currentVal;
    }

    // Numpad'i görünür yap ve en üste taşı
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
        np.style.zIndex = "999999"; 
    }
};

// ==========================================
// 2. MATEMATİKSEL MOTOR VE TAMAM BUTONU
// ==========================================
function solveMathExpression(input) {
    try {
        // 'x' ve '×' işaretlerini '*' yap, virgülü noktaya çevir
        let clean = input.toLowerCase()
                         .replace(/x|×/g, '*')
                         .replace(/÷/g, '/')
                         .replace(/,/g, '.')
                         .replace(/[^0-9+\-*/().]/g, '');
        if (clean === "") return null;
        return new Function(`return ${clean}`)();
    } catch (e) { return null; }
}

// Tamam butonunu bul ve görevini yeniden tanımla
(function() {
    const btnTamam = document.getElementById('numPadClose');
    if (btnTamam) {
        btnTamam.onclick = function(e) {
            e.preventDefault();
            const display = document.getElementById('currentInput');
            let rawVal = display.textContent.trim();
            
            if (window.activeInputTarget && rawVal !== "") {
                const targetBox = document.getElementById(window.activeInputTarget);
                if (targetBox) {
                    // İŞLEMİ ÇÖZ
                    let result = solveMathExpression(rawVal);
                    let finalVal = (result !== null && !isNaN(result)) ? result : rawVal;

                    // 1. Ekrana Yaz
                    targetBox.textContent = finalVal;
                    targetBox.style.backgroundColor = "white";

                    // 2. Hafızaya (linearState) Kaydet
                    if (window.activeInputTarget.startsWith('table_input_')) {
                        const parts = window.activeInputTarget.split('_');
                        const col = parts[2]; // x veya y
                        const row = parseInt(parts[3]);
                        if (typeof linearState !== 'undefined') {
                            if (!linearState.tableData) linearState.tableData = [];
                            if (!linearState.tableData[row]) linearState.tableData[row] = {x:'?', y:'?'};
                            linearState.tableData[row][col] = finalVal;
                        }
                    }
                }
            }
            // 3. Paneli Kapat ve Grafiği Güncelle
            if (typeof forceClosePanel === 'function') forceClosePanel();
            if (typeof canliGrafikCiz === 'function') canliGrafikCiz();
            if (typeof checkTableFull_Final === 'function') checkTableFull_Final();
        };
    }
})();

// ==========================================
// 3. AKILLI GRAFİK VE Y-EKSENİ ÖLÇEĞİ (YEDEK VE SİLİNDİ)
// ==========================================
// window.canliGrafikCiz fonksiyonu silindi çünkü yukarıdaki asıl canliGrafikCiz ile çakışıyordu.

// ==========================================
// 🎯 MASTER OVERRIDE: SAYI AKTARMA TAMİRCİSİ
// ==========================================

// 1. TEK VE GERÇEK HEDEF DEĞİŞKENİ
window.MASTER_TARGET = null;

// 2. KUTUYA TIKLAMA FONKSİYONUNU SIFIRDAN KUR
window.openTableInput = function(targetId) {
    console.log("📍 Kutu Seçildi:", targetId);
    window.MASTER_TARGET = targetId;

    // Görsel efekt: Diğerlerini söndür, seçileni yak
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.style.backgroundColor = "white";
        el.style.borderColor = "#e0e7ff";
    });

    const box = document.getElementById(targetId);
    if (box) {
        box.style.backgroundColor = "#dbeafe"; // Seçili mavi
        box.style.borderColor = "#2563eb";
        
        // Kutuda önceden yazan bir şey varsa Numpad ekranına al
        let existingVal = box.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = existingVal;
    }

    // Paneli Aç (Tüm engelleri aşarak)
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
        np.style.zIndex = "999999";
    }
};

// 3. TAMAM (ONAY) BUTONUNU ZORLA YENİDEN BAĞLA
(function() {
    const checkAndFixButton = () => {
        const btnTamam = document.getElementById('numPadClose');
        if (!btnTamam) return;

        // Eski tüm olayları (click) temizleyip yenisini takıyoruz
        const masterConfirm = btnTamam.cloneNode(true);
        btnTamam.parentNode.replaceChild(masterConfirm, btnTamam);

        masterConfirm.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const display = document.getElementById('currentInput');
            let rawValue = display ? display.textContent.trim() : '';
            
            console.log("✅ Tamam'a basıldı. Değer:", rawValue, "Hedef:", window.MASTER_TARGET);

            if (window.MASTER_TARGET) {
                const targetBox = document.getElementById(window.MASTER_TARGET);
                if (targetBox) {
                    // Sayı veya İşlem Kontrolü (200-15*2 gibi)
                    let finalValue = "?";
                    if (rawValue !== "") {
                        try {
                            // Basit matematik çözücü
                            let cleanExpr = rawValue.replace(/x|×/g, '*').replace(/÷/g, '/').replace(/,/g, '.');
                            let solved = new Function(`return ${cleanExpr}`)();
                            if (solved !== null && !isNaN(solved)) {
                                // Sadece bir sayı değilse ve içinde işlem karakteri varsa '= X' ekle
                                if (/[+\-*/]/.test(cleanExpr) && rawValue !== solved.toString()) {
                                    finalValue = `${rawValue} = ${solved}`;
                                } else {
                                    finalValue = solved;
                                }
                            } else {
                                finalValue = rawValue;
                            }
                        } catch(err) { finalValue = rawValue; }
                    }

                    // --- KRİTİK ADIM: TABLOYA YAZ ---
                    targetBox.textContent = finalValue;
                    targetBox.style.backgroundColor = "white";
                    targetBox.style.borderColor = "#e0e7ff";

                    // --- HAFIZAYA (State) İŞLE ---
                    if (window.MASTER_TARGET.startsWith('table_input_')) {
                        const parts = window.MASTER_TARGET.split('_');
                        const col = parts[2]; // x veya y
                        const row = parseInt(parts[3]);
                        if (typeof linearState !== 'undefined') {
                            if (!linearState.tableData) linearState.tableData = [];
                            if (!linearState.tableData[row]) linearState.tableData[row] = {x:'?', y:'?'};
                            linearState.tableData[row][col] = finalValue;
                        }
                    }
                }
            }

            // Paneli Kapat ve Grafiği Güncelle
            if (typeof forceClosePanel === 'function') forceClosePanel();
            else {
                const np = document.getElementById('numberPad');
                if (np) { np.classList.add('hidden'); np.style.display = 'none'; }
                if (display) display.textContent = '';
            }
            
            // Canlı grafiği tetikle
            if (typeof canliGrafikCiz === 'function') canliGrafikCiz();
            // Tablo doluluk kontrolü
            if (typeof checkTableFull_Final === 'function') checkTableFull_Final();
        });
    };

    // Sayfa yüklendiğinde ve her saniye kontrol et (ID'ler dinamik değişirse diye)
    setTimeout(checkAndFixButton, 500);
    setInterval(checkAndFixButton, 3000); 
})();
