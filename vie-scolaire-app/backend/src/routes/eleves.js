const express = require('express');
const prisma = require('../prismaClient');
const { authRequired, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// GET /eleves?recherche=...
router.get('/', requireRole('cpe', 'surveillant', 'enseignant'), async (req, res) => {
  const { recherche } = req.query;

  const eleves = await prisma.eleve.findMany({
    where: {
      classe: { etablissementId: req.user.etablissementId },
      ...(recherche && {
        OR: [
          { nom: { contains: String(recherche), mode: 'insensitive' } },
          { prenom: { contains: String(recherche), mode: 'insensitive' } },
        ],
      }),
    },
    include: { classe: true },
    orderBy: { nom: 'asc' },
  });

  res.json(eleves);
});

// GET /eleves/:id — fiche complète
router.get('/:id', requireRole('cpe', 'surveillant', 'enseignant'), async (req, res) => {
  const eleve = await prisma.eleve.findUnique({
    where: { id: req.params.id },
    include: {
      classe: true,
      responsables: { include: { responsable: true } },
      absences: { orderBy: { date: 'desc' }, take: 10 },
      sanctions: { orderBy: { date: 'desc' }, take: 10 },
    },
  });

  if (!eleve) return res.status(404).json({ error: 'Élève introuvable.' });
  res.json(eleve);
});

module.exports = router;
