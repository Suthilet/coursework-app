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
        'suspect_id'
    ];

    public function evidences(): HasMany
    {
        return $this->hasMany(Evidence::class, 'case_id');
    }


    public function suspects(): HasMany
    {
        return $this->hasMany(Suspect::class, 'case_id');
    }

    public function correctSuspect(): BelongsTo
    {
        return $this->belongsTo(Suspect::class, 'suspect_id');
    }

    public function userProgresses(): HasMany
    {
        return $this->hasMany(UserProgress::class, 'case_id'); 
    }
}
