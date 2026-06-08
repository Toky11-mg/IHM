<?php

namespace App\Repository;

use App\Entity\Note;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Note>
 */
class NoteRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Note::class);
    }

    /**
     * Trouve les notes filtrées par liste de matières + critères optionnels
     */
    public function findByMatieres(array $matiereIds, array $criteria = []): array
    {
        $qb = $this->createQueryBuilder('n')
            ->where('n.matiere IN (:matiereIds)')
            ->setParameter('matiereIds', $matiereIds)
            ->orderBy('n.dateSaisie', 'DESC');

        if (!empty($criteria['semestre'])) {
            $qb->andWhere('n.semestre = :semestre')
               ->setParameter('semestre', $criteria['semestre']);
        }
        if (!empty($criteria['etudiant'])) {
            $qb->andWhere('n.etudiant = :etudiant')
               ->setParameter('etudiant', $criteria['etudiant']);
        }
        if (!empty($criteria['matiere'])) {
            $qb->andWhere('n.matiere = :matiere')
               ->setParameter('matiere', $criteria['matiere']);
        }

        return $qb->getQuery()->getResult();
    }

    /**
     * Trouve toutes les notes d'un étudiant pour un semestre donné
     */
    public function findByEtudiantEtSemestre(int $etudiantId, int $semestreId): array
    {
        return $this->createQueryBuilder('n')
            ->where('n.etudiant = :etudiant')
            ->andWhere('n.semestre = :semestre')
            ->setParameter('etudiant', $etudiantId)
            ->setParameter('semestre', $semestreId)
            ->orderBy('n.dateSaisie', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Calcule la moyenne pondérée d'un étudiant pour un semestre
     */
    public function calculerMoyenne(int $etudiantId, int $semestreId): ?float
    {
        $notes = $this->findByEtudiantEtSemestre($etudiantId, $semestreId);

        if (empty($notes)) {
            return null;
        }

        $totalPoints = 0;
        $totalCoeff  = 0;

        foreach ($notes as $note) {
            if ($note->getNoteFinale() === null) continue;
            $coeff = (float) $note->getMatiere()?->getCoefficient();
            $totalPoints += (float) $note->getNoteFinale() * $coeff;
            $totalCoeff  += $coeff;
        }

        if ($totalCoeff === 0.0) {
            return null;
        }

        return round($totalPoints / $totalCoeff, 2);
    }

    /**
     * Compte les crédits validés d'un étudiant pour un semestre
     */
    public function calculerCreditsValides(int $etudiantId, int $semestreId): int
    {
        $notes = $this->findByEtudiantEtSemestre($etudiantId, $semestreId);
        $credits = 0;

        foreach ($notes as $note) {
            if ($note->isValidee()) {
                $credits += $note->getMatiere()?->getCredit() ?? 0;
            }
        }

        return $credits;
    }

    /**
     * Compte le total des crédits d'un semestre
     */
    public function calculerTotalCredits(int $semestreId): int
    {
        $result = $this->createQueryBuilder('n')
            ->select('SUM(m.credit)')
            ->join('n.matiere', 'm')
            ->where('n.semestre = :semestre')
            ->setParameter('semestre', $semestreId)
            ->groupBy('n.semestre')
            ->getQuery()
            ->getOneOrNullResult();

        return (int) ($result[1] ?? 0);
    }
}