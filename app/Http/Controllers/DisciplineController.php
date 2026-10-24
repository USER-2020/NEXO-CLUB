<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDisciplineRequest;
use App\Models\Club;
use App\Models\Discipline;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\PermissionRegistrar;

class DisciplineController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var Club $club */
        $club = $request->attributes->get('activeClub');
        $search = trim($request->string('q')->toString());
        $disciplineQuery = $club->disciplines()->when($search, fn ($query) => $query->where(fn ($query) => $query->where('name', 'like', "%{$search}%")->orWhere('description', 'like', "%{$search}%")));
        abort_unless($club, 403, 'No hay un club activo.');
        $this->authorize('viewAny', Discipline::class);
        app(PermissionRegistrar::class)->setPermissionsTeamId($club->id);

        return Inertia::render('Disciplines/Index', [
            'disciplines' => $disciplineQuery->orderBy('name')->paginate(20, ['id', 'name', 'description', 'is_active', 'created_at']),
            'canManage' => $request->user()->can('create', Discipline::class),
        ]);
    }

    public function store(StoreDisciplineRequest $request): RedirectResponse
    {
        $club = $request->attributes->get('activeClub');
        abort_unless($club, 403, 'No hay un club activo.');
        $discipline = new Discipline($request->validated());
        $discipline->club_id = $club->id;
        $discipline->save();

        return back()->with('success', 'Disciplina creada correctamente.');
    }

    public function update(StoreDisciplineRequest $request, Discipline $discipline): RedirectResponse
    {
        abort_unless($discipline->club_id === $request->attributes->get('activeClub')?->id, 404);
        $this->authorize('update', $discipline);
        $discipline->update($request->validated());

        return back()->with('success', 'Disciplina actualizada correctamente.');
    }

    public function destroy(Discipline $discipline): RedirectResponse
    {
        abort_unless($discipline->club_id === request()->attributes->get('activeClub')?->id, 404);
        $this->authorize('delete', $discipline);
        $discipline->update(['is_active' => false]);

        return back()->with('success', 'Disciplina desactivada.');
    }

    public function toggle(Request $request, Discipline $discipline): RedirectResponse
    {
        abort_unless($discipline->club_id === $request->attributes->get('activeClub')?->id, 404);
        $this->authorize('update', $discipline);
        $discipline->update(['is_active' => ! $discipline->is_active]);

        return back()->with('success', $discipline->is_active
            ? 'Disciplina activada correctamente.'
            : 'Disciplina desactivada correctamente.');
    }
}
