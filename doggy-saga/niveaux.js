/* Doggy Saga : les 60 niveaux en 5 chapitres. Fichier fabriqué par outils/doggy-saga-niveaux.js (ne pas modifier à la main :
   changer le niveau dans l'outil et relancer). Coups et étoiles réglés avec le joueur automatique.
   { id, chap, coups, races, plan (voir regles.js), obj, chiots?, tuto?, etoiles: [2 étoiles, 3 étoiles] } */
const DOG_CHAPITRES = [
  {
    nom: "L'arrivée",
    texte: "Les premiers chiens arrivent au refuge."
  },
  {
    nom: "Jour de pluie",
    texte: "Tout le monde est plein de boue !"
  },
  {
    nom: "La nurserie",
    texte: "Des chiots se sont perdus."
  },
  {
    nom: "Le jardin",
    texte: "Attention aux niches et aux gamelles."
  },
  {
    nom: "Portes ouvertes",
    texte: "Le grand jour : tout le monde cherche une famille."
  }
];
const DOG_NIVEAUX = [
  {id:1,chap:1,coups:19,races:[0,1,2,3,4],plan:["........","........","........","........","........","........","........","........"],obj:[{k:"calins",t:0,n:10}],tuto:"glisser",etoiles:[8500,13000]},
  {id:2,chap:1,coups:27,races:[0,1,2,3,4],plan:["........","........","........","........","........","........","........","........"],obj:[{k:"calins",t:1,n:15},{k:"calins",t:2,n:15}],tuto:"bandana",etoiles:[11000,18000]},
  {id:3,chap:1,coups:27,races:[0,1,2,3,4],plan:[" ...... ","........","........","........","........","........","........"," ...... "],obj:[{k:"calins",t:3,n:20}],tuto:"balle",etoiles:[13000,18500]},
  {id:4,chap:1,coups:21,races:[0,1,2,3,4],plan:["........","........","........","........","........","........","........","........"],obj:[{k:"calins",t:4,n:25},{k:"calins",t:0,n:25}],etoiles:[11500,16000]},
  {id:5,chap:1,coups:31,races:[0,1,2,3,4],plan:[" ..  .. ","........","........","........","........"," ...... ","  ....  ","   ..   "],obj:[{k:"calins",t:1,n:30}],etoiles:[11500,13500]},
  {id:6,chap:1,coups:28,races:[0,1,2,3,4,5],plan:["........","........","........","........","........","........","........","........"],obj:[{k:"calins",t:5,n:20}],etoiles:[7500,9500]},
  {id:7,chap:1,coups:24,races:[0,1,2,3,4],plan:["   ..   ","  ....  "," ...... ","........","........"," ...... ","  ....  ","   ..   "],obj:[{k:"calins",t:2,n:25},{k:"calins",t:3,n:25}],etoiles:[7500,10500]},
  {id:8,chap:1,coups:33,races:[0,1,2,3,4,5],plan:["   ..   ","  ....  "," ...... ","........","........","........","........","........"],obj:[{k:"calins",t:0,n:20},{k:"calins",t:5,n:20}],etoiles:[8000,10500]},
  {id:9,chap:1,coups:34,races:[0,1,2,3,4,5],plan:["  ....  ","  ....  ","........","........","........","........","  ....  ","  ....  "],obj:[{k:"calins",t:4,n:25}],etoiles:[8500,10000]},
  {id:10,chap:1,coups:33,races:[0,1,2,3,4,5],plan:["  ....  "," ...... ","........","........","........","........"," ...... ","  ....  "],obj:[{k:"calins",t:1,n:25},{k:"calins",t:2,n:25},{k:"calins",t:3,n:25}],etoiles:[8000,10000]},
  {id:11,chap:1,coups:37,races:[0,1,2,3,4,5],plan:["..    ..","...  ..."," ...... ","  ....  ","  ....  "," ...... ","...  ...","..    .."],obj:[{k:"calins",t:5,n:20}],etoiles:[4500,6000]},
  {id:12,chap:1,coups:31,races:[0,1,2,3,4,5],plan:["........","........","........","........","........","........","........","........"],obj:[{k:"calins",t:0,n:25},{k:"calins",t:1,n:25},{k:"calins",t:4,n:25}],etoiles:[11000,13000]},
  {id:13,chap:2,coups:34,races:[0,1,2,3,6],plan:["........","........","........","........","........","........","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"}],tuto:"boue",etoiles:[20000,25500]},
  {id:14,chap:2,coups:15,races:[0,1,2,4,6],plan:["........","........","..bbbb..","..bbbb..","..bbbb..","..bbbb..","........","........"],obj:[{k:"boue"},{k:"calins",t:6,n:15}],etoiles:[9500,14000]},
  {id:15,chap:2,coups:37,races:[1,2,3,6,7],plan:[" ..  .. ","........","........","........","bbbbbbbb"," bbbbbb ","  bbbb  ","   bb   "],obj:[{k:"boue"}],etoiles:[14500,18500]},
  {id:16,chap:2,coups:37,races:[0,3,4,6,7],plan:["b.b.b.b.",".b.b.b.b","b.b.b.b.",".b.b.b.b","b.b.b.b.",".b.b.b.b","b.b.b.b.",".b.b.b.b"],obj:[{k:"boue"}],etoiles:[26500,33000]},
  {id:17,chap:2,coups:38,races:[2,3,5,6,7],plan:["   bb   ","  bbbb  "," bbbbbb ","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"}],etoiles:[19500,27000]},
  {id:18,chap:2,coups:39,races:[0,1,4,6,7],plan:["  bbbb  ","  ....  ","b......b","b......b","b......b","b......b","  ....  ","  bbbb  "],obj:[{k:"boue"},{k:"calins",t:7,n:25}],etoiles:[16500,19500]},
  {id:19,chap:2,coups:18,races:[1,2,3,6,7],plan:["........","........","..BBBB..","..BBBB..","..BBBB..","..BBBB..","........","........"],obj:[{k:"boue"}],etoiles:[15000,19000]},
  {id:20,chap:2,coups:38,races:[0,4,5,6,7],plan:["   bb   ","  bbbb  "," bbbbbb ","bbbbbbbb","bbbbbbbb"," bbbbbb ","  bbbb  ","   bb   "],obj:[{k:"boue"}],etoiles:[16500,19500]},
  {id:21,chap:2,coups:28,races:[0,1,2,6,7],plan:[" ...... ","........","........","........","........","bbbbbbbb","bbbbbbbb"," bbbbbb "],obj:[{k:"boue"}],etoiles:[18000,22500]},
  {id:22,chap:2,coups:36,races:[2,3,4,6,7],plan:["  bbbb  "," bbbbbb ","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb"," bbbbbb ","  bbbb  "],obj:[{k:"boue"}],etoiles:[20000,25500]},
  {id:23,chap:2,coups:30,races:[0,1,3,6,7],plan:["........","........","..BBBB..","..BBBB..","bbBBBBbb","bbBBBBbb","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"}],etoiles:[24000,29500]},
  {id:24,chap:2,coups:32,races:[1,2,5,6,7],plan:["bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"}],etoiles:[27000,33500]},
  {id:25,chap:3,coups:18,races:[0,1,2,6,8],plan:["........","........","...c....","........","........","........","........","........"],obj:[{k:"chiots",n:1}],tuto:"chiots",etoiles:[10000,13000]},
  {id:26,chap:3,coups:23,races:[3,4,7,8,9],plan:["........","........","...c....","........","........","........","........","........"],obj:[{k:"chiots",n:2}],chiots:{max:1},etoiles:[14500,17500]},
  {id:27,chap:3,coups:38,races:[0,2,5,8,9],plan:["..    ..","..    ..","c.    .c","........","........","........","........","........"],obj:[{k:"chiots",n:2}],chiots:{max:2},etoiles:[13000,15000]},
  {id:28,chap:3,coups:30,races:[1,3,6,8,9],plan:["........","........","..c..c..","........","........","........","........","........"],obj:[{k:"chiots",n:3},{k:"calins",t:8,n:20}],chiots:{max:2},etoiles:[18500,23000]},
  {id:29,chap:3,coups:31,races:[0,4,7,8,9],plan:[" ...... ","........","...c....","........","........","........","bbbbbbbb"," bbbbbb "],obj:[{k:"chiots",n:2},{k:"boue"}],etoiles:[18500,21000]},
  {id:30,chap:3,coups:25,races:[2,3,5,8,9],plan:["   ..   ","  ....  "," ..cc.. ","........","........","........","........","........"],obj:[{k:"chiots",n:3}],chiots:{max:2},etoiles:[13000,16000]},
  {id:31,chap:3,coups:28,races:[0,1,8,9,7],plan:["  ....  ","  ....  ","..bbbb..","..bbbb..","..bbbb..","..bbbb..","  ....  ","  ....  "],obj:[{k:"chiots",n:2},{k:"boue"}],chiots:{max:2},etoiles:[13500,15500]},
  {id:32,chap:3,coups:34,races:[1,4,7,8,9],plan:["........","........",".c..c..c","........","........","........","........","........"],obj:[{k:"chiots",n:3}],chiots:{max:3},etoiles:[20000,24500]},
  {id:33,chap:3,coups:32,races:[0,2,3,6,9],plan:["  ....  "," ...... ","..c..c..","........","bbbbbbbb","bbbbbbbb"," bbbbbb ","  bbbb  "],obj:[{k:"chiots",n:3},{k:"boue"}],chiots:{max:2},etoiles:[18000,22500]},
  {id:34,chap:3,coups:34,races:[1,3,4,7,9],plan:["   ..   ","  ....  "," ..cc.. ","........","........"," ...... ","  ....  ","   ..   "],obj:[{k:"chiots",n:3},{k:"calins",t:9,n:30}],chiots:{max:2},etoiles:[12000,15000]},
  {id:35,chap:3,coups:27,races:[0,5,7,8,9],plan:[" ...... ","........","..c..c..","........","........","........","bbbbbbbb"," bbbbbb "],obj:[{k:"chiots",n:2},{k:"boue"}],chiots:{max:2},etoiles:[17000,21500]},
  {id:36,chap:3,coups:30,races:[2,3,6,8,9],plan:["........","........",".c..c..c","........","........","........","bbbbbbbb","bbbbbbbb"],obj:[{k:"chiots",n:3},{k:"boue"}],chiots:{max:3},etoiles:[21000,26500]},
  {id:37,chap:4,coups:14,races:[0,1,6,9,10],plan:["........","........","........","........","..n..n..","........","........","........"],obj:[{k:"calins",t:10,n:25}],tuto:"niche",etoiles:[8500,12000]},
  {id:38,chap:4,coups:27,races:[2,3,7,8,10],plan:["........",".g....g.","........","........","bbbbbbbb","bbbbbbbb","bgbbbbgb","bbbbbbbb"],obj:[{k:"boue"}],tuto:"gamelle",etoiles:[17500,26000]},
  {id:39,chap:4,coups:28,races:[1,4,5,10,11],plan:["........",".g....g.","..    ..","..    ..","..    ..","..    ..",".g....g.","........"],obj:[{k:"calins",t:11,n:20},{k:"calins",t:10,n:20}],etoiles:[5000,6000]},
  {id:40,chap:4,coups:11,races:[0,3,6,9,11],plan:["........","........","..bbbb..","..bNNb..","..bNNb..","..bbbb..","........","........"],obj:[{k:"boue"}],etoiles:[8500,11500]},
  {id:41,chap:4,coups:20,races:[2,5,7,10,11],plan:["   ..   ","  ....  "," ..c... ","........","........","........","........","........"],obj:[{k:"chiots",n:2}],chiots:{max:1},etoiles:[10500,12500]},
  {id:42,chap:4,coups:16,races:[1,3,8,11,12],plan:["........","........","........","n.n..n.n","........","........","........","........"],obj:[{k:"calins",t:11,n:35},{k:"calins",t:12,n:20}],etoiles:[11000,15500]},
  {id:43,chap:4,coups:28,races:[0,4,6,10,12],plan:["NbbbbbbN","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb","NbbbbbbN"],obj:[{k:"boue"}],etoiles:[22500,28500]},
  {id:44,chap:4,coups:23,races:[2,3,9,11,12],plan:[" .g  g. ","........","g.c..c.g","........","........"," ...... ","  ....  ","   ..   "],obj:[{k:"chiots",n:3}],chiots:{max:2},etoiles:[11000,14500]},
  {id:45,chap:4,coups:30,races:[1,5,7,10,12],plan:["bbbbbbbb","bbbbbbbb","bbbbbbbb","bbbMMbbb","bbbMMbbb","bbbbbbbb","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"}],etoiles:[22500,26000]},
  {id:46,chap:4,coups:28,races:[0,3,10,11,12],plan:["........","........","c......c","........","........","........",".n....n.","........"],obj:[{k:"chiots",n:2}],chiots:{max:2},etoiles:[18000,22000]},
  {id:47,chap:4,coups:24,races:[4,6,9,11,12],plan:["   ..   ","  ....  "," ...... ","........","bbbbbbbb","gbbbbbbg","bbbbbbbb","bbgbbgbb"],obj:[{k:"boue"},{k:"calins",t:12,n:20}],etoiles:[14500,17500]},
  {id:48,chap:4,coups:22,races:[2,5,10,11,12],plan:["........",".g....g.","..c..c..","........","..n..n..","........","bgbbbbgb","bbbbbbbb"],obj:[{k:"chiots",n:2},{k:"boue"}],chiots:{max:2},etoiles:[16500,20000]},
  {id:49,chap:5,coups:14,races:[0,2,9,12,13],plan:["........",".l....l.","........","...l....","....l...","........",".l....l.","........"],obj:[{k:"calins",t:13,n:30}],tuto:"laisse",etoiles:[10000,13500]},
  {id:50,chap:5,coups:11,races:[1,4,8,11,13],plan:["........","........","..LbbL..","..bLLb..","..bLLb..","..LbbL..","........","........"],obj:[{k:"boue"}],etoiles:[9000,13000]},
  {id:51,chap:5,coups:17,races:[3,6,10,13,14],plan:[" ...... ","........","..c..c..","........","l.l..l.l","........","........"," ...... "],obj:[{k:"chiots",n:2}],chiots:{max:2},etoiles:[11000,13500]},
  {id:52,chap:5,coups:20,races:[0,5,7,12,14],plan:["   ..   ","  ....  "," ...... ","..l..l..","bblbblbb","bbbbbbbb","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"}],etoiles:[12000,14000]},
  {id:53,chap:5,coups:18,races:[2,8,11,13,14],plan:["........",".g....g.","........","...l....","....l...","........",".g....g.","........"],obj:[{k:"calins",t:14,n:35},{k:"calins",t:13,n:35}],etoiles:[11500,14500]},
  {id:54,chap:5,coups:32,races:[1,3,9,14,15],plan:["   bb   ","  bbbb  "," bbbbbb ","bblbblbb","bblbblbb"," bbbbbb ","  bbbb  ","   bb   "],obj:[{k:"boue"}],etoiles:[15000,19500]},
  {id:55,chap:5,coups:20,races:[0,4,12,14,15],plan:["  ....  ","  ....  ","..c..c..","..l..l..","..n..n..","........","  ....  ","  ....  "],obj:[{k:"chiots",n:2}],chiots:{max:2},etoiles:[10000,11500]},
  {id:56,chap:5,coups:27,races:[2,6,11,13,15],plan:["bbbbbbbb","bbbbbbbb","LbLbbLbL","bbbbbbbb","bbbbbbbb","LbLbbLbL","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"}],etoiles:[24000,31000]},
  {id:57,chap:5,coups:36,races:[1,5,8,14,15],plan:[" bb  bb ","bbbbbbbb","bbcbbcbb","bbbbbbbb","bbbbbbbb"," bbbbbb ","  bbbb  ","   bb   "],obj:[{k:"boue"},{k:"chiots",n:2}],chiots:{max:2},etoiles:[19000,22000]},
  {id:58,chap:5,coups:13,races:[0,3,13,14,15],plan:["........",".l....l.","........","...l....","....l...","........",".l....l.","........"],obj:[{k:"calins",t:15,n:30},{k:"calins",t:14,n:20}],etoiles:[11000,16000]},
  {id:59,chap:5,coups:26,races:[4,9,12,13,15],plan:["  gbbg  "," bbbbbb ","gbcbbcbg","bbbbbbbb","bbbbbbbb","gbbbbbbg"," bbbbbb ","  gbbg  "],obj:[{k:"boue"},{k:"chiots",n:2}],chiots:{max:2},etoiles:[17500,21000]},
  {id:60,chap:5,coups:29,races:[0,11,13,14,15],plan:["bbbbbbbb","bbbbbbbb","bbcBBcbb","bbBBBBbb","lblBBlbl","bbBBBBbb","bbbbbbbb","bbbbbbbb"],obj:[{k:"boue"},{k:"chiots",n:2}],chiots:{max:2},etoiles:[26500,31500]},
];
if (typeof module !== 'undefined') module.exports = { DOG_CHAPITRES, DOG_NIVEAUX };
