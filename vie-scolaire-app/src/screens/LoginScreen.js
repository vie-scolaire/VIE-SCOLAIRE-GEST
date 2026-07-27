import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState('');
  const [chargement, setChargement] = useState(false);

  async function handleLogin() {
    setErreur('');
    setChargement(true);
    try {
      await login(email.trim(), motDePasse);
    } catch (err) {
      setErreur(err.message || 'Impossible de se connecter.');
    } finally {
      setChargement(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logo}>
          <Ionicons name="school-outline" size={26} color={colors.surface} />
        </View>
        <Text style={typography.title}>Vie scolaire</Text>
        <Text style={typography.subtitle}>Connectez-vous à votre compte</Text>
      </View>

      <Text style={styles.fieldLabel}>Adresse e-mail</Text>
      <TextInput
        style={styles.input}
        placeholder="prenom.nom@etablissement.bf"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.fieldLabel}>Mot de passe</Text>
      <TextInput
        style={styles.input}
        placeholder="••••••••"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={motDePasse}
        onChangeText={setMotDePasse}
      />

      {erreur ? <Text style={styles.error}>{erreur}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={chargement}>
        {chargement ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <Text style={styles.buttonText}>Se connecter</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { color: colors.surface, fontWeight: '600', fontSize: 14 },
});
