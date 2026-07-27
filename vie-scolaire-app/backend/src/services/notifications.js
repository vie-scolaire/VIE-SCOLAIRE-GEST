const { Expo } = require('expo-server-sdk');
const prisma = require('../prismaClient');

const expo = new Expo();

/**
 * Crée une notification en base et l'envoie en push (Expo Push Service)
 * si l'utilisateur a un pushToken enregistré.
 *
 * type: 'absence' | 'sanction' | 'message' | 'justificatif'
 */
async function notifier(utilisateurId, { type, referenceId, contenu }) {
  await prisma.notification.create({
    data: { utilisateurId, type, referenceId, contenu },
  });

  const utilisateur = await prisma.utilisateur.findUnique({ where: { id: utilisateurId } });
  if (!utilisateur?.pushToken || !Expo.isExpoPushToken(utilisateur.pushToken)) return;

  try {
    await expo.sendPushNotificationsAsync([
      {
        to: utilisateur.pushToken,
        sound: 'default',
        title: 'Vie scolaire',
        body: contenu,
        data: { type, referenceId },
      },
    ]);
  } catch (err) {
    console.error('Erreur envoi push notification:', err);
  }
}

/** Notifie tous les responsables légaux d'un élève. */
async function notifierResponsables(eleveId, payload) {
  const relations = await prisma.eleveResponsable.findMany({
    where: { eleveId },
    include: { responsable: true },
  });

  for (const relation of relations) {
    if (relation.responsable.utilisateurId) {
      await notifier(relation.responsable.utilisateurId, payload);
    }
  }
}

module.exports = { notifier, notifierResponsables };
