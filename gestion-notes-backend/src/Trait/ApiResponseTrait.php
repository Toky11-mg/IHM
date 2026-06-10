<?php

namespace App\Trait;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;

trait ApiResponseTrait
{
    private function success(
        mixed $data = null,
        string $message = 'Succès.',
        int $status = Response::HTTP_OK,
        int $total = 0
    ): JsonResponse {
        return new JsonResponse([
            'success' => true,
            'message' => $message,
            'data'    => $data,
            'total'   => $total ?: (is_array($data) ? count($data) : 0),
            'errors'  => null,
        ], $status);
    }

    private function error(
        string $message,
        int $status = Response::HTTP_BAD_REQUEST,
        array $errors = []
    ): JsonResponse {
        return new JsonResponse([
            'success' => false,
            'message' => $message,
            'data'    => null,
            'total'   => 0,
            'errors'  => empty($errors) ? null : $errors,
        ], $status);
    }

    private function created(
        mixed $data,
        string $message = 'Créé avec succès.'
    ): JsonResponse {
        return $this->success($data, $message, Response::HTTP_CREATED);
    }

    private function notFound(
        string $message = 'Ressource non trouvée.'
    ): JsonResponse {
        return $this->error($message, Response::HTTP_NOT_FOUND);
    }

    private function forbidden(
        string $message = 'Accès refusé.'
    ): JsonResponse {
        return $this->error($message, Response::HTTP_FORBIDDEN);
    }

    private function conflict(
        string $message
    ): JsonResponse {
        return $this->error($message, Response::HTTP_CONFLICT);
    }

    private function validationError(array $errors): JsonResponse
    {
        return new JsonResponse([
            'success' => false,
            'message' => 'Données invalides.',
            'data'    => null,
            'total'   => 0,
            'errors'  => $errors,
        ], Response::HTTP_UNPROCESSABLE_ENTITY);
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