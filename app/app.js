const STREAM_URL = 'https://s2.servicioderadio.com/8664/stream';
const INFO_URL = 'https://s2.servicioderadio.com/cp/get_info.php?p=8664';
const audio = document.getElementById('radio');
const playButton = document.getElementById('playButton');
const playIcon = document.getElementById('playIcon');
const status = document.getElementById('status');
const volume = document.getElementById('volume');
const artist = document.getElementById('artist');
const title = document.getElementById('title');
const record = document.getElementById('record');

audio.src = STREAM_URL;
audio.volume = .85;

function setPlaying(playing) {
  playIcon.textContent = playing ? 'Ⅱ' : '▶';
  playIcon.classList.toggle('pause', playing);
  record.classList.toggle('playing', playing);
  playButton.setAttribute('aria-label', playing ? 'Pausar Sonomix Radio' : 'Reproducir Sonomix Radio');
}
async function togglePlayback() {
  if (!audio.paused) { audio.pause(); return; }
  status.textContent = 'Conectando…';
  try { await audio.play(); } catch { status.textContent = 'No se pudo iniciar. Probá nuevamente.'; }
}

async function startAutomatically() {
  status.textContent = 'Conectando…';
  try {
    await audio.play();
  } catch {
    status.textContent = 'Tocá play para escuchar';
  }
}

playButton.addEventListener('click', togglePlayback);
audio.addEventListener('playing', () => { setPlaying(true); status.textContent = 'Estás escuchando Sonomix Radio'; });
audio.addEventListener('pause', () => { setPlaying(false); status.textContent = 'Pausado'; });
audio.addEventListener('waiting', () => { if (!audio.paused) status.textContent = 'Reconectando…'; });
audio.addEventListener('error', () => { setPlaying(false); status.textContent = 'Se perdió la conexión. Probá nuevamente.'; });
volume.addEventListener('input', () => { audio.volume = Number(volume.value) / 100; });

function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: title.textContent, artist: artist.textContent, album: 'Sonomix Radio', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
}
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', () => audio.play());
  navigator.mediaSession.setActionHandler('pause', () => audio.pause());
}
async function updateSong() {
  try {
    const response = await fetch(INFO_URL, { cache: 'no-store' });
    const data = await response.json();
    const current = data?.songtitle || data?.data?.songtitle || data?.title || data?.data?.title || '';
    if (!current) return;
    const cleanCurrent = String(current).replace(/\s+/g, ' ').trim();
    const match = cleanCurrent.match(/^(.+?)\s*[-–—]\s*(.+)$/);
    if (match) {
      artist.textContent = match[1].trim();
      title.textContent = match[2].trim();
    } else {
      title.textContent = cleanCurrent;
      artist.textContent = 'Sonomix Radio';
    }
    updateMediaSession();
  } catch { /* el audio continúa aunque los metadatos no respondan */ }
}
updateSong(); setInterval(updateSong, 15000);

window.addEventListener('load', () => {
  startAutomatically();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js');
});
