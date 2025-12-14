/**
 * Deutsche Städte für AVM Standortauswahl
 * Sortiert nach Größe und Relevanz für Immobilienmarkt
 */

export interface City {
  name: string;
  state: string;
  postalCodes: string[];
  population: number;
}

export const GERMAN_CITIES: City[] = [
  // Top 10 Metropolen
  { name: 'Berlin', state: 'Berlin', postalCodes: ['10115', '10117', '10178'], population: 3645000 },
  { name: 'Hamburg', state: 'Hamburg', postalCodes: ['20095', '20097', '20144'], population: 1841000 },
  { name: 'München', state: 'Bayern', postalCodes: ['80331', '80333', '80335'], population: 1472000 },
  { name: 'Köln', state: 'Nordrhein-Westfalen', postalCodes: ['50667', '50668', '50670'], population: 1086000 },
  { name: 'Frankfurt am Main', state: 'Hessen', postalCodes: ['60311', '60313', '60316'], population: 753056 },
  { name: 'Stuttgart', state: 'Baden-Württemberg', postalCodes: ['70173', '70174', '70176'], population: 634830 },
  { name: 'Düsseldorf', state: 'Nordrhein-Westfalen', postalCodes: ['40210', '40211', '40212'], population: 621877 },
  { name: 'Dortmund', state: 'Nordrhein-Westfalen', postalCodes: ['44135', '44137', '44139'], population: 587010 },
  { name: 'Essen', state: 'Nordrhein-Westfalen', postalCodes: ['45127', '45128', '45130'], population: 583109 },
  { name: 'Leipzig', state: 'Sachsen', postalCodes: ['04103', '04105', '04107'], population: 597493 },
  
  // Weitere Großstädte (>200k)
  { name: 'Bremen', state: 'Bremen', postalCodes: ['28195', '28197', '28199'], population: 567559 },
  { name: 'Dresden', state: 'Sachsen', postalCodes: ['01067', '01069', '01097'], population: 556780 },
  { name: 'Hannover', state: 'Niedersachsen', postalCodes: ['30159', '30161', '30163'], population: 535932 },
  { name: 'Nürnberg', state: 'Bayern', postalCodes: ['90402', '90403', '90408'], population: 518370 },
  { name: 'Duisburg', state: 'Nordrhein-Westfalen', postalCodes: ['47051', '47053', '47055'], population: 498590 },
  { name: 'Bochum', state: 'Nordrhein-Westfalen', postalCodes: ['44787', '44789', '44791'], population: 364628 },
  { name: 'Wuppertal', state: 'Nordrhein-Westfalen', postalCodes: ['42103', '42105', '42107'], population: 355100 },
  { name: 'Bielefeld', state: 'Nordrhein-Westfalen', postalCodes: ['33602', '33604', '33605'], population: 334195 },
  { name: 'Bonn', state: 'Nordrhein-Westfalen', postalCodes: ['53111', '53113', '53115'], population: 327258 },
  { name: 'Münster', state: 'Nordrhein-Westfalen', postalCodes: ['48143', '48145', '48147'], population: 315293 },
  { name: 'Karlsruhe', state: 'Baden-Württemberg', postalCodes: ['76131', '76133', '76135'], population: 308436 },
  { name: 'Mannheim', state: 'Baden-Württemberg', postalCodes: ['68159', '68161', '68163'], population: 309370 },
  { name: 'Augsburg', state: 'Bayern', postalCodes: ['86150', '86152', '86153'], population: 295895 },
  { name: 'Wiesbaden', state: 'Hessen', postalCodes: ['65183', '65185', '65187'], population: 278474 },
  { name: 'Gelsenkirchen', state: 'Nordrhein-Westfalen', postalCodes: ['45879', '45881', '45883'], population: 260654 },
  { name: 'Mönchengladbach', state: 'Nordrhein-Westfalen', postalCodes: ['41061', '41063', '41065'], population: 261034 },
  { name: 'Braunschweig', state: 'Niedersachsen', postalCodes: ['38100', '38102', '38104'], population: 248292 },
  { name: 'Chemnitz', state: 'Sachsen', postalCodes: ['09111', '09112', '09113'], population: 246855 },
  { name: 'Kiel', state: 'Schleswig-Holstein', postalCodes: ['24103', '24105', '24106'], population: 246794 },
  { name: 'Aachen', state: 'Nordrhein-Westfalen', postalCodes: ['52062', '52064', '52066'], population: 248960 },
  
  // Weitere wichtige Städte (>100k)
  { name: 'Halle (Saale)', state: 'Sachsen-Anhalt', postalCodes: ['06108', '06110', '06112'], population: 238762 },
  { name: 'Magdeburg', state: 'Sachsen-Anhalt', postalCodes: ['39104', '39106', '39108'], population: 237565 },
  { name: 'Freiburg im Breisgau', state: 'Baden-Württemberg', postalCodes: ['79098', '79100', '79102'], population: 230241 },
  { name: 'Krefeld', state: 'Nordrhein-Westfalen', postalCodes: ['47798', '47799', '47800'], population: 227417 },
  { name: 'Lübeck', state: 'Schleswig-Holstein', postalCodes: ['23552', '23554', '23556'], population: 216530 },
  { name: 'Oberhausen', state: 'Nordrhein-Westfalen', postalCodes: ['46045', '46047', '46049'], population: 210829 },
  { name: 'Erfurt', state: 'Thüringen', postalCodes: ['99084', '99085', '99086'], population: 213981 },
  { name: 'Mainz', state: 'Rheinland-Pfalz', postalCodes: ['55116', '55118', '55120'], population: 218578 },
  { name: 'Rostock', state: 'Mecklenburg-Vorpommern', postalCodes: ['18055', '18057', '18059'], population: 208886 },
  { name: 'Kassel', state: 'Hessen', postalCodes: ['34117', '34119', '34121'], population: 201048 },
  { name: 'Hagen', state: 'Nordrhein-Westfalen', postalCodes: ['58089', '58091', '58093'], population: 188686 },
  { name: 'Hamm', state: 'Nordrhein-Westfalen', postalCodes: ['59063', '59065', '59067'], population: 179916 },
  { name: 'Saarbrücken', state: 'Saarland', postalCodes: ['66111', '66113', '66115'], population: 180374 },
  { name: 'Mülheim an der Ruhr', state: 'Nordrhein-Westfalen', postalCodes: ['45468', '45470', '45472'], population: 170632 },
  { name: 'Potsdam', state: 'Brandenburg', postalCodes: ['14467', '14469', '14471'], population: 180334 },
  { name: 'Ludwigshafen', state: 'Rheinland-Pfalz', postalCodes: ['67059', '67061', '67063'], population: 172253 },
  { name: 'Oldenburg', state: 'Niedersachsen', postalCodes: ['26121', '26122', '26123'], population: 168210 },
  { name: 'Leverkusen', state: 'Nordrhein-Westfalen', postalCodes: ['51371', '51373', '51375'], population: 163729 },
  { name: 'Osnabrück', state: 'Niedersachsen', postalCodes: ['49074', '49076', '49078'], population: 164748 },
  { name: 'Solingen', state: 'Nordrhein-Westfalen', postalCodes: ['42651', '42653', '42655'], population: 159245 },
  { name: 'Heidelberg', state: 'Baden-Württemberg', postalCodes: ['69115', '69117', '69118'], population: 160355 },
  { name: 'Herne', state: 'Nordrhein-Westfalen', postalCodes: ['44623', '44625', '44627'], population: 156449 },
  { name: 'Neuss', state: 'Nordrhein-Westfalen', postalCodes: ['41460', '41462', '41464'], population: 152457 },
  { name: 'Darmstadt', state: 'Hessen', postalCodes: ['64283', '64285', '64287'], population: 159878 },
  { name: 'Paderborn', state: 'Nordrhein-Westfalen', postalCodes: ['33098', '33100', '33102'], population: 151633 },
  { name: 'Regensburg', state: 'Bayern', postalCodes: ['93047', '93049', '93051'], population: 153094 },
  { name: 'Ingolstadt', state: 'Bayern', postalCodes: ['85049', '85051', '85053'], population: 137392 },
  { name: 'Würzburg', state: 'Bayern', postalCodes: ['97070', '97072', '97074'], population: 127934 },
  { name: 'Fürth', state: 'Bayern', postalCodes: ['90762', '90763', '90764'], population: 128497 },
  { name: 'Wolfsburg', state: 'Niedersachsen', postalCodes: ['38440', '38442', '38444'], population: 124371 },
  { name: 'Offenbach am Main', state: 'Hessen', postalCodes: ['63065', '63067', '63069'], population: 130280 },
  { name: 'Ulm', state: 'Baden-Württemberg', postalCodes: ['89073', '89075', '89077'], population: 126790 },
  { name: 'Heilbronn', state: 'Baden-Württemberg', postalCodes: ['74072', '74074', '74076'], population: 126592 },
  { name: 'Pforzheim', state: 'Baden-Württemberg', postalCodes: ['75172', '75173', '75175'], population: 125957 },
  { name: 'Göttingen', state: 'Niedersachsen', postalCodes: ['37073', '37075', '37077'], population: 119529 },
  { name: 'Bottrop', state: 'Nordrhein-Westfalen', postalCodes: ['46236', '46238', '46240'], population: 117383 },
  { name: 'Trier', state: 'Rheinland-Pfalz', postalCodes: ['54290', '54292', '54293'], population: 110674 },
  { name: 'Recklinghausen', state: 'Nordrhein-Westfalen', postalCodes: ['45657', '45659', '45661'], population: 111338 },
  { name: 'Reutlingen', state: 'Baden-Württemberg', postalCodes: ['72764', '72766', '72768'], population: 116456 },
  { name: 'Bremerhaven', state: 'Bremen', postalCodes: ['27568', '27570', '27572'], population: 113643 },
  { name: 'Koblenz', state: 'Rheinland-Pfalz', postalCodes: ['56068', '56070', '56072'], population: 114024 },
  { name: 'Bergisch Gladbach', state: 'Nordrhein-Westfalen', postalCodes: ['51427', '51429', '51465'], population: 111645 },
  { name: 'Jena', state: 'Thüringen', postalCodes: ['07743', '07745', '07747'], population: 108678 },
  { name: 'Remscheid', state: 'Nordrhein-Westfalen', postalCodes: ['42853', '42855', '42857'], population: 111338 },
  { name: 'Erlangen', state: 'Bayern', postalCodes: ['91052', '91054', '91056'], population: 112528 },
  { name: 'Moers', state: 'Nordrhein-Westfalen', postalCodes: ['47441', '47443', '47445'], population: 103725 },
  { name: 'Siegen', state: 'Nordrhein-Westfalen', postalCodes: ['57072', '57074', '57076'], population: 102355 },
  { name: 'Hildesheim', state: 'Niedersachsen', postalCodes: ['31134', '31135', '31137'], population: 101055 },
];

// Gruppiert nach Bundesland für bessere UX
export const CITIES_BY_STATE = GERMAN_CITIES.reduce((acc, city) => {
  if (!acc[city.state]) acc[city.state] = [];
  acc[city.state].push(city);
  return acc;
}, {} as Record<string, City[]>);

// Nur Stadtnamen für einfache Dropdowns
export const CITY_NAMES = GERMAN_CITIES.map(c => c.name);

// Autocomplete-Suche
export function searchCities(query: string, limit = 10): City[] {
  const q = query.toLowerCase().trim();
  if (!q) return GERMAN_CITIES.slice(0, limit);
  
  return GERMAN_CITIES
    .filter(city => 
      city.name.toLowerCase().includes(q) || 
      city.state.toLowerCase().includes(q)
    )
    .slice(0, limit);
}

// PLZ zu Stadt Mapping
export function getCityByPostalCode(postalCode: string): City | null {
  return GERMAN_CITIES.find(city => 
    city.postalCodes.some(plz => plz.startsWith(postalCode.substring(0, 3)))
  ) || null;
}

