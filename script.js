// Твой адрес из скриншота
const WORKER_URL = "https://bullik.damp-glade-283e.workers.dev";

const pet = document.getElementById('pet-box');
const overlay = document.getElementById('overlay');

// Проверка наличия библиотек перед стартом
function checkLibraries() {
    if (typeof faceapi === 'undefined') {
        console.error("Ошибка: face-api.js не загружен. Проверь index.html");
        return false;
    }
    return true;
}

overlay.onclick = async () => {
    if (!checkLibraries()) {
        alert("Ошибка: Библиотека ИИ не загружена. Подожди пару секунд и попробуй снова.");
        return;
    }
    overlay.style.display = 'none';
    await wakeUp();
};

async function wakeUp() {
    try {
        // 1. Загрузка весов ИИ напрямую из репозитория автора (чтобы не хранить у себя)
        const MODEL_URL = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        // 2. Запуск камеры
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: "user" }, 
            audio: true 
        });
        
        const video = document.createElement('video');
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.play();

        // 3. Запуск циклов жизни
        startVision(video);
        startHearing();
        
        console.log("Буллик активен!");
    } catch (err) {
        console.error("Критическая ошибка:", err);
        alert("Буллик не смог проснуться. Проверь разрешение на камеру.");
    }
}

// ЗРЕНИЕ: Слежение за лицом
async function startVision(video) {
    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 128 });
    
    setInterval(async () => {
        const detection = await faceapi.detectSingleFace(video, options);
        
        if (detection) {
            const box = detection.box;
            // Рассчитываем положение (инверсия для зеркальности)
            const targetX = (1 - (box.x + box.width / 2) / video.videoWidth) * window.innerWidth;
            const targetY = (box.y + box.height / 2) / video.videoHeight * window.innerHeight;
            
            pet.style.left = `${targetX}px`;
            pet.style.top = `${targetY}px`;
        }
    }, 100); // Высокая скорость реакции
}

// СЛУХ И ОБЩЕНИЕ (Cloudflare)
function startHearing() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;

    const rec = new Speech();
    rec.lang = 'ru-RU';
    rec.continuous = true;

    rec.onresult = async (event) => {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
            const text = result[0].transcript.toLowerCase();
            console.log("Услышано:", text);

            if (text.includes("буллик") || text.includes("привет")) {
                pet.classList.add('love'); // Реакция гибрида
                
                // Запрос к твоему воркеру
                try {
                    const response = await fetch(WORKER_URL, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ prompt: text })
                    });
                    const data = await response.json();
                    
                    // Выводим ответ в консоль (или можно добавить текстовое облако)
                    console.log("Буллик ответил:", data.response); 
                } catch (e) {
                    console.error("Ошибка связи с Cloudflare:", e);
                }
                
                setTimeout(() => pet.classList.remove('love'), 3000);
            }
        }
    };

    rec.start();
}

// Моргание и поглаживание
setInterval(() => {
    pet.classList.add('blink');
    setTimeout(() => pet.classList.remove('blink'), 150);
}, 4500);

pet.onclick = (e) => {
    e.stopPropagation(); // Чтобы не срабатывал overlay.onclick
    pet.classList.add('love');
    if (navigator.vibrate) navigator.vibrate([30, 30, 30]);
    setTimeout(() => pet.classList.remove('love'), 2000);
};
