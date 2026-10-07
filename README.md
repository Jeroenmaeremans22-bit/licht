# Licht: afval-app voor Android

Licht helpt je afvallen. Bij de eerste keer openen stelt de app een paar vragen over jou, je werk, je beweging en je gewoontes. Daarmee rekent ze een persoonlijk dagbudget uit, een stapdoel dat rustig opbouwt en tips die bij jou passen.

## Wat de app doet

- **Kennismaking**: leeftijd, lengte, gewicht, doel, werk, woon-werkverkeer, sport, stappen, eetgewoontes en slaap.
- **Dagbudget**: rustverbruik volgens de formule van Mifflin-St Jeor, vermenigvuldigd met je activiteit. Daar gaat een tekort af dat past bij je gekozen tempo (0,25, 0,5 of 0,75 kg per week). Het budget zakt nooit onder 1.500 kcal (man) of 1.200 kcal (vrouw).
- **Beweging**: stappen, actieve calorieën, afstand en trainingen komen uit Health Connect. Dat is de plek waar je gsm, smartwatch en sport-apps hun gegevens samenbrengen. 75% van je actieve calorieën komt bij je budget, omdat trackers vaak wat te hoog schatten.
- **Eten toevoegen**:
  - **Barcode scannen**: de voedingswaarden komen gratis uit Open Food Facts.
  - **Zoeken op naam**: ook via Open Food Facts, met Belgische producten eerst.
  - **Foto van je bord** of een omschrijving (bv. “2 sneetjes met kaas”): wordt ingeschat door Claude. Daarvoor heb je een eigen API-sleutel nodig, zie onderaan.
- **Vandaag**: hoeveel je nog mag eten, je eiwitten, koolhydraten en vetten, je stappen en je maaltijden.
- **Doel**: gewicht bijhouden, doel en tempo aanpassen, vragen opnieuw invullen.

Alles wordt alleen op je gsm bewaard. Er is geen account.

## De app op je gsm zetten via GitHub (de makkelijkste manier)

In deze map zit een opdracht voor GitHub (`.github/workflows/build-apk.yml`). Zet je de code in een GitHub-repository, dan bouwt GitHub de app automatisch, gratis, in ongeveer 15 minuten. Elke nieuwe versie krijg je op dezelfde manier.

Je kunt de app daarna downloaden via deze link:

`https://github.com/<jouw-naam>/<repo>/releases/latest/download/licht.apk`

Open die link op je gsm. Tik daarna op het gedownloade bestand en sta toe dat de app geïnstalleerd wordt.

## De app op je gsm zetten via je computer

Je hebt geen Android Studio nodig. De app wordt gratis in de cloud van Expo gebouwd, en daarna krijg je een installatiebestand (APK) voor je gsm.

1. **Installeer Node.js** (de LTS-versie) via https://nodejs.org.
2. **Pak deze map uit** en open er een terminal in.
   - Windows: open de map in Verkenner, klik in de adresbalk, typ `cmd` en druk op Enter.
   - Mac: rechtsklik op de map › *Nieuwe Terminal bij map*.
3. **Installeer de onderdelen** (dit duurt een paar minuten):
   ```
   npm install
   ```
4. **Maak een gratis account** aan op https://expo.dev/signup en log in:
   ```
   npx eas-cli@latest login
   ```
5. **Laat de app bouwen**:
   ```
   npx eas-cli@latest build --profile preview --platform android
   ```
   - Antwoord **Y** (ja) als gevraagd wordt om een project aan te maken.
   - Antwoord **Y** (ja) als gevraagd wordt om een *keystore* te maken.
   - Het bouwen duurt ongeveer 10 tot 20 minuten. Daarna krijg je een link en een QR-code.
6. **Installeer op je gsm**: scan de QR-code of open de link op je gsm en download het APK-bestand.
   - Open het bestand. Android vraagt eenmalig toestemming om apps uit deze bron te installeren. Geef die toestemming.

## Beweging nauwkeurig meten

1. Open de app en tik op **Koppel Health Connect**, ofwel op het laatste scherm van de kennismaking, ofwel bij **Beweging**.
2. Zet alle toegangen aan: stappen, actieve calorieën, afstand en trainingen.
3. Zorg dat je stappenteller-app ook naar Health Connect schrijft:
   - **Samsung Health**: Instellingen › Health Connect › toegang geven.
   - **Google Fit / Fitbit**: Profiel › Instellingen › Health Connect.
   - **Garmin Connect**: Instellingen › Health Connect.

Op Android 14 en nieuwer zit Health Connect in je instellingen, onder *Beveiliging en privacy*. Op oudere versies installeer je het uit de Play Store.

## Foto's laten inschatten (optioneel)

1. Maak een API-sleutel aan op https://console.anthropic.com/settings/keys en zet er wat tegoed op.
2. Ga in de app naar **Doel › Instellingen** en plak de sleutel.

Een foto inschatten kost meestal minder dan een cent. Barcodes scannen en zoeken werkt ook zonder sleutel.

## Zelf aanpassen

De code staat in `src/`:

| Bestand | Wat |
|---|---|
| `src/calc.ts` | Alle berekeningen: budget, activiteit, stapdoel, tips |
| `src/food.ts` | Open Food Facts en de inschatting door Claude |
| `src/health.ts` | Health Connect |
| `src/store.ts` | Opslag op de gsm |
| `src/theme.ts` | Kleuren en lettertypes |
| `src/app/` | De schermen |

Als je wijzigingen wilt testen zonder telkens opnieuw te bouwen:

1. Bouw één keer een ontwikkelversie:
   ```
   npx eas-cli@latest build --profile development --platform android
   ```
   Installeer die op je gsm.
2. Start daarna op je computer:
   ```
   npx expo start --dev-client
   ```
   Scan de QR-code met de ontwikkelversie op je gsm. Wijzigingen verschijnen dan meteen.

Expo Go werkt niet voor deze app, omdat Health Connect eigen Android-code nodig heeft.

---

Licht is een hulpmiddel, geen medisch advies. Heb je een medische aandoening of ben je zwanger? Overleg dan eerst met je huisarts.
