<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Carbon\Carbon;

class UserController extends Controller
{
    /**
     * Получить список всех пользователей (с пагинацией)
     */
    public function index(Request $request)
    {
        // Пагинация - по 10 пользователей на страницу
        $users = User::query()
            ->select(['id', 'full_name', 'login', 'b_day', 'created_at', 'updated_at'])
            ->orderBy('created_at', 'desc')
            ->paginate(10);

        return response()->json([
            'users' => $users->items(),
            'pagination' => [
                'current_page' => $users->currentPage(),
                'total_pages' => $users->lastPage(),
                'total_items' => $users->total(),
                'per_page' => $users->perPage(),
            ]
        ]);
    }

    /**
     * Получить информацию о конкретном пользователе
     */
    public function show($id)
    {
        $user = User::select(['id', 'full_name', 'login', 'b_day', 'created_at', 'updated_at'])
                    ->find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Пользователь не найден'
            ], 404);
        }

        return response()->json([
            'user' => $user
        ]);
    }

    /**
     * Создать нового пользователя (административная функция)
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:255',
            'login' => 'required|string|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'password_confirmation' => 'required|string|min:8',
            'b_day' => 'required|date|before:today',
        ], [
            'login.unique' => 'Этот логин уже занят',
            'password.confirmed' => 'Пароли не совпадают',
            'b_day.date' => 'Некорректный формат даты. Используйте ГГГГ-ММ-ДД',
            'b_day.before' => 'Дата рождения должна быть в прошлом',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Преобразуем дату к нужному формату
        $bDay = Carbon::parse($request->b_day)->format('Y-m-d');

        $user = User::create([
            'full_name' => $request->full_name,
            'login' => $request->login,
            'password_hash' => Hash::make($request->password),
            'b_day' => $bDay,
        ]);

        return response()->json([
            'message' => 'Пользователь успешно создан',
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'login' => $user->login,
                'b_day' => $user->b_day,
            ]
        ], 201);
    }

    /**
     * Обновить информацию о пользователе
     */
    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Пользователь не найден'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|string|max:255',
            'login' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'password' => 'sometimes|string|min:8|confirmed',
            'password_confirmation' => 'required_with:password|string|min:8',
            'b_day' => 'sometimes|date|before:today',
        ], [
            'login.unique' => 'Этот логин уже занят',
            'password.confirmed' => 'Пароли не совпадают',
            'b_day.date' => 'Некорректный формат даты. Используйте ГГГГ-ММ-ДД',
            'b_day.before' => 'Дата рождения должна быть в прошлом',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Подготавливаем данные для обновления
        $data = [];

        if ($request->has('full_name')) {
            $data['full_name'] = $request->full_name;
        }

        if ($request->has('login')) {
            $data['login'] = $request->login;
        }

        if ($request->has('password')) {
            $data['password_hash'] = Hash::make($request->password);
        }

        if ($request->has('b_day')) {
            $data['b_day'] = Carbon::parse($request->b_day)->format('Y-m-d');
        }

        // Обновляем пользователя
        $user->update($data);

        return response()->json([
            'message' => 'Пользователь успешно обновлен',
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'login' => $user->login,
                'b_day' => $user->b_day,
            ]
        ]);
    }

    /**
     * Удалить пользователя
     */
    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Пользователь не найден'
            ], 404);
        }

        // В реальном приложении здесь может быть дополнительная логика
        // (например, проверка что удаляющий имеет права)

        $user->delete();

        return response()->json([
            'message' => 'Пользователь успешно удален'
        ]);
    }

    /**
     * Поиск пользователей по имени или логину
     */
    public function search(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'query' => 'required|string|min:2',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $query = $request->input('query');

        $users = User::where('full_name', 'like', "%{$query}%")
                    ->orWhere('login', 'like', "%{$query}%")
                    ->select(['id', 'full_name', 'login', 'b_day', 'created_at'])
                    ->orderBy('full_name')
                    ->limit(20)
                    ->get();

        return response()->json([
            'users' => $users,
            'count' => $users->count()
        ]);
    }

    /**
     * Получить статистику пользователей
     */
    public function stats()
    {
        $totalUsers = User::count();
        $todayUsers = User::whereDate('created_at', today())->count();
        $thisMonthUsers = User::whereMonth('created_at', now()->month)
                            ->whereYear('created_at', now()->year)
                            ->count();

        // Статистика по годам рождения (пример)
        $birthYearStats = User::selectRaw('YEAR(b_day) as birth_year, COUNT(*) as count')
                            ->whereNotNull('b_day')
                            ->groupBy('birth_year')
                            ->orderBy('birth_year')
                            ->get();

        return response()->json([
            'stats' => [
                'total_users' => $totalUsers,
                'new_today' => $todayUsers,
                'new_this_month' => $thisMonthUsers,
                'birth_year_distribution' => $birthYearStats,
            ]
        ]);
    }

    /**
     * Обновить профиль текущего пользователя
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|string|max:255',
            'login' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('users')->ignore($user->id)
            ],
            'current_password' => 'required_with:password',
            'password' => 'sometimes|string|min:8|confirmed',
            'password_confirmation' => 'required_with:password|string|min:8',
            'b_day' => 'sometimes|date|before:today',
        ], [
            'login.unique' => 'Этот логин уже занят',
            'password.confirmed' => 'Пароли не совпадают',
            'b_day.date' => 'Некорректный формат даты. Используйте ГГГГ-ММ-ДД',
            'b_day.before' => 'Дата рождения должна быть в прошлом',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Проверка текущего пароля при смене пароля
        if ($request->has('password')) {
            if (!$request->has('current_password') ||
                !Hash::check($request->current_password, $user->password_hash)) {
                return response()->json([
                    'errors' => [
                        'current_password' => ['Текущий пароль неверен']
                    ]
                ], 422);
            }
        }

        // Подготавливаем данные для обновления
        $data = [];

        if ($request->has('full_name')) {
            $data['full_name'] = $request->full_name;
        }

        if ($request->has('login')) {
            $data['login'] = $request->login;
        }

        if ($request->has('password')) {
            $data['password_hash'] = Hash::make($request->password);
        }

        if ($request->has('b_day')) {
            $data['b_day'] = Carbon::parse($request->b_day)->format('Y-m-d');
        }

        // Обновляем пользователя
        $user->update($data);

        return response()->json([
            'message' => 'Профиль успешно обновлен',
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'login' => $user->login,
                'b_day' => $user->b_day,
            ]
        ]);
    }

    /**
     * Получить прогресс пользователя (связанная модель UserProgress)
     */
    public function getUserProgress($id)
    {
        $user = User::with('progress')->find($id);

        if (!$user) {
            return response()->json([
                'message' => 'Пользователь не найден'
            ], 404);
        }

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'login' => $user->login,
            ],
            'progress' => $user->progress
        ]);
    }
}
