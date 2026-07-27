import React, { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme/theme';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const statutConfig = {
  non_justifiee: { label: 'À justifier', bg: colors.dangerBg, color: colors.danger },
  justifiee: { label: 'Justifiée', bg: colors.successBg, color: colors.success },
  en_attente: { label: 'En attente', bg: colors.warningBg, color: colors.warning },
};

function AbsenceCard({ item, onJustify }) {
  const cfg = statutConfig[item.statut] || statutConfig.non_justifiee;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={typography.body}>{new Date(item.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</Text>
          <Text style={typography.small}>
            {item.heureDebut}-{item.heureFin}
            {item.matiere ? ` · ${item.matiere}` : ''}
          </Text>
        </View>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
        </View>
      </View>
      {item.statut === 'non_justifiee' && (
        <TouchableOpacity style={styles.justifyButton} onPress={() => onJustify(item)}>
          <Text style={styles.justifyButtonText}>Justifier cette absence</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function AbsencesParentScreen({ navigation }) {
  const { logout } = useAuth();
  const [absences, setAbsences] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const data = await api.getAbsencesEnfant();
      setAbsences(data);
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les absences.');
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

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={typography.title}>Absences</Text>
          <Text style={typography.subtitle}>Suivi de votre enfant</Text>
        </View>
        <TouchableOpacity onPress={logout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}

      <FlatList
        data={absences}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <AbsenceCard
            item={item}
            onJustify={(a) => navigation.navigate('JustifierAbsence', { absence: a })}
          />
        )}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
        ListEmptyComponent={<Text style={typography.small}>Aucune absence enregistrée.</Text>}
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  logoutButton: { padding: spacing.xs },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  justifyButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  justifyButtonText: { color: colors.surface, fontSize: 13, fontWeight: '600' },
});
