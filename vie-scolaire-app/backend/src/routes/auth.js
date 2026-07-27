const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const prisma = require('../prismaClient');

const router = express.Router();

const loginSchema = z.object({
  email: z.string().email(),
  motDePasse: z.string().min(1),
});

router.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Email et mot de passe requis.' });
  }
  const { email, motDePasse } = parsed.data;

  const utilisateur = await prisma.utilisateur.findUnique({ where: { email } });
  if (!utilisateur || !utilisateur.actif) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const motDePasseValide = await bcrypt.compare(motDePasse, utilisateur.motDePasseHash);
  if (!motDePasseValide) {
    return res.status(401).json({ error: 'Identifiants invalides.' });
  }

  const token = jwt.sign(
    {
      id: utilisateur.id,
      role: utilisateur.role,
      etablissementId: utilisateur.etablissementId,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

  res.json({
    token,
    utilisateur: {
      id: utilisateur.id,
      nom: utilisateur.nom,
      email: utilisateur.email,
      role: utilisateur.role,
    },
  });
});

module.exports = router;
