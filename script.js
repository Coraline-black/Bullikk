const bullik = document.getElementById('bullik');
const eyes = document.querySelectorAll('.eye');
const log = document.getElementById('ai-log');
const video = document.getElementById('video');

let stats = { isOwner: false, trust: 0, ready: false };

window.onload = async () => {
    try {
        // Загрузка модели зрения
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
        
        // Включение камеры и микрофона
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;
        
        log.textContent = "* Буллик проснулся и осматривается *";
        
        // Ждем 3 секунды в центре, потом начинаем жизнь
        setTimeout(() => {
            stats.ready = true;
            startAI();
            startListening();
        }, 3000);
    } catch (e) {
        log.textContent = "* Ошибка: Буллику нужны камера и микрофон *";
    }
};

async function startAI() {
    const found = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

    if (found.length > 0) {
        const box = found[0].box;
        if (!stats.isOwner) {
            setMood('scared');
            log.textContent = "* Буллик видит незнакомца... *";
            stats.trust++;
            if (stats.trust > 40) { stats.isOwner = true; setMood('love'); }
        } else {
            setMood('idle');
            log.textContent = "* Буллик наблюдает за тобой *";
            // Слежение за лицом
            const tx = (box.x + box.width / 2) / video.videoWidth * window.innerWidth;
            const ty = (box.y + box.height / 2) / video.videoHeight * window.innerHeight;
            bullik.style.left = tx + 'px';
            bullik.style.top = ty + 'px';
        }
    } else {
        log.textContent = "* Буллик скучает один *";
        if (Math.random() > 0.97) wander();
    }
    requestAnimationFrame(startAI);
}

function wander() {
    const x = Math.random() * (window.innerWidth - 200) + 100;
    const y = Math.random() * (window.innerHeight - 200) + 100;
    bullik.style.left = x + 'px';
    bullik.style.top = y + 'px';
}

function setMood(m) {
    eyes.forEach(e => {
        e.className = 'eye';
        if (m !== 'idle') e.classList.add(m);
    });
}

function startListening() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    const rec = new Recognition();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
        if (text.includes("буллик") || text.includes("привет")) {
            setMood('love');
            log.textContent = "* Радуется твоему голосу! *";
            if (navigator.vibrate) navigator.vibrate(100);
        }
    };
    rec.start();
}

// Погладить по стеклу
bullik.onclick = () => {
    setMood('love');
    log.textContent = "* Мурчит *";
    if (navigator.vibrate) navigator.vibrate(60);
    setTimeout(() => setMood('idle'), 2000);
};

// Моргание
setInterval(() => {
    eyes.forEach(e => e.classList.add('blink'));
    setTimeout(() => eyes.forEach(e => e.classList.remove('blink')), 150);
}, 4500);
