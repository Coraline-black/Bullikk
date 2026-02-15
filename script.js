// ТОЧНЫЙ адрес твоего воркера из скриншота
const WORKER_URL = "https://bullik.damp-glade-283e.workers.dev";
const pet = document.getElementById('pet-box');
const overlay = document.getElementById('overlay');
const log = document.getElementById('status-log');
const video = document.getElementById('webcam');

// 1. Активация
overlay.onclick = async () => {
    overlay.style.display = 'none';
    log.textContent = "Инициализация ИИ...";
    await initBullik();
};

async function initBullik() {
    try {
        // Загрузка модели зрения из проверенного источника
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
        
        // Доступ к камере
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        video.srcObject = stream;
        
        log.textContent = "Буллик проснулся!";
        
        startVision();
        startHearing();
    } catch (err) {
        log.textContent = "Ошибка: разрешите доступ к камере";
        console.error(err);
    }
}

// 2. ЗРЕНИЕ: Слежение за тобой (Собачья преданность)
async function startVision() {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 128 });
    
    setInterval(async () => {
        const detection = await faceapi.detectSingleFace(video, options);
        
        if (detection) {
            const box = detection.box;
            // Центрируем лицо и инвертируем зеркально
            const x = (1 - (box.x + box.width / 2) / video.videoWidth) * window.innerWidth;
            const y = (box.y + box.height / 2) / video.videoHeight * window.innerHeight;
            
            pet.style.left = `${x}px`;
            pet.style.top = `${y}px`;
        } else {
            // Кошачья черта: если никого нет, иногда медленно дрейфует
            if (Math.random() > 0.99) wander();
        }
    }, 100);
}

// 3. СЛУХ И КЛАУДФЛЕЙР
function startHearing() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;

    const rec = new Speech();
    rec.lang = 'ru-RU';
    rec.continuous = true;

    rec.onresult = async (event) => {
        const text = event.results[event.results.length - 1][0].transcript.toLowerCase();
        
        if (text.includes("буллик") || text.includes("привет")) {
            pet.classList.add('love');
            log.textContent = "Буллик думает...";
            
            try {
                const response = await fetch(WORKER_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ prompt: text })
                });
                const data = await response.json();
                console.log("Буллик ответил:", data.response);
                log.textContent = "Буллик: " + data.response;
            } catch (e) {
                console.error("Ошибка воркера:", e);
            }
            
            setTimeout(() => pet.classList.remove('love'), 3000);
        }
    };
    rec.start();
}

// 4. Помощники
function wander() {
    const tx = Math.random() * (window.innerWidth - 200) + 100;
    const ty = Math.random() * (window.innerHeight - 200) + 100;
    pet.style.left = `${tx}px`;
    pet.style.top = `${ty}px`;
}

// Моргание
setInterval(() => {
    pet.classList.add('blink');
    setTimeout(() => pet.classList.remove('blink'), 150);
}, 4000);

// Реакция на касание (Мурчание)
pet.onclick = () => {
    pet.classList.add('love');
    if (navigator.vibrate) navigator.vibrate(50);
    setTimeout(() => pet.classList.remove('love'), 2000);
};
