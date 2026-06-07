<?php

namespace App\Entity;

use App\Repository\MatiereRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: MatiereRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['code'], message: 'Ce code matière existe déjà.')]
class Matiere
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(
        min: 2, max: 150,
        minMessage: 'Le nom doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^[A-ZÀ-Ÿa-zà-ÿ0-9\s\-\'\,\.]+$/i',
        message: 'Le nom contient des caractères invalides.'
    )]
    private ?string $nom = null;

    #[ORM\Column(length: 15, unique: true)]
    #[Assert\NotBlank(message: 'Le code est obligatoire.')]
    #[Assert\Regex(
        pattern: '/^[A-Z]{2,6}\d{3}$/',
        message: 'Code invalide. Exemple : INFO301, MATH201.'
    )]
    private ?string $code = null;

    #[ORM\Column]
    #[Assert\NotNull(message: 'Les crédits sont obligatoires.')]
    #[Assert\Range(
        min: 1, max: 10,
        notInRangeMessage: 'Les crédits doivent être entre {{ min }} et {{ max }}.'
    )]
    private ?int $credit = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2)]
    #[Assert\NotNull(message: 'Le coefficient est obligatoire.')]
    #[Assert\Range(
        min: 1.0, max: 5.0,
        notInRangeMessage: 'Le coefficient doit être entre {{ min }} et {{ max }}.'
    )]
    private ?string $coefficient = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Le type est obligatoire.')]
    #[Assert\Choice(
        choices: ['cours', 'td', 'tp', 'stage', 'memoire'],
        message: 'Type invalide. Valeurs : cours, td, tp, stage, memoire.'
    )]
    private ?string $type = null;

    #[ORM\Column(type: 'decimal', precision: 3, scale: 2)]
    #[Assert\NotNull(message: 'Le poids CC est obligatoire.')]
    #[Assert\Range(
        min: 0.0, max: 1.0,
        notInRangeMessage: 'Le poids CC doit être entre 0 et 1.'
    )]
    private ?string $noteCcPoids = '0.40';

    #[ORM\Column(type: 'decimal', precision: 3, scale: 2)]
    #[Assert\NotNull(message: 'Le poids examen est obligatoire.')]
    #[Assert\Range(
        min: 0.0, max: 1.0,
        notInRangeMessage: 'Le poids examen doit être entre 0 et 1.'
    )]
    private ?string $noteExPoids = '0.60';

    #[ORM\Column]
    private bool $isActive = true;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\ManyToOne(targetEntity: Semestre::class, inversedBy: 'matieres')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'Le semestre est obligatoire.')]
    private ?Semestre $semestre = null;

    #[ORM\ManyToOne(targetEntity: Enseignant::class, inversedBy: 'matieres')]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Enseignant $enseignant = null;

    #[ORM\OneToMany(mappedBy: 'matiere', targetEntity: Note::class, cascade: ['remove'])]
    private Collection $notes;

    public function __construct()
    {
        $this->notes = new ArrayCollection();
        $this->isActive = true;
        $this->noteCcPoids = '0.40';
        $this->noteExPoids = '0.60';
    }

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function validate(): void
    {
        // Normalisation
        if ($this->code) {
            $this->code = strtoupper(trim($this->code));
        }
        if ($this->nom) {
            $this->nom = trim($this->nom);
        }

        // Règle : noteCcPoids + noteExPoids = 1.00 OBLIGATOIREMENT
        $cc = round((float) $this->noteCcPoids, 2);
        $ex = round((float) $this->noteExPoids, 2);
        if (abs(($cc + $ex) - 1.0) > 0.001) {
            throw new \LogicException(
                "La somme des poids CC ({$cc}) + Examen ({$ex}) doit être exactement égale à 1.00."
            );
        }

        // Règle : enseignant doit être actif si assigné
        if ($this->enseignant !== null && !$this->enseignant->isActif()) {
            throw new \LogicException(
                "Impossible d'assigner la matière '{$this->nom}' à un enseignant inactif."
            );
        }

        // Règle : impossible de désactiver une matière avec des notes existantes
        // dans un semestre non clôturé
        if (!$this->isActive && !$this->notes->isEmpty()) {
            $semestre = $this->semestre;
            if ($semestre && !$semestre->isCloture()) {
                throw new \LogicException(
                    "Impossible de désactiver la matière '{$this->nom}' : "
                    . "des notes existent dans un semestre non clôturé."
                );
            }
        }

        // Règle : stage et mémoire ont un poids examen = 1.00 obligatoirement
        if (in_array($this->type, ['stage', 'memoire'])) {
            $this->noteCcPoids = '0.00';
            $this->noteExPoids = '1.00';
        }
    }

    // =====================
    // MÉTHODES MÉTIER
    // =====================

    /**
     * Calcule la note finale d'un étudiant pour cette matière
     */
    public function calculerNoteFinale(float $cc, float $exam): float
    {
        if ($cc < 0 || $cc > 20 || $exam < 0 || $exam > 20) {
            throw new \InvalidArgumentException('Les notes doivent être entre 0 et 20.');
        }
        return round(
            ($cc * (float) $this->noteCcPoids) + ($exam * (float) $this->noteExPoids),
            2
        );
    }

    /**
     * Retourne la mention selon la note finale
     */
    public static function calculerMention(float $noteFinale): string
    {
        return match(true) {
            $noteFinale >= 16.00 => 'A',
            $noteFinale >= 14.00 => 'B',
            $noteFinale >= 12.00 => 'C',
            $noteFinale >= 10.00 => 'D',
            default              => 'F',
        };
    }

    /**
     * Vérifie si la matière est validée (note >= 10)
     */
    public static function estValidee(float $noteFinale): bool
    {
        return $noteFinale >= 10.00;
    }

    /**
     * Retourne le libellé complet ex: "INFO301 - Algorithmique (S1)"
     */
    public function getLibelleComplet(): string
    {
        $semestre = $this->semestre?->getNom() ?? '';
        return "{$this->code} - {$this->nom} ({$semestre})";
    }

    public function isActive(): bool
    {
        return $this->isActive;
    }

    // =====================
    // GETTERS & SETTERS
    // =====================

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNom(): ?string
    {
        return $this->nom;
    }

    public function setNom(string $nom): static
    {
        $this->nom = trim($nom);
        return $this;
    }

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = strtoupper(trim($code));
        return $this;
    }

    public function getCredit(): ?int
    {
        return $this->credit;
    }

    public function setCredit(int $credit): static
    {
        $this->credit = $credit;
        return $this;
    }

    public function getCoefficient(): ?string
    {
        return $this->coefficient;
    }

    public function setCoefficient(string $coefficient): static
    {
        $this->coefficient = $coefficient;
        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;
        return $this;
    }

    public function getNoteCcPoids(): ?string
    {
        return $this->noteCcPoids;
    }

    public function setNoteCcPoids(string $noteCcPoids): static
    {
        $this->noteCcPoids = $noteCcPoids;
        return $this;
    }

    public function getNoteExPoids(): ?string
    {
        return $this->noteExPoids;
    }

    public function setNoteExPoids(string $noteExPoids): static
    {
        $this->noteExPoids = $noteExPoids;
        return $this;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;
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

    public function getEnseignant(): ?Enseignant
    {
        return $this->enseignant;
    }

    public function setEnseignant(?Enseignant $enseignant): static
    {
        if ($enseignant !== null && !$enseignant->isActif()) {
            throw new \LogicException(
                "L'enseignant doit être actif pour être assigné à une matière."
            );
        }
        $this->enseignant = $enseignant;
        return $this;
    }

    public function getNotes(): Collection
    {
        return $this->notes;
    }
}