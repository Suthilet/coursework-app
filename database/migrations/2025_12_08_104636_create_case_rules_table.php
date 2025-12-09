<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
     public function up(): void
    {
        Schema::create('case_rules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained()->onDelete('cascade');
            $table->string('rule_type');
            $table->json('rule_value');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('case_rules');
    }
};
