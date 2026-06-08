<?php
namespace App\Entity;

use App\Repository\AuditLogRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: AuditLogRepository::class)]
class AuditLog
{
    #[ORM\Id]
    #[ORM\GeneratedValue(strategy: 'CUSTOM')]
    #[ORM\CustomIdGenerator(class: 'doctrine.uuid_generator')]
    #[ORM\Column(type: 'uuid', unique: true)]
    private ?string $id = null;

    #[ORM\Column(length: 100)]
    private ?string $action = null;

    #[ORM\Column(length: 100)]
    private ?string $entite = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $entiteId = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private mixed $ancienneValeur = null;

    #[ORM\Column(type: 'json', nullable: true)]
    private mixed $nouvelleValeur = null;

    #[ORM\Column(length: 45, nullable: true)]
    private ?string $ipAdresse = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $userAgent = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\ManyToOne(targetEntity: User::class)]
    #[ORM\JoinColumn(nullable: true, onDelete: 'SET NULL')]
    private ?User $user = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?string { return $this->id; }

    public function getAction(): ?string { return $this->action; }
    public function setAction(string $action): static { $this->action = $action; return $this; }

    public function getEntite(): ?string { return $this->entite; }
    public function setEntite(string $entite): static { $this->entite = $entite; return $this; }

    public function getEntiteId(): ?string { return $this->entiteId; }
    public function setEntiteId(?string $entiteId): static { $this->entiteId = $entiteId; return $this; }

    public function getAncienneValeur(): mixed { return $this->ancienneValeur; }
    public function setAncienneValeur(mixed $ancienneValeur): static { $this->ancienneValeur = $ancienneValeur; return $this; }

    public function getNouvelleValeur(): mixed { return $this->nouvelleValeur; }
    public function setNouvelleValeur(mixed $nouvelleValeur): static { $this->nouvelleValeur = $nouvelleValeur; return $this; }

    public function getIpAdresse(): ?string { return $this->ipAdresse; }
    public function setIpAdresse(?string $ipAdresse): static { $this->ipAdresse = $ipAdresse; return $this; }

    public function getUserAgent(): ?string { return $this->userAgent; }
    public function setUserAgent(?string $userAgent): static { $this->userAgent = $userAgent; return $this; }

    public function getCreatedAt(): ?\DateTimeImmutable { return $this->createdAt; }

    public function getUser(): ?User { return $this->user; }
    public function setUser(?User $user): static { $this->user = $user; return $this; }
}