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

const statutConfig = {
  non_justifiee: { label: 'Non justifiée', bg: colors.dangerBg, color: colors.danger },
  justifiee: { label: 'Justifiée', bg: colors.successBg, color: colors.success },
  en_attente: { label: 'En attente', bg: colors.warningBg, color: colors.warning },
};

function AbsenceRow({ item }) {
  const cfg =
    item.type === 'retard'
      ? { label: 'Retard', bg: colors.warningBg, color: colors.warning }
      : statutConfig[item.statut] || statutConfig.non_justifiee;

  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={typography.body}>
          {item.eleve?.prenom} {item.eleve?.nom}
        </Text>
        <Text style={typography.small}>
          {item.eleve?.classe?.nom} · {item.heureDebut}-{item.heureFin}
          {item.matiere ? ` · ${item.matiere}` : ''}
        </Text>
      </View>
      <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
        <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>
    </View>
  );
}

export default function AbsencesScreen() {
  const [filtre, setFiltre] = useState('jour');
  const [absences, setAbsences] = useState([]);
  const [eleves, setEleves] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [eleveId, setEleveId] = useState(null);
  const [type, setType] = useState('absence');
  const [heureDebut, setHeureDebut] = useState('08:00');
  const [heureFin, setHeureFin] = useState('10:00');
  const [matiere, setMatiere] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async (periode) => {
    setChargement(true);
    setErreur('');
    try {
      const [absencesData, elevesData] = await Promise.all([api.getAbsences(periode), api.getEleves()]);
      setAbsences(absencesData);
      setEleves(elevesData);
      if (elevesData.length > 0 && !eleveId) setEleveId(elevesData[0].id);
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les absences.');
    } finally {
      setChargement(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger(filtre);
    }, [charger, filtre])
  );

  async function handleSave() {
    if (!eleveId) return;
    setEnvoi(true);
    try {
      await api.creerAbsence({
        eleveId,
        date: new Date().toISOString(),
        heureDebut,
        heureFin,
        matiere: matiere || undefined,
        type,
      });
      setModalVisible(false);
      setMatiere('');
      charger(filtre);
    } catch (err) {
      setErreur(err.message || "Impossible d'enregistrer l'absence.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, filtre === 'jour' && styles.filterBtnActive]}
          onPress={() => setFiltre('jour')}
        >
          <Text style={filtre === 'jour' ? styles.filterTextActive : styles.filterText}>
            Aujourd'hui
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterBtn, filtre === 'semaine' && styles.filterBtnActive]}
          onPress={() => setFiltre('semaine')}
        >
          <Text style={filtre === 'semaine' ? styles.filterTextActive : styles.filterText}>
            Semaine
          </Text>
        </TouchableOpacity>
      </View>

      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}

      {chargement ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={absences}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <AbsenceRow item={item} />}
          contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
          ListEmptyComponent={<Text style={typography.small}>Aucune absence sur cette période.</Text>}
        />
      )}

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={18} color={colors.surface} />
        <Text style={styles.addButtonText}>Saisir une absence</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.title}>Saisir une absence</Text>

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

            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.pickerRow}>
              {[
                { value: 'absence', label: 'Absence' },
                { value: 'retard', label: 'Retard' },
              ].map((t) => (
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

            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Heure début</Text>
                <TextInput style={styles.input} value={heureDebut} onChangeText={setHeureDebut} placeholder="08:00" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Heure fin</Text>
                <TextInput style={styles.input} value={heureFin} onChangeText={setHeureFin} placeholder="10:00" />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Matière (optionnel)</Text>
            <TextInput style={styles.input} value={matiere} onChangeText={setMatiere} placeholder="Mathématiques" />

            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={envoi}>
              {envoi ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="checkmark" size={18} color={colors.surface} />
                  <Text style={styles.addButtonText}>Enregistrer l'absence</Text>
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
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  filterText: { fontSize: 13, color: colors.textSecondary },
  filterTextActive: { fontSize: 13, color: colors.surface, fontWeight: '600' },
  errorText: { color: colors.danger, fontSize: 12, marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing.md,
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
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
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
