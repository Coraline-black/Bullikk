// --- Глобальные переменные состояния питомца ---
let pet = JSON.parse(localStorage.getItem('bullik_sealed_pet')) || {
    energy: 100,      // Энергия (влияет на активность)
    wildness: 0,      // Дикость (желание играть, агрессия)
    love: 0,          // Привязанность к хозяину
    mood: "idle",     // Текущее настроение
    lastInteraction: Date.now(), // Время последней активности
    isSleeping: false,
    facePosition: { x: window.innerWidth / 2, y: window.innerHeight / 2 },
    knownFaces: [],   // Здесь будут храниться дескрипторы лиц хозяина
    isOwnerPresent: false,
    strangerTimer: null // Таймер для привыкания к незнакомцам
};

const PET_SIZE = 250; // Размер контейнера лица питомца

// --- DOM элементы ---
const petFaceContainer = document.getElementById('pet-face-container');
const eyes = document.querySelectorAll('.eye');
const debugInfo = document.getElementById('debug-info');
const video = document.getElementById('webcam-feed');
const canvas = document.getElementById('face-canvas');
const context = canvas.getContext('2d');

// --- Функции обновления UI ---
function setFace(emotion) {
    eyes.forEach(eye => {
        eye.className = 'eye'; // Сброс
        if (emotion) eye.classList.add(emotion);
    });
    pet.mood = emotion;
}

function updatePetPosition(x, y) {
    petFaceContainer.style.transform = `translate(${x - PET_SIZE / 2}px, ${y - PET_SIZE / 2}px)`;
    pet.facePosition = { x, y };
}

function randomizePetPosition() {
    const maxX = window.innerWidth - PET_SIZE;
    const maxY = window.innerHeight - PET_SIZE;
    const newX = Math.random() * maxX;
    const newY = Math.random() * maxY;
    updatePetPosition(newX + PET_SIZE / 2, newY + PET_SIZE / 2);
}

// --- Сохранение/Загрузка состояния ---
function savePetState() {
    localStorage.setItem('bullik_sealed_pet', JSON.stringify(pet));
    debugInfo.textContent = `Energy: ${Math.floor(pet.energy)}%, Wild: ${Math.floor(pet.wildness)}%, Love: ${pet.love}, Mood: ${pet.mood}`;
}

// --- Инициализация ---
async function initPet() {
    // Перемещаем питомца на его последнюю позицию или в центр
    if (pet.facePosition.x && pet.facePosition.y) {
        updatePetPosition(pet.facePosition.x, pet.facePosition.y);
    } else {
        randomizePetPosition();
    }
    
    // Загрузка моделей face-api.js
    await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
    await faceapi.nets.faceLandmark68Net.loadFromUri('/models');
    await faceapi.nets.faceRecognitionNet.loadFromUri('/models');
    await faceapi.nets.faceExpressionNet.loadFromUri('/models'); // Для будущих эмоций

    // Запрос доступа к камере
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            startFaceDetection();
        };
    } catch (err) {
        debugInfo.textContent = `Камера недоступна: ${err.message}`;
        console.error("Ошибка доступа к камере:", err);
    }
    
    // Загрузка дескрипторов хозяина
    const storedKnownFaces = localStorage.getItem('knownFacesDescriptors');
    if (storedKnownFaces) {
        pet.knownFaces = JSON.parse(storedKnownFaces).map(desc => new Float32Array(desc));
        debugInfo.textContent += ` | Known Faces: ${pet.knownFaces.length}`;
    }

    // Запускаем жизненный цикл
    setInterval(petLifeCycle, 5000); // Каждые 5 секунд
    savePetState();
}

// --- Жизненный цикл питомца ---
function petLifeCycle() {
    if (pet.isSleeping) {
        pet.energy += 0.5; // Восстановление энергии во сне
        if (pet.energy >= 100) {
            pet.isSleeping = false;
            setFace('idle');
            sendMessageToWorker("*проснулся и потягивается* Мяу.");
        }
        savePetState();
        return;
    }

    // Усталость
    pet.energy -= 0.1;
    if (pet.energy < 20 && Math.random() < 0.3) { // Шанс уснуть
        pet.isSleeping = true;
        setFace('sleep');
        sendMessageToWorker("*засыпает* Хррр...");
    }

    // Скука -> Дикость
    const idleTime = (Date.now() - pet.lastInteraction) / 1000;
    if (idleTime > 60 && pet.wildness < 100) {
        pet.wildness += 0.5;
        if (pet.wildness > 70 && Math.random() < 0.2) { // Шанс на "тыгыдык"
            startZoomies();
        } else if (pet.wildness > 40 && Math.random() < 0.1) { // Шанс просто переместиться
            randomizePetPosition();
        }
    }
    
    // Случайные эмоции (как у реального животного)
    if (Math.random() < 0.05) { // 5% шанс случайной эмоции
        const emotions = ['idle', 'happy', 'scared'];
        setFace(emotions[Math.floor(Math.random() * emotions.length)]);
    }

    savePetState();
}

// --- Взаимодействие (Прикосновения) ---
petFaceContainer.addEventListener('touchstart', handleTouch, { passive: false });
petFaceContainer.addEventListener('touchmove', handleTouch, { passive: false });
petFaceContainer.addEventListener('touchend', handleTouch, { passive: false });

let lastTouchX, lastTouchY;
function handleTouch(e) {
    e.preventDefault(); // Предотвращаем прокрутку и масштабирование
    if (pet.isSleeping) {
        sendMessageToWorker("*спит крепко*");
        return;
    }

    const touch = e.touches[0];
    const clientX = touch.clientX;
    const clientY = touch.clientY;

    if (e.type === 'touchstart') {
        lastTouchX = clientX;
        lastTouchY = clientY;
        pet.lastInteraction = Date.now();
        
        if (pet.wildness > 60 && Math.random() < 0.4) { // Шанс укуса
            biteAction();
        } else {
            setFace('love');
            pet.love++;
            pet.energy += 1;
            pet.wildness = Math.max(0, pet.wildness - 10);
            sendMessageToWorker("*мурчит от прикосновения*");
        }
    } else if (e.type === 'touchmove') {
        // Проверка на "поглаживание"
        const dx = Math.abs(clientX - lastTouchX);
        const dy = Math.abs(clientY - lastTouchY);
        if (dx > 10 || dy > 10) { // Если палец двинулся
            setFace('love');
            pet.love += 0.1; // Постепенное увеличение любви при поглаживании
            pet.energy += 0.05;
            pet.wildness = Math.max(0, pet.wildness - 1);
            // sendMessageToWorker("*наслаждается поглаживанием*"); // Можно сделать реже
        }
        lastTouchX = clientX;
        lastTouchY = clientY;
    } else if (e.type === 'touchend') {
        setTimeout(() => setFace('idle'), 1000); // Возвращение к нейтральному лицу
    }
    savePetState();
}


// --- Действия питомца ---
function startZoomies() {
    petFaceContainer.classList.add("active-zoomies");
    sendMessageToWorker("*носится по коробке, врезается в стенки*");
    setTimeout(() => petFaceContainer.classList.remove("active-zoomies"), 3000);
    pet.wildness = 10;
    savePetState();
}

function biteAction() {
    setFace('angry');
    sendMessageToWorker("*КУСЬ!* *шипит*");
    pet.energy -= 5; // Укус отнимает энергию
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    setTimeout(() => setFace('idle'), 1000);
    savePetState();
}

// --- Камера и Распознавание лиц ---
let faceMatcher;
async function startFaceDetection() {
    setInterval(async () => {
        if (!video.paused && !video.ended) {
            const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceDescriptor();

            if (detections) {
                // Если нет известных лиц, это может быть хозяин
                if (pet.knownFaces.length === 0) {
                    pet.knownFaces.push(detections.descriptor);
                    localStorage.setItem('knownFacesDescriptors', JSON.stringify([Array.from(detections.descriptor)]));
                    debugInfo.textContent += " | Owner registered!";
                    pet.isOwnerPresent = true;
                    if (!pet.isSleeping) {
                        setFace('love');
                        sendMessageToWorker("*радостно прыгает, узнав хозяина* Мяу!");
                    }
                } else {
                    // Сравниваем с известными лицами
                    if (!faceMatcher) {
                         faceMatcher = new faceapi.FaceMatcher(pet.knownFaces, 0.6); // 0.6 - порог похожести
                    }
                    const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
                    
                    if (bestMatch.label === 'person 1') { // 'person 1' - это дефолтное название для первого лица
                        if (!pet.isOwnerPresent) {
                            pet.isOwnerPresent = true;
                            if (!pet.isSleeping) {
                                setFace('love');
                                sendMessageToWorker("*узнает тебя, счастливо виляет хвостом*");
                            }
                        }
                    } else {
                        // Незнакомец
                        if (pet.isOwnerPresent) { // Если хозяин был, а теперь нет или появился незнакомец
                            pet.isOwnerPresent = false;
                            setFace('scared');
                            sendMessageToWorker("*прячется в угол коробки, фырчит на незнакомца*");
                            if (pet.strangerTimer) clearTimeout(pet.strangerTimer);
                            pet.strangerTimer = setTimeout(() => {
                                // Через какое-то время привыкает
                                if (!pet.isOwnerPresent) {
                                    setFace('idle');
                                    sendMessageToWorker("*осторожно выглядывает из-за угла, привыкая к незнакомцу*");
                                }
                            }, 30000); // Привыкание через 30 секунд
                        }
                    }
                }
            } else {
                // Лицо не обнаружено
                pet.isOwnerPresent = false;
                if (!pet.isSleeping && pet.mood !== 'scared') {
                    setFace('idle'); // Если не боится, то просто скучает
                }
            }
        }
    }, 1000); // Проверка лица каждую секунду
}


// --- Общение с Cloudflare Worker ---
async function sendMessageToWorker(message) {
    pet.lastInteraction = Date.now();

    // Создаем "системный" промпт, чтобы ИИ понимал состояние питомца
    const petStatusPrompt = `Ты - гибрид кота и собаки по имени Буллик, запертый в коробке (экране). 
    Ты реагируешь на действия. Ты НЕ говоришь человеческим языком, только звуками и описанием действий в *.
    Твои статы: Энергия ${Math.floor(pet.energy)}%, Дикость ${Math.floor(pet.wildness)}%, Привязанность: ${pet.love}. 
    Хозяин ${pet.isOwnerPresent ? "присутствует" : "отсутствует"}.
    Текущее настроение: ${pet.mood}.`;

    try {
        const response = await fetch("https://bullik.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: petStatusPrompt + " Хозяин/Событие: " + message })
        });
        const data = await response.json();
        // В данном случае, ответ от ИИ - это просто текст действия/звука, который мы уже вывели
        // Но его можно использовать для уточнения поведения, если понадобится
        // tablet.textContent = data.answer; 
    } catch (e) {
        setFace('angry');
        sendMessageToWorker("*шипит на сеть Wi-Fi*"); // Кусает сеть
    }
    savePetState();
}

// --- Инициализация при загрузке ---
window.onload = initPet;
