<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\ActivityLogFilterRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class ActivityLogController extends Controller
{
    public function index(ActivityLogFilterRequest $request): Response
    {
        $filters = $request->validated();
        $activitiesQuery = Activity::query()->with('causer');

        if (! empty($filters['user_id'])) {
            $activitiesQuery->where('causer_type', User::class)
                ->where('causer_id', $filters['user_id']);
        }

        if (! empty($filters['subject_type'])) {
            $activitiesQuery->where('subject_type', $filters['subject_type']);
        }

        if (! empty($filters['from'])) {
            $activitiesQuery->whereDate('created_at', '>=', $filters['from']);
        }

        if (! empty($filters['to'])) {
            $activitiesQuery->whereDate('created_at', '<=', $filters['to']);
        }

        if (! empty($filters['search'])) {
            $search = $filters['search'];
            $activitiesQuery->where(function (Builder $query) use ($search): void {
                $query->where('description', 'like', "%{$search}%")
                    ->orWhere('event', 'like', "%{$search}%")
                    ->orWhere('log_name', 'like', "%{$search}%");
            });
        }

        $selectedActivity = ! empty($filters['detail'])
            ? Activity::query()->with('causer')->findOrFail($filters['detail'])
            : null;

        return Inertia::render('SuperAdmin/ActivityLogs/Index', [
            'activities' => $activitiesQuery
                ->latest()
                ->paginate(15)
                ->withQueryString(),
            'filters' => [
                'user_id' => $filters['user_id'] ?? '',
                'subject_type' => $filters['subject_type'] ?? '',
                'from' => $filters['from'] ?? '',
                'to' => $filters['to'] ?? '',
                'search' => $filters['search'] ?? '',
            ],
            'users' => User::query()->orderBy('name')->get(['id', 'name', 'email']),
            'subjectTypes' => [
                ['value' => 'App\\Models\\Tenant', 'label' => 'Tenant'],
                ['value' => 'App\\Models\\Plan', 'label' => 'Plan'],
                ['value' => 'App\\Models\\Subscription', 'label' => 'Subscription'],
                ['value' => 'App\\Models\\Product', 'label' => 'Product'],
                ['value' => 'App\\Models\\Order', 'label' => 'Order'],
            ],
            'selectedActivity' => $selectedActivity,
        ]);
    }
}
