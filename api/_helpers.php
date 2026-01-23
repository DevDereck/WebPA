<?php
require_once __DIR__ . '/_config.php';

function send_json($data, int $status = 200): void {
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: *');
  header('Access-Control-Allow-Methods: GET,POST,PATCH,DELETE,OPTIONS');
  header('Access-Control-Allow-Headers: Content-Type, Authorization');
  http_response_code($status);
  echo json_encode($data, JSON_UNESCAPED_UNICODE);
  exit;
}

function read_json_body(): array {
  $raw = file_get_contents('php://input');
  if (!$raw) return [];
  $data = json_decode($raw, true);
  if (!is_array($data)) return [];
  return $data;
}

function base64url_encode(string $data): string {
  return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

function base64url_decode(string $data): string {
  $remainder = strlen($data) % 4;
  if ($remainder) {
    $data .= str_repeat('=', 4 - $remainder);
  }
  return base64_decode(strtr($data, '-_', '+/'));
}

function jwt_sign(array $payload, string $secret, int $expiresIn = 43200): string {
  $header = ['alg' => 'HS256', 'typ' => 'JWT'];
  $payload['exp'] = time() + $expiresIn;
  $segments = [
    base64url_encode(json_encode($header)),
    base64url_encode(json_encode($payload))
  ];
  $signature = hash_hmac('sha256', implode('.', $segments), $secret, true);
  $segments[] = base64url_encode($signature);
  return implode('.', $segments);
}

function jwt_verify(string $token, string $secret) {
  $parts = explode('.', $token);
  if (count($parts) !== 3) return false;
  [$h, $p, $s] = $parts;
  $sig = base64url_encode(hash_hmac('sha256', "$h.$p", $secret, true));
  if (!hash_equals($sig, $s)) return false;
  $payload = json_decode(base64url_decode($p), true);
  if (!is_array($payload)) return false;
  if (isset($payload['exp']) && time() > (int)$payload['exp']) return false;
  return $payload;
}

function require_auth(): array {
  $auth = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
  $token = '';
  if (stripos($auth, 'Bearer ') === 0) {
    $token = trim(substr($auth, 7));
  }
  if (!$token) {
    send_json(['error' => 'unauthorized'], 401);
  }
  $payload = jwt_verify($token, JWT_SECRET);
  if (!$payload) {
    send_json(['error' => 'unauthorized'], 401);
  }
  return $payload;
}

function ensure_checkins_file(): void {
  if (!file_exists(CHECKINS_FILE)) {
    $dir = dirname(CHECKINS_FILE);
    if (!is_dir($dir)) {
      mkdir($dir, 0755, true);
    }
    file_put_contents(CHECKINS_FILE, "[]", LOCK_EX);
  }
}

function read_checkins(): array {
  ensure_checkins_file();
  $raw = file_get_contents(CHECKINS_FILE);
  $data = json_decode($raw, true);
  return is_array($data) ? $data : [];
}

function save_checkins(array $data): void {
  ensure_checkins_file();
  file_put_contents(CHECKINS_FILE, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
}

function get_query_param(string $key): ?string {
  return isset($_GET[$key]) ? $_GET[$key] : null;
}
