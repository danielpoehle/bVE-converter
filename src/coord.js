const fs = require('fs');
const convert = require('xml-js');
const { distance, closest } = require('fastest-levenshtein');

const folder = '/home/daniel/Documents/coord/iss/';
const result = [];
let nodes = [];
let betriebsstelle = [];
let bahnhof = [];
let names = [];
let bts = [];
fs.readdir(folder, (err, files) => {
  const filenames = files.map((x) => folder + x);
  // console.log(filenames);

  filenames.forEach((file) => {
    fs.readFile(file, 'latin1', (error, xml) => {
      const ordrahmen = convert.xml2js(xml, { compact: true, spaces: 2 })
        .XmlIssDaten.Ordnungsrahmen;
      // console.log(typeof ordrahmen);
      if ('Betriebsstellen' in ordrahmen) {
        bts = bts.concat(ordrahmen.Betriebsstellen.Betriebsstelle);
      }
    });
  });
  setTimeout(() => {
    names = nodes.map((a) => a.tags.name);
    bts.forEach((b) => {
      const nm = b.Name._text;
      const ds = b.DS100._text;
      let target = {};
      if (betriebsstelle.findIndex((bt) => bt.KUERZEL === ds) > -1) {
        const matchBT = betriebsstelle.find((bt) => bt.KUERZEL === ds);
        target.lat = matchBT.GEOGR_BREITE;
        target.lon = matchBT.GEOGR_LAENGE;
      } else if (bahnhof.findIndex((bf) => bf.DS100 === ds) > -1) {
        const matchBF = bahnhof.find((bf) => bf.DS100 === ds);
        target.lat = matchBF.Breite;
        target.lon = matchBF.Laenge;
      } else {
        const nd = closest(nm, names);
        target = nodes.find((n) => n.tags.name === nd);
      }
      result.push({
        DS100: ds,
        Name: nm,
        ISSCoord: b.Position,
        lat: target.lat,
        lon: target.lon,
      });
    });
  }, 20000);
});

fs.readFile(
  '/home/daniel/Documents/coord/osm/output.json',
  'utf8',
  (err, data) => {
    // console.log(data);
    nodes = JSON.parse(data).elements;
    for (let id = nodes.length - 1; id >= 0; id -= 1) {
      if (nodes[id].tags.railway === 'tram_stop') {
        nodes.splice(id, 1);
      }
      if (nodes[id].tags.railway === 'subway_entrance') {
        nodes.splice(id, 1);
      }
      if (nodes[id].tags.tram === 'yes') {
        nodes.splice(id, 1);
      }
      if (nodes[id].tags.railway === 'level_crossing') {
        nodes.splice(id, 1);
      }
      if (nodes[id].tags.light_rail === 'yes') {
        nodes.splice(id, 1);
      }
    }
    console.log(nodes.slice(0, 25));
    console.log(nodes.length);
  },
);

fs.readFile(
  '/home/daniel/Documents/coord/open_data/betriebsstelle.json',
  'utf8',
  (err, data) => {
    // console.log(data);
    betriebsstelle = JSON.parse(data);
    // console.log(betriebsstelle.slice(0, 1));
    console.log(betriebsstelle.length);
  },
);

fs.readFile(
  '/home/daniel/Documents/coord/open_data/bahnhof.json',
  'utf8',
  (err, data) => {
    // console.log(data);
    bahnhof = JSON.parse(data);
    bahnhof.forEach((bf, idx, arr) => {
      arr[idx].Laenge = bf.Laenge.replace(',', '.');
      arr[idx].Breite = bf.Breite.replace(',', '.');
      if (bf.DS100.includes(',')) {
        const bflist = bf.DS100.split(',');
        arr[idx].DS100 = bflist[0];
        for (let ind = 1; ind < bflist.length; ind += 1) {
          bahnhof.push({
            EVA_NR: bf.EVA_NR,
            DS100: bflist[ind],
            IFOPT: bf.IFOPT,
            NAME: bf.NAME,
            Verkehr: bf.Verkehr,
            Laenge: bf.Laenge,
            Breite: bf.Breite,
            Betreiber_Name: bf.Betreiber_Name,
            Betreiber_Nr: bf.Betreiber_Nr,
            Status: bf.Status,
          });
        }
      }
    });
    setTimeout(() => {
      // console.log(bahnhof.slice(0, 1));
      console.log(bahnhof.length);
    }, 5000);
  },
);

setTimeout(() => {
  console.log(bts.length);
  console.log(result.length);
  console.log(result.slice(0, 5));
  const fname = '/home/daniel/Documents/coord/iss_interpolate.json';
  fs.writeFile(fname, JSON.stringify(result), (err) => {
    if (err) return console.log(err);
    console.log(`File saved: ${fname}`);
    return undefined;
  });
  // console.log(names.slice(0, 10));
}, 25000);
