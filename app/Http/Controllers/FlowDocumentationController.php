<?php

namespace App\Http\Controllers;

use App\Services\PlatformAccess;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class FlowDocumentationController extends Controller
{
    public function __invoke(Request $request, PlatformAccess $platformAccess): Response
    {
        $isSuperadmin = $platformAccess->isSuperadmin($request->user());
        $guides = [];
        $videos = ['nexo-flujos' => self::video('nexo-flujos')];

        foreach (self::catalog() as $guide) {
            $platformOnly = $guide['roles'] === ['Superadmin'];
            if (! $isSuperadmin && $platformOnly) {
                continue;
            }

            if (! $isSuperadmin) {
                $guide['roles'] = array_values(array_diff($guide['roles'], ['Superadmin']));
            }

            $guides[] = $guide;
            $videos[$guide['id']] = self::video($guide['id'], $platformOnly);
        }

        return Inertia::render('FlowDocumentation/Index', compact('guides', 'videos'));
    }

    public function platformMedia(string $guide, string $extension): BinaryFileResponse
    {
        $entry = collect(self::catalog())->firstWhere('id', $guide);
        abort_unless($entry && $entry['roles'] === ['Superadmin'], 404);

        $path = resource_path("hyperframes/platform-videos/{$guide}.{$extension}");
        abort_unless(is_file($path), 404);

        return response()->file($path, ['Cache-Control' => 'private, no-store'])->setPrivate();
    }

    public static function catalog(): array
    {
        return json_decode(file_get_contents(resource_path('hyperframes/flows/catalog.json')), true, flags: JSON_THROW_ON_ERROR);
    }

    public static function onboardingChapters(): array
    {
        $chapters = json_decode(file_get_contents(resource_path('hyperframes/flows/onboarding.json')), true, flags: JSON_THROW_ON_ERROR);
        $guides = collect(self::catalog())->keyBy('id');

        return array_map(function (array $chapter) use ($guides): array {
            $id = $chapter['id'];
            $animation = "flow-videos/{$id}.gif";
            $poster = "flow-videos/{$id}.jpg";

            return [
                ...$chapter,
                'steps' => $guides->get($id)['steps'],
                'animation' => is_file(public_path($animation)) ? asset($animation).'?v='.filemtime(public_path($animation)) : null,
                'poster' => is_file(public_path($poster)) ? asset($poster) : null,
            ];
        }, $chapters);
    }

    public static function video(string $id, bool $platformOnly = false): ?array
    {
        if ($platformOnly) {
            $directory = resource_path('hyperframes/platform-videos');

            return is_file("{$directory}/{$id}.mp4") ? [
                'src' => route('platform.flow-docs.media', ['guide' => $id, 'extension' => 'mp4']),
                'poster' => is_file("{$directory}/{$id}.jpg") ? route('platform.flow-docs.media', ['guide' => $id, 'extension' => 'jpg']) : null,
            ] : null;
        }

        $path = public_path("flow-videos/{$id}.mp4");
        if (! is_file($path)) {
            return null;
        }

        return [
            'src' => asset("flow-videos/{$id}.mp4").'?v='.filemtime($path),
            'poster' => is_file(public_path("flow-videos/{$id}.jpg")) ? asset("flow-videos/{$id}.jpg") : null,
        ];
    }
}
