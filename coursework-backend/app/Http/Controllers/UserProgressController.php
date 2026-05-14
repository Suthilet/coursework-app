<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\UserProgress;
use App\Models\User;
use App\Models\Cases;
use App\Models\Suspect;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class UserProgressController extends Controller
{
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
            // Если дело уже пройдено, не меняем статус
            if ($progress->status !== 'completed') {
                $progress->update([
                    'status' => 'in_progress',
                ]);
            }
            $message = 'Дело уже было начато ранее';
        } else {
            // Создаем новую запись
            $progress = UserProgress::create([
                'user_id' => $user->id,
                'case_id' => $caseId,
                'status' => 'in_progress',
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
     * Проверить ответ и завершить дело
     */
public function checkAnswer(Request $request, $caseId)
{
    $validator = Validator::make($request->all(), [
        'suspect_id' => 'required|exists:suspects,id',
    ]);

    if ($validator->fails()) {
        return response()->json([
            'errors' => $validator->errors()
        ], 422);
    }

    $user = $request->user();
    $case = Cases::find($caseId);

    if (!$case) {
        return response()->json([
            'message' => 'Дело не найдено'
        ], 404);
    }

    $selectedSuspectId = $request->suspect_id;
    $isCorrect = $case->suspect_id == $selectedSuspectId;

    // Получаем имя выбранного подозреваемого
    $selectedSuspect = Suspect::find($selectedSuspectId);
    $selectedSuspectName = $selectedSuspect ? $selectedSuspect->name : 'Неизвестно';

    // ПРОВЕРЯЕМ, НЕ ПРОЙДЕН ЛИ УЖЕ УРОВЕНЬ
    $existingProgress = UserProgress::where('user_id', $user->id)
                                   ->where('case_id', $caseId)
                                   ->first();

    // Если уровень уже пройден, возвращаем результат без изменения
    if ($existingProgress && $existingProgress->status === 'completed') {
        return response()->json([
            'is_correct' => true,
            'message' => 'Этот уровень уже пройден!',
            'selected_suspect_name' => $existingProgress->selectedSuspect->name ?? 'Неизвестно',
            'already_completed' => true,
            'progress' => $existingProgress
        ]);
    }

    // СОХРАНЯЕМ ПРОГРЕСС ТОЛЬКО ЕСЛИ ОТВЕТ ПРАВИЛЬНЫЙ
    if ($isCorrect) {
        // Обновляем или создаем запись с статусом completed
        $progress = UserProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'case_id' => $caseId,
            ],
            [
                'selected_suspect_id' => $selectedSuspectId,
                'is_correct' => true,
                'status' => 'completed',
                'score' => 100,
                'completed_at' => now(),
            ]
        );

        return response()->json([
            'is_correct' => true,
            'message' => 'Правильный ответ! Уровень пройден!',
            'selected_suspect_name' => $selectedSuspectName,
            'selected_suspect_id' => $selectedSuspectId,
            'correct_suspect_id' => $case->suspect_id,
            'progress' => $progress
        ]);
    } else {
        // ПРИ НЕПРАВИЛЬНОМ ОТВЕТЕ - НЕ СОХРАНЯЕМ КАК ПРОЙДЕННЫЙ
        // Можно сохранить как попытку, НО НЕ КАК COMPLETED
        // Или вообще не сохранять

        // Вариант 1: Не сохранять ничего (просто вернуть ошибку)
        // return response()->json([
        //     'is_correct' => false,
        //     'message' => 'Неправильный ответ. Попробуйте еще раз.',
        //     'selected_suspect_name' => $selectedSuspectName,
        // ]);

        // Вариант 2: Сохранить как попытку, но НЕ КАК ПРОЙДЕННЫЙ
        UserProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'case_id' => $caseId,
            ],
            [
                'selected_suspect_id' => $selectedSuspectId,
                'is_correct' => false,
                'status' => 'in_progress', // ВАЖНО: НЕ completed!
                'score' => 0,
                'completed_at' => null, // НЕ заполняем дату завершения
            ]
        );

        return response()->json([
            'is_correct' => false,
            'message' => 'Неправильный ответ. Попробуйте еще раз.',
            'selected_suspect_name' => $selectedSuspectName,
            'selected_suspect_id' => $selectedSuspectId,
        ]);
    }
}

    /**
     * Получить прогресс по конкретному делу
     */
public function getCaseProgress(Request $request, $caseId)
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'message' => 'Требуется авторизация'
        ], 401);
    }

    $progress = UserProgress::where('user_id', $user->id)
                           ->where('case_id', $caseId)
                           ->first();

    if (!$progress) {
        return response()->json([
            'progress' => null,
            'is_completed' => false,
            'selected_suspect_id' => null,
            'selected_suspect_name' => null,
            'is_correct' => false,
            'score' => 0
        ]);
    }

    // ВАЖНО: проверяем статус, а не is_correct!
    $isCompleted = $progress->status === 'completed';

    // Получаем имя подозреваемого только если есть выбранный и уровень пройден
    $suspectName = null;
    if ($isCompleted && $progress->selected_suspect_id) {
        $suspect = Suspect::find($progress->selected_suspect_id);
        $suspectName = $suspect ? $suspect->name : null;
    }

    return response()->json([
        'progress' => $progress,
        'is_completed' => $isCompleted,  // ТОЛЬКО если status === 'completed'
        'selected_suspect_id' => $isCompleted ? $progress->selected_suspect_id : null,
        'selected_suspect_name' => $suspectName,
        'is_correct' => $isCompleted ? $progress->is_correct : false,
        'score' => $isCompleted ? $progress->score : 0
    ]);
}


    public function resetProgress(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'message' => 'Требуется авторизация'
        ], 401);
    }

    // Удаляем все записи прогресса пользователя
    UserProgress::where('user_id', $user->id)->delete();

    return response()->json([
        'success' => true,
        'message' => 'Прогресс успешно сброшен'
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
}
