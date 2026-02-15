const pet = document.getElementById('pet-box');
const eyes = document.querySelectorAll('.eye');
const video = document.getElementById('webcam'); // Предполагаем наличие в HTML

// Настройки твоего Cloudflare
const CF_ID = "ТВОЙ_ACCOUNT_ID"; 
const CF_TOKEN = "ТВОЙ_API_TOKEN";

let stats = {
    isOwner: false,
    mood: 'idle',
    isThinking: false
};

// 1. Инициализация при загрузке
window.onload = () => {
    console.log("Буллик готов к пробуждению в центре.");
    // Начинаем слежение через 3 секунды
    setTimeout(startHybridAI, 3000);
};

// 2. Интеграция с Cloudflare Workers AI
async function askAI(message) {
    stats.isThinking = true;
    try {
        const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${CF_ID}/ai/run/@cf/meta/llama-3-8b-instruct`, {
            method: "POST",
            headers: { "Authorization": `Bearer ${CF_TOKEN}` },
            body: JSON.stringify({ 
                prompt: `Ты — Буллик, гибрид собаки и кота. Ты преданный как пес и независимый как кот. Отвечай коротко: ${message}` 
            })
        });
        const data = await response.json();
        return data.result.response;
    } catch (err) {
        return "Мрр-гав? (Связь потеряна)";
    } finally {
        stats.isThinking = false;
    }
}

// 3. Зрение и Движение (Собачья преданность)
async function startHybridAI() {
    // Подгрузка FaceAPI (предполагаем наличие библиотеки)
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://raw.githubusercontent.com/vladmandic/face-api/master/model/');
    
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;

    setInterval(async () => {
        const detections = await faceapi.detectAllFaces(video, new faceapi.TinyFaceDetectorOptions());
        
        if (detections.length > 0) {
            // Ведет себя как пес: следует за тобой
            const box = detections[0].box;
            const x = (box.x / video.videoWidth) * window.innerWidth;
            const y = (box.y / video.videoHeight) * window.innerHeight;
            
            pet.style.left = `${x}px`;
            pet.style.top = `${y}px`;
            setMood('idle');
        } else {
            // Ведет себя как кот: уходит в "свои дела" (дрейф)
            if (Math.random() > 0.9) wander();
        }
    }, 600);
}

// 4. Слух (Команды)
function initHearing() {
    const Speech = window.webkitSpeechRecognition || window.SpeechRecognition;
    const rec = new Speech();
    rec.lang = 'ru-RU';
    rec.onresult = async (e) => {
        const text = e.results[0][0].transcript.toLowerCase();
        if (text.includes("буллик")) {
            setMood('love');
            const reply = await askAI(text);
            console.log("Буллик говорит:", reply);
        }
    };
    rec.start();
}

// Помощники
function setMood(m) {
    eyes.forEach(e => {
        e.className = 'eye';
        if (m !== 'idle') e.classList.add(m);
    });
}

function wander() {
    const tx = Math.random() * (window.innerWidth - 200) + 100;
    const ty = Math.random() * (window.innerHeight - 200) + 100;
    pet.style.left = `${tx}px`;
    pet.style.top = `${ty}px`;
}

// Поглаживание (мурчание)
pet.onclick = () => {
    pet.classList.add('purring');
    setMood('love');
    if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
    setTimeout(() => {
        pet.classList.remove('purring');
        setMood('idle');
    }, 2000);
};

// Моргание
setInterval(() => {
    eyes.forEach(e => e.classList.add('blink'));
    setTimeout(() => eyes.forEach(e => e.classList.remove('blink')), 150);
}, 4000);
