<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreClubRequest;
use App\Models\Club;
use App\Models\ClubPaymentMethod;
use App\Services\ActiveClubResolver;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ClubController extends Controller
{
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', Club::class);
        $user = auth()->user();
        $activeClub = $request->attributes->get('activeClub');
        $search = trim($request->string('q')->toString());
        $paymentMethods = $activeClub?->paymentMethods()->latest()->get();

        if ($user->hasRole('superadmin')) {
            $paymentMethods?->each(function (ClubPaymentMethod $method): void {
                $method->account_number = $this->maskSensitiveValue($method->account_number);
                $method->holder_document = $this->maskSensitiveValue($method->holder_document);
            });
        }

        return Inertia::render('Clubs/Index', [
            'clubs' => $user->activeClubs()->withCount('disciplines')->when($search, fn ($query) => $query->where(fn ($query) => $query->where('clubs.name', 'like', "%{$search}%")->orWhere('clubs.slug', 'like', "%{$search}%")->orWhere('clubs.city', 'like', "%{$search}%")))->orderBy('name')->paginate(20, ['clubs.id', 'clubs.name', 'clubs.slug', 'clubs.city', 'clubs.currency']),
            'canCreate' => $user->can('create', Club::class),
            'activeClub' => $activeClub?->only(['id', 'name', 'slug', 'email', 'city', 'timezone']),
            'canUpdate' => $activeClub ? $user->can('update', $activeClub) : false,
            'canManagePaymentMethods' => $user->hasRole('admin'),
            'paymentMethods' => $paymentMethods,
        ]);
    }

    public function store(StoreClubRequest $request, ActiveClubResolver $resolver): RedirectResponse
    {
        $club = Club::create($request->validated());
        $club->settings()->create(['reminder_days' => [5, 2, 0, -3, -7]]);
        $club->users()->attach($request->user()->id, ['status' => 'active', 'is_default' => false, 'joined_at' => now()]);
        $resolver->setActiveClub($request, $club->id);

        return to_route('clubs.index')->with('success', 'Club creado correctamente.');
    }

    public function update(StoreClubRequest $request, Club $club): RedirectResponse
    {
        abort_unless($club->id === $request->attributes->get('activeClub')?->id, 404);
        $this->authorize('update', $club);
        $club->update($request->validated());

        return back()->with('success', 'Club actualizado correctamente.');
    }

    public function storePaymentMethod(Request $request): RedirectResponse
    {
        $club = $request->attributes->get('activeClub');
        abort_unless($club, 422, 'No hay un club activo seleccionado.');
        $this->authorize('update', $club);
        abort_unless($request->user()->hasRole('admin'), 403, 'Solo el administrador del club puede gestionar sus medios de pago.');

        $data = $request->validate([
            'type' => ['required', 'in:bank_account,nequi,bre_b,payment_key'],
            'label' => ['required', 'string', 'max:100'],
            'provider' => ['nullable', 'string', 'max:100'],
            'account_type' => ['nullable', 'in:savings,checking'],
            'account_number' => ['nullable', 'string', 'max:100'],
            'account_holder' => ['nullable', 'string', 'max:150'],
            'holder_document' => ['nullable', 'string', 'max:50'],
            'key_type' => ['nullable', 'in:mobile,identity,email,alphanumeric'],
            'notes' => ['nullable', 'string', 'max:500'],
        ]);
        $club->paymentMethods()->create($data);

        return back()->with('success', 'Medio de pago agregado correctamente.');
    }

    public function togglePaymentMethod(Request $request, ClubPaymentMethod $paymentMethod): RedirectResponse
    {
        $club = $request->attributes->get('activeClub');
        abort_unless($club && $paymentMethod->club_id === $club->id, 404);
        $this->authorize('update', $club);
        abort_unless($request->user()->hasRole('admin'), 403, 'Solo el administrador del club puede gestionar sus medios de pago.');
        $paymentMethod->update(['is_active' => ! $paymentMethod->is_active]);

        return back()->with('success', 'Estado del medio de pago actualizado.');
    }

    public function destroyPaymentMethod(Request $request, ClubPaymentMethod $paymentMethod): RedirectResponse
    {
        $club = $request->attributes->get('activeClub');
        abort_unless($club && $paymentMethod->club_id === $club->id, 404);
        $this->authorize('update', $club);
        abort_unless($request->user()->hasRole('admin'), 403, 'Solo el administrador del club puede gestionar sus medios de pago.');
        $paymentMethod->delete();

        return back()->with('success', 'Medio de pago eliminado correctamente.');
    }

    private function maskSensitiveValue(?string $value): ?string
    {
        if (blank($value)) {
            return $value;
        }

        $visible = mb_substr($value, -2);

        return '****'.$visible;
    }
}
