import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/theme';
import { api } from '../api/client';

function JustificatifCard({ item, onDecision, enCours }) {
  const eleve = item.absence?.eleve;
  return (
    <View style={styles.card}>
      <Text style={typography.body}>
        {eleve?.prenom} {eleve?.nom} — {eleve?.classe?.nom}
      </Text>
      <Text style={typography.small}>
        {new Date(item.absence?.date).toLocaleDateString('fr-FR')} · {item.motif}
      </Text>
      {item.description ? <Text style={[typography.small, { marginTop: 2 }]}>{item.description}</Text> : null}
      {item.fichierUrl ? (
        <Text style={[typography.small, { color: colors.accent, marginTop: 2 }]}>Pièce jointe fournie</Text>
      ) : null}

      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionButton, styles.refuseButton]}
          onPress={() => onDecision(item, 'refuse')}
          disabled={enCours}
        >
          <Ionicons name="close" size={16} color={colors.danger} />
          <Text style={[styles.actionText, { color: colors.danger }]}>Refuser</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, styles.accepteButton]}
          onPress={() => onDecision(item, 'accepte')}
          disabled={enCours}
        >
          <Ionicons name="checkmark" size={16} color={colors.success} />
          <Text style={[styles.actionText, { color: colors.success }]}>Accepter</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function JustificatifsScreen() {
  const [justificatifs, setJustificatifs] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [traitementId, setTraitementId] = useState(null);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const data = await api.getJustificatifsEnAttente();
      setJustificatifs(data);
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les justificatifs.');
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  async function handleDecision(justificatif, decision) {
    setTraitementId(justificatif.id);
    try {
      await api.traiterJustificatif(justificatif.absenceId, decision);
      setJustificatifs((prev) => prev.filter((j) => j.id !== justificatif.id));
    } catch (err) {
      setErreur(err.message || 'Impossible de traiter ce justificatif.');
    } finally {
      setTraitementId(null);
    }
  }

  if (chargement) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}
      <FlatList
        data={justificatifs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <JustificatifCard item={item} onDecision={handleDecision} enCours={traitementId === item.id} />
        )}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
        ListEmptyComponent={
          <Text style={typography.small}>Aucun justificatif en attente de traitement.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  refuseButton: { borderColor: colors.danger, backgroundColor: colors.dangerBg },
  accepteButton: { borderColor: colors.success, backgroundColor: colors.successBg },
  actionText: { fontSize: 12, fontWeight: '600' },
});
