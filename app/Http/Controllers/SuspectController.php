<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Suspect;
use App\Models\Cases;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class SuspectController extends Controller
{
    /**
     * Получить список всех подозреваемых
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $search = $request->input('search');
        $caseId = $request->input('case_id');
        $ageFrom = $request->input('age_from');
        $ageTo = $request->input('age_to');

        $query = Suspect::with(['case:id,title']);

        // Поиск по имени
        if ($search) {
            $query->where('name', 'like', "%{$search}%")
                  ->orWhere('hobby', 'like', "%{$search}%");
        }

        // Фильтрация по делу
        if ($caseId) {
            $query->where('case_id', $caseId);
        }

        // Фильтрация по возрасту
        if ($ageFrom) {
            $query->where('age', '>=', $ageFrom);
        }
        if ($ageTo) {
            $query->where('age', '<=', $ageTo);
        }

        $suspects = $query->orderBy('name')->paginate($perPage);

        return response()->json([
            'suspects' => $suspects->items(),
            'pagination' => [
                'current_page' => $suspects->currentPage(),
                'total_pages' => $suspects->lastPage(),
                'total_items' => $suspects->total(),
                'per_page' => $suspects->perPage(),
            ]
        ]);
    }

    /**
     * Получить подозреваемого по ID
     */
    public function show($id)
    {
        $suspect = Suspect::with(['case:id,title,difficulty'])->find($id);

        if (!$suspect) {
            return response()->json([
                'message' => 'Подозреваемый не найден'
            ], 404);
        }

        return response()->json([
            'suspect' => $suspect
        ]);
    }

    /**
     * Создать нового подозреваемого
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'age' => 'required|integer|min:1|max:120',
            'eyes' => 'required|string|max:100', 
            'address' => 'required|string|max:500',
            'phone' => 'required|string|max:20',
            'hobby' => 'required|string|max:255',
            'case_id' => 'required|exists:cases,id',
        ], [
            'case_id.exists' => 'Указанное дело не существует',

        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $suspect = Suspect::create($request->all());

        return response()->json([
            'message' => 'Подозреваемый успешно создан',
            'suspect' => $suspect->load('case:id,title')
        ], 201);
    }

    /**
     * Обновить подозреваемого
     */
    public function update(Request $request, $id)
    {
        $suspect = Suspect::find($id);

        if (!$suspect) {
            return response()->json([
                'message' => 'Подозреваемый не найден'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'age' => 'sometimes|integer|min:1|max:120',
            'eyes' => 'sometimes|string|max:100',
            'address' => 'sometimes|string|max:500',
            'phone' => 'sometimes|string|max:20',
            'hobby' => 'sometimes|string|max:255',
            'case_id' => [
                'sometimes',
                'exists:cases,id'
            ],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $suspect->update($request->all());

        return response()->json([
            'message' => 'Подозреваемый успешно обновлен',
            'suspect' => $suspect->fresh(['case:id,title'])
        ]);
    }

    /**
     * Удалить подозреваемого
     */
    public function destroy($id)
    {
        $suspect = Suspect::find($id);

        if (!$suspect) {
            return response()->json([
                'message' => 'Подозреваемый не найден'
            ], 404);
        }

        // Проверяем, не является ли этот подозреваемый правильным ответом в деле
        $isCorrectAnswer = Cases::where('suspect_id', $id)->exists();

        if ($isCorrectAnswer) {
            return response()->json([
                'message' => 'Невозможно удалить подозреваемого, так как он является правильным ответом в одном из дел'
            ], 409);
        }

        $suspect->delete();

        return response()->json([
            'message' => 'Подозреваемый успешно удален'
        ]);
    }

    /**
     * Получить подозреваемых по делу
     */
    public function getByCase($caseId)
    {
        $case = Cases::find($caseId);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        $suspects = Suspect::where('case_id', $caseId)
                          ->orderBy('name')
                          ->get();

        return response()->json([
            'case' => [
                'id' => $case->id,
                'title' => $case->title,
            ],
            'suspects' => $suspects,
            'count' => $suspects->count()
        ]);
    }

    /**
     * Поиск подозреваемых
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

        $suspects = Suspect::where('name', 'like', "%{$query}%")
                          ->orWhere('hobby', 'like', "%{$query}%")
                          ->orWhere('address', 'like', "%{$query}%")
                          ->orWhere('phone', 'like', "%{$query}%")
                          ->with(['case:id,title'])
                          ->orderBy('name')
                          ->limit(20)
                          ->get();

        return response()->json([
            'suspects' => $suspects,
            'count' => $suspects->count()
        ]);
    }

    /**
     * Получить статистику по подозреваемым
     */
    public function stats()
    {
        $totalSuspects = Suspect::count();
        $averageAge = Suspect::avg('age');
        $suspectsByCase = Suspect::selectRaw('case_id, COUNT(*) as count')
                                ->groupBy('case_id')
                                ->with(['case:id,title'])
                                ->get();

        return response()->json([
            'stats' => [
                'total_suspects' => $totalSuspects,
                'average_age' => round($averageAge, 1),
                'suspects_by_case' => $suspectsByCase,
            ]
        ]);
    }
}
