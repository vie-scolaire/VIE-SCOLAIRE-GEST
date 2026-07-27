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
import { useAuth } from '../context/AuthContext';

function MessageRow({ item, monId }) {
  const correspondant = item.expediteurId === monId ? item.destinataire : item.expediteur;
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={typography.body}>{correspondant?.nom}</Text>
        <Text style={typography.small}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      <Text style={[typography.small, !item.lu && item.destinataireId === monId && styles.nonLu]}>
        {item.contenu}
      </Text>
    </View>
  );
}

export default function MessagesScreen() {
  const { utilisateur } = useAuth();
  const [messages, setMessages] = useState([]);
  const [correspondants, setCorrespondants] = useState([]);
  const [chargement, setChargement] = useState(true);
  const [erreur, setErreur] = useState('');

  const [modalVisible, setModalVisible] = useState(false);
  const [destinataireId, setDestinataireId] = useState(null);
  const [contenu, setContenu] = useState('');
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    setChargement(true);
    setErreur('');
    try {
      const [messagesData, correspondantsData] = await Promise.all([
        api.getMessages(),
        api.getCorrespondants(),
      ]);
      setMessages(messagesData);
      setCorrespondants(correspondantsData);
      if (correspondantsData.length > 0 && !destinataireId) {
        setDestinataireId(correspondantsData[0].id);
      }
    } catch (err) {
      setErreur(err.message || 'Impossible de charger les messages.');
    } finally {
      setChargement(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(
    useCallback(() => {
      charger();
    }, [charger])
  );

  async function handleEnvoyer() {
    if (!destinataireId || !contenu.trim()) return;
    setEnvoi(true);
    try {
      await api.envoyerMessage({ destinataireId, contenu: contenu.trim() });
      setContenu('');
      setModalVisible(false);
      charger();
    } catch (err) {
      setErreur(err.message || "Impossible d'envoyer le message.");
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
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageRow item={item} monId={utilisateur?.id} />}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.lg }}
        ListEmptyComponent={<Text style={typography.small}>Aucun message.</Text>}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
        disabled={correspondants.length === 0}
      >
        <Ionicons name="add" size={18} color={colors.surface} />
        <Text style={styles.addButtonText}>Nouveau message</Text>
      </TouchableOpacity>
      {correspondants.length === 0 && (
        <Text style={[typography.small, { marginTop: spacing.xs, textAlign: 'center' }]}>
          Aucun correspondant disponible pour l'instant.
        </Text>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={typography.title}>Nouveau message</Text>

            <Text style={styles.fieldLabel}>Destinataire</Text>
            <View style={styles.pickerRow}>
              {correspondants.map((c) => (
                <TouchableOpacity
                  key={c.id}
                  style={[styles.pickerChip, destinataireId === c.id && styles.pickerChipActive]}
                  onPress={() => setDestinataireId(c.id)}
                >
                  <Text
                    style={destinataireId === c.id ? styles.pickerChipTextActive : styles.pickerChipText}
                  >
                    {c.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Message</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Écrire votre message..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={contenu}
              onChangeText={setContenu}
            />

            <TouchableOpacity style={styles.sendButton} onPress={handleEnvoyer} disabled={envoi}>
              {envoi ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="paper-plane-outline" size={16} color={colors.surface} />
                  <Text style={styles.addButtonText}>Envoyer</Text>
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
    marginBottom: 4,
  },
  nonLu: { fontWeight: '600', color: colors.textPrimary },
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
  },
  sendButton: {
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
