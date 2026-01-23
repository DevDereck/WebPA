<?php
require_once __DIR__ . '/_helpers.php';

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  send_json(['ok' => true], 200);
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
  send_json(['error' => 'Method not allowed'], 405);
}

$channelId = $_GET['channelId'] ?? DEFAULT_YOUTUBE_CHANNEL;
if (!$channelId) {
  send_json(['error' => 'channelId required'], 400);
}

function fetch_url(string $url, int $timeout = 8) {
  $headers = "User-Agent: icpa-web/1.0\r\nAccept-Language: es-CR,es;q=0.9,en;q=0.8\r\n";
  $context = stream_context_create([
    'http' => [
      'method' => 'GET',
      'timeout' => $timeout,
      'header' => $headers,
    ]
  ]);
  $data = @file_get_contents($url, false, $context);
  if ($data !== false) return $data;

  if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, $timeout);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
      'User-Agent: icpa-web/1.0',
      'Accept-Language: es-CR,es;q=0.9,en;q=0.8'
    ]);
    $data = curl_exec($ch);
    curl_close($ch);
    if ($data !== false) return $data;
  }

  return false;
}

function parse_feed_entries(string $xml): array {
  $entries = [];
  $feed = @simplexml_load_string($xml);
  if (!$feed) return $entries;
  $namespaces = $feed->getNamespaces(true);
  foreach ($feed->entry as $entry) {
    $yt = $entry->children($namespaces['yt'] ?? '');
    $videoId = (string)($yt->videoId ?? '');
    $title = (string)($entry->title ?? '');
    $publishedAt = (string)($entry->published ?? '');
    if ($videoId) {
      $entries[] = ['videoId' => $videoId, 'title' => $title, 'publishedAt' => $publishedAt];
    }
  }
  return $entries;
}

function get_video_flags(string $videoId): array {
  $watchUrl = "https://www.youtube.com/watch?v={$videoId}";
  $html = fetch_url($watchUrl, 6);
  if (!$html) return ['isLive' => false, 'isUpcoming' => false];
  $isLive = preg_match('/"isLive":true/', $html) || preg_match('/"isLiveContent":true/', $html);
  $isUpcoming = preg_match('/"isUpcoming":true/', $html);
  return ['isLive' => $isLive, 'isUpcoming' => $isUpcoming];
}

$feedUrl = "https://www.youtube.com/feeds/videos.xml?channel_id={$channelId}";
$xml = fetch_url($feedUrl, 8);

if (!$xml) {
  $proxy = 'https://api.allorigins.win/get?url=' . urlencode($feedUrl);
  $wrapped = fetch_url($proxy, 8);
  if ($wrapped) {
    $json = json_decode($wrapped, true);
    $xml = is_array($json) ? ($json['contents'] ?? '') : '';
  }
}

if (!$xml) {
  // Fallback adicional por si allorigins está bloqueado
  $proxy = 'https://r.jina.ai/http://www.youtube.com/feeds/videos.xml?channel_id=' . urlencode($channelId);
  $xml = fetch_url($proxy, 8);
}

if (!$xml) {
  send_json(['error' => 'youtube feed unavailable'], 200);
}

$entries = parse_feed_entries($xml);
if (!count($entries)) {
  send_json(['error' => 'video not found'], 200);
}

$inspect = array_slice($entries, 0, 5);
$firstLive = null;
foreach ($inspect as $entry) {
  $flags = get_video_flags($entry['videoId']);
  if ($flags['isUpcoming']) {
    continue;
  }
  if ($flags['isLive'] && !$firstLive) {
    $firstLive = ['entry' => $entry, 'flags' => $flags];
    continue;
  }
  if (!$flags['isLive']) {
    send_json(array_merge(['channelId' => $channelId, 'source' => 'finished'], $entry), 200);
  }
}

if ($firstLive) {
  send_json(array_merge(['channelId' => $channelId, 'source' => 'live'], $firstLive['entry']), 200);
}

$fallback = $entries[0];
send_json(array_merge(['channelId' => $channelId, 'source' => 'upcoming-fallback'], $fallback), 200);
