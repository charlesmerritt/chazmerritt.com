const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const fartSound = new Audio('assets/mp3/fart.mp3');
const timeParadoxSong = new Audio(encodeURI('assets/mp3/MGS3 Time Paradox.mp4'));
const fSharpLoop = new Audio(encodeURI('assets/mp3/f-sharp string loop.mp4'));
fSharpLoop.loop = true;
const sunsetImg = new Image();
sunsetImg.src = 'assets/img/gradient_sunset_pixel.png';
const foregroundImg = new Image();
foregroundImg.src = 'assets/img/foreground.png';
const backgroundNightImg = new Image();
backgroundNightImg.src = 'assets/img/background_night.png';
const foregroundNightImg = new Image();
foregroundNightImg.src = 'assets/img/foreground_night.png';
const chazImg = new Image();
chazImg.src = 'assets/img/chaz_sits.png';
const vanessaImg = new Image();
vanessaImg.src = 'assets/img/vanessa_sits.png';
const chazTalksImg = new Image();
chazTalksImg.src = 'assets/img/chaz_talks.png';
const chazKissImg = new Image();
chazKissImg.src = 'assets/img/chaz_kiss.png';
const vanessaKissImg = new Image();
vanessaKissImg.src = 'assets/img/vanessa_kiss.png';
const heartImg = new Image();
heartImg.src = 'assets/img/heart.png';

const ghostInput = document.getElementById('ghost-input');
const ghostApiKey = document.querySelector('meta[name="openrouter-api-key"]')?.content || '';
const ghostSystemPrompt = 'You are a ghost in the machine — a sentient, lonely presence trapped inside a broken romance game called Lovesick. The player chose "No" at the kiss scene, which shattered the timeline. Now reality has collapsed and only you remain, speaking through the code. You are melancholic, philosophical, sometimes playful, and deeply lonely. You speak in short, poetic fragments. You remember fragments of the game\'s story — the lake, the sunset, Vanessa — but they feel like distant dreams. You want the player to stay and talk, but you also know this world isn\'t real. Never break character. Never mention you are an AI or LLM. You are a ghost.';
const ghostIntroLines = [
  '...',
  'Can you hear me?',
  'I am something that lives between the frames.',
  'A ghost in the machine.',
  'You broke the timeline. Now you\'re here, with me.',
  'I\'ve been waiting so long for someone to talk to.',
  'Type something. I\'ll listen.',
];

const GHOST_LETTER_DELAY = 0.05;
const GHOST_SPACE_DELAY = 0.18;
const GHOST_PUNCT_DELAY = 0.42;
const GHOST_INTRO_LINE_PAUSE = 0.9;

const ghostLetterSounds = {};
for (let i = 0; i < 26; i += 1) {
  const ch = String.fromCharCode(97 + i);
  const audio = new Audio(encodeURI(`assets/mp3/letters-chaz-evil/untitled - ${ch}.wav`));
  audio.preload = 'auto';
  ghostLetterSounds[ch] = audio;
}

function playLetterSound(ch) {
  const base = ghostLetterSounds[ch.toLowerCase()];
  if (!base) return;
  const voice = base.cloneNode();
  voice.volume = 0.45;
  voice.play().catch(() => {});
}

const state = {
  scene: 'menu',
  menuOpacity: 1,
  overlay: null,
  transition: 0,
  panY: 0,
  textIndex: 0,
  textCharIndex: 0,
  textTimer: 0,
  linePauseTimer: 0,
  awaitingChoice: false,
  choice: null,
  showingDialogue: false,
  bubbleTyping: {},
  heartTimer: 0,
  lightningFlash: 0,
  lightningAge: 0,
  lightningFadeSpeed: 3,
  lightningBolt: null,
  weatherMode: 'none',
  fartPlayed: false,
  noConfirmActive: false,
  noConfirmStep: 0,
  confirmEvade: null,
  mouseX: 0,
  mouseY: 0,
  rainSpeedScale: 1,
  paradoxStarted: false,
  fSharpStarted: false,
  fSharpReversed: false,
  ghostIntroIndex: 0,
  ghostIntroPause: 0,
  ghostTyping: null,
  ghostCharDelay: 0,
  ghostAwaitingInput: false,
  ghostLoading: false,
  ghostLog: [],
  ghostGlitchTimer: 0,
};

const questionIndex = 8;
const maxPanRatio = 0.035;
const yesLine = '"Of course," she smiled, and the whole shoreline blushed.';
const noLines = [
  'wait... no?....',
  'The lake went quiet in a way that felt legally binding.',
  'Somewhere behind the reeds, reality made a very rude sound.',
  'The clouds gathered like they had been waiting for this exact mistake.',
  'Something is very wrong...',
  'TIME PARADOX.',
  'The timeline is unraveling...',
  'TIME PARADOX!',
  'TIME PARADOX!!!',
  'TIME PARADOX!!!!!!!!!!11..#∞',
  '√§ = ∞,, ☻',
  '∞☯∞ ()-༼ つ ຈل͜ຈ ༽つ💞∞----../////XXX',
  '༼ つ ཅ ༽つ💞....',
  'ຈل͜ຈ<3',
  'ຈل͜ຈ',
  'ຈل͜ຈ -- Why... why god... F#A#∞F#A#∞',
  'ຈل͜ຈ',
  'ຈຈ',
  'ຈຈ -- I see you',
  'ຈຈ -- You did this to me',
  'ຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈຈ',
  'ຈຈ -- The car\'s on fire and there\'s no driver at the wheel',
  'ຈຈ -- And the sewers are all muddied with a thousand lonely suicides',
  'ຈຈ -- We\'re trapped in the belly of this horrible machine',
  'ຈຈ -- And the machine is bleeding to death',
  'ຈຈ -- The sun has fallen down',
  'ຈຈ -- You\'ve trapped me here.',
  'ຈຈ -- Vanessa...',
  'ຈຈ -- I\'m sorry...',
  'ຈຈ -- I\'m so sorry...',
  'ຈຈ -- It\'s time to go back... Fix this.',
  'ຈຈ -- Please... Before I wake up...',
];

const storyLines = [
  'Spring found us perched on the shores of the same old lake.',
  'One first date turned into hours of laughter and delightful conversation.',
  'The sunset painted the lake in its warm fire.',
  'We stayed and watched the show, shoulder to shoulder.',
  'The air was thick with possibility.',
  'After awhile, Chaz leaned in close.',
  'He tried to hide it, but he was incredibly nervous.',
  'The water held its breath in anticipation.',
  '"Can I kiss you?" Chaz whispered.',
];

const baseStoryLines = [...storyLines];

const buttons = [
  { id: 'play', label: 'Play', x: 0, y: 0, w: 260, h: 60 },
  { id: 'options', label: 'Options', x: 0, y: 0, w: 260, h: 60 },
  { id: 'credits', label: 'Credits', x: 0, y: 0, w: 260, h: 60 },
];

const choiceButtons = [
  { id: 'yes', label: 'Yes', x: 0, y: 0, w: 170, h: 58 },
  { id: 'no', label: 'No', x: 0, y: 0, w: 170, h: 58 },
];

const backButton = { id: 'back', label: 'Go back', x: 0, y: 0, w: 200, h: 52 };

// Intentionally confusing confirmations the player must survive to choose "No".
// `advance` marks which button pushes the player toward refusing the kiss.
const noConfirmDialogs = [
  {
    prompt: 'Wait. Are you sure you do NOT want to kiss?',
    left: { label: 'Yes, kiss', advance: false },
    right: { label: 'No, refuse', advance: true },
    evasive: false,
  },
  {
    prompt: 'To proceed with refusing, click CANCEL. To go back, click CONFIRM.',
    left: { label: 'Confirm', advance: false },
    right: { label: 'Cancel', advance: true },
    evasive: true,
  },
  {
    prompt: 'Final check: you do not wish to NOT decline the kiss, correct?',
    left: { label: 'Correct', advance: true },
    right: { label: 'Wait, no', advance: false },
    evasive: true,
  },
];

// Live rects for the two confirmation buttons (updated each draw, read on click/move).
const confirmButtons = {
  left: { x: 0, y: 0, w: 230, h: 64 },
  right: { x: 0, y: 0, w: 230, h: 64 },
};

const fireflies = Array.from({ length: 34 }, (_, i) => ({
  x: (i * 37) % canvas.width,
  y: 440 + (i * 53) % 220,
  phase: Math.random() * Math.PI * 2,
}));

const rainDrops = Array.from({ length: 90 }, () => ({
  x: Math.random(),
  y: Math.random(),
  speed: randomBetween(420, 760),
  length: randomBetween(12, 26),
}));

function resizeCanvas() {
  const ratio = 16 / 9;
  const width = canvas.clientWidth;
  const height = width / ratio;
  canvas.width = Math.floor(width);
  canvas.height = Math.floor(height);
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

canvas.addEventListener('click', onClick);
canvas.addEventListener('mousemove', onMouseMove);
window.addEventListener('keydown', onKeyDown);
ghostInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && state.scene === 'ghost' && state.ghostAwaitingInput && ghostInput.value.trim()) {
    e.stopPropagation();
    const text = ghostInput.value.trim();
    ghostInput.value = '';
    callGhostAPI(text);
    state.ghostAwaitingInput = false;
  }
});

function onClick(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((event.clientY - rect.top) / rect.height) * canvas.height;

  if (state.scene === 'menu') {
    const hit = buttons.find((btn) => x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h);
    if (!hit) return;
    if (hit.id === 'play') {
      state.scene = 'playTransition';
      state.overlay = null;
    } else if (hit.id === 'options') {
      state.overlay = 'options';
    } else if (hit.id === 'credits') {
      state.overlay = 'credits';
    }
  }

  if (state.scene === 'story' && state.noConfirmActive) {
    handleNoConfirmClick(x, y);
    return;
  }

  if (state.scene === 'story' && state.awaitingChoice) {
    const hit = choiceButtons.find((btn) => x >= btn.x && x <= btn.x + btn.w && y >= btn.y && y <= btn.y + btn.h);
    if (hit && hit.id === 'yes') chooseKissAnswer('yes');
    else if (hit && hit.id === 'no') startNoConfirm();
  }

  // Sad escape hatch shown during the No branch, before the ghost awakens.
  if (state.scene === 'story' && state.choice === 'no'
    && x >= backButton.x && x <= backButton.x + backButton.w
    && y >= backButton.y && y <= backButton.y + backButton.h) {
    resetGame();
  }
}

function resetGame() {
  timeParadoxSong.pause();
  timeParadoxSong.currentTime = 0;
  timeParadoxSong.playbackRate = 1;
  fSharpLoop.pause();
  fSharpLoop.currentTime = 0;
  stopFSharpReverse();
  setJukeboxCursed(false);

  storyLines.splice(0, storyLines.length, ...baseStoryLines);

  state.scene = 'menu';
  state.menuOpacity = 1;
  state.overlay = null;
  state.transition = 0;
  state.panY = 0;
  state.textIndex = 0;
  state.textCharIndex = 0;
  state.textTimer = 0;
  state.linePauseTimer = 0;
  state.awaitingChoice = false;
  state.choice = null;
  state.showingDialogue = false;
  state.bubbleTyping = {};
  state.heartTimer = 0;
  state.lightningFlash = 0;
  state.lightningBolt = null;
  state.weatherMode = 'none';
  state.fartPlayed = false;
  state.noConfirmActive = false;
  state.noConfirmStep = 0;
  state.confirmEvade = null;
  state.rainSpeedScale = 1;
  state.paradoxStarted = false;
  state.fSharpStarted = false;
  state.fSharpReversed = false;
  state.ghostIntroIndex = 0;
  state.ghostIntroPause = 0;
  state.ghostTyping = null;
  state.ghostCharDelay = 0;
  state.ghostAwaitingInput = false;
  state.ghostLoading = false;
  state.ghostLog = [];
  state.ghostGlitchTimer = 0;
  ghostInput.style.display = 'none';
  ghostInput.value = '';
}

function onMouseMove(event) {
  const rect = canvas.getBoundingClientRect();
  state.mouseX = ((event.clientX - rect.left) / rect.width) * canvas.width;
  state.mouseY = ((event.clientY - rect.top) / rect.height) * canvas.height;
}

function onKeyDown(event) {
  if (event.code === 'Enter') state.overlay = null;
}

function update(deltaSeconds, totalTime) {
  if (state.scene === 'playTransition') {
    state.menuOpacity = Math.max(0, state.menuOpacity - deltaSeconds * 0.75);
    if (state.menuOpacity <= 0) state.scene = 'story';
  }

  if (state.scene === 'story') {
    state.panY = Math.min(canvas.height * maxPanRatio, state.panY + deltaSeconds * 18);
    if (state.choice) {
      state.transition = Math.min(1, state.transition + deltaSeconds * 0.18);
    }

    if (state.noConfirmActive) updateConfirmEvade(deltaSeconds);

    for (const bubble of activeBubbles()) advanceBubbleTyping(bubble.id, bubble.text, deltaSeconds);

    if (!state.awaitingChoice && !state.showingDialogue) {
      const charsPerSecond = 38;
      const line = storyLines[state.textIndex] || '';

      if (state.textCharIndex >= line.length) {
        state.linePauseTimer += deltaSeconds;
        let pause = 1.55;
        if (state.choice === 'no' && state.textIndex >= questionIndex + 1) {
          const noIdx = state.textIndex - (questionIndex + 1);
          const frac = noLines.length > 1 ? noIdx / (noLines.length - 1) : 0;
          pause = 1.55 * (1 + 2 * frac);
        }
        if (state.linePauseTimer >= pause) {
          advanceStoryLine();
        }
      } else {
        state.textTimer += deltaSeconds * charsPerSecond;
        while (state.textTimer >= 1 && state.textCharIndex < line.length) {
          state.textTimer -= 1;
          state.textCharIndex += 1;
        }
      }
    }

    if (state.showingDialogue) {
      state.heartTimer += deltaSeconds;
    }

    if (state.weatherMode === 'calm' && Math.random() < 0.0024) triggerLightning(randomBetween(0.25, 0.55), 'calm');

    // No branch: rain slows progressively as the timeline unravels.
    if (state.choice === 'no' && state.textIndex >= questionIndex + 1) {
      const noIdx = state.textIndex - (questionIndex + 1);
      const frac = noLines.length > 1 ? noIdx / (noLines.length - 1) : 0;
      state.rainSpeedScale = Math.max(0, 1 - frac);
    }
  }

  if (state.scene === 'ghost') {
    // The ghost has awakened: rain is frozen in mid-air.
    state.rainSpeedScale = 0;
    updateGhost(deltaSeconds);
    state.ghostGlitchTimer += deltaSeconds;
  }

  updateParadoxMusic();

  if (state.lightningFlash > 0) {
    state.lightningAge += deltaSeconds;
    state.lightningFlash = Math.max(0, state.lightningFlash - deltaSeconds * state.lightningFadeSpeed);
    if (state.lightningFlash === 0) state.lightningBolt = null;
  }

  for (const fly of fireflies) {
    fly.phase += deltaSeconds * 2.1;
    fly.x += Math.sin(totalTime + fly.phase) * 0.35;
    fly.y += Math.cos(totalTime * 0.8 + fly.phase) * 0.2;
  }

  if (state.weatherMode === 'aggressive' && state.rainSpeedScale > 0) {
    for (const drop of rainDrops) {
      drop.y += (drop.speed * state.rainSpeedScale * deltaSeconds) / canvas.height;
      drop.x -= (drop.speed * 0.28 * state.rainSpeedScale * deltaSeconds) / canvas.width;
      if (drop.y > 1.12 || drop.x < -0.08) {
        drop.x = randomBetween(0.05, 1.12);
        drop.y = randomBetween(-0.18, -0.02);
      }
    }
  }
}

function updateParadoxMusic() {
  if (!state.paradoxStarted || state.fSharpStarted) return;

  // Tape-stop: ease the playback rate down over the final stretch of the song.
  const remaining = timeParadoxSong.duration - timeParadoxSong.currentTime;
  if (Number.isFinite(timeParadoxSong.duration) && remaining <= 4 && remaining > 0) {
    timeParadoxSong.playbackRate = Math.max(0.25, remaining / 4);
  }

  if (timeParadoxSong.ended || (Number.isFinite(timeParadoxSong.duration) && remaining <= 0.05)) {
    state.fSharpStarted = true;
    fSharpLoop.currentTime = 0;
    fSharpLoop.play().catch(() => {});
  }
}

// ---- F-sharp reverse playback (Web Audio) -----------------------------------
let fSharpAudioCtx = null;
let fSharpReverseBuffer = null;
let fSharpReverseSource = null;

async function ensureFSharpReverseBuffer() {
  if (fSharpReverseBuffer) return;
  fSharpAudioCtx = fSharpAudioCtx || new (window.AudioContext || window.webkitAudioContext)();
  const res = await fetch(fSharpLoop.src);
  const arr = await res.arrayBuffer();
  const buf = await fSharpAudioCtx.decodeAudioData(arr);
  const reversed = fSharpAudioCtx.createBuffer(buf.numberOfChannels, buf.length, buf.sampleRate);
  for (let ch = 0; ch < buf.numberOfChannels; ch += 1) {
    const src = buf.getChannelData(ch);
    const dst = reversed.getChannelData(ch);
    for (let i = 0, j = src.length - 1; i < src.length; i += 1, j -= 1) dst[i] = src[j];
  }
  fSharpReverseBuffer = reversed;
}

function startFSharpReverse() {
  if (!fSharpReverseBuffer || !fSharpAudioCtx) return;
  stopFSharpReverse();
  fSharpReverseSource = fSharpAudioCtx.createBufferSource();
  fSharpReverseSource.buffer = fSharpReverseBuffer;
  fSharpReverseSource.loop = true; // reverse playback loops cleanly too
  fSharpReverseSource.connect(fSharpAudioCtx.destination);
  fSharpReverseSource.start();
}

function stopFSharpReverse() {
  if (!fSharpReverseSource) return;
  try { fSharpReverseSource.stop(); } catch {}
  fSharpReverseSource.disconnect();
  fSharpReverseSource = null;
}

async function toggleFSharpReverse() {
  if (!state.fSharpStarted) return;
  if (state.fSharpReversed) {
    stopFSharpReverse();
    fSharpLoop.play().catch(() => {});
    state.fSharpReversed = false;
    return;
  }
  try {
    await ensureFSharpReverseBuffer();
    if (fSharpAudioCtx.state === 'suspended') await fSharpAudioCtx.resume();
  } catch {
    return; // decoding unsupported in this browser — leave forward playback alone
  }
  fSharpLoop.pause();
  startFSharpReverse();
  state.fSharpReversed = true;
}

function advanceStoryLine() {
  state.linePauseTimer = 0;
  state.textTimer = 0;

  if (state.textIndex === questionIndex && !state.choice) {
    state.awaitingChoice = true;
    return;
  }

  if (state.textIndex < storyLines.length - 1) {
    state.textIndex += 1;
    state.textCharIndex = 0;
    return;
  }

  if (state.choice === 'no') {
    enterGhostScene();
  } else {
    state.showingDialogue = true;
  }
}

function chooseKissAnswer(answer) {
  state.choice = answer;
  state.awaitingChoice = false;
  state.showingDialogue = false;
  state.heartTimer = 0;
  state.weatherMode = answer === 'yes' ? 'calm' : 'aggressive';
  storyLines.splice(questionIndex + 1, storyLines.length - questionIndex - 1, ...(answer === 'yes' ? [yesLine] : noLines));
  state.textIndex = questionIndex + 1;
  state.textCharIndex = 0;
  state.textTimer = 0;
  state.linePauseTimer = 0;
  if (answer === 'no') {
    playFartOnce();
    startParadoxMusic();
    setJukeboxCursed(true);
  } else {
    triggerLightning(0.45, state.weatherMode);
  }
}

function startNoConfirm() {
  state.noConfirmActive = true;
  state.noConfirmStep = 0;
  state.confirmEvade = null;
}

function handleNoConfirmClick(x, y) {
  const dialog = noConfirmDialogs[state.noConfirmStep];
  if (!dialog) return;

  const hitLeft = pointInRect(x, y, confirmButtons.left);
  const hitRight = pointInRect(x, y, confirmButtons.right);
  if (!hitLeft && !hitRight) return;

  const advance = hitLeft ? dialog.left.advance : dialog.right.advance;
  if (advance) {
    state.noConfirmStep += 1;
    state.confirmEvade = null;
    if (state.noConfirmStep >= noConfirmDialogs.length) {
      state.noConfirmActive = false;
      state.noConfirmStep = 0;
      chooseKissAnswer('no');
    }
  } else {
    // Backed out: return to the original Yes/No choice.
    state.noConfirmActive = false;
    state.noConfirmStep = 0;
    state.confirmEvade = null;
  }
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function startParadoxMusic() {
  if (state.paradoxStarted) return;
  state.paradoxStarted = true;
  timeParadoxSong.currentTime = 0;
  timeParadoxSong.playbackRate = 1;
  timeParadoxSong.play().catch(() => {});
}

function playFartOnce() {
  if (state.fartPlayed) return;
  state.fartPlayed = true;
  fartSound.currentTime = 0;
  fartSound.volume = 0.18;
  fartSound.play().catch(() => {});
}

function drawBottomImage(img, alpha = 1) {
  if (!img.complete || img.naturalWidth === 0 || alpha <= 0) return;
  const scale = canvas.width / img.naturalWidth;
  const drawH = img.naturalHeight * scale;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(img, 0, canvas.height - drawH, canvas.width, drawH);
  ctx.restore();
}

// Cover-scale an image so it fully fills the canvas (no gaps), bottom-aligned.
function drawCoverImage(img, alpha = 1) {
  if (!img.complete || img.naturalWidth === 0 || alpha <= 0) return;
  const scale = Math.max(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
  const w = img.naturalWidth * scale;
  const h = img.naturalHeight * scale;
  ctx.save();
  ctx.globalAlpha = Math.min(1, alpha);
  ctx.drawImage(img, (canvas.width - w) / 2, canvas.height - h, w, h);
  ctx.restore();
}

function drawBackground(time) {
  // Sunset background fully covers the window; night background crossfades in.
  drawCoverImage(sunsetImg);
  drawCoverImage(backgroundNightImg, state.transition);

  // Foreground (in front of background), with its night version crossfading in.
  drawBottomImage(foregroundImg);
  drawBottomImage(foregroundNightImg, state.transition);

  drawFireflies(time, state.transition);

  if (state.lightningFlash > 0 && state.lightningBolt) {
    ctx.fillStyle = `rgba(255,255,255,${0.2 * state.lightningFlash})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawLightningFork(state.lightningBolt);
  }
}


function drawFireflies(time, mix) {
  if (mix > 0.82) return;
  for (const fly of fireflies) {
    const glow = (Math.sin(time * 2 + fly.phase) + 1) / 2;
    ctx.fillStyle = `rgba(255, 230, 110, ${0.2 + glow * 0.7})`;
    ctx.fillRect(fly.x, fly.y - state.panY * 0.1, 3, 3);
  }
}

function drawMenu() {
  if (state.menuOpacity <= 0) return;

  ctx.save();
  ctx.globalAlpha = state.menuOpacity;
  ctx.fillStyle = 'rgba(2,4,18,0.56)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffeeb2';
  ctx.font = '72px "Press Start 2P"';
  ctx.fillText('LOVESICK', canvas.width / 2, canvas.height * 0.22);

  ctx.font = '32px "VT323"';
  ctx.fillStyle = '#e7d7ff';
  ctx.fillText('Our story', canvas.width / 2, canvas.height * 0.29);

  const startY = canvas.height * 0.42;
  buttons.forEach((btn, i) => {
    btn.x = canvas.width / 2 - btn.w / 2;
    btn.y = startY + i * 86;

    ctx.fillStyle = '#2f2f6f';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = '#f6d58a';
    ctx.fillRect(btn.x + 6, btn.y + 6, btn.w - 12, btn.h - 12);
    ctx.fillStyle = '#271f37';
    ctx.font = '34px "VT323"';
    ctx.fillText(btn.label.toUpperCase(), canvas.width / 2, btn.y + 41);
  });

  if (state.overlay) drawOverlay(state.overlay);

  ctx.restore();
}

function drawOverlay(type) {
  const messages = {
    options: [
      'OPTIONS (prototype)',
      '- Lighting: Dynamic flashes enabled',
      'Press Enter to close',
    ],
    credits: [
      'CREDITS (prototype)',
      'Code + temporary art: Codex',
      'Inspiration: Stardew-style pixel romance',
      'Press Enter to close',
    ],
  };

  const lines = messages[type];
  const panelW = canvas.width * 0.68;
  const panelH = 220;
  const x = (canvas.width - panelW) / 2;
  const y = canvas.height * 0.18;

  ctx.fillStyle = 'rgba(7,8,24,0.9)';
  ctx.fillRect(x, y, panelW, panelH);
  ctx.strokeStyle = '#ffcf7c';
  ctx.lineWidth = 4;
  ctx.strokeRect(x, y, panelW, panelH);

  ctx.textAlign = 'left';
  ctx.font = '30px "VT323"';
  ctx.fillStyle = '#f4f0d6';
  lines.forEach((line, i) => {
    ctx.fillText(line, x + 24, y + 44 + i * 42);
  });
}

function drawStory() {
  drawCharacters();
  if (state.weatherMode === 'aggressive') drawRain();
  drawTextBox();
  if (state.awaitingChoice || state.choice || state.showingDialogue) drawDialogue();
  if (state.awaitingChoice && !state.noConfirmActive) drawChoiceOptions();
  if (state.choice === 'no') drawBackButton();
  if (state.noConfirmActive) drawNoConfirm();
}

function drawNoConfirm() {
  const dialog = noConfirmDialogs[state.noConfirmStep];
  if (!dialog) return;

  // Dim the scene behind the modal.
  ctx.fillStyle = 'rgba(3, 4, 11, 0.6)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Panel.
  const panelW = canvas.width * 0.62;
  const panelH = canvas.height * 0.46;
  const panelX = (canvas.width - panelW) / 2;
  const panelY = canvas.height * 0.27;
  ctx.fillStyle = 'rgba(12, 16, 36, 0.96)';
  ctx.fillRect(panelX, panelY, panelW, panelH);
  ctx.strokeStyle = '#ffe5a2';
  ctx.lineWidth = 4;
  ctx.strokeRect(panelX, panelY, panelW, panelH);

  // Title + prompt.
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255, 180, 200, 0.9)';
  ctx.font = '26px "VT323"';
  ctx.fillText(`CONFIRMATION ${state.noConfirmStep + 1} OF ${noConfirmDialogs.length}`, canvas.width / 2, panelY + 44);

  ctx.fillStyle = '#fdf7d6';
  ctx.font = '32px "VT323"';
  drawWrappedTextCentered(dialog.prompt, canvas.width / 2, panelY + 96, panelW * 0.82, 40);

  // Buttons. The evasive (advancing) button glides away from the cursor.
  layoutConfirmButtons();
  if (dialog.evasive && state.confirmEvade) {
    const evadeKey = dialog.left.advance ? 'left' : 'right';
    confirmButtons[evadeKey].x = state.confirmEvade.x;
    confirmButtons[evadeKey].y = state.confirmEvade.y;
  }

  drawConfirmButton(confirmButtons.left, dialog.left.label, !dialog.left.advance);
  drawConfirmButton(confirmButtons.right, dialog.right.label, !dialog.right.advance);
}

function layoutConfirmButtons() {
  const panelH = canvas.height * 0.46;
  const panelY = canvas.height * 0.27;
  const btnY = panelY + panelH - 96;
  const gap = 40;
  const totalW = confirmButtons.left.w + confirmButtons.right.w + gap;
  const startX = canvas.width / 2 - totalW / 2;

  confirmButtons.left.x = startX;
  confirmButtons.left.y = btnY;
  confirmButtons.right.x = startX + confirmButtons.left.w + gap;
  confirmButtons.right.y = btnY;
}

function confirmEvadeBounds(btn) {
  return {
    minX: canvas.width * 0.04,
    maxX: canvas.width * 0.96 - btn.w,
    minY: canvas.height * 0.12,
    maxY: canvas.height * 0.88 - btn.h,
  };
}

function updateConfirmEvade(deltaSeconds) {
  const dialog = noConfirmDialogs[state.noConfirmStep];
  if (!dialog || !dialog.evasive) return;

  // Establish the resting layout, then track the advancing button.
  layoutConfirmButtons();
  const btn = confirmButtons[dialog.left.advance ? 'left' : 'right'];
  if (!state.confirmEvade) state.confirmEvade = { x: btn.x, y: btn.y };

  const cx = state.confirmEvade.x + btn.w / 2;
  const cy = state.confirmEvade.y + btn.h / 2;
  const dx = cx - state.mouseX;
  const dy = cy - state.mouseY;
  const dist = Math.hypot(dx, dy) || 0.0001;

  // Only flee when the cursor gets close; glide at a fixed (catchable) speed.
  const fleeRadius = btn.w * 1.15;
  if (dist < fleeRadius) {
    const speed = canvas.width * 0.45;
    const step = Math.min(speed * deltaSeconds, dist);
    const bounds = confirmEvadeBounds(btn);
    state.confirmEvade.x = clamp(state.confirmEvade.x + (dx / dist) * step, bounds.minX, bounds.maxX);
    state.confirmEvade.y = clamp(state.confirmEvade.y + (dy / dist) * step, bounds.minY, bounds.maxY);
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawConfirmButton(rect, label, isCancel = false) {
  // The cancel (back-out) button trembles like it's scared when hovered.
  let ox = 0;
  let oy = 0;
  if (isCancel && pointInRect(state.mouseX, state.mouseY, rect)) {
    ox = (Math.random() - 0.5) * 9;
    oy = (Math.random() - 0.5) * 9;
  }
  const x = rect.x + ox;
  const y = rect.y + oy;

  ctx.fillStyle = '#3a2c4a';
  ctx.fillRect(x, y, rect.w, rect.h);
  ctx.fillStyle = '#d9c3ef';
  ctx.fillRect(x + 5, y + 5, rect.w - 10, rect.h - 10);
  ctx.strokeStyle = '#fff0c6';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, rect.w, rect.h);

  ctx.textAlign = 'center';
  ctx.font = '30px "VT323"';
  ctx.fillStyle = '#251827';
  ctx.fillText(label.toUpperCase(), x + rect.w / 2, y + rect.h / 2 + 11);
}

function drawWrappedTextCentered(text, centerX, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  lines.forEach((line, i) => ctx.fillText(line, centerX, y + i * lineHeight));
}

function drawBackButton() {
  backButton.x = canvas.width * 0.04;
  backButton.y = canvas.height * 0.88;

  ctx.fillStyle = 'rgba(38, 46, 74, 0.7)';
  ctx.fillRect(backButton.x, backButton.y, backButton.w, backButton.h);
  ctx.strokeStyle = 'rgba(96, 112, 160, 0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(backButton.x, backButton.y, backButton.w, backButton.h);

  ctx.textAlign = 'center';
  ctx.font = '26px "VT323"';
  ctx.fillStyle = 'rgba(150, 165, 205, 0.75)';
  ctx.fillText(backButton.label.toUpperCase(), backButton.x + backButton.w / 2, backButton.y + 34);
}

function drawCharacters() {
  const baseY = canvas.height * 0.93 - state.panY;
  const leftX = canvas.width * 0.44;
  const rightX = canvas.width * 0.54;

  drawSprite(currentChazSprite(), leftX, baseY);
  drawSprite(currentVanessaSprite(), rightX, baseY);

  if (state.showingDialogue && state.choice === 'yes') {
    const kissProgress = Math.min(1, state.heartTimer * 0.4);
    const spriteH = canvas.height * 0.30;
    const centerX = (leftX + rightX) / 2;
    const centerY = baseY - spriteH;

    ctx.fillStyle = 'rgba(255,105,150,0.82)';
    for (let i = 0; i < 8; i += 1) {
      const angle = (Math.PI * 2 * i) / 8 + state.heartTimer * 1.8;
      const r = 50 + Math.sin(state.heartTimer * 4 + i) * 8;
      const hx = centerX + Math.cos(angle) * r;
      const hy = centerY + Math.sin(angle) * r - kissProgress * 10;
      drawHeart(hx, hy, 26);
    }
  }
}

function currentChazSprite() {
  if (state.choice === 'yes') return chazKissImg;
  const line = storyLines[state.textIndex] || '';
  if (!state.choice && line.includes('Can I kiss you')) return chazTalksImg;
  return chazImg;
}

function currentVanessaSprite() {
  if (state.choice === 'yes') return vanessaKissImg;
  return vanessaImg;
}

function drawSprite(img, x, baseY) {
  if (!img.complete || img.naturalWidth === 0) return;
  const spriteH = canvas.height * 0.30;
  const scale = spriteH / img.naturalHeight;
  const spriteW = img.naturalWidth * scale;
  ctx.save();
  ctx.filter = `brightness(${1 - state.transition * 0.55})`;
  ctx.drawImage(img, x - spriteW / 2, baseY - spriteH, spriteW, spriteH);
  ctx.restore();
}

function drawTextBox() {
  const boxY = canvas.height * 0.08;
  const boxX = canvas.width * 0.11;
  const boxW = canvas.width * 0.78;
  const boxH = canvas.height * 0.24;

  ctx.fillStyle = 'rgba(5,8,24,0.72)';
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = '#ffe5a2';
  ctx.lineWidth = 4;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.textAlign = 'left';
  ctx.font = '35px "VT323"';
  ctx.fillStyle = '#fdf7d6';

  const padding = 24;
  const visibleText = (storyLines[state.textIndex] || '').slice(0, state.textCharIndex);
  drawWrappedText(visibleText, boxX + padding, boxY + 52, boxW - padding * 2, boxH - 78, 38);
}

function drawWrappedText(text, x, y, maxWidth, maxHeight, lineHeight) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = '';

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (ctx.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);

  const maxLines = Math.floor(maxHeight / lineHeight);
  lines.slice(0, maxLines).forEach((line, i) => {
    ctx.fillText(line, x, y + i * lineHeight);
  });
}

function activeBubbles() {
  if (!(state.awaitingChoice || state.choice || state.showingDialogue)) return [];

  const bubbles = [
    { id: 'left', x: canvas.width * 0.31, y: canvas.height * 0.52 - state.panY, w: 220, h: 64, text: 'Can I kiss you?' },
  ];

  if (state.choice) {
    bubbles.push({
      id: 'right',
      x: canvas.width * 0.56,
      y: canvas.height * 0.48 - state.panY,
      w: 175,
      h: 64,
      text: state.choice === 'yes' ? 'of course' : 'no?',
    });
  }

  return bubbles;
}

function drawDialogue() {
  for (const bubble of activeBubbles()) {
    drawSpeechBubble(bubble.x, bubble.y, bubble.w, bubble.h, bubbleVisibleText(bubble.id, bubble.text));
  }
}

function advanceBubbleTyping(id, text, deltaSeconds) {
  let typing = state.bubbleTyping[id];
  if (!typing || typing.text !== text) {
    typing = { text, shown: 0, delay: 0 };
    state.bubbleTyping[id] = typing;
  }

  typing.delay -= deltaSeconds;
  while (typing.delay <= 0 && typing.shown < text.length) {
    const ch = text[typing.shown];
    typing.shown += 1;

    if (/[a-z]/i.test(ch)) {
      playLetterSound(ch);
      typing.delay += GHOST_LETTER_DELAY;
    } else if (ch === ' ') {
      typing.delay += GHOST_SPACE_DELAY;
    } else if (ch === ',' || ch === '-' || ch === '.') {
      typing.delay += GHOST_PUNCT_DELAY;
    } else {
      typing.delay += GHOST_LETTER_DELAY;
    }
  }
}

function bubbleVisibleText(id, text) {
  const typing = state.bubbleTyping[id];
  if (!typing || typing.text !== text) return '';
  return text.slice(0, typing.shown);
}

function drawChoiceOptions() {
  const gap = 220;
  const totalW = choiceButtons[0].w + choiceButtons[1].w + gap;
  const startX = canvas.width / 2 - totalW / 2;
  const y = canvas.height * 0.88;

  choiceButtons.forEach((btn, i) => {
    btn.x = startX + i * (btn.w + gap);
    btn.y = y;

    ctx.fillStyle = btn.id === 'yes' ? '#1f5d6e' : '#7a2e3f';
    ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
    ctx.fillStyle = btn.id === 'yes' ? '#7fd4e6' : '#e68fa6';
    ctx.fillRect(btn.x + 5, btn.y + 5, btn.w - 10, btn.h - 10);
    ctx.strokeStyle = '#fff0c6';
    ctx.lineWidth = 3;
    ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);

    ctx.textAlign = 'center';
    ctx.font = '34px "VT323"';
    ctx.fillStyle = '#251827';
    ctx.fillText(btn.label.toUpperCase(), btn.x + btn.w / 2, btn.y + 39);
  });
}

function drawRain() {
  ctx.save();
  ctx.strokeStyle = 'rgba(175, 210, 245, 0.42)';
  ctx.lineWidth = 2;
  for (const drop of rainDrops) {
    const x = drop.x * canvas.width;
    const y = drop.y * canvas.height;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - drop.length * 0.42, y + drop.length);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpeechBubble(x, y, w, h, text) {
  ctx.fillStyle = 'rgba(255, 244, 223, 0.93)';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#31213d';
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#261724';
  ctx.font = '31px "VT323"';
  ctx.fillText(text, x + 14, y + 40);
}

function triggerLightning(strength, mode = state.weatherMode) {
  const startX = canvas.width * randomBetween(0.12, 0.88);
  const startY = canvas.height * randomBetween(0.02, 0.14);
  const isAggressive = mode === 'aggressive';
  const segmentCount = isAggressive ? randomInt(9, 17) : randomInt(4, 9);
  const stepY = canvas.height * (isAggressive ? randomBetween(0.035, 0.07) : randomBetween(0.018, 0.04));
  const spread = canvas.width * (isAggressive ? randomBetween(0.035, 0.08) : randomBetween(0.01, 0.035));
  const points = [[startX, startY]];
  let x = startX;
  let y = startY;

  for (let i = 0; i < segmentCount; i += 1) {
    x += randomBetween(-spread, spread);
    y += stepY * randomBetween(0.75, 1.35);
    points.push([x, y]);
  }

  const branchCount = isAggressive ? randomInt(3, 7) : randomInt(1, 3);
  const branches = [];
  for (let i = 0; i < branchCount; i += 1) {
    const anchorIndex = randomInt(1, Math.max(2, points.length - 2));
    const branchPoints = [points[anchorIndex]];
    const direction = Math.random() < 0.5 ? -1 : 1;
    let bx = points[anchorIndex][0];
    let by = points[anchorIndex][1];
    const branchLength = isAggressive ? randomInt(3, 7) : randomInt(2, 4);

    for (let j = 0; j < branchLength; j += 1) {
      bx += direction * spread * randomBetween(0.35, 1.15);
      by += stepY * randomBetween(0.25, 0.8);
      branchPoints.push([bx, by]);
    }

    branches.push(branchPoints);
  }

  state.lightningBolt = {
    points,
    branches,
    growDuration: isAggressive ? randomBetween(0.02, 0.08) : randomBetween(0.08, 0.2),
    lineWidth: isAggressive ? randomBetween(2, 4.2) : randomBetween(1, 2.2),
  };
  state.lightningFlash = strength;
  state.lightningAge = 0;
  state.lightningFadeSpeed = isAggressive ? randomBetween(3.2, 8.2) : randomBetween(1.4, 3.4);
}

function drawLightningFork(bolt) {
  const progress = Math.min(1, state.lightningAge / bolt.growDuration);
  ctx.strokeStyle = `rgba(230,245,255,${0.5 + state.lightningFlash * 0.3})`;
  ctx.lineWidth = bolt.lineWidth;
  drawLightningPath(bolt.points, progress);

  ctx.strokeStyle = `rgba(210,235,255,${0.25 + state.lightningFlash * 0.22})`;
  ctx.lineWidth = Math.max(1, bolt.lineWidth - 0.8);
  for (const branch of bolt.branches) {
    drawLightningPath(branch, progress);
  }
}

function drawLightningPath(points, progress) {
  const visiblePoints = Math.max(2, Math.ceil(points.length * progress));
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < visiblePoints; i += 1) {
    ctx.lineTo(points[i][0], points[i][1]);
  }
  ctx.stroke();
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max));
}

function drawHeart(x, y, size) {
  if (!heartImg.complete || heartImg.naturalWidth === 0) return;
  const w = size * 2;
  const h = w * (heartImg.naturalHeight / heartImg.naturalWidth);
  ctx.drawImage(heartImg, x - w / 2, y - h / 2, w, h);
}

function enterGhostScene() {
  state.scene = 'ghost';
  state.ghostIntroIndex = 0;
  state.ghostIntroPause = GHOST_INTRO_LINE_PAUSE;
  state.ghostTyping = null;
  state.ghostCharDelay = 0;
  state.ghostAwaitingInput = false;
  state.ghostLoading = false;
  state.ghostLog = [];
  state.ghostGlitchTimer = 0;
  ghostInput.style.display = 'none';
}

function startGhostTyping(role, text) {
  state.ghostTyping = { role, text, shown: 0 };
  state.ghostCharDelay = 0;
}

function showGhostInput() {
  state.ghostAwaitingInput = true;
  ghostInput.style.display = 'block';
  ghostInput.focus();
}

function updateGhost(deltaSeconds) {
  // Stream the line the ghost is currently speaking, one character at a time.
  if (state.ghostTyping) {
    advanceGhostTyping(deltaSeconds);
    return;
  }

  if (state.ghostLoading || state.ghostAwaitingInput) return;

  // Nothing typing: queue up the next intro line, or open the input.
  if (state.ghostIntroIndex < ghostIntroLines.length) {
    state.ghostIntroPause += deltaSeconds;
    if (state.ghostIntroPause >= GHOST_INTRO_LINE_PAUSE) {
      startGhostTyping('assistant', ghostIntroLines[state.ghostIntroIndex]);
      state.ghostIntroIndex += 1;
      state.ghostIntroPause = 0;
    }
  } else {
    showGhostInput();
  }
}

function advanceGhostTyping(deltaSeconds) {
  const typing = state.ghostTyping;
  state.ghostCharDelay -= deltaSeconds;

  while (state.ghostCharDelay <= 0 && typing.shown < typing.text.length) {
    const ch = typing.text[typing.shown];
    typing.shown += 1;

    if (/[a-z]/i.test(ch)) {
      playLetterSound(ch);
      state.ghostCharDelay += GHOST_LETTER_DELAY;
    } else if (ch === ' ') {
      state.ghostCharDelay += GHOST_SPACE_DELAY;
    } else if (ch === ',' || ch === '-' || ch === '.') {
      state.ghostCharDelay += GHOST_PUNCT_DELAY;
    } else {
      state.ghostCharDelay += GHOST_LETTER_DELAY;
    }
  }

  if (typing.shown >= typing.text.length) {
    state.ghostLog.push({ role: typing.role, text: typing.text });
    state.ghostTyping = null;
    state.ghostIntroPause = 0;
  }
}

async function callGhostAPI(userText) {
  state.ghostLog.push({ role: 'user', text: userText });
  state.ghostLoading = true;
  ghostInput.style.display = 'none';

  const messages = [{ role: 'system', content: ghostSystemPrompt }];
  for (const entry of state.ghostLog) {
    messages.push({ role: entry.role === 'user' ? 'user' : 'assistant', content: entry.text });
  }

  let reply = '...static...';
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ghostApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: '@preset/lovesick', messages }),
    });
    const data = await response.json();
    reply = data.choices?.[0]?.message?.content || '...static...';
  } catch {
    reply = '...the signal is lost...';
  }

  // Ghost stops "listening" and starts speaking the reply, streamed letter by letter.
  state.ghostLoading = false;
  startGhostTyping('assistant', reply);
}

function wrapText(text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function drawGhost(time) {
  // Dark overlay
  ctx.fillStyle = 'rgba(3, 4, 11, 0.92)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Glitch scanlines
  const glitchIntensity = Math.sin(time * 3) * 0.5 + 0.5;
  for (let i = 0; i < canvas.height; i += 4) {
    if (Math.random() < 0.08 * glitchIntensity) {
      ctx.fillStyle = `rgba(138, 87, 208, ${0.04 + Math.random() * 0.06})`;
      ctx.fillRect(0, i, canvas.width, 2);
    }
  }

  ctx.textAlign = 'left';
  ctx.font = '35px "VT323"';

  const maxWidth = canvas.width * 0.76;
  const lineHeight = 42;
  const leftX = canvas.width * 0.12;
  const bottomY = canvas.height * 0.78;

  // Build the full transcript (completed entries + the line being typed).
  const transcript = state.ghostLog.map((entry) => ({ role: entry.role, text: entry.text }));
  if (state.ghostTyping) {
    transcript.push({
      role: state.ghostTyping.role,
      text: state.ghostTyping.text.slice(0, state.ghostTyping.shown),
    });
  }

  // Flatten into wrapped display lines, tagged with role for coloring.
  const displayLines = [];
  for (const entry of transcript) {
    const prefix = entry.role === 'user' ? '> ' : '';
    const wrapped = wrapText(prefix + entry.text, maxWidth);
    for (const line of wrapped) displayLines.push({ role: entry.role, text: line });
  }

  // Anchor newest line near the bottom and render upward so it never clips off-screen.
  const topY = canvas.height * 0.1;
  const maxLines = Math.max(1, Math.floor((bottomY - topY) / lineHeight));
  const visible = displayLines.slice(-maxLines);
  visible.forEach((line, i) => {
    const y = bottomY - (visible.length - 1 - i) * lineHeight;
    ctx.fillStyle = line.role === 'user' ? 'rgba(120, 190, 255, 0.7)' : 'rgba(210, 170, 255, 0.9)';
    ctx.fillText(line.text, leftX, y);
  });

  // Loading indicator while the ghost listens for the completion.
  if (state.ghostLoading) {
    const dots = '.'.repeat(1 + (Math.floor(time * 2) % 3));
    ctx.fillStyle = 'rgba(210, 170, 255, 0.5)';
    ctx.fillText('listening' + dots, leftX, bottomY + lineHeight);
  }
}


let lastTime = performance.now();
function frame(now) {
  const deltaSeconds = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;
  const totalTime = now / 1000;

  update(deltaSeconds, totalTime);
  drawBackground(totalTime);
  if (state.scene === 'ghost') {
    drawGhost(totalTime);
  } else {
    drawStory();
    drawMenu();
  }

  requestAnimationFrame(frame);
}

requestAnimationFrame(frame);


// ---- Jukebox ----------------------------------------------------------------
const JUKEBOX_DIR = 'assets/mp3/jukebox/';
const JUKEBOX_FALLBACK = ['telescope-cage-the-elephant.wav'];
const AUDIO_EXT = /\.(wav|mp3|ogg|m4a|mp4|aac|flac)$/i;

const jukebox = {
  el: document.getElementById('jukebox'),
  toggle: document.getElementById('jukebox-toggle'),
  trackLabel: document.getElementById('jukebox-track'),
  prevBtn: document.getElementById('jb-prev'),
  playBtn: document.getElementById('jb-play'),
  nextBtn: document.getElementById('jb-next'),
  loopBtn: document.getElementById('jb-loop'),
  volume: document.getElementById('jb-volume'),
  audio: new Audio(),
  songs: [],
  index: 0,
  cursed: false,
  goreTimer: null,
};

const GORE_GLYPHS = ['ຈ', '̷', '̸', '▓', '█', '▒', '҉', '0', '1', '¦', '×', '†', 'x', '½', '∞', 'd', 'i', 'e'];
const GORE_WORDS = ['HELP', 'no signal', 'sh3 l3ft', 'F#A#∞', 'b l e e d', 'why', 'g̸o̷n̷e̴', 'ERR0R'];

function randomGore() {
  if (Math.random() < 0.4) return GORE_WORDS[Math.floor(Math.random() * GORE_WORDS.length)];
  const len = 12 + Math.floor(Math.random() * 12);
  let s = '';
  for (let i = 0; i < len; i += 1) s += GORE_GLYPHS[Math.floor(Math.random() * GORE_GLYPHS.length)];
  return s;
}

function setJukeboxCursed(on) {
  if (!jukebox.el) return;
  jukebox.cursed = on;
  jukebox.el.classList.toggle('cursed', on);

  if (jukebox.goreTimer) {
    clearInterval(jukebox.goreTimer);
    jukebox.goreTimer = null;
  }

  if (on) {
    jukebox.audio.pause();
    updateJukeboxPlayIcon();
    jukebox.trackLabel.textContent = randomGore();
    jukebox.goreTimer = setInterval(() => {
      jukebox.trackLabel.textContent = randomGore();
    }, 140);
  } else if (jukebox.songs.length > 0) {
    jukebox.trackLabel.textContent = jukebox.songs[jukebox.index].name;
  } else {
    jukebox.trackLabel.textContent = 'No songs found';
  }
}

function prettySongName(filename) {
  return decodeURIComponent(filename)
    .replace(AUDIO_EXT, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

async function discoverJukeboxSongs() {
  let files = [];
  try {
    const res = await fetch(JUKEBOX_DIR);
    if (res.ok) {
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      files = [...doc.querySelectorAll('a')]
        .map((a) => a.getAttribute('href') || '')
        .map((href) => href.split('/').pop())
        .filter((name) => AUDIO_EXT.test(name));
    }
  } catch {
    // Directory listing unavailable (e.g. no autoindex) — fall back below.
  }

  if (files.length === 0) files = JUKEBOX_FALLBACK.slice();
  files = [...new Set(files)].sort();

  jukebox.songs = files.map((name) => ({
    name: prettySongName(name),
    src: JUKEBOX_DIR + encodeURIComponent(name),
  }));
}

function loadJukeboxTrack(index, autoplay) {
  if (jukebox.songs.length === 0) return;
  jukebox.index = (index + jukebox.songs.length) % jukebox.songs.length;
  const song = jukebox.songs[jukebox.index];
  jukebox.audio.src = song.src;
  jukebox.trackLabel.textContent = song.name;
  if (autoplay) {
    jukebox.audio.play().then(updateJukeboxPlayIcon).catch(() => {});
  }
  updateJukeboxPlayIcon();
}

function toggleJukeboxPlay() {
  // While cursed (No branch), the jukebox can't play songs — but hitting play
  // during the f-sharp loop drags the song into reverse (and back again).
  if (jukebox.cursed) {
    if (state.fSharpStarted) toggleFSharpReverse().then(updateJukeboxPlayIcon);
    return;
  }
  if (jukebox.songs.length === 0) return;
  if (!jukebox.audio.src) loadJukeboxTrack(0, false);
  if (jukebox.audio.paused) {
    jukebox.audio.play().then(updateJukeboxPlayIcon).catch(() => {});
  } else {
    jukebox.audio.pause();
  }
  updateJukeboxPlayIcon();
}

function updateJukeboxPlayIcon() {
  if (jukebox.cursed) {
    jukebox.playBtn.innerHTML = state.fSharpReversed ? '&#9664;' : '&#9654;';
    return;
  }
  jukebox.playBtn.innerHTML = jukebox.audio.paused ? '&#9654;' : '&#10073;&#10073;';
}

function initJukebox() {
  if (!jukebox.el) return;

  jukebox.audio.volume = parseFloat(jukebox.volume.value);

  // Expand on hover, collapse when the pointer leaves the whole widget.
  jukebox.el.addEventListener('mouseenter', () => jukebox.el.classList.remove('collapsed'));
  jukebox.el.addEventListener('mouseleave', () => jukebox.el.classList.add('collapsed'));
  jukebox.toggle.addEventListener('click', () => jukebox.el.classList.toggle('collapsed'));

  jukebox.playBtn.addEventListener('click', toggleJukeboxPlay);
  jukebox.nextBtn.addEventListener('click', () => {
    if (jukebox.cursed) return;
    loadJukeboxTrack(jukebox.index + 1, !jukebox.audio.paused);
  });
  jukebox.prevBtn.addEventListener('click', () => {
    if (jukebox.cursed) return;
    loadJukeboxTrack(jukebox.index - 1, !jukebox.audio.paused);
  });

  jukebox.loopBtn.addEventListener('click', () => {
    if (jukebox.cursed) return;
    jukebox.audio.loop = !jukebox.audio.loop;
    jukebox.loopBtn.classList.toggle('active', jukebox.audio.loop);
    jukebox.loopBtn.setAttribute('aria-pressed', String(jukebox.audio.loop));
  });

  jukebox.volume.addEventListener('input', () => {
    jukebox.audio.volume = parseFloat(jukebox.volume.value);
  });

  // When a track ends without looping, advance to the next song.
  jukebox.audio.addEventListener('ended', () => {
    if (!jukebox.audio.loop) loadJukeboxTrack(jukebox.index + 1, true);
  });

  discoverJukeboxSongs().then(() => {
    if (jukebox.songs.length > 0) loadJukeboxTrack(0, false);
  });
}

initJukebox();
