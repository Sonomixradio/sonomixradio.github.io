const STREAM_URL = 'https://s2.servicioderadio.com/8664/stream';
const INFO_URL = 'https://s2.servicioderadio.com/cp/get_info.php?p=8664';
const audio = document.getElementById('audio');
const player = document.querySelector('.player');
const playBtn = document.getElementById('playBtn');
const playIcon = document.getElementById('playIcon');
const volume = document.getElementById('volume');
const song = document.getElementById('song');
const artist = document.getElementById('artist');
const container = document.getElementById('songContainer');
const status = document.getElementById('status');

audio.src = STREAM_URL;
audio.volume = Number(volume.value);

function setPlaying(playing) {
  player.classList.toggle('playing', playing);
  playIcon.textContent = playing ? 'Ⅱ' : '▶';
  playIcon.classList.toggle('pause', playing);
  playBtn.setAttribute('aria-label', playing ? 'Pausar Sonomix Radio' : 'Reproducir Sonomix Radio');
}

async function startPlayback() {
  status.textContent = 'Conectando…';
  try { await audio.play(); }
  catch { status.textContent = 'Tocá play para escuchar'; }
}

playBtn.addEventListener('click', () => {
  if (audio.paused) startPlayback();
  else audio.pause();
});
volume.addEventListener('input', () => { audio.volume = Number(volume.value); });
audio.addEventListener('playing', () => { setPlaying(true); status.textContent = 'Estás escuchando Sonomix Radio'; });
audio.addEventListener('pause', () => { setPlaying(false); status.textContent = 'Radio pausada'; });
audio.addEventListener('waiting', () => { if (!audio.paused) status.textContent = 'Reconectando…'; });
audio.addEventListener('error', () => { setPlaying(false); status.textContent = 'No se pudo conectar. Probá nuevamente.'; });

function updateScroll() {
  container.classList.remove('scroll');
  requestAnimationFrame(() => { if (song.scrollWidth > container.clientWidth) container.classList.add('scroll'); });
}

function showSong(rawTitle, directArtist) {
  const raw = String(rawTitle || '').replace(/\s+/g, ' ').trim();
  const split = raw.match(/^(.+?)\s*[-–—]\s*(.+)$/);
  if (directArtist) {
    song.textContent = raw || 'En vivo';
    artist.textContent = String(directArtist).trim();
  } else if (split) {
    song.textContent = split[2].trim();
    artist.textContent = split[1].trim();
  } else {
    song.textContent = raw || 'En vivo';
    artist.textContent = '';
  }
  updateScroll();
  updateMediaSession();
}

async function loadMetadata() {
  try {
    const response = await fetch(INFO_URL, { cache: 'no-store' });
    const data = await response.json();
    showSong(data?.songtitle || data?.data?.songtitle || data?.title || data?.data?.title, data?.artist || data?.data?.artist);
  } catch { showSong('En vivo', ''); }
}

function updateMediaSession() {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({ title: song.textContent, artist: artist.textContent || 'Sonomix Radio', album: 'Sonomix Radio', artwork: [{ src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }] });
}
if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', startPlayback);
  navigator.mediaSession.setActionHandler('pause', () => audio.pause());
}

loadMetadata();
setInterval(loadMetadata, 15000);
window.addEventListener('load', () => {
  startPlayback();
});
