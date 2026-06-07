<?php

namespace App\Entity;

use App\Repository\NoteRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: NoteRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(
    fields: ['etudiant', 'matiere', 'semestre'],
    message: 'Une note existe déjà pour cet étudiant dans cette matière pour ce semestre.'
)]
class Note
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?string $id = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Assert\Range(
        min: 0, max: 20,
        notInRangeMessage: 'La note CC doit être entre {{ min }} et {{ max }}.'
    )]
    private ?string $noteCc = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Assert\Range(
        min: 0, max: 20,
        notInRangeMessage: "La note d'examen doit être entre {{ min }} et {{ max }}."
    )]
    private ?string $noteExamen = null;

    // JAMAIS saisie manuellement — calculée automatiquement
    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    private ?string $noteFinale = null;

    // Calculée automatiquement depuis noteFinale
    #[ORM\Column(length: 2, nullable: true)]
    private ?string $mention = null;

    #[ORM\Column]
    private bool $isAbsentCc = false;

    #[ORM\Column]
    private bool $isAbsentExamen = false;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateSaisie = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $dateModification = null;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\ManyToOne(targetEntity: Etudiant::class, inversedBy: 'notes')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: "L'étudiant est obligatoire.")]
    private ?Etudiant $etudiant = null;

    #[ORM\ManyToOne(targetEntity: Matiere::class, inversedBy: 'notes')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'La matière est obligatoire.')]
    private ?Matiere $matiere = null;

    #[ORM\ManyToOne(targetEntity: Semestre::class, inversedBy: 'notes')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'Le semestre est obligatoire.')]
    private ?Semestre $semestre = null;

    // Enseignant qui a saisi la note
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $saisiePar = null;

    // Utilisateur qui a modifié la note
    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $modifiePar = null;

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        $this->dateSaisie = new \DateTimeImmutable();
        $this->validerEtCalculer();
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        $this->dateModification = new \DateTimeImmutable();
        $this->validerEtCalculer();
    }

    // =====================
    // MÉTHODES MÉTIER
    // =====================

    private function validerEtCalculer(): void
    {
        // Règle 1 : saisie bloquée si semestre clôturé
        if ($this->semestre?->isCloture()) {
            throw new \LogicException(
                'Impossible de modifier une note : le semestre est clôturé.'
            );
        }

        // Règle 2 : matière doit être active
        if ($this->matiere !== null && !$this->matiere->isActive()) {
            throw new \LogicException(
                "Impossible de saisir une note pour la matière '{$this->matiere->getNom()}' : matière inactive."
            );
        }

        // Règle 3 : l'étudiant doit être actif
        if ($this->etudiant !== null && !$this->etudiant->isActif()) {
            throw new \LogicException(
                "Impossible de saisir une note pour un étudiant inactif."
            );
        }

        // Règle 4 : absent CC → note CC = 0 automatiquement
        if ($this->isAbsentCc) {
            $this->noteCc = '0.00';
        }

        // Règle 5 : absent examen → note examen = 0 automatiquement
        if ($this->isAbsentExamen) {
            $this->noteExamen = '0.00';
        }

        // Règle 6 : on ne peut pas être absent ET avoir une note > 0
        if ($this->isAbsentCc && $this->noteCc !== null && (float)$this->noteCc > 0) {
            throw new \LogicException(
                'Incohérence : étudiant absent au CC mais note CC > 0.'
            );
        }
        if ($this->isAbsentExamen && $this->noteExamen !== null && (float)$this->noteExamen > 0) {
            throw new \LogicException(
                'Incohérence : étudiant absent à l\'examen mais note examen > 0.'
            );
        }

        // Règle 7 : calcul automatique note finale et mention
        if ($this->noteCc !== null && $this->noteExamen !== null && $this->matiere !== null) {
            $finale = $this->matiere->calculerNoteFinale(
                (float) $this->noteCc,
                (float) $this->noteExamen
            );
            $this->noteFinale = (string) $finale;
            $this->mention = Matiere::calculerMention($finale);
        }
    }

    /**
     * Vérifie si la note est validée (>= 10)
     */
    public function isValidee(): bool
    {
        return $this->noteFinale !== null
            && Matiere::estValidee((float) $this->noteFinale);
    }

    /**
     * Retourne la note finale en float
     */
    public function getNoteFinaleFloat(): ?float
    {
        return $this->noteFinale !== null ? (float) $this->noteFinale : null;
    }

    /**
     * Retourne la note CC en float
     */
    public function getNoteCcFloat(): ?float
    {
        return $this->noteCc !== null ? (float) $this->noteCc : null;
    }

    /**
     * Retourne la note examen en float
     */
    public function getNoteExamenFloat(): ?float
    {
        return $this->noteExamen !== null ? (float) $this->noteExamen : null;
    }

    /**
     * Retourne un résumé lisible de la note
     * ex: "INFO301 — RAKOTO Jean : 14.50/20 (B)"
     */
    public function getResume(): string
    {
        $matiere = $this->matiere?->getCode() ?? '?';
        $etudiant = $this->etudiant?->getNomComplet() ?? '?';
        $finale = $this->noteFinale ?? 'N/A';
        $mention = $this->mention ?? '?';
        return "{$matiere} — {$etudiant} : {$finale}/20 ({$mention})";
    }

    // =====================
    // GETTERS & SETTERS
    // =====================

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getNoteCc(): ?string
    {
        return $this->noteCc;
    }

    public function setNoteCc(?string $noteCc): static
    {
        if ($noteCc !== null) {
            $val = (float) $noteCc;
            if ($val < 0 || $val > 20) {
                throw new \InvalidArgumentException('La note CC doit être entre 0 et 20.');
            }
        }
        $this->noteCc = $noteCc;
        return $this;
    }

    public function getNoteExamen(): ?string
    {
        return $this->noteExamen;
    }

    public function setNoteExamen(?string $noteExamen): static
    {
        if ($noteExamen !== null) {
            $val = (float) $noteExamen;
            if ($val < 0 || $val > 20) {
                throw new \InvalidArgumentException("La note d'examen doit être entre 0 et 20.");
            }
        }
        $this->noteExamen = $noteExamen;
        return $this;
    }

    public function getNoteFinale(): ?string
    {
        return $this->noteFinale;
    }

    // Pas de setNoteFinale public — calculée automatiquement uniquement

    public function getMention(): ?string
    {
        return $this->mention;
    }

    // Pas de setMention public — calculée automatiquement uniquement

    public function isAbsentCc(): bool
    {
        return $this->isAbsentCc;
    }

    public function setIsAbsentCc(bool $isAbsentCc): static
    {
        $this->isAbsentCc = $isAbsentCc;
        if ($isAbsentCc) {
            $this->noteCc = '0.00';
        }
        return $this;
    }

    public function isAbsentExamen(): bool
    {
        return $this->isAbsentExamen;
    }

    public function setIsAbsentExamen(bool $isAbsentExamen): static
    {
        $this->isAbsentExamen = $isAbsentExamen;
        if ($isAbsentExamen) {
            $this->noteExamen = '0.00';
        }
        return $this;
    }

    public function getDateSaisie(): ?\DateTimeImmutable
    {
        return $this->dateSaisie;
    }

    public function getDateModification(): ?\DateTimeImmutable
    {
        return $this->dateModification;
    }

    public function getEtudiant(): ?Etudiant
    {
        return $this->etudiant;
    }

    public function setEtudiant(?Etudiant $etudiant): static
    {
        $this->etudiant = $etudiant;
        return $this;
    }

    public function getMatiere(): ?Matiere
    {
        return $this->matiere;
    }

    public function setMatiere(?Matiere $matiere): static
    {
        $this->matiere = $matiere;
        return $this;
    }

    public function getSemestre(): ?Semestre
    {
        return $this->semestre;
    }

    public function setSemestre(?Semestre $semestre): static
    {
        $this->semestre = $semestre;
        return $this;
    }

    public function getSaisiePar(): ?User
    {
        return $this->saisiePar;
    }

    public function setSaisiePar(?User $saisiePar): static
    {
        $this->saisiePar = $saisiePar;
        return $this;
    }

    public function getModifiePar(): ?User
    {
        return $this->modifiePar;
    }

    public function setModifiePar(?User $modifiePar): static
    {
        $this->modifiePar = $modifiePar;
        return $this;
    }
}