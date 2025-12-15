<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Cases;
use App\Models\Suspect;
use App\Models\Evidence;
use App\Models\CaseRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class CasesController extends Controller
{
    /**
     * Получить список всех дел с пагинацией
     */
    public function index(Request $request)
    {
        // Получаем параметры запроса
        $perPage = $request->input('per_page', 10);
        $search = $request->input('search');
        $difficulty = $request->input('difficulty');
        $sortBy = $request->input('sort_by', 'created_at');
        $sortOrder = $request->input('sort_order', 'desc');

        // Начинаем запрос
        $query = Cases::with(['correctSuspect:id,name,description', 'evidences:id,case_id,title', 'rules:id,case_id,rule_text']);

        // Поиск по названию или описанию
        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Фильтрация по сложности
        if ($difficulty) {
            $query->where('difficulty', $difficulty);
        }

        // Сортировка
        $validSortColumns = ['id', 'title', 'difficulty', 'created_at', 'updated_at'];
        $sortBy = in_array($sortBy, $validSortColumns) ? $sortBy : 'created_at';
        $sortOrder = $sortOrder === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortBy, $sortOrder);

        // Пагинация
        $cases = $query->paginate($perPage);

        return response()->json([
            'cases' => $cases->items(),
            'pagination' => [
                'current_page' => $cases->currentPage(),
                'total_pages' => $cases->lastPage(),
                'total_items' => $cases->total(),
                'per_page' => $cases->perPage(),
            ],
            'filters' => [
                'search' => $search,
                'difficulty' => $difficulty,
                'sort_by' => $sortBy,
                'sort_order' => $sortOrder,
            ]
        ]);
    }

    /**
     * Получить полную информацию о деле с связанными данными
     */
    public function show($id)
    {
        $case = Cases::with([
            'correctSuspect:id,name,description,motive,alibi,appearance',
            'evidences:id,case_id,title,description,type,is_important,found_at',
            'rules:id,case_id,rule_text,order',
            'evidences.suspects:id,name,description' // подозреваемые связанные с доказательствами
        ])->find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        // Для игрового процесса - скрываем правильного подозреваемого
        $caseData = $case->toArray();
        unset($caseData['suspect_id']); // скрываем ID правильного ответа
        unset($caseData['correct_suspect']); // скрываем правильного подозреваемого

        return response()->json([
            'case' => $caseData,
            'metadata' => [
                'total_evidences' => $case->evidences->count(),
                'total_rules' => $case->rules->count(),
                'difficulty_label' => $this->getDifficultyLabel($case->difficulty)
            ]
        ]);
    }

    /**
     * Получить дело с правильным ответом (для админа или проверки)
     */
    public function showWithAnswer($id)
    {
        $case = Cases::with([
            'correctSuspect:id,name,description,motive,alibi,appearance',
            'evidences:id,case_id,title,description,type,is_important,found_at',
            'rules:id,case_id,rule_text,order',
            'evidences.suspects:id,name,description'
        ])->find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        return response()->json([
            'case' => $case,
            'answer' => [
                'correct_suspect_id' => $case->suspect_id,
                'correct_suspect_name' => $case->correctSuspect->name ?? 'Не указан'
            ]
        ]);
    }

    /**
     * Создать новое дело
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255|unique:cases',
            'description' => 'required|string',
            'difficulty' => 'required|integer|min:1|max:5',
            'suspect_id' => 'required|exists:suspects,id',
        ], [
            'title.unique' => 'Дело с таким названием уже существует',
            'suspect_id.exists' => 'Указанный подозреваемый не существует',
            'difficulty.min' => 'Сложность должна быть от 1 до 5',
            'difficulty.max' => 'Сложность должна быть от 1 до 5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $case = Cases::create([
            'title' => $request->title,
            'description' => $request->description,
            'difficulty' => $request->difficulty,
            'suspect_id' => $request->suspect_id,
        ]);

        return response()->json([
            'message' => 'Дело успешно создано',
            'case' => $case->load('correctSuspect:id,name')
        ], 201);
    }

    /**
     * Обновить дело
     */
    public function update(Request $request, $id)
    {
        $case = Cases::find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => [
                'sometimes',
                'string',
                'max:255',
                Rule::unique('cases')->ignore($case->id)
            ],
            'description' => 'sometimes|string',
            'difficulty' => 'sometimes|integer|min:1|max:5',
            'suspect_id' => 'sometimes|exists:suspects,id',
        ], [
            'title.unique' => 'Дело с таким названием уже существует',
            'suspect_id.exists' => 'Указанный подозреваемый не существует',
            'difficulty.min' => 'Сложность должна быть от 1 до 5',
            'difficulty.max' => 'Сложность должна быть от 1 до 5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Подготавливаем данные для обновления
        $data = [];

        if ($request->has('title')) {
            $data['title'] = $request->title;
        }

        if ($request->has('description')) {
            $data['description'] = $request->description;
        }

        if ($request->has('difficulty')) {
            $data['difficulty'] = $request->difficulty;
        }

        if ($request->has('suspect_id')) {
            $data['suspect_id'] = $request->suspect_id;
        }

        $case->update($data);

        return response()->json([
            'message' => 'Дело успешно обновлено',
            'case' => $case->fresh(['correctSuspect:id,name'])
        ]);
    }

    /**
     * Удалить дело
     */
    public function destroy($id)
    {
        $case = Cases::find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        // Проверяем, есть ли связанные прогрессы пользователей
        if ($case->userProgresses()->count() > 0) {
            return response()->json([
                'message' => 'Невозможно удалить дело, так как есть связанные записи о прогрессе пользователей'
            ], 409);
        }

        // Удаляем связанные доказательства, правила
        $case->evidences()->delete();
        $case->rules()->delete();

        // Удаляем само дело
        $case->delete();

        return response()->json([
            'message' => 'Дело успешно удалено'
        ]);
    }

    /**
     * Получить случайное дело для игры
     */
    public function getRandomCase(Request $request)
    {
        $difficulty = $request->input('difficulty');
        $excludeCompleted = $request->input('exclude_completed', false);
        $userId = $request->user() ? $request->user()->id : null;

        $query = Cases::with([
            'evidences:id,case_id,title,description,type,found_at',
            'rules:id,case_id,rule_text,order',
            'evidences.suspects:id,name,description' // только подозреваемые связанные с доказательствами
        ]);

        // Фильтрация по сложности
        if ($difficulty) {
            $query->where('difficulty', $difficulty);
        }

        // Исключить пройденные дела (если пользователь авторизован)
        if ($excludeCompleted && $userId) {
            $completedCaseIds = $request->user()
                ->progress()
                ->where('is_completed', true)
                ->pluck('case_id')
                ->toArray();

            if (!empty($completedCaseIds)) {
                $query->whereNotIn('id', $completedCaseIds);
            }
        }

        // Получаем случайное дело
        $case = $query->inRandomOrder()->first();

        if (!$case) {
            return response()->json([
                'message' => 'Дела по заданным критериям не найдены'
            ], 404);
        }

        // Для игрового процесса скрываем правильный ответ
        $caseData = $case->toArray();
        unset($caseData['suspect_id']);

        return response()->json([
            'case' => $caseData,
            'hint' => [
                'total_evidences' => $case->evidences->count(),
                'total_rules' => $case->rules->count(),
                'difficulty' => $this->getDifficultyLabel($case->difficulty)
            ]
        ]);
    }

    /**
     * Проверить ответ пользователя
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

        $case = Cases::find($caseId);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        $isCorrect = $case->suspect_id == $request->suspect_id;

        // Если пользователь авторизован, сохраняем прогресс
        $progressData = null;
        if ($request->user()) {
            $progress = $request->user()->progress()->updateOrCreate(
                ['case_id' => $caseId],
                [
                    'selected_suspect_id' => $request->suspect_id,
                    'is_correct' => $isCorrect,
                    'is_completed' => true,
                    'attempts' => \DB::raw('attempts + 1'),
                    'completed_at' => now(),
                ]
            );

            $progressData = [
                'progress_id' => $progress->id,
                'attempts' => $progress->attempts,
                'completed_at' => $progress->completed_at,
            ];
        }

        return response()->json([
            'is_correct' => $isCorrect,
            'message' => $isCorrect ? 'Правильный ответ!' : 'Неправильный ответ. Попробуйте еще раз.',
            'correct_suspect_id' => $isCorrect ? $case->suspect_id : null,
            'progress' => $progressData,
            'hints' => $isCorrect ? [] : $this->getHints($case, $request->suspect_id)
        ]);
    }

    /**
     * Получить статистику по делу
     */
    public function getCaseStats($id)
    {
        $case = Cases::withCount(['evidences', 'rules', 'userProgresses'])
                    ->with(['userProgresses' => function($query) {
                        $query->selectRaw('COUNT(*) as total_attempts,
                                          SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
                                          AVG(attempts) as avg_attempts')
                              ->groupBy('case_id');
                    }])
                    ->find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        $stats = $case->userProgresses->first();

        return response()->json([
            'case_id' => $case->id,
            'case_title' => $case->title,
            'stats' => [
                'total_evidences' => $case->evidences_count,
                'total_rules' => $case->rules_count,
                'total_attempts' => $stats->total_attempts ?? 0,
                'correct_attempts' => $stats->correct_attempts ?? 0,
                'success_rate' => $stats->total_attempts ?
                    round(($stats->correct_attempts / $stats->total_attempts) * 100, 2) : 0,
                'average_attempts' => $stats->avg_attempts ?? 0,
            ],
            'difficulty' => [
                'level' => $case->difficulty,
                'label' => $this->getDifficultyLabel($case->difficulty)
            ]
        ]);
    }

    /**
     * Получить подсказки при неправильном ответе
     */
    private function getHints(Cases $case, $selectedSuspectId)
    {
        $hints = [];

        // Можно добавить логику подсказок:
        // 1. Подсказка о мотиве
        // 2. Подсказка об алиби
        // 3. Подсказка о внешности

        $correctSuspect = $case->correctSuspect;
        $selectedSuspect = Suspect::find($selectedSuspectId);

        if ($correctSuspect && $selectedSuspect) {
            // Простая подсказка - сравнение мотивов
            if ($correctSuspect->motive && $selectedSuspect->motive) {
                $hints[] = 'Обратите внимание на мотив преступления';
            }

            // Подсказка про алиби
            if ($correctSuspect->alibi && $selectedSuspect->alibi) {
                $hints[] = 'Проверьте алиби подозреваемых';
            }
        }

        return $hints;
    }

    /**
     * Получить текстовое описание сложности
     */
    private function getDifficultyLabel($difficulty)
    {
        $labels = [
            1 => 'Очень легко',
            2 => 'Легко',
            3 => 'Средняя',
            4 => 'Сложно',
            5 => 'Очень сложно'
        ];

        return $labels[$difficulty] ?? 'Не указана';
    }

    /**
     * Получить все дела определенной сложности
     */
    public function getByDifficulty($difficulty)
    {
        $validator = Validator::make(['difficulty' => $difficulty], [
            'difficulty' => 'required|integer|min:1|max:5',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $cases = Cases::where('difficulty', $difficulty)
                     ->select(['id', 'title', 'description', 'difficulty', 'created_at'])
                     ->orderBy('title')
                     ->get();

        return response()->json([
            'difficulty' => [
                'level' => $difficulty,
                'label' => $this->getDifficultyLabel($difficulty)
            ],
            'cases' => $cases,
            'count' => $cases->count()
        ]);
    }

    /**
     * Получить все дела с минимальной информацией (для выпадающих списков и т.д.)
     */
    public function getAllMinimal()
    {
        $cases = Cases::select(['id', 'title', 'difficulty'])
                     ->orderBy('title')
                     ->get();

        return response()->json([
            'cases' => $cases
        ]);
    }
}
