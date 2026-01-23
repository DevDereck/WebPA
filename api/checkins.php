<?php
require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  send_json(['ok' => true], 200);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
  require_auth();
  $data = read_checkins();
  usort($data, function($a, $b) {
    return strtotime($b['timestamp'] ?? '') <=> strtotime($a['timestamp'] ?? '');
  });
  send_json($data, 200);
}

if ($method === 'POST') {
  $body = read_json_body();
  $name = trim($body['name'] ?? '');
  $contact = trim($body['contact'] ?? '');
  if (!$name || !$contact) {
    send_json(['error' => 'name and contact required'], 400);
  }
  $record = [
    'id' => uniqid('chk_', true),
    'name' => $name,
    'contact' => $contact,
    'isNew' => (bool)($body['isNew'] ?? false),
    'guests' => (int)($body['guests'] ?? 0),
    'eventId' => $body['eventId'] ?? 'asistencia',
    'timestamp' => $body['timestamp'] ?? gmdate('c'),
  ];

  $data = read_checkins();
  $data[] = $record;
  save_checkins($data);
  send_json($record, 201);
}

if ($method === 'PATCH') {
  require_auth();
  $body = read_json_body();
  $id = $body['id'] ?? '';
  if (!$id) {
    send_json(['error' => 'id required'], 400);
  }

  $data = read_checkins();
  $updated = null;
  foreach ($data as &$row) {
    if (($row['id'] ?? '') === $id) {
      if (isset($body['name'])) $row['name'] = trim((string)$body['name']);
      if (isset($body['contact'])) $row['contact'] = trim((string)$body['contact']);
      if (array_key_exists('guests', $body)) $row['guests'] = (int)$body['guests'];
      if (array_key_exists('isNew', $body)) $row['isNew'] = (bool)$body['isNew'];
      $updated = $row;
      break;
    }
  }
  if (!$updated) {
    send_json(['error' => 'not found'], 404);
  }
  save_checkins($data);
  send_json($updated, 200);
}

if ($method === 'DELETE') {
  require_auth();
  $id = get_query_param('id');
  if (!$id) {
    $body = read_json_body();
    $id = $body['id'] ?? '';
  }
  if (!$id) {
    send_json(['error' => 'id required'], 400);
  }

  $data = read_checkins();
  $newData = array_values(array_filter($data, function($row) use ($id) {
    return ($row['id'] ?? '') !== $id;
  }));

  if (count($newData) === count($data)) {
    send_json(['error' => 'not found'], 404);
  }

  save_checkins($newData);
  send_json(['ok' => true], 200);
}

send_json(['error' => 'Method not allowed'], 405);
