const textBox = document.querySelector(".text")
const input = document.getElementById("input")
const send = document.getElementById("send")
const mic = document.getElementById("mic")
const eyes = document.querySelectorAll(".eye")
const mouth = document.getElementById("mouth")

/* ===== СОСТОЯНИЕ ПИТОМЦА ===== */

let state = JSON.parse(localStorage.getItem("petState")) || {
mood:60,
energy:70,
trust:0,
ownerKnown:false,
lastSeen:Date.now(),
personality:{
playful:Math.random(),
lazy:Math.random(),
brave:Math.random()
}
}

let memory = JSON.parse(localStorage.getItem("petMemory")) || []

function save(){
localStorage.setItem("petState",JSON.stringify(state))
localStorage.setItem("petMemory",JSON.stringify(memory))
}

/* ===== ЭМОЦИИ ===== */

function eyesColor(c){
eyes.forEach(e=>e.style.background=c)
mouth.style.borderColor=c
}

function emotion(type){

if(type==="happy"){ eyesColor("#00ffd0"); mouth.style.height="20px" }
if(type==="love"){ eyesColor("#ff4da6") }
if(type==="angry"){ eyesColor("#ff3b3b"); mouth.style.height="5px" }
if(type==="sad"){ eyesColor("#4da6ff") }
if(type==="sleep"){ eyesColor("#777"); mouth.style.height="0px" }
if(type==="scared"){ eyesColor("#ffaa00") }
if(type==="idle"){ eyesColor("#00eaff"); mouth.style.height="18px" }

}

/* ===== ПЕЧАТЬ ТЕКСТА ===== */

async function speak(text){
textBox.textContent=""
for(let l of text){
textBox.textContent+=l
await new Promise(r=>setTimeout(r,18))
}
}

/* ===== МОЗГ ===== */

async function askAI(msg,voice=false){

state.lastSeen=Date.now()

/* реакция на незнакомца */
if(!state.ownerKnown){
emotion("scared")
await speak("кто ты?..")
state.ownerKnown=true
state.trust+=20
save()
return
}

/* настроение влияет на эмоцию */
if(state.mood<20) emotion("sad")
else emotion("sleep")

memory.push({role:"user",content:msg})
if(memory.length>40) memory=memory.slice(-40)

save()

try{

const res = await fetch("https://bullik.damp-glade-283e.workers.dev/",{
method:"POST",
headers:{ "Content-Type":"application/json" },
body:JSON.stringify({
message:msg,
memory,
mood:state.mood,
personality:state.personality,
trust:state.trust
})
})

const data = await res.json()
let answer = data.answer || "мур?"

memory.push({role:"assistant",content:answer})

/* эмоция по смыслу */
if(answer.match(/люб|рад|обож/)) emotion("love")
else if(answer.match(/злю|уходи/)) emotion("angry")
else if(answer.match(/груст|печал/)) emotion("sad")
else emotion("happy")

await speak(answer)

/* изменения характера */
state.trust+=2
state.mood+=3
state.energy-=2

save()

setTimeout(()=>emotion("idle"),1500)

}catch{
await speak("я не понял…")
emotion("sad")
}
}

/* ===== КНОПКИ ===== */

send.onclick=()=>{
if(!input.value.trim()) return
askAI(input.value)
input.value=""
}

input.addEventListener("keydown",e=>{
if(e.key==="Enter") send.click()
})

/* голос */
mic.onclick=()=>{

const Rec = window.SpeechRecognition||window.webkitSpeechRecognition
if(!Rec){ textBox.textContent="нет микрофона"; return }

const r = new Rec()
r.lang="ru-RU"

emotion("scared")

r.onresult=e=>{
askAI(e.results[0][0].transcript,true)
}

r.start()
}

/* ===== ПОГЛАДИТЬ ===== */

document.getElementById("pet").onclick=()=>{
state.mood+=10
state.trust+=5
emotion("love")
textBox.textContent="муррр 🤍"
save()
setTimeout(()=>emotion("idle"),1000)
}

/* ===== ЖИЗНЕННЫЙ ЦИКЛ ===== */

setInterval(()=>{

let now = Date.now()
let absent = (now - state.lastSeen)/1000

state.mood -= 0.5
state.energy -= 0.3

/* скучает */
if(absent>60){
emotion("sad")
textBox.textContent="где ты?.."
}

/* спит */
if(state.energy<=10){
emotion("sleep")
textBox.textContent="хррр..."
}

/* проснулся */
if(state.energy<40 && Math.random()<0.2){
state.energy+=30
emotion("happy")
textBox.textContent="я проснулся!"
}

save()

},15000)

/* случайное поведение */
setInterval(()=>{

let r=Math.random()

if(r<0.2){ emotion("happy") }
else if(r<0.4){ emotion("sad") }
else if(r<0.6){ emotion("love") }

},20000)

emotion("idle")
