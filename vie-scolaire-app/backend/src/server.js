require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth');
const elevesRoutes = require('./routes/eleves');
const absencesRoutes = require('./routes/absences');
const sanctionsRoutes = require('./routes/sanctions');
const coursRoutes = require('./routes/cours');
const messagesRoutes = require('./routes/messages');
const uploadsRoutes = require('./routes/uploads');
const utilisateursRoutes = require('./routes/utilisateurs');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/eleves', elevesRoutes);
app.use('/absences', absencesRoutes);
app.use('/sanctions', sanctionsRoutes);
app.use('/cours', coursRoutes);
app.use('/messages', messagesRoutes);
app.use('/uploads', uploadsRoutes);
app.use('/utilisateurs', utilisateursRoutes);

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur.' });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`API vie scolaire à l'écoute sur le port ${PORT}`);
});
