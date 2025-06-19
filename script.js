// ----------------------------------------------------------------
// MQTT setup over WebSockets
// ----------------------------------------------------------------
// Note: HiveMQ’s public WS broker. No credentials needed.
const MQTT_URL   = 'wss://broker.hivemq.com:8000/mqtt';
const MQTT_TOPIC = 'qr-doorbell/doorbell';
const client     = mqtt.connect(MQTT_URL);

client.on('connect', () => {
  console.log('✅ MQTT connected');
});

client.on('error', err => {
  console.error('❌ MQTT error', err);
});

// ----------------------------------------------------------------
// Door-bell UI logic (unchanged except for MQTT publishes)
// ----------------------------------------------------------------
const HOLD_DURATION_MS = 2000;
const button    = document.getElementById('bell-button');
const messageEl = document.getElementById('message');
const circle    = document.getElementById('progress-circle');
const audio     = document.getElementById('bell-sound');
const radius    = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

// unlock audio on first interaction
function unlockAudio() {
  audio.play()
    .then(() => { audio.pause(); audio.currentTime = 0; })
    .catch(()=>{/* ignore */});
  button.removeEventListener('pointerdown', unlockAudio);
  button.removeEventListener('touchstart', unlockAudio);
}
button.addEventListener('pointerdown', unlockAudio, { once: true });
button.addEventListener('touchstart', unlockAudio,  { once: true });

circle.style.strokeDasharray  = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

let isHolding=false, sent=false, startTime=0, animationFrame, holdTimeout;
function setProgress(p){ circle.style.strokeDashoffset = circumference*(1-p); }

function startHold(e){
  if(sent) return;
  e.preventDefault();
  isHolding=true;
  button.classList.add('holding');
  messageEl.textContent='Keep holding…';
  messageEl.classList.remove('fade');
  startTime=Date.now();
  setProgress(0);

  function animate(){
    const prog=Math.min((Date.now()-startTime)/HOLD_DURATION_MS,1);
    setProgress(prog);
    if(prog<1) animationFrame=requestAnimationFrame(animate);
  }
  animationFrame=requestAnimationFrame(animate);
  holdTimeout=setTimeout(finishHold, HOLD_DURATION_MS);
}

function cancelHold(e){
  if(!isHolding) return;
  e.preventDefault();
  isHolding=false;
  button.classList.remove('holding');
  cancelAnimationFrame(animationFrame);
  clearTimeout(holdTimeout);
  setProgress(0);
  messageEl.textContent='Press & Hold to Ring';
  messageEl.classList.add('fade');

  // stop buzzer remotely
  client.publish(MQTT_TOPIC, 'stop');
}

function finishHold(){
  isHolding=false;
  sent=true;
  button.classList.remove('holding');
  button.classList.add('sent');
  cancelAnimationFrame(animationFrame);
  clearTimeout(holdTimeout);
  setProgress(1);
  messageEl.textContent='Signal Sent!';
  messageEl.classList.remove('fade');

  // play local click
  audio.currentTime=0;
  audio.play().catch(()=>{});

  // start buzzer remotely
  client.publish(MQTT_TOPIC, 'ring');

  // reset after 2s
  setTimeout(()=>{
    client.publish(MQTT_TOPIC, 'stop');
    sent=false;
    button.classList.remove('sent');
    setProgress(0);
    messageEl.textContent='Press & Hold to Ring';
    messageEl.classList.add('fade');
  }, 2000);
}

// attach UI listeners
['pointerdown','mousedown','touchstart'].forEach(evt=>button.addEventListener(evt, startHold));
['pointerup','mouseup','mouseleave','touchend','touchcancel'].forEach(evt=>button.addEventListener(evt, cancelHold));
button.addEventListener('keydown', e=>{ if(e.code==='Space'||e.code==='Enter') startHold(e); });
button.addEventListener('keyup',   e=>{ if(e.code==='Space'||e.code==='Enter') cancelHold(e); });
