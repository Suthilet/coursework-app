<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Evidence;
use App\Models\Cases;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class EvidenceController extends Controller
{
    /**
     * Получить список всех доказательств
     */
    public function index(Request $request)
    {
        $perPage = $request->input('per_page', 20);
        $search = $request->input('search');
        $caseId = $request->input('case_id');
        $type = $request->input('type');

        $query = Evidence::with(['case:id,title']);

        // Поиск
        if ($search) {
            $query->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
        }

        // Фильтрация по делу
        if ($caseId) {
            $query->where('case_id', $caseId);
        }

        // Фильтрация по типу
        if ($type) {
            $query->where('type', $type);
        }

        $evidences = $query->orderBy('created_at', 'desc')->paginate($perPage);

        return response()->json([
            'evidences' => $evidences->items(),
            'pagination' => [
                'current_page' => $evidences->currentPage(),
                'total_pages' => $evidences->lastPage(),
                'total_items' => $evidences->total(),
                'per_page' => $evidences->perPage(),
            ]
        ]);
    }

    /**
     * Получить доказательство по ID
     */
    public function show($id)
    {
        $evidence = Evidence::with(['case:id,title,difficulty'])->find($id);

        if (!$evidence) {
            return response()->json([
                'message' => 'Доказательство не найдено'
            ], 404);
        }

        // Если есть файл, добавляем URL для скачивания
        if ($evidence->file_path) {
            $evidence->download_url = Storage::url($evidence->file_path);
        }

        return response()->json([
            'evidence' => $evidence
        ]);
    }

    /**
     * Создать новое доказательство
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'type' => 'required|string|in:html,image,pdf,text,video,audio,document',
            'case_id' => 'required|exists:cases,id',
            'file' => 'sometimes|file|max:10240',
            'metadata' => 'sometimes|json',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $data = $request->except('file');

        // Обработка файла, если он загружен
        if ($request->hasFile('file')) {
        $file = $request->file('file');

        // Сохраняем с оригинальным именем файла
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();

        // Для HTML файлов сохраняем с правильным расширением
        if (in_array(strtolower($extension), ['html', 'htm'])) {
            $path = $file->storeAs('evidences', $originalName . '.' . $extension, 'public');
        } else {
            $path = $file->store('evidences', 'public');
        }

        $data['file_path'] = $path;
        $data['mime_type'] = $file->getMimeType();
        $data['size'] = $file->getSize();

        if (!$request->has('type')) {
            $extension = strtolower($file->getClientOriginalExtension());
            $typeMap = [
                'html' => 'html', 'htm' => 'html', // ✅ Добавьте это
                'jpg' => 'image', 'jpeg' => 'image', 'png' => 'image', 'gif' => 'image',
                'pdf' => 'pdf',
                'txt' => 'text',
                'mp4' => 'video', 'avi' => 'video', 'mov' => 'video',
                'mp3' => 'audio', 'wav' => 'audio',
                'doc' => 'document', 'docx' => 'document',
            ];

            $data['type'] = $typeMap[$extension] ?? 'document';
        }
    }

    $evidence = Evidence::create($data);

    // Добавляем публичную ссылку на файл
    $evidence->file_url = Storage::url($evidence->file_path);

    return response()->json([
        'message' => 'Доказательство успешно создано',
        'evidence' => $evidence->load('case:id,title')
    ], 201);
    }

    /**
 * Получить содержимое HTML улики
 */
public function getHtmlContent($id)
{
    $evidence = Evidence::find($id);

    if (!$evidence) {
        return response()->json([
            'message' => 'Доказательство не найдено'
        ], 404);
    }

    // Проверяем, что это HTML файл
    if ($evidence->type !== 'html' || !$evidence->file_path) {
        return response()->json([
            'message' => 'Это доказательство не является HTML файлом'
        ], 400);
    }

    // Читаем содержимое файла
    try {
        $content = Storage::get($evidence->file_path);

        return response()->json([
            'evidence' => [
                'id' => $evidence->id,
                'title' => $evidence->title,
                'type' => $evidence->type,
                'html_content' => $content,
                'file_url' => Storage::url($evidence->file_path),
            ]
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Ошибка чтения файла',
            'error' => $e->getMessage()
        ], 500);
    }
}

/**
 * Показать HTML улику в браузере (рендеринг)
 */
public function renderHtml($id)
{
    $evidence = Evidence::find($id);

    if (!$evidence) {
        abort(404, 'Доказательство не найдено');
    }

    if ($evidence->type !== 'html' || !$evidence->file_path) {
        abort(400, 'Это доказательство не является HTML файлом');
    }

    try {
        $content = Storage::get($evidence->file_path);

        // Возвращаем HTML как есть
        return response($content)->header('Content-Type', 'text/html');
    } catch (\Exception $e) {
        abort(500, 'Ошибка чтения файла');
    }
}

    /**
     * Обновить доказательство
     */
    public function update(Request $request, $id)
    {
        $evidence = Evidence::find($id);

        if (!$evidence) {
            return response()->json([
                'message' => 'Доказательство не найден'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'type' => 'sometimes|string|in:html,image,pdf,text,video,audio,document',
            'case_id' => 'sometimes|exists:cases,id',
            'metadata' => 'sometimes|json',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        $evidence->update($request->except('file'));

        return response()->json([
            'message' => 'Доказательство успешно обновлено',
            'evidence' => $evidence->fresh(['case:id,title'])
        ]);
    }

    /**
     * Удалить доказательство
     */
    public function destroy($id)
    {
        $evidence = Evidence::find($id);

        if (!$evidence) {
            return response()->json([
                'message' => 'Доказательство не найдено'
            ], 404);
        }

        // Удаляем файл, если он существует
        if ($evidence->file_path && Storage::exists($evidence->file_path)) {
            Storage::delete($evidence->file_path);
        }

        $evidence->delete();

        return response()->json([
            'message' => 'Доказательство успешно удалено'
        ]);
    }

    /**
     * Загрузить файл доказательства
     */
    public function uploadFile(Request $request, $id)
    {
        $evidence = Evidence::find($id);

        if (!$evidence) {
            return response()->json([
                'message' => 'Доказательство не найдено'
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'file' => 'required|file|max:10240', // максимум 10MB
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        // Удаляем старый файл, если он существует
        if ($evidence->file_path && Storage::exists($evidence->file_path)) {
            Storage::delete($evidence->file_path);
        }

        // Сохраняем новый файл
        $file = $request->file('file');
        $path = $file->store('evidences', 'public');

        // Обновляем информацию о файле
        $evidence->update([
            'file_path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
        ]);

        return response()->json([
            'message' => 'Файл успешно загружен',
            'evidence' => $evidence->fresh(),
            'download_url' => Storage::url($path)
        ]);
    }

    /**
     * Скачать файл доказательства
     */
    public function downloadFile($id)
    {
        $evidence = Evidence::find($id);

        if (!$evidence || !$evidence->file_path) {
            return response()->json([
                'message' => 'Файл не найден'
            ], 404);
        }

        if (!Storage::exists($evidence->file_path)) {
            return response()->json([
                'message' => 'Файл отсутствует на сервере'
            ], 404);
        }

        return Storage::download($evidence->file_path);
    }

    /**
     * Получить доказательства по делу
     */
    public function getByCase($caseId)
    {
        $case = Cases::find($caseId);

        if (!$case) {
            return response()->json([
                'message' => 'Дело не найдено'
            ], 404);
        }

        $evidences = Evidence::where('case_id', $caseId)
                            ->orderBy('created_at')
                            ->get();

        // Добавляем URL для скачивания
        foreach ($evidences as $evidence) {
            if ($evidence->file_path) {
                $evidence->download_url = Storage::url($evidence->file_path);
            }
        }

        return response()->json([
            'case' => [
                'id' => $case->id,
                'title' => $case->title,
            ],
            'evidences' => $evidences,
            'count' => $evidences->count()
        ]);
    }

    /**
     * Получить типы доказательств
     */
    public function getTypes()
    {
        $types = Evidence::select('type')
                        ->distinct()
                        ->pluck('type');

        return response()->json([
            'types' => $types
        ]);
    }
}
