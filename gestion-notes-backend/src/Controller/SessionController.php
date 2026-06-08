<?php
namespace App\Controller;

use App\Entity\Session;
use App\Entity\Semestre;
use App\Entity\AnneUniversitaire;
use App\Repository\SessionRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/sessions', name: 'api_sessions_')]
class SessionController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SessionRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_ENSEIGNANT')]
    public function list(Request $request): JsonResponse
    {
        $criteria = [];
        if ($request->query->get('semestreId')) $criteria['semestre'] = $request->query->get('semestreId');
        if ($request->query->get('type'))       $criteria['type']     = $request->query->get('type');
        if ($request->query->get('isActive') !== null) {
            $criteria['isActive'] = filter_var($request->query->get('isActive'), FILTER_VALIDATE_BOOLEAN);
        }

        $sessions = $this->repo->findBy($criteria);

        return $this->json([
            'success' => true,
            'message' => '',
            'total'   => count($sessions),
            'data'    => array_map(fn(Session $s) => $this->serialize($s), $sessions),
            'errors'  => [],
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('ROLE_ENSEIGNANT')]
    public function show(int $id): JsonResponse
    {
        $session = $this->repo->find($id);

        if (!$session) {
            return $this->json(['success' => false, 'message' => 'Session non trouvée.', 'data' => null, 'total' => 0, 'errors' => []], 404);
        }

        return $this->json([
            'success' => true,
            'message' => '',
            'data'    => $this->serialize($session),
            'total'   => 1,
            'errors'  => [],
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json(['success' => false, 'message' => 'Données invalides.', 'data' => null, 'total' => 0, 'errors' => []], 400);
        }

        foreach (['type', 'libelle', 'dateDebut', 'dateFin', 'semestreId', 'anneeUniversitaireId'] as $field) {
            if (empty($data[$field])) {
                return $this->json(['success' => false, 'message' => "Le champ '{$field}' est obligatoire.", 'data' => null, 'total' => 0, 'errors' => []], 400);
            }
        }

        $semestre = $this->em->getRepository(Semestre::class)->find($data['semestreId']);
        if (!$semestre) return $this->json(['success' => false, 'message' => 'Semestre non trouvé.', 'data' => null, 'total' => 0, 'errors' => []], 404);

        $annee = $this->em->getRepository(AnneUniversitaire::class)->find($data['anneeUniversitaireId']);
        if (!$annee) return $this->json(['success' => false, 'message' => 'Année universitaire non trouvée.', 'data' => null, 'total' => 0, 'errors' => []], 404);

        $session = new Session();
        $session->setType($data['type']);
        $session->setLibelle($data['libelle']);
        $session->setDateDebut(new \DateTime($data['dateDebut']));
        $session->setDateFin(new \DateTime($data['dateFin']));
        $session->setIsActive($data['isActive'] ?? true);
        $session->setSemestre($semestre);
        $session->setAnneeUniversitaire($annee);

        $errors = $this->validator->validate($session);
        if (count($errors) > 0) {
            return $this->json(['success' => false, 'message' => 'Erreurs de validation.', 'data' => null, 'total' => 0, 'errors' => $this->formatErrors($errors)], 422);
        }

        $this->em->persist($session);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Session créée avec succès.',
            'data'    => $this->serialize($session),
            'total'   => 1,
            'errors'  => [],
        ], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $session = $this->repo->find($id);

        if (!$session) {
            return $this->json(['success' => false, 'message' => 'Session non trouvée.', 'data' => null, 'total' => 0, 'errors' => []], 404);
        }

        $data = json_decode($request->getContent(), true);

        try {
            if (isset($data['type']))     $session->setType($data['type']);
            if (isset($data['libelle'])) $session->setLibelle($data['libelle']);
            if (isset($data['isActive'])) $session->setIsActive((bool) $data['isActive']);
            if (!empty($data['dateDebut'])) $session->setDateDebut(new \DateTime($data['dateDebut']));
            if (!empty($data['dateFin']))   $session->setDateFin(new \DateTime($data['dateFin']));
        } catch (\LogicException $e) {
            return $this->json(['success' => false, 'message' => $e->getMessage(), 'data' => null, 'total' => 0, 'errors' => []], 422);
        }

        $errors = $this->validator->validate($session);
        if (count($errors) > 0) {
            return $this->json(['success' => false, 'message' => 'Erreurs de validation.', 'data' => null, 'total' => 0, 'errors' => $this->formatErrors($errors)], 422);
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Session mise à jour.',
            'data'    => $this->serialize($session),
            'total'   => 1,
            'errors'  => [],
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $session = $this->repo->find($id);

        if (!$session) {
            return $this->json(['success' => false, 'message' => 'Session non trouvée.', 'data' => null, 'total' => 0, 'errors' => []], 404);
        }

        $this->em->remove($session);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Session supprimée.',
            'data'    => null,
            'total'   => 0,
            'errors'  => [],
        ]);
    }

    private function serialize(Session $s): array
    {
        return [
            'id'        => $s->getId(),
            'type'      => $s->getType(),
            'libelle'   => $s->getLibelle(),
            'dateDebut' => $s->getDateDebut()?->format('Y-m-d'),
            'dateFin'   => $s->getDateFin()?->format('Y-m-d'),
            'isActive'  => $s->isActive(),
            'semestre'  => [
                'id'  => $s->getSemestre()?->getId(),
                'nom' => $s->getSemestre()?->getNom(),
            ],
            'anneeUniversitaire' => [
                'id'      => $s->getAnneeUniversitaire()?->getId(),
                'libelle' => $s->getAnneeUniversitaire()?->getLibelle(),
            ],
        ];
    }

    private function formatErrors($errors): array
    {
        $messages = [];
        foreach ($errors as $error) {
            $messages[$error->getPropertyPath()] = $error->getMessage();
        }
        return $messages;
    }
}