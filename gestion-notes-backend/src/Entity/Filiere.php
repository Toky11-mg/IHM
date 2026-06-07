<?php

namespace App\Entity;

use App\Repository\FiliereRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: FiliereRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['code'], message: 'Ce code filière existe déjà.')]
#[UniqueEntity(fields: ['nom'], message: 'Ce nom de filière existe déjà.')]
class Filiere
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100, unique: true)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(min: 2, max: 100, minMessage: 'Minimum 2 caractères.', maxMessage: 'Maximum 100 caractères.')]
    #[Assert\Regex(
        pattern: '/^[A-ZÀ-Ÿa-zà-ÿ\s\-]+$/',
        message: 'Le nom ne peut contenir que des lettres, espaces et tirets.'
    )]
    private ?string $nom = null;

    #[ORM\Column(length: 10, unique: true)]
    #[Assert\NotBlank(message: 'Le code est obligatoire.')]
    #[Assert\Regex(
        pattern: '/^[A-Z]{2,10}$/',
        message: 'Le code doit contenir uniquement des lettres majuscules (ex: INFO, GEST).'
    )]
    private ?string $code = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Assert\Length(max: 1000, maxMessage: 'La description ne peut pas dépasser 1000 caractères.')]
    private ?string $description = null;

    // Responsable de la filière (un enseignant)
    #[ORM\ManyToOne(targetEntity: Enseignant::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Enseignant $responsable = null;

    // Une filière a plusieurs niveaux
    #[ORM\OneToMany(mappedBy: 'filiere', targetEntity: Niveau::class, cascade: ['persist'])]
    private Collection $niveaux;

    public function __construct()
    {
        $this->niveaux = new ArrayCollection();
    }

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function normalize(): void
    {
        // Normalisation automatique avant sauvegarde
        if ($this->nom) {
            $this->nom = trim($this->nom);
        }
        if ($this->code) {
            $this->code = strtoupper(trim($this->code));
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

    public function getDescription(): ?string
    {
        return $this->description;
    }

    public function setDescription(?string $description): static
    {
        $this->description = $description;
        return $this;
    }

    public function getResponsable(): ?Enseignant
    {
        return $this->responsable;
    }

    public function setResponsable(?Enseignant $responsable): static
    {
        $this->responsable = $responsable;
        return $this;
    }

    public function getNiveaux(): Collection
    {
        return $this->niveaux;
    }

    public function addNiveau(Niveau $niveau): static
    {
        if (!$this->niveaux->contains($niveau)) {
            $this->niveaux->add($niveau);
            $niveau->setFiliere($this);
        }
        return $this;
    }

    public function removeNiveau(Niveau $niveau): static
    {
        if ($this->niveaux->removeElement($niveau)) {
            if ($niveau->getFiliere() === $this) {
                $niveau->setFiliere(null);
            }
        }
        return $this;
    }
}