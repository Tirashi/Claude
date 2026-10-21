/* =====================================================================
   LE THÉ DES JARLS · le DÉCOR (repris tel quel de la maquette 4 validée le 17/10,
   maquettes/the-des-jarls-4.html) : champ de bataille HD-2D de UW pixels de large,
   soldats en pixel art détourés (spriteA, mis en cache), dieux (spriteDieu),
   décor peint calculé une fois par taille (fondA, avantA), drakkar, bannières,
   dés en os gravé (deA). Aucune règle ici ; jeu.js s'en sert.
   Piège de la maquette 2 : une clé de cache faite de nombres additionnés se
   mélange → toujours joindre avec un séparateur (spriteA le fait).
   ===================================================================== */
"use strict";
const lisse=u=>u<=0?0:u>=1?1:u*u*(3-2*u);
const NOMS=['hache','fleche','casque','bouclier','main'];
const ICONES={
  hache:[".##..##..","###..#...","######...","###..#...",".##..#...",".....#...",".....#...",".....#...","....###.."],
  fleche:[".....####","......###",".....#.##","....#...#","...#.....","..#......","##.......","##.......","#.#......"],
  casque:[".........","...###...","..#####..",".#######.",".#######.","#########","##..#..##","#...#...#","....#...."],
  bouclier:["..#####..",".##...##.","##..#..##","#..###..#","#.#####.#","#..###..#","##..#..##",".##...##.","..#####.."],
  main:["...#.#...",".#.#.#.#.",".#.#.#.#.",".#.#.#.#.",".#######.","#########",".#######.","..#####..","..#####.."]
};

function rr(g,x,y,w,h,r){g.beginPath();g.moveTo(x+r,y);g.arcTo(x+w,y,x+w,y+h,r);g.arcTo(x+w,y+h,x,y+h,r);g.arcTo(x,y+h,x,y,r);g.arcTo(x,y,x+w,y,r);g.closePath()}
function icone(g,grille,x,y,c,col){g.fillStyle=col;grille.forEach((l,j)=>{for(let i=0;i<9;i++)if(l[i]==='#')g.fillRect(x+i*c,y+j*c,c+.3,c+.3)})}

function mk(w,h){const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c}
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};

/* ================= A : HD-2D ================= */
const UW=172; // largeur du champ de bataille, en pixels de sprite
const CORPS_GUERRIER=["....kHH.....","...khhhH....","...hhhhhH...","..HHHHHhH...","...bssseh...","...bsssssS..","...bbbbbbb..","....bbbbB...","...cTbbBtt..","..cctttttt..","..cCtttttTt.","..cCttttttT.","..cCllyllll.","..cCtttttTt.","...CttTtTT..","....pp.pP...","....pp.pP...","....PP.PP...","...LLl.LLl..","............"];
const CORPS_ARCHER=["....TTT.....","...TtttT....","..TttttTT...","..TtTssss...","..Ttssses...","..TtsssssS..","..TTsbbbb...","...TTbbB....","..wwTtttt...","..wwtttttt..","..wWttttttt.","..wWtttttTt.","..WWllyllll.","...WtttttTt.","...tttTtTT..","....pp.pP...","....pp.pP...","....PP.PP...","...LLl.LLl..","............"];
const EQUIPES=[{t:'#3f73d6',T:'#27498f',c:'#8a6440',C:'#5a3e26',r:'#f2ead8'},{t:'#c23a2e',T:'#7c2019',c:'#77706a',C:'#47423e',r:'#1e1a18'}];
const BARBES=[['#d9822b','#a85a18'],['#e6c66a','#b8963a'],['#8a4a20','#5e3012'],['#cfc6b6','#9a9284']];
function palette(s,v){const e=EQUIPES[s],b=BARBES[(v+s*2)%4];return{k:'#f2f6f8',h:v%3===2?'#c9a25a':'#b8c0c8',H:v%3===2?'#8a6a30':'#7d8590',s:'#f0c08e',S:'#c98f62',e:'#2a1a10',b:b[0],B:b[1],
  t:e.t,T:e.T,c:e.c,C:e.C,l:'#6a4424',L:'#3a2412',y:'#f2c94c',p:'#4c3d2e',P:'#2f251b',w:'#8a5a2e',W:'#5a3a1c',m:'#d8dde2',M:'#8a929a',f:'#f4efe4',r:e.r}}
function tracer(px,x0,y0,x1,y1,col){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0));for(let i=0;i<=n;i++)px(Math.round(x0+(x1-x0)*i/n),Math.round(y0+(y1-y0)*i/n),col)}
function bouclierCote(px,ox,Q,v){ // bouclier de profil (ellipse 5×11), motif selon v
  for(let y=0;y<11;y++)for(let x=0;x<5;x++){if((y===0||y===10)&&(x===0||x===4))continue;
    const bord=y===0||y===10||x===0||x===4;let c=Q.t;
    if(!bord){const m=v%4;if(m===0)c=x===2?Q.r:Q.t;else if(m===1)c=y>=4&&y<=6?Q.r:Q.t;else if(m===2)c=(y+x)%2?Q.T:Q.t;else c=y<5?Q.r:Q.t}
    px(ox+x,13+y,bord?Q.l:c)}
  px(ox+2,18,Q.y)}
const CACHE_A=new Map();
function spriteA(s,kind,pose,v,pr=4){
  const cle=[s,kind,pose,v,pr].join("|");if(CACHE_A.has(cle))return CACHE_A.get(cle);
  const W=28,H=30,c=mk(W,H),g=c.getContext('2d'),Q=palette(s,v);
  const px=(x,y,col)=>{if(x<0||y<0||x>=W||y>=H)return;g.fillStyle=col;g.fillRect(x,y,1,1)};
  const corps=kind===2?CORPS_ARCHER:CORPS_GUERRIER;
  // arrière : arme dans le dos
  if(kind===0&&pose!=='charge'){tracer(px,12,22,7,8,Q.w);for(const[x,y]of[[5,7],[6,7],[4,8],[5,8],[6,8],[4,9],[5,9],[6,9],[4,10],[5,10],[6,10],[5,11],[6,11]])px(x,y,Q.m);for(let y=8;y<=10;y++)px(4,y,Q.k)}
  if(kind===1){tracer(px,13,28,13,3,Q.w);px(13,0,Q.m);px(13,1,Q.m);px(12,2,Q.M);px(13,2,Q.m);px(14,2,Q.M)}
  if(kind===2&&pose!=='tir'){px(11,10,Q.w);for(let y=11;y<=20;y++)px(10,y,Q.w);px(11,21,Q.w)}
  corps.forEach((l,y)=>{for(let x=0;x<12;x++)if(l[x]!=='.')px(8+x,6+y,Q[l[x]])});
  if(kind===2){px(9,13,Q.f);px(10,12,Q.f);px(9,12,'#c23a2e')}
  // bras arrière
  if(pose!=='bouclier'){px(12,15,Q.T);px(12,16,Q.T);px(11,17,Q.T);px(11,18,Q.s)}
  if(kind===0&&pose==='charge'){px(17,14,Q.T);px(18,13,Q.T);px(19,12,Q.s);tracer(px,16,18,22,7,Q.w);
    for(const[x,y]of[[22,4],[23,4],[22,5],[23,5],[24,5],[23,6],[24,6],[24,7],[23,7],[24,8]])px(x,y,Q.m);px(24,5,Q.k);px(24,6,Q.k)}
  if(kind<2){
    if(pose==='bouclier'){px(16,14,Q.T);px(16,13,Q.T);for(let y=6;y<=12;y++)px(16,y,y<9?Q.s:Q.T);
      for(let x=10;x<=20;x++){px(x,2,Q.l);px(x,4,Q.l)}for(let x=9;x<=21;x++)px(x,3,(v%2&&x%3===0)?Q.r:Q.t);px(9,3,Q.l);px(21,3,Q.l);px(15,1,Q.y)}
    else bouclierCote(px,pose==='garde'?18:17,Q,v)}
  if(kind===2&&pose==='tir'){for(let x=16;x<=20;x++)px(x,14,x<20?Q.T:Q.s);px(21,14,Q.s);
    px(21,7,Q.w);for(let y=8;y<=20;y++)px(22,y,Q.w);px(21,21,Q.w);tracer(px,21,8,19,14,Q.f);tracer(px,19,14,21,20,Q.f);
    tracer(px,13,14,24,14,Q.w);px(25,14,Q.m);px(13,13,Q.f);px(13,15,Q.f)}
  // détourage et lumière du soleil (à droite de l'écran)
  const id=g.getImageData(0,0,W,H),d=id.data,a=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&d[(y*W+x)*4+3]>0,plein=[];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)plein.push(a(x,y));
  const P=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&plein[y*W+x],sun=s?-1:1;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;
    if(!P(x,y)){if(P(x+1,y)||P(x-1,y)||P(x,y+1)||P(x,y-1)){d[i]=27;d[i+1]=18;d[i+2]=20;d[i+3]=255}}
    else if(!P(x+sun,y)){d[i]=Math.min(255,d[i]*.55+255*.45);d[i+1]=Math.min(255,d[i+1]*.55+222*.45);d[i+2]=Math.min(255,d[i+2]*.55+170*.45)}
    else if(!P(x,y-1)){d[i]=Math.min(255,d[i]*1.15);d[i+1]=Math.min(255,d[i+1]*1.12);d[i+2]=Math.min(255,d[i+2]*1.08)}
    const b=(4-pr)*.09;if(b&&d[i+3]){d[i]=d[i]*(1-b)+150*b;d[i+1]=d[i+1]*(1-b)+162*b;d[i+2]=d[i+2]*(1-b)+200*b}}
  g.putImageData(id,0,0);
  const out=s?mk(W,H):c;if(s){const g2=out.getContext('2d');g2.translate(W,0);g2.scale(-1,1);g2.drawImage(c,0,0)}
  CACHE_A.set(cle,out);return out;
}
function detourer(c,col=[20,16,24]){const g=c.getContext('2d'),W=c.width,H=c.height,id=g.getImageData(0,0,W,H),d=id.data,pl=[];
  for(let i=0;i<W*H;i++)pl.push(d[i*4+3]>0);const P=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&pl[y*W+x];
  for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(!P(x,y)&&(P(x+1,y)||P(x-1,y)||P(x,y+1)||P(x,y-1))){const i=(y*W+x)*4;d[i]=col[0];d[i+1]=col[1];d[i+2]=col[2];d[i+3]=255}
  g.putImageData(id,0,0);return c}
function spriteDieu(thor){const c=mk(44,52),g=c.getContext('2d'),R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};
  if(thor){R(8,22,24,26,'#9a2a20');R(10,22,3,26,'#6a1a14');R(12,22,16,18,'#2c4a8c');R(12,22,4,18,'#1f3870');R(12,34,16,3,'#5a3a1e');R(18,34,4,3,'#f2c94c');
    R(13,40,6,8,'#4c3d2e');R(21,40,6,8,'#4c3d2e');R(12,47,7,3,'#3a2412');R(21,47,7,3,'#3a2412');R(8,23,4,12,'#f0c08e');R(8,30,4,3,'#7a5634');
    R(28,12,4,14,'#f0c08e');R(28,20,4,3,'#7a5634');R(29,7,2,6,'#7a4f2a');R(25,0,10,7,'#9aa3ad');R(25,0,10,2,'#e2e8ee');R(28,3,1,3,'#6ad0ff');R(31,3,1,3,'#6ad0ff');
    R(15,12,10,9,'#f0c08e');R(17,16,2,1,'#203060');R(21,16,2,1,'#203060');R(14,9,12,5,'#b8c0c8');R(15,9,6,1,'#eef3f6');
    R(9,7,5,3,'#fff');R(8,6,3,2,'#fff');R(26,7,5,3,'#fff');R(29,6,3,2,'#fff');R(14,19,12,8,'#c8542a');R(16,27,8,3,'#c8542a');R(17,30,2,2,'#a8441a');R(21,30,2,2,'#a8441a')}
  else{R(12,4,16,30,'#f0c75a');R(14,4,4,22,'#ffe9a0');R(15,7,10,9,'#f0c08e');R(17,11,2,1,'#2a5a30');R(21,11,2,1,'#2a5a30');R(18,14,4,1,'#c86a5a');
    R(13,4,2,2,'#e88ab0');R(19,3,2,2,'#fff');R(25,4,2,2,'#e88ab0');R(11,18,18,26,'#4fae6a');R(11,18,4,26,'#2f7a44');R(11,28,18,2,'#f2c94c');
    R(13,26,4,4,'#f0c08e');R(23,26,4,4,'#f0c08e');R(17,23,6,6,'#e4b030');R(18,24,2,2,'#fff0a0');R(20,21,2,2,'#3a8a3a');R(15,44,4,2,'#7a5634');R(21,44,4,2,'#7a5634')}
  return detourer(c)}
const DIEUX=[];
function posA(s,i,UH){const r=Math.floor(i/15),j=i%15,a=Math.floor(j/5),d=j%5,col=r*3+a,k=.74+d*.07;const x=UW/2-(26+col*6.9+(d%2)*2.5)*(.84+d*.035);return{x:Math.round(s?UW-x:x),y:Math.round(UH*(.64+d*.075)),r,k,d}}

/* décor peint (calculé une fois par taille) */
function crete(g,w,base,amp,seed,pas,u){g.beginPath();g.moveTo(0,base*u+2);
  for(let x=0;x<=w+pas;x+=pas){const y=base-amp*(.55+.28*Math.sin(x/w*7+seed)+.17*Math.sin(x/w*19+seed*3));g.lineTo(x*u,y*u)}g.lineTo(w*u,base*u+2);g.closePath()}
function fondA(u,UH){
  const Wd=UW*u,Hd=UH*u,c=mk(Wd,Hd),g=c.getContext('2d'),hz=UH*.47,P=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(Math.round(x*u),Math.round(y*u),Math.ceil(w*u),Math.ceil(h*u))};
  let gr=g.createLinearGradient(0,0,0,hz*u);gr.addColorStop(0,'#141c3c');gr.addColorStop(.45,'#4b5c90');gr.addColorStop(.8,'#d8968a');gr.addColorStop(1,'#f6c08a');g.fillStyle=gr;g.fillRect(0,0,Wd,hz*u+2);
  for(let i=0;i<50;i++)if(hash(i)<.8)P(hash(i+1)*UW,hash(i+2)*hz*.4,.5,.5,`rgba(255,255,255,${.3+hash(i+3)*.6})`);
  const sx=UW*.68*u,sy=(hz-3)*u;let rg=g.createRadialGradient(sx,sy,0,sx,sy,Wd*.6);rg.addColorStop(0,'rgba(255,240,200,1)');rg.addColorStop(.06,'rgba(255,214,150,.9)');rg.addColorStop(.25,'rgba(255,170,120,.35)');rg.addColorStop(1,'rgba(255,150,110,0)');g.fillStyle=rg;g.fillRect(0,0,Wd,Hd);
  g.filter=`blur(${u*1.2}px)`;
  for(let k=0;k<9;k++){const cx=hash(k+20)*UW,cy=hz*(.15+hash(k+30)*.45),rx=12+hash(k+40)*22,ry=2+hash(k+50)*3;
    const cg=g.createLinearGradient(0,(cy-ry)*u,0,(cy+ry)*u);cg.addColorStop(0,'rgba(120,130,175,.55)');cg.addColorStop(1,'rgba(255,170,140,.6)');g.fillStyle=cg;g.beginPath();g.ellipse(cx*u,cy*u,rx*u,ry*u,0,0,7);g.fill()}
  crete(g,UW,hz,hz*.62,1,3,u);g.fillStyle='#7d88b4';g.fill();
  g.save();g.clip();g.fillStyle='rgba(240,244,255,.85)';g.fillRect(0,0,Wd,(hz-hz*.36)*u);g.restore();
  crete(g,UW,hz,hz*.44,2.3,3,u);g.fillStyle='#56628f';g.fill();g.filter='none';
  crete(g,UW,hz+1,hz*.3,4.1,2,u);g.fillStyle='#323c5e';g.fill();
  for(let x=0;x<UW;x+=3){const y=hz+1-hz*.3*(.55+.28*Math.sin(x/UW*7+4.1)+.17*Math.sin(x/UW*19+12.3));if(hash(x)<.7){const h=3+hash(x+5)*3;g.fillStyle='#26304d';g.beginPath();g.moveTo(x*u,(y-h)*u);g.lineTo((x+1.6)*u,(y+1)*u);g.lineTo((x-1.6)*u,(y+1)*u);g.fill()}}
  gr=g.createLinearGradient(0,hz*u,0,(hz+7)*u);gr.addColorStop(0,'#e6b090');gr.addColorStop(.3,'#8a90b8');gr.addColorStop(1,'#4a5680');g.fillStyle=gr;g.fillRect(0,hz*u,Wd,7*u);
  for(let i=0;i<30;i++)P(hash(i+60)*UW,hz+1+hash(i+61)*5,2+hash(i+62)*5,.4,'rgba(255,240,220,.35)');
  const sol=hz+6.5;gr=g.createLinearGradient(0,sol*u,0,Hd);gr.addColorStop(0,'#6b8048');gr.addColorStop(.35,'#4d6a34');gr.addColorStop(1,'#2a4220');g.fillStyle=gr;g.fillRect(0,sol*u,Wd,Hd-sol*u);
  P(0,sol,UW,1,'#3a4a2a');
  // chemin de terre vers le fjord
  g.fillStyle='#8a7652';g.beginPath();g.moveTo((UW/2-4)*u,sol*u);g.lineTo((UW/2+4)*u,sol*u);g.lineTo((UW/2+26)*u,Hd);g.lineTo((UW/2-26)*u,Hd);g.fill();
  for(let i=0;i<60;i++){const t=hash(i+70),y=sol+t*(UH-sol),w=4+t*22;P(UW/2-w+hash(i+71)*w*2,y,1,1,hash(i+72)<.5?'#a8946a':'#6a5a3c')}
  for(let i=0;i<700;i++){const x=hash(i+100)*UW,y=sol+hash(i+101)*(UH-sol);if(Math.abs(x-UW/2)<5+(y-sol)*.45)continue;const t=hash(i+102);
    P(x,y,1,t<.2?2:1,t<.5?'#7f9a52':t<.8?'#33502a':'#5a7a3c')}
  for(let i=0;i<40;i++){const x=hash(i+200)*UW,y=sol+4+hash(i+201)*(UH-sol-4);if(Math.abs(x-UW/2)<8+(y-sol)*.45)continue;P(x,y,1,1,['#f4e06a','#e88ab0','#ffffff','#9ab8ff'][i%4])}
  // calque lointain : maison longue et pins sur l'autre rive, teintes brumeuses
  const loin=mk(UW,UH),gl=loin.getContext('2d'),L=(x,y,w,h,col)=>{gl.fillStyle=col;gl.fillRect(x,y,w,h)},rive=Math.round(hz+1);
  for(const x0 of[4,14,46,124,134,150,163]){const h=6+(x0%5);for(let k=0;k<h;k++)L(x0-Math.floor(k/2),rive-k-1,1+2*Math.floor(k/2)>h?h:1,1,'#3c4866'),L(x0-Math.floor((h-k)/2.2),rive-k-1,Math.max(1,2*Math.floor((h-k)/2.2)+1),1,'#3c4866')}
  const mx=Math.round(UW/2-27);L(mx,rive-5,17,5,'#6e5a62');for(let x=mx+1;x<mx+17;x+=3)L(x,rive-5,1,5,'#5c4a54');
  for(let r=0;r<4;r++)L(mx-1+r,rive-6-r,19-2*r,1,r%2?'#566a62':'#4e6058');L(mx+3,rive-11,1,2,'#5c4a54');L(mx+13,rive-11,1,2,'#5c4a54');L(mx+7,rive-3,2,3,'#ffc488');
  g.imageSmoothingEnabled=false;g.drawImage(detourer(loin,[44,46,72]),0,0,Wd,Hd);
  rg=g.createRadialGradient((mx+8)*u,(rive-2)*u,0,(mx+8)*u,(rive-2)*u,7*u);rg.addColorStop(0,'rgba(255,190,110,.4)');rg.addColorStop(1,'rgba(255,190,110,0)');g.fillStyle=rg;g.fillRect(mx*u,(rive-10)*u,16*u,16*u);
  // calque proche : pierre runique, buissons, rochers, détourés comme les soldats
  const pres=mk(UW,UH),gp=pres.getContext('2d'),Q=(x,y,w,h,col)=>{gp.fillStyle=col;gp.fillRect(x,y,w,h)};
  const px0=UW-11,py0=Math.round(UH*.62);Q(px0,py0-17,8,17,'#8a8a86');Q(px0+1,py0-18,6,1,'#8a8a86');Q(px0,py0-17,2,17,'#a6a6a0');Q(px0+6,py0-17,2,17,'#6a6a66');
  for(const[x,y]of[[3,-15],[4,-15],[3,-14],[4,-13],[3,-11],[2,-10],[4,-10],[5,-10],[3,-8],[3,-7],[4,-6],[3,-4],[4,-3]])Q(px0+x,py0+y,1,1,'#b0402a');Q(px0-2,py0,12,1,'#2e3e22');
  g.drawImage(detourer(pres),0,0,Wd,Hd);
  return c;
}
function avantA(u,UH){const Wd=UW*u,Hd=UH*u,c=mk(Wd,Hd),g=c.getContext('2d');g.filter=`blur(${u*1.3}px)`;
  for(let i=0;i<40;i++){const x=hash(i+300)*UW,h=6+hash(i+301)*10;g.strokeStyle=i%2?'#122010':'#1d3418';g.lineWidth=u*1.4;g.beginPath();g.moveTo(x*u,Hd+u);g.quadraticCurveTo((x+2)*u,Hd-h*.6*u,(x+(i%2?4:-3))*u,Hd-h*u);g.stroke()}
  g.filter='none';
  const pr=mk(UW,UH),gp=pr.getContext('2d'),Q=(x,y,w,h,col)=>{gp.fillStyle=col;gp.fillRect(x,y,w,h)};
  for(const[x,w,h]of[[-3,16,7],[UW-15,18,9]]){const y=UH-h+2;Q(x+2,y,w-4,1,'#7a7a74');Q(x+1,y+1,w-2,1,'#6a6a64');Q(x,y+2,w,h,'#5a5a56');Q(x+2,y+1,w/2,1,'#9a9a92');Q(x+w-5,y+3,3,h,'#46463f')}
  g.imageSmoothingEnabled=false;g.drawImage(detourer(pr),0,0,Wd,Hd);const v=g.createRadialGradient(Wd/2,Hd*.5,Hd*.3,Wd/2,Hd*.5,Hd*.85);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(6,8,22,.55)');g.fillStyle=v;g.fillRect(0,0,Wd,Hd);return c}
let DRAKKAR=null;
function drakkar(g,x,y,t){
  if(!DRAKKAR){const c=mk(24,18),q=c.getContext('2d'),P=(a,b,w,h,col)=>{q.fillStyle=col;q.fillRect(a,b,w,h)};
    P(3,15,17,1,'#4a3a3c');P(2,14,19,1,'#5a4448');P(1,12,2,2,'#5a4448');P(0,10,2,2,'#5a4448');P(21,12,2,2,'#5a4448');P(22,9,1,3,'#5a4448');P(22,8,2,1,'#5a4448');
    for(let k=0;k<4;k++)P(4+k*4,13,3,1,k%2?'#b06a64':'#d8ccbc');P(11,1,1,12,'#4a3a3c');
    for(let k=0;k<5;k++)P(7+k*2,2,2,9,k%2?'#d8ccbc':'#b0504a');P(7,1,10,1,'#4a3a3c');DRAKKAR=detourer(c,[44,46,72])}
  g.drawImage(DRAKKAR,Math.round(x),Math.round(y-17+Math.sin(t*1.3)*.6))}
const CORBEAU=["..##..",".####.","######","..##..",".#..#.","#....#"],LOUP=["#....#","##..##","######","#.##.#",".####.","..##.."];
function banniere(g,x,y,s,t){g.fillStyle='#3a2410';g.fillRect(x,y-36,1,36);g.fillStyle='#f2c94c';g.fillRect(x-1,y-37,3,1);
  const coul=s?'#8a1e18':'#1e3a7a',bord=s?'#5a120e':'#122a5a',em=s?LOUP:CORBEAU,dir=s?-1:1;
  for(let k=0;k<10;k++){const o=Math.round(Math.sin(t*4-k*.7)*1.2*(k/10)),cx=dir>0?x+1+k:x-1-k;g.fillStyle=k===9?bord:coul;g.fillRect(cx,y-35+o,1,k>8?10:12);
    if(k>=2&&k<8)em.forEach((l,j)=>{if(l[k-2]==='#'){g.fillStyle='#f2ead8';g.fillRect(cx,y-32+j+o,1,1)}})}}

function deA(g,x,y,s,face,garde,roule,now,petit){
  const ep=petit?2:s*.12,lev=garde?-6:0,j=roule?Math.sin(now*45+x)*2:0,X=x+j,Y=y+lev-(roule?Math.abs(Math.sin(now*30+x))*5:0),r=s*.2,or=face&&face.or;
  g.fillStyle='rgba(0,0,0,.45)';rr(g,x+3,y+ep+4,s,s,r);g.fill();
  if(garde&&!petit){g.save();g.globalCompositeOperation='lighter';const rg=g.createRadialGradient(x+s/2,y+s+ep,2,x+s/2,y+s+ep,s*.8);rg.addColorStop(0,'rgba(255,200,90,.55)');rg.addColorStop(1,'rgba(255,200,90,0)');g.fillStyle=rg;g.fillRect(x-s*.4,y,s*1.8,s*1.6);g.restore()}
  g.fillStyle=or?'#9a6a18':'#a8936a';rr(g,X,Y+ep,s,s,r);g.fill();
  const gr=g.createLinearGradient(X,Y,X+s*.3,Y+s);if(or){gr.addColorStop(0,'#fff0a8');gr.addColorStop(.5,'#e8b440');gr.addColorStop(1,'#b07a20')}else{gr.addColorStop(0,'#fbf4e2');gr.addColorStop(1,'#d8c49a')}
  g.fillStyle=gr;rr(g,X,Y,s,s,r);g.fill();
  if(!petit){g.strokeStyle=or?'rgba(120,70,10,.5)':'rgba(120,90,50,.45)';g.lineWidth=1;rr(g,X+s*.08,Y+s*.08,s*.84,s*.84,r*.7);g.stroke();
    g.fillStyle=or?'rgba(120,70,10,.5)':'rgba(120,90,50,.45)';for(const[a,b]of[[.08,.08],[.92,.08],[.08,.92],[.92,.92]])g.fillRect(X+s*a-1.5,Y+s*b-1.5,3,3);
    g.fillStyle='rgba(255,255,255,.6)';g.fillRect(X+r,Y+1.5,s-2*r,1.2)}
  const c=s*.56/9,ox=X+s*.22,oy=Y+s*.22;
  if(face){const gl=ICONES[roule?NOMS[Math.floor(now*14+x)%5]:face.f];icone(g,gl,ox+c*.4,oy+c*.4,c,or?'rgba(255,250,210,.7)':'rgba(255,255,255,.7)');icone(g,gl,ox,oy,c,or?'#5a2f06':'#4a2a14')}
  else{g.fillStyle='#8a6a48';g.font=`900 ${s*.5}px Cinzel, Georgia, serif`;g.textAlign='center';g.textBaseline='middle';g.fillText('?',X+s/2,Y+s/2+1)}
  if(garde){g.strokeStyle='#ffd36b';g.lineWidth=2;rr(g,X-1,Y-1,s+2,s+2+ep,r);g.stroke()}
}
