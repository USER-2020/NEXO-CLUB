<?php

namespace App\Http\Requests;

use App\Models\Club;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StoreClubRequest extends FormRequest
{
    public function authorize(): bool
    {
        if ($this->isMethod('put') || $this->isMethod('patch')) {
            return $this->user()?->can('update', $this->route('club')) ?? false;
        }

        return $this->user()?->can('create', Club::class) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['slug' => $this->input('slug') ?: Str::slug($this->input('name', ''))]);
    }

    public function rules(): array
    {
        $slugRule = Rule::unique('clubs', 'slug');

        if ($this->isMethod('put') || $this->isMethod('patch')) {
            $slugRule->ignore($this->route('club'));
        }

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => ['required', 'string', 'max:140', 'alpha_dash', $slugRule],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:40'],
            'city' => ['nullable', 'string', 'max:100'],
            'timezone' => ['required', 'timezone'],
        ];
    }
}
