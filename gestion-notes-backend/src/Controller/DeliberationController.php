<?php

namespace App\Controller;

use App\Entity\Deliberation;
use App\Entity\Etudiant;
use App\Entity\Semestre;
use App\Repository\DeliberationRepository;
use App\Repository\NoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/deliberations', name: 'api_deliberations_')]
class DeliberationController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private DeliberationRepository $repo,
        private NoteRepository $noteRepo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/deliberations
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function list(Request $request): JsonResponse
    {
        $criteria = [];
        if ($request->query->get('semestreId')) {
            $criteria['semestre'] = $request->query->get('semestreId');
        }
        if ($request->query->get('isPublie') !== null) {
            $criteria['isPublie'] = filter_var($request->query->get('isPublie'), FILTER_VALIDATE_BOOLEAN);
        }
        if ($request->query->get('decision')) {
            $criteria['decision'] = $request->query->get('decision');
        }

        $deliberations = $this->repo->findBy($criteria, ['dateDeliberation' => 'DESC']);

        return $this->json([
            'success' => true,
            'total'   => count($deliberations),
            'data'    => array_map(fn(Deliberation $d) => $this->serialize($d), $deliberations),
        ]);
    }

    // =====================
    // GET /api/deliberations/me
    // =====================
    #[Route('/me', name: 'me', methods: ['GET'])]
    #[IsGranted('ROLE_ETUDIANT')]
    public function me(Request $request): JsonResponse
    {
        $user = $this->getUser();
        $etudiant = $this->em->getRepository(Etudiant::class)->findOneBy(['user' => $user]);

        if (!$etudiant) {
            return $this->json([
                'success' => false,
                'message' => 'Profil étudiant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Étudiant ne voit que les délibérations publiées
        $criteria = ['etudiant' => $etudiant, 'isPublie' => true];
        if ($request->query->get('semestreId')) {
            $criteria['semestre'] = $request->query->get('semestreId');
        }

        $deliberations = $this->repo->findBy($criteria, ['dateDeliberation' => 'DESC']);

        return $this->json([
            'success' => true,
            'total'   => count($deliberations),
            'data'    => array_map(fn(Deliberation $d) => $this->serializeDetail($d), $deliberations),
        ]);
    }

    // =====================
    // GET /api/deliberations/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(string $id): JsonResponse
    {
        $deliberation = $this->repo->find($id);

        if (!$deliberation) {
            return $this->json([
                'success' => false,
                'message' => 'Délibération non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($deliberation),
        ]);
    }

    // =====================
    // POST /api/deliberations/calculer
    // =====================
    #[Route('/calculer', name: 'calculer', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function calculer(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['etudiantId']) || empty($data['semestreId'])) {
            return $this->json([
                'success' => false,
                'message' => 'Les champs etudiantId et semestreId sont obligatoires.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $etudiant = $this->em->getRepository(Etudiant::class)->find($data['etudiantId']);
        if (!$etudiant) {
            return $this->json(['success' => false, 'message' => 'Étudiant non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $semestre = $this->em->getRepository(Semestre::class)->find($data['semestreId']);
        if (!$semestre) {
            return $this->json(['success' => false, 'message' => 'Semestre non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        if (!$semestre->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Le semestre doit être clôturé avant de délibérer.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Bloquer si délibération déjà publiée
        $existing = $this->repo->findOneBy([
            'etudiant' => $etudiant,
            'semestre' => $semestre,
        ]);
        if ($existing?->isPublie()) {
            return $this->json([
                'success' => false,
                'message' => 'La délibération est déjà publiée. Impossible de recalculer.',
            ], Response::HTTP_CONFLICT);
        }

        $notes = $this->noteRepo->findBy([
            'etudiant' => $etudiant,
            'semestre' => $semestre,
        ]);

        if (empty($notes)) {
            return $this->json([
                'success' => false,
                'message' => 'Aucune note trouvée pour cet étudiant dans ce semestre.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Calcul moyenne pondérée
        [$moyenne, $totalCredits, $creditsValides] = $this->calculerMoyenne($notes);

        $deliberation = $existing ?? new Deliberation();
        $deliberation->setEtudiant($etudiant);
        $deliberation->setSemestre($semestre);
        $deliberation->setAnneeUniversitaire($semestre->getAnneeUniversitaire());
        $deliberation->setMoyenneGenerale((string) $moyenne);
        $deliberation->setTotalCredits($totalCredits);
        $deliberation->setCreditsValides($creditsValides);

        if (!empty($data['observations'])) {
            $deliberation->setObservations($data['observations']);
        }

        $errors = $this->validator->validate($deliberation);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $this->formatErrors($errors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if (!$existing) {
            $this->em->persist($deliberation);
        }
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Délibération calculée avec succès.',
            'data'    => $this->serializeDetail($deliberation),
        ], $existing ? Response::HTTP_OK : Response::HTTP_CREATED);
    }

    // =====================
    // POST /api/deliberations/calculer-semestre
    // =====================
    #[Route('/calculer-semestre', name: 'calculer_semestre', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function calculerSemestre(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (empty($data['semestreId'])) {
            return $this->json([
                'success' => false,
                'message' => 'Le champ semestreId est obligatoire.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $semestre = $this->em->getRepository(Semestre::class)->find($data['semestreId']);
        if (!$semestre) {
            return $this->json([
                'success' => false,
                'message' => 'Semestre non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (!$semestre->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Le semestre doit être clôturé avant de délibérer.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $etudiants = $this->em->getRepository(Etudiant::class)->findBy([
            'niveau' => $semestre->getNiveau(),
            'statut' => 'actif',
        ]);

        if (empty($etudiants)) {
            return $this->json([
                'success' => false,
                'message' => 'Aucun étudiant actif trouvé pour ce niveau.',
            ], Response::HTTP_NOT_FOUND);
        }

        $resultats = [];
        $erreurs   = [];
        $ignores   = [];

        foreach ($etudiants as $etudiant) {
            $notes = $this->noteRepo->findBy([
                'etudiant' => $etudiant,
                'semestre' => $semestre,
            ]);

            if (empty($notes)) {
                $erreurs[] = "{$etudiant->getNomComplet()} ({$etudiant->getMatricule()}) : aucune note.";
                continue;
            }

            $existing = $this->repo->findOneBy([
                'etudiant' => $etudiant,
                'semestre' => $semestre,
            ]);

            if ($existing?->isPublie()) {
                $ignores[] = "{$etudiant->getNomComplet()} : délibération déjà publiée.";
                continue;
            }

            [$moyenne, $totalCredits, $creditsValides] = $this->calculerMoyenne($notes);

            $deliberation = $existing ?? new Deliberation();
            $deliberation->setEtudiant($etudiant);
            $deliberation->setSemestre($semestre);
            $deliberation->setAnneeUniversitaire($semestre->getAnneeUniversitaire());
            $deliberation->setMoyenneGenerale((string) $moyenne);
            $deliberation->setTotalCredits($totalCredits);
            $deliberation->setCreditsValides($creditsValides);

            if (!$existing) {
                $this->em->persist($deliberation);
            }

            $resultats[] = [
                'etudiant'       => $etudiant->getNomComplet(),
                'matricule'      => $etudiant->getMatricule(),
                'moyenne'        => $moyenne,
                'decision'       => $deliberation->getDecision(),
                'mentionGlobale' => $deliberation->getMentionGlobale(),
                'creditsValides' => $creditsValides,
                'totalCredits'   => $totalCredits,
                'tauxReussite'   => $deliberation->getTauxReussite(),
            ];
        }

        $this->em->flush();

        return $this->json([
            'success'   => true,
            'message'   => 'Délibérations calculées avec succès.',
            'traites'   => count($resultats),
            'ignores'   => count($ignores),
            'erreurs'   => count($erreurs),
            'resultats' => $resultats,
            'details'   => [
                'ignores' => $ignores,
                'erreurs' => $erreurs,
            ],
        ]);
    }

    // =====================
    // POST /api/deliberations/{id}/publier
    // =====================
    #[Route('/{id}/publier', name: 'publier', methods: ['POST'])]
    #[IsGranted('ROLE_ADMIN')]
    public function publier(string $id): JsonResponse
    {
        $deliberation = $this->repo->find($id);

        if (!$deliberation) {
            return $this->json([
                'success' => false,
                'message' => 'Délibération non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($deliberation->isPublie()) {
            return $this->json([
                'success' => false,
                'message' => 'Cette délibération est déjà publiée.',
            ], Response::HTTP_CONFLICT);
        }

        try {
            $deliberation->publier($this->getUser());
        } catch (\LogicException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Délibération publiée avec succès.',
            'data'    => $this->serializeDetail($deliberation),
        ]);
    }

    // =====================
    // MÉTHODES PRIVÉES
    // =====================

    /**
     * Calcule moyenne, total crédits et crédits validés depuis les notes
     */
    private function calculerMoyenne(array $notes): array
    {
        $totalCoeff     = 0.0;
        $totalPoints    = 0.0;
        $totalCredits   = 0;
        $creditsValides = 0;

        foreach ($notes as $note) {
            $matiere = $note->getMatiere();
            $coeff   = (float) $matiere->getCoefficient();
            $credit  = $matiere->getCredit();
            $finale  = (float) ($note->getNoteFinale() ?? 0);

            $totalCoeff   += $coeff;
            $totalPoints  += $finale * $coeff;
            $totalCredits += $credit;

            if ($note->isValidee()) {
                $creditsValides += $credit;
            }
        }

        $moyenne = $totalCoeff > 0
            ? round($totalPoints / $totalCoeff, 2)
            : 0.0;

        return [$moyenne, $totalCredits, $creditsValides];
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serialize(Deliberation $d): array
    {
        return [
            'id'               => $d->getId(),
            'moyenneGenerale'  => $d->getMoyenneGenerale(),
            'totalCredits'     => $d->getTotalCredits(),
            'creditsValides'   => $d->getCreditsValides(),
            'decision'         => $d->getDecision(),
            'mentionGlobale'   => $d->getMentionGlobale(),
            'isPublie'         => $d->isPublie(),
            'tauxReussite'     => $d->getTauxReussite(),
            'dateDeliberation' => $d->getDateDeliberation()?->format('Y-m-d'),
            'etudiant'         => [
                'id'        => $d->getEtudiant()?->getId(),
                'nomComplet' => $d->getEtudiant()?->getNomComplet(),
                'matricule'  => $d->getEtudiant()?->getMatricule(),
            ],
            'semestre' => [
                'id'  => $d->getSemestre()?->getId(),
                'nom' => $d->getSemestre()?->getNom(),
            ],
            'anneeUniversitaire' => [
                'id'      => $d->getAnneeUniversitaire()?->getId(),
                'libelle' => $d->getAnneeUniversitaire()?->getLibelle(),
            ],
        ];
    }

    private function serializeDetail(Deliberation $d): array
    {
        return array_merge($this->serialize($d), [
            'observations' => $d->getObservations(),
            'deliberePar'  => $d->getDeliberePar()?->getEmail(),
            'isAdmis'      => $d->isAdmis(),
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