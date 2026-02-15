const bullik = document.getElementById('bullik');
const eyes = document.querySelectorAll('.eye');
const log = document.getElementById('status-log');
const video = document.getElementById('webcam');

let stats = { isOwner: false, trust: 0, active: false };

// 1. Инициализация систем
window.onload = async () => {
    try {
        // Подключаем модель для распознавания лиц
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
        
        // Доступ к камере и микрофону
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;
        
        log.textContent = "* Буллик проснулся. Калибровка... *";
        
        // Активация жизни через 3 секунды пребывания в центре
        setTimeout(() => {
            stats.active = true;
            runAI();
            initHearing();
        }, 3000);
    } catch (err) {
        log.textContent = "* Ошибка: Буллик не может видеть или слышать *";
    }
};

// 2. Цикл Зрения
async function runAI() {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

    if (detections.length > 0) {
        const box = detections[0].box;
        
        if (!stats.isOwner) {
            setMood('scared');
            log.textContent = "* Буллик изучает незнакомца... *";
            stats.trust++;
            if (stats.trust > 40) { 
                stats.isOwner = true; 
                setMood('love');
                log.textContent = "* Буллик привык к тебе! *";
            }
        } else {
            setMood('idle');
            log.textContent = "* Буллик наблюдает за тобой *";
            // Слежение за лицом
            const targetX = (box.x + box.width / 2) / video.videoWidth * window.innerWidth;
            const targetY = (box.y + box.height / 2) / video.videoHeight * window.innerHeight;
            bullik.style.left = `${targetX}px`;
            bullik.style.top = `${targetY}px`;
        }
    } else {
        log.textContent = "* Буллик скучает в коробке *";
        if (Math.random() > 0.98) wander(); // Случайное перемещение
    }
    requestAnimationFrame(runAI);
}

// 3. Цикл Слуха
function initHearing() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;
    
    const rec = new Speech();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
        if (text.includes("буллик") || text.includes("привет")) {
            setMood('love');
            log.textContent = "* услышал тебя! *";
            if (navigator.vibrate) navigator.vibrate(100);
            setTimeout(() => setMood('idle'), 3000);
        }
    };
    rec.start();
}

// 4. Функции управления
function setMood(m) {
    eyes.forEach(e => {
        e.className = 'eye';
        if (m !== 'idle') e.classList.add(m);
    });
}

function wander() {
    const x = Math.random() * (window.innerWidth - 200) + 100;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    bullik.style.left = `${x}px`;
    bullik.style.top = `${y}px`;
}

// Поглаживание
bullik.addEventListener('click', () => {
    setMood('love');
    log.textContent = "* мур-мур *";
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setMood('idle'), 2000);
});

// Моргание
setInterval(() => {
    eyes.forEach(e => e.classList.add('blink'));
    setTimeout(() => eyes.forEach(e => e.classList.remove('blink')), 150);
}, 5000);
