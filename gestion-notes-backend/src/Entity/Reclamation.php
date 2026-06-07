<?php

namespace App\Entity;

use App\Repository\ReclamationRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;
use Symfony\Bridge\Doctrine\Validator\Constraints\UniqueEntity;

#[ORM\Entity(repositoryClass: ReclamationRepository::class)]
#[ORM\HasLifecycleCallbacks]
#[UniqueEntity(
    fields: ['etudiant', 'note'],
    message: 'Une réclamation existe déjà pour cette note.'
)]
class Reclamation
{
    private const TRANSITIONS_STATUT = [
        'en_attente' => ['en_cours'],
        'en_cours'   => ['accepte', 'refuse'],
        'accepte'    => [], // irréversible
        'refuse'     => [], // irréversible
    ];

    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?string $id = null;

    #[ORM\Column(type: 'text')]
    #[Assert\NotBlank(message: 'Le motif est obligatoire.')]
    #[Assert\Length(
        min: 20, max: 1000,
        minMessage: 'Le motif doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'Le motif ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/<[^>]*>/',
        match: false,
        message: 'Le motif ne peut pas contenir de balises HTML.'
    )]
    private ?string $motif = null;

    #[ORM\Column(length: 30)]
    #[Assert\NotBlank(message: 'Le type de réclamation est obligatoire.')]
    #[Assert\Choice(
        choices: ['erreur_saisie', 'absence_justifiee', 'autre'],
        message: 'Type de réclamation invalide. Valeurs : erreur_saisie, absence_justifiee, autre.'
    )]
    private ?string $typeReclamation = null;

    #[ORM\Column(length: 20)]
    #[Assert\Choice(
        choices: ['en_attente', 'en_cours', 'accepte', 'refuse'],
        message: 'Statut invalide.'
    )]
    private string $statut = 'en_attente';

    private ?string $ancienStatut = null;

    #[ORM\Column(type: 'text', nullable: true)]
    #[Assert\Length(
        min: 10, max: 2000,
        minMessage: 'La réponse doit contenir au moins {{ limit }} caractères.',
        maxMessage: 'La réponse ne peut pas dépasser {{ limit }} caractères.'
    )]
    #[Assert\Regex(
        pattern: '/<[^>]*>/',
        match: false,
        message: 'La réponse ne peut pas contenir de balises HTML.'
    )]
    private ?string $reponse = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateSoumission = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $dateLimite = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $dateTraitement = null;

    // =====================
    // RELATIONS
    // =====================

    #[ORM\ManyToOne(targetEntity: Etudiant::class, inversedBy: 'reclamations')]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: "L'étudiant est obligatoire.")]
    private ?Etudiant $etudiant = null;

    #[ORM\ManyToOne(targetEntity: Note::class)]
    #[ORM\JoinColumn(nullable: false, onDelete: 'CASCADE')]
    #[Assert\NotNull(message: 'La note est obligatoire.')]
    private ?Note $note = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $traitePar = null;

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
        $this->dateSoumission = new \DateTimeImmutable();
        $this->dateLimite = $this->dateSoumission->modify('+7 days');
        $this->statut = 'en_attente';

        // Règle : note doit appartenir à l'étudiant demandeur
        if ($this->note && $this->etudiant) {
            if ($this->note->getEtudiant()?->getId() !== $this->etudiant->getId()) {
                throw new \LogicException(
                    "La note ne appartient pas à cet étudiant. "
                    . "Un étudiant ne peut réclamer que ses propres notes."
                );
            }
        }

        // Règle : semestre doit être clôturé pour pouvoir réclamer
        if ($this->note?->getSemestre() && !$this->note->getSemestre()->isCloture()) {
            throw new \LogicException(
                'Impossible de soumettre une réclamation : '
                . 'le semestre n\'est pas encore clôturé. '
                . 'Les réclamations ne sont acceptées qu\'après la clôture du semestre.'
            );
        }

        // Règle : délibération doit être publiée pour pouvoir réclamer
        if ($this->etudiant && $this->note?->getSemestre()) {
            $semestre = $this->note->getSemestre();
            $deliberations = $this->etudiant->getDeliberations()->filter(
                fn(Deliberation $d) => $d->getSemestre()?->getId() === $semestre->getId()
            );
            if ($deliberations->isEmpty() || !$deliberations->first()->isPublie()) {
                throw new \LogicException(
                    'Impossible de soumettre une réclamation : '
                    . 'la délibération n\'est pas encore publiée.'
                );
            }
        }
    }

    #[ORM\PreUpdate]
    public function onPreUpdate(): void
    {
        // Règle : réclamation déjà traitée → aucune modification
        if (in_array($this->ancienStatut, ['accepte', 'refuse'])) {
            throw new \LogicException(
                'Impossible de modifier une réclamation déjà traitée.'
            );
        }

        // Contrôle des transitions de statut
        if ($this->ancienStatut && $this->ancienStatut !== $this->statut) {
            $autorisees = self::TRANSITIONS_STATUT[$this->ancienStatut] ?? [];
            if (!in_array($this->statut, $autorisees)) {
                throw new \LogicException(
                    "Transition de statut invalide : '{$this->ancienStatut}' → '{$this->statut}'. "
                    . 'Transitions autorisées : '
                    . (empty($autorisees) ? 'aucune (statut irréversible)' : implode(', ', $autorisees))
                    . '.'
                );
            }
        }

        // Règle : réponse obligatoire si accepté ou refusé
        if (in_array($this->statut, ['accepte', 'refuse'])) {
            if (empty(trim($this->reponse ?? ''))) {
                throw new \LogicException(
                    'Une réponse détaillée est obligatoire pour '
                    . ($this->statut === 'accepte' ? 'accepter' : 'refuser')
                    . ' une réclamation.'
                );
            }
            $this->dateTraitement = new \DateTimeImmutable();
        }

        // Règle : date limite dépassée → modification bloquée si toujours en_attente
        if ($this->isDelaiDepasse() && $this->statut === 'en_attente') {
            throw new \LogicException(
                'La date limite de réclamation est dépassée. '
                . 'Cette réclamation ne peut plus être modifiée.'
            );
        }
    }

    // =====================
    // MÉTHODES MÉTIER
    // =====================

    /**
     * Vérifie si le délai de réclamation est dépassé
     */
    public function isDelaiDepasse(): bool
    {
        return $this->dateLimite !== null
            && new \DateTimeImmutable() > $this->dateLimite;
    }

    /**
     * Vérifie si la réclamation est traitée
     */
    public function isTraitee(): bool
    {
        return in_array($this->statut, ['accepte', 'refuse']);
    }

    /**
     * Retourne le nombre de jours restants avant la date limite
     */
    public function getJoursRestants(): int
    {
        if ($this->dateLimite === null) {
            return 0;
        }
        $diff = (new \DateTimeImmutable())->diff($this->dateLimite);
        return $this->isDelaiDepasse() ? 0 : (int) $diff->days;
    }

    /**
     * Retourne un résumé lisible
     */
    public function getResume(): string
    {
        $etudiant = $this->etudiant?->getNomComplet() ?? '?';
        $matiere = $this->note?->getMatiere()?->getCode() ?? '?';
        return "Réclamation de {$etudiant} sur {$matiere} — Statut : {$this->statut}";
    }

    // =====================
    // GETTERS & SETTERS
    // =====================

    public function getId(): ?string
    {
        return $this->id;
    }

    public function getMotif(): ?string
    {
        return $this->motif;
    }

    public function setMotif(string $motif): static
    {
        // Nettoyage XSS : suppression balises HTML
        $this->motif = trim(strip_tags($motif));
        return $this;
    }

    public function getTypeReclamation(): ?string
    {
        return $this->typeReclamation;
    }

    public function setTypeReclamation(string $typeReclamation): static
    {
        $this->typeReclamation = $typeReclamation;
        return $this;
    }

    public function getStatut(): string
    {
        return $this->statut;
    }

    public function setStatut(string $statut): static
    {
        $this->statut = $statut;
        return $this;
    }

    public function getReponse(): ?string
    {
        return $this->reponse;
    }

    public function setReponse(?string $reponse): static
    {
        // Nettoyage XSS sur la réponse aussi
        $this->reponse = $reponse !== null ? trim(strip_tags($reponse)) : null;
        return $this;
    }

    public function getDateSoumission(): ?\DateTimeImmutable
    {
        return $this->dateSoumission;
    }

    public function getDateLimite(): ?\DateTimeImmutable
    {
        return $this->dateLimite;
    }

    public function getDateTraitement(): ?\DateTimeImmutable
    {
        return $this->dateTraitement;
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

    public function getNote(): ?Note
    {
        return $this->note;
    }

    public function setNote(?Note $note): static
    {
        $this->note = $note;
        return $this;
    }

    public function getTraitePar(): ?User
    {
        return $this->traitePar;
    }

    public function setTraitePar(?User $traitePar): static
    {
        $this->traitePar = $traitePar;
        return $this;
    }
}