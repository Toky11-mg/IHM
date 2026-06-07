<?php

namespace App\Entity;

use App\Repository\NiveauRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: NiveauRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(
    fields: ['code'],
    message: 'Ce code niveau existe déjà.'
)]
#[UniqueEntity(
    fields: ['nom', 'filiere'],
    message: 'Ce niveau existe déjà pour cette filière.'
)]
class Niveau
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 10)]
    #[Assert\NotBlank(message: 'Le nom du niveau est obligatoire.')]
    #[Assert\Choice(
        choices: ['L1', 'L2', 'L3', 'M1', 'M2', 'D1', 'D2', 'D3'],
        message: 'Niveau invalide. Valeurs autorisées : L1, L2, L3, M1, M2, D1, D2, D3.'
    )]
    private ?string $nom = null;

    #[ORM\Column(length: 5, unique: true)]
    #[Assert\NotBlank(message: 'Le code est obligatoire.')]
    #[Assert\Regex(
        pattern: '/^[A-Z0-9]{2,5}$/',
        message: 'Le code doit contenir uniquement des lettres majuscules et chiffres (ex: L1, M2).'
    )]
    private ?string $code = null;

    #[ORM\Column]
    #[Assert\NotNull(message: 'Les crédits requis sont obligatoires.')]
    #[Assert\Range(
        min: 30,
        max: 360,
        notInRangeMessage: 'Les crédits doivent être entre {{ min }} et {{ max }}.'
    )]
    private ?int $creditsRequis = null;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\ManyToOne(targetEntity: Filiere::class, inversedBy: 'niveaux')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'La filière est obligatoire.')]
    private ?Filiere $filiere = null;

    #[ORM\OneToMany(mappedBy: 'niveau', targetEntity: Semestre::class, cascade: ['persist'])]
    private Collection $semestres;

    #[ORM\OneToMany(mappedBy: 'niveau', targetEntity: Etudiant::class)]
    private Collection $etudiants;

    public function __construct()
    {
        $this->semestres = new ArrayCollection();
        $this->etudiants = new ArrayCollection();
    }

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function normalize(): void
    {
        if ($this->code) {
            $this->code = strtoupper(trim($this->code));
        }
        if ($this->nom) {
            $this->nom = strtoupper(trim($this->nom));
        }
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

    public function getCode(): ?string
    {
        return $this->code;
    }

    public function setCode(string $code): static
    {
        $this->code = strtoupper(trim($code));
        return $this;
    }

    public function getCreditsRequis(): ?int
    {
        return $this->creditsRequis;
    }

    public function setCreditsRequis(int $creditsRequis): static
    {
        $this->creditsRequis = $creditsRequis;
        return $this;
    }

    public function getFiliere(): ?Filiere
    {
        return $this->filiere;
    }

    public function setFiliere(?Filiere $filiere): static
    {
        $this->filiere = $filiere;
        return $this;
    }

    public function getSemestres(): Collection
    {
        return $this->semestres;
    }

    public function addSemestre(Semestre $semestre): static
    {
        if (!$this->semestres->contains($semestre)) {
            $this->semestres->add($semestre);
            $semestre->setNiveau($this);
        }
        return $this;
    }

    public function removeSemestre(Semestre $semestre): static
    {
        if ($this->semestres->removeElement($semestre)) {
            if ($semestre->getNiveau() === $this) {
                $semestre->setNiveau(null);
            }
        }
        return $this;
    }

    public function getEtudiants(): Collection
    {
        return $this->etudiants;
    }
}