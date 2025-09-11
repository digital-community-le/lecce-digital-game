<?php

/**
 * Proxy PHP per aggirare problemi CORS nelle chiamate API
 * 
 * Utilizzo:
 * GET  /php-proxy/proxy.php?path=/endpoint&host=api.example.com
 * POST /php-proxy/proxy.php?path=/users&host=api.example.com
 * 
 * Headers supportati:
 * - Authorization: Bearer token (forwarded)
 * - Content-Type: application/json, etc.
 * 
 * @author Mattia Mancarella
 * @date 2025-09-11
 */

// Carica configurazione
$config = require_once __DIR__ . '/config.php';

// Headers per logging errori
header('Content-Type: application/json; charset=utf-8');

/**
 * Log degli errori se debug è abilitato
 */
function debugLog($message, $data = null)
{
  global $config;
  if ($config['debug']) {
    error_log("[PROXY DEBUG] $message" . ($data ? ' | Data: ' . json_encode($data) : ''));
  }
}

/**
 * Risposta di errore standardizzata
 */
function errorResponse($code, $message, $details = null)
{
  http_response_code($code);
  $response = ['error' => $message];
  if ($details && $GLOBALS['config']['debug']) {
    $response['details'] = $details;
  }
  echo json_encode($response);
  exit;
}

/**
 * Imposta headers CORS
 */
function setCorsHeaders()
{
  global $config;
  $cors = $config['cors'];

  header("Access-Control-Allow-Origin: {$cors['allow_origin']}");
  header("Access-Control-Allow-Methods: {$cors['allow_methods']}");
  header("Access-Control-Allow-Headers: {$cors['allow_headers']}");
  header("Access-Control-Allow-Credentials: {$cors['allow_credentials']}");
}

// Imposta CORS headers sempre
setCorsHeaders();

// Gestione preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  debugLog('Handling preflight OPTIONS request');
  http_response_code(204);
  exit;
}

// Leggi parametri
$path = $_GET['path'] ?? '/';
$targetHost = $_GET['host'] ?? $config['default_target']['host'];
$scheme = $_GET['scheme'] ?? $config['default_target']['scheme'];

debugLog('Proxy request', [
  'method' => $_SERVER['REQUEST_METHOD'],
  'path' => $path,
  'host' => $targetHost,
  'scheme' => $scheme
]);

// Validazione host (security: prevent SSRF)
if (!in_array($targetHost, $config['allowed_hosts'], true)) {
  debugLog('Host not allowed', ['host' => $targetHost, 'allowed' => $config['allowed_hosts']]);
  errorResponse(403, 'Host non consentito', $targetHost);
}

// Costruisci URL target
$targetUrl = $scheme . '://' . $targetHost . $path;
if (!empty($_SERVER['QUERY_STRING'])) {
  // Rimuovi i parametri del proxy dalla query string
  $queryParams = $_GET;
  unset($queryParams['path'], $queryParams['host'], $queryParams['scheme']);
  if (!empty($queryParams)) {
    $targetUrl .= '?' . http_build_query($queryParams);
  }
}

debugLog('Target URL', $targetUrl);

// Inizializza cURL
$ch = curl_init($targetUrl);
if (!$ch) {
  errorResponse(500, 'Impossibile inizializzare cURL');
}

// Configurazione base cURL
curl_setopt_array($ch, [
  CURLOPT_CUSTOMREQUEST => $_SERVER['REQUEST_METHOD'],
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_HEADER => true,
  CURLOPT_FOLLOWLOCATION => false,
  CURLOPT_TIMEOUT => $config['timeout'],
  CURLOPT_SSL_VERIFYPEER => true,
  CURLOPT_USERAGENT => 'DevFest-Lecce-Game-Proxy/1.0',
]);

// Gestione body per POST/PUT/PATCH
if (in_array($_SERVER['REQUEST_METHOD'], ['POST', 'PUT', 'PATCH', 'DELETE'])) {
  $body = file_get_contents('php://input');
  if ($body !== false && strlen($body) > 0) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    debugLog('Request body length', strlen($body));
  }
}

// Prepara headers da inoltrare
$forwardHeaders = [];
$skipHeaders = ['host', 'content-length', 'connection', 'accept-encoding'];

// Ottieni tutti gli headers della richiesta
$requestHeaders = function_exists('getallheaders') ? getallheaders() : [];

foreach ($requestHeaders as $name => $value) {
  $lowerName = strtolower($name);

  // Salta headers che non devono essere inoltrati
  if (in_array($lowerName, $skipHeaders)) {
    continue;
  }

  $forwardHeaders[] = "$name: $value";

  // Log dell'Authorization header (senza il valore per sicurezza)
  if ($lowerName === 'authorization') {
    debugLog('Authorization header detected', 'Bearer token presente');
  }
}

// Aggiungi Content-Type se presente nel body
if (!empty($body)) {
  $hasContentType = false;
  foreach ($forwardHeaders as $header) {
    if (stripos($header, 'content-type:') === 0) {
      $hasContentType = true;
      break;
    }
  }
  if (!$hasContentType) {
    $forwardHeaders[] = 'Content-Type: application/json';
  }
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $forwardHeaders);
debugLog('Forward headers count', count($forwardHeaders));

// Esegui la richiesta
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$curlError = curl_error($ch);

curl_close($ch);

// Gestione errori cURL
if ($response === false) {
  debugLog('cURL error', $curlError);
  errorResponse(502, 'Bad Gateway', $curlError);
}

// Separa headers e body della risposta
$responseHeaders = substr($response, 0, $headerSize);
$responseBody = substr($response, $headerSize);

debugLog('Response received', [
  'status' => $httpCode,
  'body_length' => strlen($responseBody)
]);

// Inoltra headers della risposta (filtra hop-by-hop headers)
$hopByHopHeaders = [
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade'
];

foreach (explode("\r\n", $responseHeaders) as $headerLine) {
  $headerLine = trim($headerLine);

  // Salta linee vuote e status line
  if (empty($headerLine) || strpos($headerLine, 'HTTP/') === 0) {
    continue;
  }

  $colonPos = strpos($headerLine, ':');
  if ($colonPos === false) {
    continue;
  }

  $headerName = strtolower(trim(substr($headerLine, 0, $colonPos)));

  // Salta hop-by-hop headers
  if (in_array($headerName, $hopByHopHeaders)) {
    continue;
  }

  // Inoltra l'header
  header($headerLine, false);
}

// Reimpostazione CORS (potrebbero essere stati sovrascritti)
setCorsHeaders();

// Imposta status code e restituisci body
http_response_code($httpCode);
echo $responseBody;

debugLog('Proxy completed', ['final_status' => $httpCode]);
