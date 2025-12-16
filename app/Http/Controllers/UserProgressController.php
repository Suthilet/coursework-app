<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserProgress;
use App\Models\User;
use App\Models\Cases;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserProgressController extends Controller
{
    /**
     * Получить прогресс пользователя
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $userId = $request->input('user_id');
        $caseId = $request->input('case_id');
        $status = $request->input('status');

        // Если не указан user_id и пользователь авторизован, используем текущего пользователя
        if (!$userId && $request->user()) {
            $userId = $request->user()->id;
        }

        $query = UserProgress::with([
            'user:id,full_name,login',
            'case:id,title,difficulty'
        ]);

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($caseId) {
            $query->where('case_id', $caseId);
        }

        if ($status) {
            $query->where('status', $status);
        }

        $progress = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json([
            'progress' => $progress->items(),
            'pagination' => [
                'current_page' => $progress->currentPage(),
                'total_pages' => $progress->lastPage(),
                'total_items' => $progress->total(),
                'per_page' => $progress->perPage(),
            ]
        ]);
    }

    /**
     * Получить прогресс по ID
     */
    public function show($id)
    {
        $progress = UserProgress::with([
            'user:id,full_name,login',
            'case:id,title,difficulty,description'
        ])->find($id);

        if (!$progress) {
            return response()->json([
                'message' => 'Запись прогресса не найдена'
            ], 404);
        }

        return response()->json([
            'progress' => $progress
        ]);
    }

    /**
     * Создать или обновить прогресс
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'user_id' => 'sometimes|exists:users,id',
            'case_id' => 'required|exists:cases,id',
            'status' => 'required|string|in:started,in_progress,completed,failed',
            'score' => 'sometimes|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Если user_id не указан, используем текущего пользователя
        $userId = $request->input('user_id');
        if (!$userId && $request->user()) {
            $userId = $request->user()->id;
        } elseif (!$userId) {
            return response()->json([
                'message' => 'Необходимо указать user_id или войти в систему'
            ], 422);
        }

        // Проверяем, существует ли уже запись
        $existingProgress = UserProgress::where('user_id', $userId)
                                       ->where('case_id', $request->case_id)
                                       ->first();

        if ($existingProgress) {
            // Обновляем существующую запись
            $existingProgress->update($request->only(['status', 'score']));
            $progress = $existingProgress->fresh();
            $message = 'Прогресс успешно обновлен';
        } else {
            // Создаем новую запись
            $data = $request->all();
            $data['user_id'] = $userId;
            $progress = UserProgress::create($data);
            $message = 'Прогресс успешно создан';
        }

        return response()->json([
            'message' => $message,
            'progress' => $progress->load(['user:id,full_name', 'case:id,title'])
        ], 201);
    }

    /**
     * Обновить прогресс
     */
    public function update(Request $request, $id)
    {
        $progress = UserProgress::find($id);

        if (!$progress) {
            return response()->json([
                'message' => 'Запись прогресса не найдена'
            ], 404);
        }

        // Проверяем права: пользователь может обновлять только свой прогресс
        if ($request->user() && $progress->user_id !== $request->user()->id && !$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Вы можете обновлять только свой прогресс'
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'status' => 'sometimes|string|in:started,in_progress,completed,failed',
            'score' => 'sometimes|integer|min:0|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $progress->update($request->all());

        return response()->json([
            'message' => 'Прогресс успешно обновлен',
            'progress' => $progress->fresh(['user:id,full_name', 'case:id,title'])
        ]);
    }

    /**
     * Удалить прогресс
     */
    public function destroy($id)
    {
        $progress = UserProgress::find($id);

        if (!$progress) {
            return response()->json([
                'message' => 'Запись прогресса не найдена'
            ], 404);
        }

        $progress->delete();

        return response()->json([
            'message' => 'Прогресс успешно удален'
        ]);
    }

    /**
     * Получить прогресс текущего пользователя
     */
    public function myProgress(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Требуется авторизация'
            ], 401);
        }

        $progress = UserProgress::with(['case:id,title,difficulty'])
                               ->where('user_id', $user->id)
                               ->orderBy('updated_at', 'desc')
                               ->get();

        // Статистика
        $totalCases = Cases::count();
        $completedCases = $progress->where('status', 'completed')->count();
        $inProgressCases = $progress->where('status', 'in_progress')->count();
        $averageScore = $progress->where('status', 'completed')->avg('score');

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'login' => $user->login,
            ],
            'progress' => $progress,
            'stats' => [
                'total_cases' => $totalCases,
                'completed_cases' => $completedCases,
                'in_progress_cases' => $inProgressCases,
                'completion_rate' => $totalCases > 0 ? round(($completedCases / $totalCases) * 100, 2) : 0,
                'average_score' => round($averageScore ?? 0, 2),
            ]
        ]);
    }

    /**
     * Начать дело
     */
    public function startCase(Request $request, $caseId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Требуется авторизация'
            ], 401);
        }

        $case = Cases::find($caseId);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        // Проверяем, есть ли уже прогресс
        $progress = UserProgress::where('user_id', $user->id)
                               ->where('case_id', $caseId)
                               ->first();

        if ($progress) {
            // Обновляем статус на "начато"
            $progress->update([
                'status' => 'started',
                'score' => 0,
            ]);
            $message = 'Дело уже было начато ранее, статус обновлен';
        } else {
            // Создаем новую запись
            $progress = UserProgress::create([
                'user_id' => $user->id,
                'case_id' => $caseId,
                'status' => 'started',
                'score' => 0,
            ]);
            $message = 'Дело успешно начато';
        }

        return response()->json([
            'message' => $message,
            'progress' => $progress,
            'case' => [
                'id' => $case->id,
                'title' => $case->title,
                'difficulty' => $case->difficulty,
            ]
        ]);
    }

    /**
     * Завершить дело
     */
    public function completeCase(Request $request, $caseId)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Требуется авторизация'
            ], 401);
        }

        $case = Cases::find($caseId);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        $progress = UserProgress::where('user_id', $user->id)
                               ->where('case_id', $caseId)
                               ->first();

        if (!$progress) {
            return response()->json([
                'message' => 'Дело еще не было начато'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'score' => 'required|integer|min:0|max:100',
            'is_correct' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $progress->update([
            'status' => 'completed',
            'score' => $request->score,
        ]);

        return response()->json([
            'message' => 'Дело успешно завершено!',
            'progress' => $progress->fresh(),
            'case' => [
                'id' => $case->id,
                'title' => $case->title,
                'difficulty' => $case->difficulty,
            ],
            'results' => [
                'score' => $request->score,
            ]
        ]);
    }

    /**
     * Получить лидерборд (топ пользователей)
     */
    public function leaderboard(Request $request)
    {
        $limit = $request->input('limit', 10);
        $timeframe = $request->input('timeframe', 'all'); // today, week, month, all

        $query = UserProgress::selectRaw('
                user_id,
                COUNT(*) as total_cases,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_cases,
                AVG(CASE WHEN status = "completed" THEN score ELSE NULL END) as avg_score,
                MAX(updated_at) as last_activity
            ')
            ->with(['user:id,full_name,login'])
            ->groupBy('user_id')
            ->having('completed_cases', '>', 0);

        // Фильтрация по времени
        if ($timeframe === 'today') {
            $query->whereDate('updated_at', today());
        } elseif ($timeframe === 'week') {
            $query->where('updated_at', '>=', now()->subWeek());
        } elseif ($timeframe === 'month') {
            $query->where('updated_at', '>=', now()->subMonth());
        }

        $leaderboard = $query->orderByDesc('avg_score')
                            ->orderByDesc('completed_cases')
                            ->limit($limit)
                            ->get();

        // Добавляем позицию
        $position = 1;
        foreach ($leaderboard as $item) {
            $item->position = $position++;
        }

        return response()->json([
            'leaderboard' => $leaderboard,
            'timeframe' => $timeframe,
            'total_players' => UserProgress::distinct('user_id')->count('user_id'),
        ]);
    }

    /**
     * Получить статистику прогресса
     */
    public function stats(Request $request)
    {
        $userId = $request->input('user_id');

        if (!$userId && $request->user()) {
            $userId = $request->user()->id;
        }

        if (!$userId) {
            return response()->json([
                'message' => 'Необходимо указать user_id или войти в систему'
            ], 422);
        }

        $user = User::find($userId);

        if (!$user) {
            return response()->json([
                'message' => 'Пользователь не найден'
            ], 404);
        }

        $stats = UserProgress::selectRaw('
                COUNT(*) as total_attempts,
                SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed_cases,
                SUM(CASE WHEN status = "in_progress" THEN 1 ELSE 0 END) as in_progress_cases,
                AVG(CASE WHEN status = "completed" THEN score ELSE NULL END) as average_score,
                MIN(created_at) as first_attempt,
                MAX(updated_at) as last_attempt
            ')
            ->where('user_id', $userId)
            ->first();

        // Прогресс по сложности
        $difficultyStats = UserProgress::join('cases', 'user_progress.case_id', '=', 'cases.id')
            ->selectRaw('
                cases.difficulty,
                COUNT(*) as total,
                AVG(user_progress.score) as avg_score,
                SUM(CASE WHEN user_progress.status = "completed" THEN 1 ELSE 0 END) as completed
            ')
            ->where('user_progress.user_id', $userId)
            ->groupBy('cases.difficulty')
            ->orderBy('cases.difficulty')
            ->get();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'full_name' => $user->full_name,
                'login' => $user->login,
            ],
            'stats' => $stats,
            'difficulty_stats' => $difficultyStats,
        ]);
    }
}
