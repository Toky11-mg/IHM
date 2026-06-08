<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;

#[Route('/api/auth', name: 'api_auth_')]
class AuthController extends AbstractController
{
    public function __construct(
        private EntityManagerInterface $em,
        private UserPasswordHasherInterface $hasher,
        private ValidatorInterface $validator,
        private JWTTokenManagerInterface $jwtManager,
        private UserRepository $userRepository,
    ) {}

    #[Route('/register', name: 'register', methods: ['POST'])]
    public function register(Request $request): JsonResponse
    {
        $data = json_decode($request->getContent(), true);

        if (!$data) {
            return $this->json([
                'success' => false,
                'message' => 'Données JSON invalides.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Champs obligatoires
        foreach (['email', 'password', 'roles'] as $field) {
            if (empty($data[$field])) {
                return $this->json([
                    'success' => false,
                    'message' => "Le champ '{$field}' est obligatoire.",
                ], Response::HTTP_BAD_REQUEST);
            }
        }

        // Email déjà utilisé
        if ($this->userRepository->findOneBy(['email' => $data['email']])) {
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

        // Vérification compte bloqué (protection brute force)
        // Création User
        $user = new User();

        try {
            $user->setEmail($data['email']);
            $user->setRoles((array) $data['roles']);
        } catch (\InvalidArgumentException $e) {
            return $this->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->setPassword($this->hasher->hashPassword($user, $data['password']));

        // Validation Symfony Assert
        $errors = $this->validator->validate($user);
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

        $this->em->persist($user);
        $this->em->flush();

        $token = $this->jwtManager->create($user);

        return $this->json([
            'success' => true,
            'message' => 'Inscription réussie.',
            'token'   => $token,
            'data'    => [
                'id'    => $user->getId(),
                'email' => $user->getEmail(),
                'roles' => $user->getRoles(),
            ],
        ], Response::HTTP_CREATED);
    }

    #[Route('/me', name: 'me', methods: ['GET'])]
    public function me(): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Compte désactivé
        if (!$user->isActive()) {
            return $this->json([
                'success' => false,
                'message' => 'Compte désactivé. Contactez un administrateur.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Compte bloqué (trop de tentatives)
        if ($user->isAccountLocked()) {
            return $this->json([
                'success' => false,
                'message' => 'Compte bloqué après trop de tentatives. Contactez un administrateur.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Mise à jour lastLogin
        $user->setLastLogin(new \DateTimeImmutable());
        $this->em->flush();

        return $this->json([
            'success' => true,
            'data'    => [
                'id'        => $user->getId(),
                'email'     => $user->getEmail(),
                'roles'     => $user->getRoles(),
                'isActive'  => $user->isActive(),
                'lastLogin' => $user->getLastLogin()?->format('Y-m-d H:i:s'),
                'createdAt' => $user->getCreatedAt()?->format('Y-m-d H:i:s'),
            ],
        ]);
    }

    #[Route('/change-password', name: 'change_password', methods: ['PUT'])]
    public function changePassword(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        if (!$user) {
            return $this->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $data = json_decode($request->getContent(), true);

        if (empty($data['ancien_password']) || empty($data['nouveau_password'])) {
            return $this->json([
                'success' => false,
                'message' => 'Les champs ancien_password et nouveau_password sont obligatoires.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Vérification ancien mot de passe
        if (!$this->hasher->isPasswordValid($user, $data['ancien_password'])) {
            // Incrémenter les tentatives
            $user->incrementLoginAttempts();
            $this->em->flush();

            return $this->json([
                'success' => false,
                'message' => 'Ancien mot de passe incorrect.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        // Nouveau != ancien
        if ($data['ancien_password'] === $data['nouveau_password']) {
            return $this->json([
                'success' => false,
                'message' => 'Le nouveau mot de passe doit être différent de l\'ancien.',
            ], Response::HTTP_BAD_REQUEST);
        }

        // Validation nouveau mot de passe
        $passwordErrors = $this->validerMotDePasse($data['nouveau_password']);
        if (!empty($passwordErrors)) {
            return $this->json([
                'success' => false,
                'message' => 'Nouveau mot de passe invalide.',
                'errors'  => $passwordErrors,
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->setPassword($this->hasher->hashPassword($user, $data['nouveau_password']));
        $user->resetLoginAttempts();
        $this->em->flush();

        return $this->json([
            'success' => true,
            'message' => 'Mot de passe modifié avec succès.',
        ]);
    }

    #[Route('/logout', name: 'logout', methods: ['POST'])]
    public function logout(): JsonResponse
    {
        // JWT est stateless — invalidation gérée côté client
        return $this->json([
            'success' => true,
            'message' => 'Déconnexion réussie.',
        ]);
    }

    // =====================
    // MÉTHODES PRIVÉES
    // =====================

    private function validerMotDePasse(string $password): array
    {
        $errors = [];

        if (strlen($password) < 8) {
            $errors[] = 'Minimum 8 caractères.';
        }
        if (!preg_match('/[A-Z]/', $password)) {
            $errors[] = 'Au moins une lettre majuscule.';
        }
        if (!preg_match('/[0-9]/', $password)) {
            $errors[] = 'Au moins un chiffre.';
        }
        if (!preg_match('/[\W_]/', $password)) {
            $errors[] = 'Au moins un caractère spécial (@$!%*?&...)';
        }

        return $errors;
    }
}