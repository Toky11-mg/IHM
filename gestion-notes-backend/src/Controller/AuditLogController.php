<?php
namespace App\Controller;

use App\Entity\AuditLog;
use App\Repository\AuditLogRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/audit-logs', name: 'api_audit_logs_')]
#[IsGranted('ROLE_ADMIN')]
class AuditLogController extends AbstractController
{
    public function __construct(
        private AuditLogRepository $repo,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $filters = [];
        if ($request->query->get('entite'))  $filters['entite']  = $request->query->get('entite');
        if ($request->query->get('userId'))  $filters['userId']  = $request->query->get('userId');
        if ($request->query->get('action'))  $filters['action']  = $request->query->get('action');

        $logs = $this->repo->findByFilters($filters);

        return $this->json([
            'success' => true,
            'message' => '',
            'total'   => count($logs),
            'data'    => array_map(fn(AuditLog $l) => [
                'id'             => $l->getId(),
                'action'         => $l->getAction(),
                'entite'         => $l->getEntite(),
                'entiteId'       => $l->getEntiteId(),
                'ancienneValeur' => $l->getAncienneValeur(),
                'nouvelleValeur' => $l->getNouvelleValeur(),
                'ipAdresse'      => $l->getIpAdresse(),
                'userAgent'      => $l->getUserAgent(),
                'createdAt'      => $l->getCreatedAt()?->format('Y-m-d H:i:s'),
                'user'           => $l->getUser()?->getEmail(),
            ], $logs),
            'errors'  => [],
        ]);
    }
}