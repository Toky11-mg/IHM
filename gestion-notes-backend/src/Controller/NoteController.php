<?php

namespace App\Controller;

use App\Entity\Note;
use App\Entity\Etudiant;
use App\Entity\Matiere;
use App\Entity\Semestre;
use App\Entity\Enseignant;
use App\Entity\Deliberation;
use App\Repository\NoteRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/notes', name: 'api_notes_')]
class NoteController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private NoteRepository $repo,
        private ValidatorInterface $validator,
    ) {}

    // =====================
    // GET /api/notes
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function list(Request $request): JsonResponse
    {
        $criteria = [];
        if ($request->query->get('semestreId')) $criteria['semestre'] = $request->query->get('semestreId');
        if ($request->query->get('matiereId'))  $criteria['matiere']  = $request->query->get('matiereId');
        if ($request->query->get('etudiantId')) $criteria['etudiant'] = $request->query->get('etudiantId');

        // Règle : enseignant ne voit que les notes de SES matières
        if ($this->isGranted('ROLE_ENSEIGNANT') && !$this->isGranted('ROLE_ADMIN')) {
            $enseignant = $this->getEnseignantConnecte();
            if (!$enseignant) {
                return $this->json([
                    'success' => false,
                    'message' => 'Profil enseignant non trouvé.',
                ], Response::HTTP_NOT_FOUND);
            }

            $matiereIds = $enseignant->getMatieres()->map(fn($m) => $m->getId())->toArray();
            if (empty($matiereIds)) {
                return $this->json(['success' => true, 'total' => 0, 'data' => []]);
            }

            $notes = $this->repo->findByMatieres($matiereIds, $criteria);
        } else {
            $notes = $this->repo->findBy($criteria, ['dateSaisie' => 'DESC']);
        }

        return $this->json([
            'success' => true,
            'total'   => count($notes),
            'data'    => array_map(fn(Note $n) => $this->serialize($n), $notes),
        ]);
    }

    // =====================
    // GET /api/notes/me  (étudiant connecté)
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

        $criteria = ['etudiant' => $etudiant];
        if ($request->query->get('semestreId')) {
            $criteria['semestre'] = $request->query->get('semestreId');
        }

        $notes = $this->repo->findBy($criteria, ['dateSaisie' => 'DESC']);

        return $this->json([
            'success' => true,
            'total'   => count($notes),
            'data'    => array_map(fn(Note $n) => $this->serialize($n), $notes),
        ]);
    }

    // =====================
    // GET /api/notes/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function show(string $id): JsonResponse
    {
        $note = $this->repo->find($id);

        if (!$note) {
            return $this->json([
                'success' => false,
                'message' => 'Note non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Étudiant ne peut voir que SES notes
        if ($this->isGranted('ROLE_ETUDIANT') && !$this->isGranted('ROLE_ENSEIGNANT')) {
            $user = $this->getUser();
            $etudiant = $this->em->getRepository(Etudiant::class)->findOneBy(['user' => $user]);
            if ($note->getEtudiant()?->getId() !== $etudiant?->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Accès refusé : cette note ne vous appartient pas.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        // Enseignant ne peut voir que les notes de SES matières
        if ($this->isGranted('ROLE_ENSEIGNANT') && !$this->isGranted('ROLE_ADMIN')) {
            $enseignant = $this->getEnseignantConnecte();
            if ($note->getMatiere()?->getEnseignant()?->getId() !== $enseignant?->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Accès refusé : cette matière ne vous est pas assignée.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($note),
        ]);
    }

    // =====================
    // POST /api/notes
    // =====================
    #[Route('', name: 'create', methods: ['POST'])]
    #[IsGranted('ROLE_ENSEIGNANT')]
    public function create(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        foreach (['etudiantId', 'matiereId', 'semestreId'] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        $etudiant = $this->em->getRepository(Etudiant::class)->find($data['etudiantId']);
        if (!$etudiant) return $this->json(['success' => false, 'message' => 'Étudiant non trouvé.'], Response::HTTP_NOT_FOUND);

        $matiere = $this->em->getRepository(Matiere::class)->find($data['matiereId']);
        if (!$matiere) return $this->json(['success' => false, 'message' => 'Matière non trouvée.'], Response::HTTP_NOT_FOUND);

        $semestre = $this->em->getRepository(Semestre::class)->find($data['semestreId']);
        if (!$semestre) return $this->json(['success' => false, 'message' => 'Semestre non trouvé.'], Response::HTTP_NOT_FOUND);

        // Règle : étudiant actif
        if (!$etudiant->isActif()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de saisir une note pour un étudiant inactif.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Règle : matière active
        if (!$matiere->isActive()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de saisir une note pour une matière inactive.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Règle : semestre clôturé
        if ($semestre->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Saisie impossible : le semestre est clôturé.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Règle : période de saisie ouverte
        if (!$semestre->isSaisieOuverte()) {
            return $this->json([
                'success' => false,
                'message' => 'La période de saisie n\'est pas ouverte pour ce semestre.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Règle : enseignant ne peut saisir que SES matières
        if ($this->isGranted('ROLE_ENSEIGNANT') && !$this->isGranted('ROLE_ADMIN')) {
            $enseignant = $this->getEnseignantConnecte();
            if (!$enseignant || !$enseignant->peutSaisirNotesPour($matiere)) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez saisir que les notes de vos matières.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        // Règle : note déjà existante
        $existing = $this->repo->findOneBy([
            'etudiant' => $etudiant,
            'matiere'  => $matiere,
            'semestre' => $semestre,
        ]);
        if ($existing) {
            return $this->json([
                'success' => false,
                'message' => 'Une note existe déjà pour cet étudiant dans cette matière pour ce semestre.',
                'noteId'  => $existing->getId(),
            ], Response::HTTP_CONFLICT);
        }

        $note = new Note();
        $note->setEtudiant($etudiant);
        $note->setMatiere($matiere);
        $note->setSemestre($semestre);
        $note->setSaisiePar($this->getUser());

        try {
            $note->setIsAbsentCc($data['isAbsentCc'] ?? false);
            $note->setIsAbsentExamen($data['isAbsentExamen'] ?? false);

            if (isset($data['noteCc']))     $note->setNoteCc((string) $data['noteCc']);
            if (isset($data['noteExamen'])) $note->setNoteExamen((string) $data['noteExamen']);
        } catch (\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        $errors = $this->validator->validate($note);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données invalides.',
                'errors'  => $this->formatErrors($errors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($note);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Note saisie avec succès.',
            'data'    => $this->serializeDetail($note),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/notes/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ENSEIGNANT')]
    public function update(string $id, Request $request): JsonResponse
    {
        $note = $this->repo->find($id);

        if (!$note) {
            return $this->json([
                'success' => false,
                'message' => 'Note non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Règle : semestre clôturé
        if ($note->getSemestre()?->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Modification impossible : le semestre est clôturé.',
            ], Response::HTTP_CONFLICT);
        }

        // Règle : délibération publiée
        $deliberation = $this->em->getRepository(Deliberation::class)->findOneBy([
            'etudiant' => $note->getEtudiant(),
            'semestre' => $note->getSemestre(),
        ]);
        if ($deliberation?->isPublie()) {
            return $this->json([
                'success' => false,
                'message' => 'Modification impossible : la délibération de cet étudiant est déjà publiée.',
            ], Response::HTTP_CONFLICT);
        }

        // Règle : enseignant ne peut modifier que SES matières
        if ($this->isGranted('ROLE_ENSEIGNANT') && !$this->isGranted('ROLE_ADMIN')) {
            $enseignant = $this->getEnseignantConnecte();
            if ($note->getMatiere()?->getEnseignant()?->getId() !== $enseignant?->getId()) {
                return $this->json([
                    'success' => false,
                    'message' => 'Vous ne pouvez modifier que les notes de vos matières.',
                ], Response::HTTP_FORBIDDEN);
            }
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            if (isset($data['isAbsentCc']))     $note->setIsAbsentCc((bool) $data['isAbsentCc']);
            if (isset($data['isAbsentExamen'])) $note->setIsAbsentExamen((bool) $data['isAbsentExamen']);
            if (isset($data['noteCc']))         $note->setNoteCc((string) $data['noteCc']);
            if (isset($data['noteExamen']))     $note->setNoteExamen((string) $data['noteExamen']);

            $note->setModifiePar($this->getUser());
        } catch (\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        $errors = $this->validator->validate($note);
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
            'message' => 'Note mise à jour avec succès.',
            'data'    => $this->serializeDetail($note),
        ]);
    }

    // =====================
    // DELETE /api/notes/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(string $id): JsonResponse
    {
        $note = $this->repo->find($id);

        if (!$note) {
            return $this->json([
                'success' => false,
                'message' => 'Note non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($note->getSemestre()?->isCloture()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer une note d\'un semestre clôturé.',
            ], Response::HTTP_CONFLICT);
        }

        // Bloquer si délibération publiée
        $deliberation = $this->em->getRepository(Deliberation::class)->findOneBy([
            'etudiant' => $note->getEtudiant(),
            'semestre' => $note->getSemestre(),
        ]);
        if ($deliberation?->isPublie()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : la délibération est publiée.',
            ], Response::HTTP_CONFLICT);
        }

        $resume = $note->getResume();
        $this->em->remove($note);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Note supprimée : {$resume}",
        ]);
    }

    // =====================
    // MÉTHODES PRIVÉES
    // =====================

    private function getEnseignantConnecte(): ?Enseignant
    {
        return $this->em->getRepository(Enseignant::class)->findOneBy([
            'user' => $this->getUser(),
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serialize(Note $n): array
    {
        return [
            'id'              => $n->getId(),
            'noteCc'          => $n->getNoteCc(),
            'noteExamen'      => $n->getNoteExamen(),
            'noteFinale'      => $n->getNoteFinale(),
            'mention'         => $n->getMention(),
            'isAbsentCc'      => $n->isAbsentCc(),
            'isAbsentExamen'  => $n->isAbsentExamen(),
            'isValidee'       => $n->isValidee(),
            'dateSaisie'      => $n->getDateSaisie()?->format('Y-m-d H:i:s'),
            'dateModification' => $n->getDateModification()?->format('Y-m-d H:i:s'),
            'etudiant'        => [
                'id'        => $n->getEtudiant()?->getId(),
                'nomComplet' => $n->getEtudiant()?->getNomComplet(),
                'matricule'  => $n->getEtudiant()?->getMatricule(),
            ],
            'matiere' => [
                'id'   => $n->getMatiere()?->getId(),
                'nom'  => $n->getMatiere()?->getNom(),
                'code' => $n->getMatiere()?->getCode(),
            ],
            'semestre' => [
                'id'  => $n->getSemestre()?->getId(),
                'nom' => $n->getSemestre()?->getNom(),
            ],
        ];
    }

    private function serializeDetail(Note $n): array
    {
        return array_merge($this->serialize($n), [
            'saisiePar'  => $n->getSaisiePar()?->getEmail(),
            'modifiePar' => $n->getModifiePar()?->getEmail(),
            'matiere'    => [
                'id'          => $n->getMatiere()?->getId(),
                'nom'         => $n->getMatiere()?->getNom(),
                'code'        => $n->getMatiere()?->getCode(),
                'noteCcPoids' => $n->getMatiere()?->getNoteCcPoids(),
                'noteExPoids' => $n->getMatiere()?->getNoteExPoids(),
                'coefficient' => $n->getMatiere()?->getCoefficient(),
            ],
            'resume' => $n->getResume(),
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