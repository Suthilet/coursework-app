<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Evidence extends Model
{
    use HasFactory;


    protected $fillable = [
        'case_id',
        'title',
        'description',
        'type',
        'content_type',
        'html_content',
        'file_path',
        'mime_type',
        'size',
        'metadata'
    ];

    protected $casts = [
        'metadata' => 'array',
    ];

    public function case(): BelongsTo
    {
        return $this->belongsTo(Cases::class);
    }

    /**
     * Получить URL для скачивания/просмотра файла
     */
    public function getFileUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }

        return Storage::url($this->file_path);
    }

    /**
     * Получить содержимое файла (для HTML файлов)
     */
    public function getFileContent()
    {
        if (!$this->file_path || !Storage::exists($this->file_path)) {
            return null;
        }

        return Storage::get($this->file_path);
    }
}
