let bullik = {
    energy: 100,
    hunger: 0,
    wildness: 10, // Уровень "дикости"
    mood: "neutral",
    lastAction: Date.now(),
    isBiting: false
};

const body = document.getElementById("pet-body");
const tablet = document.querySelector(".text-content");
const eyes = document.querySelectorAll(".eye");

// --- ГОРМОНЫ И ИНСТИНКТЫ ---
setInterval(() => {
    // 1. Скука превращается в деструктив
    if (Date.now() - bullik.lastAction > 30000) {
        bullik.wildness += 1;
        if (bullik.wildness > 50) startZoomies();
    }
    
    // 2. Усталость
    bullik.energy -= 0.1;
    if (bullik.energy < 10) setFace('sleep');

    updateUI();
}, 2000);

// --- ДЕЙСТВИЯ ЖИВОТНОГО ---
function startZoomies() {
    body.classList.add("zoomies");
    tablet.textContent = "*носится по комнате и сбивает вазы*";
    setTimeout(() => body.classList.remove("zoomies"), 3000);
    bullik.wildness = 5;
}

function biteAction() {
    bullik.isBiting = true;
    body.classList.add("bite");
    setFace('angry');
    tablet.textContent = "*КУСЬ!*";
    
    // Вибрация телефона (если поддерживается)
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);

    setTimeout(() => {
        body.classList.remove("bite");
        bullik.isBiting = false;
        setFace('idle');
    }, 1000);
}

// Поглаживание
body.onclick = () => {
    bullik.lastAction = Date.now();
    if (bullik.wildness > 40) {
        biteAction(); // Слишком дикий — укусит!
    } else {
        bullik.energy += 5;
        bullik.wildness = Math.max(0, bullik.wildness - 5);
        setFace('happy');
        tablet.textContent = "*мурчит и ластится*";
    }
};

// --- ИНТЕЛЛЕКТ ЖИВОТНОГО ---
async function handleInput(input, isVoice = false) {
    bullik.lastAction = Date.now();
    
    // Животные реагируют на интонацию
    let prompt = `Ты - домашнее животное по имени Буллик. Твои статы: Энергия ${bullik.energy}, Дикость ${bullik.wildness}.
    ТЫ НЕ ГОВОРИШЬ КАК ЧЕЛОВЕК. Ты описываешь свои действия в звездочках и издаешь звуки.
    Если тебя зовут - ты можешь прийти или проигнорировать. 
    Если на тебя кричат - ты боишься или злишься.
    Если ты хочешь играть - ты приносишь мячик.`;

    setFace('hunt');

    try {
        const response = await fetch("https://bullik.damp-glade-283e.workers.dev/", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: prompt + " Хозяин делает: " + input })
        });
        
        const data = await response.json();
        let reply = data.answer;

        // Если это голос, Буллик реагирует активнее
        if (isVoice) bullik.wildness += 5;

        // Случайный "Тупняк"
        if (Math.random() > 0.8) {
            tablet.textContent = "*уставился в пустой угол и замер*";
            setFace('scared');
        } else {
            tablet.textContent = reply;
        }

    } catch (e) {
        biteAction(); // Глючит — кусается!
    }
}

// --- ВСПОМОГАТЕЛЬНОЕ ---
function setFace(type) {
    eyes.forEach(e => {
        e.className = 'eye';
        if (type === 'happy') e.style.borderRadius = "50% 50% 10px 10px";
        if (type === 'hunt') e.classList.add('hunt');
        if (type === 'sleep') e.style.height = "2px";
    });
}

function updateUI() {
    document.getElementById("energy-val").textContent = Math.floor(bullik.energy);
    document.getElementById("hunger-val").textContent = Math.floor(bullik.wildness);
}

document.getElementById("sendBtn").onclick = () => {
    const val = document.getElementById("textInput").value;
    handleInput(val, false);
    document.getElementById("textInput").value = "";
};

document.getElementById("micBtn").onclick = function() {
    this.classList.add("active");
    const rec = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    rec.lang = 'ru-RU';
    rec.onresult = (e) => {
        handleInput(e.results[0][0].transcript, true);
        this.classList.remove("active");
    };
    rec.start();
};
