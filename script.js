const face = document.getElementById('pet-face');
const subs = document.getElementById('subtitles');
const eyes = document.querySelectorAll('.eye');
const video = document.getElementById('webcam');

let petStats = {
    isOwnerRecognized: false,
    patience: 0,
    isFloating: false
};

// 1. Инициализация "Зрения"
async function initAI() {
    try {
        // Загрузка модели распознавания
        await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} });
        video.srcObject = stream;
        
        subs.textContent = "*Буллик осматривает коробку...*";
        
        // Начинаем видеть через 2 секунды после центрации
        setTimeout(startLifeCycle, 2000);
    } catch (err) {
        subs.textContent = "*Ошибка камеры. Буллик ничего не видит*";
    }
}

// 2. Основной цикл жизни
async function startLifeCycle() {
    detectFace();
    initHearing();
    
    // Каждые 10 секунд он может захотеть переместиться, если никого не видит
    setInterval(() => {
        if (!petStats.isOwnerRecognized) floatAround();
    }, 10000);
}

async function detectFace() {
    const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
    
    if (detections.length > 0) {
        if (!petStats.isOwnerRecognized) {
            setEmotion('scared');
            subs.textContent = "*Буллик боится незнакомца...*";
            petStats.patience++;
            
            if (petStats.patience > 30) { // Привыкает через некоторое время
                petStats.isOwnerRecognized = true;
                setEmotion('love');
                subs.textContent = "*Буллик узнал тебя и радуется!*";
            }
        } else {
            setEmotion('idle');
            followUser(detections[0].box);
        }
    } else {
        petStats.isOwnerRecognized = false;
        subs.textContent = "*Буллик один в тишине*";
    }
    
    setTimeout(detectFace, 500);
}

// 3. Слух (Микрофон)
function initHearing() {
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) return;
    
    const rec = new Speech();
    rec.lang = 'ru-RU';
    rec.continuous = true;
    
    rec.onresult = (e) => {
        const text = e.results[e.results.length - 1][0].transcript.toLowerCase();
        if (text.includes("привет") || text.includes("буллик")) {
            setEmotion('love');
            subs.textContent = "*услышал твой голос!*";
            setTimeout(() => setEmotion('idle'), 3000);
        }
    };
    rec.start();
}

// 4. Движения и Эмоции
function setEmotion(type) {
    eyes.forEach(e => {
        e.className = 'eye';
        if (type !== 'idle') e.classList.add(type);
    });
}

function followUser(box) {
    // Буллик плавно двигается за твоим лицом
    const centerX = (box.x + box.width / 2) / video.videoWidth;
    const centerY = (box.y + box.height / 2) / video.videoHeight;
    
    const targetX = centerX * window.innerWidth;
    const targetY = centerY * window.innerHeight;
    
    face.style.left = targetX + 'px';
    face.style.top = targetY + 'px';
    face.style.transform = "translate(-50%, -50%)";
}

function floatAround() {
    const x = Math.random() * (window.innerWidth - 300) + 150;
    const y = Math.random() * (window.innerHeight - 300) + 150;
    face.style.left = x + 'px';
    face.style.top = y + 'px';
    face.style.transform = "translate(-50%, -50%)";
}

// Моргание
setInterval(() => {
    eyes.forEach(e => e.classList.add('blink'));
    setTimeout(() => eyes.forEach(e => e.classList.remove('blink')), 150);
}, 5000);

// Поглаживание по стеклу
face.addEventListener('click', () => {
    setEmotion('love');
    subs.textContent = "*мур-мур*";
    if (navigator.vibrate) navigator.vibrate(80);
    setTimeout(() => setEmotion('idle'), 2000);
});

// Старт
window.onload = initAI;
