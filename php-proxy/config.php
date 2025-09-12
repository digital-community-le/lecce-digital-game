<?php

/**
 * Configurazione del proxy PHP per API calls
 * 
 * @author Mattia Mancarella
 * @date 2025-09-11
 */

return [
  // Host consentiti (whitelist per sicurezza SSRF)
  'allowed_hosts' => [
    'api.devfest.gdglecce.it', // Solo hostname, senza schema
    'jsonplaceholder.typicode.com', // esempio per test
    // Aggiungi qui gli host delle tue API
  ],

  // Configurazione CORS
  'cors' => [
    'allow_origin' => 'https://lecce-digital-legends.web.app', // Rimosso trailing slash
    'allow_methods' => 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
    'allow_headers' => 'Content-Type,Authorization,Accept,X-Requested-With',
    'allow_credentials' => 'true',
  ],

  // Timeout per le richieste
  'timeout' => 30,

  // Debug mode (true solo in sviluppo)
  'debug' => true,

  // Default target API
  'default_target' => [
    'scheme' => 'https',
    'host' => 'api.devfest.gdglecce.it', // Solo hostname
  ],
];
