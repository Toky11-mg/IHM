<?php
namespace App\Repository;

use App\Entity\AuditLog;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class AuditLogRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AuditLog::class);
    }

    public function findByFilters(array $filters): array
    {
        $qb = $this->createQueryBuilder('a')
            ->orderBy('a.createdAt', 'DESC');

        if (!empty($filters['entite'])) {
            $qb->andWhere('a.entite = :entite')
               ->setParameter('entite', $filters['entite']);
        }
        if (!empty($filters['userId'])) {
            $qb->andWhere('a.user = :userId')
               ->setParameter('userId', $filters['userId']);
        }
        if (!empty($filters['action'])) {
            $qb->andWhere('a.action = :action')
               ->setParameter('action', $filters['action']);
        }

        return $qb->getQuery()->getResult();
    }
}