<?php

namespace App\Controller;

use App\Entity\Etudiant;
use App\Entity\User;
use App\Entity\Niveau;
use App\Entity\Filiere;
use App\Repository\EtudiantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[Route('/api/etudiants', name: 'api_etudiants_')]
class EtudiantController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private EtudiantRepository $repo,
        private ValidatorInterface $validator,
        private UserPasswordHasherInterface $hasher,
    ) {}

    // =====================
    // GET /api/etudiants
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(Request $request): JsonResponse
    {
        $criteria = [];
        if ($request->query->get('niveauId'))  $criteria['niveau']  = $request->query->get('niveauId');
        if ($request->query->get('filiereId')) $criteria['filiere'] = $request->query->get('filiereId');
        if ($request->query->get('statut'))    $criteria['statut']  = $request->query->get('statut');

        $etudiants = $this->repo->findBy($criteria, ['nom' => 'ASC']);

        return $this->json([
            'success' => true,
            'total'   => count($etudiants),
            'data'    => array_map(fn(Etudiant $e) => $this->serialize($e), $etudiants),
        ]);
    }

    // =====================
    // GET /api/etudiants/me
    // =====================
    #[Route('/me', name: 'me', methods: ['GET'])]
    #[IsGranted('ROLE_ETUDIANT')]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $etudiant = $this->repo->findOneBy(['user' => $user]);

        if (!$etudiant) {
            return $this->json([
                'success' => false,
                'message' => 'Profil étudiant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($etudiant),
        ]);
    }

    // =====================
    // GET /api/etudiants/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function show(int $id): JsonResponse
    {
        $etudiant = $this->repo->find($id);

        if (!$etudiant) {
            return $this->json([
                'success' => false,
                'message' => 'Étudiant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($etudiant),
        ]);
    }

    // =====================
    // POST /api/etudiants
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
        foreach ([
            'nom', 'prenom', 'dateNaissance', 'lieuNaissance',
            'nationalite', 'genre', 'niveauId', 'filiereId',
            'email', 'password'
        ] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        // Email unique
        if ($this->em->getRepository(User::class)->findOneBy(['email' => $data['email']])) {
            return $this->json([
                'success' => false,
                'message' => 'Cet email est déjà utilisé.',
            ], Response::HTTP_CONFLICT);
        }

        // Validation mot de passe
        $passwordErrors = $this->validerMotDePasse($data['password']);
        if (!empty($passwordErrors)) {
            return $this->json([
                'success' => false,
                'message' => 'Mot de passe invalide.',
                'errors'  => $passwordErrors,
            ], Response::HTTP_BAD_REQUEST);
        }

        // Niveau
        $niveau = $this->em->getRepository(Niveau::class)->find($data['niveauId']);
        if (!$niveau) {
            return $this->json([
                'success' => false,
                'message' => 'Niveau non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Filière
        $filiere = $this->em->getRepository(Filiere::class)->find($data['filiereId']);
        if (!$filiere) {
            return $this->json([
                'success' => false,
                'message' => 'Filière non trouvée.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Vérification cohérence niveau/filière
        if ($niveau->getFiliere()?->getId() !== $filiere->getId()) {
            return $this->json([
                'success' => false,
                'message' => "Le niveau '{$niveau->getNom()}' n'appartient pas à la filière '{$filiere->getNom()}'.",
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Créer User
        $user = new User();
        $user->setEmail($data['email']);
        $user->setRoles(['ROLE_ETUDIANT']);
        $user->setPassword($this->hasher->hashPassword($user, $data['password']));

        // Générer matricule automatique sécurisé
        $matricule = $this->genererMatricule();

        // Créer Etudiant
        $etudiant = new Etudiant();
        $etudiant->setUser($user);

        try {
            $etudiant->setNom($data['nom']);
            $etudiant->setPrenom($data['prenom']);
            $etudiant->setMatricule($matricule);
            $etudiant->setDateNaissance(new \DateTime($data['dateNaissance']));
            $etudiant->setLieuNaissance($data['lieuNaissance']);
            $etudiant->setNationalite($data['nationalite']);
            $etudiant->setGenre($data['genre']);
            $etudiant->setNiveau($niveau);
            $etudiant->setFiliere($filiere);
            $etudiant->setStatut('actif');

            if (!empty($data['telephone']))  $etudiant->setTelephone($data['telephone']);
            if (!empty($data['photo']))      $etudiant->setPhoto($data['photo']);
            if (!empty($data['anneeEntree'])) {
                $etudiant->setAnneeEntree((int) $data['anneeEntree']);
            }
        } catch (\Exception $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation User
        $errorsUser = $this->validator->validate($user);
        if (count($errorsUser) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données utilisateur invalides.',
                'errors'  => $this->formatErrors($errorsUser),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        // Validation Etudiant
        $errors = $this->validator->validate($etudiant);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données étudiant invalides.',
                'errors'  => $this->formatErrors($errors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($user);
        $this->em->persist($etudiant);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Étudiant créé avec succès.',
            'data'    => $this->serializeDetail($etudiant),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/etudiants/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $etudiant = $this->repo->find($id);

        if (!$etudiant) {
            return $this->json([
                'success' => false,
                'message' => 'Étudiant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Bloquer modification si diplômé ou abandonné
        if (in_array($etudiant->getStatut(), ['diplome', 'abandonne'])) {
            return $this->json([
                'success' => false,
                'message' => "Impossible de modifier un étudiant avec le statut '{$etudiant->getStatut()}'.",
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
            if (isset($data['nom']))           $etudiant->setNom($data['nom']);
            if (isset($data['prenom']))        $etudiant->setPrenom($data['prenom']);
            if (isset($data['lieuNaissance'])) $etudiant->setLieuNaissance($data['lieuNaissance']);
            if (isset($data['nationalite']))   $etudiant->setNationalite($data['nationalite']);
            if (isset($data['telephone']))     $etudiant->setTelephone($data['telephone']);
            if (isset($data['photo']))         $etudiant->setPhoto($data['photo']);
            if (isset($data['statut']))        $etudiant->setStatut($data['statut']);

            if (!empty($data['dateNaissance'])) {
                $etudiant->setDateNaissance(new \DateTime($data['dateNaissance']));
            }

            if (!empty($data['niveauId'])) {
                $niveau = $this->em->getRepository(Niveau::class)->find($data['niveauId']);
                if (!$niveau) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Niveau non trouvé.',
                    ], Response::HTTP_NOT_FOUND);
                }
                $etudiant->setNiveau($niveau);
            }

            if (!empty($data['filiereId'])) {
                $filiere = $this->em->getRepository(Filiere::class)->find($data['filiereId']);
                if (!$filiere) {
                    return $this->json([
                        'success' => false,
                        'message' => 'Filière non trouvée.',
                    ], Response::HTTP_NOT_FOUND);
                }
                $etudiant->setFiliere($filiere);
            }
        } catch (\LogicException|\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $errors = $this->validator->validate($etudiant);
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
            'message' => 'Étudiant mis à jour avec succès.',
            'data'    => $this->serializeDetail($etudiant),
        ]);
    }

    // =====================
    // DELETE /api/etudiants/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $etudiant = $this->repo->find($id);

        if (!$etudiant) {
            return $this->json([
                'success' => false,
                'message' => 'Étudiant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Blocage : notes existantes
        if (!$etudiant->getNotes()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : cet étudiant a '
                    . $etudiant->getNotes()->count()
                    . ' note(s) enregistrée(s). Utilisez la désactivation.',
            ], Response::HTTP_CONFLICT);
        }

        // Désactivation douce — jamais de suppression physique
        try {
            $etudiant->setStatut('abandonne');
        } catch (\LogicException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $etudiant->getUser()->setIsActive(false);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Étudiant '{$etudiant->getNomComplet()}' désactivé avec succès.",
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serialize(Etudiant $e): array
    {
        return [
            'id'            => $e->getId(),
            'nomComplet'    => $e->getNomComplet(),
            'nom'           => $e->getNom(),
            'prenom'        => $e->getPrenom(),
            'matricule'     => $e->getMatricule(),
            'genre'         => $e->getGenre(),
            'dateNaissance' => $e->getDateNaissance()?->format('Y-m-d'),
            'age'           => $e->getAge(),
            'nationalite'   => $e->getNationalite(),
            'telephone'     => $e->getTelephone(),
            'photo'         => $e->getPhoto(),
            'anneeEntree'   => $e->getAnneeEntree(),
            'statut'        => $e->getStatut(),
            'email'         => $e->getUser()?->getEmail(),
            'niveau'        => [
                'id'  => $e->getNiveau()?->getId(),
                'nom' => $e->getNiveau()?->getNom(),
            ],
            'filiere' => [
                'id'  => $e->getFiliere()?->getId(),
                'nom' => $e->getFiliere()?->getNom(),
            ],
        ];
    }

    private function serializeDetail(Etudiant $e): array
    {
        return array_merge($this->serialize($e), [
            'lieuNaissance' => $e->getLieuNaissance(),
            'notes'         => $e->getNotes()->map(fn($n) => [
                'id'         => $n->getId(),
                'matiere'    => $n->getMatiere()?->getNom(),
                'code'       => $n->getMatiere()?->getCode(),
                'noteCc'     => $n->getNoteCc(),
                'noteExamen' => $n->getNoteExamen(),
                'noteFinale' => $n->getNoteFinale(),
                'mention'    => $n->getMention(),
                'isValidee'  => $n->isValidee(),
                'semestre'   => $n->getSemestre()?->getNom(),
            ])->toArray(),
            'deliberations' => $e->getDeliberations()->map(fn($d) => [
                'id'              => $d->getId(),
                'semestre'        => $d->getSemestre()?->getNom(),
                'annee'           => $d->getAnneeUniversitaire()?->getLibelle(),
                'moyenneGenerale' => $d->getMoyenneGenerale(),
                'decision'        => $d->getDecision(),
                'mentionGlobale'  => $d->getMentionGlobale(),
                'isPublie'        => $d->isPublie(),
            ])->toArray(),
            'reclamations' => $e->getReclamations()->map(fn($r) => [
                'id'      => $r->getId(),
                'statut'  => $r->getStatut(),
                'motif'   => $r->getMotif(),
                'matiere' => $r->getNote()?->getMatiere()?->getNom(),
            ])->toArray(),
            'nbNotes'       => $e->getNotes()->count(),
            'nbReclamations' => $e->getReclamations()->count(),
        ]);
    }

    // =====================
    // MÉTHODES PRIVÉES
    // =====================

    private function genererMatricule(): string
    {
        $annee = date('Y');
        $sequence = str_pad($this->repo->count([]) + 1, 5, '0', STR_PAD_LEFT);
        $matricule = "ETU-{$annee}-{$sequence}";

        // Vérifier unicité
        while ($this->repo->findOneBy(['matricule' => $matricule])) {
            $sequence = str_pad((int)$sequence + 1, 5, '0', STR_PAD_LEFT);
            $matricule = "ETU-{$annee}-{$sequence}";
        }

        return $matricule;
    }

    private function validerMotDePasse(string $password): array
    {
        $errors = [];
        if (strlen($password) < 8)           $errors[] = 'Minimum 8 caractères.';
        if (!preg_match('/[A-Z]/', $password)) $errors[] = 'Au moins une majuscule.';
        if (!preg_match('/[0-9]/', $password)) $errors[] = 'Au moins un chiffre.';
        if (!preg_match('/[\W_]/', $password)) $errors[] = 'Au moins un caractère spécial.';
        return $errors;
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