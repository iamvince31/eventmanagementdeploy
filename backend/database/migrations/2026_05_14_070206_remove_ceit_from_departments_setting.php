<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $deptSettingsStr = DB::table('system_settings')->where('key', 'departments')->value('value');
        if ($deptSettingsStr) {
            $deptSettings = json_decode($deptSettingsStr, true);
            if (is_array($deptSettings)) {
                $filtered = array_values(array_filter($deptSettings, function ($dept) {
                    return $dept !== 'College of Engineering and Information Technology';
                }));
                DB::table('system_settings')->updateOrInsert(
                    ['key' => 'departments'],
                    ['value' => json_encode($filtered)]
                );
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('departments_setting', function (Blueprint $table) {
            //
        });
    }
};
