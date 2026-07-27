import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../theme/theme';
import { api } from '../api/client';

const typesSanctions = [
  { value: 'avertissement', label: 'Avertissement' },
  { value: 'retenue', label: 'Retenue' },
  { value: 'exclusion_temporaire', label: 'Exclusion temporaire' },
  { value: 'conseil_discipline', label: 'Conseil de discipline' },
];

const statutConfig = {
  programmee: { bg: colors.warningBg, color: colors.warning },
  effectuee: { bg: colors.successBg, color: colors.success },
  annulee: { bg: colors.dangerBg, color: colors.danger },
};

function SanctionCard({ item }) {
  const cfg = statutConfig[item.statut] || statutConfig.programmee;
  const typeLabel = typesSanctions.find((t) => t.value === item.type)?.label || item.type;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={typography.body}>
          {item.eleve?.prenom} {item.eleve?.nom} — {item.eleve?.classe?.nom}
        </Text>
        <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
          <Text style={[styles.badgeText, { color: cfg.color }]}>{typeLabel}</Text>
        </View>
      </View>
      <Text style={typography.small}>
        Motif : {item.motif} — {new Date(item.date).toLocaleDateString('fr-FR')}
      </Text>
    </View>
  );
}

export default function SanctionsScreen() {
  const [sanctions, setSanctions] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [eleveId, setEleveId] = useState(null);
  const [type, setType] = useState(typesSanctions[0].value);
  const [motif, setMotif] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const [sanctionsData, elevesData] = await Promise.all([api.getSanctions(), api.getEleves()]);
      setSanctions(sanctionsData);
      setEleves(elevesData);
      if (elevesData.length > 0) setEleveId(elevesData[0].id);
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les sanctions.');
    } finally {
      setChargement(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  async function handleSave() {
    if (!eleveId || !motif.trim()) return;
    setEnvoi(true);
    try {
      await api.creerSanction({
        eleveId,
        type,
        motif,
        date: new Date().toISOString(),
      });
      setModalVisible(false);
      setMotif('');
      charger();
    } catch (err) {
      setErreur(err.message || "Impossible d'enregistrer la sanction.");
    } finally {
      setEnvoi(false);
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
        data={sanctions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <SanctionCard item={item} />}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
        ListEmptyComponent={<Text style={typography.small}>Aucune sanction enregistrée.</Text>}
      />

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={18} color={colors.surface} />
        <Text style={styles.addButtonText}>Nouvelle sanction</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.title}>Nouvelle sanction</Text>

            <Text style={styles.fieldLabel}>Élève</Text>
            <View style={styles.pickerRow}>
              {eleves.map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={[styles.pickerChip, eleveId === e.id && styles.pickerChipActive]}
                  onPress={() => setEleveId(e.id)}
                >
                  <Text style={eleveId === e.id ? styles.pickerChipTextActive : styles.pickerChipText}>
                    {e.prenom} {e.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Type de sanction</Text>
            <View style={styles.pickerRow}>
              {typesSanctions.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[styles.pickerChip, type === t.value && styles.pickerChipActive]}
                  onPress={() => setType(t.value)}
                >
                  <Text style={type === t.value ? styles.pickerChipTextActive : styles.pickerChipText}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Motif</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Décrire le motif de la sanction..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
              value={motif}
              onChangeText={setMotif}
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={envoi}>
              {envoi ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.surface} />
                  <Text style={styles.addButtonText}>Enregistrer la sanction</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: spacing.sm }}>
              <Text style={{ textAlign: 'center', color: colors.textSecondary }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  addButtonText: { color: colors.surface, fontWeight: '600', fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  pickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  pickerChip: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  pickerChipText: { fontSize: 12, color: colors.textSecondary },
  pickerChipTextActive: { fontSize: 12, color: colors.surface, fontWeight: '600' },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    textAlignVertical: 'top',
    marginTop: spacing.xs,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: radius.sm,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
});
