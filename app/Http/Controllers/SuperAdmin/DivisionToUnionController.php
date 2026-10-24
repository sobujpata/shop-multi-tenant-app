<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Requests\SuperAdmin\SaveDivisionToUnionRequest;
use App\Models\Divisiontounion;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class DivisionToUnionController extends Controller
{
    public function index(): Response
    {
        $validated = request()->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'divisions' => ['nullable', 'string', 'max:255'],
            'districts' => ['nullable', 'string', 'max:255'],
            'upazilas' => ['nullable', 'string', 'max:255'],
            'unions' => ['nullable', 'string', 'max:255'],
            'postoffices' => ['nullable', 'string', 'max:255'],
            'postcodes' => ['nullable', 'string', 'max:255'],
        ]);
        $search = trim($validated['search'] ?? '');
        $filters = array_fill_keys(
            ['divisions', 'districts', 'upazilas', 'unions', 'postoffices', 'postcodes'],
            '',
        );

        foreach ($filters as $column => $_) {
            $filters[$column] = $validated[$column] ?? '';
        }

        return Inertia::render('SuperAdmin/DivisionToUnion/Index', [
            'records' => $this->filteredQuery($filters, $search)
                ->orderBy('divisions')
                ->orderBy('districts')
                ->orderBy('upazilas')
                ->orderBy('unions')
                ->orderBy('postoffices')
                ->paginate(20)
                ->withQueryString(),
            'summary' => collect(array_keys($filters))
                ->mapWithKeys(fn (string $column): array => [
                    $column => $this->filteredQuery($filters, $search)
                        ->where($column, '<>', '')
                        ->distinct()
                        ->count($column),
                ])
                ->all(),
            'filters' => ['search' => $search, ...$filters],
            'filterOptions' => [
                'divisions' => $this->distinctFilterOptions('divisions', $filters),
                'districts' => $this->distinctFilterOptions('districts', $filters),
                'upazilas' => $this->distinctFilterOptions('upazilas', $filters),
                'unions' => $this->distinctFilterOptions('unions', $filters),
                'postoffices' => $this->distinctFilterOptions('postoffices', $filters),
                'postcodes' => $this->distinctFilterOptions('postcodes', $filters),
            ],
        ]);
    }

    /**
     * @param array<string, string> $filters
     * @return Builder<Divisiontounion>
     */
    private function filteredQuery(array $filters, string $search): Builder
    {
        return Divisiontounion::query()
            ->where(function (Builder $query) use ($filters): void {
                foreach ($filters as $column => $value) {
                    if ($value !== '') {
                        $query->where($column, $value);
                    }
                }
            })
            ->when($search !== '', function (Builder $query) use ($search): void {
                $query->where(function (Builder $query) use ($search): void {
                    foreach (['divisions', 'districts', 'upazilas', 'unions', 'postoffices', 'postcodes'] as $column) {
                        $query->orWhere($column, 'like', "%{$search}%");
                    }
                });
            });
    }

    public function store(SaveDivisionToUnionRequest $request): RedirectResponse
    {
        $record = Divisiontounion::create($this->normalizeOptionalFields($request->validated()));

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($record)
            ->log('Created division-to-union record');

        return back()->with('success', 'Division-to-union record created.');
    }

    public function update(SaveDivisionToUnionRequest $request, Divisiontounion $divisiontounion): RedirectResponse
    {
        $divisiontounion->update($this->normalizeOptionalFields($request->validated()));

        activity('super-admin')
            ->causedBy($request->user())
            ->performedOn($divisiontounion)
            ->log('Updated division-to-union record');

        return back()->with('success', 'Division-to-union record updated.');
    }

    public function destroy(Divisiontounion $divisiontounion): RedirectResponse
    {
        $divisiontounion->delete();

        activity('super-admin')
            ->causedBy(request()->user())
            ->performedOn($divisiontounion)
            ->log('Deleted division-to-union record');

        return back()->with('success', 'Division-to-union record deleted.');
    }

    /**
     * @param array<string, string|null> $data
     * @return array<string, string>
     */
    private function normalizeOptionalFields(array $data): array
    {
        foreach (['unions', 'postoffices', 'postcodes'] as $field) {
            $data[$field] ??= '';
        }

        return $data;
    }

    /**
     * @param array<string, string> $filters
     * @return list<string>
     */
    private function distinctFilterOptions(string $column, array $filters): array
    {
        $parents = [
            'divisions' => [],
            'districts' => ['divisions'],
            'upazilas' => ['divisions', 'districts'],
            'unions' => ['divisions', 'districts', 'upazilas'],
            'postoffices' => ['divisions', 'districts', 'upazilas'],
            'postcodes' => ['divisions', 'districts', 'upazilas'],
        ][$column];

        if (in_array($column, ['unions', 'postoffices', 'postcodes'], true) && $filters['upazilas'] === '') {
            return [];
        }

        $query = Divisiontounion::query()
            ->select($column)
            ->where($column, '<>', '');

        foreach ($parents as $parent) {
            if ($filters[$parent] !== '') {
                $query->where($parent, $filters[$parent]);
            }
        }

        return $query->distinct()
            ->orderBy($column)
            ->pluck($column)
            ->all();
    }
}
