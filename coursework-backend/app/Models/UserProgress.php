<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class UserProgress extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'case_id',
        'status',
        'score',
        'selected_suspect_id',  // Добавьте это поле
        'is_correct',            // Добавьте это поле
        'completed_at'           // Добавьте это поле
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'completed_at' => 'datetime',
        'score' => 'integer'
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function case(): BelongsTo
    {
        return $this->belongsTo(Cases::class);
    }

    public function selectedSuspect()
    {
        return $this->belongsTo(Suspect::class, 'selected_suspect_id');
    }
}
