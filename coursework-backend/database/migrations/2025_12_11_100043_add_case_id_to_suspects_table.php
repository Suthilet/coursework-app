<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    Schema::table('suspects', function (Blueprint $table) {
        $table->unsignedBigInteger('case_id')->nullable()->after('id');
        $table->foreign('case_id')->references('id')->on('cases')->onDelete('cascade');
    });
}

public function down()
{
    Schema::table('suspects', function (Blueprint $table) {
        $table->dropForeign(['case_id']);
        $table->dropColumn('case_id');
    });
}
};
