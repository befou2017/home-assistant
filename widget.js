    // ── Configuration ────────────────────────────────────────────────
    const STORAGE_KEY = 'ha_widget_config';

    function loadConfig() {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
      } catch {
        return {};
      }
    }

    function saveConfig(cfg) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    }

    let config = loadConfig();

    // Populate config inputs from stored values
    function populateConfigInputs() {
      document.getElementById('cfg-url').value = config.url || '';
      document.getElementById('cfg-token').value = config.token || '';
      document.getElementById('cfg-climate').value = config.climate || '';
      document.getElementById('cfg-light').value = config.light || '';
    }

    populateConfigInputs();

    // ── Config panel toggle ───────────────────────────────────────────
    document.getElementById('toggle-config').addEventListener('click', () => {
      document.getElementById('config-panel').classList.toggle('open');
    });

    document.getElementById('config-save').addEventListener('click', () => {
      const rawUrl = document.getElementById('cfg-url').value.replace(/\/$/, '').trim();
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
        token: document.getElementById('cfg-token').value,
        climate: document.getElementById('cfg-climate').value.trim(),
        light: document.getElementById('cfg-light').value.trim(),
      };
      saveConfig(config);
      document.getElementById('config-panel').classList.remove('open');
      setStatus('Configuration enregistrée.', false);
      refresh();
    });

    // ── API helpers ───────────────────────────────────────────────────
    function headers() {
      return {
        'Authorization': `Bearer ${config.token}`,
        'Content-Type': 'application/json',
      };
    }

    async function getState(entityId) {
      const res = await fetch(`${config.url}/api/states/${entityId}`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    async function callService(domain, service, data) {
      const res = await fetch(`${config.url}/api/services/${domain}/${service}`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    }

    // ── State ─────────────────────────────────────────────────────────
    let currentTemp = null;
    let targetTemp = null;
    let lightOn = null;

    function setStatus(msg, isError = false) {
      const el = document.getElementById('status');
      el.textContent = msg;
      el.className = 'status' + (isError ? ' error' : '');
    }

    function renderTemps() {
      const curEl = document.getElementById('current-temp');
      const tgtEl = document.getElementById('target-temp-display');
      const ctrlEl = document.getElementById('target-temp-control');

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

    function renderLight() {
      const btn = document.getElementById('light-btn');
      const icon = document.getElementById('light-icon');
      const label = document.getElementById('light-label');

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

    // ── Fetch & refresh ───────────────────────────────────────────────
    async function refresh() {
      if (!config.url || !config.token) {
        setStatus('Configurez l\'URL et le token ci-dessous.', true);
        return;
      }

      try {
        const promises = [];

        if (config.climate) {
          promises.push(
            getState(config.climate).then(data => {
              currentTemp = data.attributes.current_temperature ?? null;
              targetTemp = data.attributes.temperature ?? null;
            })
          );
        }

        if (config.light) {
          promises.push(
            getState(config.light).then(data => {
              lightOn = data.state === 'on';
            })
          );
        }

        await Promise.all(promises);
        setStatus(`Mis à jour : ${new Date().toLocaleTimeString('fr-FR')}`);
      } catch (err) {
        setStatus(`Erreur : ${err.message}`, true);
      }

      renderTemps();
      renderLight();
    }

    // ── Buttons ───────────────────────────────────────────────────────
    document.getElementById('btn-minus').addEventListener('click', async () => {
      if (!config.climate || targetTemp === null) return;
      const newTemp = targetTemp - 1;
      try {
        await callService('climate', 'set_temperature', {
          entity_id: config.climate,
          temperature: newTemp,
        });
        targetTemp = newTemp;
        renderTemps();
        setStatus(`Température réglée à ${newTemp} °C`);
      } catch (err) {
        setStatus(`Erreur : ${err.message}`, true);
      }
    });

    document.getElementById('btn-plus').addEventListener('click', async () => {
      if (!config.climate || targetTemp === null) return;
      const newTemp = targetTemp + 1;
      try {
        await callService('climate', 'set_temperature', {
          entity_id: config.climate,
          temperature: newTemp,
        });
        targetTemp = newTemp;
        renderTemps();
        setStatus(`Température réglée à ${newTemp} °C`);
      } catch (err) {
        setStatus(`Erreur : ${err.message}`, true);
      }
    });

    document.getElementById('light-btn').addEventListener('click', async () => {
      if (!config.light || lightOn === null) return;
      try {
        const service = lightOn ? 'turn_off' : 'turn_on';
        await callService('light', service, { entity_id: config.light });
        lightOn = !lightOn;
        renderLight();
        setStatus(`Lumière ${lightOn ? 'allumée' : 'éteinte'}`);
      } catch (err) {
        setStatus(`Erreur : ${err.message}`, true);
      }
    });

    // ── Initial load & auto-refresh every 30 s ────────────────────────
    refresh();
    setInterval(refresh, 30000);
