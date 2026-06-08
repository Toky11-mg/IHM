<?php

namespace App\Controller;

use App\Entity\AnneUniversitaire;
use App\Repository\AnneUniversitaireRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/annees', name: 'api_annees_')]
class AnneUniversitaireController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private AnneUniversitaireRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/annees
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(): JsonResponse
    {
        $annees = $this->repo->findBy([], ['id' => 'DESC']);

        $data = array_map(fn(AnneUniversitaire $a) => $this->serializeAnnee($a), $annees);

        return $this->json([
            'success' => true,
            'total'   => count($data),
            'data'    => $data,
        ]);
    }

    // =====================
    // GET /api/annees/current
    // =====================
    #[Route('/current', name: 'current', methods: ['GET'])]
    public function current(): JsonResponse
    {
        $annee = $this->repo->findOneBy(['isCurrent' => true]);

        if (!$annee) {
            return $this->json([
                'success' => false,
                'message' => 'Aucune année universitaire active.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeAnneeDetail($annee),
        ]);
    }

    // =====================
    // GET /api/annees/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $annee = $this->repo->find($id);

        if (!$annee) {
            return $this->json([
                'success' => false,
                'message' => 'Année universitaire non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeAnneeDetail($annee),
        ]);
    }

    // =====================
    // POST /api/annees
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
        foreach (['libelle', 'dateDebut', 'dateFin'] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        // Vérification libellé déjà existant
        if ($this->repo->findOneBy(['libelle' => $data['libelle']])) {
            return $this->json([
                'success' => false,
                'message' => "L'année universitaire '{$data['libelle']}' existe déjà.",
            ], Response::HTTP_CONFLICT);
        }

        $annee = new AnneUniversitaire();

        try {
            $annee->setLibelle($data['libelle']);
            $annee->setDateDebut(new \DateTime($data['dateDebut']));
            $annee->setDateFin(new \DateTime($data['dateFin']));
            $annee->setIsCurrent($data['isCurrent'] ?? false);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Format de date invalide. Utilisez le format YYYY-MM-DD.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $errors = $this->validator->validate($annee);
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

        // Règle : une seule année active à la fois
        if ($annee->isCurrent()) {
            $this->desactiverToutesLesAnnees();
        }

        $this->em->persist($annee);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Année universitaire '{$annee->getLibelle()}' créée avec succès.",
            'data'    => $this->serializeAnneeDetail($annee),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/annees/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $annee = $this->repo->find($id);

        if (!$annee) {
            return $this->json([
                'success' => false,
                'message' => 'Année universitaire non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Bloquer modification si semestres clôturés
        $hasSemestreCloture = false;
        foreach ($annee->getSemestres() as $semestre) {
            if ($semestre->isCloture()) {
                $hasSemestreCloture = true;
                break;
            }
        }

        if ($hasSemestreCloture && isset($data['libelle'])) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de modifier le libellé : cette année contient des semestres clôturés.',
            ], Response::HTTP_CONFLICT);
        }

        try {
            if (isset($data['libelle'])) $annee->setLibelle($data['libelle']);
            if (!empty($data['dateDebut'])) $annee->setDateDebut(new \DateTime($data['dateDebut']));
            if (!empty($data['dateFin'])) $annee->setDateFin(new \DateTime($data['dateFin']));
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Format de date invalide. Utilisez le format YYYY-MM-DD.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Règle : une seule année active à la fois
        if (isset($data['isCurrent']) && $data['isCurrent'] === true) {
            $this->desactiverToutesLesAnnees();
            $annee->setIsCurrent(true);
        }

        $errors = $this->validator->validate($annee);
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
            'message' => "Année universitaire mise à jour avec succès.",
            'data'    => $this->serializeAnneeDetail($annee),
        ]);
    }

    // =====================
    // PUT /api/annees/{id}/activer
    // =====================
    #[Route('/{id}/activer', name: 'activer', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function activer(int $id): JsonResponse
    {
        $annee = $this->repo->find($id);

        if (!$annee) {
            return $this->json([
                'success' => false,
                'message' => 'Année universitaire non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($annee->isCurrent()) {
            return $this->json([
                'success' => false,
                'message' => "Cette année est déjà active.",
            ], Response::HTTP_CONFLICT);
        }

        $this->desactiverToutesLesAnnees();
        $annee->setIsCurrent(true);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "L'année '{$annee->getLibelle()}' est maintenant active.",
            'data'    => $this->serializeAnnee($annee),
        ]);
    }

    // =====================
    // DELETE /api/annees/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $annee = $this->repo->find($id);

        if (!$annee) {
            return $this->json([
                'success' => false,
                'message' => 'Année universitaire non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Blocage : impossible de supprimer l'année active
        if ($annee->isCurrent()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer l\'année universitaire actuellement active.',
            ], Response::HTTP_CONFLICT);
        }

        // Blocage : impossible de supprimer si semestres existants
        if (!$annee->getSemestres()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : cette année contient '
                    . $annee->getSemestres()->count()
                    . ' semestre(s). Supprimez d\'abord les semestres associés.',
            ], Response::HTTP_CONFLICT);
        }

        $libelle = $annee->getLibelle();
        $this->em->remove($annee);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Année universitaire '{$libelle}' supprimée avec succès.",
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serializeAnnee(AnneUniversitaire $a): array
    {
        return [
            'id'          => $a->getId(),
            'libelle'     => $a->getLibelle(),
            'dateDebut'   => $a->getDateDebut()?->format('Y-m-d'),
            'dateFin'     => $a->getDateFin()?->format('Y-m-d'),
            'isCurrent'   => $a->isCurrent(),
            'nbSemestres' => $a->getSemestres()->count(),
        ];
    }

    private function serializeAnneeDetail(AnneUniversitaire $a): array
    {
        return [
            'id'        => $a->getId(),
            'libelle'   => $a->getLibelle(),
            'dateDebut' => $a->getDateDebut()?->format('Y-m-d'),
            'dateFin'   => $a->getDateFin()?->format('Y-m-d'),
            'isCurrent' => $a->isCurrent(),
            'semestres' => $a->getSemestres()->map(fn($s) => [
                'id'              => $s->getId(),
                'nom'             => $s->getNom(),
                'isCloture'       => $s->isCloture(),
                'isSaisieOuverte' => $s->isSaisieOuverte(),
                'dateDebutSaisie' => $s->getDateDebutSaisie()?->format('Y-m-d'),
                'dateFinSaisie'   => $s->getDateFinSaisie()?->format('Y-m-d'),
                'niveau'          => [
                    'id'  => $s->getNiveau()?->getId(),
                    'nom' => $s->getNiveau()?->getNom(),
                ],
            ])->toArray(),
        ];
    }

    // =====================
    // MÉTHODE PRIVÉE
    // =====================

    private function desactiverToutesLesAnnees(): void
    {
        $annees = $this->repo->findBy(['isCurrent' => true]);
        foreach ($annees as $a) {
            $a->setIsCurrent(false);
        }
    }
}