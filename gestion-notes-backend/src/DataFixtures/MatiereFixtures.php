<?php

namespace App\DataFixtures;

use App\Entity\Matiere;
use App\Entity\Semestre;
use App\Entity\Enseignant;
use App\Repository\SemestreRepository;
use App\Repository\EnseignantRepository;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class MatiereFixtures extends Fixture implements DependentFixtureInterface
{
    public function __construct(
        private SemestreRepository $semestreRepo,
        private EnseignantRepository $enseignantRepo,
    ) {}

    public function getDependencies(): array
    {
        return [AppFixtures::class];
    }

    private function getSemestre(ObjectManager $manager, string $filCode, string $nivNom, string $semNom): ?Semestre
    {
        $niveau = $manager->getRepository(\App\Entity\Niveau::class)->findOneBy([
            'code' => $filCode . $nivNom,
        ]);
        if (!$niveau) return null;

        return $this->semestreRepo->findOneBy([
            'nom'    => $semNom,
            'niveau' => $niveau,
        ]);
    }

    private function createMatiere(
        ObjectManager $manager,
        string $nom,
        string $code,
        int $credit,
        float $coeff,
        string $type,
        Semestre $semestre,
        ?Enseignant $enseignant = null
    ): void {
        // Vérifier si le code existe déjà
        $existing = $manager->getRepository(Matiere::class)->findOneBy(['code' => $code]);
        if ($existing) return;

        $m = new Matiere();
        $m->setNom($nom);
        $m->setCode($code);
        $m->setCredit($credit);
        $m->setCoefficient((string) $coeff);
        $m->setType($type);
        $m->setSemestre($semestre);
        $m->setIsActive(true);

        if (in_array($type, ['stage', 'memoire'])) {
            $m->setNoteCcPoids('0.00');
            $m->setNoteExPoids('1.00');
        } else {
            $m->setNoteCcPoids('0.40');
            $m->setNoteExPoids('0.60');
        }

        if ($enseignant) {
            $m->setEnseignant($enseignant);
        }

        $manager->persist($m);
    }

    public function load(ObjectManager $manager): void
    {
        // Récupérer tous les enseignants
        $ens = $this->enseignantRepo->findAll();
        // On assigne par rotation
        $e = function(int $i) use ($ens): ?Enseignant {
            return $ens[$i % count($ens)] ?? null;
        };

        // =====================
        // IG - L1 - S1
        // =====================
        $s = $this->getSemestre($manager, 'IG', 'L1', 'S1');
        if ($s) {
            $this->createMatiere($manager, 'Base d algebre 1', 'IGL101', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Base d analyse 1', 'IGL102', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Algorithme et structure de donnees en C', 'IGL103', 3, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Developpement de site web en HTML CSS', 'IGL104', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Systeme d exploitation Unix', 'IGL105', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Systeme d exploitation Windows', 'IGL106', 3, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Theorie des reseaux', 'IGL107', 3, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Architecture des ordinateurs', 'IGL108', 3, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Electronique analogique', 'IGL109', 3, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Electronique numerique', 'IGL110', 3, 1.0, 'cours', $s, $e(9));
        }

        // =====================
        // IG - L1 - S2
        // =====================
        $s = $this->getSemestre($manager, 'IG', 'L1', 'S2');
        if ($s) {
            $this->createMatiere($manager, 'Probabilite et Statistique', 'IGL201', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Mathematiques discretes', 'IGL202', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Initiation a la POO', 'IGL203', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Langage C', 'IGL204', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Technologie XML et DHTML', 'IGL205', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Technologies des reseaux', 'IGL206', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Introduction aux systemes embarques', 'IGL207', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Base de l Informatique', 'IGL208', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Comptabilite generale', 'IGL209', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Anglais 1', 'IGL210', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Francais 1', 'IGL211', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Projet systeme et Base de donnees', 'IGL212', 1, 1.0, 'stage', $s, $e(11));
            $this->createMatiere($manager, 'Soutenance L1', 'IGL213', 4, 1.0, 'memoire', $s, $e(12));
        }

        // =====================
        // IG - L2 - S3
        // =====================
        $s = $this->getSemestre($manager, 'IG', 'L2', 'S3');
        if ($s) {
            $this->createMatiere($manager, 'Analyse 2', 'IGL301', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Algebre 2', 'IGL302', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Algorithme et structures de donnees avances en C', 'IGL303', 3, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Base de donnees relationnelles', 'IGL304', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'MERISE 1', 'IGL305', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Developpement d applications en C#', 'IGL306', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Developpement web en PHP', 'IGL307', 4, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Base de l administration des reseaux', 'IGL308', 3, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Communication et Routage IP', 'IGL309', 3, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Maintenance des systemes d exploitation', 'IGL310', 3, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Langage Assembleur', 'IGL311', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Programmation des microcontroleurs', 'IGL312', 2, 1.0, 'cours', $s, $e(11));
        }

        // =====================
        // IG - L2 - S4
        // =====================
        $s = $this->getSemestre($manager, 'IG', 'L2', 'S4');
        if ($s) {
            $this->createMatiere($manager, 'Probabilite et Statistique 2', 'IGL401', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Langage Python', 'IGL402', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Programmation objet en C++', 'IGL403', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Developpement d applications SPA', 'IGL404', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Services reseaux', 'IGL405', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Administration systeme Unix', 'IGL406', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Administration systeme Microsoft', 'IGL407', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Electronique analogique 2', 'IGL408', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Anglais 2', 'IGL409', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Technique de communication', 'IGL410', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Stage en entreprise L2', 'IGL411', 1, 1.0, 'stage', $s, $e(10));
            $this->createMatiere($manager, 'Soutenance rapport de stage L2', 'IGL412', 4, 1.0, 'memoire', $s, $e(11));
        }

        // =====================
        // IG - L3 - S5
        // =====================
        $s = $this->getSemestre($manager, 'IG', 'L3', 'S5');
        if ($s) {
            $this->createMatiere($manager, 'Langage JAVA 1', 'IGL501', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Technologies JSP et Servlet 1', 'IGL502', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Genie Logiciel', 'IGL503', 3, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'UML', 'IGL504', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'MERISE 2', 'IGL505', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Administration de Base de donnees', 'IGL506', 3, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Assembleur applique', 'IGL507', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Base de la cybersecurite', 'IGL508', 3, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Anglais L3', 'IGL509', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Technique de communication L3', 'IGL510', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Marketing', 'IGL511', 1, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Entreprenariat', 'IGL512', 1, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Gestion de Projet', 'IGL513', 1, 1.0, 'cours', $s, $e(12));
        }

        // =====================
        // IG - L3 - S6
        // =====================
        $s = $this->getSemestre($manager, 'IG', 'L3', 'S6');
        if ($s) {
            $this->createMatiere($manager, 'Langage JAVA 2', 'IGL601', 2, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Langage Python L3', 'IGL602', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Developpement Mobile', 'IGL603', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Patrons GRASP', 'IGL604', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Telephonie sur IP', 'IGL605', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Reseaux mobiles', 'IGL606', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Administration reseaux Unix 1', 'IGL607', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Administration reseaux Microsoft 1', 'IGL608', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Interoperabilite et architecture client serveur', 'IGL609', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Reseaux IP MPLS', 'IGL610', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Architecture reseaux securisees', 'IGL611', 3, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Organisation et Management', 'IGL612', 1, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Droit des affaires et du travail', 'IGL613', 1, 1.0, 'cours', $s, $e(12));
            $this->createMatiere($manager, 'Stage en entreprise L3', 'IGL614', 1, 1.0, 'stage', $s, $e(13));
            $this->createMatiere($manager, 'Soutenance memoire L3', 'IGL615', 4, 1.0, 'memoire', $s, $e(14));
        }

        // =====================
        // GB - L2 - S3
        // =====================
        $s = $this->getSemestre($manager, 'GB', 'L2', 'S3');
        if ($s) {
            $this->createMatiere($manager, 'Base d algebre 2', 'GBL301', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Base d analyse 2', 'GBL302', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Algorithme et structures de donnees avances', 'GBL303', 3, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Base de donnees relationnelles GB', 'GBL304', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'MERISE 1 GB', 'GBL305', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Introduction aux methodes', 'GBL306', 3, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Technologie PHP GB', 'GBL307', 3, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Developpement web en PHP GB', 'GBL308', 4, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Comptabilite analytique', 'GBL309', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Methode de Travail Universitaire', 'GBL310', 1, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Anglais GB L2', 'GBL311', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Technique de communication GB L2', 'GBL312', 2, 1.0, 'cours', $s, $e(11));
        }

        // =====================
        // GB - L2 - S4
        // =====================
        $s = $this->getSemestre($manager, 'GB', 'L2', 'S4');
        if ($s) {
            $this->createMatiere($manager, 'Probabilite et Statistique GB', 'GBL401', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Programmation lineaire', 'GBL402', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Programmation Oriente Objet en C++', 'GBL403', 3, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Langage Java GB', 'GBL404', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Langage Python GB', 'GBL405', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Base de donnees avancees', 'GBL406', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'SGBD MySQL et PostGreSQL', 'GBL407', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'MERISE 2 GB', 'GBL408', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Developpement d application SPA GB', 'GBL409', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Developpement d application en C# GB', 'GBL410', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Stage en entreprise GB L2', 'GBL411', 3, 1.0, 'stage', $s, $e(10));
            $this->createMatiere($manager, 'Soutenance rapport stage GB L2', 'GBL412', 2, 1.0, 'memoire', $s, $e(11));
        }

        // =====================
        // GB - L3 - S5
        // =====================
        $s = $this->getSemestre($manager, 'GB', 'L3', 'S5');
        if ($s) {
            $this->createMatiere($manager, 'Langage JAVA GB', 'GBL501', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Technologies JSP et Servlet GB', 'GBL502', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'UML GB', 'GBL503', 3, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Patrons de conception', 'GBL504', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Technologie web mobile', 'GBL505', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Interaction Homme-Machine GB', 'GBL506', 3, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Anglais GB L3', 'GBL507', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Technique de communication GB L3', 'GBL508', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Marketing GB', 'GBL509', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Entreprenariat GB', 'GBL510', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Gestion de Projet GB', 'GBL511', 2, 1.0, 'cours', $s, $e(10));
        }

        // =====================
        // GB - L3 - S6
        // =====================
        $s = $this->getSemestre($manager, 'GB', 'L3', 'S6');
        if ($s) {
            $this->createMatiere($manager, 'Technologie JAVA GB', 'GBL601', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Technologie Python GB', 'GBL602', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Administration de Base de donnees GB', 'GBL603', 3, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Patrons GRASP et GoF', 'GBL604', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Genie Logiciel 1', 'GBL605', 3, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Developpement Web API', 'GBL606', 3, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Developpement mobile GB', 'GBL607', 3, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Organisation et Management GB', 'GBL608', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Droit des affaires et du travail GB', 'GBL609', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Stage en entreprise GB L3', 'GBL610', 3, 1.0, 'stage', $s, $e(9));
            $this->createMatiere($manager, 'Soutenance memoire GB L3', 'GBL611', 2, 1.0, 'memoire', $s, $e(10));
        }

        // =====================
        // SR - L2 - S3
        // =====================
        $s = $this->getSemestre($manager, 'SR', 'L2', 'S3');
        if ($s) {
            $this->createMatiere($manager, 'Base d algebre 2 SR', 'SRL301', 2, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Base d analyse 2 SR', 'SRL302', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Algorithme et structure de donnees en C SR', 'SRL303', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Programmation en C++ SR', 'SRL304', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Langage Python SR', 'SRL305', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Technologie PHP SR', 'SRL306', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Base de securite des systemes d information', 'SRL307', 3, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Administration systeme Linux', 'SRL308', 3, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Electronique analogique SR', 'SRL309', 3, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Services reseaux SR', 'SRL310', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Methodologie de conception des systemes et reseaux', 'SRL311', 3, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Technologie sans fil et fibre optique', 'SRL312', 2, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Methode de Travail Universitaire SR', 'SRL313', 2, 1.0, 'cours', $s, $e(12));
        }

        // =====================
        // SR - L2 - S4
        // =====================
        $s = $this->getSemestre($manager, 'SR', 'L2', 'S4');
        if ($s) {
            $this->createMatiere($manager, 'Probabilite et Statistique 2 SR', 'SRL401', 2, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Programmation lineaire SR', 'SRL402', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Langage Assembleur SR', 'SRL403', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Langage JAVA SR', 'SRL404', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Technologie javascript', 'SRL405', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Conception des logiciels SR', 'SRL406', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Administration systeme Windows SR', 'SRL407', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Programmation des microcontroleurs SR', 'SRL408', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Base de l administration des reseaux SR', 'SRL409', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Routage IP SR', 'SRL410', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Securite reseaux sous windows', 'SRL411', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Anglais SR L2', 'SRL412', 2, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Technique de communication SR L2', 'SRL413', 2, 1.0, 'cours', $s, $e(12));
            $this->createMatiere($manager, 'Projet systeme et Base de donnees SR', 'SRL414', 3, 1.0, 'stage', $s, $e(13));
            $this->createMatiere($manager, 'Soutenance SR L2', 'SRL415', 1, 1.0, 'memoire', $s, $e(14));
        }

        // =====================
        // SR - L3 - S5
        // =====================
        $s = $this->getSemestre($manager, 'SR', 'L3', 'S5');
        if ($s) {
            $this->createMatiere($manager, 'Technologie JAVA SR', 'SRL501', 2, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Technologie Python avance', 'SRL502', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Technologie NodeJs SR', 'SRL503', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Langage Assembleur applique SR', 'SRL504', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Technologie web mobile SR', 'SRL505', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Administration Systeme Unix 2', 'SRL506', 3, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Administration Systeme Microsoft 2', 'SRL507', 3, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Administration reseaux Unix 1 SR', 'SRL508', 3, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Administration reseaux Microsoft 1 SR', 'SRL509', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Interoperabilite et architecture client serveur SR', 'SRL510', 3, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Anglais SR L3', 'SRL511', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Technique de communication SR L3', 'SRL512', 2, 1.0, 'cours', $s, $e(11));
        }

        // =====================
        // SR - L3 - S6
        // =====================
        $s = $this->getSemestre($manager, 'SR', 'L3', 'S6');
        if ($s) {
            $this->createMatiere($manager, 'Ingenierie des bases de donnees SR', 'SRL601', 2, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Developpement d application mobile SR', 'SRL602', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Introduction au Machine Learning SR', 'SRL603', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Projet Machine Learning SR', 'SRL604', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Conception des logiciels SR L3', 'SRL605', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Cybersecurite SR', 'SRL606', 3, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Securite web Mail et reseaux sociaux', 'SRL607', 3, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Reseaux IP MPLS SR', 'SRL608', 3, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Reseaux d operateurs', 'SRL609', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Telephonie sur IP SR', 'SRL610', 3, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Entreprenariat SR', 'SRL611', 1, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Gestion de Projet SR', 'SRL612', 1, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Droit des affaires et du travail SR', 'SRL613', 1, 1.0, 'cours', $s, $e(12));
            $this->createMatiere($manager, 'Stage en entreprise SR L3', 'SRL614', 4, 1.0, 'stage', $s, $e(13));
            $this->createMatiere($manager, 'Soutenance rapport stage SR L3', 'SRL615', 1, 1.0, 'memoire', $s, $e(14));
        }

        // =====================
        // GID - M1 - S7
        // =====================
        $s = $this->getSemestre($manager, 'GID', 'M1', 'S7');
        if ($s) {
            $this->createMatiere($manager, 'Algebre lineaire GID', 'GDM701', 2, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Analyse GID', 'GDM702', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Proba Stat GID', 'GDM703', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Initiation a l IA GID', 'GDM704', 3, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Initiation a la gouvernance de donnees', 'GDM705', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Base de donnees SQL et NoSQL', 'GDM706', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Developpement backend GID', 'GDM707', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Developpement frontend GID', 'GDM708', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'R pour la Science de donnees', 'GDM709', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Francais GID', 'GDM710', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Anglais GID S7', 'GDM711', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Strategie et marketing digital GID', 'GDM712', 2, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Methodologie de recherche GID S7', 'GDM713', 2, 1.0, 'cours', $s, $e(12));
            $this->createMatiere($manager, 'Initiation a la cybersecurite GID', 'GDM714', 2, 1.0, 'cours', $s, $e(13));
            $this->createMatiere($manager, 'IAM et fournisseur d identite', 'GDM715', 3, 1.0, 'cours', $s, $e(14));
        }

        // =====================
        // GID - M1 - S8
        // =====================
        $s = $this->getSemestre($manager, 'GID', 'M1', 'S8');
        if ($s) {
            $this->createMatiere($manager, 'Initiation a la science de donnees', 'GDM801', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Initiation au Big Data', 'GDM802', 3, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Python pour la Science de donnees', 'GDM803', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Internet des objets IoT GID', 'GDM804', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Technologies mobiles et PWA', 'GDM805', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Architecture logicielle GID', 'GDM806', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Agile GID', 'GDM807', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Lean start-up GID', 'GDM808', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'UX UI Design GID', 'GDM809', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Projet GID M1', 'GDM810', 10, 1.0, 'stage', $s, $e(9));
        }

        // =====================
        // GID - M2 - S9
        // =====================
        $s = $this->getSemestre($manager, 'GID', 'M2', 'S9');
        if ($s) {
            $this->createMatiere($manager, 'Outils mathematiques pour l IA', 'GDM901', 3, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Machine Learning et Deep Learning GID', 'GDM902', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Modelisation de connaissance', 'GDM903', 1, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Gouvernance de donnees', 'GDM904', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Big data GID', 'GDM905', 2, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Structure de gouvernance de donnees', 'GDM906', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Interoperabilite et exploitation de donnees', 'GDM907', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Elaboration de dossier d architecture technique', 'GDM908', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Interoperabilite de modele', 'GDM909', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Prototypage et test utilisateur', 'GDM910', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Integration et deploiement continus', 'GDM911', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Outils collaboratifs GID', 'GDM912', 2, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Securite web GID', 'GDM913', 2, 1.0, 'cours', $s, $e(12));
            $this->createMatiere($manager, 'Qualimetrie GID', 'GDM914', 2, 1.0, 'cours', $s, $e(13));
            $this->createMatiere($manager, 'Gestion d identite GID', 'GDM915', 2, 1.0, 'cours', $s, $e(14));
            $this->createMatiere($manager, 'Stage professionnel GID M2', 'GDM916', 5, 1.0, 'stage', $s, $e(0));
            $this->createMatiere($manager, 'Soutenance memoire GID M2', 'GDM917', 4, 1.0, 'memoire', $s, $e(1));
        }

        // =====================
        // OCC - M1 - S7
        // =====================
        $s = $this->getSemestre($manager, 'OCC', 'M1', 'S7');
        if ($s) {
            $this->createMatiere($manager, 'Concepts et fondements IoT', 'OCM701', 1, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Conception de systemes IoT', 'OCM702', 1, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Modeles et architecture IoT', 'OCM703', 1, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Concepts et fondements Cybersecurite', 'OCM704', 1, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Principes de base de la cryptographie', 'OCM705', 1, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Architecture de reseau IoT et topologies', 'OCM706', 1, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Protocoles et securite pour l IoT', 'OCM707', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Protocole de communication securisee', 'OCM708', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Circuits et materiels electroniques', 'OCM709', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'IoT sur microcontroleur', 'OCM710', 2, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Capteurs connectes et equipement', 'OCM711', 1, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Optimisation et Haute performance', 'OCM712', 2, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Mathematique pour l informatique OCC', 'OCM713', 2, 1.0, 'cours', $s, $e(12));
            $this->createMatiere($manager, 'Apprentissage automatique ML DL OCC', 'OCM714', 2, 1.0, 'cours', $s, $e(13));
            $this->createMatiere($manager, 'Big Data et traitement des donnees IoT', 'OCM715', 2, 1.0, 'cours', $s, $e(14));
            $this->createMatiere($manager, 'Securite des systemes de controle ICS SCADA', 'OCM716', 2, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Securite de communication mobile OCC', 'OCM717', 1, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Securite des systemes d exploitation OCC', 'OCM718', 1, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Soft Skills OCC', 'OCM719', 1, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Strategie et Marketing digital OCC', 'OCM720', 1, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Methodologie de recherche OCC', 'OCM721', 1, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Francais OCC', 'OCM722', 1, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Anglais OCC S7', 'OCM723', 1, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Projet OCC M1', 'OCM724', 10, 1.0, 'stage', $s, $e(8));
        }

        // =====================
        // OCC - M2 - S9
        // =====================
        $s = $this->getSemestre($manager, 'OCC', 'M2', 'S9');
        if ($s) {
            $this->createMatiere($manager, 'Jumeaux numeriques', 'OCM901', 1, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Reseaux mobiles et telecommunication OCC', 'OCM902', 2, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Virtualisation et securite OCC', 'OCM903', 2, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Communication de materiel IoT', 'OCM904', 2, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Norme et reglementation en cybersecurite', 'OCM905', 1, 1.0, 'cours', $s, $e(4));
            $this->createMatiere($manager, 'Tests d intrusion et evaluation de la securite', 'OCM906', 2, 1.0, 'cours', $s, $e(5));
            $this->createMatiere($manager, 'Gestion de vulnerabilite d intrusion et correctif', 'OCM907', 2, 1.0, 'cours', $s, $e(6));
            $this->createMatiere($manager, 'Menace et contre-mesures dans les reseaux sans fil', 'OCM908', 2, 1.0, 'cours', $s, $e(7));
            $this->createMatiere($manager, 'Evaluation des risques en cybersecurite', 'OCM909', 2, 1.0, 'cours', $s, $e(8));
            $this->createMatiere($manager, 'Conformite reglementaire et normes de securite', 'OCM910', 1, 1.0, 'cours', $s, $e(9));
            $this->createMatiere($manager, 'Cloud computing OCC', 'OCM911', 2, 1.0, 'cours', $s, $e(10));
            $this->createMatiere($manager, 'Smart city OCC', 'OCM912', 2, 1.0, 'cours', $s, $e(11));
            $this->createMatiere($manager, 'Smart Data OCC', 'OCM913', 1, 1.0, 'cours', $s, $e(12));
            $this->createMatiere($manager, 'GeoIA OCC', 'OCM914', 2, 1.0, 'cours', $s, $e(13));
            $this->createMatiere($manager, 'Internet Industriel des objets IIoT IoMT', 'OCM915', 2, 1.0, 'cours', $s, $e(14));
            $this->createMatiere($manager, 'Modeles economiques de l IoT', 'OCM916', 1, 1.0, 'cours', $s, $e(0));
            $this->createMatiere($manager, 'Aspects juridiques et reglementaires de l IoT', 'OCM917', 1, 1.0, 'cours', $s, $e(1));
            $this->createMatiere($manager, 'Vulnerabilite et defenses dans les environnements industriels', 'OCM918', 1, 1.0, 'cours', $s, $e(2));
            $this->createMatiere($manager, 'Applications et domaines d utilisation de l IoT', 'OCM919', 1, 1.0, 'cours', $s, $e(3));
            $this->createMatiere($manager, 'Encadrement memoire OCC M2', 'OCM920', 5, 1.0, 'stage', $s, $e(4));
            $this->createMatiere($manager, 'Soutenance memoire OCC M2', 'OCM921', 1, 1.0, 'memoire', $s, $e(5));
        }

        $manager->flush();
    }
}