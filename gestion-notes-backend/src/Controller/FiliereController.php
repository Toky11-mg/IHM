<?php

namespace App\Controller;

use App\Entity\Filiere;
use App\Entity\Enseignant;
use App\Repository\FiliereRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/filieres', name: 'api_filieres_')]
class FiliereController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private FiliereRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/filieres
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $filieres = $this->repo->findBy([], ['nom' => 'ASC']);

        $data = array_map(fn(Filiere $f) => $this->serializeFiliere($f), $filieres);

        return $this->json([
            'success' => true,
            'total'   => count($data),
            'data'    => $data,
        ]);
    }

    // =====================
    // GET /api/filieres/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $filiere = $this->repo->find($id);

        if (!$filiere) {
            return $this->json([
                'success' => false,
                'message' => 'Filière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeFiliereDetail($filiere),
        ]);
    }

    // =====================
    // POST /api/filieres
    // =====================
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Champs obligatoires
        foreach (['nom', 'code'] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $filiere = new Filiere();
        $filiere->setNom($data['nom']);
        $filiere->setCode($data['code']);
        $filiere->setDescription($data['description'] ?? null);

        // Responsable optionnel
        if (!empty($data['responsableId'])) {
            $enseignant = $this->em->getRepository(Enseignant::class)->find($data['responsableId']);
            if (!$enseignant) {
                return $this->json([
                    'success' => false,
                    'message' => 'Enseignant responsable non trouvé.',
                ], Response::HTTP_NOT_FOUND);
            }
            if (!$enseignant->isActif()) {
                return $this->json([
                    'success' => false,
                    'message' => 'L\'enseignant responsable doit être actif.',
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
            $filiere->setResponsable($enseignant);
        }

        $errors = $this->validator->validate($filiere);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $messages,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($filiere);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Filière créée avec succès.',
            'data'    => $this->serializeFiliereDetail($filiere),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/filieres/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $filiere = $this->repo->find($id);

        if (!$filiere) {
            return $this->json([
                'success' => false,
                'message' => 'Filière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (isset($data['nom'])) $filiere->setNom($data['nom']);
        if (isset($data['code'])) $filiere->setCode($data['code']);
        if (isset($data['description'])) $filiere->setDescription($data['description']);

        if (array_key_exists('responsableId', $data)) {
            if ($data['responsableId'] === null) {
                $filiere->setResponsable(null);
            } else {
                $enseignant = $this->em->getRepository(Enseignant::class)->find($data['responsableId']);
                if (!$enseignant) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Enseignant non trouvé.',
                    ], Response::HTTP_NOT_FOUND);
                }
                if (!$enseignant->isActif()) {
                    return $this->json([
                        'success' => false,
                        'message' => 'L\'enseignant doit être actif.',
                    ], Response::HTTP_UNPROCESSABLE_ENTITY);
                }
                $filiere->setResponsable($enseignant);
            }
        }

        $errors = $this->validator->validate($filiere);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[$error->getPropertyPath()] = $error->getMessage();
            }
            return $this->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $messages,
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Filière mise à jour avec succès.',
            'data'    => $this->serializeFiliereDetail($filiere),
        ]);
    }

    // =====================
    // DELETE /api/filieres/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $filiere = $this->repo->find($id);

        if (!$filiere) {
            return $this->json([
                'success' => false,
                'message' => 'Filière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Blocage suppression si niveaux existants
        if (!$filiere->getNiveaux()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : cette filière contient '
                    . $filiere->getNiveaux()->count() . ' niveau(x). '
                    . 'Supprimez d\'abord les niveaux associés.',
            ], Response::HTTP_CONFLICT);
        }

        $nom = $filiere->getNom();
        $this->em->remove($filiere);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Filière '{$nom}' supprimée avec succès.",
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serializeFiliere(Filiere $f): array
    {
        return [
            'id'          => $f->getId(),
            'nom'         => $f->getNom(),
            'code'        => $f->getCode(),
            'description' => $f->getDescription(),
            'responsable' => $f->getResponsable() ? [
                'id'  => $f->getResponsable()->getId(),
                'nom' => $f->getResponsable()->getNomComplet(),
            ] : null,
            'niveauxCount' => $f->getNiveaux()->count(),
        ];
    }

    private function serializeFiliereDetail(Filiere $f): array
    {
        return [
            'id'          => $f->getId(),
            'nom'         => $f->getNom(),
            'code'        => $f->getCode(),
            'description' => $f->getDescription(),
            'responsable' => $f->getResponsable() ? [
                'id'        => $f->getResponsable()->getId(),
                'nom'       => $f->getResponsable()->getNomComplet(),
                'matricule' => $f->getResponsable()->getMatricule(),
            ] : null,
            'niveaux' => $f->getNiveaux()->map(fn($n) => [
                'id'            => $n->getId(),
                'nom'           => $n->getNom(),
                'code'          => $n->getCode(),
                'creditsRequis' => $n->getCreditsRequis(),
            ])->toArray(),
        ];
    }
}