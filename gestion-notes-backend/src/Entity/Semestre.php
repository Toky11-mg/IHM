<?php

namespace App\Entity;

use App\Repository\SemestreRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: SemestreRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(
    fields: ['nom', 'niveau', 'anneeUniversitaire'],
    message: 'Ce semestre existe déjà pour ce niveau et cette année.'
)]
class Semestre
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 10)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Choice(
        choices: ['S1','S2','S3','S4','S5','S6','S7','S8','S9','S10'],
        message: 'Semestre invalide. Valeurs autorisées : S1 à S10.'
    )]
    private ?string $nom = null;

    #[ORM\Column(type: 'date', nullable: true)]
    private ?\DateTimeInterface $dateDebutSaisie = null;

    #[ORM\Column(type: 'date', nullable: true)]
    #[Assert\Expression(
        expression: 'this.getDateDebutSaisie() === null or this.getDateFinSaisie() === null or this.getDateFinSaisie() > this.getDateDebutSaisie()',
        message: 'La date de fin de saisie doit être après la date de début.'
    )]
    private ?\DateTimeInterface $dateFinSaisie = null;

    #[ORM\Column]
    private bool $isCloture = false;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\ManyToOne(targetEntity: Niveau::class, inversedBy: 'semestres')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'Le niveau est obligatoire.')]
    private ?Niveau $niveau = null;

    #[ORM\ManyToOne(targetEntity: AnneUniversitaire::class, inversedBy: 'semestres')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: "L'année universitaire est obligatoire.")]
    private ?AnneUniversitaire $anneeUniversitaire = null;

    #[ORM\OneToMany(mappedBy: 'semestre', targetEntity: Matiere::class, cascade: ['persist'])]
    private Collection $matieres;

    #[ORM\OneToMany(mappedBy: 'semestre', targetEntity: Note::class)]
    private Collection $notes;

    #[ORM\OneToMany(mappedBy: 'semestre', targetEntity: Deliberation::class)]
    private Collection $deliberations;

    public function __construct()
    {
        $this->matieres = new ArrayCollection();
        $this->notes = new ArrayCollection();
        $this->deliberations = new ArrayCollection();
    }

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function validate(): void
    {
        // Règle : semestre cohérent avec le niveau
        if ($this->nom && $this->niveau) {
            $niveauNom = $this->niveau->getNom();
            $numSemestre = (int) substr($this->nom, 1);

            $regles = [
                'L1' => [1, 2],
                'L2' => [3, 4],
                'L3' => [5, 6],
                'M1' => [7, 8],
                'M2' => [9, 10],
                'D1' => [1, 2],
                'D2' => [3, 4],
                'D3' => [5, 6],
            ];

            if (isset($regles[$niveauNom])) {
                [$min, $max] = $regles[$niveauNom];
                if ($numSemestre < $min || $numSemestre > $max) {
                    throw new \LogicException(
                        "Le semestre {$this->nom} n'est pas valide pour le niveau {$niveauNom}. "
                        . "Semestres autorisés : S{$min} et S{$max}."
                    );
                }
            }
        }

        // Règle : impossible de clôturer un semestre sans notes
        if ($this->isCloture && $this->notes->isEmpty()) {
            throw new \LogicException(
                'Impossible de clôturer un semestre sans aucune note enregistrée.'
            );
        }
    }

    // =====================
    // MÉTHODES MÉTIER
    // =====================

    /**
     * Vérifie si la saisie de notes est actuellement ouverte
     */
    public function isSaisieOuverte(): bool
    {
        if ($this->isCloture) {
            return false;
        }
        $now = new \DateTime();
        if ($this->dateDebutSaisie && $now < $this->dateDebutSaisie) {
            return false;
        }
        if ($this->dateFinSaisie && $now > $this->dateFinSaisie) {
            return false;
        }
        return true;
    }

    /**
     * Clôture le semestre — irréversible sauf ROLE_SUPER_ADMIN
     */
    public function cloturer(): void
    {
        if ($this->notes->isEmpty()) {
            throw new \LogicException('Impossible de clôturer un semestre sans notes.');
        }
        $this->isCloture = true;
        $this->dateFinSaisie = new \DateTime();
    }

    /**
     * Retourne le libellé complet ex: "S1 - L1 Informatique 2024-2025"
     */
    public function getLibelleComplet(): string
    {
        $niveau = $this->niveau?->getNom() ?? '';
        $filiere = $this->niveau?->getFiliere()?->getNom() ?? '';
        $annee = $this->anneeUniversitaire?->getLibelle() ?? '';
        return "{$this->nom} - {$niveau} {$filiere} {$annee}";
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
        $this->nom = strtoupper(trim($nom));
        return $this;
    }

    public function getDateDebutSaisie(): ?\DateTimeInterface
    {
        return $this->dateDebutSaisie;
    }

    public function setDateDebutSaisie(?\DateTimeInterface $d): static
    {
        $this->dateDebutSaisie = $d;
        return $this;
    }

    public function getDateFinSaisie(): ?\DateTimeInterface
    {
        return $this->dateFinSaisie;
    }

    public function setDateFinSaisie(?\DateTimeInterface $d): static
    {
        $this->dateFinSaisie = $d;
        return $this;
    }

    public function isCloture(): bool
    {
        return $this->isCloture;
    }

    public function setIsCloture(bool $isCloture): static
    {
        $this->isCloture = $isCloture;
        return $this;
    }

    public function getNiveau(): ?Niveau
    {
        return $this->niveau;
    }

    public function setNiveau(?Niveau $niveau): static
    {
        $this->niveau = $niveau;
        return $this;
    }

    public function getAnneeUniversitaire(): ?AnneUniversitaire
    {
        return $this->anneeUniversitaire;
    }

    public function setAnneeUniversitaire(?AnneUniversitaire $a): static
    {
        $this->anneeUniversitaire = $a;
        return $this;
    }

    public function getMatieres(): Collection
    {
        return $this->matieres;
    }

    public function addMatiere(Matiere $matiere): static
    {
        if (!$this->matieres->contains($matiere)) {
            $this->matieres->add($matiere);
            $matiere->setSemestre($this);
        }
        return $this;
    }

    public function removeMatiere(Matiere $matiere): static
    {
        if ($this->matieres->removeElement($matiere)) {
            if ($matiere->getSemestre() === $this) {
                $matiere->setSemestre(null);
            }
        }
        return $this;
    }

    public function getNotes(): Collection
    {
        return $this->notes;
    }

    public function getDeliberations(): Collection
    {
        return $this->deliberations;
    }
}