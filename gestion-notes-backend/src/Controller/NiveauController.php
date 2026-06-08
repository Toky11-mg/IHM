<?php

namespace App\Controller;

use App\Entity\Niveau;
use App\Entity\Filiere;
use App\Repository\NiveauRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/niveaux', name: 'api_niveaux_')]
class NiveauController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private NiveauRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/niveaux
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $filiereId = $request->query->get('filiereId');

        $criteria = [];
        if ($filiereId) {
            $criteria['filiere'] = $filiereId;
        }

        $niveaux = $this->repo->findBy($criteria, ['nom' => 'ASC']);

        $data = array_map(fn(Niveau $n) => $this->serializeNiveau($n), $niveaux);

        return $this->json([
            'success' => true,
            'total'   => count($data),
            'data'    => $data,
        ]);
    }

    // =====================
    // GET /api/niveaux/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $niveau = $this->repo->find($id);

        if (!$niveau) {
            return $this->json([
                'success' => false,
                'message' => 'Niveau non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeNiveauDetail($niveau),
        ]);
    }

    // =====================
    // POST /api/niveaux
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
        foreach (['nom', 'code', 'creditsRequis', 'filiereId'] as $field) {
            if (empty($data[$field]) && $data[$field] !== 0) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $filiere = $this->em->getRepository(Filiere::class)->find($data['filiereId']);
        if (!$filiere) {
            return $this->json([
                'success' => false,
                'message' => 'Filière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        $niveau = new Niveau();
        $niveau->setNom($data['nom']);
        $niveau->setCode($data['code']);
        $niveau->setCreditsRequis((int) $data['creditsRequis']);
        $niveau->setFiliere($filiere);

        $errors = $this->validator->validate($niveau);
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

        $this->em->persist($niveau);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Niveau créé avec succès.',
            'data'    => $this->serializeNiveauDetail($niveau),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/niveaux/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $niveau = $this->repo->find($id);

        if (!$niveau) {
            return $this->json([
                'success' => false,
                'message' => 'Niveau non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Bloquer modification si étudiants inscrits
        if (!$niveau->getEtudiants()->isEmpty() && isset($data['nom'])) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de modifier le nom : des étudiants sont inscrits dans ce niveau.',
            ], Response::HTTP_CONFLICT);
        }

        if (isset($data['nom'])) $niveau->setNom($data['nom']);
        if (isset($data['code'])) $niveau->setCode($data['code']);
        if (isset($data['creditsRequis'])) $niveau->setCreditsRequis((int) $data['creditsRequis']);

        if (isset($data['filiereId'])) {
            $filiere = $this->em->getRepository(Filiere::class)->find($data['filiereId']);
            if (!$filiere) {
                return $this->json([
                    'success' => false,
                    'message' => 'Filière non trouvée.',
                ], Response::HTTP_NOT_FOUND);
            }
            $niveau->setFiliere($filiere);
        }

        $errors = $this->validator->validate($niveau);
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
            'message' => 'Niveau mis à jour avec succès.',
            'data'    => $this->serializeNiveauDetail($niveau),
        ]);
    }

    // =====================
    // DELETE /api/niveaux/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $niveau = $this->repo->find($id);

        if (!$niveau) {
            return $this->json([
                'success' => false,
                'message' => 'Niveau non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Blocage si étudiants inscrits
        if (!$niveau->getEtudiants()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : '
                    . $niveau->getEtudiants()->count()
                    . ' étudiant(s) sont inscrits dans ce niveau.',
            ], Response::HTTP_CONFLICT);
        }

        // Blocage si semestres existants
        if (!$niveau->getSemestres()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : ce niveau contient '
                    . $niveau->getSemestres()->count()
                    . ' semestre(s). Supprimez d\'abord les semestres associés.',
            ], Response::HTTP_CONFLICT);
        }

        $nom = $niveau->getNom();
        $this->em->remove($niveau);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Niveau '{$nom}' supprimé avec succès.",
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serializeNiveau(Niveau $n): array
    {
        return [
            'id'            => $n->getId(),
            'nom'           => $n->getNom(),
            'code'          => $n->getCode(),
            'creditsRequis' => $n->getCreditsRequis(),
            'filiere'       => [
                'id'   => $n->getFiliere()?->getId(),
                'nom'  => $n->getFiliere()?->getNom(),
                'code' => $n->getFiliere()?->getCode(),
            ],
            'nbEtudiants'  => $n->getEtudiants()->count(),
            'nbSemestres'  => $n->getSemestres()->count(),
        ];
    }

    private function serializeNiveauDetail(Niveau $n): array
    {
        return [
            'id'            => $n->getId(),
            'nom'           => $n->getNom(),
            'code'          => $n->getCode(),
            'creditsRequis' => $n->getCreditsRequis(),
            'filiere'       => [
                'id'   => $n->getFiliere()?->getId(),
                'nom'  => $n->getFiliere()?->getNom(),
                'code' => $n->getFiliere()?->getCode(),
            ],
            'semestres' => $n->getSemestres()->map(fn($s) => [
                'id'         => $s->getId(),
                'nom'        => $s->getNom(),
                'isCloture'  => $s->isCloture(),
                'annee'      => $s->getAnneeUniversitaire()?->getLibelle(),
            ])->toArray(),
            'nbEtudiants' => $n->getEtudiants()->count(),
        ];
    }
}