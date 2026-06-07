<?php

namespace App\Entity;

use App\Repository\DeliberationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: DeliberationRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(
    fields: ['etudiant', 'semestre'],
    message: 'Une délibération existe déjà pour cet étudiant dans ce semestre.'
)]
class Deliberation
{
    private const DECISIONS = [
        'admis'       => 10.00,
        'admis_dette' => 8.00,
        'redoublant'  => 7.00,
        'exclu'       => 0.00,
    ];

    private const MENTIONS = [
        'Excellent'  => 18.00,
        'Tres_Bien'  => 16.00,
        'Bien'       => 14.00,
        'Assez_Bien' => 12.00,
        'Passable'   => 10.00,
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?string $id = null;

    #[ORM\Column(type: 'decimal', precision: 5, scale: 2, nullable: true)]
    #[Assert\Range(
        min: 0, max: 20,
        notInRangeMessage: 'La moyenne doit être entre {{ min }} et {{ max }}.'
    )]
    private ?string $moyenneGenerale = null;

    #[ORM\Column(nullable: true)]
    #[Assert\PositiveOrZero(message: 'Le total des crédits doit être positif ou zéro.')]
    private ?int $totalCredits = null;

    #[ORM\Column(nullable: true)]
    #[Assert\PositiveOrZero(message: 'Les crédits validés doivent être positifs ou zéro.')]
    private ?int $creditsValides = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'La décision est obligatoire.')]
    #[Assert\Choice(
        choices: ['admis', 'admis_dette', 'redoublant', 'exclu', 'en_attente'],
        message: 'Décision invalide.'
    )]
    private string $decision = 'en_attente';

    #[ORM\Column(length: 30, nullable: true)]
    #[Assert\Choice(
        choices: ['Passable', 'Assez_Bien', 'Bien', 'Tres_Bien', 'Excellent'],
        message: 'Mention invalide.'
    )]
    private ?string $mentionGlobale = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Assert\Length(
        max: 2000,
        maxMessage: 'Les observations ne peuvent pas dépasser {{ limit }} caractères.'
    )]
    private ?string $observations = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateDeliberation = null;

    #[ORM\Column]
    private bool $isPublie = false;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\ManyToOne(targetEntity: Etudiant::class, inversedBy: 'deliberations')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: "L'étudiant est obligatoire.")]
    private ?Etudiant $etudiant = null;

    #[ORM\ManyToOne(targetEntity: Semestre::class, inversedBy: 'deliberations')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'Le semestre est obligatoire.')]
    private ?Semestre $semestre = null;

    #[ORM\ManyToOne(targetEntity: AnneUniversitaire::class, inversedBy: 'deliberations')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: "L'année universitaire est obligatoire.")]
    private ?AnneUniversitaire $anneeUniversitaire = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $deliberePar = null;

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function calculer(): void
    {
        // Règle : délibération publiée → AUCUNE modification possible
        if ($this->isPublie) {
            throw new \LogicException(
                'Impossible de modifier une délibération déjà publiée. '
                . 'Contactez un administrateur.'
            );
        }

        // Règle : crédits validés ne peuvent pas dépasser le total
        if ($this->creditsValides !== null && $this->totalCredits !== null) {
            if ($this->creditsValides > $this->totalCredits) {
                throw new \LogicException(
                    "Les crédits validés ({$this->creditsValides}) ne peuvent pas "
                    . "dépasser le total ({$this->totalCredits})."
                );
            }
        }

        // Calcul automatique décision et mention depuis la moyenne
        if ($this->moyenneGenerale !== null) {
            $moy = (float) $this->moyenneGenerale;
            $this->decision = $this->calculerDecision($moy);
            $this->mentionGlobale = $moy >= 10.00 ? $this->calculerMention($moy) : null;
        }

        // Règle : semestre doit être clôturé avant délibération
        if ($this->semestre !== null && !$this->semestre->isCloture()) {
            throw new \LogicException(
                'Impossible de délibérer : le semestre n\'est pas encore clôturé.'
            );
        }
    }

    // =====================
    // MÉTHODES MÉTIER
    // =====================

    private function calculerDecision(float $moyenne): string
    {
        return match(true) {
            $moyenne >= 10.00 => 'admis',
            $moyenne >= 8.00  => 'admis_dette',
            $moyenne >= 7.00  => 'redoublant',
            default           => 'exclu',
        };
    }

    private function calculerMention(float $moyenne): string
    {
        return match(true) {
            $moyenne >= 18.00 => 'Excellent',
            $moyenne >= 16.00 => 'Tres_Bien',
            $moyenne >= 14.00 => 'Bien',
            $moyenne >= 12.00 => 'Assez_Bien',
            default           => 'Passable',
        };
    }

    public function isAdmis(): bool
    {
        return in_array($this->decision, ['admis', 'admis_dette']);
    }

    /**
     * Publie la délibération — action irréversible
     */
    public function publier(User $admin): void
    {
        if ($this->moyenneGenerale === null) {
            throw new \LogicException(
                'Impossible de publier : la moyenne générale n\'est pas calculée.'
            );
        }
        if ($this->decision === 'en_attente') {
            throw new \LogicException(
                'Impossible de publier : la décision n\'est pas encore définie.'
            );
        }
        $this->isPublie = true;
        $this->dateDeliberation = new \DateTime();
        $this->deliberePar = $admin;
    }

    /**
     * Calcule le taux de réussite en crédits
     */
    public function getTauxReussite(): ?float
    {
        if ($this->totalCredits === null || $this->totalCredits === 0) {
            return null;
        }
        return round(($this->creditsValides / $this->totalCredits) * 100, 2);
    }

    public function getMoyenneGeneraleFloat(): ?float
    {
        return $this->moyenneGenerale !== null ? (float) $this->moyenneGenerale : null;
    }

    // =====================
    // GETTERS & SETTERS
    // =====================

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getMoyenneGenerale(): ?string
    {
        return $this->moyenneGenerale;
    }

    public function setMoyenneGenerale(?string $moyenneGenerale): static
    {
        if ($moyenneGenerale !== null) {
            $val = (float) $moyenneGenerale;
            if ($val < 0 || $val > 20) {
                throw new \InvalidArgumentException('La moyenne doit être entre 0 et 20.');
            }
        }
        $this->moyenneGenerale = $moyenneGenerale;
        return $this;
    }

    public function getTotalCredits(): ?int
    {
        return $this->totalCredits;
    }

    public function setTotalCredits(?int $totalCredits): static
    {
        $this->totalCredits = $totalCredits;
        return $this;
    }

    public function getCreditsValides(): ?int
    {
        return $this->creditsValides;
    }

    public function setCreditsValides(?int $creditsValides): static
    {
        $this->creditsValides = $creditsValides;
        return $this;
    }

    public function getDecision(): string
    {
        return $this->decision;
    }

    public function setDecision(string $decision): static
    {
        // Blocage : une délibération publiée ne peut plus être modifiée
        if ($this->isPublie) {
            throw new \LogicException('Impossible de modifier la décision : délibération publiée.');
        }
        $this->decision = $decision;
        return $this;
    }

    public function getMentionGlobale(): ?string
    {
        return $this->mentionGlobale;
    }

    public function setMentionGlobale(?string $mentionGlobale): static
    {
        $this->mentionGlobale = $mentionGlobale;
        return $this;
    }

    public function getObservations(): ?string
    {
        return $this->observations;
    }

    public function setObservations(?string $observations): static
    {
        $this->observations = $observations !== null ? trim($observations) : null;
        return $this;
    }

    public function getDateDeliberation(): ?\DateTimeInterface
    {
        return $this->dateDeliberation;
    }

    public function setDateDeliberation(?\DateTimeInterface $dateDeliberation): static
    {
        $this->dateDeliberation = $dateDeliberation;
        return $this;
    }

    public function isPublie(): bool
    {
        return $this->isPublie;
    }

    public function setIsPublie(bool $isPublie): static
    {
        $this->isPublie = $isPublie;
        return $this;
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

    public function getSemestre(): ?Semestre
    {
        return $this->semestre;
    }

    public function setSemestre(?Semestre $semestre): static
    {
        $this->semestre = $semestre;
        return $this;
    }

    public function getAnneeUniversitaire(): ?AnneUniversitaire
    {
        return $this->anneeUniversitaire;
    }

    public function setAnneeUniversitaire(?AnneUniversitaire $anneeUniversitaire): static
    {
        $this->anneeUniversitaire = $anneeUniversitaire;
        return $this;
    }

    public function getDeliberePar(): ?User
    {
        return $this->deliberePar;
    }

    public function setDeliberePar(?User $deliberePar): static
    {
        $this->deliberePar = $deliberePar;
        return $this;
    }
}