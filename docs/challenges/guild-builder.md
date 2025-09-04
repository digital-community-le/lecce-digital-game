# Guild Builder 2.0 — La Taverna dei Compagni (final)

## Panoramica

Guild Builder 2.0 è la challenge finale centrata sulla collaborazione di community: il giocatore entra in una taverna virtuale, riceve un requisito di community casuale e deve selezionare una squadra di 3 compagni (tra 6–8 disponibili) che soddisfi il requisito. La scelta corretta rilascia la Gemma dell'Alleanza.

Obiettivi didattici:
- Far conoscere ruoli e competenze tipiche di una community/prodotto
- Stimolare logica di matching e lavoro di squadra
- Promuovere inclusione e scoperta di profili diversi

## Meccanica di gioco

- All'ingresso, il gioco sceglie casualmente un requisito testuale (es. "migliorare la visibilità sui social").
- Vengono mostrati 6–8 avatar pixel-art casuali (estratti da un pool). Ogni avatar ha: nome buffo, ruolo, breve descrizione (1-2 righe) e un'icona.
- Il giocatore seleziona esattamente 3 compagni.
- Solo se la combinazione contiene i ruoli richiesti dalla regola (mapping requisito → ruoli) la challenge è superata e la Gemma dell'Alleanza viene assegnata.
- In caso di fallimento, messaggio di incoraggiamento e possibilità di riprovare con una nuova selezione (stesso requisito o nuovo requisito a scelta di design).
 - In caso di fallimento, mostrare un messaggio di incoraggiamento e consentire di riprovare la stessa challenge con lo stesso requisito; non deve presentare una nuova richiesta. La prova successiva mantiene lo stesso requisito (one-shot), anche se è permesso rimescolare i compagni mostrati per offrire una diversa selezione.

Regole:
- Requisito → set di 3 ruoli validi (ordine non importante).
- Il ruolo del giocatore non conta nella selezione (player è leader/spettatore).

Esempi (non esaustivi):
- Requisito: “Migliorare la visibilità sui social” → Social Media Wizard, Designer, Speaker
- Requisito: “La nostra app ha troppi bug” → Developer, Tester, PM
- Requisito: “Organizzare un evento memorabile” → Organizer, Designer, Speaker
- Requisito: “Nuove idee per il futuro” → Visionary, Newbie, Hacker Creativo

## UX Flow

1. Intro
  - Testo: “In questa taverna riecheggiano voci e missioni. Ogni impresa ha bisogno della squadra giusta: saprai formarla?”
  - CTA: “Scopri la sfida” (apre Schermata Requisito)

2. Schermata Requisito
  - Mostra carta con la sfida (testo + icona pixel-art)
  - CTA: “Forma la gilda” (apre selezione compagni)

3. Selezione Compagni
  - Grid 6–8 avatar (random subset ogni partita)
  - Ogni avatar: avatar pixel, nome, ruolo, breve descrizione
  - L'utente sceglie 3 avatar; bottone “Conferma gilda” abilitato solo a 3 selezioni

4. Esito
  - Successo: messaggio “La tua gilda è pronta! La Gemma dell'Alleanza ora brilla al tuo fianco.” + animazione RPG (flash + sparkle) + rilascia gemma
  - Fallimento: messaggio “Coraggiosa, ma non adatta a questa impresa. Riprova con altri compagni!” → ritorno alla selezione
   - Fallimento: messaggio “Coraggiosa, ma non adatta a questa impresa. Riprova con altri compagni!” → ritorno alla selezione con lo stesso requisito. L'utente può tentare nuovamente finché non ottiene il successo.
  - CTA finale: “Prosegui nel viaggio” (torna alla mappa)

## Requisiti tecnici e assets

- ID challenge: `guild-builder` (sostituisce `networking-forest` nel game-data)
- Gemma rilasciata: `gem-of-alliance` (usare asset esistente `public/assets/images/gem-of-alliance.png`)
- Assets richiesti:
  - 6–10 avatar pixel-art (reuse di quelli esistenti in generated_images o nuovi)
  - Icone/illustrazioni per ogni ruolo (16x16/32x32 pixel)
  - Card art per requisito (small icon + text)
  - Animazione di successo (sprite/particles)

## Dati e struttura (shape)

La sezione seguente descrive i tipi di dati utilizzati nella challenge "Guild Builder 2.0" e il loro scopo. I tipi sono definiti in TypeScript per garantire chiarezza e coerenza.

### Tipi principali

#### Requirement
Rappresenta un requisito che il giocatore deve soddisfare selezionando i compagni giusti.
```typescript
type Requirement = {
  id: string; // Identificativo univoco del requisito
  text: string; // Descrizione testuale del requisito
  roles: string[]; // Ruoli richiesti per soddisfare il requisito
};
```

#### Companion
Rappresenta un compagno selezionabile dal giocatore.
```typescript
type Companion = {
  id: string; // Identificativo univoco del compagno
  name: string; // Nome del compagno
  role: string; // Ruolo del compagno
  description: string; // Breve descrizione del compagno
  avatarUrl: string; // URL dell'avatar pixel-art del compagno
};
```

#### GameRound
Rappresenta un singolo tentativo del giocatore nella challenge.
```typescript
type GameRound = {
  requirementId: string; // ID del requisito attivo
  companionsShown: string[]; // Lista degli ID dei compagni mostrati
  selectedIds: string[]; // Lista degli ID dei compagni selezionati
  result: 'success' | 'failure'; // Esito del tentativo
  attempts: number; // Numero di tentativi effettuati
  timestamp: string; // Timestamp del tentativo
};
```

### Persistenza e sincronizzazione
- **Persistenza locale**: I dati relativi ai tentativi vengono salvati localmente per garantire il ripristino in caso di refresh.
- **Sincronizzazione remota**: In caso di successo, i progressi vengono inviati al backend remoto per aggiornare lo stato del giocatore e la leaderboard.

### Esempio di snippet `game-data.json`

```json
{
  "challenges": [
    {
      "id": "guild-builder",
      "type": "matching-quiz",
      "settings": {
        "roles": ["Developer", "Designer", "Speaker"]
      }
    }
  ]
}
```

## Criteri di accettazione (AC)

AC1 — Intro e flusso:
- L'utente vede intro e può avviare la challenge.

AC2 — Selezione:
- Vengono mostrati 6–8 compagni casuali.
- L'utente può selezionare esattamente 3 compagni; il tasto conferma rimane disabilitato fino a 3 selezioni.

AC3 — Validazione combinazione:
- Il sistema confronta la selezione con il set di ruoli della regola e determina successo/insuccesso.

AC4 — Ricompensa:
- In caso di successo la Gemma dell'Alleanza è assegnata, il gioco salva lo stato e mostra animazione/CTA.

AC5 — No false positives:
- Non è possibile ottenere la gemma con una qualsiasi combinazione; solo le combinazioni valide (matching ruoli) vengono premiate.

AC6 — Accessibilità e UX:
- Tutti i controlli devono essere raggiungibili da tastiera; contrasto sufficiente per testo e bottoni; alt text su immagini.

AC7 — Retry e comportamento one-shot:
- In caso di fallimento, l'utente ritorna alla schermata di selezione con lo stesso requisito e può ritentare; non deve essere mostrata una nuova richiesta. La challenge è considerata "one-shot" nel senso che la requirement non viene sostituita automaticamente da una diversa e una volta completata non può essere rigiocata.

## Testing & edge cases

- Edge: fewer than 3 selectable companions (shouldn't happen) → disable confirm and show error.
- Edge: duplicate roles among companions → valid if roles match requirement roles set (duplicates allowed but matching logic uses set inclusion).
- Random seed: ensure repeatable test cases for automated tests by allowing deterministic seed during test.
 - Edge: duplicate roles among companions → valid if roles match requirement roles set (duplicates allowed but matching logic uses set inclusion).
 - Edge: retry flow — assicurarsi che lo stato della requirement rimanga invariato tra i tentativi (requirementId non cambia) e che il conteggio `attempts` aumenti correttamente; non creare una nuova GameRound o requirement quando l'utente fallisce e riprova.
 - Random seed: ensure repeatable test cases for automated tests by allowing deterministic seed during test.

## Integrazione con mappa e modal flow

- Sostituire `networking-forest` con `guild-builder` nel `game-data.json` e nelle rotte/componenti.
- La CompletionModal (quando la gemma `gem-of-alliance` è rilasciata) deve usare lo stesso flusso già esistente: mostrare modale di completion e scrivere `pendingAvatarAnimation` verso la challenge successiva (se prevista).