<?php

namespace App\Controller;

use App\Entity\Matiere;
use App\Entity\Semestre;
use App\Entity\Enseignant;
use App\Repository\MatiereRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/matieres', name: 'api_matieres_')]
class MatiereController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private MatiereRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/matieres
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(Request $request): JsonResponse
    {
        $criteria = [];
        if ($request->query->get('semestreId')) {
            $criteria['semestre'] = $request->query->get('semestreId');
        }
        if ($request->query->get('isActive') !== null) {
            $criteria['isActive'] = filter_var($request->query->get('isActive'), FILTER_VALIDATE_BOOLEAN);
        }

        // Règle : enseignant ne voit que SES matières
        if ($this->isGranted('ROLE_ENSEIGNANT') && !$this->isGranted('ROLE_ADMIN')) {
            $enseignant = $this->getEnseignantConnecte();
            if ($enseignant) {
                $criteria['enseignant'] = $enseignant->getId();
            }
        } elseif ($request->query->get('enseignantId')) {
            $criteria['enseignant'] = $request->query->get('enseignantId');
        }

        $matieres = $this->repo->findBy($criteria, ['nom' => 'ASC']);

        // ── Filtre niveau/filière en mémoire ──────────────────────────────
        // Matiere n'a pas de colonne niveau_id/filiere_id directe : ces infos
        // sont dérivées via Matiere -> Semestre -> Niveau -> Filiere.
        // On filtre donc en PHP après la requête Doctrine.
        $niveauId  = $request->query->get('niveauId');
        $filiereId = $request->query->get('filiereId');

        if ($niveauId) {
            $matieres = array_filter($matieres, fn(Matiere $m) =>
                $m->getSemestre()?->getNiveau()?->getId() == $niveauId
            );
        }
        if ($filiereId) {
            $matieres = array_filter($matieres, fn(Matiere $m) =>
                $m->getSemestre()?->getNiveau()?->getFiliere()?->getId() == $filiereId
            );
        }
        $matieres = array_values($matieres);
        // ────────────────────────────────────────────────────────────────

        return $this->json([
            'success' => true,
            'total'   => count($matieres),
            'data'    => array_map(fn(Matiere $m) => $this->serialize($m), $matieres),
        ]);
    }

    // =====================
    // GET /api/matieres/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function show(int $id): JsonResponse
    {
        $matiere = $this->repo->find($id);

        if (!$matiere) {
            return $this->json([
                'success' => false,
                'message' => 'Matière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Règle : enseignant ne peut voir que SES matières
        if ($this->isGranted('ROLE_ENSEIGNANT') && !$this->isGranted('ROLE_ADMIN')) {
            $enseignant = $this->getEnseignantConnecte();
            if ($enseignant && $matiere->getEnseignant()?->getId() !== $enseignant->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Accès refusé : cette matière ne vous est pas assignée.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($matiere),
        ]);
    }

    // =====================
    // POST /api/matieres
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

        foreach (['nom', 'code', 'credit', 'coefficient', 'type', 'semestreId'] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $semestre = $this->em->getRepository(Semestre::class)->find($data['semestreId']);
        if (!$semestre) {
            return $this->json([
                'success' => false,
                'message' => 'Semestre non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($semestre->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible d\'ajouter une matière à un semestre clôturé.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Vérification code unique
        if ($this->repo->findOneBy(['code' => strtoupper($data['code'])])) {
            return $this->json([
                'success' => false,
                'message' => "Le code matière '{$data['code']}' existe déjà.",
            ], Response::HTTP_CONFLICT);
        }

        $matiere = new Matiere();
        $matiere->setNom($data['nom']);
        $matiere->setCode($data['code']);
        $matiere->setCredit((int) $data['credit']);
        $matiere->setCoefficient((string) $data['coefficient']);
        $matiere->setType($data['type']);
        $matiere->setSemestre($semestre);
        $matiere->setIsActive(true);

        // Poids CC/Exam — valeurs par défaut 0.40/0.60
        if (isset($data['noteCcPoids'])) $matiere->setNoteCcPoids((string) $data['noteCcPoids']);
        if (isset($data['noteExPoids'])) $matiere->setNoteExPoids((string) $data['noteExPoids']);

        // Enseignant optionnel
        if (!empty($data['enseignantId'])) {
            $enseignant = $this->em->getRepository(Enseignant::class)->find($data['enseignantId']);
            if (!$enseignant) {
                return $this->json([
                    'success' => false,
                    'message' => 'Enseignant non trouvé.',
                ], Response::HTTP_NOT_FOUND);
            }
            try {
                $matiere->setEnseignant($enseignant);
            } catch (\LogicException $e) {
                return $this->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                ], Response::HTTP_UNPROCESSABLE_ENTITY);
            }
        }

        $errors = $this->validator->validate($matiere);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $this->formatErrors($errors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($matiere);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Matière créée avec succès.',
            'data'    => $this->serializeDetail($matiere),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/matieres/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $matiere = $this->repo->find($id);

        if (!$matiere) {
            return $this->json([
                'success' => false,
                'message' => 'Matière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($matiere->getSemestre()?->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de modifier une matière d\'un semestre clôturé.',
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
            if (isset($data['nom']))         $matiere->setNom($data['nom']);
            if (isset($data['code']))        $matiere->setCode($data['code']);
            if (isset($data['credit']))      $matiere->setCredit((int) $data['credit']);
            if (isset($data['coefficient'])) $matiere->setCoefficient((string) $data['coefficient']);
            if (isset($data['type']))        $matiere->setType($data['type']);
            if (isset($data['noteCcPoids'])) $matiere->setNoteCcPoids((string) $data['noteCcPoids']);
            if (isset($data['noteExPoids'])) $matiere->setNoteExPoids((string) $data['noteExPoids']);
            if (isset($data['isActive']))    $matiere->setIsActive((bool) $data['isActive']);

            // Changement de semestre (optionnel)
            if (isset($data['semestreId'])) {
                $semestre = $this->em->getRepository(Semestre::class)->find($data['semestreId']);
                if (!$semestre) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Semestre non trouvé.',
                    ], Response::HTTP_NOT_FOUND);
                }
                $matiere->setSemestre($semestre);
            }

            if (array_key_exists('enseignantId', $data)) {
                if ($data['enseignantId'] === null) {
                    $matiere->setEnseignant(null);
                } else {
                    $enseignant = $this->em->getRepository(Enseignant::class)->find($data['enseignantId']);
                    if (!$enseignant) {
                        return $this->json([
                            'success' => false,
                            'message' => 'Enseignant non trouvé.',
                        ], Response::HTTP_NOT_FOUND);
                    }
                    $matiere->setEnseignant($enseignant);
                }
            }
        } catch (\LogicException|\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $errors = $this->validator->validate($matiere);
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
            'message' => 'Matière mise à jour avec succès.',
            'data'    => $this->serializeDetail($matiere),
        ]);
    }

    // =====================
    // DELETE /api/matieres/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $matiere = $this->repo->find($id);

        if (!$matiere) {
            return $this->json([
                'success' => false,
                'message' => 'Matière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($matiere->getSemestre()?->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer une matière d\'un semestre clôturé.',
            ], Response::HTTP_CONFLICT);
        }

        if (!$matiere->getNotes()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : cette matière a '
                    . $matiere->getNotes()->count()
                    . ' note(s) enregistrée(s). Désactivez-la plutôt.',
            ], Response::HTTP_CONFLICT);
        }

        $nom = $matiere->getNom();
        $this->em->remove($matiere);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Matière '{$nom}' supprimée avec succès.",
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serialize(Matiere $m): array
{
    $niveau  = $m->getSemestre()?->getNiveau();
    $filiere = $niveau?->getFiliere();

    return [
        'id'          => $m->getId(),
        'nom'         => $m->getNom(),
        'code'        => $m->getCode(),
        'credit'      => $m->getCredit(),
        'coefficient' => $m->getCoefficient(),
        'type'        => $m->getType(),
        'noteCcPoids' => $m->getNoteCcPoids(),
        'noteExPoids' => $m->getNoteExPoids(),
        'isActive'    => $m->isActive(),
        'semestre' => [
            'id'     => $m->getSemestre()?->getId(),
            'nom'    => $m->getSemestre()?->getNom(),
            'niveau' => [
                'id'      => $niveau?->getId(),
                'nom'     => $niveau?->getNom(),
                'filiere' => [
                    'id'   => $filiere?->getId(),
                    'nom'  => $filiere?->getNom(),
                    'code' => $filiere?->getCode(),
                ],
            ],
        ],
        'enseignant' => $m->getEnseignant() ? [
            'id'        => $m->getEnseignant()->getId(),
            'nomComplet' => $m->getEnseignant()->getNomComplet(),
            'matricule' => $m->getEnseignant()->getMatricule(),
        ] : null,
    ];
}

    private function serializeDetail(Matiere $m): array
{
    return array_merge($this->serialize($m), [
        'libelleComplet' => $m->getLibelleComplet(),
        'nbNotes'        => $m->getNotes()->count(),
        'semestre'       => [
            'id'        => $m->getSemestre()?->getId(),
            'nom'       => $m->getSemestre()?->getNom(),
            'isCloture' => $m->getSemestre()?->isCloture(),
            'annee'     => $m->getSemestre()?->getAnneeUniversitaire()?->getLibelle(),
            'niveau'    => [
                'id'     => $m->getSemestre()?->getNiveau()?->getId(),
                'nom'    => $m->getSemestre()?->getNiveau()?->getNom(),
                'filiere' => [
                    'id'   => $m->getSemestre()?->getNiveau()?->getFiliere()?->getId(),
                    'nom'  => $m->getSemestre()?->getNiveau()?->getFiliere()?->getNom(),
                    'code' => $m->getSemestre()?->getNiveau()?->getFiliere()?->getCode(),
                ],
            ],
        ],
    ]);
}

    // =====================
    // MÉTHODES PRIVÉES
    // =====================

    private function getEnseignantConnecte(): ?Enseignant
    {
        $user = $this->getUser();
        return $this->em->getRepository(Enseignant::class)->findOneBy(['user' => $user]);
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