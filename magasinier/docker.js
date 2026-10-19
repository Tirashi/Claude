/* Le Magasinier : le docker, sprite pixel art 32×44 généré par code (repris de maquettes/magasinier-5.html, personnage A).
   Chaque couleur a 5 tons (reflet, clair, base, ombre, ombre profonde), lumière d'en haut à gauche, contour coloré.
   Vues : b (face), h (dos), d (profil droit), g (miroir de d) ; poses : n (marche en 4 temps), p (poussée),
   s (glissade), k (yeux fermés), v (victoire). MagDocker.images() : { 'bn0': canvas, … }, fabriquées une fois. */
const MagDocker = (function () {
const toile = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; return c; };

// Chaque teinte a 5 tons : reflet, clair, base, ombre, ombre profonde. La lumière vient d'en haut à gauche.
const RA={
  peau:["#ffe4c8","#f7caa2","#e9aa80","#c8805a","#8e5238"],chemise:["#ffffff","#f4eee2","#ddd4c2","#b4a992","#7c7262"],gilet:["#d0945e","#b07444","#8e5a34","#6c4226","#462a18"],
  pantalon:["#7088b8","#55699c","#405280","#2f3d62","#1f2842"],bottes:["#9a6c46","#7a5234","#5e3e26","#442c1a","#2a1a10"],casquette:["#b4bea0","#96a282","#7a8668","#5e6850","#3e4636"],
  brun:["#9a6a44","#7a4e30","#5e3a22","#462a18","#2e1a0e"],rouge:["#ff9a86","#f06450","#cc4036","#9a2a28","#621a1a"],creme:["#fffaf0","#f6ead2","#e2d0ae","#bea886","#867458"],
  bleugris:["#a6bcd4","#8098b8","#62799a","#4a5e7c","#303e56"],cuir:["#c89a6a","#a87a4c","#8a5e36","#6a4428","#442a18"],auburn:["#f0a060","#d07a3e","#a85a2c","#80421e","#522812"],
  bleuclair:["#d8ecff","#acd0f0","#84acd4","#6286b0","#405a7c"],tablier:["#c06a48","#a04e34","#7e3a26","#5e2a1c","#3c1a12"],toile:["#a89a80","#8a7c62","#6e624c","#544a3a","#382f24"],
  noir:["#5a6078","#41465c","#2e3246","#212434","#141622"],verre:["#e8fcff","#a8e8f4","#6ac4dc","#4090b0","#285c78"]};
const TENUE={haut:RA.chemise,gilet:RA.gilet,bas:RA.pantalon,bottes:RA.bottes,mains:RA.peau,retrousse:true,casquette:RA.casquette,cheveux:RA.brun,foulard:RA.rouge,barbe:true};
const YEUX="#2a1c28",JOUE="#f2a08c",SANGLE="#3a2a20",LW=32,LH=44;
function planche(){const px=new Array(LW*LH).fill(null);
  const set=(x,y,c)=>{if(x>=0&&y>=0&&x<LW&&y<LH)px[y*LW+x]=c;};
  const fill=(x,y,w,h,c)=>{for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++)set(i,j,c);};
  function blob(x,y,w,h,ra,o={}){const rr=Math.min(w,h)/2*(o.r??.5),dk=o.dk||0;
    const dans=(i,j)=>{if(i<x||j<y||i>=x+w||j>=y+h)return false;const cx=Math.min(Math.max(i+.5,x+rr),x+w-rr),cy=Math.min(Math.max(j+.5,y+rr),y+h-rr);return (i+.5-cx)**2+(j+.5-cy)**2<=rr*rr+.01;};
    for(let j=y;j<y+h;j++)for(let i=x;i<x+w;i++){if(!dans(i,j))continue;const nx=(i+.5-x)/w*2-1,ny=(j+.5-y)/h*2-1,l=-.45*nx-.75*ny+.3*(1-(nx*nx+ny*ny));
      let k=(l>.75?0:l>.2?1:l>-.4?2:3)+dk;if(!dans(i+1,j)||!dans(i,j+1))k=Math.max(k,3);set(i,j,ra[Math.max(0,Math.min(4,k))]);}}
  return {px,set,fill,blob};}
function finir(px){const c=toile(LW,LH),g=c.getContext("2d"),im=g.createImageData(LW,LH),d=im.data,rgb=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
  for(let y=0;y<LH;y++)for(let x=0;x<LW;x++){const i=y*LW+x;let col=px[i],cont=false;
    if(!col){for(const [a,b] of [[0,1],[1,0],[-1,0],[0,-1]]){const xx=x+a,yy=y+b;if(xx>=0&&yy>=0&&xx<LW&&yy<LH&&px[yy*LW+xx]){col=px[yy*LW+xx];cont=true;break;}}}
    if(!col)continue;let [r,v,b]=rgb(col);if(cont){r=r*.38+10;v=v*.34+6;b=b*.42+16;}d[i*4]=r;d[i*4+1]=v;d[i*4+2]=b;d[i*4+3]=255;}
  g.putImageData(im,0,0);return c;}
function perso(T,dir,pose,f){const {px,set,fill,blob}=planche(),P=RA.peau;
  const pas=(pose==="n"||pose==="p")?(f===1?1:f===3?-1:0):0,u=pas?-1:0,cligne=pose==="k",haut=pose==="v";
  if(dir!=="d"){const dos=dir==="h";
    // jambes
    if(pose==="s"){blob(9,32,5,8,T.bas,{r:.3});blob(18,32,5,8,T.bas,{r:.3,dk:1});blob(8,39,6,5,T.bottes,{r:.4});blob(18,39,6,5,T.bottes,{r:.4});}
    else{const lg=pas===-1?2:0,ld=pas===1?2:0;blob(11,32+u,5,8-u-lg,T.bas,{r:.3});blob(10,39-lg,6,5,T.bottes,{r:.4});blob(16,32+u,5,8-u-ld,T.bas,{r:.3,dk:1});blob(16,39-ld,6,5,T.bottes,{r:.4});}
    blob(10,29+u,12,5,T.bas,{r:.3});
    if(dos&&pose==="p"){blob(7,15+u,4,9,T.haut);blob(21,15+u,4,9,T.haut,{dk:1});blob(7,12+u,4,4,T.mains,{r:.7});blob(21,12+u,4,4,T.mains,{r:.7,dk:1});}
    blob(10,19+u,12,12,T.haut,{r:.35});
    if(T.gilet){if(dos)blob(10,19+u,12,11,T.gilet,{r:.3});else{blob(10,19+u,4,12,T.gilet,{r:.2});blob(18,19+u,4,12,T.gilet,{r:.2,dk:1});set(16,23+u,RA.chemise[4]);set(16,26+u,RA.chemise[4]);}}
    // bras
    if(pose==="s"){blob(1,20+u,9,4,T.haut,{r:.5});blob(22,20+u,9,4,T.haut,{r:.5,dk:1});blob(0,19+u,3,5,T.mains,{r:.6});blob(29,19+u,3,5,T.mains,{r:.6,dk:1});}
    else if(haut){blob(6,9,4,12,T.haut);blob(22,9,4,12,T.haut,{dk:1});blob(6,5,4,4,T.mains,{r:.7});blob(22,5,4,4,T.mains,{r:.7});}
    else if(pose==="p"&&!dos){blob(7,20+u,4,6,T.haut);blob(21,20+u,4,6,T.haut,{dk:1});blob(10,24+u,5,4,T.mains,{r:.6});blob(17,24+u,5,4,T.mains,{r:.6,dk:1});}
    else if(pose!=="p"){const la=pas===1?1:pas===-1?-1:0;blob(7,20+u,4,9,T.haut,{r:.5});blob(21,20+u,4,9,T.haut,{r:.5,dk:1});
      if(T.retrousse){blob(7,25+u,4,4,P);blob(21,25+u,4,4,P,{dk:1});}blob(7,28+u+la,4,4,T.mains,{r:.7});blob(21,28+u-la,4,4,T.mains,{r:.7,dk:1});}
    fill(14,18+u,4,2,P[3]);
    if(T.foulard){blob(11,18+u,10,3,T.foulard,{r:.6});if(!dos)blob(17,20+u,3,3,T.foulard);}
    blob(9,5+u,14,14,P,{r:.75});
    if(T.casquette){if(dos)blob(9,8+u,14,10,T.cheveux,{r:.6});else{blob(9,9+u,3,7,T.cheveux);blob(20,9+u,3,7,T.cheveux,{dk:1});}
      blob(8,3+u,16,8,T.casquette,{r:.7});if(!dos){fill(8,10+u,16,1,T.casquette[3]);fill(9,11+u,14,1,T.casquette[4]);}set(15,3+u,T.casquette[0]);set(16,3+u,T.casquette[1]);}
    if(!dos){if(cligne){fill(12,13+u,2,1,YEUX);fill(18,13+u,2,1,YEUX);}else{fill(12,12+u,2,2,YEUX);fill(18,12+u,2,2,YEUX);set(12,12+u,"#ffffff");set(18,12+u,"#ffffff");}
      set(11,15+u,JOUE);set(20,15+u,JOUE);fill(15,16+u,2,1,pose==="p"?P[4]:P[3]);if(haut)fill(14,16+u,4,2,P[4]);
      if(T.barbe)[[12,17],[14,17],[16,17],[18,17],[13,18],[17,18]].forEach(([x,y])=>set(x,y+u,P[3]));}
  }else{
    const ln=pose==="p"?1:0,e=pose==="s"?4:pas?3:0,sg=pas>=0?1:-1,sw=pas;
    if(pose==="p"){blob(17,22+u,9,4,T.haut,{dk:1});blob(25,21+u,4,4,T.mains,{dk:1});}
    else if(pose==="s"){blob(5,19+u,8,4,T.haut,{dk:1});blob(3,18+u,3,4,T.mains,{dk:1});}
    else if(haut){blob(12,9,4,12,T.haut,{dk:1});blob(12,5,4,4,T.mains,{dk:1});}
    else{const a=-pas*3;blob(14+a,20+u,4,9,T.haut,{dk:1});blob(14+a,28+u,4,4,T.mains,{dk:1});}
    const xb=13-e*sg,xf=13+e*sg;blob(xb,32+u,5,8-u,T.bas,{dk:1});blob(xb,39,7,5,T.bottes,{dk:1,r:.4});blob(xf,32+u,5,8-u,T.bas);blob(xf,39,7,5,T.bottes,{r:.4});
    blob(11,29+u,10,5,T.bas,{r:.3});
    blob(11+ln,19+u,10,12,T.haut,{r:.35});
    if(T.gilet){blob(11+ln,19+u,9,12,T.gilet,{r:.3});fill(19+ln,20+u,2,9,RA.chemise[2]);}
    fill(15+ln,18+u,4,2,P[3]);
    if(T.foulard){blob(12+ln,18+u,9,3,T.foulard,{r:.6});blob(9,19+u+(f%2),3,4,T.foulard,{dk:1});}
    blob(10+ln,5+u,14,14,P,{r:.75});set(24+ln,13+u,P[2]);set(24+ln,14+u,P[3]);
    if(T.casquette){blob(10+ln,8+u,7,9,T.cheveux);blob(9+ln,3+u,15,8,T.casquette,{r:.7});fill(18+ln,10+u,8,1,T.casquette[3]);fill(19+ln,11+u,7,1,T.casquette[4]);}
    set(15+ln,13+u,P[3]);set(15+ln,14+u,P[3]);
    if(cligne)fill(20+ln,13+u,2,1,YEUX);else{fill(20+ln,12+u,2,2,YEUX);set(20+ln,12+u,"#ffffff");}
    set(19+ln,15+u,JOUE);set(22+ln,16+u,P[3]);if(T.barbe)[[18,17],[20,17],[22,17],[19,18]].forEach(([x,y])=>set(x+ln,y+u,P[3]));
    if(pose==="p"){blob(17+ln,21+u,10,4,T.haut);blob(26,20+u,4,5,T.mains,{r:.6});}
    else if(pose==="s"){blob(18,19+u,9,4,T.haut);blob(27,18+u,3,4,T.mains,{r:.6});}
    else if(haut){blob(16,9,4,12,T.haut);blob(16,5,4,4,T.mains,{r:.7});}
    else{const a=pas*3;blob(15+a,20+u,4,9,T.haut);if(T.retrousse)blob(15+a,25+u,4,4,P);blob(15+a,28+u,4,4,T.mains,{r:.7});}
  }
  return finir(px);}let IMG = null;
function images() {
  if (IMG) return IMG;
  IMG = {};
  ["b", "h", "d"].forEach(d => ["n", "p", "s"].forEach(po => [0, 1, 2, 3].forEach(f => { IMG[d + po + f] = perso(TENUE, d, po, f); })));
  IMG.bk0 = perso(TENUE, "b", "k", 0); IMG.dk0 = perso(TENUE, "d", "k", 0); IMG.bv0 = perso(TENUE, "b", "v", 0);
  Object.keys(IMG).filter(c => c[0] === "d").forEach(c => { const m = toile(LW, LH), g = m.getContext("2d"); g.translate(LW, 0); g.scale(-1, 1); g.drawImage(IMG[c], 0, 0); IMG["g" + c.slice(1)] = m; });
  return IMG;
}
return { LW, LH, images };
})();
