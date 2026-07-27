const express = require('express');
const prisma = require('../prismaClient');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /cours?classeId=... — emploi du temps d'une classe
router.get('/', requireRole('cpe', 'surveillant', 'enseignant'), async (req, res) => {
  const { classeId } = req.query;
  if (!classeId) return res.status(400).json({ error: 'classeId requis.' });

  const cours = await prisma.cours.findMany({
    where: { classeId: String(classeId) },
    orderBy: [{ jourSemaine: 'asc' }, { heureDebut: 'asc' }],
  });

  res.json(cours);
});

// GET /cours/enfant — emploi du temps de l'enfant du parent connecté
router.get('/enfant', requireRole('parent'), async (req, res) => {
  const responsable = await prisma.responsableLegal.findUnique({
    where: { utilisateurId: req.user.id },
    include: { eleves: { include: { eleve: true } } },
  });

  if (!responsable || responsable.eleves.length === 0) {
    return res.status(404).json({ error: 'Aucun élève rattaché à ce compte.' });
  }

  const classeId = responsable.eleves[0].eleve.classeId;

  const cours = await prisma.cours.findMany({
    where: { classeId },
    orderBy: [{ jourSemaine: 'asc' }, { heureDebut: 'asc' }],
  });

  res.json(cours);
});

module.exports = router;
