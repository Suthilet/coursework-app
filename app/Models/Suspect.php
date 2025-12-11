<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\User;

class Suspect extends Model
{
     use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'age',
        'eyes',
        'address',
        'phone',
        'hobby'
    ];

    public function case(): BelongsTo
    {
        return $this->belongsTo(Cases::class);
        // не уверена, что тут именно belongsTo, надо уточнить у
    }
}
