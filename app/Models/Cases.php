<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Cases extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'difficulty',
        'suspect_id' // ID подозреваемого, который является правильным ответом
    ];

    // Связь: одно дело имеет много доказательств
    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class);
    }

    // Связь: одно дело имеет много правил (CaseRules)
    public function rules(): HasMany
    {
        return $this->hasMany(CaseRules::class);
    }

    // Связь: одно дело имеет одного "правильного" подозреваемого (как ответ)
    public function correctSuspect(): BelongsTo
    {
        return $this->belongsTo(Suspect::class, 'suspect_id');
    }

    // Связь: одно дело имеет много прогрессов пользователей
    public function userProgresses(): HasMany
    {
        return $this->hasMany(UserProgress::class);
    }
}
