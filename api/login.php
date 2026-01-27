<?php
require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  send_json(['ok' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  send_json(['error' => 'Method not allowed'], 405);
}

$body = read_json_body();
$email = strtolower(trim($body['email'] ?? ''));
$password = trim($body['password'] ?? '');

if (!$email || !$password || $email !== ADMIN_EMAIL || $password !== ADMIN_PASSWORD) {
  send_json(['error' => 'invalid credentials'], 401);
}

$token = jwt_sign(['email' => $email], JWT_SECRET, 60 * 60 * 12);
send_json(['token' => $token], 200);
