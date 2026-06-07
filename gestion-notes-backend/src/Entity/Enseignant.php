<?php

namespace App\Entity;

use App\Repository\EnseignantRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: EnseignantRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['matricule'], message: 'Ce matricule existe déjà.')]
#[UniqueEntity(fields: ['user'], message: 'Cet utilisateur est déjà un enseignant.')]
class Enseignant
{
    // Transitions de statut autorisées
    private const TRANSITIONS_STATUT = [
        'actif'    => ['retraite', 'conge'],
        'conge'    => ['actif'],
        'retraite' => [], // irréversible
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 50)]
    #[Assert\NotBlank(message: 'Le nom est obligatoire.')]
    #[Assert\Length(
        min: 2, max: 50,
        minMessage: 'Le nom doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le nom ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^[A-ZÀ-Ÿa-zà-ÿ\s\-\']+$/',
        message: 'Le nom ne peut contenir que des lettres, espaces et tirets.'
    )]
    private ?string $nom = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le prénom est obligatoire.')]
    #[Assert\Length(
        min: 2, max: 100,
        minMessage: 'Le prénom doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le prénom ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^[A-ZÀ-Ÿa-zà-ÿ\s\-\']+$/',
        message: 'Le prénom ne peut contenir que des lettres, espaces et tirets.'
    )]
    private ?string $prenom = null;

    #[ORM\Column(length: 15, unique: true)]
    #[Assert\NotBlank(message: 'Le matricule est obligatoire.')]
    #[Assert\Regex(
        pattern: '/^ENS-\d{4}-\d{5}$/',
        message: 'Format matricule invalide. Exemple : ENS-2024-00001.'
    )]
    private ?string $matricule = null;

    #[ORM\Column(length: 15, nullable: true)]
    #[Assert\Regex(
        pattern: '/^\+261[0-9]{9}$/',
        message: 'Format invalide. Exemple : +261341234567.'
    )]
    private ?string $telephone = null;

    #[ORM\Column(length: 30)]
    #[Assert\NotBlank(message: 'Le grade est obligatoire.')]
    #[Assert\Choice(
        choices: ['Assistant', 'Maitre_Assistant', 'Maitre_Conference', 'Professeur'],
        message: 'Grade invalide. Valeurs : Assistant, Maitre_Assistant, Maitre_Conference, Professeur.'
    )]
    private ?string $grade = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'La spécialité est obligatoire.')]
    #[Assert\Length(
        min: 2, max: 100,
        minMessage: 'La spécialité doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'La spécialité ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^[A-ZÀ-Ÿa-zà-ÿ0-9\s\-\'\,\.]+$/i',
        message: 'La spécialité contient des caractères invalides.'
    )]
    private ?string $specialite = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(message: "La date d'embauche est obligatoire.")]
    #[Assert\LessThanOrEqual(
        value: 'today',
        message: "La date d'embauche ne peut pas être dans le futur."
    )]
    #[Assert\GreaterThanOrEqual(
        value: '1980-01-01',
        message: "La date d'embauche ne peut pas être avant 1980."
    )]
    private ?\DateTimeInterface $dateEmbauche = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Le statut est obligatoire.')]
    #[Assert\Choice(
        choices: ['actif', 'retraite', 'conge'],
        message: 'Statut invalide. Valeurs : actif, retraite, conge.'
    )]
    private ?string $statut = 'actif';

    // Ancien statut pour contrôler les transitions
    private ?string $ancienStatut = null;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\OneToOne(targetEntity: User::class, cascade: ['persist'])]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: "L'utilisateur est obligatoire.")]
    private ?User $user = null;

    #[ORM\OneToMany(mappedBy: 'enseignant', targetEntity: Matiere::class)]
    private Collection $matieres;

    #[ORM\OneToMany(mappedBy: 'responsable', targetEntity: Filiere::class)]
    private Collection $filieres;

    public function __construct()
    {
        $this->matieres = new ArrayCollection();
        $this->filieres = new ArrayCollection();
        $this->statut = 'actif';
    }

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PostLoad]
    public function onPostLoad(): void
    {
        // Mémoriser le statut actuel pour contrôler les transitions
        $this->ancienStatut = $this->statut;
    }

    #[ORM\PrePersist]
    #[ORM\PreUpdate]
    public function normalize(): void
    {
        if ($this->nom) {
            $this->nom = strtoupper(trim($this->nom));
        }
        if ($this->prenom) {
            $this->prenom = ucwords(strtolower(trim($this->prenom)));
        }
        if ($this->specialite) {
            $this->specialite = trim($this->specialite);
        }

        // Validation des transitions de statut
        if ($this->ancienStatut && $this->ancienStatut !== $this->statut) {
            $transitionsAutorisees = self::TRANSITIONS_STATUT[$this->ancienStatut] ?? [];
            if (!in_array($this->statut, $transitionsAutorisees)) {
                throw new \LogicException(
                    "Transition de statut invalide : '{$this->ancienStatut}' → '{$this->statut}'. "
                    . "Transitions autorisées depuis '{$this->ancienStatut}' : "
                    . (empty($transitionsAutorisees)
                        ? 'aucune (statut irréversible)'
                        : implode(', ', $transitionsAutorisees))
                    . '.'
                );
            }
        }

        // Vérification : enseignant retraité ne peut pas avoir des matières actives
        if ($this->statut === 'retraite' && !$this->matieres->isEmpty()) {
            foreach ($this->matieres as $matiere) {
                if ($matiere->isActive()) {
                    throw new \LogicException(
                        "Impossible de mettre en retraite : l'enseignant a encore des matières actives."
                    );
                }
            }
        }
    }

    // =====================
    // MÉTHODES MÉTIER
    // =====================

    public function getNomComplet(): string
    {
        return $this->prenom . ' ' . $this->nom;
    }

    public function isActif(): bool
    {
        return $this->statut === 'actif';
    }

    /**
     * Vérifie si l'enseignant peut saisir des notes pour une matière donnée
     */
    public function peutSaisirNotesPour(Matiere $matiere): bool
    {
        return $this->isActif()
            && $matiere->getEnseignant() === $this
            && $matiere->isActive();
    }

    /**
     * Retourne les matières actives uniquement
     */
    public function getMatieresActives(): Collection
    {
        return $this->matieres->filter(
            fn(Matiere $m) => $m->isActive()
        );
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

    public function getPrenom(): ?string
    {
        return $this->prenom;
    }

    public function setPrenom(string $prenom): static
    {
        $this->prenom = ucwords(strtolower(trim($prenom)));
        return $this;
    }

    public function getMatricule(): ?string
    {
        return $this->matricule;
    }

    public function setMatricule(string $matricule): static
    {
        // Le matricule ne doit jamais être modifié après création
        if ($this->matricule !== null && $this->matricule !== $matricule) {
            throw new \LogicException('Le matricule ne peut pas être modifié après création.');
        }
        $this->matricule = $matricule;
        return $this;
    }

    public function getTelephone(): ?string
    {
        return $this->telephone;
    }

    public function setTelephone(?string $telephone): static
    {
        $this->telephone = $telephone;
        return $this;
    }

    public function getGrade(): ?string
    {
        return $this->grade;
    }

    public function setGrade(string $grade): static
    {
        $gradesOrdonnes = ['Assistant', 'Maitre_Assistant', 'Maitre_Conference', 'Professeur'];

        // Le grade ne peut qu'avancer, jamais reculer
        if ($this->grade !== null && $this->grade !== $grade) {
            $ancienIndex = array_search($this->grade, $gradesOrdonnes);
            $nouveauIndex = array_search($grade, $gradesOrdonnes);
            if ($nouveauIndex < $ancienIndex) {
                throw new \LogicException(
                    "Le grade ne peut pas être rétrogradé : '{$this->grade}' → '{$grade}'."
                );
            }
        }

        $this->grade = $grade;
        return $this;
    }

    public function getSpecialite(): ?string
    {
        return $this->specialite;
    }

    public function setSpecialite(string $specialite): static
    {
        $this->specialite = trim($specialite);
        return $this;
    }

    public function getDateEmbauche(): ?\DateTimeInterface
    {
        return $this->dateEmbauche;
    }

    public function setDateEmbauche(\DateTimeInterface $dateEmbauche): static
    {
        $this->dateEmbauche = $dateEmbauche;
        return $this;
    }

    public function getStatut(): ?string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getUser(): ?User
    {
        return $this->user;
    }

    public function setUser(?User $user): static
    {
        $this->user = $user;
        return $this;
    }

    public function getMatieres(): Collection
    {
        return $this->matieres;
    }

    public function getFilieres(): Collection
    {
        return $this->filieres;
    }
}