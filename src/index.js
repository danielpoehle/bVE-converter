import convert from 'xml-js';

import fs from 'fs';

fs.readFile(
  '/home/daniel/Documents/bVE/BaubetrieblicheMassnahmen_233652D81AB7D-22B018B0BFAE6.xml',
  'latin1',
  (err, xml) => {
    if (err) {
      console.error(err);
    }
    const works = convert.xml2js(xml, { compact: false, spaces: 2 }).elements[0]
      .elements[4].elements;
    // console.log(works);

    const bVE = [];
    works.forEach((work, i) => {
      const bVEList = work.elements.filter(
        (w) => w.name === 'BetrieblicheVEn',
      )[0].elements;

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

        if (i === 0) {
          console.log(
            ve.elements
              .filter((v) => v.name === 'BaubetrieblicheRegelungen')[0]
              .elements.filter((g) => g.name === 'BaubetrieblicheRegelung')[0]
              .elements.find((x) => x.name === 'Bemerkung'),
          );
          // console.log(bts[1].elements[0].text);
        }

        bVE.push({
          BVEID: ve.elements.filter((v) => v.name === 'BVEID')[0].elements[0]
            .text,
          BBMNID: work.elements.filter((w) => w.name === 'BBMNID')[0]
            .elements[0].text,
          REGION: work.elements.filter((w) => w.name === 'Regionalbereich')[0]
            .elements[0].text,
          KAT: work.elements.filter(
            (w) => w.name === 'BBMN-Massnahmenkategorie',
          )[0].elements[0].text,
          G_START: ve.elements
            .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
            .elements.filter((g) => g.name === 'Begin')[0].elements[0].text,
          G_END: ve.elements
            .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
            .elements.filter((g) => g.name === 'Ende')[0].elements[0].text,
          VTS: ve.elements
            .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
            .elements.filter((g) => g.name === 'Verkehrstagesschluessel')[0]
            .attributes.Nr,
          NONSTOP: ve.elements
            .filter((v) => v.name === 'Gueltigkeit-bVE')[0]
            .elements.filter((g) => g.name === 'Durchgehend')[0].elements[0]
            .text,
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
    // console.log(bVE);
    console.log(bVE[0]);
  },
);
