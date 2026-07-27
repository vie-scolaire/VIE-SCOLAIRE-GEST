const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const etablissement = await prisma.etablissement.create({
    data: { nom: 'Lycée Ouaga', ville: 'Ouagadougou' },
  });

  const classe = await prisma.classe.create({
    data: { nom: '2nde B', niveau: 'Seconde', etablissementId: etablissement.id },
  });

  const motDePasseHash = await bcrypt.hash('motdepasse123', 10);

  const cpe = await prisma.utilisateur.create({
    data: {
      nom: 'Mme Sanou',
      email: 'cpe@lycee-ouaga.bf',
      motDePasseHash,
      role: 'cpe',
      etablissementId: etablissement.id,
    },
  });

  const parentUtilisateur = await prisma.utilisateur.create({
    data: {
      nom: 'Mme Ouédraogo',
      email: 'parent@example.com',
      motDePasseHash,
      role: 'parent',
      etablissementId: etablissement.id,
    },
  });

  const responsable = await prisma.responsableLegal.create({
    data: {
      nom: 'Ouédraogo',
      prenom: 'Mme',
      telephone: '+226 70 XX XX XX',
      lienParente: 'Mère',
      utilisateurId: parentUtilisateur.id,
    },
  });

  const eleve = await prisma.eleve.create({
    data: {
      numero: '2451',
      nom: 'Ouédraogo',
      prenom: 'T.',
      classeId: classe.id,
      responsables: { create: { responsableId: responsable.id, contactPrincipal: true } },
    },
  });

  await prisma.absence.create({
    data: {
      eleveId: eleve.id,
      date: new Date(),
      heureDebut: '08:00',
      heureFin: '10:00',
      matiere: 'Mathématiques',
      type: 'absence',
      statut: 'non_justifiee',
      saisiParId: cpe.id,
    },
  });

  await prisma.cours.createMany({
    data: [
      { classeId: classe.id, matiere: 'Mathématiques', jourSemaine: 'Lundi', heureDebut: '08:00', heureFin: '10:00' },
      { classeId: classe.id, matiere: 'Français', jourSemaine: 'Lundi', heureDebut: '10:00', heureFin: '12:00' },
      { classeId: classe.id, matiere: 'Histoire-Géo', jourSemaine: 'Mardi', heureDebut: '08:00', heureFin: '10:00' },
      { classeId: classe.id, matiere: 'SVT', jourSemaine: 'Mardi', heureDebut: '14:00', heureFin: '16:00' },
    ],
  });

  console.log('Données de démo créées.');
  console.log('Connexion CPE   : cpe@lycee-ouaga.bf / motdepasse123');
  console.log('Connexion parent: parent@example.com / motdepasse123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
