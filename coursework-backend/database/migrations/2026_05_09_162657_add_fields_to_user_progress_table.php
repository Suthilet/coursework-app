<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->foreignId('selected_suspect_id')->nullable()->constrained('suspects')->onDelete('set null');
            $table->boolean('is_correct')->default(false);
            $table->timestamp('completed_at')->nullable();
        });
    }

    public function down()
    {
        Schema::table('user_progress', function (Blueprint $table) {
            $table->dropForeign(['selected_suspect_id']);
            $table->dropColumn(['selected_suspect_id', 'is_correct', 'completed_at']);
        });
    }
};
