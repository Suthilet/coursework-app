<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Cases;
use App\Models\Suspect;
use App\Models\Evidence;
use App\Models\UserProgress;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
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
        $query = Cases::with(['correctSuspect:id,name', 'evidences:id,case_id,title']);

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
            'correctSuspect:id,name,age,eyes,address,phone,hobby',
            'evidences:id,case_id,title,description,type,file_path,mime_type,size',
            'suspects:id,name,age,eyes,address,phone,hobby,case_id' // подозреваемые этого дела
        ])->find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        // Для игрового процесса - скрываем правильного подозреваемого
        $caseData = $case->toArray();
        unset($caseData['suspect_id']); // скрываем ID правильного ответа

        // Скрываем correct_suspect из ответа
        if (isset($caseData['correct_suspect'])) {
            unset($caseData['correct_suspect']);
        }

        return response()->json([
            'case' => $caseData,
            'metadata' => [
                'total_evidences' => $case->evidences->count(),
                'total_suspects' => $case->suspects->count(),
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
            'correctSuspect:id,name,age,eyes,address,phone,hobby',
            'evidences:id,case_id,title,description,type,file_path',
            'suspects:id,name,age,eyes,address,phone,hobby,case_id'
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

        // Удаляем связанные доказательства и подозреваемых
        $case->evidences()->delete();
        $case->suspects()->delete();

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
            'evidences:id,case_id,title,description,type,file_path',
            'suspects:id,name,age,eyes,address,phone,hobby,case_id'
        ]);

        // Фильтрация по сложности
        if ($difficulty) {
            $query->where('difficulty', $difficulty);
        }

        // Исключить пройденные дела (если пользователь авторизован)
        if ($excludeCompleted && $userId) {
            $completedCaseIds = UserProgress::where('user_id', $userId)
                ->where('status', 'completed')
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

        // Перемешиваем подозреваемых для случайного порядка
        if (isset($caseData['suspects'])) {
            shuffle($caseData['suspects']);
        }

        return response()->json([
            'case' => $caseData,
            'hint' => [
                'total_evidences' => $case->evidences->count(),
                'total_suspects' => $case->suspects->count(),
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

        if(!$isCorrect){
            return response()->json([
                'message' => 'Неправильный ответ'
            ],200);
        }

        // Если пользователь авторизован, сохраняем прогресс
        $progressData = null;
        if ($request->user()) {
            $progress = UserProgress::updateOrCreate(
                [
                    'user_id' => $request->user()->id,
                    'case_id' => $caseId,
                ],
                [
                    'selected_suspect_id' => $request->suspect_id,
                    'is_correct' => $isCorrect,
                    'status' => 'completed',
                    'score' => $isCorrect ? 100 : 0, // Простая логика оценки
                    'completed_at' => now(),
                ]
            );

            $progressData = [
                'progress_id' => $progress->id,
                'score' => $progress->score,
                'status' => $progress->status,
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
        $case = Cases::withCount(['evidences', 'suspects', 'userProgresses'])
                    ->with(['userProgresses' => function($query) {
                        $query->selectRaw('
                            case_id,
                            COUNT(*) as total_attempts,
                            SUM(CASE WHEN is_correct THEN 1 ELSE 0 END) as correct_attempts,
                            AVG(score) as avg_score
                        ')
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
                'total_suspects' => $case->suspects_count,
                'total_attempts' => $stats->total_attempts ?? 0,
                'correct_attempts' => $stats->correct_attempts ?? 0,
                'success_rate' => $stats->total_attempts ?
                    round(($stats->correct_attempts / $stats->total_attempts) * 100, 2) : 0,
                'average_score' => $stats->avg_score ?? 0,
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

        $correctSuspect = $case->correctSuspect;
        $selectedSuspect = Suspect::find($selectedSuspectId);

        if ($correctSuspect && $selectedSuspect) {
            // Подсказка про возраст
            if ($correctSuspect->age != $selectedSuspect->age) {
                $hints[] = 'Обратите внимание на возраст подозреваемого';
            }

            // Подсказка про глаза
            if ($correctSuspect->eyes != $selectedSuspect->eyes) {
                $hints[] = 'Цвет глаз может быть важной подсказкой';
            }

            // Подсказка про хобби
            if ($correctSuspect->hobby && $selectedSuspect->hobby) {
                $hints[] = 'Хобби подозреваемого может быть связано с делом';
            }
        }

        return array_slice($hints, 0, 2); // Возвращаем не более 2 подсказок
    }


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


public function executeQuery(Request $request, $caseId)
{
    $validator = Validator::make($request->all(), [
        'query' => 'required|string',
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

    // Получаем всех подозреваемых дела
    $suspects = $case->suspects()->get();
    $query = $request->input('query');
    $queryLower = strtolower($query);

    \Log::info('SQL Query received:', ['query' => $query, 'case_id' => $caseId]);
    \Log::info('Suspects count before filter:', ['count' => $suspects->count()]);

    $filteredSuspects = $suspects;

    try {
        // Простой SQL-парсер (учебный вариант)
        if (!str_contains($queryLower, 'select') || !str_contains($queryLower, 'from')) {
            throw new \Exception('Запрос должен содержать SELECT и FROM');
        }

        // Если есть WHERE, пытаемся парсить условия
        if (str_contains($queryLower, 'where')) {
            // Извлекаем часть после WHERE
            $whereIndex = stripos($query, 'WHERE');
            $wherePart = substr($query, $whereIndex + 5);

            \Log::info('WHERE part extracted:', ['wherePart' => $wherePart]);

            // Упрощенный парсинг условий
            $filteredSuspects = $this->applyFilters($suspects, $wherePart);

            \Log::info('After filtering:', ['count' => $filteredSuspects->count()]);
        }

        return response()->json([
            'success' => true,
            'results' => $filteredSuspects->values()->all(), // Преобразуем в массив
            'query' => $query,
            'count' => $filteredSuspects->count(),
            'message' => 'Запрос выполнен успешно. Найдено записей: ' . $filteredSuspects->count()
        ]);

    } catch (\Exception $e) {
        \Log::error('Query execution error:', [
            'error' => $e->getMessage(),
            'query' => $query,
            'case_id' => $caseId
        ]);

        return response()->json([
            'success' => false,
            'results' => [],
            'query' => $query,
            'count' => 0,
            'message' => 'Ошибка выполнения запроса: ' . $e->getMessage()
        ]);
    }
}


private function applyFilters($suspects, $whereConditions)
{
    $filtered = collect($suspects);

    // Убираем лишние пробелы и точку с запятой в конце
    $whereConditions = trim($whereConditions, " ;\t\n\r\0\x0B");

    // Разбиваем условия по AND (с учетом регистра)
    $conditions = preg_split('/\s+AND\s+/i', $whereConditions);

    foreach ($conditions as $condition) {
        $condition = trim($condition);

        if (empty($condition)) {
            continue;
        }

        // Парсим условие: column operator value
        // Поддерживаем: eyes = "голубые", age > 25, gender = 'М'
        preg_match('/(\w+)\s*([=<>!]+)\s*["\']?([^"\';]+)["\']?/', $condition, $matches);

        if (count($matches) >= 4) {
            $column = trim($matches[1]);
            $operator = trim($matches[2]);
            $value = trim($matches[3], " '\"");

            // Приводим к нижнему регистру для сравнения
            $valueLower = strtolower($value);

            $filtered = $filtered->filter(function ($suspect) use ($column, $operator, $value, $valueLower) {
                $suspectValue = $suspect->$column ?? null;

                if ($suspectValue === null) {
                    return false;
                }

                // Для строковых сравнений приводим к нижнему регистру
                if (in_array($column, ['eyes', 'gender', 'hair', 'hobby', 'name'])) {
                    $suspectValueLower = strtolower((string)$suspectValue);
                    return $this->compareValue($suspectValueLower, $operator, $valueLower);
                }

                // Для числовых значений
                return $this->compareValue($suspectValue, $operator, $value);
            });
        } else {
            // Если не удалось распарсить, попробуем другой паттерн
            preg_match('/(\w+)\s+([=<>!]+)\s+([^;]+)/', $condition, $matches2);

            if (count($matches2) >= 4) {
                $column = trim($matches2[1]);
                $operator = trim($matches2[2]);
                $value = trim($matches2[3], " '\"");

                $valueLower = strtolower($value);

                $filtered = $filtered->filter(function ($suspect) use ($column, $operator, $value, $valueLower) {
                    $suspectValue = $suspect->$column ?? null;

                    if ($suspectValue === null) {
                        return false;
                    }

                    if (in_array($column, ['eyes', 'gender', 'hair', 'hobby', 'name'])) {
                        $suspectValueLower = strtolower((string)$suspectValue);
                        return $this->compareValue($suspectValueLower, $operator, $valueLower);
                    }

                    return $this->compareValue($suspectValue, $operator, $value);
                });
            }
        }
    }

    return $filtered;
}

/**
 * Сравнить значения
 */
private function compareValue($actual, $operator, $expected)
{
    if ($actual === null) return false;

    $actualStr = strtolower((string)$actual);
    $expectedStr = strtolower($expected);

    switch ($operator) {
        case '=':
        case '==':
            return $actualStr == $expectedStr;
        case '!=':
        case '<>':
            return $actualStr != $expectedStr;
        case '>':
            return intval($actual) > intval($expected);
        case '<':
            return intval($actual) < intval($expected);
        case '>=':
            return intval($actual) >= intval($expected);
        case '<=':
            return intval($actual) <= intval($expected);
        case 'like':
            return str_contains($actualStr, $expectedStr);
        default:
            return false;
    }
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

    /**
     * Получить подозреваемых дела
     */
    public function getCaseSuspects($id)
    {
        $case = Cases::with('suspects:id,name,age,eyes,address,phone,hobby,case_id')->find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        return response()->json([
            'case' => [
                'id' => $case->id,
                'title' => $case->title,
            ],
            'suspects' => $case->suspects,
            'count' => $case->suspects->count()
        ]);
    }

    /**
     * Получить доказательства дела
     */
    public function getCaseEvidences($id)
    {
        $case = Cases::with('evidences:id,case_id,title,description,type,file_path')->find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        return response()->json([
            'case' => [
                'id' => $case->id,
                'title' => $case->title,
            ],
            'evidences' => $case->evidences,
            'count' => $case->evidences->count()
        ]);
    }

    /**
     * Получить прогресс пользователей по делу
     */
    public function getCaseProgress($id)
    {
        $case = Cases::with(['userProgresses.user:id,full_name,login'])->find($id);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        $stats = [
            'total_attempts' => $case->userProgresses->count(),
            'completed' => $case->userProgresses->where('status', 'completed')->count(),
            'in_progress' => $case->userProgresses->where('status', 'in_progress')->count(),
            'avg_score' => $case->userProgresses->where('status', 'completed')->avg('score'),
        ];

        return response()->json([
            'case' => [
                'id' => $case->id,
                'title' => $case->title,
            ],
            'progress' => $case->userProgresses,
            'stats' => $stats
        ]);
    }
}
