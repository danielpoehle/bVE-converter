const fs = require('fs');
const { closest } = require('fastest-levenshtein');

let betriebsstelle = [];
let corrected = [];
let bahnhof = [];
let nodes = [];
let egb = [];

fs.readFile(
  '/home/daniel/Documents/coord/open_data/betriebsstelle.json',
  'utf8',
  (err, data) => {
    // console.log(data);
    betriebsstelle = JSON.parse(data);
    // console.log(betriebsstelle.slice(0, 1));
    console.log(betriebsstelle.length);
    fs.readFile(
      '/home/daniel/Documents/coord/corrected/result.json',
      'utf8',
      (err1, data) => {
        // console.log(data);
        corrected = JSON.parse(data);
        // console.log(betriebsstelle.slice(0, 1));
        console.log(corrected.length);
        fs.readFile(
          '/home/daniel/Documents/coord/open_data/bahnhof.json',
          'utf8',
          (err2, data) => {
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
            fs.readFile(
              '/home/daniel/Documents/coord/osm/output.json',
              'utf8',
              (err3, data) => {
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

                fs.readFile(
                  '/home/daniel/Documents/coord/210412_egb_original.json',
                  'utf8',
                  (err4, data) => {
                    egb = JSON.parse(data);
                    const names = nodes.map((a) => a.tags.name);
                    for (let index = 0; index < egb.length; index += 1) {
                      const nm = egb[index].NameVon;
                      const ds = egb[index].RL100von;
                      if (
                        betriebsstelle.findIndex((bt) => bt.KUERZEL === ds) > -1
                      ) {
                        const matchBT = betriebsstelle.find(
                          (bt) => bt.KUERZEL === ds,
                        );
                        egb[index].lat = matchBT.GEOGR_BREITE;
                        egb[index].lon = matchBT.GEOGR_LAENGE;
                      } else if (
                        corrected.findIndex((cr) => cr.DS100 === ds) > -1
                      ) {
                        const matchBT = corrected.find((cr) => cr.DS100 === ds);
                        egb[index].lon = matchBT.lon;
                        egb[index].lat = matchBT.lat;
                      } else if (
                        bahnhof.findIndex((bf) => bf.DS100 === ds) > -1
                      ) {
                        const matchBF = bahnhof.find((bf) => bf.DS100 === ds);
                        egb[index].lat = matchBF.Breite;
                        egb[index].lon = matchBF.Laenge;
                      } else {
                        const nd = closest(nm, names);
                        const target = nodes.find((n) => n.tags.name === nd);
                        egb[index].lon = target.lon;
                        egb[index].lat = target.lat;
                      }
                    }
                    const fname =
                      '/home/daniel/Documents/coord/egb_interpolate.json';
                    fs.writeFile(fname, JSON.stringify(egb), (err5) => {
                      if (err5) return console.log(err5);
                      console.log(`File saved: ${fname}`);
                      return undefined;
                    });
                  },
                );
              },
            );
          },
        );
      },
    );
  },
);
