import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// En développement local : adresse IP locale de votre machine (pas
// "localhost", qui ne fonctionne pas depuis un téléphone physique ou un
// émulateur Android). En build EAS (preview/production), l'URL vient de
// app.json > expo.extra.apiUrl.
const API_URL_DEV = 'http://192.168.1.20:4000';

export const API_URL = __DEV__ ? API_URL_DEV : Constants.expoConfig?.extra?.apiUrl || API_URL_DEV;

async function getToken() {
  return AsyncStorage.getItem('token');
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' };

  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Erreur ${response.status}`);
  }

  return data;
}

/** Upload d'un fichier (justificatif) via multipart/form-data. */
async function uploadFichier(fileUri, fileName, mimeType) {
  const token = await getToken();
  const formData = new FormData();
  formData.append('fichier', { uri: fileUri, name: fileName, type: mimeType });

  const response = await fetch(`${API_URL}/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Ne pas fixer 'Content-Type' ici : fetch calcule la boundary multipart automatiquement.
    },
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Échec de l'envoi du fichier.");
  return data; // { url }
}

export const api = {
  login: (email, motDePasse) =>
    request('/auth/login', { method: 'POST', body: { email, motDePasse }, auth: false }),

  getEleves: (recherche = '') =>
    request(`/eleves${recherche ? `?recherche=${encodeURIComponent(recherche)}` : ''}`),
  getFicheEleve: (id) => request(`/eleves/${id}`),

  getAbsences: (periode = 'jour') => request(`/absences?periode=${periode}`),
  creerAbsence: (payload) => request('/absences', { method: 'POST', body: payload }),
  getAbsencesEnfant: () => request('/absences/enfant'),
  envoyerJustificatif: (absenceId, payload) =>
    request(`/absences/${absenceId}/justificatif`, { method: 'POST', body: payload }),
  getJustificatifsEnAttente: () => request('/absences/justificatifs'),
  traiterJustificatif: (absenceId, decision) =>
    request(`/absences/${absenceId}/justificatif`, { method: 'PATCH', body: { decision } }),
  uploadFichier,

  getSanctions: () => request('/sanctions'),
  creerSanction: (payload) => request('/sanctions', { method: 'POST', body: payload }),

  getCoursClasse: (classeId) => request(`/cours?classeId=${classeId}`),
  getCoursEnfant: () => request('/cours/enfant'),

  getMessages: () => request('/messages'),
  envoyerMessage: (payload) => request('/messages', { method: 'POST', body: payload }),
  marquerMessageLu: (id) => request(`/messages/${id}/lu`, { method: 'PATCH' }),
  getCorrespondants: () => request('/utilisateurs/correspondants'),

  enregistrerPushToken: (pushToken) =>
    request('/utilisateurs/push-token', { method: 'POST', body: { pushToken } }),
};
