const express = require('express');
const prisma = require('../prismaClient');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

// POST /utilisateurs/push-token
router.post('/push-token', async (req, res) => {
  const { pushToken } = req.body;
  if (!pushToken) return res.status(400).json({ error: 'pushToken requis.' });

  await prisma.utilisateur.update({
    where: { id: req.user.id },
    data: { pushToken },
  });

  res.json({ ok: true });
});

// GET /utilisateurs/correspondants — destinataires possibles pour la messagerie,
// selon le rôle de l'utilisateur connecté (un parent ne voit que le personnel
// de la vie scolaire, le CPE ne voit que les parents des élèves de son établissement).
router.get('/correspondants', async (req, res) => {
  const rolesCibles = req.user.role === 'parent' ? ['cpe', 'surveillant'] : ['parent'];

  const correspondants = await prisma.utilisateur.findMany({
    where: {
      etablissementId: req.user.etablissementId,
      role: { in: rolesCibles },
      id: { not: req.user.id },
    },
    select: { id: true, nom: true, role: true },
    orderBy: { nom: 'asc' },
  });

  res.json(correspondants);
});

module.exports = router;
