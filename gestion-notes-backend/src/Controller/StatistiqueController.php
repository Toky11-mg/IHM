<?php

namespace App\Controller;

use App\Service\StatistiqueService;
use App\Trait\ApiResponseTrait;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/statistiques')]
class StatistiqueController extends AbstractController
{
    use ApiResponseTrait;

    public function __construct(
        private StatistiqueService $statistiqueService
    ) {}

    #[Route('', name: 'api_statistiques', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function index(): JsonResponse
    {
        $data = $this->statistiqueService->getStatistiquesGlobales();
        return $this->success($data, 'Statistiques récupérées.');
    }
}