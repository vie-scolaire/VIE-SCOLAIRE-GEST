import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography } from '../theme/theme';
import { api } from '../api/client';

const joursOrdre = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function EmploiDuTempsScreen() {
  const [eleves, setEleves] = useState([]);
  const [classeId, setClasseId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [cours, setCours] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const data = await api.getEleves();
        setEleves(data);
        const classesUniques = Array.from(
          new Map(data.map((e) => [e.classe.id, e.classe])).values()
        );
        setClasses(classesUniques);
        if (classesUniques.length > 0) setClasseId(classesUniques[0].id);
      } catch (err) {
        setErreur(err.message || 'Impossible de charger les classes.');
        setChargement(false);
      }
    })();
  }, []);

  const chargerCours = useCallback(async (id) => {
    if (!id) return;
    setChargement(true);
    setErreur('');
    try {
      const data = await api.getCoursClasse(id);
      setCours(data);
    } catch (err) {
      setErreur(err.message || "Impossible de charger l'emploi du temps.");
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerCours(classeId);
  }, [classeId, chargerCours]);

  const coursParJour = joursOrdre.map((jour) => ({
    jour,
    creneaux: cours.filter((c) => c.jourSemaine === jour),
  })).filter((j) => j.creneaux.length > 0);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
        <View style={{ flexDirection: 'row', gap: spacing.xs }}>
          {classes.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[styles.classeChip, classeId === c.id && styles.classeChipActive]}
              onPress={() => setClasseId(c.id)}
            >
              <Text style={classeId === c.id ? styles.classeChipTextActive : styles.classeChipText}>
                {c.nom}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}

      {chargement ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
      ) : (
        <ScrollView contentContainerStyle={{ paddingBottom: spacing.lg, gap: spacing.md }}>
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
            <Text style={typography.small}>Aucun cours renseigné pour cette classe.</Text>
          )}
        </ScrollView>
      )}
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
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  classeChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  classeChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  classeChipText: { fontSize: 13, color: colors.textSecondary },
  classeChipTextActive: { fontSize: 13, color: colors.surface, fontWeight: '600' },
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
