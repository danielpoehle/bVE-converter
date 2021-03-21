import convert from 'xml-js';
import { DateTime } from 'luxon';
import fs from 'fs';

async function importBVEFromISS(fileName, k, coords) {
  const xml = await fs.promises.readFile(fileName, 'latin1');
  const works = convert.xml2js(xml, { compact: false, spaces: 2 }).elements[0]
    .elements[4].elements;
  // console.log(works);

  const bVE = [];
  works.forEach((work, i) => {
    const bVEList = work.elements.filter((w) => w.name === 'BetrieblicheVEn')[0]
      .elements;

    // console.log(work);

    bVEList.forEach((ve) => {
      let note = '';
      if (
        ve.elements.findIndex((x) => x.name === 'VEBemerkung') >= 0 &&
        'elements' in ve.elements.find((x) => x.name === 'VEBemerkung')
      ) {
        note += ve.elements.filter((v) => v.name === 'VEBemerkung')[0]
          .elements[0].text;
        note += ' ';
      }
      if (
        ve.elements
          .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
          .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
          .elements.findIndex((x) => x.name === 'Bemerkung') >= 0 &&
        'elements' in
          ve.elements
            .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
            .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
            .elements.find((x) => x.name === 'Bemerkung')
      ) {
        note += ve.elements
          .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
          .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
          .elements.filter((b) => b.name === 'Bemerkung')[0].elements[0].text;
      }

      let bts = ve.elements
        .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
        .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
        .elements.filter((b) => b.name === 'MakroskopischeOrtsangabe')[0]
        .elements.filter((o) => o.name === 'Betriebsstellen')[0]
        .elements.filter((p) => p.name === 'Betriebsstelle');

      if (bts[0].elements[0].text === bts[1].elements[0].text) {
        const nm = bts[0].elements[0].text;
        const co = coords.find((c) => c.DS100 === nm);
        if (co === undefined) {
          console.log(`ds100 ${nm}`);
        } else {
          bts = [{ ds100: co.DS100, name: co.Name, lat: co.lat, lon: co.lon }];
        }
        // console.log(bts);
      } else {
        const nm1 = bts[0].elements[0].text;
        const co1 = coords.find((c) => c.DS100 === nm1);
        const nm2 = bts[1].elements[0].text;
        const co2 = coords.find((c) => c.DS100 === nm2);
        if (co1 === undefined || co2 === undefined) {
          console.log(`ds100 ${nm1} ${nm2}`);
        } else {
          bts = [
            { ds100: co1.DS100, name: co1.Name, lat: co1.lat, lon: co1.lon },
            { ds100: co2.DS100, name: co2.Name, lat: co2.lat, lon: co2.lon },
          ];
        }
      }

      let line = ve.elements
        .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
        .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
        .elements.filter((b) => b.name === 'MakroskopischeOrtsangabe')[0]
        .elements.filter((o) => o.name === 'Strecken')[0]
        .elements.filter((p) => p.name === 'Strecke');

      if (line[0].elements[0].text === line[1].elements[0].text) {
        line = [line[0].elements[0].text];
      } else {
        line = [line[0].elements[0].text, line[1].elements[0].text];
      }

      const gStart = ve.elements
        .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
        .elements.filter((g) => g.name === 'Begin')[0].elements[0].text;
      const start = DateTime.fromFormat(gStart, 'dd.MM.yyyy HH:mm:ss').ts;

      const gEnd = ve.elements
        .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
        .elements.filter((g) => g.name === 'Ende')[0].elements[0].text;
      const end = DateTime.fromFormat(gEnd, 'dd.MM.yyyy HH:mm:ss').ts;

      if (i === 0) {
        // console.log(gStart, start);
        // console.log(gEnd, end);
        // console.log(bts[1].elements[0].text);
      }

      bVE.push({
        BVEID: ve.elements.filter((v) => v.name === 'BVEID')[0].elements[0]
          .text,
        BBMNID: work.elements.filter((w) => w.name === 'BBMNID')[0].elements[0]
          .text,
        REGION: work.elements.filter((w) => w.name === 'Regionalbereich')[0]
          .elements[0].text,
        KAT: work.elements.filter(
          (w) => w.name === 'BBMN-Massnahmenkategorie',
        )[0].elements[0].text,
        G_START: gStart,
        START: start,
        G_END: gEnd,
        END: end,
        VTS: ve.elements
          .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
          .elements.filter((g) => g.name === 'Verkehrstagesschluessel')[0]
          .attributes.Nr,
        NONSTOP: ve.elements
          .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
          .elements.filter((g) => g.name === 'Durchgehend')[0].elements[0].text,
        WORK: work.elements.filter((w) => w.name === 'ArtDerArbeiten')[0]
          .elements[0].text,
        LIMITATION: ve.elements.filter((v) => v.name === 'VE-Art')[0]
          .elements[0].text,
        RULE: ve.elements
          .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
          .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
          .elements.filter((b) => b.name === 'BBR-Art')[0].elements[0].text,
        NOTE: note,
        AFFECT_TRAINS: ve.elements
          .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
          .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
          .elements.filter((b) => b.name === 'BetrifftZuege')[0].elements[0]
          .text,
        AFFECT_SE: ve.elements
          .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
          .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
          .elements.filter(
            (b) => b.name === 'NichtVerfuegbareServiceEinrichtungen',
          )[0].elements[0].text,
        BTS: bts,
        LINE: line,
      });
    });
  });
  console.log(bVE.length);
  console.log(bVE[0]);
  const fname = `/home/daniel/Documents/json/${k}.json`;
  fs.writeFile(fname, JSON.stringify(bVE), (err) => {
    if (err) return console.log(err);
    console.log(`File saved: ${fname}`);
    return undefined;
  });
}

const folder1 = '/home/daniel/Documents/bVE/';
const coordFile = '/home/daniel/Documents/coord/210322_iss_interpolate.json';

let coords = [];
fs.readFile(coordFile, (err, data) => {
  coords = JSON.parse(data);
  console.log(coords[0]);
  console.log(coords.find((c) => c.DS100 === 'DH'));
  console.log(coords.find((c) => c.DS100 === 'FMZ'));
  console.log(coords.find((c) => c.DS100 === 'WVR'));
  console.log(coords.find((c) => c.DS100 === 'EBTHG'));
  console.log(coords.find((c) => c.DS100 === 'FSP'));
  fs.readdir(folder1, (err, files) => {
    const filenames = files.map((x) => folder1 + x);
    // console.log(filenames);
    filenames.forEach((file, k) => {
      // console.log(`${k} ${file}`);
      importBVEFromISS(file, 1 + k, coords);
    });
  });
});

const folder = '/home/daniel/Documents/json/';
let bVEList = [];
fs.readdir(folder, (err, files) => {
  const filenames = files.map((x) => folder + x);
  console.log(filenames);
  filenames.forEach((file) => {
    fs.readFile(file, (error, data) => {
      console.log(JSON.parse(data).length);
      bVEList = bVEList.concat(JSON.parse(data));
      console.log(bVEList.length);
    });
  });
});

setTimeout(() => {
  const fname = `/home/daniel/Documents/complete.json`;
  fs.writeFile(fname, JSON.stringify(bVEList), (err) => {
    if (err) return console.log(err);
    console.log(`File saved: ${fname}`);
    return undefined;
  });
}, 3000);
