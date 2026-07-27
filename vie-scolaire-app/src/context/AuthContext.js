import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../api/client';
import { enregistrerPourNotifications } from '../notifications/pushSetup';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [utilisateur, setUtilisateur] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    (async () => {
      const saved = await AsyncStorage.getItem('utilisateur');
      if (saved) setUtilisateur(JSON.parse(saved));
      setChargement(false);
    })();
  }, []);

  async function login(email, motDePasse) {
    const { token, utilisateur: user } = await api.login(email, motDePasse);
    await AsyncStorage.setItem('token', token);
    await AsyncStorage.setItem('utilisateur', JSON.stringify(user));
    setUtilisateur(user);

    // Enregistre le token push après connexion (ne bloque pas la connexion en cas d'échec).
    try {
      const pushToken = await enregistrerPourNotifications();
      if (pushToken) await api.enregistrerPushToken(pushToken);
    } catch (err) {
      console.warn('Notifications push non configurées :', err.message);
    }
  }

  async function logout() {
    await AsyncStorage.multiRemove(['token', 'utilisateur']);
    setUtilisateur(null);
  }

  return (
    <AuthContext.Provider value={{ utilisateur, chargement, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
