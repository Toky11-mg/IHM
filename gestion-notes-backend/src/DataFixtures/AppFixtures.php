<?php

namespace App\DataFixtures;

use App\Entity\User;
use App\Entity\Filiere;
use App\Entity\Niveau;
use App\Entity\AnneUniversitaire;
use App\Entity\Semestre;
use App\Entity\Enseignant;
use App\Entity\Etudiant;
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
        // ===== ADMINS =====
        $admin = new User();
        $admin->setEmail('admin@univ.mg');
        $admin->setRoles(['ROLE_ADMIN']);
        $admin->setPassword($this->hasher->hashPassword($admin, 'Admin@1234'));
        $manager->persist($admin);

        $superAdmin = new User();
        $superAdmin->setEmail('superadmin@univ.mg');
        $superAdmin->setRoles(['ROLE_SUPER_ADMIN']);
        $superAdmin->setPassword($this->hasher->hashPassword($superAdmin, 'Super@1234'));
        $manager->persist($superAdmin);

        // ===== ANNEE UNIVERSITAIRE =====
        $annee = new AnneUniversitaire();
        $annee->setLibelle('2024-2025');
        $annee->setDateDebut(new \DateTime('2024-10-01'));
        $annee->setDateFin(new \DateTime('2025-07-31'));
        $annee->setIsCurrent(true);
        $manager->persist($annee);

        // ===== FILIERES =====
        $f1 = new Filiere();
        $f1->setNom('Genie Logiciel et Base de Donnees');
        $f1->setCode('GB');
        $f1->setDescription('Axe sur la programmation, l\'analyse et la conception d\'applications.');
        $manager->persist($f1);

        $f2 = new Filiere();
        $f2->setNom('Administration des Systemes et Reseaux');
        $f2->setCode('SR');
        $f2->setDescription('Dedie a la gestion des infrastructures reseaux et a la securite informatique.');
        $manager->persist($f2);

        $f3 = new Filiere();
        $f3->setNom('Informatique Generale');
        $f3->setCode('IG');
        $f3->setDescription('Programme polyvalent alliant developpement et administration.');
        $manager->persist($f3);

        $f4 = new Filiere();
        $f4->setNom('Gouvernance et Ingenierie de Donnees');
        $f4->setCode('GID');
        $f4->setDescription('Master en gouvernance et ingenierie des donnees.');
        $manager->persist($f4);

        $f5 = new Filiere();
        $f5->setNom('Objets Connectes et Cybersecurite');
        $f5->setCode('OCC');
        $f5->setDescription('Master en objets connectes et cybersecurite.');
        $manager->persist($f5);

        $filieres = [
            'GB'  => $f1,
            'SR'  => $f2,
            'IG'  => $f3,
            'GID' => $f4,
            'OCC' => $f5,
        ];

        // ===== NIVEAUX & SEMESTRES =====
        $niveauxConfig = [
            'GB'  => ['L1', 'L2', 'L3'],
            'SR'  => ['L1', 'L2', 'L3'],
            'IG'  => ['L1', 'L2', 'L3'],
            'GID' => ['M1', 'M2'],
            'OCC' => ['M1', 'M2'],
        ];

        $semestreMap = [
            'L1' => ['S1', 'S2'],
            'L2' => ['S3', 'S4'],
            'L3' => ['S5', 'S6'],
            'M1' => ['S7', 'S8'],
            'M2' => ['S9', 'S10'],
        ];

        $creditsMap = [
            'L1' => 60, 'L2' => 60, 'L3' => 60,
            'M1' => 60, 'M2' => 60,
        ];

        $niveaux   = [];
        $semestres = [];

        foreach ($niveauxConfig as $filCode => $nomNiveaux) {
            foreach ($nomNiveaux as $nomNiveau) {
                $niveau = new Niveau();
                $niveau->setNom($nomNiveau);
                $niveau->setCode($filCode . $nomNiveau);
                $niveau->setCreditsRequis($creditsMap[$nomNiveau]);
                $niveau->setFiliere($filieres[$filCode]);
                $manager->persist($niveau);
                $niveaux[$filCode . '_' . $nomNiveau] = $niveau;

                foreach ($semestreMap[$nomNiveau] as $nomSem) {
                    $sem = new Semestre();
                    $sem->setNom($nomSem);
                    $sem->setNiveau($niveau);
                    $sem->setAnneeUniversitaire($annee);
                    $sem->setIsCloture(false);
                    $sem->setDateDebutSaisie(new \DateTime('2024-10-01'));
                    $sem->setDateFinSaisie(new \DateTime('2025-06-30'));
                    $manager->persist($sem);
                    $semestres[$filCode . '_' . $nomNiveau . '_' . $nomSem] = $sem;
                }
            }
        }

        // ===== ENSEIGNANTS (15) =====
        $enseignantsData = [
            ['RAKOTO',       'Jean',      'ENS-2020-00001', 'Algorithmique',              'Maitre_Assistant',  'enseignant@univ.mg'],
            ['RAZAFY',       'Marie',     'ENS-2019-00002', 'Base de Donnees',            'Maitre_Conference', 'marie.razafy@eni.mg'],
            ['ANDRIA',       'Paul',      'ENS-2021-00003', 'Reseaux',                    'Assistant',         'paul.andria@eni.mg'],
            ['RABE',         'Sophie',    'ENS-2018-00004', 'Securite Informatique',      'Professeur',        'sophie.rabe@eni.mg'],
            ['RAIVO',        'Luc',       'ENS-2022-00005', 'Developpement Web',          'Assistant',         'luc.raivo@eni.mg'],
            ['RASOA',        'Claire',    'ENS-2017-00006', 'Intelligence Artificielle',  'Professeur',        'claire.rasoa@eni.mg'],
            ['RANDRIANA',    'Marc',      'ENS-2020-00007', 'Systemes Embarques',         'Maitre_Assistant',  'marc.randriana@eni.mg'],
            ['RAJAO',        'Helene',    'ENS-2019-00008', 'Mathematiques',              'Maitre_Conference', 'helene.rajao@eni.mg'],
            ['RAKOTOBE',     'Thierry',   'ENS-2021-00009', 'Genie Logiciel',             'Maitre_Assistant',  'thierry.rakotobe@eni.mg'],
            ['RASAMOEL',     'Nathalie',  'ENS-2016-00010', 'Cybersecurite',              'Professeur',        'nathalie.rasamoel@eni.mg'],
            ['ANDRIAMANANA', 'Haja',      'ENS-2018-00011', 'Programmation Orientee Objet','Maitre_Conference','haja.andriamanana@eni.mg'],
            ['RAZAFINDRA',   'Tovo',      'ENS-2019-00012', 'Systemes d\'exploitation',   'Maitre_Assistant',  'tovo.razafindra@eni.mg'],
            ['RAKOTONDRA',   'Fara',      'ENS-2020-00013', 'Developpement Mobile',       'Assistant',         'fara.rakotondra@eni.mg'],
            ['RABEMANANJARA','Rina',      'ENS-2015-00014', 'Architecture Logicielle',    'Professeur',        'rina.rabemananjara@eni.mg'],
            ['ANDRIANTSOA',  'Zo',        'ENS-2022-00015', 'Cloud Computing',            'Assistant',         'zo.andriantsoa@eni.mg'],
        ];

        $enseignants = [];
        foreach ($enseignantsData as [$nom, $prenom, $matricule, $specialite, $grade, $email]) {
            $userEns = new User();
            $userEns->setEmail($email);
            $userEns->setRoles(['ROLE_ENSEIGNANT']);
            $userEns->setPassword($this->hasher->hashPassword($userEns, 'Ens@1234'));
            $manager->persist($userEns);

            $ens = new Enseignant();
            $ens->setNom($nom);
            $ens->setPrenom($prenom);
            $ens->setMatricule($matricule);
            $ens->setGrade($grade);
            $ens->setSpecialite($specialite);
            $ens->setDateEmbauche(new \DateTime('2020-01-01'));
            $ens->setStatut('actif');
            $ens->setUser($userEns);
            $manager->persist($ens);
            $enseignants[] = $ens;
        }

        // ===== ETUDIANTS (51) =====
        $nomsEtu = [
            ['ANDRIAMARO',           'Toky'],
            ['RASOANINDRA',          'Miora'],
            ['RAIVOSOA',             'Hery'],
            ['RAKOTOSON',            'Fanja'],
            ['RABEARISON',           'Aina'],
            ['RAHELISON',            'Nivo'],
            ['ANDRIANIVO',           'Tiana'],
            ['RAZAKANIRINA',         'Soa'],
            ['RAKOTOVAO',            'Mamy'],
            ['RATSIMBAZAFY',         'Lova'],
            ['ANDRIANAIVO',          'Zo'],
            ['RASOAMAMPIONONA',      'Vola'],
            ['RAKOTONDRAMANANA',     'Fidy'],
            ['RAZAFIMAHEFA',         'Dina'],
            ['ANDRIAMANANTENA',      'Lanto'],
            ['RAKOTONDRABE',         'Tsiry'],
            ['RASENDRAHASINA',       'Mahery'],
            ['ANDRIAMBELONA',        'Narindra'],
            ['RAKOTONIRINA',         'Tolotra'],
            ['RABENARIVO',           'Mirana'],
            ['ANDRIAMIHAJA',         'Tahina'],
            ['RAZAFINDRAKOTO',       'Sitraka'],
            ['RAKOTOMANGA',          'Mendrika'],
            ['RASOLOFOSON',          'Kanto'],
            ['ANDRIATSIMBA',         'Avotra'],
            ['RAKOTONDRATSIMA',      'Njaka'],
            ['RAZAFIMANANTSOA',      'Henintsoa'],
            ['ANDRIANOMENJANAHARY',  'Mahefa'],
            ['RAKOTOVOLOLONA',       'Fitia'],
            ['RASOAMANANA',          'Liantsoa'],
            ['ANDRIAMPARANY',        'Ravo'],
            ['RAZAFINDRALAMBO',      'Tsanta'],
            ['RAKOTONDRAZAKA',       'Fikela'],
            ['RASOLONJATOVO',        'Mbolatiana'],
            ['ANDRIANJAFY',          'Erica'],
            ['RAKOTONDRANAIVO',      'Hanta'],
            ['RAZAFIMAHARO',         'Njarasoa'],
            ['ANDRIAMANALINA',       'Volatiana'],
            ['RAKOTONIAINA',         'Maholy'],
            ['RASOAVELO',            'Tantely'],
            ['ANDRIAMANDROSO',       'Rindra'],
            ['RAZAFINDRAIBE',        'Tojo'],
            ['RAKOTOARISOA',         'Mampionona'],
            ['RASOAHAINGO',          'Lalaina'],
            ['ANDRIAMIARISOA',       'Hasina'],
            ['RAKOTOVAO',            'Ony'],
            ['RASOAZANANY',          'Harinaivo'],
            ['ANDRIANJAKA',          'Ny Aina'],
            ['RAKOTONDRAVONY',       'Finaritra'],
            ['RASOANIRINA',          'Zaraniaina'],
        ];

        $repartition = [
            'GB'  => ['L1' => 5, 'L2' => 5, 'L3' => 5],
            'SR'  => ['L1' => 5, 'L2' => 5, 'L3' => 5],
            'IG'  => ['L1' => 4, 'L2' => 3, 'L3' => 3],
            'GID' => ['M1' => 3, 'M2' => 2],
            'OCC' => ['M1' => 3, 'M2' => 2],
        ];

        $etuIndex      = 0;
        $matriculeIndex = 1;

        foreach ($repartition as $filCode => $niveauxRep) {
            foreach ($niveauxRep as $nivNom => $count) {
                for ($i = 0; $i < $count; $i++) {
                    [$nom, $prenom] = $nomsEtu[$etuIndex % count($nomsEtu)];
                    $etuIndex++;

                    $email     = strtolower($prenom) . '.' . strtolower($nom) . $matriculeIndex . '@etu.mg';
                    $matricule = 'ETU-2024-' . str_pad($matriculeIndex, 5, '0', STR_PAD_LEFT);
                    $matriculeIndex++;

                    $userEtu = new User();
                    $userEtu->setEmail($email);
                    $userEtu->setRoles(['ROLE_ETUDIANT']);
                    $userEtu->setPassword($this->hasher->hashPassword($userEtu, 'Etu@1234'));
                    $manager->persist($userEtu);

                    $etu = new Etudiant();
                    $etu->setNom($nom);
                    $etu->setPrenom($prenom);
                    $etu->setMatricule($matricule);
                    $etu->setDateNaissance(new \DateTime('2000-06-15'));
                    $etu->setLieuNaissance('Antananarivo');
                    $etu->setNationalite('Malagasy');
                    $etu->setGenre($i % 2 === 0 ? 'M' : 'F');
                    $etu->setNiveau($niveaux[$filCode . '_' . $nivNom]);
                    $etu->setFiliere($filieres[$filCode]);
                    $etu->setAnneeEntree(2024);
                    $etu->setStatut('actif');
                    $etu->setUser($userEtu);
                    $manager->persist($etu);
                }
            }
        }

        // Compte test étudiant principal
        $userEtuTest = new User();
        $userEtuTest->setEmail('toky@univ.mg');
        $userEtuTest->setRoles(['ROLE_ETUDIANT']);
        $userEtuTest->setPassword($this->hasher->hashPassword($userEtuTest, 'Etu@1234'));
        $manager->persist($userEtuTest);

        $etuTest = new Etudiant();
        $etuTest->setNom('ANDRIA');
        $etuTest->setPrenom('Toky');
        $etuTest->setMatricule('ETU-2024-00000');
        $etuTest->setDateNaissance(new \DateTime('2000-01-01'));
        $etuTest->setLieuNaissance('Antananarivo');
        $etuTest->setNationalite('Malagasy');
        $etuTest->setGenre('M');
        $etuTest->setNiveau($niveaux['GB_L3']);
        $etuTest->setFiliere($filieres['GB']);
        $etuTest->setAnneeEntree(2024);
        $etuTest->setStatut('actif');
        $etuTest->setUser($userEtuTest);
        $manager->persist($etuTest);

        $manager->flush();
    }
}