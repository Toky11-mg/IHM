<?php

namespace App\Controller;

use App\Entity\Enseignant;
use App\Entity\User;
use App\Repository\EnseignantRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Symfony\Component\Security\Http\Attribute\IsGranted;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

#[Route('/api/enseignants', name: 'api_enseignants_')]
class EnseignantController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private EnseignantRepository $repo,
        private ValidatorInterface $validator,
        private UserPasswordHasherInterface $hasher,
    ) {}

    // =====================
    // GET /api/enseignants
    // =====================
    #[Route('', name: 'list', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function list(Request $request): JsonResponse
    {
        $statut = $request->query->get('statut');
        $criteria = $statut ? ['statut' => $statut] : [];
        $enseignants = $this->repo->findBy($criteria, ['nom' => 'ASC']);

        return $this->json([
            'success' => true,
            'total'   => count($enseignants),
            'data'    => array_map(fn(Enseignant $e) => $this->serialize($e), $enseignants),
        ]);
    }

    // =====================
    // GET /api/enseignants/me
    // =====================
    #[Route('/me', name: 'me', methods: ['GET'])]
    #[IsGranted('ROLE_ENSEIGNANT')]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $enseignant = $this->repo->findOneBy(['user' => $user]);

        if (!$enseignant) {
            return $this->json([
                'success' => false,
                'message' => 'Profil enseignant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($enseignant),
        ]);
    }

    // =====================
    // GET /api/enseignants/{id}
    // =====================
    #[Route('/{id}', name: 'show', methods: ['GET'])]
    #[IsGranted('ROLE_ADMIN')]
    public function show(int $id): JsonResponse
    {
        $enseignant = $this->repo->find($id);

        if (!$enseignant) {
            return $this->json([
                'success' => false,
                'message' => 'Enseignant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'success' => true,
            'data'    => $this->serializeDetail($enseignant),
        ]);
    }

    // =====================
    // POST /api/enseignants
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
        foreach (['nom', 'prenom', 'grade', 'specialite', 'dateEmbauche', 'email', 'password'] as $field) {
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

        // Générer matricule automatique — ENS-YYYY-XXXXX
        $matricule = $this->genererMatricule();

        // Créer User
        $user = new User();
        $user->setEmail($data['email']);
        $user->setRoles(['ROLE_ENSEIGNANT']);
        $user->setPassword($this->hasher->hashPassword($user, $data['password']));

        // Créer Enseignant
        $enseignant = new Enseignant();
        $enseignant->setUser($user);

        try {
            $enseignant->setNom($data['nom']);
            $enseignant->setPrenom($data['prenom']);
            $enseignant->setMatricule($matricule);
            $enseignant->setGrade($data['grade']);
            $enseignant->setSpecialite($data['specialite']);
            $enseignant->setDateEmbauche(new \DateTime($data['dateEmbauche']));
            $enseignant->setStatut('actif');

            if (!empty($data['telephone'])) {
                $enseignant->setTelephone($data['telephone']);
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

        // Validation Enseignant
        $errors = $this->validator->validate($enseignant);
        if (count($errors) > 0) {
            return $this->json([
                'success' => false,
                'message' => 'Données enseignant invalides.',
                'errors'  => $this->formatErrors($errors),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $this->em->persist($user);
        $this->em->persist($enseignant);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Enseignant créé avec succès.',
            'data'    => $this->serializeDetail($enseignant),
        ], Response::HTTP_CREATED);
    }

    // =====================
    // PUT /api/enseignants/{id}
    // =====================
    #[Route('/{id}', name: 'update', methods: ['PUT'])]
    #[IsGranted('ROLE_ADMIN')]
    public function update(int $id, Request $request): JsonResponse
    {
        $enseignant = $this->repo->find($id);

        if (!$enseignant) {
            return $this->json([
                'success' => false,
                'message' => 'Enseignant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        try {
            if (isset($data['nom']))        $enseignant->setNom($data['nom']);
            if (isset($data['prenom']))     $enseignant->setPrenom($data['prenom']);
            if (isset($data['grade']))      $enseignant->setGrade($data['grade']);
            if (isset($data['specialite'])) $enseignant->setSpecialite($data['specialite']);
            if (isset($data['telephone']))  $enseignant->setTelephone($data['telephone']);
            if (isset($data['statut']))     $enseignant->setStatut($data['statut']);
            if (!empty($data['dateEmbauche'])) {
                $enseignant->setDateEmbauche(new \DateTime($data['dateEmbauche']));
            }
        } catch (\LogicException|\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $errors = $this->validator->validate($enseignant);
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
            'message' => 'Enseignant mis à jour avec succès.',
            'data'    => $this->serializeDetail($enseignant),
        ]);
    }

    // =====================
    // DELETE /api/enseignants/{id}
    // =====================
    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    #[IsGranted('ROLE_ADMIN')]
    public function delete(int $id): JsonResponse
    {
        $enseignant = $this->repo->find($id);

        if (!$enseignant) {
            return $this->json([
                'success' => false,
                'message' => 'Enseignant non trouvé.',
            ], Response::HTTP_NOT_FOUND);
        }

        // Blocage : matières actives
        if (!$enseignant->getMatieresActives()->isEmpty()) {
            return $this->json([
                'success' => false,
                'message' => 'Impossible de supprimer : cet enseignant a '
                    . $enseignant->getMatieresActives()->count()
                    . ' matière(s) active(s). Réassignez-les d\'abord.',
            ], Response::HTTP_CONFLICT);
        }

        // Désactivation douce — jamais de suppression physique
        try {
            $enseignant->setStatut('retraite');
        } catch (\LogicException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $enseignant->getUser()->setIsActive(false);
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => "Enseignant '{$enseignant->getNomComplet()}' désactivé avec succès.",
        ]);
    }

    // =====================
    // SÉRIALISATION
    // =====================

    private function serialize(Enseignant $e): array
    {
        return [
            'id'           => $e->getId(),
            'nomComplet'   => $e->getNomComplet(),
            'nom'          => $e->getNom(),
            'prenom'       => $e->getPrenom(),
            'matricule'    => $e->getMatricule(),
            'grade'        => $e->getGrade(),
            'specialite'   => $e->getSpecialite(),
            'telephone'    => $e->getTelephone(),
            'statut'       => $e->getStatut(),
            'isActif'      => $e->isActif(),
            'dateEmbauche' => $e->getDateEmbauche()?->format('Y-m-d'),
            'email'        => $e->getUser()?->getEmail(),
        ];
    }

    private function serializeDetail(Enseignant $e): array
    {
        return array_merge($this->serialize($e), [
            'matieres' => $e->getMatieres()->map(fn($m) => [
                'id'       => $m->getId(),
                'nom'      => $m->getNom(),
                'code'     => $m->getCode(),
                'semestre' => $m->getSemestre()?->getNom(),
                'isActive' => $m->isActive(),
            ])->toArray(),
            'filieres' => $e->getFilieres()->map(fn($f) => [
                'id'  => $f->getId(),
                'nom' => $f->getNom(),
            ])->toArray(),
            'nbMatieresActives' => $e->getMatieresActives()->count(),
        ]);
    }

    // =====================
    // MÉTHODES PRIVÉES
    // =====================

    private function genererMatricule(): string
    {
        $annee = date('Y');
        $sequence = str_pad($this->repo->count([]) + 1, 5, '0', STR_PAD_LEFT);
        $matricule = "ENS-{$annee}-{$sequence}";

        // Vérifier unicité
        while ($this->repo->findOneBy(['matricule' => $matricule])) {
            $sequence = str_pad((int)$sequence + 1, 5, '0', STR_PAD_LEFT);
            $matricule = "ENS-{$annee}-{$sequence}";
        }

        return $matricule;
    }

    private function validerMotDePasse(string $password): array
    {
        $errors = [];
        if (strlen($password) < 8) $errors[] = 'Minimum 8 caractères.';
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