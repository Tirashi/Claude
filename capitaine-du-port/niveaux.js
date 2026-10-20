/* Capitaine du port : les bassins, par port. Fabriqués par outils/capitaine-generateur.js (un par optimum visé),
   puis figés ici ; outils/capitaine-solveur.js vérifie que chacun est gagné par sa solution (sol) en opt coups.
   sol : « bateau:position », les bateaux étant numérotés comme capLire les lit (le navire doré D = 0, puis les autres lettres dans l'ordre). */
const CAP_PORTS = [
  { nom: 'PORT DE PECHE', court: 'PECHE', debut: 0, n: 12, pret: true },
  { nom: 'PORT DE COMMERCE', court: 'COMMERCE', debut: 12, n: 12, pret: true },
  { nom: 'LA MARINA', court: 'MARINA', debut: 24, n: 0, pret: false },
  { nom: 'LE CHANTIER NAVAL', court: 'CHANTIER', debut: 24, n: 0, pret: false },
  { nom: 'LE GRAND PORT', court: 'GRAND PORT', debut: 24, n: 0, pret: false },
];
const CAP_NIVEAUX = [
  // port de pêche (optimum 3 à 12)
  { plan: ['....C.', 'FFF.CE', '.DBB.E', '.DA...', '..A..H', '...GGH'], sortie: 1, opt: 3, sol: '3:2 5:2 0:0' },
  { plan: ['CGG.EE', 'CBB...', '..DA..', '..DA..', '......', 'FF.HH.'], sortie: 2, opt: 4, sol: '2:3 3:1 6:0 0:0' },
  { plan: ['AAA.BC', '....BC', '.F....', 'HFEE..', 'HFDGGG', '..D.II'], sortie: 2, opt: 5, sol: '2:1 3:1 1:3 4:3 0:0' },
  { plan: ['.C....', '.C.FF.', '.EEGHH', '...GD.', 'AA.GD.', '.BBB..'], sortie: 4, opt: 6, sol: '2:0 4:0 5:2 6:3 7:2 0:0' },
  { plan: ['AAABEF', 'CCDBEF', '..D.G.', '....G.', '...HH.', '......'], sortie: 2, opt: 7, sol: '2:1 5:1 7:0 6:3 4:1 1:3 0:0' },
  { plan: ['BB....', 'CC..E.', 'GGAAE.', 'FF.H..', '.D.H..', '.D....'], sortie: 1, opt: 8, sol: '2:2 3:2 4:0 1:4 6:2 7:4 5:2 0:0' },
  { plan: ['..FBB.', '..FEE.', '...AA.', 'GGHHD.', '....DC', '.....C'], sortie: 4, opt: 8, sol: '0:4 1:0 7:3 5:4 2:0 4:0 7:2 0:0' },
  { plan: ['.BGG..', '.BAAAC', 'EEHHFC', '...DF.', '...D..', '......'], sortie: 3, opt: 9, sol: '3:0 5:3 7:4 4:2 2:3 1:0 4:0 6:0 0:0' },
  { plan: ['..C...', '..CFFF', 'AAA...', 'EE.B..', '.D.B..', '.D.B..'], sortie: 1, opt: 10, sol: '1:3 3:4 1:0 5:0 2:0 4:4 2:3 1:2 5:2 0:0' },
  { plan: ['...C..', '...CBB', 'F...EI', 'FHHHEI', '..D...', 'AADGG.'], sortie: 2, opt: 11, sol: '5:0 6:4 7:0 3:4 2:1 4:0 8:0 7:3 5:2 2:0 0:0' },
  { plan: ['H.IAA.', 'H.IEEE', 'FF..D.', 'CGGGD.', 'C.....', 'C..BB.'], sortie: 4, opt: 12, sol: '0:3 5:3 3:2 2:0 0:4 6:3 8:4 1:1 4:1 5:1 6:1 0:0' },
  { plan: ['..G..H', 'C.GIIH', 'CAAAD.', '.EEFD.', '...FBB', '......'], sortie: 4, opt: 12, sol: '3:0 1:0 4:0 5:2 2:0 0:3 5:3 1:3 6:3 1:0 8:1 0:0' },
  // port de commerce (optimum 10 à 20)
  { plan: ['.GLEEH', 'CGLBBH', 'CFFII.', 'JAKKK.', 'JA..D.', 'J...D.'], sortie: 4, opt: 10, sol: '1:4 3:0 5:0 10:3 11:4 2:2 4:2 8:2 10:1 0:0' },
  { plan: ['.CCJJ.', 'GHAAA.', 'GHBBB.', 'KEEEDL', 'KII.DL', 'FF...L'], sortie: 4, opt: 11, sol: '0:4 3:0 4:2 5:2 8:2 7:4 1:1 2:1 4:1 9:2 0:0' },
  { plan: ['..JHHH', 'IIJ.GB', 'CCC.GB', 'A.FF..', 'A..D..', 'A..DEE'], sortie: 3, opt: 12, sol: '5:1 0:1 4:1 0:4 2:4 6:4 3:3 5:4 9:3 3:0 7:0 0:0' },
  { plan: ['JJJGGE', 'III..E', 'A..DCC', 'ABBDH.', '.KFFH.', '.K....'], sortie: 3, opt: 13, sol: '0:1 7:4 2:4 10:2 5:0 0:4 2:2 3:2 4:4 2:4 3:4 6:4 0:0' },
  { plan: ['...JJ.', 'E..CKK', 'EFFCBA', 'EIIIBA', '.HD.BA', '.HDGGG'], sortie: 2, opt: 14, sol: '4:0 8:0 3:2 9:1 10:1 1:0 2:0 3:0 8:3 4:3 5:0 9:0 10:0 0:0' },
  { plan: ['..GG..', 'AC..HH', 'ACIIIJ', 'EEEKKJ', 'B..D..', 'B..DFF'], sortie: 3, opt: 15, sol: '1:0 3:0 6:4 7:2 8:0 9:1 10:4 0:2 5:1 0:4 10:3 9:4 7:4 10:4 0:0' },
  { plan: ['..MMB.', '.ACCBF', 'HAIIBF', 'HAGDLL', 'EEGD..', '.JJKK.'], sortie: 3, opt: 16, sol: '1:0 7:0 9:0 6:4 10:4 0:4 11:0 0:3 5:3 6:3 10:2 2:3 3:4 8:4 12:4 0:0' },
  { plan: ['BBB...', 'LKGGGI', 'LKJJ.I', '.KEEF.', 'CHHDF.', 'C..DAA'], sortie: 3, opt: 17, sol: '2:2 8:0 9:4 10:0 4:0 0:2 1:1 0:4 5:4 4:4 0:2 7:2 10:2 2:0 11:2 6:0 0:0' },
  { plan: ['EEE..G', 'ICCMMG', 'IJJ..H', '..ALLH', 'KKABDH', 'FFFBD.'], sortie: 4, opt: 18, sol: '7:3 6:1 4:3 8:2 3:0 9:3 1:0 10:1 11:1 2:3 5:1 8:4 9:0 11:0 1:2 4:0 12:2 0:0' },
  { plan: ['JJ.KK.', 'HHH.CF', 'BBD.CF', 'A.DGG.', 'ALL...', 'IIEEE.'], sortie: 2, opt: 19, sol: '4:3 5:2 7:1 9:1 11:3 0:3 2:1 1:0 2:0 0:2 11:0 0:4 6:0 3:3 2:3 1:1 7:3 9:0 0:0' },
  { plan: ['M.BBGH', 'M..KGH', 'IAAKGL', 'IDEEFL', 'ID.CFL', '...CJJ'], sortie: 1, opt: 20, sol: '2:1 10:0 1:2 0:1 4:1 3:3 9:0 3:4 4:2 0:3 1:1 5:4 6:1 10:1 11:3 7:1 2:4 10:0 1:2 0:0' },
  { plan: ['LEEE.H', 'L.GIIH', 'FFG.AA', '.JG.CC', '.J.KD.', 'BB.KD.'], sortie: 4, opt: 20, sol: '1:3 3:3 7:4 1:4 3:4 4:3 6:0 8:4 10:1 2:2 9:4 3:0 0:3 2:3 6:3 4:1 10:3 1:2 8:1 0:0' },
];
if (typeof module !== 'undefined') module.exports = { CAP_PORTS, CAP_NIVEAUX };
