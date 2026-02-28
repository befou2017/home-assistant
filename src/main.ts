import { loadConfig, saveConfig } from './config.js';
import { getState, callService } from './api.js';
import { setStatus, renderTemps, renderLight, populateConfigInputs } from './ui.js';

let config = loadConfig();
let currentTemp: number | null = null;
let targetTemp: number | null = null;
let lightOn: boolean | null = null;

populateConfigInputs(config);

const toggleConfigBtn = document.getElementById('toggle-config');
const configPanel = document.getElementById('config-panel');
if (toggleConfigBtn && configPanel) {
  toggleConfigBtn.addEventListener('click', () => {
    configPanel.classList.toggle('open');
  });
}

const configSaveBtn = document.getElementById('config-save');
if (configSaveBtn && configPanel) {
  configSaveBtn.addEventListener('click', () => {
    const urlInput = document.getElementById('cfg-url') as HTMLInputElement | null;
    const tokenInput = document.getElementById('cfg-token') as HTMLInputElement | null;
    const climateInput = document.getElementById('cfg-climate') as HTMLInputElement | null;
    const lightInput = document.getElementById('cfg-light') as HTMLInputElement | null;

    if (!urlInput || !tokenInput || !climateInput || !lightInput) return;

    const rawUrl = urlInput.value.replace(/\/$/, '').trim();
    try {
      const parsed = new URL(rawUrl);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        setStatus('URL invalide : seuls http et https sont acceptés.', true);
        return;
      }
    } catch {
      setStatus('URL invalide. Exemple : http://homeassistant.local:8123', true);
      return;
    }

    config = {
      url: rawUrl,
      token: tokenInput.value,
      climate: climateInput.value.trim(),
      light: lightInput.value.trim(),
    };
    saveConfig(config);
    configPanel.classList.remove('open');
    setStatus('Configuration enregistrée.', false);
    refresh();
  });
}

async function refresh(): Promise<void> {
  if (!config.url || !config.token) {
    setStatus('Configurez l\'URL et le token ci-dessous.', true);
    return;
  }

  try {
    const promises: Promise<void>[] = [];

    if (config.climate) {
      promises.push(
        getState(config, config.climate).then(data => {
          currentTemp = data.attributes.current_temperature ?? null;
          targetTemp = data.attributes.temperature ?? null;
        })
      );
    }

    if (config.light) {
      promises.push(
        getState(config, config.light).then(data => {
          lightOn = data.state === 'on';
        })
      );
    }

    await Promise.all(promises);
    setStatus(`Mis à jour : ${new Date().toLocaleTimeString('fr-FR')}`);
  } catch (err: any) {
    setStatus(`Erreur : ${err.message}`, true);
  }

  renderTemps(currentTemp, targetTemp);
  renderLight(lightOn);
}

const btnMinus = document.getElementById('btn-minus');
if (btnMinus) {
  btnMinus.addEventListener('click', async () => {
    if (!config.climate || targetTemp === null) return;
    const newTemp = targetTemp - 1;
    try {
      await callService(config, 'climate', 'set_temperature', {
        entity_id: config.climate,
        temperature: newTemp,
      });
      targetTemp = newTemp;
      renderTemps(currentTemp, targetTemp);
      setStatus(`Température réglée à ${newTemp} °C`);
    } catch (err: any) {
      setStatus(`Erreur : ${err.message}`, true);
    }
  });
}

const btnPlus = document.getElementById('btn-plus');
if (btnPlus) {
  btnPlus.addEventListener('click', async () => {
    if (!config.climate || targetTemp === null) return;
    const newTemp = targetTemp + 1;
    try {
      await callService(config, 'climate', 'set_temperature', {
        entity_id: config.climate,
        temperature: newTemp,
      });
      targetTemp = newTemp;
      renderTemps(currentTemp, targetTemp);
      setStatus(`Température réglée à ${newTemp} °C`);
    } catch (err: any) {
      setStatus(`Erreur : ${err.message}`, true);
    }
  });
}

const lightBtn = document.getElementById('light-btn');
if (lightBtn) {
  lightBtn.addEventListener('click', async () => {
    if (!config.light || lightOn === null) return;
    try {
      const service = lightOn ? 'turn_off' : 'turn_on';
      await callService(config, 'light', service, { entity_id: config.light });
      lightOn = !lightOn;
      renderLight(lightOn);
      setStatus(`Lumière ${lightOn ? 'allumée' : 'éteinte'}`);
    } catch (err: any) {
      setStatus(`Erreur : ${err.message}`, true);
    }
  });
}

// ── Initial load & auto-refresh every 30 s ────────────────────────
refresh();
setInterval(refresh, 30000);
