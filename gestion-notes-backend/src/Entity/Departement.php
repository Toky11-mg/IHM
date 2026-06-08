<?php
namespace App\Entity;

use App\Repository\DepartementRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: DepartementRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['code'], message: 'Ce code département existe déjà.')]
class Departement
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(min: 2, max: 100)]
    private ?string $nom = null;

    #[ORM\Column(length: 10, unique: true)]
    #[Assert\NotBlank(message: 'Le code est obligatoire.')]
    #[Assert\Regex(
        pattern: '/^[A-Z]{2,10}$/',
        message: 'Le code doit contenir uniquement des lettres majuscules.'
    )]
    private ?string $code = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Assert\Length(max: 1000)]
    private ?string $description = null;

    #[ORM\ManyToOne(targetEntity: Filiere::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Filiere $filiere = null;

    #[ORM\ManyToOne(targetEntity: Enseignant::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?Enseignant $responsable = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $chefDepartement = null;

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function normalize(): void
    {
        if ($this->code) $this->code = strtoupper(trim($this->code));
        if ($this->nom)  $this->nom  = trim($this->nom);
    }

    public function getId(): ?int { return $this->id; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = trim($nom); return $this; }

    public function getCode(): ?string { return $this->code; }
    public function setCode(string $code): static { $this->code = strtoupper(trim($code)); return $this; }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $description): static { $this->description = $description; return $this; }

    public function getFiliere(): ?Filiere { return $this->filiere; }
    public function setFiliere(?Filiere $filiere): static { $this->filiere = $filiere; return $this; }

    public function getResponsable(): ?Enseignant { return $this->responsable; }
    public function setResponsable(?Enseignant $responsable): static { $this->responsable = $responsable; return $this; }

    public function getChefDepartement(): ?User { return $this->chefDepartement; }
    public function setChefDepartement(?User $user): static { $this->chefDepartement = $user; return $this; }
}