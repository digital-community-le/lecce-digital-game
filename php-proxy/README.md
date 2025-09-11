# PHP Proxy per API calls

Questo proxy PHP permette di aggirare i problemi CORS nelle chiamate API dal browser.

## Struttura

- `config.php` - Configurazione centralizzata
- `proxy.php` - Script principale del proxy
- `README.md` - Questa documentazione

## Configurazione

Modifica `config.php` per:

1. **Whitelist degli host consentiti**:

   ```php
   'allowed_hosts' => [
       'api.devfest-lecce.example.com',
       'api.altro-servizio.com',
   ],
   ```

2. **CORS origin** (imposta l'URL del tuo frontend):

   ```php
   'cors' => [
       'allow_origin' => 'http://localhost:5173', // dev
       // 'allow_origin' => 'https://tuodominio.com', // production
   ],
   ```

3. **Host di default** per le API:
   ```php
   'default_target' => [
       'scheme' => 'https',
       'host' => 'api.devfest-lecce.example.com',
   ],
   ```

## Utilizzo

### URL del proxy

```
https://tuoserver.com/php-proxy/proxy.php
```

### Parametri query supportati

- `path` (required) - Endpoint dell'API (es. `/v1/users`)
- `host` (optional) - Host target se diverso dal default
- `scheme` (optional) - Scheme se diverso dal default (https)

### Esempi di chiamate

#### GET request

```javascript
fetch(
  'https://tuoserver.com/php-proxy/proxy.php?path=/v1/users&host=api.example.com',
  {
    method: 'GET',
    headers: {
      Authorization: 'Bearer your-token-here',
      'Content-Type': 'application/json',
    },
  }
);
```

#### POST request

```javascript
fetch('https://tuoserver.com/php-proxy/proxy.php?path=/v1/users', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer your-token-here',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'Mario Rossi',
    email: 'mario@example.com',
  }),
});
```

#### Con host custom

```javascript
fetch(
  'https://tuoserver.com/php-proxy/proxy.php?path=/api/data&host=api.altro-servizio.com',
  {
    method: 'GET',
    headers: {
      Authorization: 'Bearer your-token-here',
    },
  }
);
```

## Headers supportati

Il proxy inoltra automaticamente tutti gli headers della richiesta, inclusi:

- `Authorization` - Bearer token, API keys, etc.
- `Content-Type` - Per body JSON, form-data, etc.
- `Accept` - Tipo di risposta richiesta
- Headers custom del tuo client

## Sicurezza

### Protezione SSRF

- Solo gli host in whitelist (`allowed_hosts`) sono consentiti
- Validazione rigorosa dei parametri di input
- Timeout configurabile per evitare hanging requests

### CORS

- Origin specifico configurabile (evita wildcard `*`)
- Headers consentiti limitati ai necessari
- Gestione corretta del preflight OPTIONS

### Logging

- Debug mode per development (disabilitare in production)
- Log degli errori per troubleshooting
- Non logga mai token/credentials per sicurezza

## Configurazione Apache

Se hai modificato `.htaccess` per rewrite automatico:

```apache
# Rewrite /api/* verso il proxy
RewriteRule ^api/(.*)$ /php-proxy/proxy.php?path=/$1 [L,QSA]
```

Così puoi chiamare direttamente:

```javascript
fetch('/api/v1/users', {
  headers: { Authorization: 'Bearer token' },
});
```

## Troubleshooting

### Errori comuni

1. **"Host non consentito"**
   - Aggiungi l'host in `config.php` → `allowed_hosts`

2. **CORS errors**
   - Verifica `allow_origin` in `config.php`
   - Controlla che Apache abbia mod_headers abilitato

3. **Timeout**
   - Aumenta il valore in `config.php` → `timeout`

4. **500 Internal Server Error**
   - Controlla PHP error log
   - Abilita `debug => true` in config.php

### Debug

Abilita debug mode in `config.php`:

```php
'debug' => true,
```

Controlla i log PHP per messaggi dettagliati con prefisso `[PROXY DEBUG]`.

## Deployment

### Development

- URL: `http://localhost/php-proxy/proxy.php`
- Debug: abilitato
- CORS: `http://localhost:5173`

### Production

- URL: `https://tuodominio.com/php-proxy/proxy.php`
- Debug: disabilitato (`'debug' => false`)
- CORS: URL production del frontend
- HTTPS: obbligatorio per Bearer tokens

## Estensioni future

- Cache delle risposte per migliorare performance
- Rate limiting per prevenire abuse
- Autenticazione del proxy stesso (API key)
- Support per file uploads/multipart
