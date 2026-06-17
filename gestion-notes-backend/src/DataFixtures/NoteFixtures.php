<?php

namespace App\DataFixtures;

use App\Entity\Note;
use App\Entity\Etudiant;
use App\Entity\Matiere;
use App\Entity\Semestre;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Common\DataFixtures\DependentFixtureInterface;
use Doctrine\Persistence\ObjectManager;

class NoteFixtures extends Fixture implements DependentFixtureInterface
{
    public function getDependencies(): array
    {
        return [AppFixtures::class, MatiereFixtures::class];
    }

    public function load(ObjectManager $manager): void
    {
        // Étudiants IG L1
        $etudiantIds = [102, 103, 104, 105];

        // Matières S1 (semestre_id=43) : ids 5-14
        $matieresS1 = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14];
        $semestreS1Id = 43;

        // Matières S2 (semestre_id=44) : ids 15-27
        $matieresS2 = [15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25];
        // On skip 26 (stage) et 27 (soutenance) — pas de CC/Exam
        $matieresS2Stage = [26, 27];
        $semestreS2Id = 44;

        $semS1 = $manager->getReference(Semestre::class, $semestreS1Id);
        $semS2 = $manager->getReference(Semestre::class, $semestreS2Id);

        // Notes prédéfinies par étudiant (CC, Exam)
        $notesData = [
            102 => ['cc' => [14, 12, 16, 15, 13, 11, 17, 14, 12, 16], 'ex' => [13, 11, 15, 14, 12, 10, 16, 13, 11, 15]],
            103 => ['cc' => [8,  9,  11, 10, 7,  12, 9,  8,  10, 11], 'ex' => [9,  8,  10, 9,  8,  11, 8,  9,  9,  10]],
            104 => ['cc' => [18, 17, 19, 16, 18, 15, 17, 18, 16, 19], 'ex' => [17, 16, 18, 15, 17, 14, 16, 17, 15, 18]],
            105 => ['cc' => [10, 11, 9,  12, 10, 8,  13, 10, 11, 9],  'ex' => [11, 10, 8,  13, 9,  9,  12, 11, 10, 8]],
        ];

        $notesS2Data = [
            102 => ['cc' => [13, 14, 15, 12, 11, 16, 14, 13, 12, 15, 11], 'ex' => [12, 13, 14, 11, 10, 15, 13, 12, 11, 14, 10]],
            103 => ['cc' => [7,  9,  8,  10, 6,  11, 9,  8,  7,  10, 6],  'ex' => [8,  8,  9,  9,  7,  10, 8,  7,  8,  9,  7]],
            104 => ['cc' => [17, 18, 16, 19, 17, 15, 18, 17, 16, 19, 15], 'ex' => [16, 17, 15, 18, 16, 14, 17, 16, 15, 18, 14]],
            105 => ['cc' => [11, 10, 12, 9,  11, 8,  13, 10, 11, 12, 9],  'ex' => [10, 11, 11, 8,  10, 9,  12, 9,  10, 11, 8]],
        ];

        foreach ($etudiantIds as $etuId) {
            $etudiant = $manager->find(Etudiant::class, $etuId);
            if (!$etudiant) continue;

            // Notes S1
            foreach ($matieresS1 as $idx => $matiereId) {
                $matiere = $manager->find(Matiere::class, $matiereId);
                if (!$matiere) continue;

                $existing = $manager->getRepository(Note::class)->findOneBy([
                    'etudiant' => $etudiant,
                    'matiere'  => $matiere,
                    'semestre' => $manager->find(Semestre::class, $semestreS1Id),
                ]);
                if ($existing) continue;

                $note = new Note();
                $note->setEtudiant($etudiant);
                $note->setMatiere($matiere);
                $note->setSemestre($manager->find(Semestre::class, $semestreS1Id));
                $note->setNoteCc((string) $notesData[$etuId]['cc'][$idx]);
                $note->setNoteExamen((string) $notesData[$etuId]['ex'][$idx]);
                $manager->persist($note);
            }

            // Notes S2 (cours uniquement)
            foreach ($matieresS2 as $idx => $matiereId) {
                $matiere = $manager->find(Matiere::class, $matiereId);
                if (!$matiere) continue;

                $existing = $manager->getRepository(Note::class)->findOneBy([
                    'etudiant' => $etudiant,
                    'matiere'  => $matiere,
                    'semestre' => $manager->find(Semestre::class, $semestreS2Id),
                ]);
                if ($existing) continue;

                $note = new Note();
                $note->setEtudiant($etudiant);
                $note->setMatiere($matiere);
                $note->setSemestre($manager->find(Semestre::class, $semestreS2Id));
                $note->setNoteCc((string) $notesS2Data[$etuId]['cc'][$idx]);
                $note->setNoteExamen((string) $notesS2Data[$etuId]['ex'][$idx]);
                $manager->persist($note);
            }

            // Stage S2 — note examen uniquement
            foreach ($matieresS2Stage as $matiereId) {
                $matiere = $manager->find(Matiere::class, $matiereId);
                if (!$matiere) continue;

                $existing = $manager->getRepository(Note::class)->findOneBy([
                    'etudiant' => $etudiant,
                    'matiere'  => $matiere,
                    'semestre' => $manager->find(Semestre::class, $semestreS2Id),
                ]);
                if ($existing) continue;

                $note = new Note();
                $note->setEtudiant($etudiant);
                $note->setMatiere($matiere);
                $note->setSemestre($manager->find(Semestre::class, $semestreS2Id));
                $note->setNoteExamen('14.00');
                $manager->persist($note);
            }
        }

        $manager->flush();
    }
}