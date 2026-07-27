const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { authRequired, requireRole } = require('../middleware/auth');
const { notifierResponsables, notifier } = require('../services/notifications');

const router = express.Router();
router.use(authRequired);

const creerAbsenceSchema = z.object({
  eleveId: z.string(),
  date: z.string(),
  heureDebut: z.string(),
  heureFin: z.string(),
  matiere: z.string().optional(),
  type: z.enum(['absence', 'retard']),
  dureeRetardMin: z.number().optional(),
});

// GET /absences?periode=jour|semaine — vue CPE
router.get('/', requireRole('cpe', 'surveillant', 'enseignant'), async (req, res) => {
  const { periode } = req.query;
  const maintenant = new Date();
  let dateMin = new Date(maintenant.setHours(0, 0, 0, 0));

  if (periode === 'semaine') {
    dateMin.setDate(dateMin.getDate() - dateMin.getDay());
  }

  const absences = await prisma.absence.findMany({
    where: {
      eleve: { classe: { etablissementId: req.user.etablissementId } },
      date: { gte: dateMin },
    },
    include: { eleve: { include: { classe: true } }, justificatif: true },
    orderBy: { date: 'desc' },
  });

  res.json(absences);
});

// GET /absences/justificatifs — justificatifs en attente de traitement (CPE)
router.get('/justificatifs', requireRole('cpe', 'surveillant'), async (req, res) => {
  const justificatifs = await prisma.justificatif.findMany({
    where: {
      statut: 'en_attente',
      absence: { eleve: { classe: { etablissementId: req.user.etablissementId } } },
    },
    include: { absence: { include: { eleve: { include: { classe: true } } } } },
    orderBy: { dateEnvoi: 'desc' },
  });

  res.json(justificatifs);
});

// GET /absences/enfant — absences de l'enfant du parent connecté
router.get('/enfant', requireRole('parent'), async (req, res) => {
  const responsable = await prisma.responsableLegal.findUnique({
    where: { utilisateurId: req.user.id },
    include: { eleves: { include: { eleve: true } } },
  });

  if (!responsable) return res.status(404).json({ error: 'Aucun élève rattaché à ce compte.' });

  const eleveIds = responsable.eleves.map((e) => e.eleveId);

  const absences = await prisma.absence.findMany({
    where: { eleveId: { in: eleveIds } },
    include: { justificatif: true },
    orderBy: { date: 'desc' },
  });

  res.json(absences);
});

// POST /absences — saisie d'une absence par le CPE/surveillant
router.post('/', requireRole('cpe', 'surveillant', 'enseignant'), async (req, res) => {
  const parsed = creerAbsenceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const absence = await prisma.absence.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      saisiParId: req.user.id,
    },
  });

  const libelle = parsed.data.type === 'retard' ? 'Retard' : 'Absence';
  await notifierResponsables(parsed.data.eleveId, {
    type: 'absence',
    referenceId: absence.id,
    contenu: `${libelle} enregistrée le ${new Date(parsed.data.date).toLocaleDateString('fr-FR')}${
      parsed.data.matiere ? ` en ${parsed.data.matiere}` : ''
    }.`,
  });

  res.status(201).json(absence);
});

// POST /absences/:id/justificatif — envoi d'un justificatif par le parent
router.post('/:id/justificatif', requireRole('parent'), async (req, res) => {
  const { motif, description, fichierUrl } = req.body;
  if (!motif) return res.status(400).json({ error: 'Le motif est requis.' });

  const absence = await prisma.absence.findUnique({ where: { id: req.params.id } });
  if (!absence) return res.status(404).json({ error: 'Absence introuvable.' });

  const justificatif = await prisma.justificatif.create({
    data: {
      absenceId: req.params.id,
      motif,
      description,
      fichierUrl,
      envoyeParId: req.user.id,
    },
  });

  await prisma.absence.update({
    where: { id: req.params.id },
    data: { statut: 'en_attente' },
  });

  // Notifie tous les CPE/surveillants de l'établissement de l'élève concerné
  const cpes = await prisma.utilisateur.findMany({
    where: {
      role: { in: ['cpe', 'surveillant'] },
      etablissementId: req.user.etablissementId,
    },
  });
  for (const cpe of cpes) {
    await notifier(cpe.id, {
      type: 'justificatif',
      referenceId: justificatif.id,
      contenu: 'Un nouveau justificatif est en attente de traitement.',
    });
  }

  res.status(201).json(justificatif);
});

// PATCH /absences/:id/justificatif — accepter ou refuser un justificatif (CPE)
router.patch('/:id/justificatif', requireRole('cpe', 'surveillant'), async (req, res) => {
  const { decision } = req.body; // 'accepte' | 'refuse'
  if (!['accepte', 'refuse'].includes(decision)) {
    return res.status(400).json({ error: "decision doit être 'accepte' ou 'refuse'." });
  }

  const justificatif = await prisma.justificatif.update({
    where: { absenceId: req.params.id },
    data: { statut: decision, traiteParId: req.user.id, dateTraitement: new Date() },
  });

  const absence = await prisma.absence.update({
    where: { id: req.params.id },
    data: { statut: decision === 'accepte' ? 'justifiee' : 'non_justifiee' },
  });

  await notifierResponsables(absence.eleveId, {
    type: 'justificatif',
    referenceId: justificatif.id,
    contenu:
      decision === 'accepte'
        ? 'Votre justificatif a été accepté.'
        : 'Votre justificatif a été refusé — merci de contacter le CPE.',
  });

  res.json({ justificatif, absence });
});

module.exports = router;
