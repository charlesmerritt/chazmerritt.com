import { decryptText } from './crypto-core.js';

const form = document.getElementById('unlock-form');
const input = document.getElementById('passphrase');
const errorEl = document.getElementById('error');
const chest = document.getElementById('chest');
const mount = document.getElementById('game-mount');
const payload = JSON.parse(document.getElementById('lovesick-payload').textContent);

let busy = false;

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (busy) return;
  busy = true;
  errorEl.hidden = true;

  let gameHtml;
  try {
    gameHtml = await decryptText(payload, input.value);
  } catch {
    // Wrong passphrase: AES-GCM auth tag rejects.
    busy = false;
    chest.classList.remove('shake');
    void chest.offsetWidth;           // reflow so the animation can restart
    chest.classList.add('shake');
    errorEl.hidden = false;
    input.select();
    return;
  }

  // Correct passphrase: play the unlock sequence, then mount the game.
  chest.dataset.state = 'unlocking';
  chest.addEventListener('animationend', function onDone(ev) {
    if (ev.animationName !== 'chest-open') return;
    chest.removeEventListener('animationend', onDone);
    mountGame(gameHtml);
  });
});

function mountGame(html) {
  const frame = document.createElement('iframe');
  frame.className = 'game-frame';
  frame.setAttribute('title', 'Lovesick');
  frame.srcdoc = html;
  mount.appendChild(frame);
  chest.dataset.state = 'opened';
  requestAnimationFrame(() => mount.classList.add('revealed'));
}
