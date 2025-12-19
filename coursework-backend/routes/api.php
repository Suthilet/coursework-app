<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\CasesController;
use App\Http\Controllers\SuspectController;
use App\Http\Controllers\EvidenceController;
use App\Http\Controllers\UserProgressController;


// Публичные маршруты (не требуют аутентификации)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Маршруты для дел (cases) - частично публичные
Route::prefix('cases')->group(function () {
    Route::get('/', [CasesController::class, 'index']);
    Route::get('/minimal', [CasesController::class, 'getAllMinimal']);
    Route::get('/difficulty/{difficulty}', [CasesController::class, 'getByDifficulty']);
    Route::get('/random', [CasesController::class, 'getRandomCase']);
    Route::get('/{id}', [CasesController::class, 'show']);
    Route::get('/{id}/stats', [CasesController::class, 'getCaseStats']);
    Route::get('/{id}/suspects', [CasesController::class, 'getCaseSuspects']);
    Route::get('/{id}/evidences', [CasesController::class, 'getCaseEvidences']);

    // Игровые операции (требуют аутентификации)
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/{id}/check-answer', [CasesController::class, 'checkAnswer']);
        Route::post('/{id}/query', [CasesController::class, 'executeQuery']); // Добавьте этот
    });
});

// Маршруты для подозреваемых (suspects) - частично публичные
Route::prefix('suspects')->group(function () {
    Route::get('/', [SuspectController::class, 'index']);
    Route::get('/search', [SuspectController::class, 'search']);
    Route::get('/stats', [SuspectController::class, 'stats']);
    Route::get('/case/{caseId}', [SuspectController::class, 'getByCase']);
    Route::get('/{id}', [SuspectController::class, 'show']);
});

// Маршруты для доказательств (evidence) - частично публичные
Route::prefix('evidence')->group(function () {
    Route::get('/', [EvidenceController::class, 'index']);
    Route::get('/types', [EvidenceController::class, 'getTypes']);
    Route::get('/case/{caseId}', [EvidenceController::class, 'getByCase']);
    Route::get('/{id}', [EvidenceController::class, 'show']);
    Route::get('/{id}/download', [EvidenceController::class, 'downloadFile']);
});

// Маршруты для прогресса (progress) - частично публичные
Route::prefix('progress')->group(function () {
    Route::get('/', [UserProgressController::class, 'index']);

    Route::get('/leaderboard', [UserProgressController::class, 'leaderboard']);
    Route::get('/stats', [UserProgressController::class, 'stats']);
    Route::get('/{id}', [UserProgressController::class, 'show']);
});

// Защищенные маршруты (требуют аутентификации)
Route::middleware('auth:sanctum')->group(function () {
    // Аутентификация
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
    });

    // Прогресс пользователя (личные операции)
    Route::prefix('progress')->group(function () {
        Route::post('/', [UserProgressController::class, 'store']);
        Route::put('/{id}', [UserProgressController::class, 'update']);
        Route::delete('/{id}', [UserProgressController::class, 'destroy']);

        // Личный прогресс
        Route::get('/my/progress', [UserProgressController::class, 'myProgress']);
        Route::post('/case/{caseId}/start', [UserProgressController::class, 'startCase']);
        Route::post('/case/{caseId}/complete', [UserProgressController::class, 'completeCase']);
    });

    // Дела (игровые операции)
    Route::prefix('cases')->group(function () {
        Route::post('/{id}/check-answer', [CasesController::class, 'checkAnswer']);
    });
});

// Маршруты для администраторов (требуют права администратора)
Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    // Админские маршруты для пользователей
    Route::prefix('admin')->group(function () {
        // Пользователи
        Route::apiResource('users', UserController::class)->except(['create', 'edit']);
        Route::get('/users/search/{query}', [UserController::class, 'search']);
        Route::get('/users/stats', [UserController::class, 'stats']);
        Route::get('/users/{id}/progress', [UserController::class, 'getUserProgress']);

        // Дела
        Route::apiResource('cases', CasesController::class)->except(['create', 'edit']);
        Route::get('/cases/{id}/with-answer', [CasesController::class, 'showWithAnswer']);

        // Подозреваемые
        Route::apiResource('suspects', SuspectController::class)->except(['create', 'edit']);

        // Доказательства
        Route::apiResource('evidence', EvidenceController::class)->except(['create', 'edit']);
        Route::post('/evidence/{id}/upload', [EvidenceController::class, 'uploadFile']);

        // Прогресс всех пользователей
        Route::apiResource('progress', UserProgressController::class)->except(['create', 'edit']);

        // Статистика и аналитика
        Route::get('/dashboard/stats', function () {
            $totalUsers = \App\Models\User::count();
            $totalAdmins = \App\Models\User::where('is_admin', true)->count();
            $totalCases = \App\Models\Cases::count();
            $totalSuspects = \App\Models\Suspect::count();
            $totalEvidence = \App\Models\Evidence::count();
            $totalProgress = \App\Models\UserProgress::count();

            return response()->json([
                'stats' => [
                    'users' => [
                        'total' => $totalUsers,
                        'admins' => $totalAdmins,
                        'regular' => $totalUsers - $totalAdmins,
                    ],
                    'cases' => [
                        'total' => $totalCases,
                        'by_difficulty' => \App\Models\Cases::select('difficulty', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                            ->groupBy('difficulty')
                            ->get(),
                    ],
                    'suspects' => [
                        'total' => $totalSuspects,
                        'by_case' => \App\Models\Suspect::select('case_id', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                            ->groupBy('case_id')
                            ->with(['case:id,title'])
                            ->get(),
                    ],
                    'evidence' => [
                        'total' => $totalEvidence,
                        'by_type' => \App\Models\Evidence::select('type', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                            ->groupBy('type')
                            ->get(),
                    ],
                    'progress' => [
                        'total_attempts' => $totalProgress,
                        'by_status' => \App\Models\UserProgress::select('status', \Illuminate\Support\Facades\DB::raw('count(*) as count'))
                            ->groupBy('status')
                            ->get(),
                    ]
                ]
            ]);
        });
    });
});

// Обновление профиля текущего пользователя (доступно всем авторизованным)
Route::middleware('auth:sanctum')->group(function () {
    Route::put('/profile', [UserController::class, 'updateProfile']);
});

// Тестовый маршрут (можно удалить)
Route::get('/test', function () {
    return response()->json([
        'message' => 'API работает!',
        'timestamp' => now()->toDateTimeString(),
        'version' => '1.0.0'
    ]);
});
