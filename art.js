const wrap=body=>`<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g stroke="#2d4141" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">${body}</g></svg>`;
const eyes='<circle cx="47" cy="50" r="3" fill="#2d4141"/><circle cx="73" cy="50" r="3" fill="#2d4141"/><path d="M52 64q8 7 16 0" fill="none"/>';
export function itemArt(kind,color='#f3b653',outline=false){
 let body='';
 const circle=(x,y,r,c)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`;
 const paths={
 apple:`<path d="M61 37C17 11 12 73 44 97q16 8 18-1 20 13 34-18 20-53-35-41" fill="${color}"/><path d="M60 35q-8-20 8-24M65 23q25-20 28 1-18 9-28-1" fill="#69a763"/>`,
 carrot:`<path d="m31 40 60 9-53 59z" fill="${color}"/><path d="M43 42 26 10l30 29 9-34 8 38 27-24-14 29" fill="#69a763"/><path d="m43 61 19 3m-20 17 10 2" fill="none"/>`,
 corn:`<ellipse cx="60" cy="57" rx="22" ry="42" fill="${color}"/><path d="M34 34q-7 61 28 72-3-47-28-72m55 10q8 46-27 62 0-34 27-62" fill="#70aa58"/><path d="M51 26v47m13-53v53m-21-35h33M42 51h32M44 64h29" fill="none"/>`,
 rocket:`<path d="M40 76V43Q41 17 60 7q20 10 20 36v33z" fill="${color}"/><path d="m40 57-20 32 22-4m38-28 20 32-22-4" fill="#ed765d"/><circle cx="60" cy="43" r="11" fill="#92d9e6"/><path d="m48 82 12 29 12-29" fill="#f7d67a"/>`,
 satellite:`<path d="m45 29 30 21-15 28-32-21z" fill="${color}"/><path d="M28 31 8 49l22 21 17-14m33-5 22 16-19 27-25-18" fill="#80bbd9"/><path d="m62 28 19-15m-9-5q25 3 24 24" fill="none"/>`,
 shuttle:`<path d="M58 9 74 58 106 83 74 81 60 106 46 81 14 83 46 58z" fill="${color}"/><path d="M51 46h18v15H51z" fill="#a0d6e0"/>`,
 planet:`<circle cx="60" cy="59" r="33" fill="${color}"/><ellipse cx="60" cy="62" rx="55" ry="13" transform="rotate(-25 60 62)" fill="none" stroke="#ab7cb7" stroke-width="9"/>`,
 moon:`<path d="M79 13a47 47 0 1 0 27 79A49 49 0 0 1 79 13" fill="${color}"/>${circle(34,64,6,'#d9cdb2')}${circle(48,88,4,'#d9cdb2')}`,
 star:`<path d="m60 10 15 31 34 5-25 25 6 36-30-17-31 17 6-36L10 46l35-5z" fill="${color}"/>`,
 fish:`<path d="m80 59 30-24v48z" fill="${color}"/><ellipse cx="50" cy="59" rx="37" ry="27" fill="${color}"/>${circle(30,51,4,'#2d4141')}<path d="m52 35 11-17 9 24m-20 42 11 17 9-22" fill="#efb260"/>`,
 turtle:`<ellipse cx="59" cy="64" rx="32" ry="27" fill="${color}"/>${circle(102,58,12,'#83b66e')}<path d="m38 42-15-14-8 12 18 16m5 28-15 13-9-9 17-18m46-24 7-17 12 4-6 20m-10 25 8 17 12-4-8-19" fill="#83b66e"/><path d="m43 50 22-7 16 19-10 19-26-4-7-16z" fill="none"/>`,
 crab:`<ellipse cx="60" cy="70" rx="30" ry="22" fill="${color}"/><path d="m31 65-20-16m76 16 20-16M32 80 12 86m20-4-12 20m67-22 20 7m-21-5 12 20M48 52v-17m24 17v-17" fill="none"/>${circle(47,33,6,'#fff')}${circle(74,33,6,'#fff')}<path d="M17 54Q-2 39 14 24l7 15 8-15q12 20-12 30m87 0q19-15 3-30l-7 15-8-15q-12 20 12 30" fill="${color}"/>`,
 submarine:`<rect x="15" y="43" width="84" height="43" rx="21" fill="${color}"/><path d="M55 42V22h18v9H65v11m34 15 13-8v29l-13-8" fill="${color}"/>${[35,57,79].map(x=>circle(x,64,8,'#9cdbeb')).join('')}`,
 goggles:`<path d="M12 45h96v39H12z" fill="${color}"/><path d="M18 49h32v28H18zm51 0h32v28H69z" fill="#a2e3ee"/><path d="M52 67q8-12 16 0M110 50V14H94" fill="none" stroke-width="8"/>`,
 flippers:`<path d="m20 35 26-8 13 72-51-2zM66 20l25 3 21 73-49 10z" fill="${color}"/><ellipse cx="34" cy="42" rx="10" ry="14" fill="#dae9df"/><ellipse cx="80" cy="37" rx="10" ry="14" fill="#dae9df"/>`,
 flower:`<path d="M60 62v49m0-25Q21 60 25 93q20 14 35 1m0-10q40-21 38 7-17 14-38 7" fill="#81b774"/>${[[40,39],[58,22],[80,36],[80,61],[50,64]].map(([x,y])=>circle(x,y,18,color)).join('')}${circle(60,45,16,'#f6d676')}`,
 leaf:`<path d="M16 100Q4 29 105 12q13 82-89 88" fill="${color}"/><path d="m13 108 74-76M33 83l-5-27m27 5-3-26m0 30 29 2" fill="none"/>`,
 mushroom:`<path d="M46 57h28l11 48H35z" fill="#f4e1b3"/><path d="M8 62Q13 1 60 10q48 0 53 52z" fill="${color}"/>${circle(39,35,8,'#fff6df')}${circle(77,37,10,'#fff6df')}`,
 butterfly:`<path d="M58 58Q3-6 9 50 5 81 49 64q-34 54 4 40l8-28 8 28q37 11 7-42 43 21 34-15 5-52-46 12" fill="${color}"/><path d="M61 44v51m-2-53L44 22m20 20 13-23" fill="none" stroke-width="6"/>`,
 owl:`<path d="m26 18 19 12q17-9 31 0l20-13v59q-4 36-36 36T24 76z" fill="${color}"/>${circle(43,55,17,'#fff0ca')}${circle(78,55,17,'#fff0ca')}${eyes}<path d="m51 76 10 10 10-10M35 102l-10 11m52-11 11 11" fill="#e4a757"/>`,
 hat:`<path d="M24 80V54q0-41 37-41t37 41v26z" fill="${color}"/><rect x="14" y="76" width="91" height="25" rx="9" fill="#f5e4c0"/>${circle(62,13,11,'#f5e4c0')}<path d="M44 43v25m17-27v27m17-25v25" fill="none"/>`,
 mitten:`<path d="M38 108V39q0-23 23-22t26 21v28q22-25 27-6 7 15-14 27l-12 22z" fill="${color}"/><rect x="34" y="94" width="59" height="20" rx="5" fill="#fff0ca"/>`,
 boot:`<path d="M30 11h49v62q41-2 31 31H24V61z" fill="${color}"/><path d="M24 98h87v13H24z" fill="#795b49"/><path d="M43 28h28M40 43h31M39 58h29" fill="none"/>`,
 penguin:`<ellipse cx="61" cy="62" rx="36" ry="49" fill="${color}"/><ellipse cx="61" cy="70" rx="25" ry="34" fill="#fff1d4"/><path d="m47 51 14 9 14-9M29 100l-9 13h33m34-13 10 13H65M26 45 8 83l21-12m66-26 15 38-18-12" fill="#eeb765"/>${circle(46,34,4,'#2d4141')}${circle(76,34,4,'#2d4141')}`,
 seal:`<path d="M19 99Q21 82 46 80V40q0-28 29-24 30 4 26 29L87 95z" fill="${color}"/><path d="M47 80 29 71l-9 15M21 99l-10 9m11-9 0 13" fill="none"/>${circle(66,36,3,'#2d4141')}${circle(88,36,3,'#2d4141')}<path d="m69 50 8 5 7-6m-11 9-17 2m24-2 19 2" fill="none"/>`,
 car:`<path d="m14 68 12-28h52l19 26h13v28H9V68z" fill="${color}"/><path d="m33 46-8 22h27V46zm27 0v22h27L73 46z" fill="#b1e1e2"/>${circle(30,94,13,'#3f5261')}${circle(90,94,13,'#3f5261')}`,
 train:`<path d="M8 59h52V27h42v65H8z" fill="${color}"/><path d="M17 58V34h15v24M53 26h57v-9H53z" fill="#7499b3"/><rect x="71" y="38" width="20" height="23" fill="#b3e4e0"/>${[25,54,88].map(x=>circle(x,96,12,'#405469')).join('')}`,
 bicycle:`${circle(28,85,22,'#dceade')}${circle(94,85,22,'#dceade')}<path d="m28 85 25-43 41 43H28l21-32h29M73 22l21 63M70 23h19M42 41h22" fill="none" stroke="${color}" stroke-width="7"/>`,
 ball:`${circle(60,60,48,color)}<path d="M12 60h96M60 12q-44 48 0 96 44-48 0-96" fill="none"/>`,
 blocks:`<path d="M12 62h43v43H12zM60 62h47v43H60zM37 13h48v44H37z" fill="${color}"/><path d="m35 74-10 19h19zM48 28h26v19H48z" fill="#faeccb"/>${circle(83,84,12,'#faeccb')}`,
 dragon:`<path d="m27 78-23 27 35-3m41-24 32 22-34 7M29 61 14 34l28 12m39 5 23-24-7 43" fill="#b8dc84"/><ellipse cx="60" cy="77" rx="28" ry="31" fill="${color}"/><path d="M35 48Q28 10 61 13q38 0 30 45-4 24-29 21T35 48" fill="${color}"/><path d="m43 22 1-18 14 13m17 1L88 5l-1 22" fill="#f0c16c"/>${eyes}<path d="m40 102-12 9m50-9 12 9" fill="none"/>`,
 teddy:`${circle(31,29,17,color)}${circle(89,29,17,color)}<ellipse cx="60" cy="85" rx="30" ry="27" fill="${color}"/>${circle(60,51,34,color)}<ellipse cx="60" cy="65" rx="18" ry="13" fill="#fff0d3"/>${eyes}<path d="m53 59 7 5 7-5" fill="#765b50"/>`,
 cow:`<path d="m31 27-18-14-3 25 22 8m57-19 18-14 3 25-22 8" fill="#fff4d6"/><rect x="23" y="24" width="74" height="71" rx="28" fill="${color}"/><ellipse cx="60" cy="81" rx="39" ry="20" fill="#eaa897"/><path d="M29 32q33-13 26 13-9 19-29 13" fill="#66746b"/>${eyes}`,
 sheep:`${[[33,34],[57,24],[84,34],[94,58],[80,81],[55,91],[29,76],[22,52]].map(([x,y])=>circle(x,y,21,color)).join('')}<ellipse cx="58" cy="56" rx="24" ry="30" fill="#b3a79b"/>${eyes}`,
 hen:`<path d="M82 56Q95 15 65 19q-28 7-24 47-41-14-29 14 8 27 41 26 45 3 49-24L83 65" fill="${color}"/><path d="m80 32 29 11-30 10M58 104v12m21-14v14M54 21q-9-25 4-13 9-19 17 5" fill="#ed9560"/>${circle(69,35,4,'#2d4141')}`,
 fox:`<path d="m25 8 29 21h20l25-21 3 62-42 39L17 70z" fill="${color}"/><path d="m23 60 37 24 36-24-36 49z" fill="#fff0cf"/>${eyes}<path d="m51 85 10 9 10-9" fill="#2d4141"/>`,
 bear:`${circle(31,29,17,color)}${circle(89,29,17,color)}<ellipse cx="60" cy="72" rx="41" ry="38" fill="${color}"/><ellipse cx="60" cy="73" rx="22" ry="17" fill="#fff0d3"/>${eyes}<path d="m54 69 7 7 7-7" fill="#2d4141"/>`
 };
 body=paths[kind]||paths.star;
 if(outline)body=body.replace(/fill="(?!none|#2d4141)[^"]+"/g,'fill="#ffffff"');
 return wrap(body);
}
export const palettes=['#ec7e72','#f2c96b','#7ebdd5'];
export function sceneArt(index){
 const skies=['#b9e5df','#292e66','#7fd2e0','#b8dac2','#c2dfe9','#f5d5b6'],grounds=['#99c66d','#7275a3','#e7cd91','#86b26b','#eef4e6','#bda285'];
 const extras=[
 '<path d="M10 170V91L68 45l61 46v79" fill="#e68370"/><path d="m0 96 70-58 73 58" fill="#7a665b"/><rect x="45" y="112" width="40" height="58" fill="#f0dbaf"/><path d="M260 180v-64m-30 0h60" stroke="#faf0cb" stroke-width="10"/>',
 '<circle cx="285" cy="40" r="26" fill="#eebf78"/><ellipse cx="285" cy="40" rx="46" ry="8" fill="none" stroke="#cb95b5" stroke-width="7"/><path d="m40 31 5 10 11 2-8 7 1 11-9-5-10 5 2-11-8-7 11-2zM177 10l4 8 9 1-7 6 2 10-8-4-8 4 1-10-6-6 9-1z" fill="#f6e9b5"/>',
 '<path d="M15 200q21-58 7-94m0 46-14-24m15 2 20-18M297 200q-22-65-4-97m-3 47 27-24m-21 0-16-28" stroke="#538f86" stroke-width="11" fill="none"/><circle cx="92" cy="28" r="9" fill="none" stroke="#ddf3e6"/><circle cx="123" cy="67" r="6" fill="none" stroke="#ddf3e6"/>',
 '<path d="M26 187V55m283 134V46" stroke="#857354" stroke-width="17"/><circle cx="25" cy="46" r="50" fill="#68a571"/><circle cx="312" cy="45" r="62" fill="#6da67c"/><path d="M14 201q85-77 169-18t142-12" stroke="#d7cb92" stroke-width="25" fill="none"/>',
 '<path d="m8 145 57-96 69 95m52 7 74-120 77 122" fill="#9cb8cb"/><path d="m38 93 27-44 30 43-20-8-12 10-13-13m185-16 25-34 25 39-25-11z" fill="#f1f2e5"/>',
 '<rect x="26" y="31" width="89" height="89" rx="8" fill="#fff1cd"/><path d="M71 32v88m-44-45h87" stroke="#cba782" stroke-width="6"/><rect x="244" y="82" width="63" height="87" rx="6" fill="#a7bdab"/><path d="M244 108h63m-63 31h63" stroke="#819b94" stroke-width="4"/>'
 ];
 return `<svg viewBox="0 0 340 220" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="340" height="220" fill="${skies[index]}"/><path d="M0 154q80-35 164-5t176-3v74H0z" fill="${grounds[index]}"/>${extras[index]}</svg>`;
}
