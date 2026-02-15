// Настройки твоего проекта
const WORKER_URL = "https://bullik.damp-glade-283e.workers.dev";
const pet = document.getElementById('pet-box');
const overlay = document.getElementById('overlay');
const eyes = document.querySelectorAll('.eye');

let isInitialCenter = true; // Флаг для удержания в центре при старте

// 1. Пробуждение по клику
overlay.onclick = () => {
    overlay.style.display = 'none';
    startLife();
};

async function startLife() {
    try {
        // Подключаем зрение (FaceAPI)
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
        
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        const video = document.createElement('video');
        video.id = 'webcam';
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.play();

        // Запускаем циклы жизни
        trackFace(video);
        initSpeech();
        console.log("Буллик-гибрид успешно запущен!");
    } catch (err) {
        console.error("Ошибка запуска:", err);
    }
}

// 2. Зрение (Слежение собаки + Лень кота)
async function trackFace(video) {
    const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions());

    if (detections) {
        isInitialCenter = false; // Как только увидел тебя — начал движение
        const box = detections.box;
        
        // Инвертируем X, так как камера работает как зеркало
        const x = (1 - (box.x + box.width / 2) / video.videoWidth) * window.innerWidth;
        const y = (box.y + box.height / 2) / video.videoHeight * window.innerHeight;

        pet.style.left = `${x}px`;
        pet.style.top = `${y}px`;
        setMood('idle');
    } else {
        // Кошачье поведение: если хозяина нет, Буллик может лениво переместиться
        if (!isInitialCenter && Math.random() > 0.99) wander();
    }
    
    requestAnimationFrame(() => trackFace(video));
}

// 3. Общение с Cloudflare AI
async function getAIResponse(userText) {
    try {
        const response = await fetch(WORKER_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: userText })
        });
        const data = await response.json();
        // В Cloudflare Workers AI ответ обычно лежит в data.response
        return data.response || "Мрр-гав?"; 
    } catch (err) {
        return "Связь с космосом прервана...";
    }
}

// 4. Слух (Speech Recognition)
function initSpeech() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;

    const recognition = new Speech();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = async (event) => {
        const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        if (text.includes("буллик") || text.includes("привет")) {
            setMood('love');
            console.log("Ты сказал:", text);
            
            const reply = await getAIResponse(text);
            console.log("Буллик ответил:", reply);
            
            // Здесь можно добавить озвучку текста (TTS), если нужно
            setTimeout(() => setMood('idle'), 3000);
        }
    };

    recognition.onerror = () => recognition.start(); // Перезапуск при ошибке
    recognition.onend = () => recognition.start();
    recognition.start();
}

// 5. Вспомогательные функции
function setMood(type) {
    pet.classList.remove('love', 'blink');
    if (type !== 'idle') pet.classList.add(type);
}

function wander() {
    const tx = Math.random() * (window.innerWidth - 250) + 125;
    const ty = Math.random() * (window.innerHeight - 250) + 125;
    pet.style.left = `${tx}px`;
    pet.style.top = `${ty}px`;
}

// Поглаживание (Мурчание)
pet.onclick = () => {
    setMood('love');
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    setTimeout(() => setMood('idle'), 2000);
};

// Моргание
setInterval(() => {
    pet.classList.add('blink');
    setTimeout(() => pet.classList.remove('blink'), 150);
}, 5000);
