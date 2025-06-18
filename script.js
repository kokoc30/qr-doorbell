const BELL_SERVER = 'http://192.168.1.3';

const HOLD_DURATION_MS = 2000;
const button    = document.getElementById('bell-button');
const messageEl = document.getElementById('message');
const circle    = document.getElementById('progress-circle');
const audio     = document.getElementById('bell-sound');
const radius    = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

// prime the audio on first user interaction
function unlockAudio() {
  audio.play()
    .then(() => {
      audio.pause();
      audio.currentTime = 0;
    })
    .catch(() => {/* ignore */});
  button.removeEventListener('pointerdown', unlockAudio);
  button.removeEventListener('touchstart', unlockAudio);
}
button.addEventListener('pointerdown', unlockAudio, { once: true });
button.addEventListener('touchstart', unlockAudio, { once: true });

circle.style.strokeDasharray  = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

let isHolding  = false;
let sent       = false;
let startTime  = 0;
let animationFrame;
let holdTimeout;

function setProgress(progress) {
  circle.style.strokeDashoffset = circumference * (1 - progress);
}

function startHold(e) {
  if (sent) return;
  e.preventDefault();
  isHolding = true;
  button.classList.add('holding');
  messageEl.textContent = 'Keep holding…';
  messageEl.classList.remove('fade');
  startTime = Date.now();
  setProgress(0);

  function animate() {
    const elapsed = Date.now() - startTime;
    const prog = Math.min(elapsed / HOLD_DURATION_MS, 1);
    setProgress(prog);
    if (prog < 1) {
      animationFrame = requestAnimationFrame(animate);
    }
  }
  animationFrame = requestAnimationFrame(animate);
  holdTimeout = setTimeout(finishHold, HOLD_DURATION_MS);
}

function cancelHold(e) {
  if (!isHolding) return;
  e.preventDefault();
  isHolding = false;
  button.classList.remove('holding');
  cancelAnimationFrame(animationFrame);
  clearTimeout(holdTimeout);
  setProgress(0);
  messageEl.textContent = 'Press & Hold to Ring';
  messageEl.classList.add('fade');

  // notify ESP to stop buzzing (in case it was ringing)
  fetch(`${BELL_SERVER}/stop`).catch(console.error);
}

function finishHold() {
  isHolding = false;
  sent      = true;
  button.classList.remove('holding');
  button.classList.add('sent');
  cancelAnimationFrame(animationFrame);
  clearTimeout(holdTimeout);
  setProgress(1);
  messageEl.textContent = 'Signal Sent!';
  messageEl.classList.remove('fade');

  // play local audio
  audio.currentTime = 0;
  audio.play().catch(()=>{});

  // tell your ESP to start buzzing
  fetch(`${BELL_SERVER}/ring`).catch(console.error);

  // after 2s, stop everything
  setTimeout(() => {
    // turn off ESP buzzer
    fetch(`${BELL_SERVER}/stop`).catch(console.error);

    sent = false;
    button.classList.remove('sent');
    setProgress(0);
    messageEl.textContent = 'Press & Hold to Ring';
    messageEl.classList.add('fade');
  }, 2000);
}

// Attach all the event listeners
['pointerdown','mousedown','touchstart'].forEach(evt =>
  button.addEventListener(evt, startHold)
);
['pointerup','mouseup','mouseleave','touchend','touchcancel'].forEach(evt =>
  button.addEventListener(evt, cancelHold)
);
button.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') startHold(e);
});
button.addEventListener('keyup', e => {
  if (e.code === 'Space' || e.code === 'Enter') cancelHold(e);
});
