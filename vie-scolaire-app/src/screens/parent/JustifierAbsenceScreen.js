import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, radius, typography } from '../../theme/theme';
import { api } from '../../api/client';

const motifsJustification = ['Maladie', 'Rendez-vous médical', 'Raison familiale', 'Autre'];

export default function JustifierAbsenceScreen({ route, navigation }) {
  const { absence } = route.params;
  const [motif, setMotif] = useState(motifsJustification[0]);
  const [precisions, setPrecisions] = useState('');
  const [fichier, setFichier] = useState(null); // { uri, name, type }
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState('');

  async function choisirFichier() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErreur("Autorisation d'accès aux photos refusée.");
      return;
    }

    const resultat = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!resultat.canceled && resultat.assets?.[0]) {
      const asset = resultat.assets[0];
      setFichier({
        uri: asset.uri,
        name: asset.fileName || `justificatif-${Date.now()}.jpg`,
        type: asset.mimeType || 'image/jpeg',
      });
    }
  }

  async function handleEnvoyer() {
    setEnvoi(true);
    setErreur('');
    try {
      let fichierUrl;
      if (fichier) {
        const { url } = await api.uploadFichier(fichier.uri, fichier.name, fichier.type);
        fichierUrl = url;
      }

      await api.envoyerJustificatif(absence.id, { motif, description: precisions, fichierUrl });
      navigation.navigate('Confirmation', { absence, motif });
    } catch (err) {
      setErreur(err.message || "Impossible d'envoyer le justificatif.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={typography.title}>Justifier une absence</Text>
      <Text style={[typography.subtitle, { marginBottom: spacing.lg }]}>
        {new Date(absence.date).toLocaleDateString('fr-FR')} · {absence.heureDebut}-{absence.heureFin}
        {absence.matiere ? ` · ${absence.matiere}` : ''}
      </Text>

      <Text style={styles.fieldLabel}>Motif</Text>
      <View style={styles.pickerRow}>
        {motifsJustification.map((m) => (
          <TouchableOpacity
            key={m}
            style={[styles.pickerChip, motif === m && styles.pickerChipActive]}
            onPress={() => setMotif(m)}
          >
            <Text style={motif === m ? styles.pickerChipTextActive : styles.pickerChipText}>{m}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.fieldLabel}>Précisions</Text>
      <TextInput
        style={styles.textArea}
        placeholder="Ajouter un détail si nécessaire..."
        placeholderTextColor={colors.textMuted}
        multiline
        numberOfLines={3}
        value={precisions}
        onChangeText={setPrecisions}
      />

      <Text style={styles.fieldLabel}>Justificatif</Text>
      <TouchableOpacity style={styles.uploadBox} onPress={choisirFichier}>
        {fichier ? (
          <>
            <Image source={{ uri: fichier.uri }} style={styles.preview} />
            <Text style={styles.uploadText}>Toucher pour changer de fichier</Text>
          </>
        ) : (
          <>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.textMuted} />
            <Text style={styles.uploadText}>Ajouter une photo</Text>
          </>
        )}
      </TouchableOpacity>

      {erreur ? <Text style={styles.errorText}>{erreur}</Text> : null}

      <TouchableOpacity style={styles.sendButton} onPress={handleEnvoyer} disabled={envoi}>
        {envoi ? (
          <ActivityIndicator color={colors.surface} />
        ) : (
          <>
            <Ionicons name="paper-plane-outline" size={16} color={colors.surface} />
            <Text style={styles.sendButtonText}>Envoyer au CPE</Text>
          </>
        )}
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
  fieldLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.md,
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
  uploadBox: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  preview: { width: 64, height: 64, borderRadius: radius.sm },
  uploadText: { fontSize: 12, color: colors.textSecondary },
  errorText: { color: colors.danger, fontSize: 12, marginTop: spacing.sm },
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
  sendButtonText: { color: colors.surface, fontWeight: '600', fontSize: 14 },
});
