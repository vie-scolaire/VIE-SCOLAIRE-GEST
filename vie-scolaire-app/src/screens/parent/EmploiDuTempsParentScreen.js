import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography } from '../../theme/theme';
import { api } from '../../api/client';

const joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function EmploiDuTempsParentScreen() {
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getCoursEnfant();
        setCours(data);
      } catch (err) {
        setErreur(err.message || "Impossible de charger l'emploi du temps.");
      } finally {
        setChargement(false);
      }
    })();
  }, []);

  const coursParJour = joursOrdre
    .map((jour) => ({ jour, creneaux: cours.filter((c) => c.jourSemaine === jour) }))
    .filter((j) => j.creneaux.length > 0);

  if (chargement) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={typography.title}>Emploi du temps</Text>
      <Text style={[typography.subtitle, { marginBottom: spacing.lg }]}>Semaine en cours</Text>

      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}

      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.lg }}>
        {coursParJour.map(({ jour, creneaux }) => (
          <View key={jour}>
            <Text style={styles.jourLabel}>{jour}</Text>
            <View style={{ gap: spacing.xs }}>
              {creneaux.map((c) => (
                <View key={c.id} style={styles.creneauRow}>
                  <Text style={styles.heure}>
                    {c.heureDebut}-{c.heureFin}
                  </Text>
                  <Text style={typography.body}>{c.matiere}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        {coursParJour.length === 0 && (
          <Text style={typography.small}>Aucun cours renseigné.</Text>
        )}
      </ScrollView>
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
  jourLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  creneauRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.sm,
  },
  heure: { fontSize: 11, color: colors.textMuted, width: 76 },
});
