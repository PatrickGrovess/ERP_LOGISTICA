<?php

$envPath = dirname(__DIR__).'/.env';
$artisanPath = dirname(__DIR__).'/artisan';

if (!is_file($envPath)) {
    fwrite(STDERR, "No se encontró backend/.env. Cópialo desde .env.example primero.\n");
    exit(1);
}

$environment = file_get_contents($envPath);

foreach ([
    'APP_KEY' => 'key:generate',
    'JWT_SECRET' => 'jwt:secret',
] as $key => $command) {
    $pattern = '/^'.preg_quote($key, '/').'=(.*)$/m';
    if (preg_match($pattern, $environment, $matches) && trim($matches[1]) !== '') {
        continue;
    }

    $shellCommand = escapeshellarg(PHP_BINARY).' '.escapeshellarg($artisanPath).' '.escapeshellarg($command).' --force';
    passthru($shellCommand, $exitCode);
    if ($exitCode !== 0) {
        exit($exitCode);
    }

    $environment = file_get_contents($envPath);
}
