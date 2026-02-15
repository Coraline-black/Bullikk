const pet = document.getElementById('pet');
const eyes = document.querySelectorAll('.eye');
const video = document.getElementById('video');
const logger = document.getElementById('logger');
const overlay = document.getElementById('overlay');

let isLive = false;
const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';

// 1. Активация по клику (нужно для политик браузера)
overlay.addEventListener('click', async () => {
    overlay.style.display = 'none';
    logger.textContent = "Загрузка ИИ...";
    await initBullik();
});

async function initBullik() {
    try {
        // Загружаем только необходимую модель
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        video.srcObject = stream;
        
        logger.textContent = "Буллик проснулся и ждет...";
        isLive = true;
        
        startVision();
        startHearing();
    } catch (err) {
        logger.textContent = "Ошибка доступа: " + err.message;
        console.error(err);
    }
}

// 2. Зрение (Слежение)
async function startVision() {
    if (!isLive) return;

    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

    if (detections) {
        const box = detections.box;
        // Переводим координаты камеры в координаты экрана
        const x = (1 - (box.x + box.width / 2) / video.videoWidth) * window.innerWidth;
        const y = (box.y + box.height / 2) / video.videoHeight * window.innerHeight;

        pet.style.left = `${x}px`;
        pet.style.top = `${y}px`;
        
        setEmotion('idle');
    } else {
        // Если никого нет - медленный дрейф
        if (Math.random() > 0.98) wander();
    }
    
    requestAnimationFrame(startVision);
}

// 3. Слух (Реакция на голос)
function startHearing() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;
    
    const rec = new Speech();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
        if (text.includes("привет") || text.includes("буллик")) {
            setEmotion('love');
            setTimeout(() => setEmotion('idle'), 3000);
        }
    };
    rec.start();
}

// Помощники
function setEmotion(type) {
    eyes.forEach(e => {
        e.className = 'eye';
        if (type !== 'idle') e.classList.add(type);
    });
}

function wander() {
    const tx = Math.random() * (window.innerWidth - 200) + 100;
    const ty = Math.random() * (window.innerHeight - 200) + 100;
    pet.style.left = `${tx}px`;
    pet.style.top = `${ty}px`;
}

// Моргание
setInterval(() => {
    eyes.forEach(e => e.classList.add('blink'));
    setTimeout(() => eyes.forEach(e => e.classList.remove('blink')), 150);
}, 4000);

// Поглаживание
pet.onclick = () => {
    setEmotion('love');
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => setEmotion('idle'), 2000);
};
