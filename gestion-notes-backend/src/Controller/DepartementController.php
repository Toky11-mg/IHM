<?php
namespace App\Controller;

use App\Entity\Departement;
use App\Entity\Filiere;
use App\Entity\Enseignant;
use App\Entity\User;
use App\Repository\DepartementRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/departements', name: 'api_departements_')]
class DepartementController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private DepartementRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_ENSEIGNANT')]
    public function list(): JsonResponse
    {
        $departements = $this->repo->findAll();

        return $this->json([
            'success' => true,
            'message' => '',
            'total'   => count($departements),
            'data'    => array_map(fn(Departement $d) => $this->serialize($d), $departements),
            'errors'  => [],
        ]);
    }

    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('ROLE_ENSEIGNANT')]
    public function show(int $id): JsonResponse
    {
        $departement = $this->repo->find($id);

        if (!$departement) {
            return $this->json([
                'success' => false,
                'message' => 'Département non trouvé.',
                'data'    => null,
                'total'   => 0,
                'errors'  => [],
            ], 404);
        }

        return $this->json([
            'success' => true,
            'message' => '',
            'data'    => $this->serialize($departement),
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

        foreach (['nom', 'code'] as $field) {
            if (empty($data[$field])) {
                return $this->json(['success' => false, 'message' => "Le champ '{$field}' est obligatoire.", 'data' => null, 'total' => 0, 'errors' => []], 400);
            }
        }

        $departement = new Departement();
        $departement->setNom($data['nom']);
        $departement->setCode($data['code']);
        $departement->setDescription($data['description'] ?? null);

        if (!empty($data['filiereId'])) {
            $filiere = $this->em->getRepository(Filiere::class)->find($data['filiereId']);
            if (!$filiere) return $this->json(['success' => false, 'message' => 'Filière non trouvée.', 'data' => null, 'total' => 0, 'errors' => []], 404);
            $departement->setFiliere($filiere);
        }

        if (!empty($data['responsableId'])) {
            $enseignant = $this->em->getRepository(Enseignant::class)->find($data['responsableId']);
            if (!$enseignant) return $this->json(['success' => false, 'message' => 'Enseignant non trouvé.', 'data' => null, 'total' => 0, 'errors' => []], 404);
            $departement->setResponsable($enseignant);
        }

        if (!empty($data['chefDepartementId'])) {
            $user = $this->em->getRepository(User::class)->find($data['chefDepartementId']);
            if (!$user) return $this->json(['success' => false, 'message' => 'Utilisateur non trouvé.', 'data' => null, 'total' => 0, 'errors' => []], 404);
            $departement->setChefDepartement($user);
        }

        $errors = $this->validator->validate($departement);
        if (count($errors) > 0) {
            return $this->json(['success' => false, 'message' => 'Erreurs de validation.', 'data' => null, 'total' => 0, 'errors' => $this->formatErrors($errors)], 422);
        }

        $this->em->persist($departement);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Département créé avec succès.',
            'data'    => $this->serialize($departement),
            'total'   => 1,
            'errors'  => [],
        ], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $departement = $this->repo->find($id);

        if (!$departement) {
            return $this->json(['success' => false, 'message' => 'Département non trouvé.', 'data' => null, 'total' => 0, 'errors' => []], 404);
        }

        $data = json_decode($request->getContent(), true);

        if (isset($data['nom']))         $departement->setNom($data['nom']);
        if (isset($data['code']))        $departement->setCode($data['code']);
        if (isset($data['description'])) $departement->setDescription($data['description']);

        if (isset($data['filiereId'])) {
            $filiere = $this->em->getRepository(Filiere::class)->find($data['filiereId']);
            if (!$filiere) return $this->json(['success' => false, 'message' => 'Filière non trouvée.', 'data' => null, 'total' => 0, 'errors' => []], 404);
            $departement->setFiliere($filiere);
        }

        if (isset($data['responsableId'])) {
            $enseignant = $data['responsableId']
                ? $this->em->getRepository(Enseignant::class)->find($data['responsableId'])
                : null;
            $departement->setResponsable($enseignant);
        }

        if (isset($data['chefDepartementId'])) {
            $user = $data['chefDepartementId']
                ? $this->em->getRepository(User::class)->find($data['chefDepartementId'])
                : null;
            $departement->setChefDepartement($user);
        }

        $errors = $this->validator->validate($departement);
        if (count($errors) > 0) {
            return $this->json(['success' => false, 'message' => 'Erreurs de validation.', 'data' => null, 'total' => 0, 'errors' => $this->formatErrors($errors)], 422);
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Département mis à jour.',
            'data'    => $this->serialize($departement),
            'total'   => 1,
            'errors'  => [],
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $departement = $this->repo->find($id);

        if (!$departement) {
            return $this->json(['success' => false, 'message' => 'Département non trouvé.', 'data' => null, 'total' => 0, 'errors' => []], 404);
        }

        $this->em->remove($departement);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Département supprimé.',
            'data'    => null,
            'total'   => 0,
            'errors'  => [],
        ]);
    }

    private function serialize(Departement $d): array
    {
        return [
            'id'              => $d->getId(),
            'nom'             => $d->getNom(),
            'code'            => $d->getCode(),
            'description'     => $d->getDescription(),
            'filiere'         => $d->getFiliere() ? ['id' => $d->getFiliere()->getId(), 'nom' => $d->getFiliere()->getNom()] : null,
            'responsable'     => $d->getResponsable() ? ['id' => $d->getResponsable()->getId(), 'nomComplet' => $d->getResponsable()->getNomComplet()] : null,
            'chefDepartement' => $d->getChefDepartement() ? ['id' => $d->getChefDepartement()->getId(), 'email' => $d->getChefDepartement()->getEmail()] : null,
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