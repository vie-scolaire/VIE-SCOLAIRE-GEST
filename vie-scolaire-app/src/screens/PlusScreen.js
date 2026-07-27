import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

const items = [
  {
    label: 'Justificatifs',
    description: 'Traiter les demandes en attente',
    icon: 'document-text-outline',
    route: 'Justificatifs',
  },
  {
    label: 'Emploi du temps',
    description: 'Consulter par classe',
    icon: 'time-outline',
    route: 'EmploiDuTemps',
  },
  {
    label: 'Messages',
    description: 'Échanger avec les parents',
    icon: 'chatbubble-outline',
    route: 'Messages',
  },
];

export default function PlusScreen({ navigation }) {
  const { utilisateur, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={20} color={colors.accent} />
        </View>
        <View>
          <Text style={typography.body}>{utilisateur?.nom}</Text>
          <Text style={typography.small}>{utilisateur?.role?.toUpperCase()}</Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        {items.map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.row}
            onPress={() => navigation.navigate(item.route)}
          >
            <View style={styles.rowIcon}>
              <Ionicons name={item.icon} size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={typography.body}>{item.label}</Text>
              <Text style={typography.small}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Ionicons name="log-out-outline" size={16} color={colors.danger} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
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
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutText: { color: colors.danger, fontSize: 14, fontWeight: '600' },
});
