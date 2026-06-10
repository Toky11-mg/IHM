<?php

namespace App\DataFixtures;

use App\Entity\User;
use App\Entity\Filiere;
use App\Entity\Niveau;
use App\Entity\AnneUniversitaire;
use App\Entity\Semestre;
use App\Entity\Enseignant;
use App\Entity\Etudiant;
use App\Entity\Matiere;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

class AppFixtures extends Fixture
{
    public function __construct(
        private UserPasswordHasherInterface $hasher
    ) {}

    public function load(ObjectManager $manager): void
    {
        // ===== ADMIN =====
        $admin = new User();
        $admin->setEmail('admin@univ.mg');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword($this->hasher->hashPassword($admin, 'Admin@1234'));
        $manager->persist($admin);

        // ===== FILIERE =====
        $filiere = new Filiere();
        $filiere->setNom('Informatique');
        $filiere->setCode('INFO');
        $filiere->setDescription('Filière Informatique');
        $manager->persist($filiere);

        // ===== NIVEAU =====
        $niveau = new Niveau();
        $niveau->setNom('L3');
        $niveau->setCode('L3INFO');
        $niveau->setCreditsRequis(60);
        $niveau->setFiliere($filiere);
        $manager->persist($niveau);

        // ===== ANNEE UNIVERSITAIRE =====
        $annee = new AnneUniversitaire();
        $annee->setLibelle('2024-2025');
        $annee->setDateDebut(new \DateTime('2024-10-01'));
        $annee->setDateFin(new \DateTime('2025-07-31'));
        $annee->setIsCurrent(true);
        $manager->persist($annee);

        // ===== SEMESTRE =====
        $semestre = new Semestre();
        $semestre->setNom('S5');
        $semestre->setNiveau($niveau);
        $semestre->setAnneeUniversitaire($annee);
        $semestre->setIsCloture(false);
        $semestre->setDateDebutSaisie(new \DateTime('2025-01-01'));
        $semestre->setDateFinSaisie(new \DateTime('2025-06-30'));
        $manager->persist($semestre);

        // ===== ENSEIGNANT =====
        $userEns = new User();
        $userEns->setEmail('enseignant@univ.mg');
        $userEns->setRoles(['ROLE_ENSEIGNANT']);
        $userEns->setPassword($this->hasher->hashPassword($userEns, 'Ens@1234'));
        $manager->persist($userEns);

        $enseignant = new Enseignant();
        $enseignant->setNom('RAKOTO');
        $enseignant->setPrenom('Jean');
        $enseignant->setMatricule('ENS-2020-00001');
        $enseignant->setGrade('Maitre_Assistant');
        $enseignant->setSpecialite('Algorithmique');
        $enseignant->setDateEmbauche(new \DateTime('2020-01-01'));
        $enseignant->setStatut('actif');
        $enseignant->setUser($userEns);
        $manager->persist($enseignant);

        // ===== MATIERE =====
        $matiere = new Matiere();
        $matiere->setNom('Algorithmique Avancée');
        $matiere->setCode('INFO501');
        $matiere->setCredit(4);
        $matiere->setCoefficient('3.0');
        $matiere->setType('cours');
        $matiere->setNoteCcPoids('0.40');
        $matiere->setNoteExPoids('0.60');
        $matiere->setSemestre($semestre);
        $matiere->setEnseignant($enseignant);
        $matiere->setIsActive(true);
        $manager->persist($matiere);

        // ===== ETUDIANTS (5) =====
        $noms = [
            ['ANDRIA', 'Toky', 'ETU-2024-00001'],
            ['RASOA', 'Miora', 'ETU-2024-00002'],
            ['RAIVO', 'Hery', 'ETU-2024-00003'],
            ['RAKOTO', 'Fanja', 'ETU-2024-00004'],
            ['RABE', 'Aina', 'ETU-2024-00005'],
        ];

        foreach ($noms as [$nom, $prenom, $matricule]) {
            $userEtu = new User();
            $userEtu->setEmail(strtolower($prenom) . '@univ.mg');
            $userEtu->setRoles(['ROLE_ETUDIANT']);
            $userEtu->setPassword(
                $this->hasher->hashPassword($userEtu, 'Etu@1234')
            );
            $manager->persist($userEtu);

            $etudiant = new Etudiant();
            $etudiant->setNom($nom);
            $etudiant->setPrenom($prenom);
            $etudiant->setMatricule($matricule);
            $etudiant->setDateNaissance(new \DateTime('2000-01-01'));
            $etudiant->setLieuNaissance('Antananarivo');
            $etudiant->setNationalite('Malagasy');
            $etudiant->setGenre('M');
            $etudiant->setNiveau($niveau);
            $etudiant->setFiliere($filiere);
            $etudiant->setAnneeEntree(2024);
            $etudiant->setStatut('actif');
            $etudiant->setUser($userEtu);
            $manager->persist($etudiant);
        }

        $manager->flush();
    }
}