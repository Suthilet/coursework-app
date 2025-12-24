<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Suspect extends Model
{
    use HasFactory;

    const GENDER_MALE = 'мужской';
    const GENDER_FEMALE = 'женский';
    const GENDER_UNSPECIFIED = 'не указан';

    public static function getGenders(): array
    {
        return [
            self::GENDER_MALE,
            self::GENDER_FEMALE,
            self::GENDER_UNSPECIFIED,
        ];
    }

    protected $fillable = [
        'name',
        'age',
        'gender',
        'eyes',
        'address',
        'phone',
        'hobby',
        'case_id'
    ];


    protected $attributes = [
        'gender' => self::GENDER_UNSPECIFIED,
    ];

    /**
     * Преобразование типов атрибутов
     */
    protected $casts = [
        'gender' => 'string',
    ];

    // Связь: подозреваемый принадлежит одному делу
    public function case(): BelongsTo
    {
        return $this->belongsTo(Cases::class);
    }
}
