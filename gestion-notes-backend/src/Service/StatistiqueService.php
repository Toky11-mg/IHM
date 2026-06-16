<?php

namespace App\Service;

use Doctrine\ORM\EntityManagerInterface;

class StatistiqueService
{
    public function __construct(
        private EntityManagerInterface $em
    ) {}

    public function getStatistiquesGlobales(): array
    {
        $conn = $this->em->getConnection();

        $nbEtudiants = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM etudiant WHERE statut = 'actif'"
        );

        $nbEnseignants = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM enseignant WHERE statut = 'actif'"
        );

        $nbMatieres = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM matiere WHERE is_active = true"
        );

        $totalNotes = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM note WHERE note_finale IS NOT NULL"
        );
        $notesReussies = (int) $conn->fetchOne(
            "SELECT COUNT(*) FROM note WHERE note_finale IS NOT NULL AND note_finale >= 10"
        );
        $tauxReussite = $totalNotes > 0
            ? round(($notesReussies / $totalNotes) * 100, 2)
            : 0.0;

        $notesParFiliere = $conn->fetchAllAssociative("
            SELECT 
                f.nom AS filiere,
                COUNT(n.id) AS nb_notes,
                ROUND(AVG(n.note_finale::numeric), 2) AS moyenne,
                COUNT(CASE WHEN n.note_finale >= 10 THEN 1 END) AS nb_reussis,
                COUNT(CASE WHEN n.note_finale < 10 THEN 1 END) AS nb_echoues
            FROM filiere f
            LEFT JOIN etudiant e ON e.filiere_id = f.id
            LEFT JOIN note n ON n.etudiant_id = e.id AND n.note_finale IS NOT NULL
            GROUP BY f.id, f.nom
            ORDER BY f.nom
        ");

        $deliberationsParDecision = $conn->fetchAllAssociative("
            SELECT decision, COUNT(*) AS total
            FROM deliberation
            GROUP BY decision
            ORDER BY total DESC
        ");

        return [
            'nb_etudiants'               => $nbEtudiants,
            'nb_enseignants'             => $nbEnseignants,
            'nb_matieres'                => $nbMatieres,
            'taux_reussite'              => $tauxReussite,
            'notes_par_filiere'          => $notesParFiliere,
            'deliberations_par_decision' => $deliberationsParDecision,
        ];
    }
}