import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme/theme';

export default function ConfirmationScreen({ route, navigation }) {
  const { absence, motif } = route.params;

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Ionicons name="checkmark" size={28} color={colors.success} />
      </View>
      <Text style={styles.title}>Justificatif envoyé</Text>
      <Text style={styles.subtitle}>
        Le CPE a été notifié et traitera votre demande sous 48h.
      </Text>

      <View style={styles.summaryCard}>
        <Text style={typography.cardLabel}>Absence</Text>
        <Text style={[typography.body, { marginBottom: spacing.sm }]}>
          {absence.date}
          {absence.matiere ? ` · ${absence.matiere}` : ''}
        </Text>
        <Text style={typography.cardLabel}>Motif</Text>
        <Text style={typography.body}>{motif}</Text>
      </View>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.navigate('AbsencesParent')}
      >
        <Text style={styles.backButtonText}>Retour aux absences</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 1.5,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, marginBottom: spacing.xs },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  backButton: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  backButtonText: { fontSize: 14, color: colors.textPrimary, fontWeight: '600' },
});
