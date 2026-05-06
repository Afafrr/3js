import { focusCity } from './canvas.js';

const list = document.getElementById('cityList');

list.addEventListener('click', (e) => {
  const item = e.target.closest('li');
  if (!item) return;

  const lat = parseFloat(item.dataset.lat);
  const lon = parseFloat(item.dataset.lon);

  focusCity(lat, lon);
});
