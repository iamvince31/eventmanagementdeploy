<?php

namespace App\Http\Controllers;

use App\Models\DefaultEvent;
use Illuminate\Http\JsonResponse;

class DefaultEventController extends Controller
{
    /**
     * Get all default events ordered by month and order.
     *
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        $events = DefaultEvent::orderBy('month')
            ->orderBy('order')
            ->get(['id', 'name', 'month', 'order']);

        return response()->json([
            'events' => $events
        ]);
    }
}
