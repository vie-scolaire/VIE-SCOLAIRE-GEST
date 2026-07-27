import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/theme';
import { api } from '../api/client';

function initiales(prenom, nom) {
  return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
}

export default function FicheEleveScreen({ route }) {
  const { eleveId } = route.params;
  const [eleve, setEleve] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getFicheEleve(eleveId);
        setEleve(data);
      } catch (err) {
        setErreur(err.message || 'Impossible de charger la fiche élève.');
      } finally {
        setChargement(false);
      }
    })();
  }, [eleveId]);

  if (chargement) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (erreur || !eleve) {
    return (
      <View style={styles.container}>
        <Text style={typography.body}>{erreur || 'Élève introuvable.'}</Text>
      </View>
    );
  }

  const responsablePrincipal = eleve.responsables?.[0]?.responsable;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: spacing.xl }}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initiales(eleve.prenom, eleve.nom)}</Text>
        </View>
        <View>
          <Text style={typography.title}>
            {eleve.prenom} {eleve.nom}
          </Text>
          <Text style={typography.subtitle}>
            {eleve.classe?.nom} · N° {eleve.numero}
          </Text>
        </View>
      </View>

      {responsablePrincipal && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Responsable légal</Text>
          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={14} color={colors.textSecondary} />
            <Text style={typography.body}>
              {responsablePrincipal.prenom} {responsablePrincipal.nom}
            </Text>
          </View>
          {responsablePrincipal.telephone && (
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={14} color={colors.textSecondary} />
              <Text style={typography.body}>{responsablePrincipal.telephone}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={typography.cardLabel}>Absences</Text>
          <Text style={typography.cardValue}>{eleve.absences?.length ?? 0}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={typography.cardLabel}>Sanctions</Text>
          <Text style={typography.cardValue}>{eleve.sanctions?.length ?? 0}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Historique récent</Text>
      <View style={{ gap: spacing.xs }}>
        {(eleve.absences || []).map((a) => (
          <View key={a.id} style={styles.historyRow}>
            <Text style={typography.small}>
              {a.type === 'retard' ? 'Retard' : 'Absence'} {a.matiere ? `— ${a.matiere}` : ''}
            </Text>
            <Text style={typography.small}>{new Date(a.date).toLocaleDateString('fr-FR')}</Text>
          </View>
        ))}
        {(eleve.absences || []).length === 0 && (
          <Text style={typography.small}>Aucun historique d'absence.</Text>
        )}
      </View>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 16, fontWeight: '600', color: colors.accent },
  section: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
});
