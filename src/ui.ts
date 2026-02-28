import { Configuration } from './types.js';

export function setStatus(msg: string, isError: boolean = false): void {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = msg;
  el.className = 'status' + (isError ? ' error' : '');
}

export function renderTemps(currentTemp: number | null, targetTemp: number | null): void {
  const curEl = document.getElementById('current-temp');
  const tgtEl = document.getElementById('target-temp-display');
  const ctrlEl = document.getElementById('target-temp-control');

  if (!curEl || !tgtEl || !ctrlEl) return;

  if (currentTemp !== null) {
    curEl.textContent = `${currentTemp} °C`;
    curEl.classList.remove('loading');
  } else {
    curEl.textContent = '…';
    curEl.classList.add('loading');
  }

  if (targetTemp !== null) {
    tgtEl.textContent = `${targetTemp} °C`;
    tgtEl.classList.remove('loading');
    ctrlEl.textContent = `${targetTemp} °C`;
  } else {
    tgtEl.textContent = '…';
    tgtEl.classList.add('loading');
    ctrlEl.textContent = '–';
  }
}

export function renderLight(lightOn: boolean | null): void {
  const btn = document.getElementById('light-btn');
  const icon = document.getElementById('light-icon');
  const label = document.getElementById('light-label');

  if (!btn || !icon || !label) return;

  btn.classList.remove('on', 'off', 'loading');

  if (lightOn === null) {
    btn.classList.add('loading');
    icon.textContent = '💡';
    label.textContent = 'Chargement…';
  } else if (lightOn) {
    btn.classList.add('on');
    icon.textContent = '💡';
    label.textContent = 'Lumière allumée – Éteindre';
  } else {
    btn.classList.add('off');
    icon.textContent = '🌑';
    label.textContent = 'Lumière éteinte – Allumer';
  }
}

export function populateConfigInputs(config: Configuration): void {
  const urlInput = document.getElementById('cfg-url') as HTMLInputElement | null;
  const tokenInput = document.getElementById('cfg-token') as HTMLInputElement | null;
  const climateInput = document.getElementById('cfg-climate') as HTMLInputElement | null;
  const lightInput = document.getElementById('cfg-light') as HTMLInputElement | null;

  if (urlInput) urlInput.value = config.url || '';
  if (tokenInput) tokenInput.value = config.token || '';
  if (climateInput) climateInput.value = config.climate || '';
  if (lightInput) lightInput.value = config.light || '';
}
