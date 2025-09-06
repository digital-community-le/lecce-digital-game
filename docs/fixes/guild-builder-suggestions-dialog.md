# Guild Builder - Sistema di Suggerimenti con Dialog

## Panoramica

Il componente Guild Builder è stato aggiornato per mostrare suggerimenti personalizzati ai giocatori quando commettono errori nella selezione della squadra. I suggerimenti vengono ora mostrati in un dialog modale per una migliore esperienza utente.

## Funzionalità Implementate

### 1. Dialog Modale per Suggerimenti

- Utilizza il componente `UiDialog` per mostrare suggerimenti in una finestra modale
- Styling NES.css per mantenere coerenza con il tema retro del gioco
- Accessibilità migliorata con attributi ARIA appropriati

### 2. Suggerimenti Singoli

- Viene mostrato **un solo suggerimento** per volta, non tutti contemporaneamente
- Il suggerimento riguarda il **primo ruolo errato** trovato nella selezione
- Ogni suggerimento è specifico e contestuale al requisito della quest

### 3. Logica dei Suggerimenti

La funzione `getSuggestion()` fornisce suggerimenti basati su:
- **Ruolo errato selezionato**: Il ruolo che non soddisfa il requisito
- **Ruoli richiesti**: I ruoli necessari per completare la quest
- **Testo della quest**: Contesto per suggerimenti più specifici

### 4. Gestione dello Stato

```typescript
const [showSuggestionDialog, setShowSuggestionDialog] = useState(false);
const [currentSuggestion, setCurrentSuggestion] = useState<string>('');
```

## Comportamenti Implementati

### Apertura del Dialog
- Quando il giocatore seleziona una squadra errata e conferma
- Viene mostrato un suggerimento per il primo ruolo errato
- Il dialog ha il titolo "💡 Suggerimento"

### Chiusura del Dialog
Il dialog si chiude automaticamente quando:
1. L'utente clicca "Ho capito!"
2. L'utente cambia la selezione di un compagno
3. L'utente clicca "Ricomincia"
4. L'utente completa con successo la challenge
5. L'utente clicca fuori dal dialog (comportamento nativo di UiDialog)
6. L'utente preme Escape (comportamento nativo di UiDialog)

## Esempi di Suggerimenti

### Per ruoli specifici:

**Developer errato:**
> "Hai scelto un Developer in gamba, ma purtroppo non può esserti utile per questa missione. Sicuramente un Social Media Wizard sarebbe più adatto per gestire la visibilità sui social."

**Tester errato:**
> "Hai scelto un Tester di talento, ma per questa quest avresti bisogno di competenze diverse. Prova con un altro profilo!"

### Mapping dei suggerimenti:

La logica include mappature specifiche per ogni combinazione di ruolo errato vs ruolo richiesto:

- **Developer** → Social Media Wizard: "per gestire la visibilità sui social"
- **Designer** → Developer: "per risolvere problemi tecnici e bug" 
- **Tester** → Speaker: "per presentare il progetto"
- E così via...

## Struttura del Dialog

```tsx
<UiDialog
  open={showSuggestionDialog}
  onClose={handleCloseSuggestion}
  title="💡 Suggerimento"
  rounded={true}
  ariaLabelledBy="suggestion-dialog-title"
  ariaDescribedBy="suggestion-dialog-content"
>
  <div id="suggestion-dialog-content">
    <p className="text-sm mb-4" style={{ color: '#856404' }}>
      {currentSuggestion}
    </p>
    <div className="text-center">
      <button className="nes-btn is-primary" onClick={handleCloseSuggestion}>
        Ho capito!
      </button>
    </div>
  </div>
</UiDialog>
```

## Test e Validazione

### Test Manuali da Effettuare:

1. **Selezione errata**: Verificare che il dialog appaia con il suggerimento corretto
2. **Selezione corretta**: Verificare che il dialog non appaia 
3. **Chiusura automatica**: Verificare che il dialog si chiuda quando si cambia selezione
4. **Riavvio**: Verificare che il dialog si chiuda quando si riavvia la challenge
5. **Accessibilità**: Testare navigazione con tastiera e screen reader

### Esecuzione Test:

```javascript
// Nella console del browser:
testGuildBuilderSuggestions(); // Testa la logica dei suggerimenti
testGuildBuilderDialogState(); // Testa la gestione dello stato del dialog
```

## Benefici dell'Implementazione

1. **UX Migliorata**: Dialog modale più prominente e meno invasivo
2. **Focalizzazione**: Un suggerimento alla volta riduce il sovraccarico cognitivo
3. **Accessibilità**: Attributi ARIA e gestione del focus appropriata
4. **Consistenza**: Utilizza componenti esistenti del design system
5. **Usabilità**: Chiusura automatica quando l'utente agisce

## File Modificati

- `client/src/components/challenges/GuildBuilder.tsx` - Implementazione principale
- `client/src/components/challenges/__tests__/GuildBuilder.test.tsx` - Test manuali aggiornati
- `docs/challenges/guild-builder.md` - Documentazione della challenge aggiornata

## Note Tecniche

- La funzione `getSuggestion()` è esportata per facilitare il testing
- Il dialog utilizza il sistema di form NES.css con `method="dialog"`
- Lo stato del dialog viene gestito tramite React hooks locali
- La chiusura del dialog resetta anche il suggerimento corrente per ottimizzare la memoria
