const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { authRequired, requireRole } = require('../middleware/auth');
const { notifierResponsables } = require('../services/notifications');

const router = express.Router();
router.use(authRequired);

const creerSanctionSchema = z.object({
  eleveId: z.string(),
  type: z.enum(['avertissement', 'retenue', 'exclusion_temporaire', 'conseil_discipline']),
  motif: z.string().min(1),
  date: z.string(),
  duree: z.string().optional(),
});

const libellesSanction = {
  avertissement: 'Avertissement',
  retenue: 'Retenue',
  exclusion_temporaire: 'Exclusion temporaire',
  conseil_discipline: 'Conseil de discipline',
};

router.get('/', requireRole('cpe', 'surveillant'), async (req, res) => {
  const sanctions = await prisma.sanction.findMany({
    where: { eleve: { classe: { etablissementId: req.user.etablissementId } } },
    include: { eleve: { include: { classe: true } } },
    orderBy: { date: 'desc' },
  });
  res.json(sanctions);
});

router.post('/', requireRole('cpe', 'surveillant'), async (req, res) => {
  const parsed = creerSanctionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.flatten() });
  }

  const sanction = await prisma.sanction.create({
    data: {
      ...parsed.data,
      date: new Date(parsed.data.date),
      auteurId: req.user.id,
    },
  });

  await notifierResponsables(parsed.data.eleveId, {
    type: 'sanction',
    referenceId: sanction.id,
    contenu: `${libellesSanction[parsed.data.type]} — ${parsed.data.motif}`,
  });

  await prisma.sanction.update({ where: { id: sanction.id }, data: { notifieParent: true } });

  res.status(201).json(sanction);
});

module.exports = router;
