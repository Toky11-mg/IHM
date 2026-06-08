<?php
namespace App\Service;

use App\Entity\AuditLog;
use App\Entity\User;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Bundle\SecurityBundle\Security;

class AuditLogService
{
    public function __construct(
        private EntityManagerInterface $em,
        private Security $security,
    ) {}

    public function log(
        string $action,
        string $entite,
        string $entiteId,
        mixed $ancienneValeur = null,
        mixed $nouvelleValeur = null,
        ?Request $request = null
    ): void {
        $log = new AuditLog();
        $log->setAction($action);
        $log->setEntite($entite);
        $log->setEntiteId($entiteId);
        $log->setAncienneValeur($ancienneValeur);
        $log->setNouvelleValeur($nouvelleValeur);

        if ($request) {
            $log->setIpAdresse($request->getClientIp());
            $log->setUserAgent($request->headers->get('User-Agent'));
        }

        /** @var User|null $user */
        $user = $this->security->getUser();
        if ($user) {
            $log->setUser($user);
        }

        $this->em->persist($log);
        $this->em->flush();
    }
}