import convert from 'xml-js';
import { DateTime } from 'luxon';
import fs from 'fs';

async function importBVEFromISS(fileName, k) {
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
        bts = [bts[0].elements[0].text];
      } else {
        bts = [bts[0].elements[0].text, bts[1].elements[0].text];
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
  const fname = `/home/daniel/Documents/json/${k}json`;
  fs.writeFile(fname, JSON.stringify(bVE), (err) => {
    if (err) return console.log(err);
    console.log(`File saved: ${fname}`);
  });
}

const folder = '/home/daniel/Documents/bVE/';

fs.readdir(folder, (err, files) => {
  const filenames = files.map((x) => folder + x);
  console.log(filenames);
  filenames.forEach((file, k) => {
    // importBVEFromISS(file, 1 + k);
  });
});
