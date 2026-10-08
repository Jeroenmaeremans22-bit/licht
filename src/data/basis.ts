// Ingebouwde lijst met gewone voedingsmiddelen en Belgische gerechten.
// Gemiddelde waarden per 100 g (of 100 ml), gebaseerd op gangbare voedingstabellen
// (NEVO, USDA). Werkt zonder internet.
//
// Kolommen: naam, kcal, eiwit, koolhydraten, vet, vezels, standaardportie in g,
//           omschrijving van de portie (of null), telbaar (true = stapjes per stuk), zoekwoorden

type Row = [string, number, number, number, number, number, number, string | null, boolean, string?];

export const BASIS: Row[] = [
  // Fruit
  ['Appel', 52, 0.3, 12, 0.2, 2.2, 150, '1 appel', true, 'fruit'],
  ['Banaan', 89, 1.1, 20, 0.3, 2.6, 120, '1 banaan', true, 'fruit'],
  ['Peer', 57, 0.4, 12, 0.1, 3.1, 160, '1 peer', true, 'fruit'],
  ['Sinaasappel', 47, 0.9, 9.4, 0.1, 2.4, 150, '1 sinaasappel', true, 'appelsien fruit'],
  ['Mandarijn', 53, 0.8, 12, 0.3, 1.8, 70, '1 mandarijn', true, 'clementine fruit'],
  ['Kiwi', 61, 1.1, 12, 0.5, 3, 75, '1 kiwi', true, 'fruit'],
  ['Druiven', 69, 0.7, 16, 0.2, 0.9, 100, null, false, 'fruit'],
  ['Aardbeien', 32, 0.7, 6, 0.3, 2, 150, null, false, 'fruit'],
  ['Blauwe bessen', 57, 0.7, 12, 0.3, 2.4, 100, null, false, 'bosbessen fruit'],
  ['Frambozen', 52, 1.2, 5.4, 0.7, 6.5, 100, null, false, 'fruit'],
  ['Ananas', 50, 0.5, 12, 0.1, 1.4, 150, null, false, 'fruit'],
  ['Mango', 60, 0.8, 14, 0.4, 1.6, 150, null, false, 'fruit'],
  ['Meloen', 34, 0.8, 8, 0.2, 0.9, 200, null, false, 'fruit'],
  ['Watermeloen', 30, 0.6, 7.5, 0.2, 0.4, 250, null, false, 'fruit'],
  ['Perzik', 39, 0.9, 8.5, 0.3, 1.5, 150, '1 perzik', true, 'fruit nectarine'],
  ['Pruim', 46, 0.7, 10, 0.3, 1.4, 60, '1 pruim', true, 'fruit'],
  ['Avocado', 160, 2, 1.8, 14.7, 6.7, 70, '½ avocado', true, 'fruit'],
  ['Rozijnen', 299, 3, 70, 0.5, 3.7, 30, null, false, 'gedroogd fruit'],
  ['Dadels', 282, 2.5, 67, 0.4, 8, 30, null, false, 'gedroogd fruit'],

  // Groenten
  ['Tomaat', 18, 0.9, 2.6, 0.2, 1.2, 100, '1 tomaat', true, 'groenten'],
  ['Komkommer', 15, 0.7, 2.2, 0.1, 0.5, 100, null, false, 'groenten'],
  ['Sla', 15, 1.4, 1.5, 0.2, 1.3, 50, null, false, 'groenten salade'],
  ['Wortelen rauw', 41, 0.9, 7, 0.2, 2.8, 100, null, false, 'groenten wortel'],
  ['Wortelen gekookt', 35, 0.8, 6, 0.2, 3, 150, null, false, 'groenten wortel'],
  ['Broccoli gekookt', 35, 2.4, 4, 0.4, 3.3, 150, null, false, 'groenten'],
  ['Bloemkool gekookt', 23, 1.8, 2.5, 0.5, 2.3, 150, null, false, 'groenten'],
  ['Spinazie gekookt', 23, 3, 1, 0.3, 2.4, 150, null, false, 'groenten'],
  ['Paprika', 28, 1, 4.5, 0.3, 2.1, 100, null, false, 'groenten'],
  ['Ui', 40, 1.1, 7.6, 0.1, 1.7, 50, null, false, 'groenten ajuin'],
  ['Champignons', 22, 3.1, 0.5, 0.3, 1, 100, null, false, 'groenten paddenstoelen'],
  ['Courgette', 17, 1.2, 2.4, 0.3, 1, 150, null, false, 'groenten'],
  ['Prei gekookt', 31, 1.5, 4.5, 0.3, 2.8, 150, null, false, 'groenten look'],
  ['Boontjes gekookt', 35, 1.9, 5, 0.3, 3.2, 150, null, false, 'groenten sperziebonen princessebonen'],
  ['Erwten gekookt', 78, 5.4, 10, 0.4, 5.5, 100, null, false, 'groenten erwtjes'],
  ['Witloof', 17, 1, 2.3, 0.1, 1.5, 150, null, false, 'groenten witlof chicon'],
  ['Spruitjes gekookt', 36, 2.6, 4.5, 0.5, 2.6, 150, null, false, 'groenten'],
  ['Maïs (blik)', 81, 2.9, 14, 1.2, 2, 80, null, false, 'groenten mais'],
  ['Rode biet gekookt', 44, 1.7, 8, 0.2, 2, 100, null, false, 'groenten'],
  ['Groentesoep', 30, 1, 4, 1, 1, 250, '1 kom', true, 'soep'],
  ['Tomatensoep', 35, 1, 5, 1.2, 0.7, 250, '1 kom', true, 'soep'],

  // Aardappelen, granen en ontbijt
  ['Aardappelen gekookt', 80, 1.9, 17, 0.1, 1.8, 200, null, false, 'patatten'],
  ['Puree', 95, 2, 14, 3.5, 1.2, 200, null, false, 'aardappelpuree'],
  ['Frieten (frituur)', 300, 3.4, 38, 15, 3.8, 180, 'kleine portie', true, 'friet frietjes patat fritten'],
  ['Ovenfrietjes', 190, 3, 27, 7, 2.7, 150, null, false, 'friet frietjes'],
  ['Kroketten', 190, 3, 24, 9, 2, 25, '1 kroket', true, 'aardappelkroket'],
  ['Rijst gekookt', 130, 2.7, 28, 0.3, 0.4, 180, null, false, 'witte rijst'],
  ['Volkorenrijst gekookt', 123, 2.7, 25.6, 1, 1.6, 180, null, false, 'bruine rijst'],
  ['Rijst ongekookt', 350, 7, 77, 0.6, 1.3, 75, null, false, 'droge rijst'],
  ['Pasta gekookt', 150, 5.5, 30, 0.9, 1.8, 200, null, false, 'spaghetti macaroni penne deegwaren'],
  ['Volkorenpasta gekookt', 140, 5.5, 26, 1.1, 4, 200, null, false, 'spaghetti deegwaren'],
  ['Pasta ongekookt', 355, 12, 71, 1.5, 3, 80, null, false, 'droge pasta deegwaren'],
  ['Couscous gekookt', 112, 3.8, 23, 0.2, 1.4, 180, null, false, ''],
  ['Quinoa gekookt', 120, 4.4, 21, 1.9, 2.8, 180, null, false, ''],
  ['Havermout', 370, 13, 59, 7, 10, 50, null, false, 'havervlokken pap ontbijt'],
  ['Muesli', 365, 9, 62, 6, 7, 50, null, false, 'ontbijtgranen'],
  ['Granola', 450, 9, 60, 18, 7, 50, null, false, 'krokante muesli ontbijtgranen'],
  ['Cornflakes', 375, 7, 84, 0.9, 3, 30, null, false, 'ontbijtgranen'],

  // Brood en gebak
  ['Wit brood', 250, 8.5, 47, 2.5, 2.7, 30, '1 snee', true, 'boterham'],
  ['Bruin brood', 240, 9, 43, 3, 5, 33, '1 snee', true, 'boterham grijs brood'],
  ['Volkorenbrood', 230, 10, 38, 3.3, 7, 35, '1 snee', true, 'boterham volkoren'],
  ['Meergranenbrood', 250, 10, 38, 5, 6, 35, '1 snee', true, 'boterham granen'],
  ['Stokbrood', 270, 9, 53, 1.5, 2.5, 60, '¼ stokbrood', true, 'baguette'],
  ['Pistolet', 270, 9, 54, 2, 2.5, 55, '1 pistolet', true, 'broodje piccolo'],
  ['Sandwich (zacht broodje)', 300, 9, 50, 7, 2, 40, '1 sandwich', true, 'broodje'],
  ['Croissant', 410, 8, 45, 21, 2.5, 55, '1 croissant', true, 'koffiekoek'],
  ['Chocoladekoek', 420, 7.5, 45, 23, 2.5, 70, '1 koek', true, 'koffiekoek pain au chocolat'],
  ['Beschuit', 410, 10, 76, 7, 4, 10, '1 beschuit', true, ''],
  ['Wrap', 300, 8, 50, 7, 3, 60, '1 wrap', true, 'tortilla'],
  ['Rijstwafel', 380, 8, 80, 2.8, 2.4, 8, '1 rijstwafel', true, ''],
  ['Cake', 400, 6, 50, 20, 1, 40, '1 plak', true, 'koek'],
  ['Fruittaart', 250, 3.5, 35, 11, 1.5, 120, '1 punt', true, 'taart gebak'],
  ['Luikse wafel', 430, 6, 52, 22, 1.5, 90, '1 wafel', true, 'suikerwafel'],

  // Beleg
  ['Boter', 740, 0.6, 0.6, 82, 0, 5, '1 boterham besmeren', true, 'smeren'],
  ['Halvarine', 360, 0, 0.5, 40, 0, 5, '1 boterham besmeren', true, 'margarine light smeren'],
  ['Choco', 540, 6, 57, 31, 3.4, 15, '1 boterham', true, 'chocopasta nutella hazelnootpasta'],
  ['Confituur', 240, 0.4, 60, 0.1, 1, 15, '1 boterham', true, 'jam konfituur'],
  ['Honing', 320, 0.3, 81, 0, 0, 7, '1 koffielepel', true, ''],
  ['Pindakaas', 600, 25, 14, 50, 6, 15, '1 boterham', true, 'pindanoten'],
  ['Speculoospasta', 585, 2.8, 57, 38, 1.4, 15, '1 boterham', true, 'speculoos smeerpasta'],
  ['Hagelslag', 470, 4.5, 70, 19, 4, 15, '1 boterham', true, 'chocoladehagel muisjes'],
  ['Kaas (Gouda)', 360, 24, 0, 29, 0, 20, '1 sneetje', true, 'jonge kaas belegen'],
  ['Kaas light (30+)', 265, 30, 0, 16, 0, 20, '1 sneetje', true, 'magere kaas'],
  ['Brie', 330, 21, 0.5, 27, 0, 30, null, false, 'kaas camembert'],
  ['Smeerkaas', 240, 6, 4, 22, 0, 20, '1 boterham', true, 'roomkaas philadelphia'],
  ['Hesp', 110, 19, 1, 3.5, 0, 20, '1 sneetje', true, 'ham gekookte hesp'],
  ['Kipfilet (beleg)', 105, 21, 1, 2, 0, 15, '1 sneetje', true, 'kip'],
  ['Salami', 400, 22, 1, 34, 0, 10, '1 sneetje', true, 'worst'],
  ['Préparé', 230, 13, 2, 19, 0, 30, '1 boterham', true, 'filet americain prepare'],
  ['Paté', 300, 12, 3, 27, 0, 20, '1 boterham', true, 'pate'],
  ['Tonijnsalade', 220, 12, 3, 18, 0, 30, '1 boterham', true, 'tonijn'],

  // Eieren en zuivel
  ['Ei gekookt', 140, 12.5, 0.6, 9.7, 0, 55, '1 ei', true, 'eitje eieren'],
  ['Ei gebakken', 190, 13.5, 0.8, 15, 0, 55, '1 ei', true, 'spiegelei eieren'],
  ['Omelet', 155, 11, 1, 12, 0, 120, '2 eieren', true, 'eieren roerei'],
  ['Melk halfvol', 46, 3.4, 4.7, 1.6, 0, 200, '1 glas', true, ''],
  ['Melk volle', 63, 3.3, 4.6, 3.6, 0, 200, '1 glas', true, ''],
  ['Melk mager', 34, 3.5, 4.8, 0.1, 0, 200, '1 glas', true, ''],
  ['Chocomelk', 70, 3.4, 10, 2.1, 0.5, 200, '1 glas', true, 'cecemel chocolademelk'],
  ['Yoghurt natuur', 60, 3.8, 4.6, 3, 0, 125, '1 potje', true, 'yoghourt'],
  ['Yoghurt mager', 40, 4.2, 5.3, 0.1, 0, 125, '1 potje', true, 'yoghourt'],
  ['Griekse yoghurt', 125, 4.5, 4, 10, 0, 150, null, false, 'yoghourt'],
  ['Griekse yoghurt 0%', 57, 10, 3.6, 0.4, 0, 150, null, false, 'yoghourt'],
  ['Skyr', 63, 11, 4, 0.2, 0, 150, null, false, 'yoghourt'],
  ['Platte kaas mager', 48, 8.5, 3.5, 0.1, 0, 150, null, false, 'plattekaas kwark'],
  ['Pudding', 105, 3.2, 16, 3, 0, 125, '1 potje', true, 'vla dessert'],
  ['Slagroom', 340, 2, 3, 35, 0, 20, null, false, 'room'],

  // Vlees, vis en vegetarisch
  ['Kipfilet gebakken', 160, 31, 0, 3.6, 0, 125, null, false, 'kip kippenborst'],
  ['Kippenbout', 220, 25, 0, 13, 0, 110, '1 bout', true, 'kip'],
  ['Gehakt gebakken', 260, 24, 0, 18, 0, 125, null, false, 'half-om-half vlees'],
  ['Rundsgehakt mager gebakken', 220, 27, 0, 12, 0, 125, null, false, 'vlees'],
  ['Steak gebakken', 180, 29, 0, 7, 0, 160, '1 steak', true, 'biefstuk rundvlees'],
  ['Varkenskotelet', 230, 28, 0, 13, 0, 130, '1 kotelet', true, 'vlees'],
  ['Spekblokjes gebakken', 400, 17, 0, 37, 0, 30, null, false, 'spek lardons'],
  ['Braadworst', 290, 14, 2, 25, 0, 100, '1 worst', true, 'worst'],
  ['Frikandel', 265, 11.5, 7, 21, 0.5, 70, '1 frikandel', true, 'frituur'],
  ['Kipnuggets', 280, 15, 17, 17, 1, 18, '1 nugget', true, 'kip'],
  ['Hamburger (vlees)', 250, 20, 4, 17, 0, 100, '1 burger', true, 'vlees'],
  ['Zalm gebakken', 210, 22, 0, 13, 0, 125, '1 filet', true, 'vis'],
  ['Kabeljauw', 105, 23, 0, 0.9, 0, 125, '1 filet', true, 'vis'],
  ['Tonijn in water', 110, 25, 0, 1, 0, 110, '1 blikje', true, 'vis'],
  ['Grijze garnalen', 95, 20, 0, 1.5, 0, 50, null, false, 'vis scampi'],
  ['Mosselen', 140, 20, 5, 4, 0, 250, '1 kilo met schelp', true, 'mossels'],
  ['Vissticks', 200, 13, 17, 9, 1, 28, '1 visstick', true, 'vis'],
  ['Tofu', 120, 13, 1.5, 7, 1, 100, null, false, 'vegetarisch'],
  ['Kikkererwten (blik)', 120, 7, 16, 2.5, 6, 100, null, false, 'peulvruchten'],
  ['Linzen gekookt', 115, 9, 17, 0.4, 8, 150, null, false, 'peulvruchten'],
  ['Bruine bonen (blik)', 100, 7, 14, 0.5, 6, 100, null, false, 'peulvruchten'],
  ['Hummus', 280, 7, 12, 23, 6, 30, null, false, 'houmous'],

  // Gerechten
  ['Spaghetti bolognese', 140, 7, 18, 4.5, 1.5, 400, '1 bord', true, 'pasta'],
  ['Lasagne', 150, 8, 13, 7, 1, 350, '1 portie', true, 'pasta'],
  ['Pizza margherita', 250, 11, 30, 9, 2, 100, '1 punt', true, ''],
  ['Stoofvlees', 160, 16, 6, 7, 0.5, 250, '1 portie', true, 'stoverij carbonade'],
  ['Vol-au-vent', 150, 9, 6, 10, 0.3, 300, '1 portie', true, 'koninginnenhapje'],
  ['Balletjes in tomatensaus', 140, 9, 8, 8, 1, 300, '1 portie', true, 'gehaktballen'],
  ['Stoemp', 100, 2.5, 12, 4.5, 2, 300, '1 portie', true, 'puree groenten'],
  ['Waterzooi', 90, 8, 5, 4.5, 1, 350, '1 kom', true, 'kip soep'],
  ['Witloof met hesp en kaassaus', 115, 7, 4, 8, 1, 350, '1 portie', true, 'witlof gratin'],
  ['Croque monsieur', 260, 13, 22, 13, 1.5, 150, '1 croque', true, 'tosti'],
  ['Broodje smos (kaas en hesp)', 230, 11, 27, 9, 2, 250, '1 broodje', true, 'belegd broodje'],
  ['Pita kip', 200, 12, 20, 8, 2, 300, '1 pita', true, 'durum kebab'],
  ['Cheeseburger (fastfood)', 260, 13, 27, 11, 1.5, 115, '1 burger', true, 'hamburger'],

  // Noten en snacks
  ['Walnoten', 690, 15, 7, 68, 6.7, 25, '1 handje', true, 'noten'],
  ['Amandelen', 600, 21, 7, 52, 12, 25, '1 handje', true, 'noten'],
  ['Cashewnoten', 600, 18, 27, 48, 3, 25, '1 handje', true, 'noten'],
  ['Pinda’s', 620, 26, 10, 52, 8, 25, '1 handje', true, 'nootjes borrelnootjes'],
  ['Gemengde noten', 620, 18, 12, 55, 7, 25, '1 handje', true, 'notenmix'],
  ['Chips', 535, 6, 50, 34, 4, 40, '1 zakje', true, 'paprika naturel'],
  ['Popcorn zout', 500, 9, 55, 27, 10, 30, null, false, ''],
  ['Melkchocolade', 540, 7, 57, 31, 2, 25, '1 rij', true, 'chocolade'],
  ['Pure chocolade', 580, 8, 34, 43, 11, 20, '2 stukjes', true, 'chocolade fondant'],
  ['Speculoos', 480, 5.5, 72, 19, 1.5, 6, '1 koekje', true, 'koekje'],
  ['Chocoladekoekje', 470, 6, 68, 19, 3, 13, '1 koekje', true, 'koek'],
  ['Mueslireep', 400, 6, 65, 12, 5, 25, '1 reep', true, 'graanreep'],
  ['Roomijs', 200, 3.5, 24, 10, 0.5, 50, '1 bol', true, 'ijs ijsje'],
  ['Snoep (gummies)', 340, 6, 77, 0.5, 0, 25, '1 handje', true, 'snoepjes winegums'],

  // Dranken (per 100 ml)
  ['Cola', 42, 0, 10.6, 0, 0, 330, '1 blikje', true, 'frisdrank'],
  ['Cola zero', 0.3, 0, 0, 0, 0, 330, '1 blikje', true, 'frisdrank light'],
  ['Frisdrank (gemiddeld)', 40, 0, 10, 0, 0, 330, '1 blikje', true, 'limonade fanta sprite ice tea'],
  ['Sinaasappelsap', 45, 0.7, 10, 0.2, 0.2, 200, '1 glas', true, 'fruitsap appelsiensap'],
  ['Appelsap', 46, 0.1, 11, 0.1, 0, 200, '1 glas', true, 'fruitsap'],
  ['Smoothie', 55, 0.8, 12, 0.3, 1, 250, '1 flesje', true, ''],
  ['Energiedrank', 45, 0, 11, 0, 0, 250, '1 blikje', true, 'red bull'],
  ['Bier (pils)', 42, 0.4, 3, 0, 0, 250, '1 pintje', true, 'pint pintje jupiler stella maes'],
  ['Bier (zwaar, 8%)', 75, 0.6, 6, 0, 0, 330, '1 flesje', true, 'trappist tripel duvel'],
  ['Wijn rood', 85, 0.1, 2.6, 0, 0, 150, '1 glas', true, ''],
  ['Wijn wit', 82, 0.1, 2.6, 0, 0, 150, '1 glas', true, ''],
  ['Cava', 75, 0.2, 1.5, 0, 0, 150, '1 glas', true, 'bubbels champagne prosecco'],
  ['Koffie zwart', 2, 0.1, 0, 0, 0, 150, '1 tas', true, ''],
  ['Cappuccino', 35, 2, 3, 1.8, 0, 200, '1 tas', true, 'koffie met melk latte'],
  ['Thee', 1, 0, 0.2, 0, 0, 200, '1 tas', true, ''],

  // Sauzen, vet en suiker
  ['Mayonaise', 720, 1.3, 1.5, 79, 0, 20, '1 potje frituur', true, 'mayo'],
  ['Ketchup', 110, 1.2, 25, 0.1, 0.5, 15, '1 lepel', true, 'tomatenketchup'],
  ['Curryketchup', 120, 1.2, 27, 0.3, 0.5, 15, '1 lepel', true, ''],
  ['Andalouse', 500, 1, 9, 51, 0.5, 20, '1 potje frituur', true, 'saus'],
  ['Samouraïsaus', 510, 1, 8, 52, 0.5, 20, '1 potje frituur', true, 'samourai saus'],
  ['Vinaigrette', 400, 0.5, 5, 42, 0, 15, '1 lepel', true, 'dressing'],
  ['Pesto', 450, 5, 5, 45, 1.5, 15, '1 lepel', true, 'saus'],
  ['Olijfolie', 900, 0, 0, 100, 0, 10, '1 eetlepel', true, 'olie bakken'],
  ['Suiker', 400, 0, 100, 0, 0, 4, '1 klontje', true, 'suikerklontje'],
];

const strip = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ');

export interface BasisItem {
  name: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  grams: number;
  label: string | null;
  countable: boolean;
}

const INDEX = BASIS.map((r) => ({
  item: {
    name: r[0],
    kcal: r[1],
    protein: r[2],
    carbs: r[3],
    fat: r[4],
    fiber: r[5],
    grams: r[6],
    label: r[7],
    countable: r[8],
  } as BasisItem,
  name: strip(r[0]),
  words: strip(`${r[0]} ${r[9] ?? ''}`).split(/\s+/).filter(Boolean),
}));

/** Zoekt in de ingebouwde lijst. Elk zoekwoord moet het begin van een woord zijn. */
export function searchBasis(query: string, limit = 8): BasisItem[] {
  const q = strip(query).split(/\s+/).filter((w) => w.length > 0);
  if (q.length === 0) return [];
  const scored = INDEX.map((e) => {
    let score = 0;
    for (const w of q) {
      if (e.words.some((x) => x.startsWith(w))) continue;
      // Midden in een woord alleen voor langere zoekwoorden (bv. "kaas" in "smeerkaas").
      if (w.length >= 4 && e.words.some((x) => x.endsWith(w))) {
        score += 2;
        continue;
      }
      return null;
    }
    score += (e.name.startsWith(q[0]) ? 0 : 1) + (e.name === q.join(' ') ? -1 : 0);
    return { e, score };
  }).filter((x): x is { e: (typeof INDEX)[number]; score: number } => x !== null);
  scored.sort((a, b) => a.score - b.score || a.e.name.length - b.e.name.length);
  return scored.slice(0, limit).map((s) => s.e.item);
}
