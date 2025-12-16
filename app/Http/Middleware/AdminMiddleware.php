<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Проверяем, авторизован ли пользователь
        if (!$request->user()) {
            return response()->json([
                'message' => 'Требуется авторизация'
            ], 401);
        }

        // Проверяем, является ли пользователь администратором
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Доступ запрещен. Требуются права администратора.'
            ], 403);
        }

        return $next($request);
    }
}
