<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

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
        'password' => 'required|string|min:8|confirmed', // поле password в запросе
        'password_confirmation' => 'required|string|min:8', // подтверждение
        'b_day' => 'required|date|before:today',
    ], [
        'password.confirmed' => 'Пароли не совпадают',
        'b_day.date' => 'Некорректный формат даты. Используйте ГГГГ-ММ-ДД',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors()
        ], 422);
    }

    $user = User::create([
        'full_name' => $request->full_name,
        'login' => $request->login,
        'password_hash' => Hash::make($request->password), // сохраняем как password_hash
        'b_day' => $request->b_day,
    ]);

    $token = $user->createToken('auth_token')->plainTextToken;

    return response()->json([
        'user' => [
            'id' => $user->id,
            'full_name' => $user->full_name,
            'login' => $user->login,
            'b_day' => $user->b_day,
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

    // Используем password_hash для проверки
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
            'b_day' => $user->b_day
        ],
        'token' => $token,
        'message' => 'Вход выполнен успешно'
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

    /**
     * Получение данных текущего пользователя
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'full_name' => $request->user()->full_name,
                'login' => $request->user()->login,
                'b_day' => $request->user()->b_day,
            ]
        ]);
    }
}
