import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, spacing, radius, typography } from '../theme/theme';
import { api } from '../api/client';

function initiales(prenom, nom) {
  return `${(prenom || '')[0] || ''}${(nom || '')[0] || ''}`.toUpperCase();
}

function EleveRow({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={() => onPress(item)}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initiales(item.prenom, item.nom)}</Text>
      </View>
      <View>
        <Text style={typography.body}>
          {item.prenom} {item.nom}
        </Text>
        <Text style={typography.small}>{item.classe?.nom}</Text>
      </View>
    </TouchableOpacity>
  );
}

export default function ElevesScreen({ navigation }) {
  const [recherche, setRecherche] = useState('');
  const [eleves, setEleves] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const charger = useCallback(async (q) => {
    setChargement(true);
    setErreur('');
    try {
      const data = await api.getEleves(q);
      setEleves(data);
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les élèves.');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => charger(recherche), 300); // debounce
    return () => clearTimeout(timeout);
  }, [recherche, charger]);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.search}
        placeholder="Rechercher un élève..."
        placeholderTextColor={colors.textMuted}
        value={recherche}
        onChangeText={setRecherche}
      />

      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}

      {chargement ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={eleves}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <EleveRow item={item} onPress={(e) => navigation.navigate('FicheEleve', { eleveId: e.id })} />
          )}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
          ListEmptyComponent={<Text style={typography.small}>Aucun élève trouvé.</Text>}
        />
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
  search: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
    fontSize: 14,
    color: colors.textPrimary,
    backgroundColor: colors.surface,
  },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '600', color: colors.accent },
});
