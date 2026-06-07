<?php

namespace App\Entity;

use App\Repository\AnneUniversitaireRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: AnneUniversitaireRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['libelle'], message: 'Cette année universitaire existe déjà.')]
class AnneUniversitaire
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 9, unique: true)]
    #[Assert\NotBlank(message: 'Le libellé est obligatoire.')]
    #[Assert\Regex(
        pattern: '/^\d{4}-\d{4}$/',
        message: 'Format invalide. Exemple : 2024-2025.'
    )]
    private ?string $libelle = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(message: 'La date de début est obligatoire.')]
    #[Assert\LessThan(
        propertyPath: 'dateFin',
        message: 'La date de début doit être avant la date de fin.'
    )]
    private ?\DateTimeInterface $dateDebut = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(message: 'La date de fin est obligatoire.')]
    #[Assert\GreaterThan(
        propertyPath: 'dateDebut',
        message: 'La date de fin doit être après la date de début.'
    )]
    private ?\DateTimeInterface $dateFin = null;

    #[ORM\Column]
    private bool $isCurrent = false;

    #[ORM\OneToMany(mappedBy: 'anneeUniversitaire', targetEntity: Semestre::class, cascade: ['persist'])]
    private Collection $semestres;

    #[ORM\OneToMany(mappedBy: 'anneeUniversitaire', targetEntity: Deliberation::class)]
    private Collection $deliberations;

    public function __construct()
    {
        $this->semestres = new ArrayCollection();
        $this->deliberations = new ArrayCollection();
    }

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function validate(): void
    {
        // Règle : 2ème année = 1ère + 1
        if ($this->libelle && preg_match('/^(\d{4})-(\d{4})$/', $this->libelle, $m)) {
            if ((int)$m[2] !== (int)$m[1] + 1) {
                throw new \LogicException('La 2ème année doit être égale à la 1ère + 1. Ex: 2024-2025.');
            }
        }

        // Règle : pas de chevauchement avec années existantes
        // (géré côté service/controller pour accès au repository)

        // Règle : dateDebut doit être dans l'année 1 du libellé
        if ($this->libelle && $this->dateDebut) {
            $annee1 = (int) substr($this->libelle, 0, 4);
            $anneeDebut = (int) $this->dateDebut->format('Y');
            if ($anneeDebut !== $annee1) {
                throw new \LogicException("La date de début doit être dans l'année $annee1.");
            }
        }
    }

    // =====================
    // MÉTHODES MÉTIER
    // =====================

    /**
     * Vérifie si une date donnée est dans cette année universitaire
     */
    public function contientDate(\DateTimeInterface $date): bool
    {
        return $date >= $this->dateDebut && $date <= $this->dateFin;
    }

    /**
     * Retourne le libellé formaté ex: "Année universitaire 2024-2025"
     */
    public function getLibelleComplet(): string
    {
        return 'Année universitaire ' . $this->libelle;
    }

    // =====================
    // GETTERS & SETTERS
    // =====================

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getLibelle(): ?string
    {
        return $this->libelle;
    }

    public function setLibelle(string $libelle): static
    {
        $this->libelle = trim($libelle);
        return $this;
    }

    public function getDateDebut(): ?\DateTimeInterface
    {
        return $this->dateDebut;
    }

    public function setDateDebut(\DateTimeInterface $dateDebut): static
    {
        $this->dateDebut = $dateDebut;
        return $this;
    }

    public function getDateFin(): ?\DateTimeInterface
    {
        return $this->dateFin;
    }

    public function setDateFin(\DateTimeInterface $dateFin): static
    {
        $this->dateFin = $dateFin;
        return $this;
    }

    public function isCurrent(): bool
    {
        return $this->isCurrent;
    }

    public function setIsCurrent(bool $isCurrent): static
    {
        $this->isCurrent = $isCurrent;
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
            $semestre->setAnneeUniversitaire($this);
        }
        return $this;
    }

    public function removeSemestre(Semestre $semestre): static
    {
        if ($this->semestres->removeElement($semestre)) {
            if ($semestre->getAnneeUniversitaire() === $this) {
                $semestre->setAnneeUniversitaire(null);
            }
        }
        return $this;
    }

    public function getDeliberations(): Collection
    {
        return $this->deliberations;
    }
}