<?php

/**
 * Test del proxy PHP - verifica configurazione e funzionalità
 * 
 * Accedi a: http://localhost/php-proxy/test.php
 * 
 * @author GitHub Copilot
 * @date 2025-09-11
 */

// Carica configurazione
$config = require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="it">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Test Proxy PHP - DevFest Lecce</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }

    .test-section {
      margin: 20px 0;
      padding: 15px;
      border: 1px solid #ddd;
      border-radius: 5px;
    }

    .success {
      background-color: #d4edda;
      border-color: #c3e6cb;
    }

    .warning {
      background-color: #fff3cd;
      border-color: #ffecb5;
    }

    .error {
      background-color: #f8d7da;
      border-color: #f5c6cb;
    }

    .code {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 3px;
      font-family: monospace;
    }

    button {
      background-color: #007bff;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }

    button:hover {
      background-color: #0056b3;
    }

    .result {
      margin-top: 10px;
      padding: 10px;
      border-radius: 3px;
    }
  </style>
</head>

<body>
  <h1>🧪 Test Proxy PHP - DevFest Lecce</h1>

  <div class="test-section">
    <h2>📋 Configurazione Attuale</h2>
    <div class="code">
      <strong>Host consentiti:</strong><br>
      <?php foreach ($config['allowed_hosts'] as $host): ?>
        - <?= htmlspecialchars($host) ?><br>
      <?php endforeach; ?>
      <br>
      <strong>CORS Origin:</strong> <?= htmlspecialchars($config['cors']['allow_origin']) ?><br>
      <strong>Timeout:</strong> <?= $config['timeout'] ?> secondi<br>
      <strong>Debug:</strong> <?= $config['debug'] ? 'Abilitato' : 'Disabilitato' ?><br>
      <strong>Target di default:</strong> <?= htmlspecialchars($config['default_target']['scheme'] . '://' . $config['default_target']['host']) ?>
    </div>
  </div>

  <div class="test-section">
    <h2>🔧 Verifica Prerequisiti</h2>

    <?php
    $checks = [
      'cURL abilitato' => extension_loaded('curl'),
      'JSON abilitato' => extension_loaded('json'),
      'Lettura file input' => is_readable('php://input'),
      'Headers funzione' => function_exists('getallheaders'),
    ];

    foreach ($checks as $check => $result): ?>
      <div class="<?= $result ? 'success' : 'error' ?>">
        <?= $result ? '✅' : '❌' ?> <?= $check ?>
      </div>
    <?php endforeach; ?>
  </div>

  <div class="test-section">
    <h2>🌐 Test Chiamata API</h2>
    <p>Test con JSONPlaceholder (host di test pubblico)</p>

    <button onclick="testProxyCall()">Testa Chiamata Proxy</button>
    <div id="api-result" class="result" style="display: none;"></div>

    <h3>Test manuale</h3>
    <div class="code">
      <strong>URL per test:</strong><br>
      <?= htmlspecialchars($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/proxy.php?path=/posts/1&host=jsonplaceholder.typicode.com') ?>
    </div>
  </div>

  <div class="test-section">
    <h2>🛠️ Configurazione Frontend</h2>
    <p>Usa questi esempi nel tuo codice JavaScript:</p>

    <h3>Fetch con Bearer Token</h3>
    <div class="code">
      // Esempio con host di default
      fetch('<?= htmlspecialchars($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/proxy.php') ?>?path=/api/endpoint', {
      method: 'GET',
      headers: {
      'Authorization': 'Bearer your-token-here',
      'Content-Type': 'application/json'
      }
      })
      .then(response => response.json())
      .then(data => console.log(data));

      // Esempio con host custom
      fetch('<?= htmlspecialchars($_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER['REQUEST_URI']) . '/proxy.php') ?>?path=/posts&host=jsonplaceholder.typicode.com', {
      method: 'GET',
      headers: {
      'Content-Type': 'application/json'
      }
      })
      .then(response => response.json())
      .then(data => console.log(data));
    </div>

    <h3>Configurazione .htaccess</h3>
    <div class="code">
      # Se usi rewrite in .htaccess, le chiamate possono essere più semplici:
      fetch('/api/posts/1', {
      headers: { 'Authorization': 'Bearer token' }
      })
    </div>
  </div>

  <script>
    async function testProxyCall() {
      const resultDiv = document.getElementById('api-result');
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = 'Testing...';
      resultDiv.className = 'result warning';

      try {
        const response = await fetch('./proxy.php?path=/posts/1&host=jsonplaceholder.typicode.com', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();

        if (response.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = `
                        <strong>✅ Success!</strong><br>
                        Status: ${response.status}<br>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
        } else {
          resultDiv.className = 'result error';
          resultDiv.innerHTML = `
                        <strong>❌ Error</strong><br>
                        Status: ${response.status}<br>
                        <pre>${JSON.stringify(data, null, 2)}</pre>
                    `;
        }
      } catch (error) {
        resultDiv.className = 'result error';
        resultDiv.innerHTML = `
                    <strong>❌ Network Error</strong><br>
                    ${error.message}
                `;
      }
    }
  </script>
</body>

</html>