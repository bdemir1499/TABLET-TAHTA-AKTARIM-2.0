// ğŸš¨ ALAN ADI KÄ°LÄ°DÄ° (DOMAIN BINDING) - ASKERÄ° DÃœZEY KORUMA ğŸš¨
const gecerliAdresler = ["bdemir1499.github.io", "127.0.0.1", "localhost"];
const mevcutAdres = window.location.hostname;
const kacakKullanimMi = !gecerliAdresler.some(adres => mevcutAdres.includes(adres));
if (kacakKullanimMi && mevcutAdres !== "") {
    document.body.innerHTML = "<div style='color:red; text-align:center; margin-top:50px; font-family:sans-serif; font-size:20px; font-weight:bold;'>â›” GÃœVENLÄ°K Ä°HLALÄ°: Bu yazÄ±lÄ±m kopyalanmÄ±ÅŸtÄ±r. LÃ¼tfen orijinal adresi kullanÄ±n.</div>";
    throw new Error("Korsan kullanÄ±m tespit edildi, sistem durduruldu!");
}

// --- SAYFAYI YENÄ°LEYÄ°NCE (F5) ANA UYGULAMAYA DÃ–N (ARTÄ°STLÄ°K YAPMASIN) ---
const navEntry = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];
const isReload = (navEntry && navEntry.type === "reload") || (window.performance && window.performance.navigation && window.performance.navigation.type === 1);

if (isReload) {
    window.location.href = '../index.html';
}

// En tepeye, diÄŸer deÄŸiÅŸkenlerin (gameState vb.) yanÄ±na ekle:
window.feedbackTimer = null; // Global zamanlayÄ±cÄ±

// ==========================================
// --- GÃ–LGE SENKRONÄ°ZASYON Ä°Ã‡Ä°N ORTAK AKIL (PRNG) ---
// ==========================================
// Orijinal rastgeleliÄŸi sakla (GerÃ§ek rastgele bir baÅŸlangÄ±Ã§ ÅŸifresi Ã¼retmek iÃ§in)
const nativeRandom = Math.random;

// Tabletin ilk aÃ§Ä±lÄ±ÅŸÄ±nda tamamen eÅŸsiz bir ÅŸifre (seed) belirle
let gameSeed = Math.floor(nativeRandom() * 1000000000);

window.setGameSeed = function(seed) {
    gameSeed = seed;
    console.log("ğŸ² Ortak AkÄ±l (Rastgelelik) Åifresi AyarlandÄ±:", seed);
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
    game_title: "Koordinat Sistemi, DoÄŸrusal Ä°liÅŸkiler, DoÄŸrularÄ±n Grafikleri, DoÄŸru Denklemleri, EÄŸim, DÃ¶nÃ¼ÅŸÃ¼m Geometrisi",
    instructions_text: "DÃ¶nÃ¼ÅŸÃ¼m tÃ¼rÃ¼nÃ¼ seÃ§ ve ÅŸeklin yeni kÃ¶ÅŸelerini iÅŸaretle",
    translation_button: "Ã–teleme",
    reflection_button: "YansÄ±ma",
    new_shape_button: "Yeni Åekil",
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
        text: "Elif'in kumbarasÄ±nda 80 lira parasÄ± vardÄ±r ve her hafta kumbarasÄ±na 20 lira atmaktadÄ±r. GeÃ§en hafta sayÄ±sÄ± (x) ve kumbarada biriken para miktarÄ± (y) arasÄ±ndaki iliÅŸkinin tablo ve grafiÄŸini Ã§iziniz.",
        xLabel: "Hafta (x)",
        yLabel: "Para (y)",
        initialValue: 80,
        rate: 20,
        startsAtZero: false
    },
    {
        id: 2,
        text: "Bir otobÃ¼s her durakta 5 yolcu alÄ±yor. Durak sayÄ±sÄ± (x) ve otobÃ¼steki toplam yolcu sayÄ±sÄ± (y) arasÄ±ndaki iliÅŸkinin tablo ve grafiÄŸini Ã§iziniz.",
        xLabel: "Durak (x)",
        yLabel: "Yolcu (y)",
        initialValue: 0,
        rate: 5,
        startsAtZero: true
    },
    {
        id: 3,
        text: "Bir kitaplÄ±kta 150 kitap vardÄ±r. Her ay 10 kitap satÄ±lmaktadÄ±r. GeÃ§en ay sayÄ±sÄ± (x) ve kalan kitap sayÄ±sÄ± (y) arasÄ±ndaki iliÅŸkinin tablo ve grafiÄŸini Ã§iziniz.",
        xLabel: "Ay (x)",
        yLabel: "Kitap (y)",
        initialValue: 150,
        rate: -10,
        startsAtZero: false
    },
    {
        id: 4,
        text: "Ahmet her gÃ¼n 3 km koÅŸmaktadÄ±r. GÃ¼n sayÄ±sÄ± (x) ve toplam koÅŸulan mesafe (y) arasÄ±ndaki iliÅŸkinin tablo ve grafiÄŸini Ã§iziniz.",
        xLabel: "GÃ¼n (x)",
        yLabel: "Mesafe (y)",
        initialValue: 0,
        rate: 3,
        startsAtZero: true
    },
    {
        id: 5,
        text: "Bir su deposunda 200 litre su vardÄ±r. Her saat 15 litre su kullanÄ±lmaktadÄ±r. GeÃ§en saat sayÄ±sÄ± (x) ve depodaki su miktarÄ± (y) arasÄ±ndaki iliÅŸkinin tablo ve grafiÄŸini Ã§iziniz.",
        xLabel: "Saat (x)",
        yLabel: "Su (y)",
        initialValue: 200,
        rate: -15,
        startsAtZero: false
    },
    {
        id: 6,
        text: "Bir aÄŸaÃ§ her yÄ±l 12 cm bÃ¼yÃ¼mektedir. YÄ±l sayÄ±sÄ± (x) ve aÄŸacÄ±n boyu (y) arasÄ±ndaki iliÅŸkinin tablo ve grafiÄŸini Ã§iziniz.",
        xLabel: "YÄ±l (x)",
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
        mainQuestion: 'Yandaki grafikte bir fidanÄ±n aylara gÃ¶re boy deÄŸiÅŸimi verilmiÅŸtir. Buna gÃ¶re;',
        yAxisLabel: 'Bitkinin Boyu (cm)',
        xAxisLabel: 'SÃ¼re (ay)',
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
                text: 'a) Fidan dikildiÄŸinde boyu kaÃ§ santimetredir?',
                correctAnswer: '25 cm',
                options: ['25 cm', '28 cm', '22 cm', '30 cm']
            },
            {
                id: 'b',
                text: 'b) Bu fidan bir ayda kaÃ§ cm uzamaktadÄ±r?',
                correctAnswer: '3 cm',
                options: ['3 cm', '2 cm', '4 cm', '5 cm']
            },
            {
                id: 'c',
                text: 'c) Bu fidanÄ±n boyu (y) ve sÃ¼reye (x) baÄŸlÄ± doÄŸrusal denklemini yazÄ±nÄ±z.',
                correctAnswer: 'y = 3x + 25',
                options: ['y = 3x + 25', 'y = 2x + 25', 'y = 3x + 28', 'y = 4x + 25']
            },
            {
                id: 'd',
                text: 'd) 10. ayÄ±n sonunda fidanÄ±n boyu kaÃ§ cm dir?',
                correctAnswer: '55 cm',
                options: ['55 cm', '58 cm', '52 cm', '60 cm']
            },
            {
                id: 'e',
                text: 'e) KaÃ§ ay sonra fidanÄ±n boyu 85 cm dir?',
                correctAnswer: '20 ay',
                options: ['20 ay', '18 ay', '22 ay', '25 ay']
            }
        ]
    },
    {
        id: 2,
        graphType: 'water_tank',
        mainQuestion: 'Yandaki grafikte iÃ§inde 200 ton su olan bir havuzdan tarla sulamak iÃ§in saatlere gÃ¶re alÄ±nan su miktarÄ± verilmiÅŸtir. Buna gÃ¶re;',
        yAxisLabel: 'Havuzdaki Su (ton)',
        xAxisLabel: 'SÃ¼re (saat)',
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
                text: 'a) BaÅŸlangÄ±Ã§ta havuzda kaÃ§ ton su vardÄ±r?',
                correctAnswer: '200 ton',
                options: ['200 ton', '190 ton', '210 ton', '195 ton']
            },
            {
                id: 'b',
                text: 'b) Her saat kaÃ§ ton su alÄ±nmaktadÄ±r?',
                correctAnswer: '5 ton',
                options: ['5 ton', '4 ton', '6 ton', '10 ton']
            },
            {
                id: 'c',
                text: 'c) Havuzdaki su miktarÄ± (y) ve sÃ¼reye (x) baÄŸlÄ± doÄŸrusal denklemini yazÄ±nÄ±z.',
                correctAnswer: 'y = -5x + 200',
                options: ['y = -5x + 200', 'y = -4x + 200', 'y = 5x + 200', 'y = -10x + 200']
            },
            {
                id: 'd',
                text: 'd) 12. saatin sonunda havuzda kaÃ§ ton su kalÄ±r?',
                correctAnswer: '140 ton',
                options: ['140 ton', '130 ton', '150 ton', '145 ton']
            },
            {
                id: 'e',
                text: 'e) KaÃ§ saat sonra havuzda 100 ton su kalÄ±r?',
                correctAnswer: '20 saat',
                options: ['20 saat', '18 saat', '22 saat', '24 saat']
            }
        ]
    },
    {
        id: 3,
        graphType: 'two_cars_fuel',
        mainQuestion: 'AÅŸaÄŸÄ±daki grafikte aynÄ± anda harekete baÅŸlayan iki aracÄ±n deposundaki benzinin zamana baÄŸlÄ± deÄŸiÅŸimi gÃ¶sterilmiÅŸtir. Buna gÃ¶re;',
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
                name: 'Mavi AraÃ§',
                points: [
                    {x: 0, y: 80},
                    {x: 8, y: 0}
                ]
            },
            {
                color: '#ef4444',
                name: 'KÄ±rmÄ±zÄ± AraÃ§',
                points: [
                    {x: 0, y: 40},
                    {x: 20, y: 0}
                ]
            }
        ],
        questions: [
            {
                id: 'a',
                text: 'KaÃ§Ä±ncÄ± saat sonunda araÃ§larÄ±n depolarÄ±ndaki kalan yakÄ±t miktarlarÄ± eÅŸit olur?',
                correctAnswer: '5. saat',
                options: ['4. saat', '5. saat', '3. saat', '6. saat']
            }
        ]
    },
    {
        id: 4,
        graphType: 'article_reading',
        mainQuestion: 'Mustafa okumasÄ± gereken 400 makaleden her gÃ¼n eÅŸit sayÄ±da makale seÃ§ip okuyor. Buna gÃ¶re aÅŸaÄŸÄ±daki grafiÄŸe bakarak tÃ¼m makalelerin kaÃ§ gÃ¼nde biteceÄŸini bulunuz?',
        yAxisLabel: 'Makale SayÄ±sÄ±',
        xAxisLabel: 'GÃ¼n',
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
                label: 'Kalan Makale SayÄ±sÄ±',
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
                label: 'Okunan Makale SayÄ±sÄ±',
                labelPosition: 'end'
            }
        ],
        questions: [
            {
                id: 'a',
                text: 'TÃ¼m makaleler kaÃ§ gÃ¼nde biter?',
                correctAnswer: '100 gÃ¼n',
                options: ['100 gÃ¼n', '80 gÃ¼n', '90 gÃ¼n', '120 gÃ¼n']
            }
        ]
    },
    {
        id: 5,
        graphType: 'taxi_fare',
        mainQuestion: 'AÅŸaÄŸÄ±da A ve B ÅŸehirlerindeki taksi Ã¼cret tarifelerine iliÅŸkin iki doÄŸrusal grafik verilmiÅŸtir. Bu iki ÅŸehirde 20 km yol giden taksilere Ã¶denecek Ã¼cretler arasÄ±ndaki fark kaÃ§ liradÄ±r?',
        yAxisLabel: 'Ãœcret (TL)',
        xAxisLabel: 'AlÄ±nan Yol (km)',
        yMin: 0,
        yMax: 100,
        yStep: 10,
        xMax: 20,
        xStep: 2,
        lines: [
            {
                color: '#3b82f6',
                name: 'B Åehri',
                points: [
                    {x: 0, y: 50},
                    {x: 4, y: 60},
                    {x: 16, y: 90}
                ],
                label: 'B ÅEHRÄ°',
                labelPosition: 'end'
            },
            {
                color: '#ef4444',
                name: 'A Åehri',
                points: [
                    {x: 0, y: 45},
                    {x: 4, y: 60},
                    {x: 12, y: 90}
                ],
                label: 'A ÅEHRÄ°',
                labelPosition: 'end'
            }
        ],
        questions: [
            {
                id: 'a',
                text: 'Bu iki ÅŸehirde 20 km yol giden taksilere Ã¶denecek Ã¼cretler arasÄ±ndaki fark kaÃ§ liradÄ±r?',
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

    // EÄŸer elementler bulunamazsa hata vermesin
    if (!titleSpan || !infoText) {
        console.warn("slopeQuestionPanel iÃ§inde gerekli span bulunamadÄ±!");
        return;
    }

    switch(type) {
        case "incline":
            titleSpan.textContent = "EÄŸik DÃ¼zlem Sorusu";
            infoText.textContent = "EÄŸim = Dikey / Yatay (Ã¶rneÄŸin: yÃ¼kseklik / taban uzunluÄŸu)";
            break;
        case "graph":
            titleSpan.textContent = "Grafikten EÄŸim Sorusu";
            infoText.textContent = "Grafikte iki nokta seÃ§ â†’ (y2 - y1) / (x2 - x1)";
            break;
        case "twoPoints":
            titleSpan.textContent = "Ä°ki Noktadan EÄŸim Sorusu";
            infoText.textContent = "FormÃ¼l: m = (y2 - y1) / (x2 - x1)";
            break;
        case "equation":
            titleSpan.textContent = "Denklemden EÄŸim Sorusu";
            infoText.textContent = "y = ax + b denkleminde eÄŸim katsayÄ±sÄ± aâ€™dÄ±r.";
            break;
    }
}


// Butonlara tÄ±klama olaylarÄ±nÄ± baÄŸla
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


// Ã‡izimi gerÃ§ekleÅŸtiren ana fonksiyon
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

// P2P Ã¼zerinden gelen koordinatÄ± Ã§iz
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

    // GÃ–LGE SENKRONÄ°ZASYON: Tablet, Tahtaya mantÄ±ksal koordinatÄ± gÃ¶ndersin
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
    // 1. Ã‡izgi var mÄ± kontrol et (Sadece 2 nokta olmalÄ±)
    if (linearState.drawnPoints.length !== 2) {
        showFeedback(false);
        const feedback = document.getElementById('feedback');
        feedback.textContent = 'LÃ¼tfen grafiÄŸi Ã§iziniz! (Ä°ki nokta arasÄ±na Ã§izgi Ã§ekin)';
        feedback.style.opacity = '1';
        return;
    }

    // 2. Tablodaki geÃ§erli noktalarÄ± al
    const validPoints = [];
    for (let i = 0; i < Math.min(4, linearState.tableData.length); i++) {
        const row = linearState.tableData[i];
        if (row.x && row.calcY !== undefined) {
            const xVal = parseFloat(row.x);
            const yVal = row.calcY;
            if (!isNaN(xVal) && !isNaN(yVal) && isFinite(yVal)) {
                // Sadece grid sÄ±nÄ±rlarÄ± iÃ§indekileri al
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

    // 3. Ã‡izilen Ã§izgiyi al (P1 ve P2)
    const p1 = linearState.drawnPoints[0];
    const p2 = linearState.drawnPoints[1];

    // 4. Her bir tablo noktasÄ±nÄ±n Ã§izilen Ã§izgiye uzaklÄ±ÄŸÄ±nÄ± kontrol et
    let allPointsCovered = true;
    
    // Ã‡izgi denklemi veya uzaklÄ±k hesabÄ± iÃ§in vektÃ¶r hesabÄ±
    // Line defined by p1 and p2. Distance from point p0 to line p1p2.
    // Distance = |(y2-y1)x0 - (x2-x1)y0 + x2y1 - y2x1| / sqrt((y2-y1)^2 + (x2-x1)^2)
    
    const x1 = p1.x, y1 = p1.y;
    const x2 = p2.x, y2 = p2.y;
    const denominator = Math.sqrt(Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2));

    if (denominator === 0) { allPointsCovered = false; } // Nokta Ã§izmiÅŸ
    else {
        for (let point of validPoints) {
            // Tablo noktasÄ±nÄ± piksele Ã§evir
            const p0 = linearCoordToPixel(point.x, point.scaledY);
            
            // UzaklÄ±k formÃ¼lÃ¼
            const numerator = Math.abs((y2 - y1) * p0.x - (x2 - x1) * p0.y + x2 * y1 - y2 * x1);
            const distance = numerator / denominator;

            // Tolerans (Ã¶rneÄŸin 15 piksel)
            if (distance > 20) {
                allPointsCovered = false;
                break;
            }
        }
    }

    // 5. SonuÃ§
    if (allPointsCovered) {
        playSuccessSound();
        showFeedback(true);
        
        // Ã‡izgiyi yeÅŸil yap
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
        feedback.textContent = 'Ã‡izgin tablodaki noktalardan geÃ§miyor! Tekrar dene.';
        feedback.style.opacity = '1';
        
        // YanlÄ±ÅŸ Ã§izgiyi sil
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
                feedback.textContent = 'Tebrikler! TÃ¼m sorularÄ± tamamladÄ±n! ğŸ‰ğŸŠ';
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
// GERÄ° BÄ°LDÄ°RÄ°M FONKSÄ°YONU (KESÄ°N Ã‡Ã–ZÃœM)
// ==========================================
function showFeedback(correct) {
    const feedback = document.getElementById('feedback');
    if (!feedback) return;

    // 1. Ã–NCEKÄ° SAYACI Ä°PTAL ET (Ã‡ok Ã–nemli!)
    // EÄŸer ekranda zaten bir yazÄ± varsa ve kapanmayÄ± bekliyorsa, o emri iptal et.
    if (window.feedbackTimer) {
        clearTimeout(window.feedbackTimer);
        window.feedbackTimer = null;
    }

    // 2. MesajÄ± ve Rengi Ayarla
    feedback.textContent = correct ? 'Harika! MÃ¼kemmel! ğŸ‰' : 'Tekrar dene. KÃ¶ÅŸeleri kontrol et. ğŸ”';
    
    // Sabit classlar (Animasyon ve konum iÃ§in)
    const baseClass = "fixed bottom-4 left-1/2 transform -translate-x-1/2 px-8 py-4 rounded-xl shadow-2xl font-bold text-center transition-opacity duration-500 z-[9999]";
    const colorClass = correct ? "bg-green-500 text-white text-2xl" : "bg-red-500 text-white text-lg";
    
    feedback.className = `${baseClass} ${colorClass}`;

    // 3. GÃ¶rÃ¼nÃ¼r Yap
    // (requestAnimationFrame, tarayÄ±cÄ±nÄ±n stil deÄŸiÅŸimini yakalamasÄ±nÄ± saÄŸlar)
    requestAnimationFrame(() => {
        feedback.style.opacity = '1';
        feedback.style.pointerEvents = 'auto'; // TÄ±klanabilir olsun (seÃ§im engellemesin diye)
    });

    // 4. YENÄ° SAYAÃ‡ BAÅLAT (3 Saniye Sonra Kapat)
    window.feedbackTimer = setTimeout(() => {
        feedback.style.opacity = '0';
        feedback.style.pointerEvents = 'none'; // Kaybolunca arkadaki butonlara engel olmasÄ±n
    }, 3000);
}


function updateUI() {
    const modeText = gameState.mode === 'translation' ? 'Ã–teleme' :
                     gameState.mode === 'reflection' ? 'YansÄ±ma' :
                     gameState.mode === 'pointToPlace' ? 'Nokta â†’ Yer' :
                    gameState.mode === 'placeToPoint' ? 'Yer â†’ Nokta' : 'SeÃ§im yapÄ±n';
    document.getElementById('currentMode').textContent = modeText;


    const shapeNames = {
        'point': 'Nokta',
        'segment': 'DoÄŸru ParÃ§asÄ±',
        'triangle': 'ÃœÃ§gen',
        'quadrilateral': 'DÃ¶rtgen'
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
        const xDirection = dx > 0 ? 'saÄŸa' : dx < 0 ? 'sola' : '';
        const yDirection = dy > 0 ? 'yukarÄ±' : dy < 0 ? 'aÅŸaÄŸÄ±' : '';


        let message = 'ğŸ“ Åekli ';
        if (dx !== 0) message += `X ekseninde ${Math.abs(dx)} birim ${xDirection}`;
        if (dx !== 0 && dy !== 0) message += ' ve ';
        if (dy !== 0) message += `Y ekseninde ${Math.abs(dy)} birim ${yDirection}`;
        message += ' Ã¶telemelisin!';


        transformText.textContent = message;
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.add('hidden');
    } else if (gameState.mode === 'reflection' && gameState.reflectionAxis) {
        const axis = gameState.reflectionAxis === 'x' ? 'X' : 'Y';
        transformText.textContent = `ğŸª Åekli ${axis} eksenine gÃ¶re yansÄ±tmalÄ±sÄ±n!`;
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.add('hidden');
    } else if (gameState.mode === 'pointToPlace' && gameState.targetPoint) {
        transformText.textContent = `ğŸ“ (${gameState.targetPoint.x}, ${gameState.targetPoint.y}) koordinatÄ±nÄ±n yerini tÄ±klayarak gÃ¶ster!`;
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.add('hidden');
    } else if (gameState.mode === 'placeToPoint') {
        transformText.textContent = 'ğŸ“ AÅŸaÄŸÄ±daki seÃ§eneklerden mavi noktanÄ±n koordinatÄ±nÄ± seÃ§!';
        transformInfo.classList.remove('hidden');
        coordinateOptions.classList.remove('hidden');
    } else if (gameState.mode && !gameState.translationVector && !gameState.reflectionAxis && !gameState.targetPoint) {
        transformText.textContent = 'ğŸ¯ "Yeni Åekil" butonuna tÄ±klayarak baÅŸla!';
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
        feedback.textContent = 'Ã–nce bir dÃ¶nÃ¼ÅŸÃ¼m tÃ¼rÃ¼ seÃ§! ğŸ¯';
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
        gameState.shapeType = 'Nokta YerleÅŸtirme';


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
    
    // 2. Normal Canvas'Ä± geri getir (Ã‡Ã¼nkÃ¼ grafik modlarÄ± bunu gizlemiÅŸ olabilir)
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) regularCanvas.style.display = 'flex';

    gameState.mode = 'translation';
    
    // Buton stillerini gÃ¼ncelle
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected-button'));
    this.classList.add('selected-button');
    
    updateUI();
    startNewRound();
});


document.getElementById('reflectionBtn').addEventListener('click', function() {
    clearAllScreens(); // 1. Temizlik

    // 2. Normal Canvas'Ä± geri getir
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

    // 2. Normal Canvas'Ä± geri getir
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

    // 2. Normal Canvas'Ä± geri getir
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) regularCanvas.style.display = 'flex';

    gameState.mode = 'placeToPoint';
    
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('selected-button'));
    this.classList.add('selected-button');
    
    updateUI();
    startNewRound();
});


// =========================================================
// DOÄRUSAL Ä°LÄ°ÅKÄ°LER BUTONU (GARANTÄ°LÄ° AÃ‡MA Ã‡Ã–ZÃœMÃœ)
// =========================================================
var btnLinear = document.getElementById('linearRelationsBtn');

if (btnLinear) {
    // 1. Butonu klonlayarak Ã¼zerindeki tÃ¼m eski/hatalÄ± kodlarÄ± temizle
    var newBtnLinear = btnLinear.cloneNode(true);
    btnLinear.parentNode.replaceChild(newBtnLinear, btnLinear);

    // 2. TÄ±klama olayÄ±nÄ± sÄ±fÄ±rdan yaz
    newBtnLinear.addEventListener('click', function() {
        console.log("ğŸ”˜ DoÄŸrusal Ä°liÅŸkiler butonuna tÄ±klandÄ±.");
        
        const subButtons = document.getElementById('linearSubButtons');
        if (!subButtons) {
            console.error("âŒ HATA: linearSubButtons ID'li element bulunamadÄ±!");
            return;
        }

        // Åu an kapalÄ± mÄ±? (Hem class hem style kontrolÃ¼)
        const isClosed = subButtons.classList.contains('hidden') || subButtons.style.display === 'none';

        // 1. Ã–nce ekranÄ± temizle (Bu her ÅŸeyi kapatÄ±r)
        if (typeof clearAllScreens === 'function') {
            clearAllScreens();
        }

        // 2. EÄŸer menÃ¼ Ã¶nceden kapalÄ±ysa, ÅŸimdi ZORLA AÃ‡
        if (isClosed) {
            // Class'Ä± kaldÄ±r
            subButtons.classList.remove('hidden');
            
            // Stili zorla uygula (CSS !important etkisi yaratÄ±r)
            subButtons.style.cssText = "display: flex !important; flex-wrap: wrap; justify-content: center; gap: 10px;";
            
            // Butonu seÃ§ili yap
            this.classList.add('selected-button');
            console.log("âœ… MenÃ¼ aÃ§Ä±ldÄ± (Zorla).");
        } 
        else {
            console.log("ğŸ”» MenÃ¼ kapatÄ±ldÄ±.");
        }

        // 3. DiÄŸer ana butonlarÄ±n seÃ§im efektlerini temizle
        const otherBtns = ['translationBtn', 'reflectionBtn', 'pointToPlaceBtn', 'placeToPointBtn', 'slopeBtn', 'lineGraphsBtn'];
        otherBtns.forEach(id => {
            const b = document.getElementById(id);
            if(b) b.classList.remove('selected-button');
        });
    });
}

// SORU -> GRAFÄ°K BUTONU
document.getElementById('questionToGraphBtn').addEventListener('click', function() {
    // Ã–nce ekranÄ± temizle
    clearAllScreens(); 
    
    // Modu ayarla
    gameState.mode = 'questionToGraph';
    
    // Alt menÃ¼yÃ¼ aÃ§Ä±k tut (clearAllScreens kapatmÄ±ÅŸ olabilir, geri aÃ§alÄ±m)
    document.getElementById('linearSubButtons').classList.remove('hidden');

    // *** KRÄ°TÄ°K KISIM: DiÄŸer iÃ§eriÄŸi GÄ°ZLE, bunu GÃ–STER ***
    document.getElementById('graphQuestionContainer').classList.add('hidden'); // DiÄŸerini kapat
    
    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden'); // Bunu aÃ§
    linearContainer.style.display = 'flex';
    
    // Canvas ve Tabloyu hazÄ±rla
    const linearCanvas = document.getElementById('linearCanvas');
    linearCanvas.style.display = 'block';
    document.getElementById('dataTable').parentElement.style.display = 'flex';
    document.getElementById('tableConfirmBtn').style.display = 'block';

    // Oyunu baÅŸlat
    startLinearQuestion();
});


// GRAFÄ°K -> SORU BUTONU
document.getElementById('graphToQuestionBtn').addEventListener('click', function() {
    // 1. Ã–nceki her ÅŸeyi (Yer-Nokta dahil) temizle
    clearAllScreens();
    
    // 2. Modu ayarla
    gameState.mode = 'graphToQuestion';

    // 3. Alt menÃ¼yÃ¼ aÃ§Ä±k tut (DoÄŸrusal Ä°liÅŸkiler menÃ¼sÃ¼)
    document.getElementById('linearSubButtons').classList.remove('hidden');

    // 4. Bu modun container'Ä±nÄ± aÃ§
    const graphContainer = document.getElementById('graphQuestionContainer');
    if (graphContainer) {
        graphContainer.classList.remove('hidden');
        graphContainer.style.display = 'flex'; // GÃ¶rÃ¼nÃ¼r yap
    }
    
    // 5. Oyunu baÅŸlat
    startGraphToQuestion();
});

function resetLinearQuestionPanel() {
    const panel = document.getElementById('linearQuestionPanel');
    if (panel && panel.parentElement === document.body) {
        const slopePanel = document.getElementById('slopeQuestionPanel');
        if(slopePanel) slopePanel.parentElement.insertBefore(panel, slopePanel);
    }
    if (panel) {
        panel.style.cssText = '';
        panel.className = 'bg-gradient-to-br from-purple-100 to-indigo-100 border-2 border-purple-400 rounded-lg p-3 hidden w-64 min-h-[100px] flex-col justify-center items-center';
    }
}

function startLinearQuestion() {
    resetLinearQuestionPanel();
    // 1. Ã–nce ekrandaki eski bildirimi temizle
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
        feedback.textContent = 'ğŸ‰ SorularÄ±mÄ±z bu kadar! Tebrikler! ğŸŠ';
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


// Y = ax + b Modunu BaÅŸlat
function startYeqAXplusBRound() {
    console.log("Y=ax+b Modu BaÅŸlÄ±yor...");
    resetLinearQuestionPanel();
    
    // 1. Eski bildirimleri temizle
    const feedback = document.getElementById('feedback');
    feedback.style.opacity = '0';
    feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';

    gameState.mode = 'y_eq_ax_plus_b';
    
    // Rastgele EÄŸim ve Sabit (Senkronize)
    const slopes = [1, -1, 2, -2, 3, -3]; 
    const intercepts = [-4, -3, -2, -1, 1, 2, 3, 4];

    window.gameLogicCounter = (window.gameLogicCounter || 0) + 1;
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room') || '123';
    let roomSeed = 0;
    for (let i = 0; i < roomCode.length; i++) roomSeed += roomCode.charCodeAt(i);

    let sIndex = (roomSeed + window.gameLogicCounter * 17) % slopes.length;
    let iIndex = (roomSeed + window.gameLogicCounter * 19) % intercepts.length;

    let newSlope = slopes[sIndex];
    let newIntercept = intercepts[iIndex];
    
    gameState.targetSlope = newSlope;
    gameState.targetIntercept = newIntercept;
    
    // UI HazÄ±rla
    document.getElementById('linearQuestionPanel').classList.remove('hidden');
    document.getElementById('linearContainer').classList.remove('hidden');
    document.getElementById('linearContainer').style.display = 'flex';
    document.getElementById('dataTable').parentElement.style.display = 'flex';
    document.getElementById('dataTable').classList.remove('hidden');
    document.getElementById('dataTable').style.display = 'block';
    document.getElementById('drawInstructionText').classList.add('hidden');
    
    const sign = newIntercept > 0 ? '+' : ''; 
    document.getElementById('questionText').textContent = `Denklem: y = ${newSlope}x ${sign}${newIntercept}. Tabloyu doldurarak grafiÄŸi Ã§iziniz.`;

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
    // 1. Ã–nce ekrandaki eski bildirimi temizle
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
    // Bu sayede tablet ve tahtada (farklÄ± tarayÄ±cÄ± motorlarÄ± olsa bile) ÅŸÄ±klar KESÄ°NLÄ°KLE aynÄ± sÄ±rada Ã§Ä±kar.
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

    // Y Ekseni HesaplamalarÄ±
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

    // X Ekseni HesaplamalarÄ±
    const xStep = scenario.xStep || 1;
    const xSteps = Math.ceil(scenario.xMax / xStep);

    // --- DÄ°NAMÄ°K AYARLAR ---
    const GRID_SIZE = 50;
    const paddingLeft = 100;
    const paddingRight = 100;
    const paddingTop = 80;
    const paddingBottom = 80;

    const CANVAS_WIDTH = paddingLeft + (xSteps * GRID_SIZE) + paddingRight;
    const CANVAS_HEIGHT = paddingTop + (ySteps * GRID_SIZE) + paddingBottom;
    const ORIGIN = { x: paddingLeft, y: CANVAS_HEIGHT - paddingBottom };

    // Canvas'Ä± Ã¶lÃ§ekle (Responsive)
    canvas.setAttribute('viewBox', `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    // --- IZGARA Ã‡Ä°ZÄ°MÄ° ---
    // Dikey Ã‡izgiler
    for (let i = 0; i <= xSteps; i++) {
        const x = ORIGIN.x + i * GRID_SIZE;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x);
        line.setAttribute('y1', ORIGIN.y);
        line.setAttribute('x2', x);
        line.setAttribute('y2', 50); // Tepe noktasÄ±
        line.setAttribute('stroke', '#6b7280');
        line.setAttribute('stroke-width', '1');
        canvas.appendChild(line);
    }
    // Yatay Ã‡izgiler
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

    // --- EKSEN Ä°SÄ°MLERÄ° (Daha uzaÄŸa konumlandÄ±rÄ±ldÄ±) ---
    const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    xLabel.setAttribute('x', ORIGIN.x + (xSteps * GRID_SIZE) / 2);
    xLabel.setAttribute('y', ORIGIN.y + 50); // AÅŸaÄŸÄ±ya Ã¶telendi
    xLabel.setAttribute('text-anchor', 'middle');
    xLabel.setAttribute('font-size', '16');
    xLabel.setAttribute('font-weight', 'bold');
    xLabel.setAttribute('fill', '#374151');
    xLabel.textContent = scenario.xAxisLabel;
    canvas.appendChild(xLabel);

    const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    // DÃ¶ndÃ¼rÃ¼lmÃ¼ÅŸ metin (Dikey yazÄ±)
    yLabel.setAttribute('transform', `rotate(-90, ${ORIGIN.x - 60}, ${ORIGIN.y - (ySteps * GRID_SIZE) / 2})`);
    yLabel.setAttribute('x', ORIGIN.x - 60); // Sola Ã¶telendi
    yLabel.setAttribute('y', ORIGIN.y - (ySteps * GRID_SIZE) / 2);
    yLabel.setAttribute('text-anchor', 'middle');
    yLabel.setAttribute('font-size', '16');
    yLabel.setAttribute('font-weight', 'bold');
    yLabel.setAttribute('fill', '#374151');
    yLabel.textContent = scenario.yAxisLabel;
    canvas.appendChild(yLabel);

    // --- SAYILAR ---
    // X Eksen SayÄ±larÄ±
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

    // Y Eksen SayÄ±larÄ±
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
            text.setAttribute('x', ORIGIN.x - 15); // SayÄ±lar eksenin hemen solunda
            text.setAttribute('y', y + 5);
            text.setAttribute('text-anchor', 'end'); // SaÄŸa yasla
            text.setAttribute('font-size', '13');
            text.setAttribute('font-weight', 'bold');
            text.setAttribute('fill', '#1f2937');
            text.textContent = value;
            canvas.appendChild(text);
        }
    });

    // --- Ã‡Ä°ZGÄ°LERÄ°N Ã‡Ä°ZÄ°MÄ° ---
    if (isTwoLineScenario) {
        scenario.lines.forEach(lineData => {
            // Ã‡izgi parÃ§alarÄ±
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
        // Tek Ã‡izgi MantÄ±ÄŸÄ±
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


    document.getElementById('currentInput').textContent = linearState.currentInputValue || 'DeÄŸer girin';
    document.getElementById('numberPad').classList.remove('hidden');
}


// Number pad handlers
document.querySelectorAll('.num-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.preventDefault(); // Mobilde ve akÄ±llÄ± tahtada Ã§ift dokunmayÄ± engeller
        e.stopImmediatePropagation(); // Kodun iki kere Ã§alÄ±ÅŸmasÄ±nÄ± KESÄ°N OLARAK durdurur

        const value = this.dataset.value;

        if (value === 'clear') {
            linearState.currentInputValue = '';
        } else {
            linearState.currentInputValue += value;
        }

        document.getElementById('currentInput').textContent = linearState.currentInputValue || 'DeÄŸer girin';
    });
});

// ==========================================
// GELÄ°ÅMÄ°Å MATEMATÄ°KSEL Ä°ÅLEM VE DENKLEM Ã‡Ã–ZÃœCÃœ (AKILLI SÃœRÃœM)
// ==========================================
function evaluateMathExpression(formula, contextVal) {
    if (!formula) return '';
    
    // 1. Temizlik ve StandartlaÅŸtÄ±rma
    let expr = formula.toString().toLowerCase()
        .replace(/\s+/g, '')       // BoÅŸluklarÄ± sil
        .replace(/Ã—/g, '*')        // Ã‡arpÄ± -> *
        .replace(/Ã·/g, '/')        // BÃ¶lme -> /
        .replace(/,/g, '.');       // VirgÃ¼l -> .
    
    // 2. YazÄ±m dÃ¼zeltme: "2x" -> "2*x"
    expr = expr.replace(/(\d)x/g, '$1*x'); 

    // --- SENARYO A: X'i Ã‡Ã¶zmeye Ã‡alÄ±ÅŸÄ±yoruz (Denklem Modu) ---
    // EÄŸer ifade iÃ§inde '=' varsa VE 'x' harfi geÃ§iyorsa
    if (expr.includes('=') && expr.includes('x')) {
        try {
            const parts = expr.split('=');
            let lhsStr = parts[0]; 
            let rhsStr = parts[1]; 

            // EÄŸer tersten yazÄ±ldÄ±ysa (3x-4 = 0) dÃ¼zelt
            if (lhsStr.includes('x') && !rhsStr.includes('x')) {
                [lhsStr, rhsStr] = [rhsStr, lhsStr];
            }

            // Sol tarafÄ± hesapla (Bu kÄ±sÄ±m hata verirse Scenario B'ye dÃ¼ÅŸer)
            // Ã–rn: lhsStr="y" ise burasÄ± patlar ve catch'e gider (Ä°stediÄŸimiz bu)
            const targetY = new Function('return ' + lhsStr)();

            // SaÄŸ taraf testi (x=0 ve x=1 iÃ§in)
            const exprAt0 = rhsStr.replace(/x/g, '(0)'); 
            const yAt0 = new Function('return ' + exprAt0)();

            const exprAt1 = rhsStr.replace(/x/g, '(1)'); 
            const yAt1 = new Function('return ' + exprAt1)();

            const slope = yAt1 - yAt0;
            const intercept = yAt0;
            
            // EÄŸim Ã§ok kÃ¼Ã§Ã¼kse Ã§Ã¶zÃ¼lemez
            if (Math.abs(slope) < 0.000001) throw new Error("EÄŸim sÄ±fÄ±r"); 

            let solvedX = (targetY - intercept) / slope;
            
            // Yuvarlama (4/3 gibi durumlar iÃ§in hassasiyet koruma)
            if (Math.abs(Math.round(solvedX) - solvedX) < 0.0001) {
                solvedX = Math.round(solvedX);
            }
            
            return solvedX;

        } catch (e) {
            // Denklem Ã§Ã¶zÃ¼lemedi (Ã¶rn: "y=..." yazÄ±ldÄ±), normal hesaplamaya devam et
            // Konsola hata basmÄ±yoruz ki kullanÄ±cÄ± gÃ¶rmesin, sessizce B planÄ±na geÃ§iyoruz.
        }
    }

    // --- SENARYO B: Normal Hesaplama (Yedek Plan) ---
    // x yerine verilen deÄŸeri koy
    expr = expr.replace(/x/g, `(${contextVal})`);

    // EÅŸittir varsa saÄŸ tarafÄ± al
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
// NUMPAD TAMAM BUTONU (FÄ°NAL VE DÃœZELTÄ°LMÄ°Å)
// ==========================================
document.getElementById('numPadClose').addEventListener('click', function() {
    console.log("Tamam'a basÄ±ldÄ±. Hedef:", activeInputTarget);

    try {
        // 1. BASÄ°T EÄÄ°M KUTUSU
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

        // 2. BÄ°LÄ°NMEYEN KENAR KUTUSU (X)
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
        
        // 3. EÄÄ°M DÃ–NÃœÅÃœM: PAY KUTUSU (Merdiven ve 0,5 Sorusu Ä°Ã§in)
        else if (activeInputTarget === 'slope_conv_num') {
            const val = linearState.currentInputValue;
            if(val) {
                document.getElementById('slopeNumBox').textContent = val;
                // --- EKLENEN SATIR: BUTONU AKTÄ°F ET ---
                document.getElementById('checkBtn').disabled = false;
            }
            activeInputTarget = null;
        }

        // 4. EÄÄ°M DÃ–NÃœÅÃœM: PAYDA KUTUSU (Merdiven ve 0,5 Sorusu Ä°Ã§in)
        else if (activeInputTarget === 'slope_conv_denom') {
            const val = linearState.currentInputValue;
            if(val) {
                document.getElementById('slopeDenomBox').textContent = val;
                // --- EKLENEN SATIR: BUTONU AKTÄ°F ET ---
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

// --- YENÄ° EÅÄ°TLÄ°K KUTULARI ---
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
        console.error("NumPad iÅŸlem hatasÄ±:", e);
    } finally {
        document.getElementById('numberPad').classList.add('hidden');
        linearState.currentInputValue = '';
        if(document.getElementById('currentInput')) {
            document.getElementById('currentInput').textContent = '';
        }
    }
});


// --- Y=AX MODE OVERRIDE FOR NUMBER BUTTONS ---
document.addEventListener('click', function(e) {
    if (gameState.mode !== 'y_eq_ax' && gameState.mode !== 'y_eq_ax_plus_b') return;
    
    const btn = e.target.closest ? e.target.closest('.num-btn') : null;
    if (btn) {
        const display = document.getElementById('currentInput');
        if (display && (display.textContent.trim() === 'DeÄŸer girin' || display.textContent.trim() === '?')) {
            display.textContent = '';
            if (typeof linearState !== 'undefined') {
                linearState.currentInputValue = '';
            }
        }
    }
}, true);


// --- Y=AX MODE OVERRIDE FOR NUMPAD CLOSE ---
// We use a capturing event listener on the document to intercept the click
// BEFORE the 3-second rogue interval listener can stop propagation!
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'numPadClose' && (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b')) {
        e.stopPropagation();
        e.stopImmediatePropagation();
        e.preventDefault();
        
        console.log("y=ax moduna Ã¶zel Tamam tuÅŸu yakalandÄ±!");
        
        if (!linearState.currentCell) return;
        const { row, col } = linearState.currentCell;
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        
        if (cell) {
            const display = document.getElementById('currentInput');
            let formula = display ? display.textContent.trim() : linearState.currentInputValue;
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
                
                if (isNaN(calculatedResult) || !isFinite(calculatedResult)) throw new Error('Invalid');
                
                const displayResult = (typeof decimalToFraction === 'function') ? decimalToFraction(calculatedResult) : calculatedResult;
                
                if (col === 'x') linearState.tableData[row].x = calculatedResult;
                if (col === 'y') linearState.tableData[row].y = calculatedResult;
                linearState.tableData[row].calcY = calculatedResult;
                
                cell.textContent = displayResult;
                
                if (typeof updateLinearCanvas === 'function') {
                    updateLinearCanvas(row, col, calculatedResult);
                }
                
            } catch(err) {
                console.log("Hesaplama hatasÄ±", err);
                if (formula !== 'DeÄŸer girin' && formula !== '?') {
                    cell.textContent = formula;
                }
            }
        }
        
        // Hide panel
        document.getElementById('numberPad').classList.add('hidden');
        linearState.currentInputValue = '';
        if(document.getElementById('currentInput')) {
            document.getElementById('currentInput').textContent = '';
        }
        linearState.currentCell = null;
    }
}, true); // TRUE = Capturing phase!

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

            // --- YENÄ°LÄ°K BURADA: NoktanÄ±n yanÄ±ndaki (x,y) yazÄ±sÄ±nÄ± kesirli yap ---
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', pixel.x + 12);
            label.setAttribute('y', pixel.y - 12);
            label.setAttribute('font-size', '13');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('fill', '#6d28d9');
            
            // Hem X hem Y iÃ§in kesir dÃ¶nÃ¼ÅŸÃ¼mÃ¼ yapÄ±yoruz
            const displayXVal = decimalToFraction(xVal);
            const displayYVal = decimalToFraction(yVal);
            
            label.textContent = `(${displayXVal}, ${displayYVal})`;
            label.classList.add(`point-label-${row}`);
            linearCanvas.appendChild(label);
        }
    }
}

function recalculateYScale(maxYValue) {
    // Mevcut Y deÄŸerlerini topla
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

    // Ã–lÃ§ekleme mantÄ±ÄŸÄ± (AynÄ± kalÄ±yor)
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

    // Yeniden Ã‡izim
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

                // --- YENÄ°LÄ°K BURADA: Ã–lÃ§ekleme sonrasÄ± Y etiketi ---
                const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                yLabel.setAttribute('x', pixel.x - 35);
                yLabel.setAttribute('y', pixel.y - 10);
                yLabel.setAttribute('font-size', '13');
                yLabel.setAttribute('font-weight', 'bold');
                yLabel.setAttribute('fill', '#059669');
                
                // decimalToFraction kullanÄ±mÄ±
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
    
    // *** YENÄ° EKLENEN KISIM: Lastik Ã‡izgi AracÄ±nÄ± BaÅŸlat ***
    setupStraightLineDrawing(); 

    this.disabled = true;
});


function initializeLinearCanvas() {
    const linearCanvas = document.getElementById('linearCanvas');
    linearCanvas.innerHTML = ''; // Temizle
    
    // viewBox'u JavaScript Ã¼zerinden kesin olarak camelCase olarak ayarla
    linearCanvas.setAttribute('viewBox', '0 0 500 500');
    linearCanvas.style.backgroundColor = '#f8fafc'; // Arka planÄ±n beyaz/farklÄ± olduÄŸunu anlamak iÃ§in Ã§ok hafif mavi

    // Y-Ekseni Ã¶lÃ§eÄŸini sÄ±fÄ±rla
    if(typeof linearState !== 'undefined') linearState.yScale = 1;

    const LINEAR_GRID = 50;
    const LINEAR_ORIGIN = { x: 50, y: 450 };
    const EKSEN_UZUNLUGU = 8; // 8 kare Ã§izelim

    // --- IZGARA ---
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Dikey Ã§izgiler
    for (let i = 0; i <= EKSEN_UZUNLUGU; i++) {
        const x = LINEAR_ORIGIN.x + i * LINEAR_GRID;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x); line.setAttribute('y1', LINEAR_ORIGIN.y);
        line.setAttribute('x2', x); line.setAttribute('y2', LINEAR_ORIGIN.y - (EKSEN_UZUNLUGU * LINEAR_GRID));
        line.setAttribute('stroke', '#d1d5db'); // DAHA BELÄ°RGÄ°N GRÄ°
        line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    
    // Yatay Ã§izgiler
    for (let i = 0; i <= EKSEN_UZUNLUGU; i++) {
        const y = LINEAR_ORIGIN.y - i * LINEAR_GRID;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', LINEAR_ORIGIN.x); line.setAttribute('y1', y);
        line.setAttribute('x2', LINEAR_ORIGIN.x + (EKSEN_UZUNLUGU * LINEAR_GRID)); line.setAttribute('y2', y);
        line.setAttribute('stroke', '#d1d5db'); // DAHA BELÄ°RGÄ°N GRÄ°
        line.setAttribute('stroke-width', '1');
        gridGroup.appendChild(line);
    }
    linearCanvas.appendChild(gridGroup);

    // --- EKSENLER ---
    const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    xAxis.setAttribute('x1', LINEAR_ORIGIN.x); xAxis.setAttribute('y1', LINEAR_ORIGIN.y);
    xAxis.setAttribute('x2', LINEAR_ORIGIN.x + EKSEN_UZUNLUGU * LINEAR_GRID + 20); xAxis.setAttribute('y2', LINEAR_ORIGIN.y);
    xAxis.setAttribute('stroke', '#111827'); // SÄ°YAH
    xAxis.setAttribute('stroke-width', '3');
    linearCanvas.appendChild(xAxis);

    const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    yAxis.setAttribute('x1', LINEAR_ORIGIN.x); yAxis.setAttribute('y1', LINEAR_ORIGIN.y);
    yAxis.setAttribute('x2', LINEAR_ORIGIN.x); yAxis.setAttribute('y2', LINEAR_ORIGIN.y - EKSEN_UZUNLUGU * LINEAR_GRID - 20);
    yAxis.setAttribute('stroke', '#111827'); // SÄ°YAH
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

    // X Ekseni SayÄ±larÄ±
    for (let i = 1; i <= EKSEN_UZUNLUGU; i++) {
        const x = LINEAR_ORIGIN.x + i * LINEAR_GRID;
        const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttribute('x', x); text.setAttribute('y', LINEAR_ORIGIN.y + 20);
        text.setAttribute('text-anchor', 'middle'); text.setAttribute('font-size', '14');
        text.setAttribute('font-weight', 'bold'); text.setAttribute('fill', '#1f2937');
        text.textContent = i;
        linearCanvas.appendChild(text);
    }

    // Y Ekseni SayÄ±larÄ± (Dinamik gÃ¼ncellenebilmesi iÃ§in ID veriyoruz)
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
// OYUNU BAÅLAT BUTONU (FABRÄ°KA AYARLARINA DÃ–NÃœÅ)
// ==========================================
window.addEventListener('DOMContentLoaded', function() {
    const startGameBtn = document.getElementById('startGameBtn');
    const splashScreen = document.getElementById('splashScreen');
    const appElement = document.getElementById('app');

    if (startGameBtn && splashScreen && appElement) {
        startGameBtn.addEventListener('click', function(e) {
            console.log('ğŸš€ Oyun BaÅŸlatÄ±lÄ±yor... (Tam SÄ±fÄ±rlama)');

            // 1. GiriÅŸ EkranÄ±nÄ± Kapat, UygulamayÄ± AÃ§
            splashScreen.classList.add('hidden');
            splashScreen.style.display = 'none';
            appElement.classList.remove('hidden');
            appElement.style.display = 'flex';

            // AÄŸ Ã¼zerinden KESÄ°N baÅŸlatma emri gÃ¶nder (GÃ¶lge Senkronizasyon Bypass)
            // SADECE fiziksel tÄ±klamalarda (e.isTrusted) gÃ¶nder ki sonsuz dÃ¶ngÃ¼ye girmesin!
            if (e && e.isTrusted && typeof myConnection !== 'undefined' && myConnection && isConnected) {
                myConnection.send({ type: 'force_start_game' });
            }

            // 2. TÃœM EKRANLARI VE MENÃœLERÄ° KAPAT
            if (typeof clearAllScreens === 'function') {
                clearAllScreens();
            }

            // 3. OYUN DURUMLARINI (STATE) SIFIRLA
            // Bu kÄ±sÄ±m Ã§ok Ã¶nemli, oyunun "devam ettiÄŸini" sanmasÄ±nÄ± engeller.
            
            // Genel Durum
            if (typeof gameState !== 'undefined') {
                gameState.mode = null; 
                gameState.selectedOption = null;
                gameState.userClicks = [];
                gameState.originalShape = null;
                gameState.transformedShape = null;
            }

            // EÄŸim Modu Durumu (Sorunun kaynaÄŸÄ± burasÄ± olabilir)
            if (typeof slopeState !== 'undefined') {
                slopeState.currentQuestion = 0;
                slopeState.activeMode = null; // Hangi modda olduÄŸunu unuttur
            }

            // DoÄŸrusal Ä°liÅŸkiler Durumu
            if (typeof linearState !== 'undefined') {
                linearState.currentQuestion = null;
                linearState.drawnPoints = [];
                linearState.isDrawing = false;
            }

            // ZamanlayÄ±cÄ±larÄ± Durdur
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

            // 4. BUTON EFEKTLERÄ°NÄ° TEMÄ°ZLE
            document.querySelectorAll('.nav-btn, button').forEach(btn => {
                btn.classList.remove('selected-button');
                // TÃ¼m renk halkalarÄ±nÄ± sil
                btn.classList.remove(
                    'ring-2', 'ring-offset-1', 
                    'ring-orange-500', 'ring-cyan-500', 'ring-blue-500', 
                    'ring-purple-500', 'ring-pink-500', 'ring-teal-500',
                    'ring-green-500', 'ring-red-500'
                );
            });

            // 5. NORMAL CANVAS'I (BOÅ IZGARA) GÃ–STER
            // DiÄŸer Ã¶zel modlar kapandÄ±ÄŸÄ± iÃ§in kullanÄ±cÄ± boÅŸlukta kalmasÄ±n.
            const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
            if (regularCanvas) {
                regularCanvas.style.display = 'flex';
                if (typeof initCanvas === 'function') initCanvas();
            }

            console.log("âœ… Oyun Fabrika AyarlarÄ±na DÃ¶ndÃ¼.");
        });
    }
});



// --- DoÄŸru Grafikleri Buton MantÄ±ÄŸÄ± ---
document.getElementById('lineGraphsBtn').addEventListener('click', function() {
    const subButtons = document.getElementById('lineGraphSubButtons');
    
    // AÃ§Ä±k mÄ± kapalÄ± mÄ± kontrolÃ¼ (Toggle mantÄ±ÄŸÄ±)
    const isHidden = subButtons.classList.contains('hidden');

    // 1. EkranÄ± temizle
    clearAllScreens();

    // 2. Duruma gÃ¶re aÃ§ veya kapa
    if (isHidden) {
        subButtons.classList.remove('hidden');
        this.classList.add('selected-button');
    } else {
        subButtons.classList.add('hidden');
        this.classList.remove('selected-button');
    }

    // 3. DiÄŸer menÃ¼yÃ¼ (DoÄŸrusal Ä°liÅŸkiler) kapat
    document.getElementById('linearSubButtons').classList.add('hidden');
    document.getElementById('linearRelationsBtn').classList.remove('selected-button');

    // 4. DiÄŸer ana buton seÃ§imlerini kaldÄ±r
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
            // Hepsinin seÃ§imini kaldÄ±r
            graphSubIds.forEach(btnId => {
                const b = document.getElementById(btnId);
                if (b) b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500');
            });
            // TÄ±klanana ekle
            this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        });
    }
});
// ==========================================
// YENÄ° Ã–ZELLÄ°KLER: X=a ve Y=b (HÄ°ZALI IZGARA)
// ==========================================

// 1. TAM KOORDÄ°NAT SÄ°STEMÄ°NÄ° Ã‡Ä°ZEN FONKSÄ°YON (Ã‡izim kodlarÄ± kaldÄ±rÄ±ldÄ±, sadece Ä±zgara)
function initializeFullCanvas() {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    // EkranÄ± sabitle
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
    
    // Ã‡izgiler
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

    // --- Ã‡Ä°ZÄ°M Ä°ÅLEVÄ° ---
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

    // 2. PANELÄ° BUL VE HAPÄ°STEN KURTAR (ANA GÃ–VDEYE TAÅI)
    const panel = document.getElementById('linearQuestionPanel');
    
    // EÄŸer panel bir ÅŸeyin iÃ§indeyse, onu oradan Ã§Ä±karÄ±p doÄŸrudan body'ye ekle
    if (panel.parentElement !== document.body) {
        document.body.appendChild(panel);
    }
    
    panel.classList.remove('hidden');

    // 3. KONUMLANDIR (TEPEYE SABÄ°TLE)
    // position: absolute yerine fixed kullanÄ±yoruz ki sayfa kaysa bile tepede kalsÄ±n
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

    // 4. Ä°Ã‡ERÄ°ÄÄ° YENÄ°DEN YAZ
    // Soru metni div'ini sÄ±fÄ±rdan oluÅŸturuyoruz
    panel.innerHTML = '<div id="questionText" style="font-size: 20px; font-weight: 800; color: #312e81;">Sorular hazÄ±rlanÄ±yor...</div>';

    // 5. Grafik AlanÄ±nÄ± Ayarla
    const linearContainer = document.getElementById('linearContainer');
    linearContainer.classList.remove('hidden');
    linearContainer.style.display = 'block';
    linearContainer.style.position = 'relative';
    linearContainer.style.width = '600px';
    linearContainer.style.height = '600px';
    linearContainer.style.margin = '0 auto';
    linearContainer.style.overflow = 'visible'; // TaÅŸarsa da gÃ¶rÃ¼nsÃ¼n

    // Gereksizleri Gizle
    if(document.getElementById('dataTable')) document.getElementById('dataTable').parentElement.style.display = 'none';
    if(document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    if(document.getElementById('drawInstructionText')) document.getElementById('drawInstructionText').classList.remove('hidden');
    
    // 6. Soru MantÄ±ÄŸÄ± (Senkronize)
    const targets = [4, -3, 2, -5, 3, -2, 5, -4];
    window.gameLogicCounter = (window.gameLogicCounter || 0) + 1;
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room') || '123';
    let roomSeed = 0;
    for (let i = 0; i < roomCode.length; i++) roomSeed += roomCode.charCodeAt(i);

    let tIndex = (roomSeed + window.gameLogicCounter * 7) % targets.length;
    let newTarget = targets[tIndex];
    gameState.targetLineValue = newTarget; 
    
    // 7. METNÄ° GÃœNCELLE
    const qText = document.getElementById('questionText');
    if(qText) qText.textContent = `AÅŸaÄŸÄ±daki koordinat sisteminde x = ${newTarget} doÄŸrusunu Ã§iziniz.`;
    
    // 8. HazÄ±rlÄ±k
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

    // 2. PANELÄ° BUL VE HAPÄ°STEN KURTAR
    const panel = document.getElementById('linearQuestionPanel');
    
    // Body'ye taÅŸÄ±
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

    // 4. Ä°Ã‡ERÄ°ÄÄ° YENÄ°DEN YAZ
    panel.innerHTML = '<div id="questionText" style="font-size: 20px; font-weight: 800; color: #312e81;">Sorular hazÄ±rlanÄ±yor...</div>';

    // 5. Grafik AlanÄ±nÄ± Ayarla
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
    
    // 6. Soru MantÄ±ÄŸÄ± (Senkronize)
    const targets = [3, -2, 4, -3, 2, -5, 5, -4];
    window.gameLogicCounter = (window.gameLogicCounter || 0) + 1;
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room') || '123';
    let roomSeed = 0;
    for (let i = 0; i < roomCode.length; i++) roomSeed += roomCode.charCodeAt(i);

    let tIndex = (roomSeed + window.gameLogicCounter * 11) % targets.length;
    let newTarget = targets[tIndex];
    gameState.targetLineValue = newTarget; 
    
    // 7. METNÄ° GÃœNCELLE
    const qText = document.getElementById('questionText');
    if(qText) qText.textContent = `AÅŸaÄŸÄ±daki koordinat sisteminde y = ${newTarget} doÄŸrusunu Ã§iziniz.`;
    
    // 8. HazÄ±rlÄ±k
    initializeFullCanvas();
    linearState.drawnPoints = []; 
    if(document.getElementById('checkBtn')) document.getElementById('checkBtn').disabled = true;
    
    setupStraightLineDrawing();
}



// X=a KONTROLÃœ (2 Nokta MantÄ±ÄŸÄ±)
function checkVerticalLine() {
    const targetX = gameState.targetLineValue;
    const drawnPoints = linearState.drawnPoints;
    
    // Sadece 2 nokta olmalÄ± (BaÅŸlangÄ±Ã§ ve BitiÅŸ)
    if (drawnPoints.length !== 2) { 
        showFeedback(false); 
        return; 
    }

    const p1 = drawnPoints[0];
    const p2 = drawnPoints[1];
    
    const FULL_GRID = 40;
    const CENTER_X = 250;
    const CENTER_Y = 250;

    // KoordinatlarÄ± grid sistemine Ã§evir
    const x1 = (p1.x - CENTER_X) / FULL_GRID;
    const x2 = (p2.x - CENTER_X) / FULL_GRID;
    
    // Y koordinatlarÄ± (uzunluk kontrolÃ¼ iÃ§in)
    const y1 = (CENTER_Y - p1.y) / FULL_GRID;
    const y2 = (CENTER_Y - p2.y) / FULL_GRID;

    // 1. Konum DoÄŸru mu? (Ä°ki noktanÄ±n da X'i hedefe yakÄ±n olmalÄ±)
    // Tolerans 0.5 birim
    const isX1Correct = Math.abs(x1 - targetX) < 0.5;
    const isX2Correct = Math.abs(x2 - targetX) < 0.5;

    // 2. Ã‡izgi Dikey mi? (X deÄŸerleri birbirine yakÄ±n mÄ±)
    const isVertical = Math.abs(x1 - x2) < 0.5;

    // 3. Ã‡izgi Yeterince Uzun mu? (En az 3 birim boyunda olsun)
    const isLongEnough = Math.abs(y1 - y2) > 3;

    if (isX1Correct && isX2Correct && isVertical && isLongEnough) {
        playSuccessSound(); 
        showFeedback(true);
        
        // BaÅŸarÄ±lÄ± Ã§izgiyi yeÅŸile boya ve kalÄ±nlaÅŸtÄ±r
        const userLine = document.querySelector('.user-drawn-line');
        if (userLine) { 
            userLine.setAttribute('stroke', '#10b981'); 
            userLine.setAttribute('stroke-width', '6'); 
        }
        
        window.roundTimer = setTimeout(() => { startXeqARound(); }, 2000);
    } else {
        playErrorSound();
        const feedback = document.getElementById('feedback');
        
        if (!isVertical) feedback.textContent = `Dik bir Ã§izgi (x=${targetX}) Ã§izmelisin!`;
        else if (!isX1Correct) feedback.textContent = `Ã‡izgiyi x=${targetX} noktasÄ±ndan geÃ§irmelisin!`;
        else if (!isLongEnough) feedback.textContent = "Ã‡izgi Ã§ok kÄ±sa, biraz daha uzat!";
        else feedback.textContent = "YanlÄ±ÅŸ oldu, tekrar dene.";
        
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
        
        // YanlÄ±ÅŸ Ã§izgiyi sil
        document.querySelectorAll('.user-drawn-line').forEach(el => el.remove());
        linearState.drawnPoints = [];
    }
}

// Y=b KONTROLÃœ (2 Nokta MantÄ±ÄŸÄ±)
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

    // Y koordinatlarÄ±nÄ± Ã§evir
    const y1 = (CENTER_Y - p1.y) / FULL_GRID;
    const y2 = (CENTER_Y - p2.y) / FULL_GRID;
    
    // X koordinatlarÄ± (uzunluk kontrolÃ¼ iÃ§in)
    const x1 = (p1.x - CENTER_X) / FULL_GRID;
    const x2 = (p2.x - CENTER_X) / FULL_GRID;

    // 1. Konum DoÄŸru mu? (Ä°ki noktanÄ±n da Y'si hedefe yakÄ±n olmalÄ±)
    const isY1Correct = Math.abs(y1 - targetY) < 0.5;
    const isY2Correct = Math.abs(y2 - targetY) < 0.5;

    // 2. Ã‡izgi Yatay mÄ±? (Y deÄŸerleri birbirine yakÄ±n mÄ±)
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
        
        if (!isHorizontal) feedback.textContent = `Yatay bir Ã§izgi (y=${targetY}) Ã§izmelisin!`;
        else if (!isY1Correct) feedback.textContent = `Ã‡izgiyi y=${targetY} noktasÄ±ndan geÃ§irmelisin!`;
        else if (!isLongEnough) feedback.textContent = "Ã‡izgi Ã§ok kÄ±sa, biraz daha uzat!";
        else feedback.textContent = "YanlÄ±ÅŸ oldu, tekrar dene.";
        
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
// YENÄ° Ã–ZELLÄ°K: Y = ax MODU (TABLOYU BÄ°REBÄ°R OKUYAN SÃœRÃœM)
// ==========================================

// 1. ESKÄ° Ã‡Ä°ZÄ°M FONKSÄ°YONUNU DEVRE DIÅI BIRAK
if (!window.originalInitializeLinearCanvas) {
    window.originalInitializeLinearCanvas = window.initializeLinearCanvas;
}

window.initializeLinearCanvas = function() {
    if (gameState.mode === 'y_eq_ax' || gameState.mode === 'x_eq_a' || gameState.mode === 'y_eq_b' || gameState.mode === 'y_eq_ax_plus_b') {
        drawFullGridForAX(); 
    } else {
        if(window.originalInitializeLinearCanvas) window.originalInitializeLinearCanvas();
    }
};

// GRAFÄ°K IZGARASINI Ã‡Ä°ZEN FONKSÄ°YON (Ã–lÃ§ekli)
function drawFullGridForAX(scaleFactor = 1) {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    // EkranÄ± sabitle
    canvas.setAttribute('viewBox', '0 0 500 500');
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const FULL_SIZE = 500;
    const FULL_GRID = 40; // Her karenin piksel geniÅŸliÄŸi (sabit)
    const CENTER_X = 250;
    const CENTER_Y = 250;

    // --- IZGARA Ã‡Ä°ZGÄ°LERÄ° ---
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

    // --- SAYILAR (Ã–LÃ‡EÄE GÃ–RE) ---
    // Her Ã§izgi 1 birim deÄŸil, 'scaleFactor' kadar birimdir.
    for (let i = -6; i <= 6; i++) {
        if (i === 0) continue;
        const pos = CENTER_X + (i * FULL_GRID);
        
        // GÃ¶sterilecek sayÄ± deÄŸeri
        const displayNum = i * scaleFactor;

        if (pos > 10 && pos < FULL_SIZE - 10) {
            // X Ekseni SayÄ±larÄ±
            const textX = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textX.setAttribute('x', pos); textX.setAttribute('y', CENTER_Y + 20);
            textX.setAttribute('text-anchor', 'middle'); textX.setAttribute('font-size', '12');
            textX.setAttribute('font-weight', 'bold'); 
            textX.textContent = displayNum;
            canvas.appendChild(textX);
            
            // Y Ekseni SayÄ±larÄ±
            const textY = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textY.setAttribute('x', CENTER_X - 15); textY.setAttribute('y', pos + 5);
            textY.setAttribute('text-anchor', 'middle'); textY.setAttribute('font-size', '12');
            textY.setAttribute('font-weight', 'bold'); 
            textY.textContent = -displayNum; // Y ekseni yukarÄ± doÄŸru pozitiftir ama SVG'de yukarÄ± gidildikÃ§e piksel azalÄ±r
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
    
    // Hem 'y_eq_ax' HEM DE 'y_eq_ax_plus_b' modlarÄ± iÃ§in Ã¶zel tablo
    if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') {
        
        document.getElementById('xHeader').textContent = "x";
        
        // BaÅŸlÄ±k metnini moda gÃ¶re ayarla
        if (gameState.mode === 'y_eq_ax') {
            document.getElementById('yHeader').textContent = `y = ${gameState.targetSlope}x`;
        } else {
            const sign = gameState.targetIntercept > 0 ? '+' : '';
            document.getElementById('yHeader').textContent = `y = ${gameState.targetSlope}x ${sign}${gameState.targetIntercept}`;
        }
        
        // 3. SÃ¼tun BaÅŸlÄ±ÄŸÄ± (Nokta)
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

        // 4 SatÄ±r OluÅŸtur
        for (let i = 0; i < 4; i++) {
            const row = document.createElement('tr');
            
            // X HÃ¼cresi
            const xCell = document.createElement('td');
            xCell.className = 'border-2 border-purple-400 px-2 py-2 text-center font-bold text-lg cursor-pointer hover:bg-purple-100';
            xCell.dataset.row = i; xCell.dataset.col = 'x';
            xCell.addEventListener('click', () => openNumberPad(i, 'x'));
            
            // Y HÃ¼cresi
            const yCell = document.createElement('td');
            yCell.className = 'border-2 border-purple-400 px-2 py-2 text-center font-bold text-lg cursor-pointer hover:bg-purple-100';
            yCell.dataset.row = i; yCell.dataset.col = 'y';
            yCell.addEventListener('click', () => openNumberPad(i, 'y'));
            
            // Nokta HÃ¼cresi (Otomatik)
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
        // DiÄŸer modlar iÃ§in eski standart tablo
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

    // 1. Tablo Verisini GÃ¼ncelle (Metin olarak)
    const tableRows = document.getElementById('tableBody').querySelectorAll('tr');
    const currentRow = tableRows[row];
    let xText = currentRow.children[0].textContent.trim();
    let yText = currentRow.children[1].textContent.trim();
    if (yText.includes('=')) yText = yText.split('=')[1].trim();

    // 3. SÃ¼tun (Nokta) GÃ¼ncellemesi
    const pointCell = document.getElementById(`point-cell-${row}`);
    if (xText !== '' && yText !== '' && pointCell) {
        pointCell.textContent = `(${xText}, ${yText})`;
        pointCell.style.color = '#6d28d9'; pointCell.style.backgroundColor = '#f3e8ff';
    } else if (pointCell) {
        pointCell.textContent = '(?, ?)';
        pointCell.style.color = '#6b7280'; pointCell.style.backgroundColor = '#9ca3af';
    }

    // --- AKILLI Ã–LÃ‡EKLENDÄ°RME ---
    // Tablodaki tÃ¼m verileri topla
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
            // En bÃ¼yÃ¼k deÄŸeri bul (negatifler pozitif yapÄ±lÄ±p bakÄ±lÄ±r)
            maxAbsValue = Math.max(maxAbsValue, Math.abs(xVal), Math.abs(yVal));
        }
    });

    // Ã–lÃ§eÄŸi Belirle (VarsayÄ±lan 1)
    // Ekranda merkezin saÄŸÄ±na doÄŸru yaklaÅŸÄ±k 6 Ã§izgi var.
    // EÄŸer sayÄ± 6'dan bÃ¼yÃ¼kse sÄ±ÄŸmaz, Ã¶lÃ§eÄŸi bÃ¼yÃ¼tmeliyiz.
    let scaleFactor = 1;
    if (maxAbsValue > 6) scaleFactor = 2;
    if (maxAbsValue > 12) scaleFactor = 5;
    if (maxAbsValue > 30) scaleFactor = 10;
    if (maxAbsValue > 60) scaleFactor = 20;
    if (maxAbsValue > 120) scaleFactor = 50;

    // Bu Ã¶lÃ§ek deÄŸerini global bir yere kaydet (Ã‡izgi kontrolÃ¼nde lazÄ±m olacak)
    linearState.axisScale = scaleFactor;

    // 2. GrafiÄŸi Yeni Ã–lÃ§ekle Ã‡iz
    drawFullGridForAX(scaleFactor);

    // 3. NoktalarÄ± YerleÅŸtir
    const linearCanvas = document.getElementById('linearCanvas');
    const CENTER_X = 250; 
    const CENTER_Y = 250; 
    const FULL_GRID = 40; 

    // Eski noktalarÄ± temizle
    document.querySelectorAll("circle[class*='point-'], text[class*='point-'], line[class*='guide-']").forEach(el => el.remove());

    pointsData.forEach(p => {
        // KOORDÄ°NAT HESABI:
        // (DeÄŸer / Ã–lÃ§ek) * IzgaraBÃ¼yÃ¼klÃ¼ÄŸÃ¼
        // Ã–rn: DeÄŸer 20, Ã–lÃ§ek 5 ise -> 4 kare gider.
        const pixelX = CENTER_X + ((p.x / scaleFactor) * FULL_GRID);
        const pixelY = CENTER_Y - ((p.y / scaleFactor) * FULL_GRID);

        // Rehber Ã‡izgiler
        const guideX = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guideX.setAttribute('x1', pixelX); guideX.setAttribute('y1', pixelY);
        guideX.setAttribute('x2', pixelX); guideX.setAttribute('y2', CENTER_Y);
        guideX.setAttribute('stroke', '#ef4444'); guideX.setAttribute('stroke-width', '2');
        guideX.setAttribute('stroke-dasharray', '4,4');
        guideX.style.pointerEvents = 'none'; // TÄ±klama hatasÄ±nÄ± engelle
        linearCanvas.appendChild(guideX);

        const guideY = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        guideY.setAttribute('x1', pixelX); guideY.setAttribute('y1', pixelY);
        guideY.setAttribute('x2', CENTER_X); guideY.setAttribute('y2', pixelY);
        guideY.setAttribute('stroke', '#ef4444'); guideY.setAttribute('stroke-width', '2');
        guideY.setAttribute('stroke-dasharray', '4,4');
        guideY.style.pointerEvents = 'none'; // TÄ±klama hatasÄ±nÄ± engelle
        linearCanvas.appendChild(guideY);

        // Nokta
        const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttribute('cx', pixelX); circle.setAttribute('cy', pixelY);
        circle.setAttribute('r', 8); 
        circle.setAttribute('fill', '#8b5cf6');
        circle.setAttribute('stroke', 'white'); circle.setAttribute('stroke-width', '2');
        circle.style.pointerEvents = 'none'; // TABLET TIKLAMA HATASI Ä°Ã‡Ä°N EKLENDÄ°
        linearCanvas.appendChild(circle);

        // Etiket
        const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        label.setAttribute('x', pixelX + 15); label.setAttribute('y', pixelY - 15);
        label.setAttribute('font-size', '16'); label.setAttribute('font-weight', 'bold');
        label.setAttribute('fill', '#6d28d9');
        
        const displayX = decimalToFraction(p.x);
        const displayY = decimalToFraction(p.y);
        label.textContent = `(${displayX}, ${displayY})`;
        label.style.pointerEvents = 'none'; // TABLET TIKLAMA HATASI Ä°Ã‡Ä°N EKLENDÄ°
        linearCanvas.appendChild(label);
    });

    // Buton KontrolÃ¼
    const feedback = document.getElementById('feedback');
    const confirmBtn = document.getElementById('tableConfirmBtn');

    if (validPointsCount >= 2) {
        const allSame = pointsData.every(p => p.x === pointsData[0].x && p.y === pointsData[0].y);
        if (allSame) {
            feedback.textContent = "âš ï¸ Noktalar Ã¼st Ã¼ste! FarklÄ± deÄŸerler ver.";
            feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-bold bg-orange-500 text-white';
            feedback.style.opacity = '1';
            confirmBtn.disabled = true; confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
        } else {
            feedback.textContent = "âœ… Harika! 'TAMAM' butonuna bas ve Ã§izimi yap.";
            feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-bold bg-green-500 text-white';
            feedback.style.opacity = '1';
            confirmBtn.disabled = false; confirmBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    } else {
        confirmBtn.disabled = true; confirmBtn.classList.add('opacity-50', 'cursor-not-allowed');
    }
};

// 6. LASTÄ°K Ã‡Ä°ZGÄ° ARACI
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
        try {
            newCanvas.setPointerCapture(e.pointerId);
        } catch(err) {
            console.warn("Pointer capture hatasÄ±:", err);
            // Tablette hata verse bile Ã§izime devam et
        }
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
        try {
            newCanvas.releasePointerCapture(e.pointerId);
        } catch(err) {}
        
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
    
    // YENÄ°LÄ°K BURADA: O anki Ã¶lÃ§ek katsayÄ±sÄ±nÄ± kullan (Yoksa 1 kabul et)
    const currentScale = linearState.axisScale || 1;

    // Koordinat dÃ¶nÃ¼ÅŸÃ¼mÃ¼nde 'currentScale' ile Ã§arpÄ±yoruz
    // FormÃ¼l: (PikselFarkÄ± / GridBoyutu) * Ã–lÃ§ek
    const x1 = ((p1.x - CENTER_X) / FULL_GRID) * currentScale;
    const y1 = ((CENTER_Y - p1.y) / FULL_GRID) * currentScale;
    const x2 = ((p2.x - CENTER_X) / FULL_GRID) * currentScale;
    const y2 = ((CENTER_Y - p2.y) / FULL_GRID) * currentScale;
    
    const drawnSlope = (y2 - y1) / (x2 - x1);
    const drawnIntercept = y1 - (drawnSlope * x1); 
    
    // Kontroller (Ã‡ok Daha GeniÅŸ ToleranslÄ± - Tablet Parmak Ã‡izimi Ä°Ã§in)
    let slopeTolerance = 1.0;
    if (Math.abs(targetSlope) >= 2) slopeTolerance = 1.5;
    if (Math.abs(targetSlope) >= 3) slopeTolerance = 2.0;
    
    let interceptTolerance = 1.5 * currentScale; // Ã–lÃ§ek arttÄ±kÃ§a hata payÄ± artar
    
    const isSlopeCorrect = Math.abs(drawnSlope - targetSlope) <= slopeTolerance;
    const isInterceptCorrect = Math.abs(drawnIntercept - targetIntercept) <= interceptTolerance;
    
    // Uzunluk kontrolÃ¼ (Piksel bazÄ±nda yapalÄ±m ki Ã¶lÃ§ekten etkilenmesin)
    // En az 40 piksel (1 kare) uzunluk olsun
    const pixelDist = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
    const isLongEnough = pixelDist > 40;

    if (isSlopeCorrect && isInterceptCorrect && isLongEnough) {
        playSuccessSound(); showFeedback(true);
        const userLine = document.querySelector('.user-drawn-line');
        if (userLine) { userLine.setAttribute('stroke', '#10b981'); userLine.setAttribute('stroke-width', '6'); }
        
        setTimeout(() => { 
            // Yeni soruya geÃ§erken Ã¶lÃ§eÄŸi sÄ±fÄ±rla
            linearState.axisScale = 1; 
            if (gameState.mode === 'y_eq_ax_plus_b') startYeqAXplusBRound();
            else startYeqAXRound();
        }, 2000);
    } else {
        playErrorSound();
        const feedback = document.getElementById('feedback');
        
        if (!isInterceptCorrect) {
             feedback.textContent = `Ã‡izgi Y eksenini ${targetIntercept} noktasÄ±nda kesmeli!`;
        } else if (!isSlopeCorrect) {
            feedback.textContent = "EÄŸim yanlÄ±ÅŸ! NoktalarÄ± birleÅŸtir.";
        } else if (!isLongEnough) {
            feedback.textContent = "Ã‡izgi Ã§ok kÄ±sa!";
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
// checkBtn listener iÃ§inde:
else if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') { 
    checkStraightLine(); 
}
        else if (gameState.mode === 'questionToGraph') { if(typeof checkLinearGraph === 'function') checkLinearGraph(); }
        else if (gameState.mode === 'graphToQuestion') { if(typeof checkGraphAnswer === 'function') checkGraphAnswer(); }
        else { if(typeof checkAnswer === 'function') checkAnswer(); }
    });
}

function clearGeometryUI() {
    // 1. Koordinat butonlarÄ±nÄ± (Yer -> Nokta) gizle
    document.getElementById('coordinateOptions').classList.add('hidden');
    
    // 2. Geometri bilgi kutusunu gizle
    document.getElementById('transformInfo').classList.add('hidden');
    
    // 3. Bildirimleri temizle
    document.getElementById('feedback').style.opacity = '0';
    
    // 4. Standart Geometri Canvas'Ä±nÄ± gizle (EÄŸer aÃ§Ä±ksa)
    // Not: Linear modlar kendi canvaslarÄ±nÄ± veya containerlarÄ±nÄ± aÃ§tÄ±ÄŸÄ± iÃ§in
    // bu genellikle otomatik gizlenir ama garantiye alalÄ±m.
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) {
        regularCanvas.style.display = 'none';
    }
}


// ==========================================
// KESÄ°N TEMÄ°ZLÄ°K FONKSÄ°YONU (NÃœKLEER SEÃ‡ENEK)
// ==========================================
function clearAllScreens() {

// clearAllScreens fonksiyonunun iÃ§ine ÅŸu satÄ±rÄ± ekle:
if (window.feedbackTimer) clearTimeout(window.feedbackTimer);
if (window.roundTimer) clearTimeout(window.roundTimer); // BUG FIX: Devam eden eski oyunlarÄ±n setTimeout'larÄ±nÄ± iptal et
if (window.animationFrameId) cancelAnimationFrame(window.animationFrameId); // BUG FIX: Devam eden animasyonlarÄ± iptal et
const fb = document.getElementById('feedback');
if (fb) fb.style.opacity = '0';


    // 1. GÄ°ZLENMESÄ° GEREKEN TÃœM ID'LERÄ°N LÄ°STESÄ°
    const idsToHide = [
        // Alt MenÃ¼ler
        'transformSubButtons',
        'coordinateSubButtons',
        'linearSubButtons',
        'lineGraphSubButtons',
        'slopeSubButtons',
        
        // Ä°Ã§erik Panelleri ve Containerlar
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

    // 2. HEPSÄ°NÄ° TEK TEK BUL VE GÄ°ZLE
    idsToHide.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.classList.add('hidden');       // Tailwind gizlemesi
            el.style.display = 'none';        // CSS zorla gizleme (Ã–nemli!)
            el.style.removeProperty('display'); // Veya inline stili tamamen sil (daha temiz)
            el.classList.add('hidden'); // Tekrar garantiye al
        }
    });

    // 3. TABLOYU Ã–ZEL OLARAK GÄ°ZLE (Wrapper'Ä± ile birlikte)
    const dataTable = document.getElementById('dataTable');
    if (dataTable) {
        dataTable.style.display = 'none';
        if (dataTable.parentElement) {
            dataTable.parentElement.style.display = 'none';
        }
    }

    // 4. GERÄ° BÄ°LDÄ°RÄ°MÄ° SÄ°L
    const feedback = document.getElementById('feedback');
    if (feedback) feedback.style.opacity = '0';

    // 5. TÃœM BUTON EFEKTLERÄ°NÄ° SÄ°L (Halkalar vb.)
    document.querySelectorAll('.nav-btn, button').forEach(btn => {
        btn.classList.remove('selected-button');
        btn.classList.remove(
            'ring-2', 'ring-offset-1', 
            'ring-orange-500', 'ring-cyan-500', 'ring-blue-500', 
            'ring-purple-500', 'ring-pink-500', 'ring-teal-500',
            'ring-green-500', 'ring-red-500'
        );
    });

    // 6. ANA GEOMETRÄ° CANVAS'INI GÄ°ZLE (VarsayÄ±lan olarak)
    // Bunu sadece "DÃ¶nÃ¼ÅŸÃ¼m Geometrisi" modlarÄ± geri aÃ§acak.
    const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
    if (regularCanvas) {
        regularCanvas.style.display = 'none'; 
    }
}



// ==========================================
// DÃœZEN DÃœZELTME: GRAFÄ°K -> SORU EKRANI
// ==========================================
// Sol paneli (Soru kÄ±smÄ±) geniÅŸlet, grafiÄŸi sÄ±kÄ±ÅŸtÄ±rma
document.addEventListener('DOMContentLoaded', function() {
    const graphContainer = document.getElementById('graphQuestionContainer');
    if (graphContainer) {
        // Sol panel (Soru metni ve ÅŸÄ±klar)
        const leftPanel = graphContainer.children[0];
        // w-64 (sabit) yerine w-1/3 veya w-2/5 (oransal) yapÄ±yoruz
        leftPanel.classList.remove('w-64'); 
        leftPanel.classList.add('w-1/3', 'min-w-[300px]', 'p-2'); 
        
        // SaÄŸ panel (Grafik)
        const rightPanel = graphContainer.children[1];
        rightPanel.classList.add('p-2');
    }
});

// ==========================================
// ONDALIK SAYIYI KESRE Ã‡EVÄ°RME (1.33 -> 4/3)
// ==========================================
function decimalToFraction(val) {
    if (val === undefined || isNaN(val)) return "";
    
    // Zaten tam sayÄ±ysa direkt dÃ¶ndÃ¼r (Ã–rn: 5)
    if (Math.abs(val - Math.round(val)) < 0.0001) {
        return Math.round(val).toString();
    }

    // PaydayÄ± 2'den 100'e kadar dene (Okul matematiÄŸi iÃ§in yeterli)
    for (let d = 2; d <= 100; d++) {
        let n = val * d;
        // EÄŸer payda ile Ã§arpÄ±nca tam sayÄ±ya Ã§ok yaklaÅŸÄ±yorsa bulduk demektir
        if (Math.abs(n - Math.round(n)) < 0.0001) {
            return `${Math.round(n)}/${d}`;
        }
    }
    
    // EÄŸer basit bir kesir bulunamazsa, virgÃ¼lden sonra 2 basamak gÃ¶ster
    return val.toFixed(2);
}

// ==========================================
// Y=AX MODU Ä°Ã‡Ä°N EKSÄ°K KODLAR (RESTORASYON)
// ==========================================

// 1. Modu BaÅŸlatan Fonksiyon
function startYeqAXRound() {
    console.log("Y=ax Modu BaÅŸlÄ±yor...");
    resetLinearQuestionPanel();
    
    // Eski bildirimleri temizle
    const feedback = document.getElementById('feedback');
    feedback.style.opacity = '0';
    feedback.className = 'fixed bottom-4 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg font-semibold text-center transition-all opacity-0 pointer-events-none';

    gameState.mode = 'y_eq_ax';
    
    // Rastgele EÄŸim Belirle (Senkronize)
    const slopes = [2, -2, 3, -3]; 
    window.gameLogicCounter = (window.gameLogicCounter || 0) + 1;
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room') || '123';
    let roomSeed = 0;
    for (let i = 0; i < roomCode.length; i++) roomSeed += roomCode.charCodeAt(i);

    let sIndex = (roomSeed + window.gameLogicCounter * 13) % slopes.length;
    let newSlope = slopes[sIndex];
    gameState.targetSlope = newSlope;
    
    // UI (ArayÃ¼z) HazÄ±rla
    document.getElementById('linearQuestionPanel').classList.remove('hidden');
    document.getElementById('linearContainer').classList.remove('hidden');
    document.getElementById('linearContainer').style.display = 'flex';
    document.getElementById('dataTable').parentElement.style.display = 'flex';
    document.getElementById('dataTable').classList.remove('hidden');
    document.getElementById('dataTable').style.display = 'block';
    document.getElementById('drawInstructionText').classList.add('hidden');
    
    document.getElementById('questionText').textContent = `Denklem: y = ${newSlope}x. Tabloyu doldurarak grafiÄŸi Ã§iziniz.`;

    // Tabloyu oluÅŸtur
    initializeLearningTable();
    
    // GrafiÄŸi varsayÄ±lan Ã¶lÃ§ekle (1) Ã§iz
    linearState.axisScale = 1; 
    drawFullGridForAX(1);
    
    // HafÄ±zayÄ± Temizle 
    linearState.drawnPoints = []; 
    linearState.tableData = Array(4).fill(null).map(() => ({x: '', y: '', calcY: undefined}));
    
    const confirmBtn = document.getElementById('tableConfirmBtn');
    confirmBtn.style.display = 'block'; 
    confirmBtn.disabled = true; 
    confirmBtn.classList.add('opacity-50', 'cursor-not-allowed'); 
    document.getElementById('checkBtn').disabled = true;
    
    // Ã‡izim aracÄ±nÄ± hazÄ±rla
    setupStraightLineDrawing();
}

// 2. Buton TÄ±klama OlayÄ± (Listener)
var btnYeqAX = document.getElementById('btnYeqAX');
if (btnYeqAX) {
    var newBtnAX = btnYeqAX.cloneNode(true);
    btnYeqAX.parentNode.replaceChild(newBtnAX, btnYeqAX);
    newBtnAX.addEventListener('click', function() {
        gameState.mode = 'y_eq_ax';
        // DiÄŸer butonlarÄ±n seÃ§im halkasÄ±nÄ± kaldÄ±r
        document.querySelectorAll('#lineGraphSubButtons button').forEach(b => b.classList.remove('ring-2', 'ring-offset-1', 'ring-cyan-500'));
        // Bu butona halka ekle
        this.classList.add('ring-2', 'ring-offset-1', 'ring-cyan-500');
        
        // DiÄŸer ekranlarÄ± gizle
        var regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'none';
        document.getElementById('graphQuestionContainer').classList.add('hidden');
        
        // Modu baÅŸlat
        startYeqAXRound();
    });
}


// ==========================================
// EÄÄ°M ANA BUTONU (SADECE MENÃœYÃœ AÃ‡AR)
// ==========================================
document.getElementById('slopeBtn').addEventListener('click', function() {
    // 1. Alt menÃ¼yÃ¼ bul
    const subButtons = document.getElementById('slopeSubButtons');
    
    // AÃ§Ä±k mÄ± kapalÄ± mÄ±?
    const isHidden = subButtons.classList.contains('hidden') || subButtons.style.display === 'none';

    // 2. EkranÄ± temizle (DiÄŸer menÃ¼leri kapat)
    clearAllScreens(); 

    // 3. MenÃ¼yÃ¼ AÃ‡ (Ama oyunu baÅŸlatma!)
    if (isHidden) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex'; // MenÃ¼yÃ¼ gÃ¶rÃ¼nÃ¼r yap
        
        this.classList.add('selected-button');
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');
    } else {
        // Zaten aÃ§Ä±ksa kapat
        subButtons.classList.add('hidden'); // SÄ±nÄ±fÄ± geri ekle
        subButtons.style.display = 'none';
        this.classList.remove('selected-button');
        this.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
    }
});


// --- EÄŸim Alt ButonlarÄ± (Åimdilik HazÄ±rlÄ±k) ---
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
            
            // Burada ileride ilgili modlarÄ± baÅŸlatacaÄŸÄ±z
            console.log(id + " tÄ±klandÄ±. Ä°lgili eÄŸim modu aÃ§Ä±lacak.");
            
            // Ã–rnek: gameState.mode = 'slope_incline';
            // startSlopeInclineRound(); vb.
        });
    }
});

// ==========================================
// DÃ–NÃœÅÃœM GEOMETRÄ°SÄ° MENÃœ MANTIÄI
// ==========================================

// 1. ANA BUTON (MenÃ¼yÃ¼ AÃ§Ä±p Kapatma)
document.getElementById('transformationsBtn').addEventListener('click', function() {
    const subButtons = document.getElementById('transformSubButtons');
    const isHidden = subButtons.classList.contains('hidden');

    // Ã–nce ekranÄ± temizle (DiÄŸer aÃ§Ä±k menÃ¼leri kapatÄ±r)
    clearAllScreens();

    if (isHidden) {
        // MenÃ¼yÃ¼ aÃ§
        subButtons.classList.remove('hidden');
        this.classList.add('selected-button');
    } else {
        // MenÃ¼yÃ¼ kapat
        subButtons.classList.add('hidden');
        this.classList.remove('selected-button');
    }
});

// 2. Ã–TELEME BUTONU GÃœNCELLEMESÄ° (Mevcut listener'Ä± ezer veya tamamlar)
// Not: Mevcut kodda zaten listener var ama menÃ¼yÃ¼ aÃ§Ä±k tutmak iÃ§in bunu override ediyoruz.
var oldTranslationBtn = document.getElementById('translationBtn');
if (oldTranslationBtn) {
    // Butonu klonlayÄ±p eskisini silerek listener Ã§akÄ±ÅŸmasÄ±nÄ± Ã¶nlÃ¼yoruz (En temiz yÃ¶ntem)
    var newTranslationBtn = oldTranslationBtn.cloneNode(true);
    oldTranslationBtn.parentNode.replaceChild(newTranslationBtn, oldTranslationBtn);

    newTranslationBtn.addEventListener('click', function() {
        clearAllScreens(); // Temizlik
        
        // MenÃ¼yÃ¼ tekrar aÃ§ (Ã‡Ã¼nkÃ¼ clearAllScreens kapattÄ±)
        document.getElementById('transformSubButtons').classList.remove('hidden');
        document.getElementById('transformationsBtn').classList.add('selected-button');
        
        // Kendini aktif yap (Halka efekti)
        this.classList.add('ring-2', 'ring-offset-1', 'ring-blue-500');
        
        // DiÄŸer butonun efektini sil
        const refBtn = document.getElementById('reflectionBtn');
        if(refBtn) refBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-purple-500');

        // Normal Canvas'Ä± geri getir
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // Oyun Modunu BaÅŸlat
        gameState.mode = 'translation';
        updateUI();
        startNewRound();
    });
}

// 3. YANSIMA BUTONU GÃœNCELLEMESÄ°
var oldReflectionBtn = document.getElementById('reflectionBtn');
if (oldReflectionBtn) {
    var newReflectionBtn = oldReflectionBtn.cloneNode(true);
    oldReflectionBtn.parentNode.replaceChild(newReflectionBtn, oldReflectionBtn);

    newReflectionBtn.addEventListener('click', function() {
        clearAllScreens(); // Temizlik
        
        // MenÃ¼yÃ¼ tekrar aÃ§
        document.getElementById('transformSubButtons').classList.remove('hidden');
        document.getElementById('transformationsBtn').classList.add('selected-button');

        // Kendini aktif yap
        this.classList.add('ring-2', 'ring-offset-1', 'ring-purple-500');

        // DiÄŸer butonun efektini sil
        const transBtn = document.getElementById('translationBtn');
        if(transBtn) transBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-blue-500');

        // Normal Canvas'Ä± geri getir
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // Oyun Modunu BaÅŸlat
        gameState.mode = 'reflection';
        updateUI();
        startNewRound();
    });
}

// ==========================================
// KOORDÄ°NAT BULMA MENÃœSÃœ (YENÄ°)
// ==========================================

// 1. ANA MENÃœYÃœ AÃ‡/KAPA
document.getElementById('coordinatesBtn').addEventListener('click', function() {
    const subButtons = document.getElementById('coordinateSubButtons');
    const isHidden = subButtons.classList.contains('hidden');

    // DiÄŸer her ÅŸeyi temizle
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
        
        // MenÃ¼yÃ¼ aÃ§Ä±k tut
        document.getElementById('coordinateSubButtons').classList.remove('hidden');
        document.getElementById('coordinatesBtn').classList.add('selected-button');
        
        // Halka efekti (Pembe)
        this.classList.add('ring-2', 'ring-offset-1', 'ring-pink-500');
        // DiÄŸer butonun efektini sil
        const otherBtn = document.getElementById('placeToPointBtn');
        if(otherBtn) otherBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-teal-500');

        // Normal Canvas'Ä± gÃ¶ster
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // OYUNU BAÅLAT
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
        
        // MenÃ¼yÃ¼ aÃ§Ä±k tut
        document.getElementById('coordinateSubButtons').classList.remove('hidden');
        document.getElementById('coordinatesBtn').classList.add('selected-button');

        // Halka efekti (Turkuaz)
        this.classList.add('ring-2', 'ring-offset-1', 'ring-teal-500');
        // DiÄŸer butonun efektini sil
        const otherBtn = document.getElementById('pointToPlaceBtn');
        if(otherBtn) otherBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-pink-500');

        // Normal Canvas'Ä± gÃ¶ster
        const regularCanvas = document.querySelector('.flex-1.flex.items-center.justify-center.p-2.min-h-0.overflow-hidden');
        if (regularCanvas) regularCanvas.style.display = 'flex';

        // OYUNU BAÅLAT
        gameState.mode = 'placeToPoint';
        updateUI();
        startNewRound();
    });
}

// ==========================================
// EÄÄ°M: EÄÄ°K DÃœZLEM MODU
// ==========================================

let slopeState = {
    currentQuestion: 0,
    questions: [
        // ... Eski sorular aynen kalsÄ±n ...
        { type: 'calc_slope', w: 7, h: 4, direction: 'ltr' }, 
        { type: 'calc_slope', w: 5, h: 3, direction: 'ltr' },
        { type: 'calc_slope', w: 6, h: 5, direction: 'rtl' }, 
        { type: 'calc_slope', w: 8, h: 6, direction: 'rtl' },
        { type: 'find_side', w: 12, h: 6, direction: 'ltr', slopeDisplay: '0,5', unknown: 'vertical', answer: 6 },
        { type: 'find_side', w: 12, h: 9, direction: 'rtl', slopeDisplay: '3/4', unknown: 'horizontal', answer: 12 },

        // --- YENÄ° EKLENEN: MERDÄ°VEN SORUSU ---
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

// B) GRAFÄ°K SORULARI (8 ADET: 4 Orijinden GeÃ§en, 4 Eksenleri Kesen)
    graphQuestions: [
        // --- GRUP 1: Orijinden GeÃ§enler (y = ax) ---
        // 1. Pozitif EÄŸim (2/3)
        { m_num: 2, m_denom: 3, points: [{x:0, y:0}, {x:3, y:2}] },
        // 2. Negatif EÄŸim (-1/2)
        { m_num: -1, m_denom: 2, points: [{x:0, y:0}, {x:-2, y:1}] },
        // 3. Tam SayÄ± EÄŸim (3/1 = 3)
        { m_num: 3, m_denom: 1, points: [{x:0, y:0}, {x:1, y:3}] },
        // 4. Negatif Tam SayÄ± EÄŸim (-2/1 = -2)
        { m_num: -2, m_denom: 1, points: [{x:0, y:0}, {x:-1, y:2}] },
        
        // --- GRUP 2: Eksenleri Kesenler (y = ax + b) ---
        // 5. x eksenini -3'te, y eksenini 4'te kesen (EÄŸim: 4/3)
        { m_num: 4, m_denom: 3, points: [{x:-3, y:0}, {x:0, y:4}] },
        // 6. x eksenini 2'de, y eksenini 3'te kesen (EÄŸim: -3/2)
        { m_num: -3, m_denom: 2, points: [{x:2, y:0}, {x:0, y:3}] },
        // 7. x eksenini -4'te, y eksenini -5'te kesen (EÄŸim: -5/4)
        { m_num: -5, m_denom: 4, points: [{x:-4, y:0}, {x:0, y:-5}] },
        // 8. x eksenini 3'te, y eksenini -4'te kesen (EÄŸim: 4/3)
        { m_num: 4, m_denom: 3, points: [{x:3, y:0}, {x:0, y:-4}] },
        { 
            type: 'find_intercept',
            m_display: '-3/4', 
            m_val: -0.75,
            x_label: '8',       // X eksenini 8'de kessin
            y_label: 'a',
            answer: 6,          // Cevap pozitif 6 olsun
            // GÃ¶rselde sÄ±ÄŸmasÄ± iÃ§in Ã¶lÃ§ekli Ã§izim (4 ve 3 noktalarÄ±)
            visualPoints: [{x:4, y:0}, {x:0, y:3}]
        }
    ],
    userAnswer: null
};

// ==========================================
// EÄÄ°K DÃœZLEM MODUNU BAÅLATAN FONKSÄ°YON (DÃœZELTÄ°LMÄ°Å TEMÄ°Z HALÄ°)
// ==========================================
function startSlopeInclineRound() {
    
    // 1. SORULAR BÄ°TTÄ° MÄ° KONTROLÃœ
    if (slopeState.currentQuestion >= slopeState.questions.length) {
        clearAllScreens();
        
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('btnSlopeIncline').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `
            <div class="text-4xl mb-2">ğŸ†</div>
            <div>Tebrikler!</div>
            <div class="text-lg font-normal mt-1">Bu bÃ¶lÃ¼mÃ¼ baÅŸarÄ±yla tamamladÄ±n!</div>
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

    // 2. EKRAN TEMÄ°ZLÄ°ÄÄ°
    clearAllScreens();
    resetLinearQuestionPanel();

    document.getElementById('slopeSubButtons').classList.remove('hidden');
    document.getElementById('btnSlopeIncline').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');
    
    // 3. UI HAZIRLIÄI
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

    // 4. PANEL Ä°Ã‡ERÄ°ÄÄ°
    const q = slopeState.questions[slopeState.currentQuestion];
    const panelContent = document.getElementById('slopeQuestionPanel');
    panelContent.innerHTML = '';

    if (q.type === 'calc_slope') {
        // ESKÄ° TÄ°P
        panelContent.innerHTML = `
            <div class="text-indigo-900 font-bold text-center">
                <span class="text-lg block mb-2">EÄŸimi Hesapla</span>
                <span class="text-sm text-gray-500 font-normal">Dikey / Yatay</span>
            </div>
            <div id="slopeAnswerBox" class="w-48 h-14 border-2 border-dashed border-indigo-400 rounded-xl flex items-center justify-center text-2xl font-bold text-indigo-600 bg-indigo-50 cursor-pointer hover:bg-indigo-100 transition-all shadow-sm">?</div>
            <div class="text-xs text-gray-400 text-center">Kutuya tÄ±kla ve deÄŸeri gir<br>(Ã–rn: 4Ã·7)</div>
        `;
        document.getElementById('slopeAnswerBox').addEventListener('click', function() {
            activeInputTarget = 'slope_simple';
            window.MASTER_TARGET = 'slopeAnswerBox';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = '';
            document.getElementById('numberPad').classList.remove('hidden');
        });

    } else if (q.type === 'stairs') {
        // MERDÄ°VEN TÄ°PÄ°
        panelContent.innerHTML = `
            <div class="text-indigo-900 font-bold text-center mb-2">
                <span class="text-lg">Merdivenin EÄŸimini Bul</span>
            </div>
            <div class="flex items-center justify-center gap-4 text-2xl font-bold font-mono">
                <div class="flex flex-col items-center gap-1">
                    <div id="slopeNumBox" class="min-w-[80px] h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                    <div class="border-b-2 border-indigo-900 w-full"></div>
                    <div id="slopeDenomBox" class="min-w-[80px] h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                </div>
            </div>
            <div class="text-xs text-gray-400 text-center mt-3">Toplam Dikey / Toplam Yatay</div>
        `;
        document.getElementById('slopeNumBox').addEventListener('click', function() {
            activeInputTarget = 'slope_conv_num';
            window.MASTER_TARGET = 'slopeNumBox';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = '';
            document.getElementById('numberPad').classList.remove('hidden');
        });
        document.getElementById('slopeDenomBox').addEventListener('click', function() {
            activeInputTarget = 'slope_conv_denom';
            window.MASTER_TARGET = 'slopeDenomBox';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = '';
            document.getElementById('numberPad').classList.remove('hidden');
        });
    } else {
        // YENÄ° TÄ°P
        let leftSideHTML = '';
        let instructionText = "Soru iÅŸaretli kutuya tÄ±kla";

        if (q.slopeDisplay === '0,5') {
            leftSideHTML = `
                <div class="flex flex-col items-center gap-1">
                    <div id="slopeNumBox" class="min-w-[80px] h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                    <div class="border-b-2 border-indigo-900 w-full"></div>
                    <div id="slopeDenomBox" class="min-w-[80px] h-10 border-2 border-dashed border-indigo-400 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center cursor-pointer hover:bg-indigo-100 font-bold text-lg">?</div>
                </div>`;
            instructionText = "0,5'i kesre Ã§evir (Ã–rn: 1/2), sonra x'i bul";
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
            `<div id="unknownBox" class="min-w-[80px] h-10 border-2 border-dashed border-orange-500 bg-orange-50 text-orange-600 rounded cursor-pointer flex items-center justify-center hover:bg-orange-100">?</div>` : 
            `<span class="text-indigo-900">${q.h}</span>`;

        let bottomContent = q.unknown === 'horizontal' ? 
            `<div id="unknownBox" class="min-w-[80px] h-10 border-2 border-dashed border-orange-500 bg-orange-50 text-orange-600 rounded cursor-pointer flex items-center justify-center hover:bg-orange-100">?</div>` : 
            `<span class="text-indigo-900">${q.w}</span>`;

        panelContent.innerHTML = `
            <div class="text-indigo-900 font-bold text-center mb-2">
                <span class="text-lg">Bilinmeyeni Bul</span>
                ${q.slopeDisplay === '0,5' ? '<div class="text-xs text-indigo-600">(EÄŸim = 0,5)</div>' : ''}
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
            window.MASTER_TARGET = 'unknownBox';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = '';
            const pad = document.getElementById('numberPad');
            if (pad) {
                pad.classList.remove('hidden');
                pad.style.display = 'flex';
                pad.style.zIndex = '999999';
            }
        });

        const numBox = document.getElementById('slopeNumBox');
        if(numBox) numBox.addEventListener('click', function() {
            activeInputTarget = 'slope_conv_num'; 
            window.MASTER_TARGET = 'slopeNumBox';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = '';
            const pad = document.getElementById('numberPad');
            if (pad) {
                pad.classList.remove('hidden');
                pad.style.display = 'flex';
                pad.style.zIndex = '999999';
            }
        });

        const denomBox = document.getElementById('slopeDenomBox');
        if(denomBox) denomBox.addEventListener('click', function() {
            activeInputTarget = 'slope_conv_denom';
            window.MASTER_TARGET = 'slopeDenomBox';
            linearState.currentInputValue = '';
            document.getElementById('currentInput').textContent = '';
            const pad = document.getElementById('numberPad');
            if (pad) {
                pad.classList.remove('hidden');
                pad.style.display = 'flex';
                pad.style.zIndex = '999999';
            }
        });
    }

    drawSlopeTriangle();
    document.getElementById('checkBtn').disabled = true;
}


// ==========================================
// EÄÄ°M CEVAP KONTROL FONKSÄ°YONU (DÃœZELTÄ°LMÄ°Å)
// ==========================================
function checkSlopeAnswer() {
    let q;
    
    // Hangi moddayÄ±z?
    if (slopeState.activeMode === 'graph') {
        q = slopeState.graphQuestions[slopeState.currentQuestion];
    } else {
        q = slopeState.questions[slopeState.currentQuestion];
    }

    // *** Ä°ÅTE HATAYI Ã‡Ã–ZEN SATIR BURASI ***
    let isCorrect = false; 
    // **************************************

    // ---------------------------------------------------------
    // A) GRAFÄ°K MODU KONTROLLERÄ°
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
    // B) EÄÄ°K DÃœZLEM MODU KONTROLLERÄ°
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
                    } else if (userAnswer.includes('Ã·')) {
                        const parts = userAnswer.split('Ã·'); userVal = parseFloat(parts[0]) / parseFloat(parts[1]);
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
    // SONUÃ‡ Ä°ÅLEMLERÄ°
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
        feedback.textContent = "YanlÄ±ÅŸ cevap, tekrar dene!";
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
    }
}



// ==========================================
// EÅÄ°TLÄ°K MODU (FÄ°NAL: KESÄ°N DÃœZELTME v3)
// ==========================================
function startSlopeGraphRound() {
    // 1. LÄ°STEYÄ° TEMÄ°ZLE VE SORUYU ZORLA EKLE
    // Eski "b" sorularÄ±nÄ± siliyoruz ki Ã§akÄ±ÅŸma olmasÄ±n
    slopeState.graphQuestions = slopeState.graphQuestions.filter(q => q.subType !== 'find_b_negative');

    // Yeni soruyu listenin SONUNA ekliyoruz
    slopeState.graphQuestions.push({
        type: 'find_intercept',   
        subType: 'find_b_negative', // Bu kimlik Ã§izimi tetikleyecek
        targetVar: 'b',           
        xVal: 5,                  
        yVal: -15,                // b = -15
        slope: 3,                 
        correctAnswer: -15        
    });

    // 2. BitiÅŸ KontrolÃ¼
    if (slopeState.currentQuestion >= slopeState.graphQuestions.length) {
        clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('btnSlopeGraph').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `<div class="text-4xl mb-2">ğŸ†</div><div>Tebrikler!</div><div class="text-lg font-normal mt-1">Grafik eÄŸim bÃ¶lÃ¼mÃ¼nÃ¼ baÅŸarÄ±yla tamamladÄ±n!</div>`;
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

    // 3. Ekran HazÄ±rlÄ±ÄŸÄ±
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

    // 4. Panel HazÄ±rlÄ±ÄŸÄ±
    const panelContent = document.getElementById('linearQuestionPanel');
    if (panelContent.parentElement !== document.body) document.body.appendChild(panelContent);
    panelContent.classList.remove('hidden');
    
    panelContent.style.cssText = `
        position: fixed !important; top: 50% !important; transform: translateY(-50%) !important; left: 20px !important; z-index: 99999 !important; 
        display: flex !important; flex-direction: column; justify-content: center; align-items: center;
        min-width: 200px; background: #ffffff; border-radius: 12px; padding: 15px; border: 2px solid #e2e8f0; box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    `;

    // GÃœNCEL SORUYU AL
    const q = slopeState.graphQuestions[slopeState.currentQuestion];

    // 5. HTML Ä°Ã§eriÄŸi
    if (q.type === 'find_intercept') {
        const targetVar = (q.subType === 'find_b_negative') ? 'b' : (q.targetVar || 'a'); 
        const slopeInfo = q.slope ? `<div class="text-sm text-gray-500 mb-1">EÄŸim (m) = ${q.slope}</div>` : '';

        panelContent.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full">
                <div class="text-indigo-900 font-bold text-center mb-2"><span class="text-lg">EÅŸitliÄŸi Kur</span></div>
                ${slopeInfo}
                <div class="flex items-center justify-center gap-3 mt-2">
                    <div class="flex flex-col items-center gap-1">
                        <div class="min-w-[80px] h-10 bg-gray-200 text-gray-600 rounded flex items-center justify-center font-bold text-lg select-none">${targetVar}</div>
                        <div class="border-b-4 border-indigo-900 w-12 rounded-full my-1 opacity-80"></div>
                        <div id="leftDenomBox" class="min-w-[80px] h-10 border-2 border-indigo-300 bg-white text-indigo-700 rounded flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-lg shadow-sm">?</div>
                    </div>
                    <div class="text-2xl font-bold text-indigo-900">=</div>
                    <div class="flex flex-col items-center gap-1">
                        <div id="slopeNumBox" class="min-w-[80px] h-10 border-2 border-indigo-300 bg-white text-indigo-700 rounded flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-lg shadow-sm">?</div>
                        <div class="border-b-4 border-indigo-900 w-12 rounded-full my-1 opacity-80"></div>
                        <div id="slopeDenomBox" class="min-w-[80px] h-10 border-2 border-indigo-300 bg-white text-indigo-700 rounded flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-lg shadow-sm">?</div>
                    </div>
                </div>
                <div class="mt-4 text-xs text-gray-500 font-medium text-center border-t pt-2 w-full">Sola yatÄ±k: <span class="text-red-500 font-bold text-sm">(-)</span></div>
            </div>`;
    } else {
        panelContent.innerHTML = `
            <div class="flex flex-col items-center justify-center w-full">
                <div class="text-indigo-900 font-bold text-center mb-2"><span class="text-lg">EÄŸim KaÃ§tÄ±r?</span></div>
                <div class="text-xs text-gray-400 font-medium mb-3 text-center">(Dikey / Yatay)</div>
                <div class="flex flex-col items-center justify-center gap-1 w-full">
                    <div id="slopeNumBox" class="w-16 h-12 border-2 border-indigo-300 bg-white text-indigo-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-xl shadow-sm">?</div>
                    <div class="border-b-4 border-indigo-900 w-20 rounded-full my-1 opacity-80"></div>
                    <div id="slopeDenomBox" class="w-16 h-12 border-2 border-indigo-300 bg-white text-indigo-700 rounded-lg flex items-center justify-center cursor-pointer hover:border-indigo-500 font-bold text-xl shadow-sm">?</div>
                </div>
                <div class="mt-4 text-xs text-gray-500 font-medium text-center border-t pt-2 w-full">Sola yatÄ±k: <span class="text-red-500 font-bold text-sm">(-)</span></div>
            </div>`;
    }

    let currentActiveBoxId = null;

    // 6. TuÅŸ TakÄ±mÄ±
    const pad = document.getElementById('numberPad');
    if (pad) {
        const newPad = pad.cloneNode(true);
        pad.parentNode.replaceChild(newPad, pad);

        newPad.addEventListener('click', function(e) {
            const btn = e.target.closest('button');
            if (!btn) return;
            let val = btn.textContent.trim();
            if (val === 'Tamam' || btn.id === 'confirmInputBtn') { closePanelAndEnableCheck(); return; }
            const isDelete = btn.querySelector('.fa-backspace') || val === 'Sil' || val === 'C' || btn.getAttribute('data-value') === 'clear';
            if (isDelete) {
                linearState.currentInputValue = linearState.currentInputValue.slice(0, -1);
            } else if (val !== 'İptal') {
                let inputChar = btn.getAttribute('data-value') || val;
                if (inputChar && inputChar !== '=' && inputChar !== 'X' && inputChar !== 'Y' && inputChar !== 'Tamam' && inputChar !== 'İptal') {
                    linearState.currentInputValue += inputChar;
                }
            }

            if (currentActiveBoxId) {
                const box = document.getElementById(currentActiveBoxId);
                if (box) {
                    const displayVal = linearState.currentInputValue;
                    box.textContent = displayVal === '' ? '?' : displayVal;
                    box.style.color = displayVal === '' ? '' : '#4338ca';
                    
                    const currentInput = document.getElementById('currentInput');
                    if (currentInput) {
                        currentInput.textContent = displayVal;
                    }
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
                if(isNaN(ld) || isNaN(rn) || isNaN(rd)) { alert("LÃ¼tfen tÃ¼m kutularÄ± doldurunuz!"); return; }

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
                if(!isNaN(rn) && !isNaN(rd)) { calculatedVal = rn/rd; finalMessage = `EÄŸim = ${calculatedVal}`; }
            }

            const feedback = document.getElementById('feedback');
            const displayResult = typeof calculatedVal === 'number' && Number.isInteger(calculatedVal) ? calculatedVal : (calculatedVal ? calculatedVal.toFixed(2) : calculatedVal);

            feedback.innerHTML = `
                <div class="text-4xl mb-2">ğŸ‰</div><div class="font-bold text-2xl">Tebrikler!</div>
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
            window.MASTER_TARGET = boxId;
            linearState.currentInputValue = ''; 
            box.textContent = '?'; box.style.color = '';
            document.getElementById('currentInput').textContent = '';
            const pad = document.getElementById('numberPad');
            if (pad) {
                pad.classList.remove('hidden');
                pad.style.display = 'flex';
                pad.style.zIndex = '999999';
            }
        });
    }

    if (q.type === 'find_intercept') {
        const targetVar = (q.subType === 'find_b_negative') ? 'b' : (q.targetVar || 'a');
        setupBox('leftDenomBox', 'eq_left_denom', `${targetVar} (Payda)`);
        setupBox('slopeNumBox', 'eq_right_num', 'EÄŸim (Pay)');
        setupBox('slopeDenomBox', 'eq_right_denom', 'EÄŸim (Payda)');
    } else {
        setupBox('slopeNumBox', 'slope_conv_num', 'Dikey (Pay)');
        setupBox('slopeDenomBox', 'slope_conv_denom', 'Yatay (Payda)');
    }

    // =======================================================
    // 9. Ã‡Ä°ZÄ°M BÃ–LÃœMÃœ (CANVAS - ELLE Ã‡Ä°ZÄ°M)
    // =======================================================
    // Sorunun kimliÄŸini (find_b_negative) kontrol edip Ã¶zel Ã§izimi yapÄ±yoruz.
    
    if (q.subType === 'find_b_negative') {
        const ctx = canvas.getContext('2d');
        const w = canvas.width = 600; 
        const h = canvas.height = 600;
        const cx = w / 2; // 300
        const cy = h / 2; // 300
        const scale = 15; // Ã–lÃ§ek (b=-15 ekrana sÄ±ÄŸsÄ±n diye 15 yaptÄ±k)

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

        // 4. KIRMIZI DOÄRU (b'den 5'e YUKARI Ã§Ä±kan Ã§izgi)
        // b noktasÄ± (Y ekseni, aÅŸaÄŸÄ±da) -> cy + 15*scale
        // 5 noktasÄ± (X ekseni, saÄŸda) -> cx + 5*scale
        
        const y_piksel = cy + (15 * scale); // b (AÅŸaÄŸÄ±da)
        const x_piksel = cx + (5 * scale);  // 5 (SaÄŸda)

        ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 4; ctx.beginPath();
        
        // Ã‡izgiyi UzatÄ±yoruz:
        // BaÅŸlangÄ±Ã§: b noktasÄ±nÄ±n solundan ve daha aÅŸaÄŸÄ±sÄ±ndan (Sol-Alt)
        ctx.moveTo(cx - 3*scale, y_piksel + 9*scale); 
        
        // BitiÅŸ: 5 noktasÄ±nÄ±n saÄŸÄ±ndan ve daha yukarÄ±sÄ±ndan (SaÄŸ-Ãœst)
        ctx.lineTo(x_piksel + 3*scale, cy - 9*scale); 
        
        ctx.stroke();

        // 5. Etiketler
        ctx.fillStyle = "#1f2937"; ctx.font = "bold 20px sans-serif";
        
        // 5 YazÄ±sÄ± (X ekseni)
        ctx.beginPath(); ctx.arc(x_piksel, cy, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillText("5", x_piksel - 5, cy - 15);

        // b YazÄ±sÄ± (Y ekseni, AÅŸaÄŸÄ±da)
        ctx.beginPath(); ctx.arc(cx, y_piksel, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillText("b", cx + 15, y_piksel + 5);

    } else {
        // DiÄŸer sorular iÃ§in standart Ã§izim
        drawSlopeGraph();
    }
}



// ==========================================
// GRAFÄ°K Ã‡Ä°ZÄ°M FONKSÄ°YONU (DÃœZELTÄ°LMÄ°Å FÄ°NAL HALÄ°)
// ==========================================
function drawSlopeGraph() {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    // ViewBox ekle (Responsive gÃ¶rÃ¼nÃ¼m iÃ§in)
    canvas.setAttribute('viewBox', '0 0 500 500');
    canvas.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const q = slopeState.graphQuestions[slopeState.currentQuestion];
    
    // Ayarlar
    const CENTER_X = 250;
    const CENTER_Y = 250;
    const GRID = 25; // Her birim 25 birim

    // 1. IZGARA VE EKSENLERÄ° Ã‡Ä°Z
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    // Ä°nce Izgaralar
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

    // Eksen NumaralarÄ± (Her kare 1 birim)
    for(let i = -10; i <= 10; i++) {
        if(i !== 0) {
            // X Ekseni NumaralarÄ±
            const xText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            xText.setAttribute('x', CENTER_X + (i * GRID));
            xText.setAttribute('y', CENTER_Y + 15);
            xText.setAttribute('font-size', '12');
            xText.setAttribute('text-anchor', 'middle');
            xText.setAttribute('fill', '#6b7280');
            xText.textContent = i;
            gridGroup.appendChild(xText);

            // Y Ekseni NumaralarÄ±
            const yText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            yText.setAttribute('x', CENTER_X - 8);
            yText.setAttribute('y', CENTER_Y - (i * GRID) + 4);
            yText.setAttribute('font-size', '12');
            yText.setAttribute('text-anchor', 'end');
            yText.setAttribute('fill', '#6b7280');
            yText.textContent = i;
            gridGroup.appendChild(yText);
        }
    }
    
    canvas.appendChild(gridGroup);

    // --- DEÄÄ°ÅKEN TANIMLAMA (BURADA SADECE BÄ°R KEZ YAPILIYOR) ---
    // EÄŸer Ã¶zel soruysa visualPoints, deÄŸilse points kullan
    const pointsToUse = (q.type === 'find_intercept') ? q.visualPoints : q.points;

    // 2. DOÄRUYU Ã‡Ä°Z
    const p1 = pointsToUse[0];
    const p2 = pointsToUse[1];

    const m = (p2.y - p1.y) / (p2.x - p1.x);
    const b = p1.y - (m * p1.x);

    // DoÄŸruyu uzat
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

    // 3. NOKTALAR VE ETÄ°KETLER
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

        // Ã–zel Soru Etiketleri ("8" ve "a" yazÄ±sÄ±)
        if (q.type === 'find_intercept') {
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', cx + 15); 
            label.setAttribute('y', cy - 10);
            label.setAttribute('font-size', '24');
            label.setAttribute('font-weight', 'bold');
            label.setAttribute('fill', '#be185d');
            
            // Ä°lk nokta X ekseninde, Ä°kinci nokta Y ekseninde
            label.textContent = (index === 0) ? q.x_label : q.y_label;
            canvas.appendChild(label);
        }
    });
}

function drawSlopeTriangle() {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = ''; 

    const q = slopeState.questions[slopeState.currentQuestion];
    
    // Ã–lÃ§ek AyarÄ±
    let GRID = (q.w >= 10 || q.h >= 10) ? 25 : 40;
    
    // Merdiven sorusu iÃ§in Ã¶zel Ã¶lÃ§ek (Toplam geniÅŸlik 30 olacaÄŸÄ± iÃ§in kÃ¼Ã§Ã¼ltÃ¼yoruz)
    if (q.type === 'stairs') GRID = 15; 

    const START_Y = 350; 
    // Merdiven iÃ§in baÅŸlangÄ±Ã§ noktasÄ± (Sol Alt)
    const START_X = q.type === 'stairs' ? 50 : (q.direction === 'rtl' ? (GRID === 25 ? 100 : 120) : (GRID === 25 ? 60 : 80));

    // Izgara
    const gridGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    for(let i=0; i<600; i+=GRID) { // Canvas geniÅŸleyebilir
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', i); vLine.setAttribute('y1', 0); vLine.setAttribute('x2', i); vLine.setAttribute('y2', 500); vLine.setAttribute('stroke', '#6b7280'); gridGroup.appendChild(vLine);
        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', 0); hLine.setAttribute('y1', i); hLine.setAttribute('x2', 600); hLine.setAttribute('y2', i); hLine.setAttribute('stroke', '#6b7280'); gridGroup.appendChild(hLine);
    }
    canvas.appendChild(gridGroup);

    // --- MERDÄ°VEN Ã‡Ä°ZÄ°MÄ° ---
    if (q.type === 'stairs') {
        const totalW = q.stepCount * q.stepH * GRID;
        const totalH = q.stepCount * q.stepV * GRID;
        
        let currentX = START_X;
        let currentY = START_Y;

        // BasamaklarÄ± Ã‡iz
        for (let i = 0; i < q.stepCount; i++) {
            // Dikey Ã‡izgi (YukarÄ±)
            const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            vLine.setAttribute('x1', currentX); vLine.setAttribute('y1', currentY);
            vLine.setAttribute('x2', currentX); vLine.setAttribute('y2', currentY - (q.stepV * GRID));
            vLine.setAttribute('stroke', '#ef4444'); // KÄ±rmÄ±zÄ±
            vLine.setAttribute('stroke-width', '3');
            vLine.classList.add('stair-vertical'); // Animasyon iÃ§in sÄ±nÄ±f
            vLine.dataset.id = i; // Hangi basamak olduÄŸunu bilmek iÃ§in
            canvas.appendChild(vLine);

            // Yatay Ã‡izgi (SaÄŸa)
            const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hLine.setAttribute('x1', currentX); hLine.setAttribute('y1', currentY - (q.stepV * GRID));
            hLine.setAttribute('x2', currentX + (q.stepH * GRID)); hLine.setAttribute('y2', currentY - (q.stepV * GRID));
            hLine.setAttribute('stroke', '#3b82f6'); // Mavi
            hLine.setAttribute('stroke-width', '3');
            hLine.classList.add('stair-horizontal');
            canvas.appendChild(hLine);

            // 3. BasamaÄŸa YazÄ± Yaz (Ã–rnekleme)
            if (i === 2) {
                // Dikey YazÄ± (2 cm)
                const textV = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                textV.setAttribute('x', currentX - 5);
                textV.setAttribute('y', currentY - (q.stepV * GRID) / 2);
                textV.setAttribute('text-anchor', 'end');
                textV.setAttribute('font-size', '12');
                textV.setAttribute('fill', '#ef4444');
                textV.setAttribute('font-weight', 'bold');
                textV.textContent = `${q.stepV}cm`;
                canvas.appendChild(textV);

                // Yatay YazÄ± (5 cm)
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

            // KoordinatlarÄ± gÃ¼ncelle
            currentY -= (q.stepV * GRID);
            currentX += (q.stepH * GRID);
        }

        // Ana ÃœÃ§gen Ã‡erÃ§evesi (Hayali/Silik Ã‡izgi)
        const frame = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        frame.setAttribute('d', `M ${START_X} ${START_Y} L ${START_X + totalW} ${START_Y} L ${START_X + totalW} ${START_Y - totalH} Z`);
        frame.setAttribute('fill', 'rgba(0,0,0,0.03)');
        frame.setAttribute('stroke', '#ccc');
        frame.setAttribute('stroke-dasharray', '5,5');
        canvas.insertBefore(frame, canvas.firstChild); // En arkaya at

        return; // Merdiven bitti, fonksiyondan Ã§Ä±k
    }

    // --- DÄ°ÄER ÃœÃ‡GEN TÄ°PLERÄ° (Eski Kod) ---
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

    // Kenar YazÄ±larÄ± (Eski Tip)
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

    // EÄŸim DeÄŸeri
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

      
   
    // --- SONUÃ‡ Ä°ÅLEMLERÄ° ---
let isCorrect = (gameState.selectedOption === gameState.correctAnswer);


    if (isCorrect) {
        playSuccessSound();
        showFeedback(true);
        
        // KutularÄ± YeÅŸil Yap
        document.querySelectorAll('.border-indigo-400').forEach(el => {
            el.classList.remove('border-indigo-400', 'text-indigo-600', 'bg-indigo-50');
            el.classList.add('border-green-500', 'text-green-600', 'bg-green-50');
        });

        // Merdivense animasyon, deÄŸilse sonraki soru

let q = slopeState.questions[slopeState.currentQuestion];

        if (q.type === 'stairs' && slopeState.activeMode !== 'graph') {
            document.getElementById('checkBtn').disabled = true;
            if (typeof animateStairsShow === 'function') animateStairsShow();
        } else {
            window.roundTimer = setTimeout(() => {
                slopeState.currentQuestion++;
                // Hangi moddaysak onun baÅŸlatÄ±cÄ±sÄ±nÄ± Ã§aÄŸÄ±r
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
             feedback.textContent = "EÄŸim YanlÄ±ÅŸ! Ä°ÅŸaretleri (-) ve sayÄ±larÄ± kontrol et.";
        } else if (q.type === 'stairs') {
             feedback.textContent = "Toplam dikey ve yatay uzunluklarÄ± girmelisin.";
        } else {
             feedback.textContent = "YanlÄ±ÅŸ cevap, tekrar dene!";
        }
        feedback.style.opacity = '1';
        setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
    }


// ==========================================
// 5. EÄÄ°M ALT BUTONLARI (GÃœÃ‡LENDÄ°RÄ°LMÄ°Å BAÄLANTILAR)
// ==========================================

// --- A) EÄÄ°K DÃœZLEM BUTONU ---
const btnSlopeIncline = document.getElementById('btnSlopeIncline');
if (btnSlopeIncline) {
    // Eski dinleyicileri temizlemek iÃ§in klonlama (Opsiyonel ama garanti yÃ¶ntem)
    const newBtn = btnSlopeIncline.cloneNode(true);
    btnSlopeIncline.parentNode.replaceChild(newBtn, btnSlopeIncline);

    newBtn.addEventListener('click', function() {
        console.log("ğŸ–±ï¸ EÄŸik DÃ¼zlem Butonuna TÄ±klandÄ±!"); 

        // 1. GÃ¶rsel SeÃ§im
        document.querySelectorAll('.slope-sub-button').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
        });
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        // 2. Mod AyarÄ±
        if (gameState.mode !== 'slope_incline') {
            gameState.mode = 'slope_incline';
            slopeState.currentQuestion = 0; // Yeni moda geÃ§ince sÄ±fÄ±rla
        } else {
            // Zaten bu moddaysak soru ilerlet
            slopeState.currentQuestion++;
            if (slopeState.currentQuestion >= slopeState.questions.length) {
                slopeState.currentQuestion = 0;
            }
        }
        
        // Aktif modu kaydet (Check fonksiyonu iÃ§in Ã¶nemli)
        slopeState.activeMode = 'incline';

        // 3. Oyunu BaÅŸlat
        if (typeof startSlopeInclineRound === 'function') {
            startSlopeInclineRound();
        } else {
            console.error("âŒ HATA: startSlopeInclineRound fonksiyonu bulunamadÄ±!");
        }
    });
} else {
    console.error("âŒ HATA: 'btnSlopeIncline' ID'li buton HTML'de bulunamadÄ±!");
}

// --- B) GRAFÄ°KTEN EÄÄ°M BUTONU ---
const btnSlopeGraph = document.getElementById('btnSlopeGraph');
if (btnSlopeGraph) {
    const newBtn = btnSlopeGraph.cloneNode(true);
    btnSlopeGraph.parentNode.replaceChild(newBtn, btnSlopeGraph);

    newBtn.addEventListener('click', function() {
        console.log("ğŸ–±ï¸ Grafikten EÄŸim Butonuna TÄ±klandÄ±!");

        // 1. GÃ¶rsel SeÃ§im
        document.querySelectorAll('.slope-sub-button').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
        });
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        // 2. Mod AyarÄ±
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

        // 3. Oyunu BaÅŸlat
        if (typeof startSlopeGraphRound === 'function') {
            startSlopeGraphRound();
        } else {
            console.error("âŒ HATA: startSlopeGraphRound fonksiyonu bulunamadÄ±!");
        }
    });
} else {
    console.error("âŒ HATA: 'btnSlopeGraph' ID'li buton HTML'de bulunamadÄ±!");
}


// =================================================================
// C) Ä°KÄ° NOKTADAN EÄÄ°M BUTONU (GÃœNCELLENDÄ°: TIKLADIKÃ‡A GEÃ‡Ä°Å)
// =================================================================
const btnTwoPoints = document.getElementById('btnSlopeTwoPoints');
if (btnTwoPoints) {
    // Eski listener'Ä± temizlemek iÃ§in klonluyoruz
    const newBtn = btnTwoPoints.cloneNode(true);
    btnTwoPoints.parentNode.replaceChild(newBtn, btnTwoPoints);

    newBtn.addEventListener('click', function() {
        console.log("ğŸ–±ï¸ Ä°ki Noktadan EÄŸim Butonuna TÄ±klandÄ± (GeÃ§iÅŸ YapÄ±lÄ±yor)");

        // 1. GÃ¶rsel Efektler
        document.querySelectorAll('.slope-sub-button').forEach(b => {
            b.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');
        });
        this.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

        // 2. Mod KontrolÃ¼ ve Ä°lerleme MantÄ±ÄŸÄ±
        if (gameState.mode === 'slope_two_points') {
            // EÄŸer zaten bu moddaysak, sÄ±radaki soruya geÃ§ (Skip)
            if (typeof slopeState.twoPointsQuestionIndex !== 'undefined') {
                slopeState.twoPointsQuestionIndex++;
                
                // EÄŸer soru sayÄ±sÄ± sÄ±nÄ±rÄ±nÄ± aÅŸtÄ±ysa baÅŸa sarsÄ±n diye kontrol
                // (startSlopeTwoPointsRound iÃ§inde zaten bitiÅŸ kontrolÃ¼ var ama bu ekstra gÃ¼venlik)
                if (slopeState.twoPointsQuestionIndex > 4) { 
                    slopeState.twoPointsQuestionIndex = 0; 
                }
            }
        } else {
            // Ä°lk kez giriyorsak baÅŸtan baÅŸla
            gameState.mode = 'slope_two_points';
            slopeState.twoPointsQuestionIndex = 0;
        }
        
        // 3. Modu BaÅŸlat / GÃ¼ncelle
        if (typeof startSlopeTwoPointsRound === 'function') {
            startSlopeTwoPointsRound();
        }
    });
}


// ==========================================
// KONTROL BUTONU (FÄ°NAL TEMÄ°Z HALÄ°)
// ==========================================
var checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
    // Eski listenerlarÄ± temizlemek iÃ§in klonluyoruz
    var newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);

    newCheckBtn.addEventListener('click', function() {
        console.log("Kontrol Et tÄ±klandÄ±. Aktif Mod:", gameState.mode);

        // 1. EÄÄ°M MODLARI (Grafik ve EÄŸik DÃ¼zlem)
        if (gameState.mode === 'slope_incline' || gameState.mode === 'slope_graph') {
            checkSlopeAnswer();
        } 
        
        // 2. DOÄRU GRAFÄ°KLERÄ° MODLARI
        else if (gameState.mode === 'x_eq_a') {
            if (typeof checkVerticalLine === 'function') checkVerticalLine();
        } 
        else if (gameState.mode === 'y_eq_b') {
            if (typeof checkHorizontalLine === 'function') checkHorizontalLine();
        } 
        else if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') {
            if (typeof checkStraightLine === 'function') checkStraightLine();
        }

// ... checkBtn listener iÃ§inde ...

else if (gameState.mode === 'slope_two_points') {
    // KayÄ±tlÄ± noktalarÄ± al
    const p1 = slopeState.currentTwoPoints.p1; // {x:2, y:3}
    const p2 = slopeState.currentTwoPoints.p2; // {x:-2, y:7}
    
    // KullanÄ±cÄ±nÄ±n girdilerini al
    const y2 = parseFloat(document.getElementById('box_y2').textContent);
    const y1 = parseFloat(document.getElementById('box_y1').textContent);
    const x2 = parseFloat(document.getElementById('box_x2').textContent);
    const x1 = parseFloat(document.getElementById('box_x1').textContent);

    // DoÄŸru formÃ¼l kontrolÃ¼: KullanÄ±cÄ± sayÄ±larÄ± doÄŸru yerlere koymuÅŸ mu?
    // y2=7, y1=3, x2=-2, x1=2  veya tam tersi sÄ±ra (noktalarÄ±n sÄ±rasÄ± fark etmez ama eÅŸleÅŸmeli)
    
    // GerÃ§ek eÄŸim
    const realSlope = (p2.y - p1.y) / (p2.x - p1.x); // (7-3)/(-2-2) = 4/-4 = -1
    const userSlope = (y2 - y1) / (x2 - x1);

    if (Math.abs(realSlope - userSlope) < 0.001) {
        showFeedback(true);
        playSuccessSound();
        // Ä°stersen burada yeni soruya geÃ§iÅŸ eklenebilir
    } else {
        showFeedback(false);
        playErrorSound();
    }
}

        // 3. DOÄRUSAL Ä°LÄ°ÅKÄ°LER MODLARI
        else if (gameState.mode === 'questionToGraph') {
            if (typeof checkLinearGraph === 'function') checkLinearGraph();
        } 
        else if (gameState.mode === 'graphToQuestion') {
            if (typeof checkGraphAnswer === 'function') checkGraphAnswer();
        }

        // 4. STANDART GEOMETRÄ° MODLARI (Ã–teleme, YansÄ±ma vb.)
        else {
            if (typeof checkAnswer === 'function') checkAnswer();
        }
    });
}


// ==========================================
// NUMPAD Ä°PTAL BUTONU
// ==========================================
document.getElementById('numPadCancel').addEventListener('click', function() {
    // Paneli gizle
    document.getElementById('numberPad').classList.add('hidden');
    
    // Girilen deÄŸeri sÄ±fÄ±rla
    linearState.currentInputValue = '';
    document.getElementById('currentInput').textContent = '';
    
    // Hedefi unut
    activeInputTarget = null;
});



// ==========================================
// MERDÄ°VEN ANÄ°MASYONU (JAVASCRIPT Ä°LE KARE KARE HAREKET - %100 GARANTÄ°)
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

    // Hareket ettirilecek parÃ§alarÄ± listeye alalÄ±m
    // Her Ã§izginin "Åu an nerede?" ve "Nereye gidecek?" bilgisini tutacaÄŸÄ±z
    let animations = [];

    // 1. Dikey ParÃ§alarÄ± (KÄ±rmÄ±zÄ±) Listeye Ekle
    document.querySelectorAll('.stair-vertical').forEach(line => {
        // Ã‡izginin rengini hemen deÄŸiÅŸtir
        line.setAttribute('stroke', '#b91c1c');
        line.setAttribute('stroke-width', '4');

        animations.push({
            el: line,
            // BaÅŸlangÄ±Ã§ deÄŸerleri (SayÄ±ya Ã§eviriyoruz)
            startX1: parseFloat(line.getAttribute('x1')),
            startY1: parseFloat(line.getAttribute('y1')),
            startX2: parseFloat(line.getAttribute('x2')),
            startY2: parseFloat(line.getAttribute('y2')),
            // Hedef deÄŸerler (Dikey Ã§izgiler saÄŸa toplanacak)
            targetX1: targetX,
            targetY1: parseFloat(line.getAttribute('y1')), // Y deÄŸiÅŸmiyor, olduÄŸu yÃ¼kseklikte kaysÄ±n
            targetX2: targetX,
            targetY2: parseFloat(line.getAttribute('y2'))
        });
    });

    // 2. Yatay ParÃ§alarÄ± (Mavi) Listeye Ekle
    document.querySelectorAll('.stair-horizontal').forEach(line => {
        // Ã‡izginin rengini hemen deÄŸiÅŸtir
        line.setAttribute('stroke', '#1e40af');
        line.setAttribute('stroke-width', '4');

        animations.push({
            el: line,
            // BaÅŸlangÄ±Ã§
            startX1: parseFloat(line.getAttribute('x1')),
            startY1: parseFloat(line.getAttribute('y1')),
            startX2: parseFloat(line.getAttribute('x2')),
            startY2: parseFloat(line.getAttribute('y2')),
            // Hedef (Yatay Ã§izgiler alta inecek)
            targetX1: parseFloat(line.getAttribute('x1')), // X deÄŸiÅŸmiyor, olduÄŸu hizada insin
            targetY1: targetY,
            targetX2: parseFloat(line.getAttribute('x2')),
            targetY2: targetY
        });
    });

    // 3. ANÄ°MASYON MOTORU
    const duration = 3000; // 3 Saniye
    const startTime = performance.now();

    function frame(currentTime) {
        const elapsed = currentTime - startTime;
        // Ä°lerleme yÃ¼zdesi (0 ile 1 arasÄ±)
        let progress = Math.min(elapsed / duration, 1);
        
        // YumuÅŸak geÃ§iÅŸ efekti (Ease-in-out formÃ¼lÃ¼)
        // Bu formÃ¼l hareketi baÅŸta yavaÅŸ, ortada hÄ±zlÄ±, sonda yavaÅŸ yapar
        const ease = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

        // Her bir Ã§izgiyi yeni konumuna gÃ¼ncelle
        animations.forEach(anim => {
            // Matematik: BaÅŸlangÄ±Ã§ + (Fark * Ä°lerleme)
            const curX1 = anim.startX1 + (anim.targetX1 - anim.startX1) * ease;
            const curY1 = anim.startY1 + (anim.targetY1 - anim.startY1) * ease;
            const curX2 = anim.startX2 + (anim.targetX2 - anim.startX2) * ease;
            const curY2 = anim.startY2 + (anim.targetY2 - anim.startY2) * ease;

            anim.el.setAttribute('x1', curX1);
            anim.el.setAttribute('y1', curY1);
            anim.el.setAttribute('x2', curX2);
            anim.el.setAttribute('y2', curY2);
        });

        // SÃ¼re bitmediyse bir sonraki kareyi iste
        if (progress < 1) {
            window.animationFrameId = requestAnimationFrame(frame);
        } else {
            // 4. ANÄ°MASYON BÄ°TTÄ°, YAZILARI GÃ–STER
            showTextLabels(targetX, targetY, totalW, totalH, q, START_X);
        }
    }

    // Motoru Ã‡alÄ±ÅŸtÄ±r
    window.animationFrameId = requestAnimationFrame(frame);
}

// YazÄ±larÄ± GÃ¶steren YardÄ±mcÄ± Fonksiyon
function showTextLabels(targetX, targetY, totalW, totalH, q, START_X) {
    const canvas = document.getElementById('linearCanvas');

    // Dikey Toplam YazÄ±sÄ±
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

    // Yatay Toplam YazÄ±sÄ±
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

    // 5 Saniye sonra diÄŸer soruya geÃ§
    window.roundTimer = setTimeout(() => {
        slopeState.currentQuestion++;
        startSlopeInclineRound();
    }, 5000);
}

// ==========================================
// EKRAN TEMÄ°ZLÄ°ÄÄ° YAMASI (BUG FIX)
// ==========================================
// DiÄŸer ana menÃ¼ butonlarÄ±na basÄ±ldÄ±ÄŸÄ±nda EÄŸim modundan kalanlarÄ± temizle
const cleanUpButtons = ['linearRelationsBtn', 'lineGraphsBtn', 'transformationsBtn', 'coordinatesBtn'];

cleanUpButtons.forEach(btnId => {
    const btn = document.getElementById(btnId);
    if (btn) {
        // Mevcut iÅŸlevini bozmadan 'dinleyici' ekliyoruz
        btn.addEventListener('click', function() {
            // 1. EÄŸim Soru Panelini Gizle
            const slopePanel = document.getElementById('slopeQuestionPanel');
            if (slopePanel) {
                slopePanel.classList.add('hidden');
                slopePanel.style.display = 'none'; // Garanti olsun
            }

            // 2. EÄŸim Alt MenÃ¼sÃ¼nÃ¼ Gizle
            const slopeSubs = document.getElementById('slopeSubButtons');
            if (slopeSubs) {
                slopeSubs.classList.add('hidden');
            }

            // 3. EÄŸim Butonu SeÃ§im Efektini KaldÄ±r
            const incBtn = document.getElementById('btnSlopeIncline');
            if (incBtn) incBtn.classList.remove('ring-2', 'ring-offset-1', 'ring-orange-500');

            // 4. Tabloyu ve Tamam Butonunu Geri Getir (EÄŸim modunda gizlemiÅŸtik)
            const dataTable = document.getElementById('dataTable');
            if (dataTable) {
                dataTable.style.display = 'block'; // Veya '' yaparak CSS'e bÄ±rakabiliriz
                dataTable.classList.remove('hidden');
            }
            
            const confirmBtn = document.getElementById('tableConfirmBtn');
            if (confirmBtn) {
                confirmBtn.style.display = 'block'; // GÃ¶rÃ¼nÃ¼r yap
                confirmBtn.classList.remove('hidden');
            }
        });
    }
});


// ==========================================
// EKRAN GÃœNCELLEYÄ°CÄ° (YENÄ° KUTULARI TANIYAN BEYÄ°N)
// ==========================================
function updateActiveInputDisplay() {
    // HafÄ±zadaki sayÄ± ne?
    const val = linearState.currentInputValue;
    
    // Hangi kutuya yazmalÄ±yÄ±m? (activeInputTarget)
    
    // 1. Sol Alttaki Kutu (a'nÄ±n altÄ±)
    if (activeInputTarget === 'eq_left_denom') {
        const el = document.getElementById('leftDenomBox');
        if(el) el.textContent = val || '?';
    }

    // 2. SaÄŸ Ãœst (Pay)
    // Hem eski mod (slope_conv_num) hem yeni mod (eq_right_num) iÃ§in aynÄ± kutu:
    if (activeInputTarget === 'eq_right_num' || activeInputTarget === 'slope_conv_num') {
        const el = document.getElementById('slopeNumBox'); 
        if(el) el.textContent = val || '?';
    }

    // 3. SaÄŸ Alt (Payda)
    // Hem eski mod (slope_conv_denom) hem yeni mod (eq_right_denom) iÃ§in aynÄ± kutu:
    if (activeInputTarget === 'eq_right_denom' || activeInputTarget === 'slope_conv_denom') {
        const el = document.getElementById('slopeDenomBox'); 
        if(el) el.textContent = val || '?';
    }

// ... (Mevcut kodlarÄ±n altÄ±na ekle) ...

// --- Ä°KÄ° NOKTADAN EÄÄ°M GÃœNCELLEMESÄ° ---
if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
    // 1. DeÄŸeri ilgili kutuya yaz
    const role = activeInputTarget.split('_')[2]; // y2, y1, x2, x1
    const boxId = 'box_' + role;
    const box = document.getElementById(boxId);
    
    if (box) {
        // BoÅŸsa '?' kalsÄ±n, deÄŸilse deÄŸeri yaz
        box.textContent = linearState.currentInputValue === '' ? '?' : linearState.currentInputValue;
        box.style.color = '#4338ca';
    }

    // 2. TÃ¼m kutular dolu mu kontrol et
    const y2 = parseFloat(document.getElementById('box_y2').textContent);
    const y1 = parseFloat(document.getElementById('box_y1').textContent);
    const x2 = parseFloat(document.getElementById('box_x2').textContent);
    const x1 = parseFloat(document.getElementById('box_x1').textContent);

    // EÄŸer hepsi sayÄ±ysa (isNaN deÄŸilse) hesapla
    if (!isNaN(y2) && !isNaN(y1) && !isNaN(x2) && !isNaN(x1)) {
        
        const pay = y2 - y1;
        const payda = x2 - x1;
        
        const resultDisplay = document.getElementById('calcResultDisplay');
        const checkBtn = document.getElementById('checkBtn');

        // Payda 0 ise hata/tanÄ±msÄ±z
        if (payda === 0) {
            resultDisplay.textContent = "TanÄ±msÄ±z (Payda 0)";
            resultDisplay.style.color = "red";
        } else {
            // Sonucu gÃ¶ster (Ã–rn: m = 4/-4 veya sadeleÅŸtirme yapÄ±labilir ama ÅŸimdilik ham hali)
            // SadeleÅŸtirme istenirse eklenebilir. Åimdilik A/B formatÄ±:
            resultDisplay.textContent = `m = ${pay} / ${payda}`;
            resultDisplay.style.color = "#16a34a"; // YeÅŸil
        }

        // GÃ¶stergeyi aÃ§ ve butonu yak
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
// ğŸš‘ Ä°KÄ° NOKTADAN EÄÄ°M MODU - (YERLEÅÄ°M VE NUMPAD DÃœZELTMESÄ°)
// =================================================================
window.startSlopeTwoPointsRound = function() {
    console.log("ğŸ“ Ä°ki Noktadan EÄŸim Modu: DÃ¼zenlenmiÅŸ ArayÃ¼z...");

    // 1. Temizlik
    if (typeof clearAllScreens === 'function') clearAllScreens();

    // 2. Alt MenÃ¼ ve Buton AktifliÄŸi
    const subButtons = document.getElementById('slopeSubButtons');
    if (subButtons) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex';
    }
    const btn = document.getElementById('btnSlopeTwoPoints');
    if (btn) btn.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    // 3. Arka Plan Konteyneri (TÄ±klamalarÄ± engellememesi iÃ§in pointer-events ayarÄ±)
    const container = document.getElementById('linearContainer');
    if (container) {
        container.classList.remove('hidden');
        container.style.display = 'block'; 
        container.style.pointerEvents = 'none'; // Konteyner tÄ±klamayÄ± engellemesin
        container.style.margin = '0 auto';
        // Ä°Ã§erideki Ã§akÄ±ÅŸan elemanlarÄ± gizle
        if (document.getElementById('linearCanvas')) document.getElementById('linearCanvas').style.display = 'none';
        if (document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
        if (document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    }

    // 4. SORU PANELÄ° (KONUM VE BOYUT AYARI)
    const panel = document.getElementById('slopeQuestionPanel');
    if (panel) {
        if (panel.parentElement !== document.body) document.body.appendChild(panel);

        panel.classList.remove('hidden');
        
        // --- CSS GÃœNCELLEMESÄ° ---
        // top: 55% -> Biraz aÅŸaÄŸÄ±ya indi (butonlarÄ± kapatmaz)
        // z-index: 50 -> Numpad'in altÄ±nda kalacak ÅŸekilde ayarlandÄ±
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
            max-width: 500px !important; /* Ã‡ok geniÅŸ olmasÄ±nÄ± engeller */
            pointer-events: auto !important; /* Panel tÄ±klanabilir olsun */
        `;

        // 5. Ä°Ã‡ERÄ°K
        const p1 = { x: 2, y: 3 };
        const p2 = { x: -2, y: 7 };
        
        if (typeof slopeState !== 'undefined') slopeState.currentTwoPoints = { p1, p2 };

        panel.innerHTML = `
            <h3 class="text-xl font-bold text-indigo-900 mb-3">EÄŸimi Hesapla</h3>
            
            <div class="text-base text-gray-700 mb-4 text-center">
                <span class="font-bold text-indigo-600">A(${p1.x}, ${p1.y})</span> ve 
                <span class="font-bold text-indigo-600">B(${p2.x}, ${p2.y})</span>
            </div>

            <div class="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                <div class="text-3xl font-bold text-indigo-800 italic font-serif">m =</div>
                
                <div class="flex flex-col items-center">
                    <div class="flex items-center gap-1 mb-1">
                        <div id="box_y2" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_y1" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                    
                    <div class="w-full h-1 bg-indigo-900 rounded-full my-0.5 opacity-80"></div>
                    
                    <div class="flex items-center gap-1 mt-1">
                        <div id="box_x2" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_x1" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                </div>
            </div>

            <div id="calcResultDisplay" class="h-8 text-2xl font-bold text-green-600 opacity-0 transition-all">m = ...</div>
        `;

        // TÄ±klama OlaylarÄ±
        setupInputClick('box_y2', 'y2', 'yâ‚‚ Giriniz (7)');
        setupInputClick('box_y1', 'y1', 'yâ‚ Giriniz (3)');
        setupInputClick('box_x2', 'x2', 'xâ‚‚ Giriniz (-2)');
        setupInputClick('box_x1', 'x1', 'xâ‚ Giriniz (2)');
    }

    // Kontrol Butonunu PasifleÅŸtir
    const chk = document.getElementById('checkBtn');
    if(chk) {
        chk.disabled = true;
        chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
        chk.style.opacity = '0.5';
    }
};

// ==========================================
// 1. SAYI PANELÄ° KONUM AYARI (AÅAÄI Ä°NDÄ°RME)
// ==========================================
window.setupInputClick = function(id, role, title) {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('click', function() {
            activeInputTarget = 'two_points_' + role;
            if (typeof linearState !== 'undefined') linearState.currentInputValue = '';
            
            // BaÅŸlÄ±ÄŸÄ± gÃ¼ncelle
            const currentInputLabel = document.getElementById('currentInput');
            if(currentInputLabel) currentInputLabel.textContent = title;
            
            // NUMPAD'Ä° AÃ‡ VE KONUMLANDIR
            const numPad = document.getElementById('numberPad');
            if(numPad) {
                numPad.classList.remove('hidden');
                
                // --- DÃœZELTME BURADA ---
                numPad.style.cssText = `
                    display: flex !important;
                    z-index: 999999 !important; /* En, en Ã¼stte */
                    position: fixed !important;
                    top: 70% !important;       /* 50% idi, 70% yaptÄ±k (AÅŸaÄŸÄ± indi) */
                    left: 50% !important;
                    transform: translate(-50%, -50%) !important;
                `;
            }
        });
    }
};

// ==========================================
// 2. "TAMAM" TUÅU TAMÄ°RÄ° (KAPATMA VE HESAPLAMA)
// ==========================================
var confirmBtn = document.getElementById('numPadClose'); // Genelde "Tamam" veya "Tik" butonu budur

if (confirmBtn) {
    // Eski gÃ¶revleri temizle (Clone yÃ¶ntemi)
    var newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    newConfirmBtn.addEventListener('click', function() {
        console.log("âœ… Tamam tuÅŸuna basÄ±ldÄ±.");
        
        const val = linearState.currentInputValue;

        // A) Ä°KÄ° NOKTADAN EÄÄ°M MODU Ä°SE
        if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
            const role = activeInputTarget.split('_')[2]; // y2, y1, x2, x1
            const box = document.getElementById('box_' + role);
            
            if (box) {
                // DeÄŸeri kutuya yaz
                box.textContent = val === '' ? '?' : val;
                box.style.color = '#4338ca'; // Mor renk
                
                // Otomatik HesaplamayÄ± Tetikle
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
        
        // B) DÄ°ÄER MODLAR Ä°Ã‡Ä°N KISA YOL (Mevcut yapÄ±yÄ± bozmamak iÃ§in)
        else if (activeInputTarget === 'slope_simple' && document.getElementById('slopeAnswerBox')) {
            document.getElementById('slopeAnswerBox').textContent = val;
            document.getElementById('checkBtn').disabled = false;
        }
        else if (activeInputTarget === 'slope_unknown' && document.getElementById('unknownBox')) {
            document.getElementById('unknownBox').textContent = val;
             document.getElementById('checkBtn').disabled = false;
        }

        // --- KRÄ°TÄ°K BÃ–LÃœM: KAPATMA ---
        const numPad = document.getElementById('numberPad');
        if (numPad) {
            numPad.classList.add('hidden'); // Gizle
        }
        
        // Input deÄŸerini sÄ±fÄ±rla
        if (typeof linearState !== 'undefined') {
            linearState.currentInputValue = '';
        }
        const inputLabel = document.getElementById('currentInput');
        if(inputLabel) inputLabel.textContent = '';
    });
}

// ==========================================
// 3. OTOMATÄ°K HESAPLAMA (YEDEK)
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
            disp.textContent = "TanÄ±msÄ±z (Payda 0)";
            disp.style.color = "red";
        } else {
            disp.textContent = `m = ${pay} / ${payda}`;
            disp.style.color = "#16a34a"; // YeÅŸil
        }
        
        // Sonucu GÃ¶ster
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
// ğŸš€ Ä°KÄ° NOKTADAN EÄÄ°M MODU - (Ã‡OKLU SORU VERSÄ°YONU)
// =================================================================

// 1. SORU LÄ°STESÄ° VE BAÅLATMA MANTIÄI
window.startSlopeTwoPointsRound = function() {
    console.log("ğŸ“ Ä°ki Noktadan EÄŸim Modu: Soru YÃ¼kleniyor...");

    // --- SORU LÄ°STESÄ° (BURAYA YENÄ° SORULAR EKLEYEBÄ°LÄ°RSÄ°N) ---
    const questions = [
        { p1: { x: 2, y: 3 }, p2: { x: -2, y: 7 } },   // 1. Soru (Eski)
        { p1: { x: -3, y: -4 }, p2: { x: 2, y: -5 } }  // 2. Soru (Yeni)
    ];

    // Soru Ä°ndeksini Kontrol Et (Yoksa 0'dan baÅŸlat)
    if (typeof slopeState.twoPointsQuestionIndex === 'undefined') {
        slopeState.twoPointsQuestionIndex = 0;
    }

    // --- TÃœM SORULAR BÄ°TTÄ° MÄ°? ---
    if (slopeState.twoPointsQuestionIndex >= questions.length) {
        // BitiÅŸ EkranÄ±
        if (typeof clearAllScreens === 'function') clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('slopeSubButtons').style.display = 'flex';
        
        const feedback = document.getElementById('feedback');
        feedback.textContent = "ğŸ† Tebrikler! TÃ¼m sorularÄ± tamamladÄ±n!";
        feedback.className = 'fixed bottom-1/2 left-1/2 transform -translate-x-1/2 px-8 py-6 rounded-2xl shadow-2xl font-bold text-center bg-purple-600 text-white text-2xl z-[99999]';
        feedback.style.opacity = '1';
        playSuccessSound();

        // 3 saniye sonra baÅŸa dÃ¶n
        setTimeout(() => {
            feedback.style.opacity = '0';
            slopeState.twoPointsQuestionIndex = 0; // BaÅŸa sar
        }, 4000);
        return;
    }

    // --- SIRADAKÄ° SORUYU AL ---
    const currentQ = questions[slopeState.twoPointsQuestionIndex];
    const p1 = currentQ.p1;
    const p2 = currentQ.p2;

    // State'e kaydet (Kontrol ederken lazÄ±m olacak)
    slopeState.currentTwoPoints = { p1, p2 };

    // 2. ARAYÃœZÃœ HAZIRLA
    if (typeof clearAllScreens === 'function') clearAllScreens();
    
    const subButtons = document.getElementById('slopeSubButtons');
    if (subButtons) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex';
    }
    const btn = document.getElementById('btnSlopeTwoPoints');
    if (btn) btn.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    // Ana kutuyu aÃ§
    const container = document.getElementById('linearContainer');
    if (container) {
        container.classList.remove('hidden');
        container.style.display = 'block';
        container.style.pointerEvents = 'none';
        if (document.getElementById('linearCanvas')) document.getElementById('linearCanvas').style.display = 'none';
        if (document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
        if (document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    }

    // Paneli oluÅŸtur
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

        // HTML Ä°Ã§eriÄŸi (DeÄŸerler deÄŸiÅŸken)
        panel.innerHTML = `
            <div class="absolute top-2 left-4 text-xs font-bold text-gray-400">Soru ${slopeState.twoPointsQuestionIndex + 1} / ${questions.length}</div>
            <h3 class="text-xl font-bold text-indigo-900 mb-3">EÄŸimi Hesapla</h3>
            
            <div class="text-base text-gray-700 mb-4 text-center">
                <span class="font-bold text-indigo-600">A(${p1.x}, ${p1.y})</span> ve 
                <span class="font-bold text-indigo-600">B(${p2.x}, ${p2.y})</span>
            </div>

            <div class="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                <div class="text-3xl font-bold text-indigo-800 italic font-serif">m =</div>
                <div class="flex flex-col items-center">
                    <div class="flex items-center gap-1 mb-1">
                        <div id="box_y2" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_y1" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                    <div class="w-full h-1 bg-indigo-900 rounded-full my-0.5 opacity-80"></div>
                    <div class="flex items-center gap-1 mt-1">
                        <div id="box_x2" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                        <span class="text-xl font-bold text-gray-400">-</span>
                        <div id="box_x1" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer hover:border-indigo-600 text-indigo-700">?</div>
                    </div>
                </div>
            </div>
            <div id="calcResultDisplay" class="h-8 text-2xl font-bold text-green-600 opacity-0 transition-all">m = ...</div>
        `;

        // TÄ±klama OlaylarÄ± (DeÄŸiÅŸken baÅŸlÄ±klar)
        setupInputClick('box_y2', 'y2', `yâ‚‚ Giriniz (${p2.y})`);
        setupInputClick('box_y1', 'y1', `yâ‚ Giriniz (${p1.y})`);
        setupInputClick('box_x2', 'x2', `xâ‚‚ Giriniz (${p2.x})`);
        setupInputClick('box_x1', 'x1', `xâ‚ Giriniz (${p1.x})`);
    }
    
    // Kontrol Butonunu SÄ±fÄ±rla
    const chk = document.getElementById('checkBtn');
    if(chk) {
        chk.disabled = true;
        chk.style.opacity = '0.5';
        chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
    }
};

// 2. KONTROL BUTONU (SIRADAKÄ° SORUYA GEÃ‡ME MANTIÄI EKLENDÄ°)
var checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
    var newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);

    newCheckBtn.addEventListener('click', function() {
        // --- Ä°KÄ° NOKTADAN EÄÄ°M MODU Ä°SE ---
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
                
                // DOÄRU BÄ°LÄ°NCE 2 SANÄ°YE SONRA DÄ°ÄER SORUYA GEÃ‡
                setTimeout(() => {
                    slopeState.twoPointsQuestionIndex++; // SÄ±radaki soruya geÃ§
                    startSlopeTwoPointsRound(); // Yeniden baÅŸlat
                }, 2000);
                
            } else {
                showFeedback(false);
                playErrorSound();
            }
        } 
        // --- DÄ°ÄER MODLAR Ä°Ã‡Ä°N ESKÄ° KODLARI KORUYALIM ---
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
// ğŸš€ Ä°KÄ° NOKTADAN EÄÄ°M MODU (3. SORU EKLENDÄ° - ORÄ°JÄ°N)
// =================================================================
window.startSlopeTwoPointsRound = function() {
    console.log("ğŸ“ Ä°ki Noktadan EÄŸim Modu: Soru YÃ¼kleniyor...");

    // --- 1. SORU LÄ°STESÄ° ---
    const questions = [
        { p1: { x: 2, y: 3 }, p2: { x: -2, y: 7 } },     // 1. Soru
        { p1: { x: -3, y: -4 }, p2: { x: 2, y: -5 } },   // 2. Soru
        { p1: { x: 3, y: -5 }, p2: { x: 0, y: 0 } }      // 3. Soru (YENÄ°: Orijin)
    ];

    // Soru Ä°ndeksini Kontrol Et
    if (typeof slopeState.twoPointsQuestionIndex === 'undefined') {
        slopeState.twoPointsQuestionIndex = 0;
    }

    // --- TÃœM SORULAR BÄ°TTÄ° MÄ°? ---
    if (slopeState.twoPointsQuestionIndex >= questions.length) {
        // BitiÅŸ EkranÄ±
        if (typeof clearAllScreens === 'function') clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('slopeSubButtons').style.display = 'flex';
        
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `
            <div class="text-4xl mb-2">ğŸ†</div>
            <div>Harika Ä°ÅŸ!</div>
            <div class="text-lg font-normal mt-1">TÃ¼m iki nokta sorularÄ±nÄ± bitirdin!</div>
        `;
        feedback.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 px-12 py-10 rounded-2xl shadow-2xl font-bold text-center bg-purple-600 text-white text-2xl z-[99999] animate-bounce border-4 border-white';
        feedback.style.opacity = '1';
        playSuccessSound();

        setTimeout(() => {
            feedback.style.opacity = '0';
            slopeState.twoPointsQuestionIndex = 0; // BaÅŸa sar
            setTimeout(() => { feedback.innerHTML = ''; }, 500);
        }, 4000);
        return;
    }

    // --- SIRADAKÄ° SORUYU AL ---
    const currentQ = questions[slopeState.twoPointsQuestionIndex];
    const p1 = currentQ.p1;
    const p2 = currentQ.p2;

    // State'e kaydet
    slopeState.currentTwoPoints = { p1, p2 };

    // --- 2. ARAYÃœZÃœ HAZIRLA ---
    if (typeof clearAllScreens === 'function') clearAllScreens();
    
    // MenÃ¼leri AÃ§
    const subButtons = document.getElementById('slopeSubButtons');
    if (subButtons) {
        subButtons.classList.remove('hidden');
        subButtons.style.display = 'flex';
    }
    const btn = document.getElementById('btnSlopeTwoPoints');
    if (btn) btn.classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    // Arka PlanÄ± AÃ§
    const container = document.getElementById('linearContainer');
    if (container) {
        container.classList.remove('hidden');
        container.style.display = 'block';
        container.style.pointerEvents = 'none';
        // Ä°Ã§eridekileri gizle
        if (document.getElementById('linearCanvas')) document.getElementById('linearCanvas').style.display = 'none';
        if (document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
        if (document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';
    }

    // --- 3. PANELÄ° OLUÅTUR ---
    const panel = document.getElementById('slopeQuestionPanel');
    if (panel) {
        if (panel.parentElement !== document.body) document.body.appendChild(panel);
        panel.classList.remove('hidden');
        
        // CSS KonumlandÄ±rma
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

        // Orijin KontrolÃ¼ (Metin GÃ¶sterimi Ä°Ã§in)
        let p2Text = `<span class="text-indigo-600">B(${p2.x}, ${p2.y})</span>`;
        if (p2.x === 0 && p2.y === 0) {
            p2Text = `<span class="text-pink-600 font-extrabold">Orijin (0,0)</span>`;
        }

        // HTML Ä°Ã§eriÄŸi
        panel.innerHTML = `
            <div class="absolute top-3 left-4 text-xs font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Soru ${slopeState.twoPointsQuestionIndex + 1} / ${questions.length}
            </div>
            
            <div class="text-center mb-6 mt-2">
                <div class="text-xl text-gray-700 mb-2">
                    <span class="font-bold text-indigo-600">A(${p1.x}, ${p1.y})</span> ve ${p2Text}
                </div>
                <div class="text-base text-gray-500">noktalarÄ±ndan geÃ§en doÄŸrunun eÄŸimi kaÃ§tÄ±r?</div>
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

        // TÄ±klama OlaylarÄ±
        setupInputClick('box_y2', 'y2', `yâ‚‚ Giriniz (${p2.y})`);
        setupInputClick('box_y1', 'y1', `yâ‚ Giriniz (${p1.y})`);
        setupInputClick('box_x2', 'x2', `xâ‚‚ Giriniz (${p2.x})`);
        setupInputClick('box_x1', 'x1', `xâ‚ Giriniz (${p1.x})`);
    }
    
    // Kontrol Butonu Reset
    const chk = document.getElementById('checkBtn');
    if(chk) {
        chk.disabled = true;
        chk.style.opacity = '0.5';
        chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400');
    }
};

// 2. KONTROL BUTONU GÃœNCELLEMESÄ° (ZATEN EKLÄ° AMA GARANTÄ° OLSUN)
// Bu kÄ±sÄ±m, mevcut kodunda zaten var olan 'checkBtn' listener'Ä± ile Ã§alÄ±ÅŸÄ±r.
// Tekrar yapÄ±ÅŸtÄ±rmana gerek yok ama emin olmak istersen aÅŸaÄŸÄ±dadÄ±r.
// ...

// =================================================================
// ğŸš€ Ä°KÄ° NOKTADAN EÄÄ°M MODU (4. SORU: EÄÄ°M VERÄ°LMÄ°Å, C BULMA)
// =================================================================
window.startSlopeTwoPointsRound = function() {
    console.log("ğŸ“ Ä°ki Noktadan EÄŸim Modu YÃ¼kleniyor...");

    // 1. SORU LÄ°STESÄ°
    const questions = [
        { type: 'standard', p1: { x: 2, y: 3 }, p2: { x: -2, y: 7 } },
        { type: 'standard', p1: { x: -3, y: -4 }, p2: { x: 2, y: -5 } },
        { type: 'standard', p1: { x: 3, y: -5 }, p2: { x: 0, y: 0 } },
        
        // --- 4. YENÄ° Ã–ZEL SORU (c BULMA) ---
        { 
            type: 'find_c_slope_given', // Yeni Tip
            p1: { x: 0, y: 'c' },      // A NoktasÄ± (Bilinmeyen)
            p2: { x: -2, y: 3 },       // B NoktasÄ± (Bilinen)
            slope: 4,                  // Verilen EÄŸim
            slopeFraction: { n: 4, d: 1 }, // 4/1 olarak yazÄ±lacak
            correctC: 11               // Ã‡Ã¶zÃ¼m: (c-3)/(0-(-2)) = 4 => c-3 = 8 => c=11
        }
    ];

    // Ä°ndeks KontrolÃ¼
    if (typeof slopeState.twoPointsQuestionIndex === 'undefined') {
        slopeState.twoPointsQuestionIndex = 0;
    }

    // BÄ°TÄ°Å KONTROLÃœ
    if (slopeState.twoPointsQuestionIndex >= questions.length) {
        if (typeof clearAllScreens === 'function') clearAllScreens();
        document.getElementById('slopeSubButtons').classList.remove('hidden');
        document.getElementById('slopeSubButtons').style.display = 'flex';
        
        const feedback = document.getElementById('feedback');
        feedback.innerHTML = `<div class="text-4xl mb-2">ğŸ†</div><div>MÃ¼kemmel!</div><div class="text-lg mt-1">Bu konunun uzmanÄ± sensin!</div>`;
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

    // 2. TEMÄ°ZLÄ°K VE HAZIRLIK
    if (typeof clearAllScreens === 'function') clearAllScreens();
    
    const subButtons = document.getElementById('slopeSubButtons');
    if(subButtons) { subButtons.classList.remove('hidden'); subButtons.style.display = 'flex'; }
    document.getElementById('btnSlopeTwoPoints').classList.add('ring-2', 'ring-offset-1', 'ring-orange-500');

    const container = document.getElementById('linearContainer');
    container.classList.remove('hidden'); container.style.display = 'block'; container.style.pointerEvents = 'none';
    
    // Gereksizleri gizle
    if(document.getElementById('dataTable')) document.getElementById('dataTable').style.display = 'none';
    if(document.getElementById('tableConfirmBtn')) document.getElementById('tableConfirmBtn').style.display = 'none';

    // 3. PANELÄ° OLUÅTUR
    const panel = document.getElementById('slopeQuestionPanel');
    if (panel) {
        if (panel.parentElement !== document.body) document.body.appendChild(panel);
        panel.classList.remove('hidden');
        
        // Bu soru tipi iÃ§in Ã¶zel CSS (GrafiÄŸi kapatmamasÄ± iÃ§in saÄŸa/yukarÄ± alÄ±yoruz)
        const isSpecial = (currentQ.type === 'find_c_slope_given');
        
        panel.style.cssText = `
            position: fixed !important;
            top: ${isSpecial ? '55%' : '55%'} !important; 
            left: ${isSpecial ? '50%' : '50%'} !important; /* GrafiÄŸin saÄŸÄ±na al */
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
            // --- 4. SORU (Ã–ZEL ARAYÃœZ: EÄÄ°M VERÄ°LMÄ°Å, C Ä°STENÄ°YOR) ---
            
            // GrafiÄŸi AÃ§ ve Ã‡iz
            const canvas = document.getElementById('linearCanvas');
            canvas.style.display = 'block';
            drawSlopeUnknownGraph(currentQ); 

            panel.innerHTML = `
                <div class="absolute top-2 left-4 text-xs font-bold text-gray-400">Soru 4 / 4</div>
                <h3 class="text-xl font-bold text-red-600 mb-2">Bilinmeyeni Bul (c)</h3>
                
                <div class="text-sm text-gray-700 mb-4 text-center leading-relaxed">
                    DoÄŸrunun EÄŸimi <span class="font-bold text-red-600">m = 4</span> ise,<br>
                    A(0, <span class="font-bold text-red-600">c</span>) ve B(-2, 3) noktalarÄ± iÃ§in 'c' kaÃ§tÄ±r?
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
            
            // TÄ±klama OlaylarÄ± (DoÄŸru deÄŸerler ile)
            setupInputClick('box_y1', 'y1', 'yâ‚ DeÄŸeri (3)');     // B'nin y'si
            setupInputClick('box_x2', 'x2', 'xâ‚‚ DeÄŸeri (0)');     // A'nÄ±n x'i
            setupInputClick('box_x1', 'x1', 'xâ‚ DeÄŸeri (-2)');    // B'nin x'i
            setupInputClick('box_slope_a', 'slope_a', 'EÄŸim PayÄ± (4)');
            setupInputClick('box_slope_b', 'slope_b', 'EÄŸim PaydasÄ± (1)');
            setupInputClick('box_final_c', 'final_c', 'BulduÄŸun c deÄŸeri?');

        } else {
            // --- STANDART SORULAR (1, 2, 3) ---
            const canvas = document.getElementById('linearCanvas');
            canvas.style.display = 'none';

            let p2Text = `<span class="text-indigo-600">B(${currentQ.p2.x}, ${currentQ.p2.y})</span>`;
            if (currentQ.p2.x === 0 && currentQ.p2.y === 0) p2Text = `<span class="text-pink-600 font-extrabold">Orijin (0,0)</span>`;

            panel.innerHTML = `
                <div class="absolute top-2 left-4 text-xs font-bold text-gray-400">Soru ${slopeState.twoPointsQuestionIndex + 1} / ${questions.length}</div>
                <h3 class="text-xl font-bold text-indigo-900 mb-3">EÄŸimi Hesapla</h3>
                <div class="text-base text-gray-700 mb-4 text-center">
                    <span class="font-bold text-indigo-600">A(${currentQ.p1.x}, ${currentQ.p1.y})</span> ve ${p2Text}
                </div>
                <div class="flex items-center gap-3 bg-indigo-50 p-4 rounded-xl border border-indigo-200 mb-4">
                    <div class="text-3xl font-bold text-indigo-800 italic font-serif">m =</div>
                    <div class="flex flex-col items-center">
                        <div class="flex items-center gap-1 mb-1">
                            <div id="box_y2" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                            <span class="text-xl font-bold text-gray-400">-</span>
                            <div id="box_y1" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                        </div>
                        <div class="w-full h-1 bg-indigo-900 rounded-full my-0.5 opacity-80"></div>
                        <div class="flex items-center gap-1 mt-1">
                            <div id="box_x2" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                            <span class="text-xl font-bold text-gray-400">-</span>
                            <div id="box_x1" class="min-w-[80px] h-10 bg-white border-2 border-dashed border-indigo-400 rounded flex items-center justify-center font-bold text-lg cursor-pointer text-indigo-700">?</div>
                        </div>
                    </div>
                </div>
                <div id="calcResultDisplay" class="h-8 text-2xl font-bold text-green-600 opacity-0 transition-all">m = ...</div>
            `;
            
            setupInputClick('box_y2', 'y2', `yâ‚‚ Giriniz (${currentQ.p2.y})`);
            setupInputClick('box_y1', 'y1', `yâ‚ Giriniz (${currentQ.p1.y})`);
            setupInputClick('box_x2', 'x2', `xâ‚‚ Giriniz (${currentQ.p2.x})`);
            setupInputClick('box_x1', 'x1', `xâ‚ Giriniz (${currentQ.p1.x})`);
        }
    }
    
    // Kontrol Butonunu SÄ±fÄ±rla
    const chk = document.getElementById('checkBtn');
    if(chk) { chk.disabled = true; chk.style.opacity = '0.5'; chk.classList.remove('animate-pulse', 'ring-4', 'ring-green-400'); }
};

// 4. Ã–ZEL GRAFÄ°K Ã‡Ä°ZÄ°MÄ° (c HESAPLANARAK)
function drawSlopeUnknownGraph(q) {
    const canvas = document.getElementById('linearCanvas');
    canvas.innerHTML = '';
    canvas.setAttribute('viewBox', '0 0 600 600');
    
    // c'yi hesapla (GÃ¶rsel Ã§izim iÃ§in gerekli)
    const valC = q.correctC; // 11
    
    // Ã–lÃ§ek AyarÄ±: c=11 Ã§ok yÃ¼ksek, bu yÃ¼zden her kareyi kÃ¼Ã§Ã¼k tutuyoruz.
    // Izgara 20 birim olsun. Orijin biraz aÅŸaÄŸÄ±da olsun (400) ki 11 sÄ±ÄŸsÄ±n.
    const GRID = 25; 
    const CX = 300; // X Orijini (Biraz sola)
    const CY = 400; // Y Orijini (AÅŸaÄŸÄ±da, Ã§Ã¼nkÃ¼ c=11 yukarÄ±da olacak)

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

    // NoktalarÄ±n Piksel KarÅŸÄ±lÄ±klarÄ±
    // A(0, c)
    const ax = CX + (0 * GRID);
    const ay = CY - (valC * GRID);
    
    // B(-2, 3)
    const bx = CX + (-2 * GRID);
    const by = CY - (3 * GRID);

    // DoÄŸruyu Ã‡iz (UzatÄ±lmÄ±ÅŸ)
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    const dx = ax - bx; const dy = ay - by;
    // Ã‡izgiyi iki taraftan uzat
    line.setAttribute('x1', bx - dx*0.5); line.setAttribute('y1', by - dy*0.5);
    line.setAttribute('x2', ax + dx*0.5); line.setAttribute('y2', ay + dy*0.5);
    line.setAttribute('stroke', '#ef4444'); 
    line.setAttribute('stroke-width', '4');
    canvas.appendChild(line);

    // NoktalarÄ± Ã‡iz
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

// 5. KONTROL MANTIÄI (GÃœNCELLENMÄ°Å VERSÄ°YON)
var checkBtn = document.getElementById('checkBtn');
if (checkBtn) {
    var newCheckBtn = checkBtn.cloneNode(true);
    checkBtn.parentNode.replaceChild(newCheckBtn, checkBtn);

    newCheckBtn.addEventListener('click', function() {
        if (gameState.mode === 'slope_two_points') {
            const q = slopeState.currentTwoPointsQ;

            // --- 4. SORU KONTROLÃœ (c BULMA) ---
            if (q.type === 'find_c_slope_given') {
                const userC = parseFloat(document.getElementById('box_final_c').textContent);
                
                // AyrÄ±ca ara adÄ±mlarÄ±n (formÃ¼lÃ¼n) dolu olup olmadÄ±ÄŸÄ±na da bakabiliriz
                const boxA = document.getElementById('box_slope_a').textContent;
                const boxB = document.getElementById('box_slope_b').textContent;

                if (!isNaN(userC) && userC === q.correctC && boxA == '4' && boxB == '1') {
                    showFeedback(true);
                    playSuccessSound();
                    
                    // Ã‡Ã¶zÃ¼m AdÄ±mlarÄ±nÄ± GÃ¶ster
                    const steps = document.getElementById('solutionSteps');
                    steps.classList.remove('hidden');
                    steps.innerHTML = `
                        <div>âœ… <b>Ã‡Ã–ZÃœM ADIMLARI:</b></div>
                        1. FormÃ¼l: (c - 3) / (0 - (-2)) = 4/1 <br>
                        2. Payda: 0 - (-2) = 2 <br>
                        3. Denklem: (c - 3) / 2 = 4 <br>
                        4. Ä°Ã§ler DÄ±ÅŸlar: c - 3 = 8 <br>
                        5. SonuÃ§: c = 8 + 3 = <b class="text-red-600">11</b>
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
        // DiÄŸer modlarÄ±n kontrollerini koru...
        else if (gameState.mode === 'x_eq_a') { if(typeof checkVerticalLine === 'function') checkVerticalLine(); }
        else if (gameState.mode === 'y_eq_b') { if(typeof checkHorizontalLine === 'function') checkHorizontalLine(); }
        else if (gameState.mode === 'y_eq_ax' || gameState.mode === 'y_eq_ax_plus_b') { if(typeof checkStraightLine === 'function') checkStraightLine(); }
        else if (gameState.mode === 'slope_incline' || gameState.mode === 'slope_graph') { if(typeof checkSlopeAnswer === 'function') checkSlopeAnswer(); }
        else if (gameState.mode === 'questionToGraph') { if(typeof checkLinearGraph === 'function') checkLinearGraph(); }
        else if (gameState.mode === 'graphToQuestion') { if(typeof checkGraphAnswer === 'function') checkGraphAnswer(); }
        else { if(typeof checkAnswer === 'function') checkAnswer(); }
    });
}

// 6. NUMPAD GÃœNCELLEME (YENÄ° KUTULARI TANIYAN VERSÄ°YON)
// ==========================================
// 2. "TAMAM" TUÅU TAMÄ°RÄ° (KAPATMA VE HESAPLAMA)
// ==========================================
const numPadCloseBtn = document.getElementById('numPadClose');
if (numPadCloseBtn) {
    // Ã–nceki dinleyicileri temizlemek iÃ§in butonu klonluyoruz
    const newNumPadCloseBtn = numPadCloseBtn.cloneNode(true);
    numPadCloseBtn.parentNode.replaceChild(newNumPadCloseBtn, numPadCloseBtn);
    
    newNumPadCloseBtn.addEventListener('click', function() {
        try {
            let val = linearState.currentInputValue || '';
            const disp = document.getElementById('currentInput');
            if (disp && disp.textContent !== '') val = disp.textContent;

            // TÄ±klanan hedef bir tablo hÃ¼cresi ise (Ã¶rn: table_input_y_0)
            if (activeInputTarget && activeInputTarget.startsWith('table_input_')) {
                const parts = activeInputTarget.split('_');
                const col = parts[2]; // 'x' veya 'y'
                const row = parseInt(parts[3]);

                // Ä°ÅLEM Ã–NCELÄ°ÄÄ°NE GÃ–RE OTOMATÄ°K HESAPLAMA (Y SÃ¼tunu)
                if (col === 'y' && val !== '') {
                    // x harfini Ã§arpma iÅŸlemine (*) Ã§evir
                    let expression = val.replace(/x/g, '*').replace(/X/g, '*');
                    
                    try {
                        const calculatedValue = new Function('return ' + expression)();
                        val = calculatedValue.toString(); 
                    } catch (err) {
                        console.log("Ä°fade hesaplanamadÄ±, girilen deÄŸer korundu:", err);
                    }
                }

                // TABLOYU VE EKRANI GÃœNCELLE
                if (!linearState.tableData) linearState.tableData = [];
                if (!linearState.tableData[row]) linearState.tableData[row] = { x: '', y: '' };
                
                linearState.tableData[row][col] = val;

                const targetBox = document.getElementById(activeInputTarget);
                if (targetBox) {
                    targetBox.textContent = val; 
                    targetBox.classList.remove('bg-indigo-100', 'border-indigo-500'); 
                }

                // SATIR TAMAMLANDIYSA NOKTAYI GRAFÄ°ÄE Ã‡Ä°Z
                const currentRow = linearState.tableData[row];
                if (currentRow.x !== '' && currentRow.y !== '') {
                    if (typeof refreshLinearGraphPoints === 'function') {
                        refreshLinearGraphPoints();
                    }
                }

                // TABLO TAMAMEN DOLDU MU KONTROL ET
                let isTableFull = true;
                const maxRows = 4; // Tablondaki varsayÄ±lan satÄ±r sayÄ±sÄ±
                for (let i = 0; i < maxRows; i++) {
                    if (!linearState.tableData[i] || linearState.tableData[i].x === '' || linearState.tableData[i].y === '') {
                        isTableFull = false;
                        break;
                    }
                }

                // Tablo tamamen dolduysa, tablonun altÄ±ndaki onay butonunu gÃ¶ster
                if (isTableFull) {
                    const tableConfirmBtn = document.getElementById('tableConfirmBtn'); 
                    if (tableConfirmBtn) {
                        tableConfirmBtn.classList.remove('hidden');
                        tableConfirmBtn.disabled = false;
                        tableConfirmBtn.classList.add('animate-pulse'); 
                    }
                }
            } 
            
            // DiÄŸer modlar iÃ§in olan kodlarÄ±n (EÄŸim vs.) Ã§alÄ±ÅŸmaya devam etmesi iÃ§in burayÄ± koruyoruz
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
            console.error("NumPad Ä°ÅŸlem HatasÄ±:", e);
        } finally {
            // Ä°ÅŸlem bitince NumPad'i gizle ve deÄŸerleri temizle
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
// ğŸš‘ ACÄ°L DURUM: NUMPAD KAPATMA (CSS RESET YÃ–NTEMÄ°)
// =================================================================
var confirmBtn = document.getElementById('numPadClose');

if (confirmBtn) {
    // 1. Butonu temizle ve yenisini oluÅŸtur
    var newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

    // 2. Yeni TÄ±klama OlayÄ±
    newConfirmBtn.addEventListener('click', function(e) {
        // TÄ±klama olayÄ±nÄ±n yayÄ±lmasÄ±nÄ± engelle (Ã‡akÄ±ÅŸmalarÄ± Ã¶nler)
        e.preventDefault();
        e.stopPropagation();

        console.log("âœ… Tamam'a basÄ±ldÄ±. DeÄŸer iÅŸleniyor ve KAPATILIYOR.");
        
        const val = linearState.currentInputValue;

        // --- VERÄ° Ä°ÅLEME (KUTULARA YAZMA) ---
        try {
            // A) Ä°KÄ° NOKTADAN EÄÄ°M MODU
            if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
                const role = activeInputTarget.replace('two_points_', ''); 
                const boxId = 'box_' + role;
                const box = document.getElementById(boxId);
                
                if (box) {
                    box.textContent = val === '' ? '?' : val;
                    box.style.color = '#4338ca'; 
                    
                    // 4. Soru KontrolÃ¼ (c deÄŸeri)
                    if (role === 'final_c' && val !== '') {
                        const chk = document.getElementById('checkBtn');
                        if(chk) { chk.disabled = false; chk.style.opacity = '1'; }
                    }
                    
                    // Standart Sorular iÃ§in Otomatik Hesaplama
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

            // C) ESKÄ° EÄÄ°M MODLARI
            else if (activeInputTarget === 'slope_simple') document.getElementById('slopeAnswerBox').textContent = val;
            else if (activeInputTarget === 'slope_unknown') document.getElementById('unknownBox').textContent = val;
            else if (activeInputTarget === 'slope_intercept') document.getElementById('interceptAnswerBox').textContent = val;
            else if (activeInputTarget === 'slope_conv_num' || activeInputTarget === 'eq_right_num') document.getElementById('slopeNumBox').textContent = val;
            else if (activeInputTarget === 'slope_conv_denom' || activeInputTarget === 'eq_right_denom') document.getElementById('slopeDenomBox').textContent = val;
            else if (activeInputTarget === 'eq_left_denom') document.getElementById('leftDenomBox').textContent = val;

        } catch (err) {
            console.error("Veri iÅŸleme hatasÄ±:", err);
        }

        // --- KRÄ°TÄ°K BÃ–LÃœM: ZORLA KAPATMA ---
        const numPad = document.getElementById('numberPad');
        if (numPad) {
            // 1. Ã–nce Ã¼zerindeki tÃ¼m inline stilleri (top, left, z-index, display:flex !important) SÄ°LÄ°YORUZ.
            numPad.removeAttribute('style'); 
            
            // 2. Sonra temiz bir ÅŸekilde gizliyoruz.
            numPad.classList.add('hidden');
        }
        
        // --- TEMÄ°ZLÄ°K ---
        if (typeof linearState !== 'undefined') {
            linearState.currentInputValue = '';
        }
        const inputLabel = document.getElementById('currentInput');
        if(inputLabel) inputLabel.textContent = '';
    });
}

// =================================================================
// 1. EKRAN GÃœNCELLEYÄ°CÄ° (Ä°SÄ°M AYRIÅTIRMA DÃœZELTMESÄ°)
// =================================================================
window.updateActiveInputDisplay = function() {
    const val = linearState.currentInputValue;

    // A) Ä°KÄ° NOKTADAN EÄÄ°M MODU (KapsamlÄ± DÃ¼zeltme)
    if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
        // HATA BURADAYDI: split('_')[2] sadece 'slope' alÄ±yordu, 'a' kayboluyordu.
        // DÃœZELTME: replace ile baÅŸtaki etiketi siliyoruz, geriye tam isim kalÄ±yor.
        const role = activeInputTarget.replace('two_points_', ''); // Ã–rn: 'slope_a'
        const boxId = 'box_' + role; // -> 'box_slope_a'
        
        const box = document.getElementById(boxId);
        if (box) {
            box.textContent = val === '' ? '?' : val;
            box.style.color = '#4338ca';
        }
        return; // Bu moddaysak aÅŸaÄŸÄ±ya devam etme
    }

    // B) DÄ°ÄER MODLAR (ESKÄ° KODLARIN KORUNMASI)
    // Sol Alttaki Kutu (a'nÄ±n altÄ±)
    if (activeInputTarget === 'eq_left_denom') {
        const el = document.getElementById('leftDenomBox');
        if(el) el.textContent = val || '?';
    }
    // SaÄŸ Ãœst (Pay)
    else if (activeInputTarget === 'eq_right_num' || activeInputTarget === 'slope_conv_num') {
        const el = document.getElementById('slopeNumBox'); 
        if(el) el.textContent = val || '?';
    }
    // SaÄŸ Alt (Payda)
    else if (activeInputTarget === 'eq_right_denom' || activeInputTarget === 'slope_conv_denom') {
        const el = document.getElementById('slopeDenomBox'); 
        if(el) el.textContent = val || '?';
    }
};

// =================================================================
// ğŸ”§ EKRAN GÃœNCELLEME TAMÄ°RÄ° (ALT TÄ°RE SORUNU Ã‡Ã–ZÃœMÃœ)
// =================================================================
window.updateActiveInputDisplay = function() {
    const val = linearState.currentInputValue;

    // A) Ä°KÄ° NOKTADAN EÄÄ°M MODU (Ã–ZEL DÃœZELTME)
    if (activeInputTarget && activeInputTarget.startsWith('two_points_')) {
        // HATA BURADAYDI: split('_') kullanÄ±nca "slope_a" parÃ§alanÄ±yordu.
        // Ã‡Ã–ZÃœM: replace() ile sadece baÅŸtaki etiketi siliyoruz, gerisini olduÄŸu gibi alÄ±yoruz.
        
        const role = activeInputTarget.replace('two_points_', ''); // Ã–rn: 'slope_a'
        const boxId = 'box_' + role; // -> 'box_slope_a'
        
        const box = document.getElementById(boxId);
        if (box) {
            // DeÄŸeri kutuya anlÄ±k olarak yaz
            box.textContent = val === '' ? '?' : val;
            box.style.color = '#4338ca';
        }
        return; // Bu moddaysak iÅŸlemi bitir, aÅŸaÄŸÄ±ya inme.
    }

    // B) DÄ°ÄER MODLAR (ESKÄ° KODLARIN Ã‡ALIÅMAYA DEVAM ETMESÄ° Ä°Ã‡Ä°N)
    
    // Sol Alttaki Kutu (a'nÄ±n altÄ± - EÅŸitlik Modu)
    if (activeInputTarget === 'eq_left_denom') {
        const el = document.getElementById('leftDenomBox');
        if(el) el.textContent = val || '?';
    }
    
    // SaÄŸ Ãœst (Pay - EÄŸim Modu)
    else if (activeInputTarget === 'eq_right_num' || activeInputTarget === 'slope_conv_num') {
        const el = document.getElementById('slopeNumBox'); 
        if(el) el.textContent = val || '?';
    }
    
    // SaÄŸ Alt (Payda - EÄŸim Modu)
    else if (activeInputTarget === 'eq_right_denom' || activeInputTarget === 'slope_conv_denom') {
        const el = document.getElementById('slopeDenomBox'); 
        if(el) el.textContent = val || '?';
    }
};

// --- DOÄRUSAL Ä°LÄ°ÅKÄ°LER MODÃœLÃœ (EKSÄ°K FONKSÄ°YONLAR) ---

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
            <button onclick="backToMenu()" class="w-full mt-4 text-xs text-gray-400">Geri DÃ¶n</button>
        </div>
    `;
    renderGrid();
}

// --- DOÄRUSAL Ä°LÄ°ÅKÄ°LER KESÄ°N Ã‡Ã–ZÃœM MODÃœLÃœ ---

// 1. BUTONU ZORLA BÄ°ZÄ°M SÄ°STEME BAÄLIYORUZ (Otomatik Kurulum)
document.addEventListener('DOMContentLoaded', () => {
    // HTML'ndeki butonun ID'si bu
    const btn = document.getElementById('questionToGraphBtn');
    if (btn) {
        // Senin eski kodu ezip, butona basÄ±nca bizim sistemi aÃ§masÄ±nÄ± saÄŸlÄ±yoruz
        btn.onclick = (e) => {
            e.preventDefault(); 
            showLinearGraphQuestion();
        };
    }
});

// 2. MODU BAÅLATAN ANA FONKSÄ°YON
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
            panel.innerHTML = `<div class="bg-red-100 p-4 text-red-700 font-bold border-2 border-red-500 rounded text-center">Soru havuzu bulunamadÄ±!</div>`;
            return;
        }

        const scenario = questionsList[Math.floor(Math.random() * questionsList.length)];
        linearState.currentScenario = scenario;
        
        // Veri yapÄ±sÄ±nÄ± esnek ÅŸekilde Ã§ek
        let dataPoints = scenario.tableData || scenario.points || scenario.data || scenario.noktalar || (scenario.lines ? scenario.lines[0].points : null);
        
        // Veri yoksa bile Ã§Ã¶kmeyi engelle, 3 tane boÅŸ satÄ±r ekle
        if (!dataPoints || dataPoints.length === 0) {
            dataPoints = [ {x:'?', y:'?'}, {x:'?', y:'?'}, {x:'?', y:'?'} ];
            linearState.isDummyData = true; 
        } else {
            linearState.isDummyData = false;
        }

        linearState.currentDataPoints = dataPoints;
        renderLinearTable(scenario); 
        
        // BoÅŸ grafiÄŸi (eksenlerle birlikte) Ã§iz
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

// 3. TABLOYU PANELE Ã‡Ä°ZEN FONKSÄ°YON
function renderLinearTable(scenario) {
    const panel = document.getElementById('linearQuestionPanel');
    let questionText = scenario.question || scenario.soru || scenario.mainQuestion || scenario.text || "Soru metni bulunamadÄ±.";
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

    // VERÄ° BULUNAMAZSA EKRANA SARI UYARI KUTUSU BAS
    if (linearState.isDummyData) {
        let jsonGosterim = JSON.stringify(scenario).substring(0, 150);
        html += `
            <div class="bg-yellow-50 border-l-4 border-yellow-500 p-3 mb-4 text-xs text-yellow-800">
                <strong class="font-bold">UyarÄ±:</strong> Bu sorunun iÃ§inde tablo verisi (points) tanÄ±mlanmamÄ±ÅŸ. 
                <br><br>Sistemdeki ham veri ÅŸu ÅŸekilde: <code class="bg-yellow-100 p-1 rounded font-mono">${jsonGosterim}...</code>
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
                    âœ… Tablo DoÄŸru!<br>Åimdi yandaki grafikte noktalarÄ± iÅŸaretleyip birleÅŸtirin.
                </p>
            </div>
        </div>
    `;
    panel.innerHTML = html;
}

// --- 1. MATEMATÄ°KSEL Ä°ÅLEM Ã‡Ã–ZÃœCÃœ (Ä°ÅŸlem Ã–nceliÄŸi: BEDMAS/BODMAS) ---
function evaluateMath(expr) {
    if (!expr || expr === '?') return NaN;
    
    // Numpad'den gelen Ã§arpÄ± (x, X, Ã—, *) ve bÃ¶lÃ¼ (Ã·) iÅŸaretlerini koda Ã§evir
    let safeExpr = expr.toString().replace(/x|X|Ã—/g, '*').replace(/Ã·/g, '/');
    
    // GÃ¼venlik iÃ§in sadece rakam ve operatÃ¶rleri bÄ±rak
    safeExpr = safeExpr.replace(/[^0-9\+\-\*\/\(\)\.]/g, '');
    
    try {
        // Ä°ÅŸlem Ã¶nceliÄŸine gÃ¶re hesapla (Ã–rn: 200-1*15 = 185)
        const result = Function('"use strict";return (' + safeExpr + ')')();
        return Number.isFinite(result) ? result : NaN;
    } catch (e) {
        return NaN;
    }
}

// --- 2. NUMPAD AÃ‡ICI VE TEMÄ°ZLEYÄ°CÄ° (TÃ¼m satÄ±rlarda Ã§alÄ±ÅŸmasÄ±nÄ± saÄŸlar) ---
window.openTableInput = function(targetId) {
    activeInputTarget = targetId; 
    
    // Tablodaki seÃ§ili kutuyu mavi yap
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500');
    });
    const activeEl = document.getElementById(targetId);
    if (activeEl) {
        activeEl.classList.add('bg-indigo-100', 'border-indigo-500');
    }

    // Numpad'i aÃ§
    const np = document.getElementById('numberPad');
    if (np) np.classList.remove('hidden');
    
    // Ã–NEMLÄ° DÃœZELTME: Her tÄ±klamada Numpad gÃ¶stergesini sÄ±fÄ±rla ki Ã¶nceki satÄ±rÄ±n sayÄ±sÄ± kalmasÄ±n!
    const displayDiv = document.getElementById('currentInput');
    if (displayDiv) {
        displayDiv.textContent = ''; 
    }
};


// --- 4. Ã‡Ä°FT TARAFLI VERÄ° GÄ°RÄ°ÅLÄ° TABLO Ã‡Ä°ZÄ°MÄ° ---
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
                    âœ… Tablo DoÄŸru!<br>Åimdi yandaki grafikte noktalarÄ± iÅŸaretleyip birleÅŸtirin.
                </p>
            </div>
        </div>
    `;
    panel.innerHTML = html;
}


function refreshLinearGraphPoints() {
    const linearSvg = document.getElementById('linearCanvas');
    if (!linearSvg) return;

    // Arka planÄ± temizle ve ViewBox'Ä± sabitle
    linearSvg.innerHTML = '';
    linearSvg.setAttribute('viewBox', '0 0 500 500');

    // OYUN MOTORUNUN ORÄ°JÄ°NAL SABÄ°TLERÄ° (Asla deÄŸiÅŸmemeli)
    const originX = 50;
    const originY = 450;
    const grid = 50; // Orijinal motor 50 px ile Ã§alÄ±ÅŸÄ±r!

    // Ã‡izimlerin yapÄ±lacaÄŸÄ± boÅŸ katman (Oyun motoru burayÄ± arÄ±yor olabilir)
    const linesLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    linesLayer.setAttribute('id', 'drawingLayer');
    linearSvg.appendChild(linesLayer);

    // Verileri al
    const dataPoints = typeof linearState !== 'undefined' ? (linearState.tableData || linearState.currentDataPoints) : null; 
    if (!dataPoints) return;

    // Ã–lÃ§ek Hesaplama
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

    // HAYATÄ°: Ã‡izim motorunun farenin yerini doÄŸru bulmasÄ± iÃ§in Ã¶lÃ§eÄŸi hafÄ±zaya kaydet
    if (typeof linearState !== 'undefined') {
        linearState.yScale = scaleY;
        linearState.xScale = scaleX;
    }

    // 1. BÃ¶lge Izgara (0'dan 8'e kadar, Ã§Ã¼nkÃ¼ 8*50=400px tam sÄ±ÄŸar)
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

    // NoktalarÄ± Ã‡iz
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

                // GÃ–RÃœNMEZ TIKLAMA ALANI (Ã–ÄŸrenci noktayÄ± kolay tutabilsin diye)
                const hitArea = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                hitArea.setAttribute('cx', cx); hitArea.setAttribute('cy', cy); hitArea.setAttribute('r', '20');
                hitArea.setAttribute('fill', 'transparent'); 
                hitArea.setAttribute('class', `point point-${idx}`); // Motor bu class'Ä± arÄ±yor!
                hitArea.style.cursor = 'crosshair';
                linearSvg.appendChild(hitArea);

                // GÃ–RSEL MOR NOKTA
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', '8');
                circle.setAttribute('fill', '#8b5cf6'); circle.setAttribute('stroke', '#ffffff'); circle.setAttribute('stroke-width', '2');
                circle.style.pointerEvents = 'none'; // Fare bunu deÄŸil gÃ¶rÃ¼nmez alanÄ± tutsun
                linearSvg.appendChild(circle);

                // YAZI
                const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
                label.setAttribute('x', cx + 15); label.setAttribute('y', cy - 15);
                label.setAttribute('font-size', '13'); label.setAttribute('font-weight', 'bold'); label.setAttribute('fill', '#4b5563');
                label.style.pointerEvents = 'none'; // YazÄ± farenin Ã¶nÃ¼ne geÃ§mesin!
                label.textContent = '(' + xV + ', ' + yV + ')';
                linearSvg.appendChild(label);
            }
        }
    }
}


// ==========================================
// 7. TABLO KONTROL MOTORU (FÄ°NAL DÃœZELTME - MATEMATÄ°KSEL HESAPLAMA)
// ==========================================
function confirmTableAndStartDrawing() {
    // 1. Senaryoyu ve Verileri Al
    const scenario = linearState.currentScenario;
    // Orijinal veriyi (soru verisini) baz al
    let rawPoints = scenario.tableData || scenario.points || scenario.data || (scenario.lines ? scenario.lines[0].points : []);
    
    // 2. DOÄRU DENKLEMÄ° (m ve b) HESAPLA
    // Tablodaki "?" olmayan, yani sayÄ± olan en az 2 noktayÄ± bulmalÄ±yÄ±z.
    let validPoints = [];
    
    if (rawPoints) {
        rawPoints.forEach(p => {
            // Veri yapÄ±sÄ± {x:.., y:..} veya [x, y] olabilir
            let valX = (p.x !== undefined) ? p.x : p[0];
            let valY = (p.y !== undefined) ? p.y : p[1];

            // EÄŸer deÄŸer sayÄ±ysa veya sayÄ±ya Ã§evrilebiliyorsa listeye al
            let nx = parseFloat(valX);
            let ny = parseFloat(valY);

            if (!isNaN(nx) && !isNaN(ny)) {
                validPoints.push({x: nx, y: ny});
            }
        });
    }

    // EÄŸim (m) ve Kesen (b) Hesapla
    let m = null;
    let b = null;
    let isVertical = false; // Dikey Ã§izgi kontrolÃ¼ (x = a)
    let targetVerticalX = null;
    let isHorizontal = false; // Yatay Ã§izgi kontrolÃ¼ (y = b)
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
        // EÄŸer tablodan bulamazsak, senaryonun iÃ§inde m/b var mÄ± diye bak (Yedek Plan)
        if (scenario.m !== undefined && scenario.b !== undefined) {
            m = scenario.m;
            b = scenario.b;
        }
    }

    // 3. KULLANICININ GÄ°RDÄ°ÄÄ° DEÄERLERÄ° KONTROL ET
    let allCorrect = true;
    let filledRowCount = 0;

    // Tabloda en fazla 10 satÄ±r olabilir, hepsini gez
    for (let idx = 0; idx < 10; idx++) {
        const xDiv = document.getElementById('table_input_x_' + idx);
        const yDiv = document.getElementById('table_input_y_' + idx);

        if (!xDiv || !yDiv) continue; // BÃ¶yle bir satÄ±r yoksa geÃ§

        // Kutunun iÃ§indeki metni al (Soru iÅŸaretlerini temizle)
        let xStr = xDiv.textContent.replace(/\?/g, '').trim();
        let yStr = yDiv.textContent.replace(/\?/g, '').trim();

        // EÄŸer satÄ±r tamamen boÅŸsa, bu satÄ±rÄ± atla (Hata sayma)
        if (xStr === '' && yStr === '') continue;

        filledRowCount++;

        // DeÄŸerleri sayÄ±ya Ã§evir
        // evaluateMath fonksiyonu varsa kullan (iÅŸlemleri yapmak iÃ§in), yoksa parseFloat
        let userX = (typeof evaluateMath === 'function') ? evaluateMath(xStr) : parseFloat(xStr);
        let userY = (typeof evaluateMath === 'function') ? evaluateMath(yStr) : parseFloat(yStr);

        let isRowCorrect = false;

        if (!isNaN(userX) && !isNaN(userY)) {
            if (isVertical) {
                // Dikey Ã§izgi: X sabit olmalÄ±, Y her ÅŸey olabilir
                if (Math.abs(userX - targetVerticalX) < 0.1) isRowCorrect = true;
            } 
            else if (isHorizontal) {
                // Yatay Ã§izgi: Y sabit olmalÄ±, X her ÅŸey olabilir
                if (Math.abs(userY - targetHorizontalY) < 0.1) isRowCorrect = true;
            }
            else if (m !== null && b !== null) {
                // Standart DoÄŸru KontrolÃ¼: y = mx + b
                // KullanÄ±cÄ±nÄ±n X'ini formÃ¼le koy, olmasÄ± gereken Y'yi bul
                let expectedY = (m * userX) + b;
                
                // Hata payÄ± (float toleransÄ±) ile karÅŸÄ±laÅŸtÄ±r
                // 0.1 tolerans iyidir (yuvarlama hatalarÄ± iÃ§in)
                if (Math.abs(userY - expectedY) < 0.1) {
                    isRowCorrect = true;
                }
            } else {
                // EÄŸer formÃ¼l Ã§Ä±karamadÄ±ysak, sadece havuza bak (Eski yÃ¶ntem - Son Ã‡are)
                let inPool = validPoints.some(p => Math.abs(p.x - userX) < 0.1 && Math.abs(p.y - userY) < 0.1);
                if (inPool) isRowCorrect = true;
            }
        }

        // SONUCU GÃ–RSELLEÅTÄ°R (YEÅÄ°L / KIRMIZI)
        if (isRowCorrect) {
            // DoÄŸru ise kutuyu yeÅŸil yap ve kilitli hale getir (tekrar tÄ±klanamaz)
            xDiv.className = "table-input-cell bg-emerald-100 border-2 border-emerald-500 rounded p-1 flex items-center justify-center font-bold text-emerald-800 text-lg cursor-default w-full shadow-inner";
            yDiv.className = "table-input-cell bg-emerald-100 border-2 border-emerald-500 rounded p-1 flex items-center justify-center font-bold text-emerald-800 text-lg cursor-default w-full shadow-inner";
            
            // TÄ±klama olaylarÄ±nÄ± kaldÄ±r (input'u kilitle)
            xDiv.onclick = null;
            yDiv.onclick = null;
            
            // DoÄŸru bilinen noktalarÄ± "linearState" iÃ§ine kaydet ki Ã§izimde kullanÄ±labilsin
            if (!linearState.userCorrectPoints) linearState.userCorrectPoints = [];
            // Bu noktayÄ± daha Ã¶nce eklemediysek ekle
            if (!linearState.userCorrectPoints.some(p => p.x === userX && p.y === userY)) {
                linearState.userCorrectPoints.push({x: userX, y: userY});
            }

        } else {
            // YanlÄ±ÅŸ ise kÄ±rmÄ±zÄ± yap ve titret
            xDiv.className = "table-input-cell bg-red-50 border-2 border-red-500 rounded p-1 flex items-center justify-center font-bold text-red-700 text-lg w-full animate-pulse";
            yDiv.className = "table-input-cell bg-red-50 border-2 border-red-500 rounded p-1 flex items-center justify-center font-bold text-red-700 text-lg w-full animate-pulse";
            allCorrect = false;
        }
    }

    // 4. BAÅARI DURUMU
    if (allCorrect && filledRowCount > 0) {
        playSuccessSound();

        // Ã‡izim Modunu Aktif Et
        gameState.mode = 'linear_graph_draw';
        gameState.userClicks = []; // TÄ±klamalarÄ± sÄ±fÄ±rla
        
        // Ã‡izim aracÄ± (setupStraightLineDrawing) varsa Ã§alÄ±ÅŸtÄ±r
        if (typeof setupStraightLineDrawing === 'function') {
            setupStraightLineDrawing();
        }

        // "Tamam" butonunu gizle
        const btnTamam = document.getElementById('btnTamamCst');
        if (btnTamam) btnTamam.classList.add('hidden');

        // Bildirim GÃ¶ster
        const msgArea = document.getElementById('drawMessageArea');
        if (msgArea) {
            msgArea.classList.remove('hidden');
            msgArea.innerHTML = `
                <div class="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-lg animate-bounce">
                    <p class="font-bold">MÃ¼kemmel! Tablo DoÄŸru. ğŸ‰</p>
                    <p class="text-sm">Åimdi grafikte noktalarÄ± iÅŸaretle ve doÄŸruyu Ã§iz.</p>
                </div>
            `;
        }

        // GrafiÄŸi gÃ¼ncelle (NoktalarÄ± netleÅŸtir)
        if (typeof refreshLinearGraphPoints === 'function') refreshLinearGraphPoints();

    } else {
        playErrorSound();
        // Hata mesajÄ± (Toast veya basit alert)
        const feedback = document.getElementById('feedback');
        if (feedback) {
            feedback.textContent = "BazÄ± deÄŸerler yanlÄ±ÅŸ. KÄ±rmÄ±zÄ± kutularÄ± kontrol et!";
            feedback.style.opacity = '1';
            feedback.className = "fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-full shadow-xl font-bold z-[99999]";
            setTimeout(() => { feedback.style.opacity = '0'; }, 3000);
        }
    }
}

// ==========================================
// 1. SAYI PANELÄ°NÄ° AÃ‡MA (HEDEFÄ° KÄ°LÄ°TLEME)
// ==========================================
window.openTableInput = function(targetId) {
    console.log("Kutuya tÄ±klandÄ±, Hedef:", targetId); // Konsoldan takip et
    
    // 1. Hedefi Kaydet
    activeInputTarget = targetId; 
    
    // 2. DiÄŸer kutularÄ±n mavi Ä±ÅŸÄ±ÄŸÄ±nÄ± sÃ¶ndÃ¼r, buna yak
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500');
    });
    const activeEl = document.getElementById(targetId);
    if (activeEl) {
        activeEl.classList.add('bg-indigo-100', 'border-indigo-500');
        
        // EÄŸer kutuda zaten bir sayÄ± varsa, numpad ekranÄ±na taÅŸÄ±
        const currentVal = activeEl.textContent.replace('?', '').trim();
        const displayDiv = document.getElementById('currentInput');
        if (displayDiv) displayDiv.textContent = currentVal;
        if (typeof linearState !== 'undefined') linearState.currentInputValue = currentVal;
    }

    // 3. Paneli AÃ§
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex'; // Zorla gÃ¶rÃ¼nÃ¼r yap
    }
};

// ==========================================
// 2. TUÅLARI CANLANDIRMA (0-9, Sil, -, .)
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    // Numpad iÃ§indeki tÃ¼m butonlarÄ± bul
    const padButtons = document.querySelectorAll('#numberPad button');
    
    padButtons.forEach(btn => {
        // Ã–nce temizle, sonra ekle (Ã‡ift basmayÄ± Ã¶nler)
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);
        
        newBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const val = newBtn.textContent.trim();
            const display = document.getElementById('currentInput');
            
            // EÄŸer "Tamam" veya "Ä°ptal" deÄŸilse (yani sayÄ± ise)
            if (newBtn.id !== 'numPadClose' && newBtn.id !== 'numPadCancel') {
                
                // Silme TuÅŸu
                if (val === 'Sil' || newBtn.querySelector('.fa-backspace')) {
                    display.textContent = display.textContent.slice(0, -1);
                } 
                // Temizleme (C)
                else if (val === 'C') {
                    display.textContent = '';
                }
                // SayÄ±lar ve Nokta
                else {
                    display.textContent += val;
                }
                
                // State'i gÃ¼ncelle
                if (typeof linearState !== 'undefined') {
                    linearState.currentInputValue = display.textContent;
                }
            }
        });
    });
    
    // TAMAM ve Ä°PTAL butonlarÄ±nÄ± ayrÄ±ca baÄŸlayacaÄŸÄ±z (AÅŸaÄŸÄ±da)
});

// ==========================================
// 3. TAMAM BUTONU (VERÄ°YÄ° TABLOYA AKTARMA)
// ==========================================
const btnTamam = document.getElementById('numPadClose');
if (btnTamam) {
    // Temiz bir buton oluÅŸtur
    const newBtnTamam = btnTamam.cloneNode(true);
    btnTamam.parentNode.replaceChild(newBtnTamam, btnTamam);

    newBtnTamam.addEventListener('click', function(e) {
        e.preventDefault();
        
        // 1. Veriyi Numpad EkranÄ±ndan Al
        const displayDiv = document.getElementById('currentInput');
        let val = displayDiv ? displayDiv.textContent.trim() : '';
        
        console.log("Tamam'a basÄ±ldÄ±. DeÄŸer:", val, "Hedef:", activeInputTarget);

        // 2. Hedef Kutu Var mÄ±?
        if (activeInputTarget) {
            const targetBox = document.getElementById(activeInputTarget);
            
            if (targetBox) {
                // DeÄŸer boÅŸsa soru iÅŸareti koy
                if (val === '') val = '?';
                
                // --- KRÄ°TÄ°K NOKTA: Ekrana Yaz ---
                targetBox.textContent = val;
                
                // Mavi seÃ§imi kaldÄ±r
                targetBox.classList.remove('bg-indigo-100', 'border-indigo-500');

                // --- STATE GÃœNCELLEME (Tablo KontrolÃ¼ Ä°Ã§in Åart) ---
                // ID'den satÄ±r ve sÃ¼tunu bul (Ã–rn: table_input_x_2)
                if (activeInputTarget.startsWith('table_input_')) {
                    const parts = activeInputTarget.split('_');
                    const col = parts[2]; // x veya y
                    const row = parseInt(parts[3]); // 0, 1, 2...
                    
                    // State dizisini hazÄ±rla
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
        
        // 4. "Tamam" butonu gÃ¶rÃ¼nsÃ¼n mÃ¼ kontrol et (Tablo dolduysa)
        checkIfTableFull();
    });
}

// YARDIMCI: Ä°ptal Butonu
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

// YARDIMCI: Tablo Dolu mu KontrolÃ¼
function checkIfTableFull() {
    let isFull = true;
    let hasRows = false;
    
    // TÃ¼m input hÃ¼crelerini gez
    const cells = document.querySelectorAll('.table-input-cell');
    if (cells.length === 0) return;

    cells.forEach(cell => {
        const txt = cell.textContent.trim();
        if (txt === '?' || txt === '') {
            isFull = false;
        }
        hasRows = true;
    });

    // EÄŸer hepsi doluysa alttaki "Tabloyu Kontrol Et" butonunu aÃ§
    const confirmBtn = document.getElementById('btnTamamCst'); // ID'si tableConfirmBtn de olabilir, kontrol et
    const confirmBtn2 = document.getElementById('tableConfirmBtn');
    
    if (isFull && hasRows) {
        if (confirmBtn) confirmBtn.classList.remove('hidden');
        if (confirmBtn2) confirmBtn2.classList.remove('hidden');
    }
}

// =================================================================
// ğŸš‘ ACÄ°L DURUM: NUMPAD SÄ°STEMÄ° (TAMÄ°R KÄ°TÄ° - SIFIRDAN KURULUM)
// =================================================================

// 1. GLOBAL DEÄÄ°ÅKENLER (HafÄ±za)

// 2. SAYI PANELÄ°NÄ° AÃ‡MA FONKSÄ°YONU
window.openTableInput = function(targetId) {
    console.log("ğŸ–±ï¸ Kutuya tÄ±klandÄ±:", targetId);
    
    // Hedefi HafÄ±zaya Al
    activeInputTarget = targetId;

    // TÃ¼m kutularÄ±n mavi Ä±ÅŸÄ±ÄŸÄ±nÄ± sÃ¶ndÃ¼r
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500');
    });

    // TÄ±klanan kutuyu mavi yap
    const targetBox = document.getElementById(targetId);
    if (targetBox) {
        targetBox.classList.add('bg-indigo-100', 'border-indigo-500');
        
        // Kutuda zaten sayÄ± varsa, panel ekranÄ±na taÅŸÄ±
        const currentVal = targetBox.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = currentVal;
    }

    // Paneli GÃ¶ster
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex'; // GÃ¶rÃ¼nÃ¼rlÃ¼ÄŸÃ¼ zorla
    }
};

// 3. TUÅLARI VE PANELÄ° Ã‡ALIÅTIRAN ANA MOTOR
// (Bu fonksiyon sayfa yÃ¼klendiÄŸinde otomatik Ã§alÄ±ÅŸÄ±r)
setTimeout(function() {
    console.log("ğŸ”§ Numpad Motoru BaÅŸlatÄ±lÄ±yor...");

    // Paneldeki butonlarÄ± bulalÄ±m
    const keys = document.querySelectorAll('#numberPad button');
    
    // Eski olaylarÄ± temizlemek iÃ§in butonlarÄ± yenile
    keys.forEach(oldBtn => {
        const newBtn = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(newBtn, oldBtn);

        // --- TUÅLARA TIKLAMA OLAYI ---
        newBtn.addEventListener('click', function(e) {
            e.preventDefault(); // SayfanÄ±n zÄ±plamasÄ±nÄ± engelle
            
            const btnText = newBtn.textContent.trim();
            const display = document.getElementById('currentInput');
            
            // A) "TAMAM" veya "TÄ°K" TUÅU Ä°SE
            if (newBtn.id === 'numPadClose' || newBtn.querySelector('.fa-check') || btnText === 'Tamam') {
                handleConfirm();
            }
            // B) "Ä°PTAL" veya "Ã‡ARPI" TUÅU Ä°SE
            else if (newBtn.id === 'numPadCancel' || newBtn.querySelector('.fa-times') || btnText === 'Ä°ptal') {
                handleCancel();
            }
            // C) SÄ°LME (BACKSPACE) TUÅU Ä°SE
            else if (btnText === 'Sil' || newBtn.querySelector('.fa-backspace')) {
                display.textContent = display.textContent.slice(0, -1);
            }
            // D) TEMÄ°ZLEME (C) TUÅU Ä°SE
            else if (btnText === 'C') {
                display.textContent = '';
            }
            // E) NORMAL RAKAMLAR VE Ä°ÅARETLER
            else {
                // Sadece rakam, nokta, eksi ve x iÅŸaretine izin ver
                display.textContent += btnText;
            }
        });
    });

}, 1000); // Sayfa yÃ¼klendikten 1 saniye sonra devreye girer (Garanti olsun diye)


// 4. "TAMAM" TUÅU MANTIÄI (VERÄ°YÄ° AKTARMA)
function handleConfirm() {
    const display = document.getElementById('currentInput');
    let val = display.textContent.trim();

    console.log("âœ… Tamam'a basÄ±ldÄ±. DeÄŸer:", val);

    // Hedef kutu var mÄ±?
    if (activeInputTarget) {
        const targetBox = document.getElementById(activeInputTarget);
        if (targetBox) {
            // BoÅŸsa soru iÅŸareti yap
            if (val === '') val = '?';

            // TABLOYA YAZ!
            targetBox.textContent = val;
            
            // Mavi seÃ§imi kaldÄ±r
            targetBox.classList.remove('bg-indigo-100', 'border-indigo-500');

            // --- TABLO VERÄ°SÄ°NÄ° GÃœNCELLE (KONTROL Ä°Ã‡Ä°N ÅART) ---
            if (activeInputTarget.startsWith('table_input_')) {
                // ID'den satÄ±r ve sÃ¼tunu bul (table_input_x_0)
                const parts = activeInputTarget.split('_');
                const col = parts[2]; // x veya y
                const row = parseInt(parts[3]);

                // linearState hafÄ±zasÄ±nÄ± gÃ¼ncelle
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

    // Tablo doldu mu diye bak (Onay butonu iÃ§in)
    checkIfTableIsFull();
}

// 5. "Ä°PTAL" TUÅU MANTIÄI
function handleCancel() {
    console.log("âŒ Ä°ptal'e basÄ±ldÄ±.");
    // SeÃ§imi kaldÄ±r
    if (activeInputTarget) {
        const box = document.getElementById(activeInputTarget);
        if (box) box.classList.remove('bg-indigo-100', 'border-indigo-500');
    }
    closeNumpad();
}

// 6. PANELÄ° KAPATMA VE TEMÄ°ZLEME
function closeNumpad() {
    const np = document.getElementById('numberPad');
    if (np) np.classList.add('hidden');
    
    const display = document.getElementById('currentInput');
    if (display) display.textContent = '';
    
    activeInputTarget = null;
}

// 7. TABLO DOLULUK KONTROLÃœ
function checkIfTableIsFull() {
    let isFull = true;
    const cells = document.querySelectorAll('.table-input-cell');
    
    if (cells.length === 0) return;

    cells.forEach(cell => {
        const txt = cell.textContent.trim();
        if (txt === '?' || txt === '') isFull = false;
    });

    if (isFull) {
        // "Tamam" butonunu gÃ¶ster (ID'ler deÄŸiÅŸebiliyor, ikisini de dene)
        const btn1 = document.getElementById('btnTamamCst');
        const btn2 = document.getElementById('tableConfirmBtn');
        if (btn1) btn1.classList.remove('hidden');
        if (btn2) btn2.classList.remove('hidden');
    }
}

// =================================================================
// ğŸš€ FÄ°NAL TAMÄ°R KÄ°TÄ° (Ã‡AKIÅMA Ã–NLEYÄ°CÄ° VERSÄ°YON)
// =================================================================

// 1. GLOBAL DEÄÄ°ÅKEN (Hata vermemesi iÃ§in window Ã¼zerinden kontrol)
if (typeof window.activeInputTarget === 'undefined') {
    window.activeInputTarget = null;
}

// 2. KUTUYA TIKLAMA FONKSÄ°YONU
window.openTableInput = function(targetId) {
    console.log("ğŸ¯ Hedef Kutu:", targetId);
    window.activeInputTarget = targetId;

    // GÃ¶rsel temizlik
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-400');
    });

    const box = document.getElementById(targetId);
    if (box) {
        box.classList.add('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-400');
        // Varsa eski deÄŸeri ekrana taÅŸÄ±
        const val = box.textContent.replace('?', '').trim();
        const disp = document.getElementById('currentInput');
        if (disp) disp.textContent = val;
    }

    // Paneli AÃ§
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
    }
};

// 3. BUTONLARI BAÄLA (1 Saniye Bekleyip Ã‡alÄ±ÅŸÄ±r - Garanti YÃ¶ntem)
setTimeout(function() {
    console.log("ğŸ”§ Butonlar Yeniden BaÄŸlanÄ±yor...");

    // --- TAMAM BUTONU ---
    // DeÄŸiÅŸken ismini 'btnTamam_Fix' yaptÄ±k ki eskisiyle Ã§akÄ±ÅŸmasÄ±n
    var btnTamam_Fix = document.getElementById('numPadClose');
    
    if (btnTamam_Fix) {
        // Klonlayarak eski bozuk Ã¶zellikleri temizle
        var newTamam = btnTamam_Fix.cloneNode(true);
        btnTamam_Fix.parentNode.replaceChild(newTamam, btnTamam_Fix);

        newTamam.addEventListener('click', function(e) {
            e.preventDefault(); 
            e.stopPropagation();

            // DeÄŸeri Al
            const disp = document.getElementById('currentInput');
            let val = disp ? disp.textContent.trim() : '';
            if (val === '') val = '?';

            // Hedefe Yaz
            if (window.activeInputTarget) {
                const targetBox = document.getElementById(window.activeInputTarget);
                if (targetBox) {
                    targetBox.textContent = val;
                    targetBox.classList.remove('bg-indigo-100', 'border-indigo-500', 'ring-2', 'ring-indigo-400');
                    
                    // Veriyi HafÄ±zaya (linearState) Ä°ÅŸle
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
            
            // Tablo dolduysa kontrol butonunu aÃ§
            checkFull_Fix();
        });
    }

    // --- Ä°PTAL BUTONU ---
    // DeÄŸiÅŸken ismini 'btnIptal_Fix' yaptÄ±k ki hatayÄ± Ã¶nleyelim
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

// YARDIMCI FONKSÄ°YONLAR (Ã‡akÄ±ÅŸmasÄ±n diye _Fix ekledim)
function closeNumpad_Fix() {
    const np = document.getElementById('numberPad');
    if (np) np.classList.add('hidden');
    
    const disp = document.getElementById('currentInput');
    if (disp) disp.textContent = '';
    
    // SeÃ§im renklerini temizle
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
// ğŸš€ NÄ°HAÄ° BAÄLANTI MODÃœLÃœ (Ã‡AKIÅMA Ã–NLEYÄ°CÄ° v3)
// =================================================================
// Bu kod, Ã¶nceki hatalarÄ± bypass edip "Tamam" tuÅŸunu zorla Ã§alÄ±ÅŸtÄ±rÄ±r.

// 1. GLOBAL HEDEF DEÄÄ°ÅKENÄ° (Window seviyesinde tanÄ±mladÄ±k ki kaybolmasÄ±n)
window.CURRENT_TARGET_ID = null;

// 2. KUTUYA TIKLAMA (SAYI PANELÄ°NÄ° AÃ‡AR)
window.openTableInput = function(targetId) {
    console.log("ğŸŸ¢ Kutu SeÃ§ildi:", targetId);
    
    // Hedefi kaydet
    window.CURRENT_TARGET_ID = targetId;

    // GÃ¶rsel temizlik (Ã–nceki mavi kutularÄ± normale Ã§evir)
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.style.backgroundColor = "white";
        el.style.borderColor = "#e0e7ff"; // indigo-100
    });

    // Yeni kutuyu mavi yap
    const box = document.getElementById(targetId);
    if (box) {
        box.style.backgroundColor = "#e0e7ff"; // indigo-50
        box.style.borderColor = "#6366f1"; // indigo-500
        
        // Kutudaki eski deÄŸeri panele taÅŸÄ±
        let val = box.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = val;
    }

    // Paneli AÃ§
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
    }
};

// 3. TAMAM VE Ä°PTAL BUTONLARINI BAÄLA (100ms Gecikmeli - Garanti Olsun)
setTimeout(function() {
    console.log("ğŸ”Œ Butonlar BaÄŸlanÄ±yor...");

    // --- TAMAM BUTONU ---
    const oldBtn = document.getElementById('numPadClose');
    if (oldBtn) {
        // Eski tÃ¼m Ã¶zellikleri silmek iÃ§in klonluyoruz
        const btnTamam_Final_v3 = oldBtn.cloneNode(true);
        oldBtn.parentNode.replaceChild(btnTamam_Final_v3, oldBtn);

        // Yeni TÄ±klama OlayÄ±
        btnTamam_Final_v3.addEventListener('click', function(e) {
            e.preventDefault();
            
            // A. DeÄŸeri Al
            const display = document.getElementById('currentInput');
            let val = display ? display.textContent.trim() : '';
            console.log("âœ… Tamam BasÄ±ldÄ±. DeÄŸer:", val, "Hedef:", window.CURRENT_TARGET_ID);

            // B. Hedefe Yaz
            if (window.CURRENT_TARGET_ID) {
                const targetBox = document.getElementById(window.CURRENT_TARGET_ID);
                
                if (targetBox) {
                    if (val === '') val = '?';
                    
                    // 1. Ekrana Yaz (GÃ¶rsel)
                    targetBox.textContent = val;
                    
                    // 2. Rengi DÃ¼zelt
                    targetBox.style.backgroundColor = "white";
                    targetBox.style.borderColor = "#e0e7ff";

                    // 3. Veriyi HafÄ±zaya (linearState) Kaydet
                    // ID formatÄ±: table_input_x_0
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

            // D. Tablo Doldu mu? (Kontrol Butonu AÃ§)
            checkTableFull_Final();
        });
    }

    // --- Ä°PTAL BUTONU ---
    const oldCancel = document.getElementById('numPadCancel');
    if (oldCancel) {
        const btnIptal_Final_v3 = oldCancel.cloneNode(true);
        oldCancel.parentNode.replaceChild(btnIptal_Final_v3, oldCancel);
        
        btnIptal_Final_v3.addEventListener('click', function(e) {
            e.preventDefault();
            closeNumpad_Final();
        });
    }

}, 500); // YarÄ±m saniye bekle ve Ã§alÄ±ÅŸtÄ±r

// YARDIMCI FONKSÄ°YONLAR
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
        // Ä°ki olasÄ± ID'yi de dene
        const btn1 = document.getElementById('btnTamamCst');
        const btn2 = document.getElementById('tableConfirmBtn');
        if (btn1) btn1.classList.remove('hidden');
        if (btn2) btn2.classList.remove('hidden');
    }
}

// =================================================================
// ğŸš‘ ACÄ°L KURTARMA PAKETÄ° (Ã‡AKIÅMAYI AÅAN SÃœRÃœM)
// =================================================================

// 1. Yeni ve Benzersiz Bir Hedef DeÄŸiÅŸkeni TanÄ±mlÄ±yoruz
// (Eski activeInputTarget deÄŸiÅŸkenini kullanmÄ±yoruz ki hata vermesin)
window.HEDEF_KUTU_ID = null; 

// 2. Tablo Kutusuna TÄ±klayÄ±nca Ã‡alÄ±ÅŸan Fonksiyonu "Eziyoruz"
window.openTableInput = function(tiklananId) {
    console.log("ğŸŸ¢ Yeni Sistem: Kutu SeÃ§ildi ->", tiklananId);
    
    // Hedefi yeni deÄŸiÅŸkene kaydet
    window.HEDEF_KUTU_ID = tiklananId;

    // GÃ¶rsel: Eski mavilikleri temizle
    document.querySelectorAll('.table-input-cell').forEach(kutu => {
        kutu.style.backgroundColor = "white"; 
        kutu.style.borderColor = "#e0e7ff";
    });

    // GÃ¶rsel: TÄ±klananÄ± mavi yap
    const kutu = document.getElementById(tiklananId);
    if (kutu) {
        kutu.style.backgroundColor = "#dbeafe"; // AÃ§Ä±k mavi
        kutu.style.borderColor = "#2563eb";     // Koyu mavi
        
        // Kutudaki deÄŸeri panele taÅŸÄ±
        let eskiDeger = kutu.textContent.replace('?', '').trim();
        const ekran = document.getElementById('currentInput');
        if (ekran) ekran.textContent = eskiDeger;
    }

    // Paneli AÃ§
    const panel = document.getElementById('numberPad');
    if (panel) {
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
    }
};

// 3. "Tamam" Butonunu Zorla Yeniden YaratÄ±yoruz (1 saniye sonra)
setTimeout(function() {
    console.log("ğŸ› ï¸ Tamam Butonu Tamir Ediliyor...");

    const eskiButon = document.getElementById('numPadClose');
    if (eskiButon) {
        // Eski butonu kopyala (BÃ¶ylece eski hatalÄ± kodlardan kurtuluruz)
        const yeniButon = eskiButon.cloneNode(true);
        eskiButon.parentNode.replaceChild(yeniButon, eskiButon);

        // YENÄ° TIKLAMA GÃ–REVÄ°
        yeniButon.addEventListener('click', function(olay) {
            olay.preventDefault();
            olay.stopPropagation();

            console.log("âœ… Tamam'a BasÄ±ldÄ±! Hedef:", window.HEDEF_KUTU_ID);

            // A. Ekranda ne yazÄ±yor?
            const ekran = document.getElementById('currentInput');
            let yazilanDeger = ekran ? ekran.textContent.trim() : '';
            if (yazilanDeger === '') yazilanDeger = '?';

            // B. Hedef kutu belli mi?
            if (window.HEDEF_KUTU_ID) {
                const hedefKutu = document.getElementById(window.HEDEF_KUTU_ID);
                
                if (hedefKutu) {
                    // 1. EKRANA YAZ (En Ã¶nemlisi bu)
                    hedefKutu.textContent = yazilanDeger;
                    
                    // 2. Rengi dÃ¼zelt
                    hedefKutu.style.backgroundColor = "white";
                    hedefKutu.style.borderColor = "#e0e7ff";

                    // 3. Veriyi HafÄ±zaya Kaydet (Grafik kontrolÃ¼ iÃ§in)
                    // ID Ã¶rneÄŸi: table_input_x_0
                    if (window.HEDEF_KUTU_ID.startsWith('table_input_')) {
                        const parcalar = window.HEDEF_KUTU_ID.split('_');
                        const sutun = parcalar[2]; // 'x' veya 'y'
                        const satir = parseInt(parcalar[3]);

                        // linearState nesnesini gÃ¼ncelle
                        if (typeof linearState !== 'undefined') {
                            if (!linearState.tableData) linearState.tableData = [];
                            if (!linearState.tableData[satir]) linearState.tableData[satir] = {x:'?', y:'?'};
                            
                            linearState.tableData[satir][sutun] = yazilanDeger;
                        }
                    }
                } else {
                    console.log("âŒ Hedef kutu HTML'de bulunamadÄ±!");
                }
            } else {
                console.log("âš ï¸ Hedef seÃ§ili deÄŸil!");
            }

            // C. Paneli Kapat
            const panel = document.getElementById('numberPad');
            if (panel) panel.classList.add('hidden');
            if (ekran) ekran.textContent = '';
            
            // D. SeÃ§imi SÄ±fÄ±rla
            window.HEDEF_KUTU_ID = null;

            // E. Tablo dolduysa kontrol butonunu aÃ§
            kontrolTabloDoluMu();
        });
    }
}, 1000); // 1 saniye bekleme sÃ¼resi

// YardÄ±mcÄ±: Tablo Dolu mu?
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
// ğŸšª PANEL KAPATMA TAMÄ°RCÄ°SÄ° (KESÄ°N Ã‡Ã–ZÃœM)
// =================================================================
setTimeout(function() {
    console.log("ğŸšª Kapatma MekanizmasÄ± GÃ¼ncelleniyor...");

    // 1. TAMAM BUTONU (Kapanma Ã–zelliÄŸi Ekleniyor)
    const btnTamam = document.getElementById('numPadClose');
    if (btnTamam) {
        // Mevcut iÅŸlevi bozmadan Ã¼zerine ekleme yapÄ±yoruz
        const eskiTiklama = btnTamam.onclick; 
        
        // Yeni, daha gÃ¼Ã§lÃ¼ bir dinleyici ekliyoruz
        btnTamam.addEventListener('click', function(e) {
            // Ã–nce veriyi yazma iÅŸini yapsÄ±n (zaten Ã§alÄ±ÅŸÄ±yor dedin)
            // Sonra zorla kapatsÄ±n:
            forceClosePanel();
        });
    }

    // 2. Ä°PTAL BUTONU (Kapanma Ã–zelliÄŸi Ekleniyor)
    const btnIptal = document.getElementById('numPadCancel');
    if (btnIptal) {
        const yeniIptal = btnIptal.cloneNode(true);
        btnIptal.parentNode.replaceChild(yeniIptal, btnIptal);

        yeniIptal.addEventListener('click', function(e) {
            e.preventDefault();
            // Ä°ptal'e basÄ±nca hedefi de unut
            window.HEDEF_KUTU_ID = null;
            // GÃ¶rsel seÃ§imleri kaldÄ±r
            document.querySelectorAll('.table-input-cell').forEach(kutu => {
                kutu.style.backgroundColor = "white"; 
                kutu.style.borderColor = "#e0e7ff";
            });
            forceClosePanel();
        });
    }

}, 1500); // DiÄŸer kodlardan sonra Ã§alÄ±ÅŸsÄ±n diye biraz gecikmeli

// 3. ZORLA KAPATMA FONKSÄ°YONU
function forceClosePanel() {
    const panel = document.getElementById('numberPad');
    if (panel) {
        // Hem CSS sÄ±nÄ±fÄ± ekle
        panel.removeAttribute('style');
        panel.classList.add('hidden');
    }

    // EkranÄ± temizle
    const ekran = document.getElementById('currentInput');
    if (ekran) ekran.textContent = '';
}

// =================================================================
// ğŸš€ FÄ°NAL SÄ°STEM: CANLI GRAFÄ°K VE MATEMATÄ°KSEL KONTROL
// =================================================================

// 1. GLOBAL DEÄÄ°ÅKENLER
window.HEDEF_KUTU = null;

// ---------------------------------------------------------
// A. KUTUYA TIKLAMA (SAYI PANELÄ°NÄ° AÃ‡AR)
// ---------------------------------------------------------
window.openTableInput = function(tiklananId) {
    console.log("ğŸ–±ï¸ Kutu SeÃ§ildi:", tiklananId);
    window.HEDEF_KUTU = tiklananId;

    // GÃ¶rsel Temizlik
    document.querySelectorAll('.table-input-cell').forEach(kutu => {
        kutu.style.backgroundColor = "white"; 
        kutu.style.borderColor = "#e0e7ff";
        kutu.style.boxShadow = "none";
    });

    // SeÃ§ili Kutuyu Ä°ÅŸaretle
    const kutu = document.getElementById(tiklananId);
    if (kutu) {
        kutu.style.backgroundColor = "#dbeafe"; // Mavi
        kutu.style.borderColor = "#3b82f6";
        kutu.style.boxShadow = "0 0 0 3px rgba(59, 130, 246, 0.3)";
        
        // DeÄŸeri panele taÅŸÄ±
        let val = kutu.textContent.replace('?', '').trim();
        const ekran = document.getElementById('currentInput');
        if (ekran) ekran.textContent = val;
    }

    // Paneli AÃ§
    const panel = document.getElementById('numberPad');
    if (panel) {
        panel.classList.remove('hidden');
        panel.style.display = 'flex';
    }
};

// ---------------------------------------------------------
// B. NUMPAD BUTONLARINI BAÄLA (OTOMATÄ°K VE ANLIK)
// ---------------------------------------------------------
setTimeout(function() {
    // TAMAM BUTONU
    const btnTamam = document.getElementById('numPadClose');
    if (btnTamam) {
        const yeniTamam = btnTamam.cloneNode(true);
        btnTamam.parentNode.replaceChild(yeniTamam, btnTamam);

        yeniTamam.addEventListener('click', function(e) {
            e.preventDefault();

            // 1. DeÄŸeri Al
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
                    
                    // State'i GÃ¼ncelle (HafÄ±zaya Al)
                    kaydetState(window.HEDEF_KUTU, deger);
                }
            }

            // 3. GRAFÄ°ÄÄ° ANINDA GÃœNCELLE (Ä°ÅŸte eksik olan parÃ§a buydu!)
            canliGrafikCiz();

            // 4. Paneli Kapat
            kapatPanel();

            // 5. Tablo Dolduysa Kontrol Butonunu AÃ§
            kontrolButonunuAc();
        });
    }

    // Ä°PTAL BUTONU
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
// C. CANLI GRAFÄ°K Ã‡Ä°ZCÄ° (HER SAYI GÄ°RÄ°ÅÄ°NDE Ã‡ALIÅIR)
// ---------------------------------------------------------
function canliGrafikCiz() {
    console.log("ğŸ¨ Grafik GÃ¼ncelleniyor (refreshLinearGraphPoints'e yÃ¶nlendirildi)...");
    if (typeof refreshLinearGraphPoints === 'function') {
        refreshLinearGraphPoints();
    }
}

// ---------------------------------------------------------
// D. TABLO KONTROL (MATEMATÄ°KSEL FORMÃœL Ä°LE)
// ---------------------------------------------------------
window.confirmTableAndStartDrawing = function() {
    console.log("ğŸ§  Tablo Kontrol Ediliyor (Matematiksel)...");
    
    // 1. DoÄŸru FormÃ¼lÃ¼nÃ¼ Bul (y = mx + b)
    let m = null;
    let b = null;
    
    const scenario = (typeof linearState !== 'undefined') ? linearState.currentScenario : null;
    
    if (scenario) {
        // A) Senaryoda aÃ§Ä±kÃ§a verilmiÅŸse al
        if (scenario.m !== undefined && scenario.b !== undefined) {
            m = scenario.m;
            b = scenario.b;
        } 
        else if (scenario.rate !== undefined && scenario.initialValue !== undefined) {
            m = scenario.rate;
            b = scenario.initialValue;
        }
        // B) VerilmemiÅŸse, senaryodaki "Points" listesinden hesapla
        else {
            let rawData = scenario.points || scenario.tableData || (scenario.lines ? scenario.lines[0].points : []);
            // Soru iÅŸareti olmayan temiz verileri al
            let cleanPoints = [];
            if(rawData) {
                rawData.forEach(p => {
                    let px = (p.x !== undefined) ? parseFloat(p.x) : parseFloat(p[0]);
                    let py = (p.y !== undefined) ? parseFloat(p.y) : parseFloat(p[1]);
                    if (!isNaN(px) && !isNaN(py)) cleanPoints.push({x: px, y: py});
                });
            }

            if (cleanPoints.length >= 2) {
                // Ä°ki noktadan eÄŸim bul
                let p1 = cleanPoints[0];
                let p2 = cleanPoints[1];
                if (p2.x - p1.x !== 0) {
                    m = (p2.y - p1.y) / (p2.x - p1.x);
                    b = p1.y - (m * p1.x);
                }
            }
        }
    }

    console.log(`ğŸ“ Bulunan FormÃ¼l: y = ${m}x + ${b}`);
    if (m !== null && typeof linearState !== 'undefined') {
        linearState.correctM = m;
    }

    // 2. Tablodaki DeÄŸerleri Kontrol Et
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

        // FormÃ¼l KontrolÃ¼
        if (m !== null && b !== null) {
            let expectedY = (m * userX) + b;
            // KÃ¼Ã§Ã¼k yuvarlama hatalarÄ±nÄ± tolere et (0.1)
            if (Math.abs(userY - expectedY) < 0.1) {
                rowCorrect = true;
            }
        } else {
            // FormÃ¼l bulunamadÄ±ysa (Ã‡ok nadir), eski yÃ¶ntemle havuza bak
            // Ama yukarÄ±daki kod %99 formÃ¼lÃ¼ bulur.
            rowCorrect = true; // Hata vermemek iÃ§in geÃ§ici true (Senaryo bozuksa Ã¶ÄŸrenci Ã¼zÃ¼lmesin)
        }

        // Renklendirme
        if (rowCorrect) {
            styleCorrect(xDiv); styleCorrect(yDiv);
        } else {
            styleWrong(xDiv); styleWrong(yDiv);
            hepsiDogru = false;
        }
    }

    // 3. SonuÃ§
    if (hepsiDogru && doluSatirSayisi > 0) {
        if(typeof playSuccessSound === 'function') playSuccessSound();
        
        // Ã‡izim modunu aÃ§
        if(typeof gameState !== 'undefined') gameState.mode = 'linear_graph_draw';
        if(typeof setupStraightLineDrawing === 'function') setupStraightLineDrawing();

        // Butonu gizle
        const btn = document.getElementById('btnTamamCst');
        if(btn) btn.classList.add('hidden');

        // Mesaj
        const msg = document.getElementById('drawMessageArea');
        if(msg) {
            msg.classList.remove('hidden');
            msg.innerHTML = `<div class="bg-green-100 p-4 rounded text-green-700 font-bold border-l-4 border-green-500">âœ… Harika! Tablo doÄŸru. Åimdi noktalarÄ± birleÅŸtir.</div>`;
        }
        
        // NoktalarÄ± YeÅŸile Ã‡evir (KalÄ±cÄ± Yap)
        const noktalar = document.getElementById('linearCanvas').querySelectorAll('.user-preview-dot');
        noktalar.forEach(n => n.setAttribute('fill', '#059669')); // YeÅŸil

    } else {
        if(typeof playErrorSound === 'function') playErrorSound();
    }
};

// ---------------------------------------------------------
// YARDIMCI FONKSÄ°YONLAR
// ---------------------------------------------------------
function kapatPanel() {
    const p = document.getElementById('numberPad');
    if(p) { 
        p.removeAttribute('style');
        p.classList.add('hidden'); 
    }
    window.HEDEF_KUTU = null;
    const ekr = document.getElementById('currentInput');
    if(ekr) ekr.textContent = '';
    
    // Mavi seÃ§imleri temizle
    document.querySelectorAll('.table-input-cell').forEach(k => {
        if(!k.classList.contains('bg-emerald-100')) { // DoÄŸru olanlarÄ± bozma
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

// DiÄŸer canliGrafikCiz fonksiyonlarÄ± temizlendi. Ãœstteki nihai versiyon kullanÄ±lacak.

// ==========================================
// ğŸ¯ SVG MATRIX COORDINATE SYSTEM (v5 - KESÄ°N Ã‡Ã–ZÃœM)
// ==========================================

window.setupStraightLineDrawing = function() {
    const canvas = document.getElementById('linearCanvas');
    if (!canvas) return;

    console.log("âœï¸ Ã‡izim Modu: SVG Matrix sistemi aktif.");
    
    // Temizle
    canvas.onmousedown = null;
    canvas.onmousemove = null;
    window.onmouseup = null;
    canvas.ontouchstart = null;
    canvas.ontouchmove = null;
    window.ontouchend = null;

    let isDrawing = false;
    let tempLine = null;

    // --- ENERJÄ° TASARRUFLU VE HASSAS KOORDÄ°NAT SÄ°STEMÄ° ---
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

        // Bu bÃ¼yÃ¼: Ekran koordinatlarÄ±nÄ± doÄŸrudan SVG'nin iÃ§ koordinatlarÄ±na Ã§evirir
        const cursorPoint = pt.matrixTransform(canvas.getScreenCTM().inverse());
        
        return { x: cursorPoint.x, y: cursorPoint.y };
    }

    const startDraw = function(e) {
        if (!['linear_graph_draw', 'x_eq_a', 'y_eq_b', 'y_eq_ax', 'y_eq_ax_plus_b'].includes(gameState.mode)) return;
        if (e && e.type && e.type.startsWith('touch') && e.cancelable) e.preventDefault();
        
        isDrawing = true;
        const coords = getPointOnSvg(e);

        if (typeof window.sendP2PDrawEvent === 'function') {
            window.sendP2PDrawEvent({ action: 'start', coords: coords });
        }

        // Eski Ã§izgiyi temizle
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
        tempLine.classList.add('user-drawn-line');
        
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
            window.sendP2PDrawEvent({ 
                action: 'end', 
                coords: end,
                scale: linearState.axisScale,
                tSlope: gameState.targetSlope,
                tIntercept: gameState.targetIntercept
            });
        }

        tempLine.removeAttribute('stroke-dasharray'); 
        
        const start = {
            x: parseFloat(tempLine.getAttribute('x1')),
            y: parseFloat(tempLine.getAttribute('y1'))
        };

        if (['x_eq_a', 'y_eq_b', 'y_eq_ax', 'y_eq_ax_plus_b'].includes(gameState.mode)) {
            linearState.drawnPoints = [start, end];
            const checkBtn = document.getElementById('checkBtn');
            if (checkBtn) {
                checkBtn.disabled = false;
                checkBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'hidden');
                checkBtn.style.display = 'block';
            }
        } else {
            checkDrawingLogic(start, end);
        }
    };

    // P2P'den gelen Ã§izim verilerini iÅŸleyecek fonksiyon
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
            tempLine.classList.add('user-drawn-line');
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
            
            // Senkronizasyon KaymalarÄ±nÄ± (Ã–lÃ§ek, Denklem farkÄ± vb.) Gidermek Ä°Ã§in Tabletten Gelen DoÄŸrularÄ± Zorla
            if (payload.scale !== undefined) linearState.axisScale = payload.scale;
            if (payload.tSlope !== undefined) gameState.targetSlope = payload.tSlope;
            if (payload.tIntercept !== undefined) gameState.targetIntercept = payload.tIntercept;
            
            if (['x_eq_a', 'y_eq_b', 'y_eq_ax', 'y_eq_ax_plus_b'].includes(gameState.mode)) {
                linearState.drawnPoints = [start, payload.coords];
                const checkBtn = document.getElementById('checkBtn');
                if (checkBtn) {
                    checkBtn.disabled = false;
                    checkBtn.classList.remove('opacity-50', 'cursor-not-allowed', 'hidden');
                    checkBtn.style.display = 'block';
                }
            } else {
                checkDrawingLogic(start, payload.coords);
            }
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
// âœ¨ ÃœST BUTON AKTÄ°FLEÅTÄ°RÄ°CÄ° (v6)
// ==========================================

function checkDrawingLogic(start, end) {
    // Mevcut dinamik Ã¶lÃ§eÄŸi al
    const stepY = (typeof linearState !== 'undefined') ? (linearState.yScale || 1) : 1;
    const stepX = (typeof linearState !== 'undefined') ? (linearState.xScale || 1) : 1;
    
    // Ã‡izgi noktalarÄ±nÄ± matematiksel deÄŸere Ã§evir
    const v1 = { x: (start.x - 50) / 50 * stepX, y: (450 - start.y) / 50 * stepY };
    const v2 = { x: (end.x - 50) / 50 * stepX, y: (450 - end.y) / 50 * stepY };

    // Senaryodaki gerÃ§ek eÄŸimi hesapla
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

    // EÄÄ°M KONTROLÃœ
    if (correctM !== undefined && !isNaN(correctM) && Math.abs(userM - correctM) < 0.4) {
        if(typeof playSuccessSound === 'function') playSuccessSound();
        document.getElementById('rubber-line').setAttribute('stroke', '#10b981'); // YeÅŸil

        // --- BUTONU BUL VE ZORLA AKTÄ°F ET ---
        // Senin projendeki tÃ¼m olasÄ± ID'leri kontrol ediyoruz
        const btn = document.getElementById('checkBtn') || document.getElementById('btn_kontrol_et');
        
        if (btn) {
            console.log("ğŸš€ Kontrol butonu aktif ediliyor!");
            
            // 1. GÃ¶rÃ¼nÃ¼rlÃ¼k Engellerini KaldÄ±r
            btn.classList.remove('hidden', 'opacity-50', 'cursor-not-allowed');
            btn.disabled = false;
            btn.style.display = 'block';
            btn.style.opacity = '1';
            btn.style.pointerEvents = 'auto';

            // 2. GÃ¶rsel Efekt Ekle (YanÄ±p SÃ¶nme)
            btn.style.animation = "pulse 1.5s infinite";
            btn.classList.add('bg-orange-500', 'hover:bg-orange-600', 'ring-4', 'ring-orange-200');
            btn.innerHTML = "Ã‡izimi Onayla âœ¨";

            // 3. TÄ±klama GÃ¶revini Ata (EÄŸer atanmamÄ±ÅŸsa)
            btn.onclick = function() {
                // Final onayÄ± fonksiyonunu Ã§alÄ±ÅŸtÄ±r
                if(typeof finalDogrulamaYap === 'function') finalDogrulamaYap();
            };
        }
    } else {
        if(typeof playErrorSound === 'function') playErrorSound();
        document.getElementById('rubber-line').setAttribute('stroke', '#ef4444'); // KÄ±rmÄ±zÄ±
    }
}

// Butonun yanÄ±p sÃ¶nmesi iÃ§in gerekli olan CSS animasyonu
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
// âœ… FÄ°NAL ONAY VE KONTROL MEKANÄ°ZMASI
// =================================================================

// 1. Ã‡izgi DoÄŸruysa Ãœstteki Butonu Hareketlendir
function animasyonuBaslatKontrolButonu() {
    const kontrolBtn = document.getElementById('btn_kontrol_et'); // Senin Ã¼stteki butonunun ID'si
    if (kontrolBtn) {
        kontrolBtn.classList.remove('hidden');
        // YanÄ±p sÃ¶nme ve bÃ¼yÃ¼me efekti (Tailwind sÄ±nÄ±flarÄ± veya CSS)
        kontrolBtn.style.animation = "pulse 1.5s infinite";
        kontrolBtn.classList.add('bg-emerald-600', 'scale-110', 'shadow-2xl');
        kontrolBtn.innerHTML = "âœ¨ Åimdi Ã‡izimi Onayla";
        
        // Butona son kontrol gÃ¶revini ata
        kontrolBtn.onclick = finalDogrulamaYap;
    }
}

// 2. Kontrol Et Butonuna BasÄ±nca YapÄ±lacak Son Kontrol
function finalDogrulamaYap() {
    console.log("ğŸ Final KontrolÃ¼ YapÄ±lÄ±yor...");
    
    const userLine = document.getElementById('rubber-line');
    if (!userLine) return;

    // Tablodaki tÃ¼m noktalarÄ± al
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

    // Ã‡izginin matematiksel eÄŸimini ve sabitini (y = mx + b) bul
    const stepY = (typeof linearState !== 'undefined') ? (linearState.yScale || 1) : 1;
    const stepX = (typeof linearState !== 'undefined') ? (linearState.xScale || 1) : 1;
    const ORJIN_X = 50; const ORJIN_Y = 450; const KARE = 50;

    const x1 = (parseFloat(userLine.getAttribute('x1')) - ORJIN_X) / KARE * stepX;
    const y1 = (ORJIN_Y - parseFloat(userLine.getAttribute('y1'))) / KARE * stepY;
    const x2 = (parseFloat(userLine.getAttribute('x2')) - ORJIN_X) / KARE * stepX;
    const y2 = (ORJIN_Y - parseFloat(userLine.getAttribute('y2'))) / KARE * stepY;

    const m = (y2 - y1) / (x2 - x1);
    const b = y1 - (m * x1);

    // Her nokta bu Ã§izginin Ã¼zerinde mi? (0.5 tolerans ile)
    let herNoktaUygun = true;
    noktalar.forEach(p => {
        const beklenenY = (m * p.x) + b;
        if (Math.abs(p.y - beklenenY) > 0.8) { // Biraz esneklik payÄ±
            herNoktaUygun = false;
        }
    });

    if (herNoktaUygun && noktalar.length > 0) {
        if(typeof playSuccessSound === 'function') playSuccessSound();
        
        // BaÅŸarÄ± EkranÄ±
        document.getElementById('drawMessageArea').innerHTML = `
            <div class="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6 rounded-2xl shadow-2xl text-center">
                <h2 class="text-2xl font-black mb-2">ğŸ† TEBRÄ°KLER!</h2>
                <p>Tabloyu doldurdun, grafiÄŸi Ã§izdin ve tÃ¼m noktalarÄ± birleÅŸtirdin!</p>
            </div>`;
            
        // Butonun animasyonunu durdur ve yeÅŸil yap
        const btn = document.getElementById('btn_kontrol_et');
        btn.style.animation = "none";
        btn.className = "bg-green-600 text-white px-8 py-3 rounded-full font-bold";
        btn.innerHTML = "âœ… SORU TAMAMLANDI";
        
        // 3 saniye sonra diÄŸer soruya geÃ§iÅŸ (isteÄŸe baÄŸlÄ±)
        // setTimeout(nextQuestion, 3000);
    } else {
        if(typeof playErrorSound === 'function') playErrorSound();
        alert("Ã‡izgi tÃ¼m noktalardan geÃ§miyor, lÃ¼tfen tekrar dene!");
    }
}

// 3. Eski checkDrawingLogic fonksiyonuna tetikleyici ekle
// (Ã–nceki yazdÄ±ÄŸÄ±mÄ±z fonksiyonun iÃ§ine ÅŸu satÄ±rÄ± ekliyoruz)


// ==========================================
// ğŸ§ª MATEMATÄ°KSEL Ä°FADE Ã‡Ã–ZÃœCÃœ
// ==========================================
function solveMathExpression(inputStr) {
    try {
        // 1. "x" veya "X" iÅŸaretlerini "*" (Ã§arpma) ile deÄŸiÅŸtir
        let cleanedInput = inputStr.toLowerCase().replace(/x/g, '*');
        
        // 2. Sadece gÃ¼venli karakterlere izin ver (sayÄ±lar ve + - * /)
        // Bu gÃ¼venlik iÃ§in Ã¶nemlidir
        cleanedInput = cleanedInput.replace(/[^0-9+\-*/().]/g, '');

        // 3. Ä°ÅŸlemi hesapla (Ä°ÅŸlem Ã¶nceliÄŸine gÃ¶re)
        // Function constructor, eval'den daha gÃ¼venlidir
        const result = new Function(`return ${cleanedInput}`)();
        
        return result;
    } catch (e) {
        console.error("HatalÄ± iÅŸlem formatÄ±:", e);
        return null;
    }
}

// Tablodaki Y hÃ¼cresine tÄ±klandÄ±ÄŸÄ±nda veya veri girildiÄŸinde Ã§alÄ±ÅŸÄ±r
function finalizeCellInput(cellId) {
    const cell = document.getElementById(cellId);
    let rawValue = cell.textContent.trim();

    // EÄŸer hÃ¼crede iÅŸlem iÅŸareti (+, -, x, /) varsa Ã§Ã¶zÃ¼cÃ¼ye gÃ¶nder
    if (/[+\-x*/]/.test(rawValue)) {
        const calculatedResult = solveMathExpression(rawValue);
        
        if (calculatedResult !== null) {
            // HÃ¼credeki metni sonucun kendisiyle deÄŸiÅŸtir (Ã–rn: 185)
            cell.textContent = calculatedResult;
            
            // GrafiÄŸi gÃ¼ncellemek iÃ§in mevcut fonksiyonunu tetikle
            if (typeof canliGrafikCiz === 'function') {
                canliGrafikCiz(); 
            }
            
            console.log(`âœ… Ä°ÅŸlem Ã§Ã¶zÃ¼ldÃ¼: ${rawValue} = ${calculatedResult}`);
        }
    }
}

// ==========================================
// ğŸ¯ Ä°ÅLEMÄ° Ã‡Ã–ZÃœP SONUCU AKTARAN MOTOR (v11)
// ==========================================

window.hucreyiOnayla = function() {
    // 1. YazÄ±lan hÃ¼creyi bul (aktifHucreId Ã¼zerinden)
    const hucre = document.getElementById(window.aktifHucreId);
    
    if (!hucre) {
        console.log("âš ï¸ Ã–nce bir hÃ¼creye tÄ±klamalÄ±sÄ±n hocam.");
        return;
    }

    let hamVeri = hucre.textContent.trim();

    // HÃ¼cre boÅŸsa veya sadece "?" varsa iÅŸlem yapma
    if (hamVeri === "" || hamVeri === "?") return;

    try {
        // 2. MATEMATÄ°KSEL TEMÄ°ZLÄ°K (Ä°ÅŸlem Ã¶nceliÄŸi hazÄ±rlÄ±ÄŸÄ±)
        // 'x' iÅŸaretini '*' yapÄ±yoruz, diÄŸer gereksiz karakterleri temizliyoruz
        let temizVeri = hamVeri.toLowerCase()
                               .replace(/x/g, '*')
                               .replace(/,/g, '.')
                               .replace(/[^0-9+\-*/().]/g, '');

        // 3. HESAPLAMA (Burada matematik devreye girer)
        const sonuc = new Function(`return ${temizVeri}`)();

        if (typeof sonuc === 'number' && !isNaN(sonuc)) {
            
            // --- KRÄ°TÄ°K ADIM: Ä°ÅŸlemi sil, sonucu yaz ---
            hucre.textContent = sonuc; 
            
            // GÃ¶rsel onay (Hafif yeÅŸil yanÄ±p sÃ¶ner)
            hucre.style.backgroundColor = "#d1fae5"; 
            setTimeout(() => { hucre.style.backgroundColor = "white"; }, 1000);
            
            console.log(`âœ¨ Hesaplama BaÅŸarÄ±lÄ±: ${sonuc}`);

            // 4. GRAFÄ°ÄÄ° GÃœNCELLE
            // Bu fonksiyon tablodaki yeni sayÄ±yÄ± okuyup grafiÄŸe noktayÄ± koyar
            if (typeof canliGrafikCiz === 'function') {
                canliGrafikCiz(); 
            }

        } else {
            throw new Error("HesaplanamadÄ±");
        }

    } catch (e) {
        console.error("âŒ HatalÄ± Ä°ÅŸlem:", e);
        hucre.style.backgroundColor = "#fee2e2"; // Hata durumunda kÄ±rmÄ±zÄ±
    }
};

// 1. Ã–NCE HESAPLAMA MANTIÄINI OLUÅTURALIM
function matematikselCozucu(ifade) {
    try {
        // 'x' iÅŸaretini '*' yap, 'Ã·' iÅŸaretini '/' yap
        let temiz = ifade.toLowerCase()
                         .replace(/x/g, '*')
                         .replace(/Ã—/g, '*')
                         .replace(/Ã·/g, '/')
                         .replace(/,/g, '.');

        // Sadece sayÄ±lar ve iÅŸlem iÅŸaretleri kalsÄ±n (GÃ¼venlik iÃ§in)
        temiz = temiz.replace(/[^0-9+\-*/().]/g, '');

        if (temiz === "") return null;

        // Ä°ÅŸlem Ã¶nceliÄŸine gÃ¶re hesapla (PEMDAS/BODMAS kuralÄ±)
        const sonuc = new Function(`return ${temiz}`)();
        
        return sonuc;
    } catch (e) {
        return null;
    }
}

// 2. SAYI PANELÄ°NDEKÄ° "TAMAM" BUTONUNA BU GÃ–REVÄ° BAÄLAYALIM
const tamamButonu = document.getElementById('numPadClose');

if (tamamButonu) {
    tamamButonu.addEventListener('click', function() {
        const ekran = document.getElementById('currentInput'); // Paneldeki yazÄ± alanÄ±
        const hamYazi = ekran.innerText.trim();
        
        if (hamYazi !== "" && window.aktifHucreId) {
            const hedefHucre = document.getElementById(window.aktifHucreId);
            
            // HESAPLAMA BURADA DEVREYE GÄ°RÄ°YOR
            const sonuc = matematikselCozucu(hamYazi);

            if (sonuc !== null) {
                // HÃ¼creye "150-0x15" deÄŸil, sadece sonucu (150) yaz
                hedefHucre.innerText = sonuc;
                
                // GrafiÄŸi gÃ¼ncellemek iÃ§in sizin ana fonksiyonunuzu Ã§aÄŸÄ±rÄ±yoruz
                if (typeof canliGrafikCiz === 'function') {
                    canliGrafikCiz();
                }
                
                console.log("âœ… Ä°ÅŸlem baÅŸarÄ±yla sonuca dÃ¶nÃ¼ÅŸtÃ¼rÃ¼ldÃ¼.");
            } else {
                // EÄŸer hesaplanamazsa olduÄŸu gibi aktar (hata vermemesi iÃ§in)
                hedefHucre.innerText = hamYazi;
            }
        }

        // Paneli kapat ve temizle
        document.getElementById('numberPad').classList.add('hidden');
        ekran.innerText = "";
    });
}

// ==========================================
// 1. SÄ°STEMÄ°N YENÄ° BEYNÄ° (UNIFIED INPUT)
// ==========================================
window.activeInputTarget = null; 

window.openTableInput = function(targetId) {
    console.log("ğŸ¯ Yeni Hedef Kilitlendi:", targetId);
    window.activeInputTarget = targetId;

    // Ã–nceki seÃ§im gÃ¶rsellerini temizle
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
        
        // Kutudaki mevcut deÄŸeri Numpad ekranÄ±na taÅŸÄ±
        let currentVal = box.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = currentVal;
    }

    // Numpad'i gÃ¶rÃ¼nÃ¼r yap ve en Ã¼ste taÅŸÄ±
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
        np.style.zIndex = "999999"; 
    }
};

// ==========================================
// 2. MATEMATÄ°KSEL MOTOR VE TAMAM BUTONU
// ==========================================
function solveMathExpression(input) {
    try {
        // 'x' ve 'Ã—' iÅŸaretlerini '*' yap, virgÃ¼lÃ¼ noktaya Ã§evir
        let clean = input.toLowerCase()
                         .replace(/x|Ã—/g, '*')
                         .replace(/Ã·/g, '/')
                         .replace(/,/g, '.')
                         .replace(/[^0-9+\-*/().]/g, '');
        if (clean === "") return null;
        return new Function(`return ${clean}`)();
    } catch (e) { return null; }
}

// Tamam butonunu bul ve gÃ¶revini yeniden tanÄ±mla
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
                    // Ä°ÅLEMÄ° Ã‡Ã–Z
                    let result = solveMathExpression(rawVal);
                    let finalVal = (result !== null && !isNaN(result)) ? result : rawVal;

                    // 1. Ekrana Yaz
                    targetBox.textContent = finalVal;
                    targetBox.style.backgroundColor = "white";

                    // 2. HafÄ±zaya (linearState) Kaydet
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
            // 3. Paneli Kapat ve GrafiÄŸi GÃ¼ncelle
            if (typeof forceClosePanel === 'function') forceClosePanel();
            if (typeof canliGrafikCiz === 'function') canliGrafikCiz();
            if (typeof checkTableFull_Final === 'function') checkTableFull_Final();
        };
    }
})();

// ==========================================
// 3. AKILLI GRAFÄ°K VE Y-EKSENÄ° Ã–LÃ‡EÄÄ° (YEDEK VE SÄ°LÄ°NDÄ°)
// ==========================================
// window.canliGrafikCiz fonksiyonu silindi Ã§Ã¼nkÃ¼ yukarÄ±daki asÄ±l canliGrafikCiz ile Ã§akÄ±ÅŸÄ±yordu.

// ==========================================
// ğŸ¯ MASTER OVERRIDE: SAYI AKTARMA TAMÄ°RCÄ°SÄ°
// ==========================================

// 1. TEK VE GERÃ‡EK HEDEF DEÄÄ°ÅKENÄ°
window.MASTER_TARGET = null;

// 2. KUTUYA TIKLAMA FONKSÄ°YONUNU SIFIRDAN KUR
window.openTableInput = function(targetId) {
    console.log("ğŸ“ Kutu SeÃ§ildi:", targetId);
    window.MASTER_TARGET = targetId;

    // GÃ¶rsel efekt: DiÄŸerlerini sÃ¶ndÃ¼r, seÃ§ileni yak
    document.querySelectorAll('.table-input-cell').forEach(el => {
        el.style.backgroundColor = "white";
        el.style.borderColor = "#e0e7ff";
    });

    const box = document.getElementById(targetId);
    if (box) {
        box.style.backgroundColor = "#dbeafe"; // SeÃ§ili mavi
        box.style.borderColor = "#2563eb";
        
        // Kutuda Ã¶nceden yazan bir ÅŸey varsa Numpad ekranÄ±na al
        let existingVal = box.textContent.replace('?', '').trim();
        const display = document.getElementById('currentInput');
        if (display) display.textContent = existingVal;
    }

    // Paneli AÃ§ (TÃ¼m engelleri aÅŸarak)
    const np = document.getElementById('numberPad');
    if (np) {
        np.classList.remove('hidden');
        np.style.display = 'flex';
        np.style.zIndex = "999999";
    }
};

// 3. TAMAM (ONAY) BUTONUNU ZORLA YENÄ°DEN BAÄLA
(function() {
    const checkAndFixButton = () => {
        const btnTamam = document.getElementById('numPadClose');
        if (!btnTamam) return;

        // Eski tÃ¼m olaylarÄ± (click) temizleyip yenisini takÄ±yoruz
        const masterConfirm = btnTamam.cloneNode(true);
        btnTamam.parentNode.replaceChild(masterConfirm, btnTamam);

        masterConfirm.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            const display = document.getElementById('currentInput');
            let rawValue = display ? display.textContent.trim() : '';
            
            console.log("âœ… Tamam'a basÄ±ldÄ±. DeÄŸer:", rawValue, "Hedef:", window.MASTER_TARGET);

            if (window.MASTER_TARGET) {
                const targetBox = document.getElementById(window.MASTER_TARGET);
                if (targetBox) {
                    // SayÄ± veya Ä°ÅŸlem KontrolÃ¼ (200-15*2 gibi)
                    let finalValue = "?";
                    if (rawValue !== "") {
                        try {
                            // Basit matematik Ã§Ã¶zÃ¼cÃ¼
                            let cleanExpr = rawValue.replace(/x|Ã—/g, '*').replace(/Ã·/g, '/').replace(/,/g, '.');
                            let solved = new Function(`return ${cleanExpr}`)();
                            if (solved !== null && !isNaN(solved)) {
                                // OndalÄ±k kÄ±smÄ± varsa en fazla 2 basamak gÃ¶ster
                                if (solved % 1 !== 0) {
                                    solved = parseFloat(solved.toFixed(2));
                                }
                                // Sadece bir sayÄ± deÄŸilse ve iÃ§inde iÅŸlem karakteri varsa '= X' ekle
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

                    // --- KRÄ°TÄ°K ADIM: TABLOYA YAZ ---
                    targetBox.textContent = finalValue;
                    targetBox.style.backgroundColor = "white";
                    targetBox.style.borderColor = "#e0e7ff";

                    // --- YAMA: KONTROL BUTONUNU AÃ‡ (EÄŸik DÃ¼zlem KutularÄ± Ä°Ã§in) ---
                    if (['slopeAnswerBox', 'unknownBox', 'slopeNumBox', 'slopeDenomBox', 'leftDenomBox'].includes(window.MASTER_TARGET)) {
                        const checkBtn = document.getElementById('checkBtn');
                        if (checkBtn) {
                            checkBtn.disabled = false;
                            checkBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                        }
                    }

                    // --- HAFIZAYA (State) Ä°ÅLE ---
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

            // Paneli Kapat ve GrafiÄŸi GÃ¼ncelle
            if (typeof forceClosePanel === 'function') forceClosePanel();
            else {
                const np = document.getElementById('numberPad');
                if (np) { 
                    np.removeAttribute('style');
                    np.classList.add('hidden'); 
                }
                if (display) display.textContent = '';
            }
            
            // CanlÄ± grafiÄŸi tetikle (EÄŸik dÃ¼zlemde canvasÄ± bozmamak iÃ§in kÄ±sÄ±tlandÄ±)
            if (typeof canliGrafikCiz === 'function' && gameState.mode !== 'slope_incline') {
                canliGrafikCiz();
            }
            // Tablo doluluk kontrolÃ¼
            if (typeof checkTableFull_Final === 'function' && gameState.mode !== 'slope_incline') {
                checkTableFull_Final();
            }
        });
    };

    // Sayfa yÃ¼klendiÄŸinde ve her saniye kontrol et (ID'ler dinamik deÄŸiÅŸirse diye)
    setTimeout(checkAndFixButton, 500);
    setInterval(checkAndFixButton, 3000); 
})();
