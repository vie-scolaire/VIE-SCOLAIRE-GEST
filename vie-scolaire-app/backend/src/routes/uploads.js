const express = require('express');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { authRequired } = require('../middleware/auth');

const router = express.Router();
router.use(authRequired);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => {
    const nomUnique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`;
    cb(null, nomUnique);
  },
});

const TYPES_AUTORISES = ['image/jpeg', 'image/png', 'application/pdf'];

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 Mo
  fileFilter: (req, file, cb) => {
    if (!TYPES_AUTORISES.includes(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé (JPEG, PNG ou PDF uniquement).'));
    }
    cb(null, true);
  },
});

// POST /uploads — champ "fichier" en multipart/form-data
router.post('/', upload.single('fichier'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Aucun fichier reçu.' });

  const url = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.status(201).json({ url });
});

router.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "Échec de l'upload." });
});

module.exports = router;
