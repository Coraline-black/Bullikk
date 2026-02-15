const pet = document.getElementById('pet-container');
const eyes = document.querySelectorAll('.eye');
const status = document.getElementById('ai-status');
const video = document.getElementById('webcam');

let state = {
    isOwner: false,
    trustPoints: 0,
    isActive: false
};

// 1. Запуск зрения и микрофона
window.onload = async () => {
    try {
        // Подгружаем нейросетевую модель
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        video.srcObject = stream;
        
        status.textContent = "* Буллик просыпается в центре коробки *";
        
        // Ожидание калибровки в центре
        setTimeout(() => {
            state.isActive = true;
            processAI();
            initVoiceRecognition();
        }, 3000);
    } catch (err) {
        status.textContent = "* Ошибка доступа к чувствам (камера/микрофон) *";
    }
};

// 2. Цикл ИИ: Видеть и Следить
async function processAI() {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());

    if (detections.length > 0) {
        const box = detections[0].box;
        
        if (!state.isOwner) {
            updateEmotion('scared');
            status.textContent = "* Буллик напуган незнакомцем... *";
            state.trustPoints++;
            if (state.trustPoints > 50) { // Привыкание
                state.isOwner = true;
                updateEmotion('love');
            }
        } else {
            updateEmotion('idle');
            status.textContent = "* Буллик видит тебя и спокоен *";
            followFace(box);
        }
    } else {
        status.textContent = "* Буллик дрейфует в одиночестве *";
        if (Math.random() > 0.97) wanderAround();
    }
    
    requestAnimationFrame(processAI);
}

// 3. Функция слежения
function followFace(box) {
    const x = ((box.x + box.width / 2) / video.videoWidth) * window.innerWidth;
    const y = ((box.y + box.height / 2) / video.videoHeight) * window.innerHeight;
    pet.style.left = `${x}px`;
    pet.style.top = `${y}px`;
}

// 4. Функция случайного блуждания
function wanderAround() {
    const x = Math.random() * (window.innerWidth - 250) + 125;
    const y = Math.random() * (window.innerHeight - 250) + 125;
    pet.style.left = `${x}px`;
    pet.style.top = `${y}px`;
}

// 5. Голосовые команды
function initVoiceRecognition() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;
    
    const rec = new Recognition();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    rec.onresult = (e) => {
        const last = e.results.length - 1;
        const text = e.results[last][0].transcript.toLowerCase();
        
        if (text.includes("буллик") || text.includes("привет")) {
            updateEmotion('love');
            status.textContent = "* услышал твое приветствие! *";
            if (navigator.vibrate) navigator.vibrate(100);
        }
    };
    rec.start();
}

function updateEmotion(emo) {
    eyes.forEach(e => {
        e.className = 'eye';
        if (emo !== 'idle') e.classList.add(emo);
    });
}

// Поглаживание по экрану
pet.onclick = () => {
    updateEmotion('love');
    status.textContent = "* мурчит *";
    if (navigator.vibrate) navigator.vibrate(60);
    setTimeout(() => updateEmotion('idle'), 2000);
};

// Естественное моргание
setInterval(() => {
    eyes.forEach(e => e.classList.add('blink'));
    setTimeout(() => eyes.forEach(e => e.classList.remove('blink')), 150);
}, 5000);
