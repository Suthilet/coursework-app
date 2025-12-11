<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Evidence extends Model
{
    use HasFactory;

    protected $fillable = [
        'case_id',
        'title',
        'description',
        'type',        // 'html', 'image', 'pdf' и т.д.
        'file_path',
        'mime_type',
        'size',
        'metadata'
    ];

    // Связь: доказательство принадлежит одному делу
    public function case(): BelongsTo
    {
        return $this->belongsTo(Cases::class);
    }
}
