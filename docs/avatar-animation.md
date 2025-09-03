# Avatar Animation System

## Overview

Sistema di animazione che fa muovere l'avatar dalla challenge appena completata alla challenge successiva sulla mappa. Durante l'animazione, tutte le interazioni dell'utente sono disabilitate per mantenere il focus sull'esperienza visiva.

## Features Implementate

### 1. State Management (`avatarAnimation`)
- `isAnimating`: booleano che indica se l'animazione è attiva
- `fromChallengeId`: ID della challenge di partenza
- `toChallengeId`: ID della challenge di destinazione  
- `progress`: progresso dell'animazione (0-1)
- `duration`: durata in millisecondi (default: 3000ms)

### 2. Animation Flow
1. **Trigger**: Al completamento di una challenge e chiusura della CompletionModal
2. **Setup**: Identificazione challenge successiva disponibile
3. **Animation**: Interpolazione smooth con easing tra posizioni
4. **Completion**: Reset stato e apertura automatica challenge successiva

### 3. Visual Effects
- **Smooth Movement**: Easing quadratico per movimento naturale
- **Glow Effect**: Effetto luminoso blu attorno all'avatar
- **Trail Sparkle**: Animazione di scintille che seguono l'avatar
- **Interaction Block**: Overlay trasparente che previene click durante animazione

### 4. User Experience
- **Auto-Open**: La challenge successiva si apre automaticamente dopo l'animazione
- **Disabled Interactions**: Tutte le interazioni mappa disabilitate durante movimento
- **Visual Feedback**: Cursor "wait" e effetti visivi indicano stato di animazione

## Code Changes

### `types/game.ts`
Aggiunto nuovo campo `avatarAnimation` al GameState:
```typescript
avatarAnimation: {
  isAnimating: boolean;
  fromChallengeId: string | null;
  toChallengeId: string | null;
  progress: number; // 0-1
  duration: number; // milliseconds
};
```

### `hooks/use-game-store.tsx`
- Aggiunto `avatarAnimation` allo stato iniziale
- Implementate funzioni `startAvatarAnimation()` e `stopAvatarAnimation()`
- Loop di animazione con `requestAnimationFrame`

### `components/CompletionModal.tsx`
- Modificato `handleClose()` per triggare animazione quando disponibile
- Check per challenge successiva prima di avviare animazione

### `components/CanvasMap.tsx`
- Aggiornato `getCurrentAvatarPosition()` per interpolazione durante animazione
- Easing quadratico per movimento smooth
- Disabilitazione interazioni durante animazione
- Effetti visivi per stato di animazione

### `index.css`
- Stili per classe `.avatar-animating`
- Keyframes per `avatar-glow` e `trail-sparkle`
- Overlay di blocco interazioni

## Configuration

### Animation Duration
Default: 3000ms (3 secondi)
Modificabile nel parametro della funzione `startAvatarAnimation()`

### Easing Function
Ease-in-out quadratico per movimento naturale:
```javascript
const easeInOutQuad = progress < 0.5 
  ? 2 * progress * progress 
  : 1 - Math.pow(-2 * progress + 2, 2) / 2;
```

### Auto-Open Delay
800ms di ritardo dopo fine animazione prima di aprire challenge successiva

## Edge Cases Handled

1. **Ultima Challenge**: Se completata ultima challenge, nessuna animazione (apre epilogue)
2. **Challenge Mancante**: Controllo esistenza challenge destinazione
3. **Interruzione**: Funzione `stopAvatarAnimation()` per reset manuale
4. **State Cleanup**: Reset completo stato animazione al termine

## Accessibility

- **Reduced Motion**: Le animazioni CSS supportano `@media (prefers-reduced-motion: reduce)`
- **Visual Feedback**: Cursor e overlay chiari indicano stato non-interattivo
- **Non-blocking**: Animazione non interferisce con funzionalità core

## Testing

Per testare l'animazione:
1. Completare una challenge (es: Networking Forest)
2. Chiudere la completion modal cliccando "Continua l'avventura"
3. Osservare movimento avatar verso challenge successiva
4. Verificare apertura automatica nuova challenge

## Future Enhancements

- [ ] Sound effects durante animazione
- [ ] Particle system più complesso
- [ ] Path following lungo strade della mappa
- [ ] Velocità variabile basata su distanza
- [ ] Configurazioni utente per durata animazione
