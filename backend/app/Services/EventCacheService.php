<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;

class EventCacheService
{
    /**
     * Cache duration in seconds (5 minutes)
     */
    const CACHE_DURATION = 300;

    /**
     * Get cache key for default events
     */
    public static function getDefaultEventsCacheKey(string $schoolYear, bool $onlyEdited): string
    {
        return "default_events:{$schoolYear}:" . ($onlyEdited ? 'edited' : 'all');
    }

    /**
     * Get cache key for created academic events
     */
    public static function getCreatedEventsCacheKey(string $schoolYear): string
    {
        return "created_academic_events:{$schoolYear}";
    }

    /**
     * Get cache key for all events
     */
    public static function getAllEventsCacheKey(): string
    {
        return "all_events:list";
    }

    /**
     * Clear all event-related caches
     */
    public static function clearAllEventCaches(): void
    {
        // Clear pattern-based caches
        Cache::forget('all_events:list');
        
        // Note: For production, consider using Cache::tags() if using Redis
        // Cache::tags(['events'])->flush();
    }

    /**
     * Clear default events cache for a specific school year
     */
    public static function clearDefaultEventsCache(string $schoolYear): void
    {
        Cache::forget(self::getDefaultEventsCacheKey($schoolYear, true));
        Cache::forget(self::getDefaultEventsCacheKey($schoolYear, false));
    }

    /**
     * Clear created academic events cache for a specific school year
     */
    public static function clearCreatedEventsCache(string $schoolYear): void
    {
        Cache::forget(self::getCreatedEventsCacheKey($schoolYear));
    }

    /**
     * Remember (cache) a value with automatic expiration
     */
    public static function remember(string $key, callable $callback, ?int $duration = null)
    {
        return Cache::remember($key, $duration ?? self::CACHE_DURATION, $callback);
    }
}
