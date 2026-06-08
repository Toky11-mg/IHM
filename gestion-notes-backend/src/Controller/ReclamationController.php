<?php

namespace App\Controller;

use App\Entity\Reclamation;
use App\Entity\Etudiant;
use App\Entity\Note;
use App\Repository\ReclamationRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/reclamations', name: 'api_reclamations_')]
class ReclamationController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private ReclamationRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/reclamations
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(Request $request): JsonResponse
    {
        $criteria = [];
        if ($request->query->get('statut')) {
            $criteria['statut'] = $request->query->get('statut');
        }

        $reclamations = $this->repo->findBy($criteria, ['dateSoumission' => 'DESC']);

        return $this->json([
            'success' => true,
            'total'   => count($reclamations),
            'data'    => array_map(fn(Reclamation $r) => $this->serialize($r), $reclamations),
        ]);
    }

    // =====================
    // GET /api/reclamations/me
    // =====================
    #[Route('/me', name: 'me', methods: ['GET'])]
    #[IsGranted('ROLE_ETUDIANT')]
    public function me(): JsonResponse
    {
        $user = $this->getUser();
        $etudiant = $this->em->getRepository(Etudiant::class)->findOneBy(['user' => $user]);

        if (!$etudiant) {
            return $this->json([
                'success' => false,
                'message' => 'Profil étudiant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        $reclamations = $this->repo->findBy(
            ['etudiant' => $etudiant],
            ['dateSoumission' => 'DESC']
        );

        return $this->json([
            'success' => true,
            'total'   => count($reclamations),
            'data'    => array_map(fn(Reclamation $r) => $this->serializeDetail($r), $reclamations),
        ]);
    }

    // =====================
    // GET /api/reclamations/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(string $id): JsonResponse
    {
        $reclamation = $this->repo->find($id);

        if (!$reclamation) {
            return $this->json([
                'success' => false,
                'message' => 'Réclamation non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Étudiant ne peut voir que SES réclamations
        if ($this->isGranted('ROLE_ETUDIANT') && !$this->isGranted('ROLE_ADMIN')) {
            $user = $this->getUser();
            $etudiant = $this->em->getRepository(Etudiant::class)->findOneBy(['user' => $user]);
            if ($reclamation->getEtudiant()?->getId() !== $etudiant?->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Accès refusé : cette réclamation ne vous appartient pas.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($reclamation),
        ]);
    }

    // =====================
    // POST /api/reclamations
    // =====================
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ETUDIANT')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        foreach (['noteId', 'motif', 'typeReclamation'] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $user = $this->getUser();
        $etudiant = $this->em->getRepository(Etudiant::class)->findOneBy(['user' => $user]);

        if (!$etudiant) {
            return $this->json([
                'success' => false,
                'message' => 'Profil étudiant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Étudiant doit être actif
        if (!$etudiant->isActif()) {
            return $this->json([
                'success' => false,
                'message' => 'Votre compte est inactif. Contactez un administrateur.',
            ], Response::HTTP_FORBIDDEN);
        }

        $note = $this->em->getRepository(Note::class)->find($data['noteId']);
        if (!$note) {
            return $this->json([
                'success' => false,
                'message' => 'Note non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Règle : note doit appartenir à l'étudiant
        if ($note->getEtudiant()?->getId() !== $etudiant->getId()) {
            return $this->json([
                'success' => false,
                'message' => 'Cette note ne vous appartient pas.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Règle : une seule réclamation par note
        $existing = $this->repo->findOneBy([
            'etudiant' => $etudiant,
            'note'     => $note,
        ]);
        if ($existing) {
            return $this->json([
                'success'       => false,
                'message'       => 'Une réclamation existe déjà pour cette note.',
                'reclamationId' => $existing->getId(),
                'statut'        => $existing->getStatut(),
            ], Response::HTTP_CONFLICT);
        }

        $reclamation = new Reclamation();
        $reclamation->setEtudiant($etudiant);
        $reclamation->setNote($note);

        try {
            $reclamation->setMotif($data['motif']);
            $reclamation->setTypeReclamation($data['typeReclamation']);
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        $errors = $this->validator->validate($reclamation);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $this->formatErrors($errors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($reclamation);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Réclamation soumise avec succès.',
            'data'    => $this->serializeDetail($reclamation),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/reclamations/{id}/traiter
    // =====================
    #[Route('/{id}/traiter', name: 'traiter', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function traiter(string $id, Request $request): JsonResponse
    {
        $reclamation = $this->repo->find($id);

        if (!$reclamation) {
            return $this->json([
                'success' => false,
                'message' => 'Réclamation non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($reclamation->isTraitee()) {
            return $this->json([
                'success' => false,
                'message' => 'Cette réclamation est déjà traitée (statut: ' . $reclamation->getStatut() . ').',
            ], Response::HTTP_CONFLICT);
        }

        // Vérification délai dépassé
        if ($reclamation->isDelaiDepasse() && $reclamation->getStatut() === 'en_attente') {
            return $this->json([
                'success' => false,
                'message' => 'Le délai de traitement est dépassé.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['statut'])) {
            return $this->json([
                'success' => false,
                'message' => 'Le champ statut est obligatoire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        if (in_array($data['statut'], ['accepte', 'refuse']) && empty($data['reponse'])) {
            return $this->json([
                'success' => false,
                'message' => 'Une réponse détaillée est obligatoire pour '
                    . ($data['statut'] === 'accepte' ? 'accepter' : 'refuser')
                    . ' une réclamation.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            $reclamation->setStatut($data['statut']);
            if (!empty($data['reponse'])) {
                $reclamation->setReponse($data['reponse']);
            }
            $reclamation->setTraitePar($this->getUser());
        } catch (\LogicException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $errors = $this->validator->validate($reclamation);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $this->formatErrors($errors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Réclamation traitée avec succès.',
            'data'    => $this->serializeDetail($reclamation),
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serialize(Reclamation $r): array
    {
        return [
            'id'              => $r->getId(),
            'typeReclamation' => $r->getTypeReclamation(),
            'statut'          => $r->getStatut(),
            'isTraitee'       => $r->isTraitee(),
            'isDelaiDepasse'  => $r->isDelaiDepasse(),
            'joursRestants'   => $r->getJoursRestants(),
            'dateSoumission'  => $r->getDateSoumission()?->format('Y-m-d H:i:s'),
            'dateLimite'      => $r->getDateLimite()?->format('Y-m-d H:i:s'),
            'dateTraitement'  => $r->getDateTraitement()?->format('Y-m-d H:i:s'),
            'etudiant'        => [
                'id'        => $r->getEtudiant()?->getId(),
                'nomComplet' => $r->getEtudiant()?->getNomComplet(),
                'matricule'  => $r->getEtudiant()?->getMatricule(),
            ],
            'note' => [
                'id'         => $r->getNote()?->getId(),
                'noteFinale' => $r->getNote()?->getNoteFinale(),
                'mention'    => $r->getNote()?->getMention(),
                'matiere'    => $r->getNote()?->getMatiere()?->getNom(),
                'code'       => $r->getNote()?->getMatiere()?->getCode(),
            ],
        ];
    }

    private function serializeDetail(Reclamation $r): array
    {
        return array_merge($this->serialize($r), [
            'motif'     => $r->getMotif(),
            'reponse'   => $r->getReponse(),
            'resume'    => $r->getResume(),
            'traitePar' => $r->getTraitePar()?->getEmail(),
        ]);
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