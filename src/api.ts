import { Configuration, HAState } from './types.js';

function headers(config: Configuration): HeadersInit {
  return {
    'Authorization': `Bearer ${config.token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchHA(url: string, options: RequestInit): Promise<any> {
  let res: Response;
  try {
    res = await fetch(url, options);
  } catch (err: any) {
    throw new Error(`Erreur réseau (vérifiez l'URL, le serveur ou CORS) : ${err.message}`);
  }

  if (!res.ok) {
    if (res.status === 401) {
      throw new Error('Non autorisé (Token invalide)');
    } else if (res.status === 404) {
      throw new Error('Entité introuvable (404)');
    } else {
      throw new Error(`Erreur HTTP ${res.status}`);
    }
  }
  return res.json();
}

export async function getState(config: Configuration, entityId: string): Promise<HAState> {
  if (!config.url || !config.token) {
    throw new Error("Configuration incomplete");
  }
  return await fetchHA(`${config.url}/api/states/${entityId}`, {
    headers: headers(config),
  });
}

export async function callService(config: Configuration, domain: string, service: string, data: any): Promise<any> {
  if (!config.url || !config.token) {
    throw new Error("Configuration incomplete");
  }
  return await fetchHA(`${config.url}/api/services/${domain}/${service}`, {
    method: 'POST',
    headers: headers(config),
    body: JSON.stringify(data),
  });
}
