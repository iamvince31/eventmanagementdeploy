<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AvailabilityController extends Controller
{
    public function store(Request $request)
    {
        return response()->json(['message' => 'Availability saved'], 201);
    }

    public function index(Request $request)
    {
        return response()->json(['availabilities' => []]);
    }
}
