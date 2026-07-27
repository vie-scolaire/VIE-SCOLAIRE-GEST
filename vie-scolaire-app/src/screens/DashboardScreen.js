import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/theme';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

function StatCard({ label, value, valueColor }) {
  return (
    <View style={styles.statCard}>
      <Text style={typography.cardLabel}>{label}</Text>
      <Text style={[typography.cardValue, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export default function DashboardScreen() {
  const { utilisateur } = useAuth();
  const [absences, setAbsences] = useState([]);
  const [sanctions, setSanctions] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    setErreur('');
    try {
      const [absencesData, sanctionsData] = await Promise.all([
        api.getAbsences('jour'),
        api.getSanctions(),
      ]);
      setAbsences(absencesData);
      setSanctions(sanctionsData);
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les données.');
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  if (chargement) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const nonJustifiees = absences.filter((a) => a.statut === 'non_justifiee').length;
  const retards = absences.filter((a) => a.type === 'retard').length;
  const sanctionsActives = sanctions.filter((s) => s.statut === 'programmee').length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: spacing.xl }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={charger} />}
    >
      <View style={styles.header}>
        <View>
          <Text style={typography.title}>Bonjour, {utilisateur?.nom}</Text>
          <Text style={typography.subtitle}>{utilisateur?.role?.toUpperCase()}</Text>
        </View>
        <View style={styles.bellButton}>
          <Ionicons name="notifications-outline" size={20} color={colors.accent} />
        </View>
      </View>

      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}

      <View style={styles.statsGrid}>
        <StatCard label="Absences du jour" value={absences.length} />
        <StatCard label="Non justifiées" value={nonJustifiees} valueColor={colors.danger} />
        <StatCard label="Retards" value={retards} />
        <StatCard label="Sanctions actives" value={sanctionsActives} />
      </View>

      <Text style={styles.sectionLabel}>Absences récentes</Text>
      <View style={{ gap: spacing.sm }}>
        {absences.slice(0, 5).map((a) => (
          <View key={a.id} style={styles.activityRow}>
            <View
              style={[
                styles.activityIcon,
                { backgroundColor: a.statut === 'non_justifiee' ? colors.dangerBg : colors.warningBg },
              ]}
            >
              <Ionicons
                name={a.statut === 'non_justifiee' ? 'close' : 'alert-outline'}
                size={16}
                color={a.statut === 'non_justifiee' ? colors.danger : colors.warning}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>
                {a.eleve?.prenom} {a.eleve?.nom} — {a.matiere || 'Journée'}
              </Text>
              <Text style={typography.small}>{a.eleve?.classe?.nom}</Text>
            </View>
          </View>
        ))}
        {absences.length === 0 && <Text style={typography.small}>Aucune absence aujourd'hui.</Text>}
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
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    width: '48%',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
