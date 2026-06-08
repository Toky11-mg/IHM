<?php

namespace App\Controller;

use App\Entity\Semestre;
use App\Entity\Niveau;
use App\Entity\AnneUniversitaire;
use App\Repository\SemestreRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/semestres', name: 'api_semestres_')]
class SemestreController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private SemestreRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/semestres
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(Request $request): JsonResponse
    {
        $niveauId = $request->query->get('niveauId');
        $anneeId  = $request->query->get('anneeId');

        $criteria = [];
        if ($niveauId) $criteria['niveau'] = $niveauId;
        if ($anneeId)  $criteria['anneeUniversitaire'] = $anneeId;

        $semestres = $this->repo->findBy($criteria, ['nom' => 'ASC']);

        $data = array_map(fn(Semestre $s) => $this->serializeSemestre($s), $semestres);

        return $this->json([
            'success' => true,
            'total'   => count($data),
            'data'    => $data,
        ]);
    }

    // =====================
    // GET /api/semestres/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    public function show(int $id): JsonResponse
    {
        $semestre = $this->repo->find($id);

        if (!$semestre) {
            return $this->json([
                'success' => false,
                'message' => 'Semestre non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeSemestreDetail($semestre),
        ]);
    }

    // =====================
    // POST /api/semestres
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
        foreach (['nom', 'niveauId', 'anneeUniversitaireId'] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $niveau = $this->em->getRepository(Niveau::class)->find($data['niveauId']);
        if (!$niveau) {
            return $this->json([
                'success' => false,
                'message' => 'Niveau non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        $annee = $this->em->getRepository(AnneUniversitaire::class)->find($data['anneeUniversitaireId']);
        if (!$annee) {
            return $this->json([
                'success' => false,
                'message' => 'Année universitaire non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        $semestre = new Semestre();
        $semestre->setNom($data['nom']);
        $semestre->setNiveau($niveau);
        $semestre->setAnneeUniversitaire($annee);
        $semestre->setIsCloture(false);

        try {
            if (!empty($data['dateDebutSaisie'])) {
                $semestre->setDateDebutSaisie(new \DateTime($data['dateDebutSaisie']));
            }
            if (!empty($data['dateFinSaisie'])) {
                $semestre->setDateFinSaisie(new \DateTime($data['dateFinSaisie']));
            }
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Format de date invalide. Utilisez le format YYYY-MM-DD.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $errors = $this->validator->validate($semestre);
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

        $this->em->persist($semestre);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Semestre créé avec succès.',
            'data'    => $this->serializeSemestreDetail($semestre),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/semestres/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $semestre = $this->repo->find($id);

        if (!$semestre) {
            return $this->json([
                'success' => false,
                'message' => 'Semestre non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Blocage : semestre clôturé
        if ($semestre->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de modifier un semestre clôturé.',
            ], Response::HTTP_CONFLICT);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            if (isset($data['nom'])) $semestre->setNom($data['nom']);
            if (!empty($data['dateDebutSaisie'])) {
                $semestre->setDateDebutSaisie(new \DateTime($data['dateDebutSaisie']));
            }
            if (!empty($data['dateFinSaisie'])) {
                $semestre->setDateFinSaisie(new \DateTime($data['dateFinSaisie']));
            }
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => 'Format de date invalide. Utilisez le format YYYY-MM-DD.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $errors = $this->validator->validate($semestre);
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
            'message' => 'Semestre mis à jour avec succès.',
            'data'    => $this->serializeSemestreDetail($semestre),
        ]);
    }

    // =====================
    // POST /api/semestres/{id}/cloturer
    // =====================
    #[Route('/{id}/cloturer', name: 'cloturer', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function cloturer(int $id): JsonResponse
    {
        $semestre = $this->repo->find($id);

        if (!$semestre) {
            return $this->json([
                'success' => false,
                'message' => 'Semestre non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($semestre->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Ce semestre est déjà clôturé.',
            ], Response::HTTP_CONFLICT);
        }

        try {
            $semestre->cloturer();
        } catch (\LogicException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->flush();

        return $this->json([
            'success'   => true,
            'message'   => "Semestre '{$semestre->getNom()}' clôturé avec succès.",
            'data'      => $this->serializeSemestre($semestre),
        ]);
    }

    // =====================
    // DELETE /api/semestres/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $semestre = $this->repo->find($id);

        if (!$semestre) {
            return $this->json([
                'success' => false,
                'message' => 'Semestre non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Blocage : semestre clôturé — irréversible
        if ($semestre->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer un semestre clôturé.',
            ], Response::HTTP_CONFLICT);
        }

        // Blocage : matières existantes
        if (!$semestre->getMatieres()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : ce semestre contient '
                    . $semestre->getMatieres()->count()
                    . ' matière(s). Supprimez d\'abord les matières associées.',
            ], Response::HTTP_CONFLICT);
        }

        $nom = $semestre->getNom();
        $this->em->remove($semestre);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Semestre '{$nom}' supprimé avec succès.",
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serializeSemestre(Semestre $s): array
    {
        return [
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
            'anneeUniversitaire' => [
                'id'      => $s->getAnneeUniversitaire()?->getId(),
                'libelle' => $s->getAnneeUniversitaire()?->getLibelle(),
            ],
        ];
    }

    private function serializeSemestreDetail(Semestre $s): array
    {
        return [
            'id'              => $s->getId(),
            'nom'             => $s->getNom(),
            'libelleComplet'  => $s->getLibelleComplet(),
            'isCloture'       => $s->isCloture(),
            'isSaisieOuverte' => $s->isSaisieOuverte(),
            'dateDebutSaisie' => $s->getDateDebutSaisie()?->format('Y-m-d'),
            'dateFinSaisie'   => $s->getDateFinSaisie()?->format('Y-m-d'),
            'niveau'          => [
                'id'      => $s->getNiveau()?->getId(),
                'nom'     => $s->getNiveau()?->getNom(),
                'filiere' => [
                    'id'  => $s->getNiveau()?->getFiliere()?->getId(),
                    'nom' => $s->getNiveau()?->getFiliere()?->getNom(),
                ],
            ],
            'anneeUniversitaire' => [
                'id'      => $s->getAnneeUniversitaire()?->getId(),
                'libelle' => $s->getAnneeUniversitaire()?->getLibelle(),
            ],
            'nbMatieres'      => $s->getMatieres()->count(),
            'nbDeliberations' => $s->getDeliberations()->count(),
        ];
    }
}