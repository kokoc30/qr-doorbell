const HOLD_DURATION_MS = 2000;
const button    = document.getElementById('bell-button');
const messageEl = document.getElementById('message');
const circle    = document.getElementById('progress-circle');
const audio     = document.getElementById('bell-sound');
const radius    = circle.r.baseVal.value;
const circumference = 2 * Math.PI * radius;

circle.style.strokeDasharray  = `${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

let isHolding  = false;
let sent       = false;
let startTime  = 0;
let animationFrame;
let holdTimeout;

function setProgress(progress) {
  const offset = circumference * (1 - progress);
  circle.style.strokeDashoffset = offset;
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

  // Play the door‐bell sound
  if (audio) {
    audio.currentTime = 0;
    audio.play().catch(() => {
      // some browsers require user interaction, but long‐press should qualify
    });
  }

  // TODO: Replace with fetch('/ring') to your ESP endpoint
  console.log('Bell signal sent to Arduino!');

  setTimeout(() => {
    sent = false;
    button.classList.remove('sent');
    setProgress(0);
    messageEl.textContent = 'Press & Hold to Ring';
    messageEl.classList.add('fade');
  }, 2000);
}

// Attach event listeners
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
