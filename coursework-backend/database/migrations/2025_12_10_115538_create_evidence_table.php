<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evidence', function (Blueprint $table) {
            $table->id();
            $table->foreignId('case_id')->constrained('cases')->onDelete('cascade');
            $table->string('title'); // Название улики (например, «Фоторобот подозреваемого»)
            $table->text('description')->nullable(); // Описание улики
            $table->string('type'); // Тип улики: 'photo', 'sketch', 'document', 'video'
            $table->string('file_path'); // Путь к файлу на сервере
            $table->string('mime_type')->nullable(); // MIME‑тип файла
            $table->integer('size')->nullable(); // Размер файла в байтах
            $table->json('metadata')->nullable(); // Дополнительные метаданные (например, EXIF для фото)
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
        });
    }

    public function down()
    {
        Schema::dropIfExists('evidence');
    }
};
