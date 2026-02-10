<?php

namespace App\Http\Controllers;

use App\Models\User;

class UserController extends Controller
{
    public function index()
    {
        $users = User::where('id', '!=', auth()->id())
            ->orderBy('name', 'asc')
            ->get();

        return response()->json([
            'members' => $users->map(fn($user) => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'department' => $user->department,
            ]),
        ]);
    }
}
