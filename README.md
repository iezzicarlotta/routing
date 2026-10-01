# Pokédex · API REST Pokémon

Una piccola applicazione Angular che esplora i Pokémon usando le richieste HTTP GET di [PokéAPI](https://pokeapi.co/). Le categorie disponibili sono **Fuoco**, **Acqua** ed **Erba**; selezionandone una si apre l’elenco completo dei Pokémon, da cui raggiungere la scheda di ogni esemplare.

Non servono backend, database, credenziali o API key. L’app usa i dati pubblici di PokéAPI direttamente dal browser.

## Requisiti e comandi

Servono Node.js 20.19 o successivo, 22.12 o successivo oppure 24 o successivo e npm. Il progetto usa Angular 21, TypeScript 5.9 e Bootstrap 5.3.

```bash
npm install
npm start
```

Apri `http://localhost:4200/`. Per generare la build di produzione:

```bash
npm run build
```

Per eseguire una volta tutti i test Vitest:

```bash
npm test -- --watch=false
```

In Codespaces, esponi il server su `0.0.0.0` e sulla porta 4200:

```bash
npm start -- --host 0.0.0.0 --port 4200
```

Codespaces inoltra la porta; dalla scheda **Porte**, apri il link del browser relativo alla porta 4200. Se la porta è occupata, usa `--port 4201` e apri la porta inoltrata corrispondente.

## Pagine e API

| Route                         | Contenuto                                                                                     |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `/`                           | Reindirizza a `/types`.                                                                       |
| `/types`                      | Mostra Fuoco, Acqua ed Erba presenti nella risposta PokéAPI.                                  |
| `/types/fire`                 | Elenca tutti i Pokémon di tipo Fuoco; sono disponibili anche `/types/water` e `/types/grass`. |
| `/pokemon/pikachu?type=water` | Mostra la scheda di un Pokémon e conserva la categoria d’origine nel link di ritorno.         |
| Qualsiasi altra route         | Mostra la pagina 404. Un tipo o un Pokémon inesistente mostra un messaggio dedicato.          |

Le richieste effettive sono:

- `GET https://pokeapi.co/api/v2/type`
- `GET https://pokeapi.co/api/v2/type/{tipo}/`
- `GET https://pokeapi.co/api/v2/pokemon/{nome-o-id}/`

Ogni categoria mantiene la propria associazione corretta: Fuoco è `fire`, Acqua è `water` ed Erba è `grass`. La lista carica l’associazione tipo–Pokémon in una sola richiesta e la divide in pagine locali da 24 elementi; non esegue una richiesta separata per ogni immagine.

## Struttura del progetto

```text
src/app/
	app.component.*            Shell: navbar, router-outlet e footer
	app.config.ts              HttpClient, router e locale italiana
	app.routes.ts              Route e pagina 404
	features/
		types/                   Tre categorie caricate da PokéAPI
		type-pokemon/            Elenco completo, paginazione e ritorno
		pokemon-detail/          Scheda, abilità, misure e statistiche
		not-found/               Route sconosciute
	models/
		named-api-resource.model.ts
		pokemon-category.model.ts
		pokemon-type.model.ts    Risposte /type e associazioni annidate
		pokemon.model.ts         Pokémon e proprietà annidate utilizzate
	services/
		pokemon-api.service.ts   Le tre richieste HTTP GET tipizzate
```

### Come funziona Angular

- **Componenti standalone e routing.** Le pagine sono componenti autonomi registrati in `app.routes.ts`. `routerLink` e `routerLinkActive` navigano senza ricaricare il documento; `router-outlet` cambia la pagina mantenendo navbar e footer.
- **Parametri.** `ActivatedRoute.paramMap` legge il tipo o il nome del Pokémon. Si osserva il flusso dei parametri, non soltanto il primo valore: Angular può riutilizzare lo stesso componente navigando, per esempio, da Fuoco ad Acqua. Il query parameter `type` conserva la provenienza del dettaglio; aprendolo direttamente, il link torna alle categorie.
- **Servizio e dependency injection.** `PokemonApiService`, fornito a livello applicativo, usa `HttpClient` per le GET e restituisce `Observable` con il modello TypeScript specifico della risposta. `provideHttpClient()` è registrato in `app.config.ts`.
- **Observable e `subscribe`.** Un Observable descrive una risposta che arriverà in futuro. Il componente conserva esplicitamente l’Observable della richiesta; gestori separati, per esempio `onPokemonReceived` e `onPokemonError`, aggiornano i dati e lo stato. Nei `subscribe` i gestori sono riferimenti a funzioni arrow, non callback anonime.
- **Caricamento ed errori.** `isLoading` distingue richiesta in corso, risposta vuota e errore recuperabile. Gli errori vengono gestiti all’interno della singola richiesta: la sottoscrizione ai parametri rimane attiva e il pulsante «Riprova» può emettere una nuova GET.
- **Sottoscrizioni e risposte obsolete.** `switchMap` annulla la GET precedente quando cambia il parametro. `takeUntilDestroyed` chiude le osservazioni della route quando Angular distrugge il componente.
- **Modelli.** `NamedApiResource` descrive gli elementi annidati `{ name, url }`; `PokemonTypeIndexResponse`, `PokemonTypeResponse` e `PokemonTypeAssociation` descrivono indice e associazioni; `PokemonDetail`, tipi, abilità, sprite e statistiche descrivono le proprietà utilizzate nella scheda. Non si usa `any` per le risposte API.
- **Unità.** PokéAPI restituisce l’altezza in decimetri e il peso in ettogrammi. Entrambi vengono divisi per 10 per mostrare metri e chilogrammi; il locale italiano visualizza la virgola decimale.

## Verifica della griglia

- **Lista categorie · 2 punti.** [types.component.ts](src/app/features/types/types.component.ts) carica l’indice API; [types.component.html](src/app/features/types/types.component.html) presenta le tre card italiane.
- **Lista oggetti · 2 punti.** [pokemon-api.service.ts](src/app/services/pokemon-api.service.ts) e [type-pokemon.component.ts](src/app/features/type-pokemon/type-pokemon.component.ts) caricano la lista; la pagina la rende completa e navigabile con paginazione.
- **Dettagli · 1 punto.** [pokemon-detail.component.ts](src/app/features/pokemon-detail/pokemon-detail.component.ts) e [pokemon-detail.component.html](src/app/features/pokemon-detail/pokemon-detail.component.html) mostrano immagine, numero, tipi, misure, abilità e statistiche.
- **Modelli · 2 punti.** Le interfacce sono nei file dedicati [pokemon-type.model.ts](src/app/models/pokemon-type.model.ts), [pokemon.model.ts](src/app/models/pokemon.model.ts), [named-api-resource.model.ts](src/app/models/named-api-resource.model.ts) e [pokemon-category.model.ts](src/app/models/pokemon-category.model.ts).
- **Commit descrittivi · 1 punto.** Ogni fase ha un commit distinto e verificato su `main`:
  - `c8fa42f chore: inizializza workspace Angular standalone con routing`
  - `8cc90a1 feat: carica categorie Pokémon e modella PokéAPI`
  - `a1a7a68 feat: elenca i Pokémon dei tipi selezionati`
  - `e346b1b feat: mostra i dettagli completi dei Pokémon`
  - `docs: documenta la verifica API REST Pokémon` (documentazione e rifiniture)

## Test

`npm test -- --watch=false` avvia cinque file di test Vitest. I test coprono gli URL HTTP, le tre categorie, la paginazione, i parametri inesistenti, l’annullamento delle richieste obsolete, il retry, l’origine del dettaglio, le conversioni delle misure e il fallback delle immagini.

I dati e le immagini Pokémon provengono da [PokéAPI](https://pokeapi.co/) e dal relativo progetto sprite. La disponibilità delle immagini dipende dal servizio esterno; se entrambe le sprite mancano, la scheda mostra comunque il resto delle informazioni.
