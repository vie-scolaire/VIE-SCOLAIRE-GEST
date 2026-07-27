const express = require('express');
const { z } = require('zod');
const prisma = require('../prismaClient');
const { authRequired } = require('../middleware/auth');
const { notifier } = require('../services/notifications');

const router = express.Router();
router.use(authRequired);

const creerMessageSchema = z.object({
  destinataireId: z.string(),
  eleveId: z.string().optional(),
  contenu: z.string().min(1),
});

// GET /messages — conversations de l'utilisateur connecté, groupées par correspondant
router.get('/', async (req, res) => {
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ expediteurId: req.user.id }, { destinataireId: req.user.id }],
    },
    include: {
      expediteur: { select: { id: true, nom: true, role: true } },
      destinataire: { select: { id: true, nom: true, role: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(messages);
});

// POST /messages — envoyer un message
router.post('/', async (req, res) => {
  const parsed = creerMessageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const message = await prisma.message.create({
    data: { ...parsed.data, expediteurId: req.user.id },
  });

  await notifier(parsed.data.destinataireId, {
    type: 'message',
    referenceId: message.id,
    contenu: `Nouveau message de ${req.user.id === message.expediteurId ? '' : ''}`.trim() ||
      'Vous avez reçu un nouveau message.',
  });

  res.status(201).json(message);
});

// PATCH /messages/:id/lu — marquer un message comme lu
router.patch('/:id/lu', async (req, res) => {
  const message = await prisma.message.findUnique({ where: { id: req.params.id } });
  if (!message || message.destinataireId !== req.user.id) {
    return res.status(404).json({ error: 'Message introuvable.' });
  }

  const updated = await prisma.message.update({
    where: { id: req.params.id },
    data: { lu: true },
  });

  res.json(updated);
});

module.exports = router;
