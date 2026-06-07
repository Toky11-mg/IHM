<?php

namespace App\Entity;

use App\Repository\EtudiantRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: EtudiantRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(fields: ['matricule'], message: 'Ce matricule existe déjà.')]
#[UniqueEntity(fields: ['user'], message: 'Cet utilisateur est déjà un étudiant.')]
class Etudiant
{
    // Transitions de statut autorisées
    private const TRANSITIONS_STATUT = [
        'actif'     => ['suspendu', 'diplome', 'abandonne'],
        'suspendu'  => ['actif'],
        'diplome'   => [], // irréversible
        'abandonne' => [], // irréversible
    ];

    // Liste fermée des nationalités (ISO 3166-1)
    private const NATIONALITES_AUTORISEES = [
        'Afghane', 'Albanaise', 'Algérienne', 'Allemande', 'Américaine',
        'Angolaise', 'Argentine', 'Australienne', 'Autrichienne', 'Belge',
        'Béninoise', 'Bolivienne', 'Brésilienne', 'Britannique', 'Bulgare',
        'Burkinabè', 'Burundaise', 'Camerounaise', 'Canadienne', 'Centrafricaine',
        'Chilienne', 'Chinoise', 'Colombienne', 'Comorienne', 'Congolaise',
        'Coréenne', 'Cubaine', 'Danoise', 'Égyptienne', 'Émiratienne',
        'Espagnole', 'Éthiopienne', 'Finlandaise', 'Française', 'Gabonaise',
        'Ghanéenne', 'Grecque', 'Guinéenne', 'Haïtienne', 'Indienne',
        'Indonésienne', 'Iranienne', 'Irakienne', 'Irlandaise', 'Israélienne',
        'Italienne', 'Ivoirienne', 'Japonaise', 'Jordanienne', 'Kényane',
        'Libanaise', 'Libyenne', 'Luxembourgeoise', 'Malawienne', 'Malienne',
        'Malagasy', 'Marocaine', 'Mauritanienne', 'Mexicaine', 'Mozambicaine',
        'Namibienne', 'Néerlandaise', 'Nigériane', 'Nigérienne', 'Norvégienne',
        'Ougandaise', 'Pakistanaise', 'Péruvienne', 'Philippienne', 'Polonaise',
        'Portugaise', 'Roumaine', 'Russe', 'Rwandaise', 'Sénégalaise',
        'Sierra-Léonaise', 'Somalienne', 'Soudanaise', 'Sud-Africaine', 'Suédoise',
        'Suisse', 'Tanzanienne', 'Tchadienne', 'Thaïlandaise', 'Togolaise',
        'Tunisienne', 'Turque', 'Ukrainienne', 'Vénézuélienne', 'Vietnamienne',
        'Yéménite', 'Zambienne', 'Zimbabwéenne',
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
        pattern: '/^ETU-\d{4}-\d{5}$/',
        message: 'Format matricule invalide. Exemple : ETU-2024-00001.'
    )]
    private ?string $matricule = null;

    #[ORM\Column(type: 'date')]
    #[Assert\NotNull(message: 'La date de naissance est obligatoire.')]
    #[Assert\LessThanOrEqual(
        value: '-16 years',
        message: "L'étudiant doit avoir au moins 16 ans."
    )]
    #[Assert\GreaterThanOrEqual(
        value: '-45 years',
        message: "L'étudiant ne peut pas avoir plus de 45 ans."
    )]
    private ?\DateTimeInterface $dateNaissance = null;

    #[ORM\Column(length: 100)]
    #[Assert\NotBlank(message: 'Le lieu de naissance est obligatoire.')]
    #[Assert\Length(
        min: 2, max: 100,
        minMessage: 'Minimum {{ limit }} caractères.',
        maxMessage: 'Maximum {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/^[A-ZÀ-Ÿa-zà-ÿ\s\-\'\.]+$/i',
        message: 'Le lieu de naissance contient des caractères invalides.'
    )]
    private ?string $lieuNaissance = null;

    #[ORM\Column(length: 60)]
    #[Assert\NotBlank(message: 'La nationalité est obligatoire.')]
    #[Assert\Choice(
        choices: self::NATIONALITES_AUTORISEES,
        message: 'Nationalité invalide. Veuillez choisir dans la liste.'
    )]
    private ?string $nationalite = null;

    #[ORM\Column(length: 15, nullable: true)]
    #[Assert\Regex(
        pattern: '/^\+261[0-9]{9}$/',
        message: 'Format invalide. Exemple : +261341234567.'
    )]
    private ?string $telephone = null;

    #[ORM\Column(length: 1)]
    #[Assert\NotBlank(message: 'Le genre est obligatoire.')]
    #[Assert\Choice(
        choices: ['M', 'F'],
        message: 'Genre invalide. Valeurs autorisées : M ou F.'
    )]
    private ?string $genre = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Assert\Regex(
        pattern: '/\.(jpg|jpeg|png)$/i',
        message: 'La photo doit être un fichier JPG ou PNG.'
    )]
    private ?string $photo = null;

    #[ORM\Column]
    #[Assert\NotNull(message: "L'année d'entrée est obligatoire.")]
    private ?int $anneeEntree = null;

    #[ORM\Column(length: 20)]
    #[Assert\NotBlank(message: 'Le statut est obligatoire.')]
    #[Assert\Choice(
        choices: ['actif', 'suspendu', 'diplome', 'abandonne'],
        message: 'Statut invalide. Valeurs : actif, suspendu, diplome, abandonne.'
    )]
    private ?string $statut = 'actif';

    private ?string $ancienStatut = null;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\OneToOne(targetEntity: User::class, cascade: ['persist'])]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: "L'utilisateur est obligatoire.")]
    private ?User $user = null;

    #[ORM\ManyToOne(targetEntity: Niveau::class, inversedBy: 'etudiants')]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'Le niveau est obligatoire.')]
    private ?Niveau $niveau = null;

    #[ORM\ManyToOne(targetEntity: Filiere::class)]
    #[ORM\JoinColumn(nullable: false)]
    #[Assert\NotNull(message: 'La filière est obligatoire.')]
    private ?Filiere $filiere = null;

    #[ORM\OneToMany(mappedBy: 'etudiant', targetEntity: Note::class)]
    private Collection $notes;

    #[ORM\OneToMany(mappedBy: 'etudiant', targetEntity: Deliberation::class)]
    private Collection $deliberations;

    #[ORM\OneToMany(mappedBy: 'etudiant', targetEntity: Reclamation::class)]
    private Collection $reclamations;

    public function __construct()
    {
        $this->notes = new ArrayCollection();
        $this->deliberations = new ArrayCollection();
        $this->reclamations = new ArrayCollection();
        $this->statut = 'actif';
    }

    // =====================
    // LIFECYCLE CALLBACKS
    // =====================

    #[ORM\PostLoad]
    public function onPostLoad(): void
    {
        $this->ancienStatut = $this->statut;
    }

    #[ORM\PrePersist]
    public function onPrePersist(): void
    {
        // Année d'entrée = année courante par défaut
        if ($this->anneeEntree === null) {
            $this->anneeEntree = (int) date('Y');
        }

        // Validation : année d'entrée cohérente
        $anneeActuelle = (int) date('Y');
        if ($this->anneeEntree < 2000 || $this->anneeEntree > $anneeActuelle) {
            throw new \LogicException(
                "L'année d'entrée doit être entre 2000 et {$anneeActuelle}."
            );
        }

        // Validation : niveau cohérent avec filière
        if ($this->niveau && $this->filiere) {
            if ($this->niveau->getFiliere()?->getId() !== $this->filiere->getId()) {
                throw new \LogicException(
                    "Le niveau '{$this->niveau->getNom()}' n'appartient pas à la filière '{$this->filiere->getNom()}'."
                );
            }
        }
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
        if ($this->lieuNaissance) {
            $this->lieuNaissance = ucwords(strtolower(trim($this->lieuNaissance)));
        }

        // Contrôle des transitions de statut
        if ($this->ancienStatut && $this->ancienStatut !== $this->statut) {
            $autorisees = self::TRANSITIONS_STATUT[$this->ancienStatut] ?? [];
            if (!in_array($this->statut, $autorisees)) {
                throw new \LogicException(
                    "Transition invalide : '{$this->ancienStatut}' → '{$this->statut}'. "
                    . 'Autorisées : '
                    . (empty($autorisees) ? 'aucune (statut irréversible)' : implode(', ', $autorisees))
                    . '.'
                );
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

    public function getAge(): int
    {
        return $this->dateNaissance
            ? (int) $this->dateNaissance->diff(new \DateTime())->y
            : 0;
    }

    /**
     * Retourne les nationalités autorisées (pour alimenter un select côté front)
     */
    public static function getNationalitesAutorisees(): array
    {
        return self::NATIONALITES_AUTORISEES;
    }

    // =====================
    // GETTERS & SETTERS
    // =====================

    public function getId(): ?int { return $this->id; }

    public function getNom(): ?string { return $this->nom; }
    public function setNom(string $nom): static { $this->nom = strtoupper(trim($nom)); return $this; }

    public function getPrenom(): ?string { return $this->prenom; }
    public function setPrenom(string $prenom): static { $this->prenom = ucwords(strtolower(trim($prenom))); return $this; }

    public function getMatricule(): ?string { return $this->matricule; }
    public function setMatricule(string $matricule): static
    {
        if ($this->matricule !== null && $this->matricule !== $matricule) {
            throw new \LogicException('Le matricule ne peut pas être modifié après création.');
        }
        $this->matricule = $matricule;
        return $this;
    }

    public function getDateNaissance(): ?\DateTimeInterface { return $this->dateNaissance; }
    public function setDateNaissance(\DateTimeInterface $dateNaissance): static
    {
        $this->dateNaissance = $dateNaissance;
        return $this;
    }

    public function getLieuNaissance(): ?string { return $this->lieuNaissance; }
    public function setLieuNaissance(string $lieuNaissance): static
    {
        $this->lieuNaissance = ucwords(strtolower(trim($lieuNaissance)));
        return $this;
    }

    public function getNationalite(): ?string { return $this->nationalite; }
    public function setNationalite(string $nationalite): static
    {
        if (!in_array($nationalite, self::NATIONALITES_AUTORISEES)) {
            throw new \InvalidArgumentException("Nationalité invalide : {$nationalite}.");
        }
        $this->nationalite = $nationalite;
        return $this;
    }

    public function getTelephone(): ?string { return $this->telephone; }
    public function setTelephone(?string $telephone): static { $this->telephone = $telephone; return $this; }

    public function getGenre(): ?string { return $this->genre; }
    public function setGenre(string $genre): static
    {
        $this->genre = strtoupper(trim($genre));
        return $this;
    }

    public function getPhoto(): ?string { return $this->photo; }
    public function setPhoto(?string $photo): static { $this->photo = $photo; return $this; }

    public function getAnneeEntree(): ?int { return $this->anneeEntree; }
    public function setAnneeEntree(int $anneeEntree): static
    {
        $anneeActuelle = (int) date('Y');
        if ($anneeEntree < 2000 || $anneeEntree > $anneeActuelle) {
            throw new \InvalidArgumentException(
                "L'année d'entrée doit être entre 2000 et {$anneeActuelle}."
            );
        }
        $this->anneeEntree = $anneeEntree;
        return $this;
    }

    public function getStatut(): ?string { return $this->statut; }
    public function setStatut(string $statut): static { $this->statut = $statut; return $this; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }

    public function getNiveau(): ?Niveau { return $this->niveau; }
    public function setNiveau(?Niveau $niveau): static { $this->niveau = $niveau; return $this; }

    public function getFiliere(): ?Filiere { return $this->filiere; }
    public function setFiliere(?Filiere $filiere): static { $this->filiere = $filiere; return $this; }

    public function getNotes(): Collection { return $this->notes; }
    public function getDeliberations(): Collection { return $this->deliberations; }
    public function getReclamations(): Collection { return $this->reclamations; }
}