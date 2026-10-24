<?php

namespace App\Http\Requests;

use App\Models\Discipline;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDisciplineRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return $this->user()?->can('update', $this->route('discipline')) ?? false;
        }

        return $this->user()?->can('create', Discipline::class) ?? false;
    }

    public function rules(): array
    {
        $activeClubId = $this->attributes->get('activeClub')?->id;

        return [
            'name' => [
                'required', 'string', 'max:100',
                Rule::unique('disciplines', 'name')
                    ->where(fn ($query) => $query->where('club_id', $activeClubId))
                    ->ignore($this->route('discipline')?->id),
            ],
            'description' => ['nullable', 'string', 'max:500'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
