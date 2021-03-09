const fs = require('fs');
const convert = require('xml-js');
const { distance, closest } = require('fastest-levenshtein');

const folder = '/home/daniel/Documents/coord/iss/';
const result = [];
let nodes = [];
let names = [];
let bts = [];
fs.readdir(folder, (err, files) => {
  const filenames = files.map((x) => folder + x);
  // console.log(filenames);

  filenames.forEach((file, i) => {
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
      const nd = closest(nm, names);
      const target = nodes.find((n) => n.tags.name === nd);
      result.push({
        DS100: b.DS100._text,
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
    // console.log(nodes.slice(0, 10));
    console.log(nodes.length);
  },
);
setTimeout(() => {
  console.log(bts.length);
  console.log(result.length);
  console.log(result.slice(0, 25));
  // console.log(names.slice(0, 10));
}, 25000);
