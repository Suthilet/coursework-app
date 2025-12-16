<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Carbon\Carbon;

class AuthController extends Controller
{
    /**
     * Регистрация нового пользователя
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'login' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string|min:8',
            'b_day' => 'required|date|before:today',
            'is_admin' => 'sometimes|boolean', // опционально
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $userData = [
            'full_name' => $request->full_name,
            'login' => $request->login,
            'password_hash' => Hash::make($request->password),
            'b_day' => Carbon::parse($request->b_day)->format('Y-m-d'),

        ];

        // Добавляем is_admin только если указано и если текущий пользователь - админ
        if ($request->has('is_admin') && $request->user() && $request->user()->isAdmin()) {
            $userData['is_admin'] = $request->is_admin;
        }

        $user = User::create($userData);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'login' => $user->login,
                'b_day' => $user->b_day,
                'is_admin' => $user->is_admin, // возвращаем
                'role' => $user->is_admin ? 'admin' : 'user',
            ],
            'token' => $token,
            'message' => 'Регистрация успешна'
        ], 201);
    }

    /**
     * Авторизация пользователя
     */
public function login(Request $request)
{
    $request->validate([
        'login' => 'required|string',
        'password' => 'required|string',
    ]);

    $user = User::where('login', $request->login)->first();

    if (!$user || !Hash::check($request->password, $user->password_hash)) {
        throw ValidationException::withMessages([
            'login' => ['Неверные учетные данные'],
        ]);
    }

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'user' => [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'login' => $user->login,
            'b_day' => $user->b_day ? Carbon::parse($user->b_day)->format('Y-m-d') : null,
            'is_admin' => $user->is_admin,
            'role' => $user->is_admin ? 'admin' : 'user',
        ],
        'token' => $token,
        'message' => 'Вход выполнен успешно'
    ]);
}

public function user(Request $request)
{
    $user = $request->user();

    $bDay = $user->b_day ? Carbon::parse($user->b_day)->format('Y-m-d') : null;

    return response()->json([
        'user' => [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'login' => $user->login,
            'b_day' => $bDay,
            'is_admin' => $user->is_admin,
            'role' => $user->is_admin ? 'admin' : 'user',
        ]
    ]);
}

    /**
     * Выход пользователя
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Выход выполнен успешно'
        ]);
    }

}
