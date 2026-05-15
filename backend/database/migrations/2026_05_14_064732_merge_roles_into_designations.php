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
        $ceitRolesStr = DB::table('system_settings')->where('key', 'ceit_roles')->value('value');
        $deptRolesStr = DB::table('system_settings')->where('key', 'department_roles')->value('value');

        $ceitRoles = $ceitRolesStr ? json_decode($ceitRolesStr, true) : null;
        $ceitRoles = is_array($ceitRoles) ? $ceitRoles : ['Dean', 'CEIT Official', 'Faculty Member'];

        $deptRoles = $deptRolesStr ? json_decode($deptRolesStr, true) : null;
        $deptRoles = is_array($deptRoles) ? $deptRoles : ['Chairperson', 'Department Research Coordinator', 'Department Extension Coordinator', 'Faculty Member'];

        $merged = array_values(array_unique(array_merge($ceitRoles, $deptRoles)));

        DB::table('system_settings')->updateOrInsert(
            ['key' => 'designations'],
            ['value' => json_encode($merged)]
        );

        DB::table('system_settings')->whereIn('key', ['ceit_roles', 'department_roles'])->delete();
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        //
    }
};
