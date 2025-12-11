<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Suspect extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'age',
        'eyes',
        'address',
        'phone',
        'hobby',
        'case_id' // добавили
    ];

    // Связь: подозреваемый принадлежит одному делу
    public function case(): BelongsTo
    {
        return $this->belongsTo(Cases::class);
    }
}
