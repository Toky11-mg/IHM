<?php
namespace App\Entity;

use App\Repository\SessionRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: SessionRepository::class)]
#[ORM\HasLifecycleCallbacks]
class Session
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank]
    #[Assert\Choice(
        choices: ['normale', 'rattrapage'],
        message: 'Type invalide. Valeurs : normale, rattrapage.'
    )]
    private ?string $type = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le libellé est obligatoire.')]
    #[Assert\Length(min: 2, max: 100)]
    private ?string $libelle = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(message: 'La date de début est obligatoire.')]
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(message: 'La date de fin est obligatoire.')]
    #[Assert\GreaterThan(
        propertyPath: 'dateDebut',
        message: 'La date de fin doit être après la date de début.'
    )]
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column]
    private bool $isActive = true;

    #[ORM\ManyToOne(targetEntity: Semestre::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'Le semestre est obligatoire.')]
    private ?Semestre $semestre = null;

    #[ORM\ManyToOne(targetEntity: AnneUniversitaire::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: "L'année universitaire est obligatoire.")]
    private ?AnneUniversitaire $anneeUniversitaire = null;

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function validate(): void
    {
        // Session rattrapage : doit être après session normale
        if ($this->type === 'rattrapage' && $this->semestre !== null) {
            if ($this->dateDebut && $this->semestre->getDateFinSaisie()) {
                if ($this->dateDebut < $this->semestre->getDateFinSaisie()) {
                    throw new \LogicException(
                        'La session de rattrapage doit commencer après la fin de saisie du semestre.'
                    );
                }
            }
        }
    }

    public function getId(): ?int { return $this->id; }

    public function getType(): ?string { return $this->type; }
    public function setType(string $type): static { $this->type = $type; return $this; }

    public function getLibelle(): ?string { return $this->libelle; }
    public function setLibelle(string $libelle): static { $this->libelle = trim($libelle); return $this; }

    public function getDateDebut(): ?\DateTimeInterface { return $this->dateDebut; }
    public function setDateDebut(\DateTimeInterface $dateDebut): static { $this->dateDebut = $dateDebut; return $this; }

    public function getDateFin(): ?\DateTimeInterface { return $this->dateFin; }
    public function setDateFin(\DateTimeInterface $dateFin): static { $this->dateFin = $dateFin; return $this; }

    public function isActive(): bool { return $this->isActive; }
    public function setIsActive(bool $isActive): static { $this->isActive = $isActive; return $this; }

    public function getSemestre(): ?Semestre { return $this->semestre; }
    public function setSemestre(?Semestre $semestre): static { $this->semestre = $semestre; return $this; }

    public function getAnneeUniversitaire(): ?AnneUniversitaire { return $this->anneeUniversitaire; }
    public function setAnneeUniversitaire(?AnneUniversitaire $a): static { $this->anneeUniversitaire = $a; return $this; }
}