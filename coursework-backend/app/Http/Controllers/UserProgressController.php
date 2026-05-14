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

        // Проверяем, есть ли уже запись
        $progress = UserProgress::where('user_id', $user->id)
                               ->where('case_id', $caseId)
                               ->first();

        if ($progress && $progress->status === 'completed') {
            // Если уже пройдено, возвращаем результат без изменения
            return response()->json([
                'is_correct' => $progress->is_correct,
                'message' => $progress->is_correct ? 'Этот уровень уже пройден! ✓' : 'Этот уровень уже был пройден.',
                'selected_suspect_name' => $progress->selectedSuspect->name ?? 'Неизвестно',
                'already_completed' => true,
                'progress' => $progress
            ]);
        }

        // Сохраняем или обновляем прогресс
        $progress = UserProgress::updateOrCreate(
            [
                'user_id' => $user->id,
                'case_id' => $caseId,
            ],
            [
                'selected_suspect_id' => $selectedSuspectId,
                'is_correct' => $isCorrect,
                'status' => 'completed',
                'score' => $isCorrect ? 100 : 0,
                'completed_at' => now(),
            ]
        );

        return response()->json([
            'is_correct' => $isCorrect,
            'message' => $isCorrect ? 'Правильный ответ!' : 'Неправильный ответ. Попробуйте еще раз.',
            'selected_suspect_name' => $selectedSuspectName,
            'selected_suspect_id' => $selectedSuspectId,
            'correct_suspect_id' => $isCorrect ? $case->suspect_id : null,
            'progress' => $progress
        ]);
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

        // Получаем имя подозреваемого
        $suspectName = null;
        if ($progress->selected_suspect_id) {
            $suspect = Suspect::find($progress->selected_suspect_id);
            $suspectName = $suspect ? $suspect->name : null;
        }

        return response()->json([
            'progress' => $progress,
            'is_completed' => $progress->status === 'completed',
            'selected_suspect_id' => $progress->selected_suspect_id,
            'selected_suspect_name' => $suspectName,
            'is_correct' => $progress->is_correct,
            'score' => $progress->score
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
