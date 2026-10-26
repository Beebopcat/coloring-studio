import {pages} from './coloring-pages.js';
import {buildRegions,regionAt} from './coloring-engine.mjs';
import {validColor,whiteSurface,mergeBounds,randomFrom,strokeSegment,applyOperation,compositeInk,extractPatch,restorePatch,validOperation} from './paint-tools.mjs';

import {createExamplePreview} from './color-example.js';
import {paperLayout} from './coloring-layout.js';

export function createColoringStudio({root=document,opener=root.querySelector('[data-open-coloring]'),onOpen,onClose}={}){
const $=id=>root.querySelector('#'+id);
const dialog=$('color-dialog'),canvas=$('paint-canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const viewport=$('paint-viewport'),paper=$('color-page'),marker=paper.querySelector('.paint-cursor');
const paints=[
 ['Petal','#ffd9dc'],['Rose','#f291ab'],['Coral','#ef6b58'],['Cherry','#d93645'],['Burgundy','#792c46'],
 ['Peach','#ffd2ac'],['Apricot','#ffb66d'],['Pumpkin','#f28c28'],['Ember','#d45a23'],['Rust','#8f422b'],
 ['Ivory','#fff9df'],['Butter','#ffed9d'],['Sunshine','#ffd64a'],['Marigold','#dba62d'],['Ochre','#9c7625'],
 ['Lime cream','#ecf2b3'],['Lime','#bedc71'],['Meadow','#79b951'],['Fern','#45874d'],['Pine','#245541'],
 ['Mint','#d0f0d8'],['Seafoam','#8ed0b1'],['Jade','#41af95'],['Teal','#268681'],['Deep sea','#205b64'],
 ['Ice','#d6f1ff'],['Sky','#91d2ef'],['Azure','#4ba6d4'],['Lake','#3779b8'],['Midnight','#283b6b'],
 ['Periwinkle','#d8dbfc'],['Iris','#acb0f1'],['Bluebell','#7d86d6'],['Indigo','#5b5a9e'],['Plum','#493359'],
 ['Lavender','#ecdaf9'],['Lilac','#cfa7e4'],['Orchid','#b77bc9'],['Berry','#974b9b'],['Grape','#642d73'],
 ['Blush','#f8e0d4'],['Sand','#e8c6a2'],['Honey','#cc9b6a'],['Chestnut','#9c6a48'],['Umber','#654632'],
 ['Porcelain','#fff0e5'],['Warm beige','#eac6b2'],['Sienna','#cb9175'],['Cocoa','#98624f'],['Espresso','#54362d'],
 ['White','#ffffff'],['Pearl','#eee9e4'],['Fog','#c4c6cd'],['Slate','#828b9c'],['Charcoal','#414857'],
 ['Silver','#d9e0e6'],['Steel','#a0b0b7'],['Moss gray','#777f74'],['Ink','#302e39'],['Black','#111111']
];
const PREF='casey.coloring-studio.v1.preferences',memory=new Map();
const toolNames={round:'Round brush',flat:'Flat brush',crayon:'Crayon',spray:'Spray paint',bucket:'Paint bucket',hand:'Move paper'};
const sizeNames={24:'Small',56:'Medium',100:'Big',160:'Giant'};
let current=pages[0],collection='halloween',paint='#f28c28',loaded=false,request=0,zoom=1,tool='round',diameter=56;
let original,regions,surface,composed,imageData,colors={},actions=[],undo=[],redo=[],historyBytes=0,revision=0,keyboard=false,hover=false,brush={x:0,y:0},inspiration=false;
let active=null,pan=null,frame=null,sprayTimer=null,strokeSerial=0,spaceDrawing=false,referenceReady=false;
const examples=createExamplePreview({onChange:s=>{
 const previewFinished=inspiration&&!s.visible&&s.clicked&&s.available;
 inspiration=s.visible;const img=$('color-inspiration'),button=$('show-inspiration');img.hidden=!inspiration;button.setAttribute('aria-pressed',String(inspiration));button.classList.toggle('example-glow',s.glowing);button.textContent=inspiration?'My painting':'Color example';
 canvas.dataset.example=String(inspiration);canvas.removeAttribute('aria-hidden');canvas.tabIndex=0;controls();cursor();
 if(previewFinished&&loaded&&dialog.open&&s.page===current.id)message('Your drawing sheet is ready. Choose a color and paint.');
}});
try{const pref=JSON.parse(localStorage.getItem(PREF)||localStorage.getItem('casey.thirteenth-lantern.studio.v1.preferences')||localStorage.getItem('casey.pocket-dragon.studio.v3.preferences'));if(pages.some(p=>p.id===pref?.page))current=pages.find(p=>p.id===pref.page);if(/^#[a-f0-9]{6}$/i.test(pref?.paint))paint=pref.paint;collection=current.group;}catch{}
let dbPromise;
function database(){
 if(!dbPromise)dbPromise=new Promise((resolve,reject)=>{const open=indexedDB.open('pocket-dragon-coloring-v3',1);open.onupgradeneeded=()=>open.result.createObjectStore('paintings');open.onsuccess=()=>resolve(open.result);open.onerror=()=>reject(open.error);open.onblocked=()=>reject(Error('Painting storage is busy.'));});
 return dbPromise;
}
async function readPainting(id){if(memory.has(id))return memory.get(id);try{const db=await database();return await new Promise((resolve,reject)=>{const q=db.transaction('paintings').objectStore('paintings').get(id);q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}catch{return null;}}
function preferences(){try{localStorage.setItem(PREF,JSON.stringify({page:current.id,paint}));}catch{}}
async function save(){
 const id=current.id,rev=revision,record=structuredClone({version:2,width:canvas.width,height:canvas.height,colors,actions});memory.set(id,record);$('painting-save').textContent='Saving…';
 try{const db=await database();await new Promise((resolve,reject)=>{const tx=db.transaction('paintings','readwrite');tx.objectStore('paintings').put(record,id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});if(current.id===id&&revision===rev)$('painting-save').textContent='Saved on this device';}
 catch{if(current.id===id)$('painting-save').textContent='Use Save picture to keep your art';}
}
function message(text){$('paint-tip').textContent=text;}
function activePages(){return pages.filter(p=>p.group===collection);}
function library(){
 for(const b of dialog.querySelectorAll('[data-collection]'))b.setAttribute('aria-pressed',String(b.dataset.collection===collection));
 $('picture-buttons').replaceChildren(...activePages().map(p=>{const b=document.createElement('button');b.className='picture-card';b.dataset.page=p.id;b.setAttribute('aria-pressed',String(p.id===current.id));b.setAttribute('aria-label','Color '+p.title);const img=new Image();img.src=p.image;img.alt='';img.loading='lazy';img.decoding='async';const text=document.createElement('span');text.textContent=p.title;b.append(img,text);return b;}));
}
function showLibrary(show){finishStroke();$('picture-library').hidden=!show;$('library-toggle').setAttribute('aria-expanded',String(show));if(show){library();$('close-library').focus();}else $('library-toggle').focus();}
function updateSelection(){for(const b of $('picture-buttons').children)b.setAttribute('aria-pressed',String(b.dataset.page===current.id));$('drawing-title').textContent=current.title;$('drawing-category').textContent=collection==='halloween'?'HALLOWEEN':'ADVENTURES';$('page-number').textContent=(activePages().indexOf(current)+1)+' / '+activePages().length;$('show-inspiration').hidden=false;$('show-inspiration').title=current.reference?'See the finished color example':'No finished color example is available for this sheet yet';}
function palette(){
 $('palette').replaceChildren(...paints.map(([name,color])=>{const b=document.createElement('button');b.style.background=color;b.dataset.paint=color;b.title=name;b.setAttribute('aria-label',name+' paint');b.setAttribute('aria-pressed',String(paint===color));const c=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));b.style.setProperty('--check',c[0]*.299+c[1]*.587+c[2]*.114>160?'#332d35':'#fff');return b;}));setColor(paint);
}
function setColor(color){if(!validColor(color))return;finishStroke();paint=color.toLowerCase();$('selected-color').textContent=paints.find(p=>p[1]===paint)?.[0]||'Your color';$('selected-hex').textContent=paint.toUpperCase();$('selected-swatch').style.background=paint;$('custom-paint').value=paint;paper.style.setProperty('--brush-color',paint);for(const b of $('palette').children)b.setAttribute('aria-pressed',String(b.dataset.paint===paint));preferences();}
function setTool(next){if(!Object.hasOwn(toolNames,next))return;finishStroke();tool=next;paper.dataset.tool=tool;canvas.dataset.tool=tool;for(const b of dialog.querySelectorAll('button[data-tool]'))b.setAttribute('aria-pressed',String(b.dataset.tool===tool));$('size-name').textContent=['bucket','hand'].includes(tool)?(tool==='bucket'?'Tap inside a shape':'Drag to move the paper'):(sizeNames[diameter]||diameter+' px');canvas.setAttribute('aria-label',current.title+'. '+(tool==='hand'?'Move the paper. Arrow keys pan; Shift moves farther; Home returns to the top left.':'Drawing canvas. Arrow keys move the brush. Enter makes a mark; hold Space while using arrows to draw.'));controls();cursor();message(tool==='bucket'?'Pick a color, then tap inside an enclosed shape.':tool==='hand'?'Drag the paper or use arrow keys to explore it. Home returns to the top left.':'Pick a color and draw. '+toolNames[tool]+' is ready.');}
function setSize(value){finishStroke();diameter=Math.max(8,Math.min(180,Math.round(+value)||56));$('brush-size').value=diameter;$('size-name').textContent=sizeNames[diameter]||diameter+' px';for(const b of dialog.querySelectorAll('[data-size]'))b.setAttribute('aria-pressed',String(+b.dataset.size===diameter));cursor();}
function hasPainting(){return Object.keys(colors).length>0||actions.length>0;}
function controls(){
 $('undo-paint').disabled=!loaded||!undo.length||inspiration;$('redo-paint').disabled=!loaded||!redo.length||inspiration;$('reset-drawing').disabled=!loaded||!hasPainting()||inspiration;
 for(const id of ['print','download-paint','zoom-fit'])$(id).disabled=!loaded;$('show-inspiration').disabled=!loaded||!referenceReady;
 $('zoom-in').disabled=!loaded||zoom>=4;$('zoom-out').disabled=!loaded||zoom<=1;
 for(const b of dialog.querySelectorAll('button[data-tool]'))b.disabled=!loaded||inspiration;
 const sized=loaded&&!inspiration&&!['bucket','hand'].includes(tool);$('brush-size').disabled=!sized;for(const b of dialog.querySelectorAll('[data-size]'))b.disabled=!sized;
}
function imageAt(src){return new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('This picture could not load. Choose it again to retry.'));img.src=src;});}
function renderDirty(bounds=null){if(!surface)return;compositeInk(original,surface,composed,bounds);if(bounds)ctx.putImageData(imageData,0,0,bounds.left,bounds.top,bounds.right-bounds.left+1,bounds.bottom-bounds.top+1);else ctx.putImageData(imageData,0,0);canvas.dataset.revision=String(revision);canvas.dataset.coloredRegions=String(new Set([...Object.keys(colors),...actions.filter(a=>a.tool==='bucket').map(a=>String(a.region))]).size);canvas.dataset.brushStrokes=String(actions.filter(a=>a.tool!=='bucket').length);}
function render(){surface=whiteSurface(canvas.width,canvas.height);for(const [region,color] of Object.entries(colors))applyOperation(surface,regions,{tool:'bucket',region:+region,color});for(const operation of actions)applyOperation(surface,regions,operation);composed=new Uint8ClampedArray(original);imageData=new ImageData(composed,canvas.width,canvas.height);renderDirty();}
function hideInspiration(){examples.hide();}
async function draw(page=current){
 finishStroke();releasePointer();examples.resetPage(page.id);referenceReady=false;const token=++request;current=page;loaded=false;undo=[];redo=[];historyBytes=0;colors={};actions=[];zoom=1;revision=0;hover=false;keyboard=false;
 hideInspiration();updateSelection();preferences();controls();$('paint-loading').hidden=false;$('paint-loading').textContent='Opening your picture…';paper.style.visibility='hidden';marker.hidden=true;message('Your picture is getting ready.');
 try{
  const [image,saved,reference]=await Promise.all([imageAt(current.image),readPainting(current.id),current.reference?imageAt(current.reference).catch(()=>null):Promise.resolve(null)]);if(token!==request)return;
  canvas.width=image.naturalWidth;canvas.height=image.naturalHeight;ctx.drawImage(image,0,0);original=ctx.getImageData(0,0,canvas.width,canvas.height).data;regions=buildRegions(original,canvas.width,canvas.height);
  if([1,2].includes(saved?.version)&&saved.width===canvas.width&&saved.height===canvas.height){colors=Object.fromEntries(Object.entries(saved.colors||{}).filter(([r,c])=>Number.isInteger(+r)&&+r>0&&+r<=regions.count&&validColor(c)));if(saved.version===2&&Array.isArray(saved.actions)){let points=0;actions=saved.actions.slice(0,4000).filter(a=>{if(!validOperation(a,regions))return false;points+=a.points?.length||0;return points<=200000;});}}
  render();loaded=true;canvas.dataset.page=current.id;canvas.dataset.regions=String(regions.count);canvas.setAttribute('aria-label',current.title+'. Drawing canvas. Arrow keys move the brush. Enter makes a mark; hold Space while using arrows to draw.');brush={x:canvas.width/2,y:canvas.height/2};paper.style.visibility='visible';$('paint-loading').hidden=true;$('painting-save').textContent=hasPainting()?'Your saved art is back':'Saves on this device';fit();viewport.scrollTo(0,0);controls();setTool(tool);referenceReady=!!reference;if(reference){$('color-inspiration').src=reference.src;$('color-inspiration').alt='Color example for '+current.title;examples.resetPage(current.id,{hasExample:true});message('Tap the picture once. Your drawing sheet appears three seconds later.');}else{examples.resetPage(current.id);controls();}
 }catch(error){if(token!==request)return;$('paint-loading').textContent=error.message;message('Choose another picture, or choose this one again to retry.');}
}
function fit(){
 if(!loaded||!dialog.open||viewport.clientWidth<=0||viewport.clientHeight<=0)return;const style=getComputedStyle(viewport),layout=paperLayout({viewportWidth:viewport.clientWidth,viewportHeight:viewport.clientHeight,paddingLeft:parseFloat(style.paddingLeft)||0,paddingRight:parseFloat(style.paddingRight)||0,paddingTop:parseFloat(style.paddingTop)||0,paddingBottom:parseFloat(style.paddingBottom)||0,nativeWidth:canvas.width,nativeHeight:canvas.height,zoom});
 paper.style.width=layout.width+'px';paper.style.height=layout.height+'px';paper.style.margin='auto';$('zoom-label').textContent=Math.round(zoom*100)+'%';cursor();controls();
}
const resizeObserver=new ResizeObserver(()=>{finishStroke();releasePointer();fit();if(zoom===1)viewport.scrollTo(0,0);});resizeObserver.observe(viewport);
function cursor(){marker.hidden=!loaded||inspiration||tool==='hand'||(!keyboard&&!hover);const scale=(parseFloat(paper.style.width)||canvas.width)/canvas.width,size=tool==='bucket'?16:Math.max(4,diameter*scale);marker.style.width=size+'px';marker.style.height=size+'px';marker.style.left=brush.x/canvas.width*100+'%';marker.style.top=brush.y/canvas.height*100+'%';}
function snapshot(){return {colors:{...colors},actions:[...actions]};}
function remember(before,previous,bounds){
 if(!bounds)return;for(const entry of redo)historyBytes-=entry.bytes;redo=[];
 const first=extractPatch(before,canvas.width,bounds),last=extractPatch(surface.pixels,canvas.width,bounds),entry={bounds,before:first,after:last,previous,next:snapshot(),bytes:first.byteLength+last.byteLength};undo.push(entry);historyBytes+=entry.bytes;
 while(undo.length>60||historyBytes>32*1024*1024){const removed=undo.shift();historyBytes-=removed.bytes;}
}
function changed(text,bounds=null){revision++;renderDirty(bounds);save();controls();message(text);}
function flushStroke(){
 if(!active)return;let dirty=null;
 while(active.processed<active.operation.points.length){const i=active.processed++,point=active.operation.points[i],previous=active.operation.points[Math.max(0,i-1)];dirty=mergeBounds(dirty,strokeSegment(surface,active.operation,previous,point,active.random));}
 active.dirty=mergeBounds(active.dirty,dirty);if(dirty)renderDirty(dirty);
}
function scheduleStroke(){if(frame===null)frame=requestAnimationFrame(()=>{frame=null;flushStroke();});}
function appendPoint(point,force=false){if(!active)return;const last=active.operation.points.at(-1);if(!force&&Math.hypot(point.x-last.x,point.y-last.y)<1.5)return;if(active.operation.points.length>=20000){finishStroke();return;}active.operation.points.push(point);scheduleStroke();}
function beginStroke(point){if(!loaded||inspiration||['bucket','hand'].includes(tool))return;if(active)finishStroke();const seed=(Date.now()^Math.imul(++strokeSerial,2654435761))>>>0;active={operation:{tool,color:paint,size:diameter,seed,points:[point]},before:surface.pixels.slice(),previous:snapshot(),processed:0,dirty:null,random:randomFrom(seed)};flushStroke();if(tool==='spray')sprayTimer=setInterval(()=>{if(active)appendPoint({...brush},true);},45);}
function stopTimers(){if(frame!==null)cancelAnimationFrame(frame);frame=null;if(sprayTimer!==null)clearInterval(sprayTimer);sprayTimer=null;}
function finishStroke(){
 if(!active)return;stopTimers();flushStroke();const stroke=active;active=null;spaceDrawing=false;
 if(stroke.dirty){actions.push(Object.freeze({...stroke.operation,points:Object.freeze(stroke.operation.points.map(p=>Object.freeze(p)))}));remember(stroke.before,stroke.previous,stroke.dirty);changed('Lovely! Undo takes back the whole stroke.',stroke.dirty);}
}
function cancelStroke(){if(!active)return;stopTimers();const stroke=active;active=null;spaceDrawing=false;surface.pixels.set(stroke.before);if(stroke.dirty)renderDirty(stroke.dirty);message('That stroke was put back. Your earlier art is safe.');}
function fill(x,y){
 if(!loaded||inspiration)return;finishStroke();const region=regionAt(regions,x,y);if(!region){message('Tap inside a shape. The ink stays in place.');return;}
 const before=surface.pixels.slice(),previous=snapshot(),operation={tool:'bucket',region,color:paint},bounds=applyOperation(surface,regions,operation);if(!bounds)return;actions.push(operation);remember(before,previous,bounds);canvas.dataset.filledPixels=regions.sizes[region];changed('A shape filled. Keep painting, or choose a brush.',bounds);
}
function selectPage(page,{closeLibrary=true}={}){finishStroke();const changedCollection=page.group!==collection;collection=page.group;if(changedCollection)library();if(closeLibrary){$('picture-library').hidden=true;$('library-toggle').setAttribute('aria-expanded','false');}draw(page);}
function open(){if(!dialog.open)dialog.showModal();$('picture-library').hidden=true;$('library-toggle').setAttribute('aria-expanded','false');tool='round';setSize(56);palette();library();onOpen?.();return draw(current);}
if(opener)opener.onclick=open;
root.querySelector('[data-close="color-dialog"]').onclick=()=>dialog.close();
$('library-toggle').onclick=()=>showLibrary($('picture-library').hidden);$('close-library').onclick=()=>showLibrary(false);
$('picture-buttons').onclick=e=>{const b=e.target.closest('[data-page]');if(b)selectPage(pages.find(p=>p.id===b.dataset.page));};
for(const b of dialog.querySelectorAll('[data-collection]'))b.onclick=()=>{if(collection===b.dataset.collection)return;collection=b.dataset.collection;library();selectPage(activePages()[0],{closeLibrary:false});};
function stepPage(delta){const list=activePages(),i=list.indexOf(current);selectPage(list[(i+delta+list.length)%list.length]);}
$('previous-drawing').onclick=()=>stepPage(-1);$('next-drawing').onclick=()=>stepPage(1);
$('palette').onclick=e=>{const b=e.target.closest('[data-paint]');if(b)setColor(b.dataset.paint);};$('custom-paint').oninput=e=>setColor(e.target.value);
for(const b of dialog.querySelectorAll('button[data-tool]'))b.onclick=()=>setTool(b.dataset.tool);
for(const b of dialog.querySelectorAll('[data-size]'))b.onclick=()=>setSize(b.dataset.size);$('brush-size').oninput=e=>setSize(e.target.value);
function pointAt(event){const rect=canvas.getBoundingClientRect();return {x:Math.max(0,Math.min(canvas.width-1,Math.round((event.clientX-rect.left)/rect.width*canvas.width))),y:Math.max(0,Math.min(canvas.height-1,Math.round((event.clientY-rect.top)/rect.height*canvas.height)))};}
let pointerId=null;
function releasePointer(){const id=pointerId;pointerId=null;pan=null;if(id!==null&&canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);}
canvas.onpointerdown=e=>{
 if(loaded&&inspiration&&e.button<=0&&e.isPrimary!==false){e.preventDefault();canvas.focus({preventScroll:true});if(examples.firstPointer())message('Your drawing sheet appears in three seconds. Then choose a color and paint.');return;}
 if(!loaded||inspiration||pointerId!==null||e.button>0||e.isPrimary===false)return;e.preventDefault();keyboard=false;hover=true;brush=pointAt(e);pointerId=e.pointerId;canvas.setPointerCapture(e.pointerId);canvas.focus({preventScroll:true});
 if(tool==='hand')pan={x:e.clientX,y:e.clientY,left:viewport.scrollLeft,top:viewport.scrollTop};else if(tool==='bucket')fill(brush.x,brush.y);else beginStroke({...brush});cursor();
};
canvas.onpointermove=e=>{if(!loaded||inspiration||pointerId!==null&&e.pointerId!==pointerId)return;hover=true;brush=pointAt(e);if(pan){viewport.scrollLeft=pan.left+pan.x-e.clientX;viewport.scrollTop=pan.top+pan.y-e.clientY;}else if(active)appendPoint({...brush});cursor();};
function endPointer(e,cancel=false){if(e.pointerId!==pointerId)return;if(active){if(cancel)cancelStroke();else{brush=pointAt(e);appendPoint({...brush});finishStroke();}}const id=pointerId;pointerId=null;pan=null;if(canvas.hasPointerCapture(id))canvas.releasePointerCapture(id);cursor();}
canvas.onpointerup=e=>endPointer(e);canvas.onpointercancel=e=>endPointer(e,true);canvas.onlostpointercapture=e=>endPointer(e,true);canvas.onpointerleave=()=>{if(pointerId===null){hover=false;cursor();}};
canvas.onkeydown=e=>{
 if(loaded&&inspiration&&['Enter',' '].includes(e.key)){e.preventDefault();if(examples.firstPointer())message('Your drawing sheet appears in three seconds. Then choose a color and paint.');return;}
 if(!loaded||inspiration)return;if(e.key==='Escape'&&active){e.preventDefault();e.stopPropagation();cancelStroke();return;}
 const step=e.shiftKey?32:6;if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','Enter',' '].includes(e.key))return;e.preventDefault();keyboard=true;
 if(tool==='hand'){
  const distance=e.shiftKey?80:32;
  if(e.key==='Home')viewport.scrollTo(0,0);
  else{
   const dx=e.key==='ArrowRight'?distance:e.key==='ArrowLeft'?-distance:0,dy=e.key==='ArrowDown'?distance:e.key==='ArrowUp'?-distance:0;
   viewport.scrollLeft=Math.max(0,Math.min(Math.max(0,viewport.scrollWidth-viewport.clientWidth),viewport.scrollLeft+dx));
   viewport.scrollTop=Math.max(0,Math.min(Math.max(0,viewport.scrollHeight-viewport.clientHeight),viewport.scrollTop+dy));
  }
  cursor();return;
 }
 if(e.key==='Home')brush={x:canvas.width/2,y:canvas.height/2};if(e.key==='ArrowLeft')brush.x-=step;if(e.key==='ArrowRight')brush.x+=step;if(e.key==='ArrowUp')brush.y-=step;if(e.key==='ArrowDown')brush.y+=step;brush.x=Math.max(0,Math.min(canvas.width-1,brush.x));brush.y=Math.max(0,Math.min(canvas.height-1,brush.y));cursor();
 if(e.key==='Enter'){if(tool==='bucket')fill(brush.x,brush.y);else if(tool!=='hand'){beginStroke({...brush});finishStroke();}}
 else if(e.key===' '&&!e.repeat){if(tool==='bucket')fill(brush.x,brush.y);else if(tool!=='hand'){spaceDrawing=true;beginStroke({...brush});}}
 else if(spaceDrawing&&active)appendPoint({...brush});if(!marker.hidden)marker.scrollIntoView({block:'nearest',inline:'nearest'});
};
canvas.onkeyup=e=>{if(e.key===' '){e.preventDefault();finishStroke();spaceDrawing=false;}};canvas.onblur=()=>{finishStroke();keyboard=false;hover=false;cursor();};
$('undo-paint').onclick=()=>{finishStroke();if(!loaded||!undo.length||inspiration)return;const entry=undo.pop();redo.push(entry);colors={...entry.previous.colors};actions=[...entry.previous.actions];restorePatch(surface,entry.bounds,entry.before);changed('Last action undone. Redo brings it back.',entry.bounds);};
$('redo-paint').onclick=()=>{finishStroke();if(!loaded||!redo.length||inspiration)return;const entry=redo.pop();undo.push(entry);colors={...entry.next.colors};actions=[...entry.next.actions];restorePatch(surface,entry.bounds,entry.after);changed('Your action is back.',entry.bounds);};
$('reset-drawing').onclick=()=>{finishStroke();if(!loaded||inspiration||!hasPainting())return;const before=surface.pixels.slice(),previous=snapshot(),bounds={left:0,top:0,right:canvas.width-1,bottom:canvas.height-1};colors={};actions=[];surface.pixels.fill(255);remember(before,previous,bounds);changed('A clean page. Undo restores your art.',bounds);};
dialog.addEventListener('keydown',e=>{if(e.target instanceof HTMLInputElement)return;if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();finishStroke();(e.shiftKey?$('redo-paint'):$('undo-paint')).click();}if(e.key==='Escape'&&!$('picture-library').hidden){e.preventDefault();e.stopPropagation();showLibrary(false);}});
$('zoom-in').onclick=()=>{finishStroke();zoom=Math.min(4,zoom+.5);fit();};$('zoom-out').onclick=()=>{finishStroke();zoom=Math.max(1,zoom-.5);fit();};$('zoom-fit').onclick=()=>{finishStroke();zoom=1;fit();viewport.scrollTo(0,0);};
$('show-inspiration').onclick=()=>{if(!loaded||!referenceReady)return;finishStroke();if(inspiration){hideInspiration();message('Pick a color and draw. Your own painting is ready.');}else{examples.show();message('Tap the picture once to reveal your drawing after three seconds.');}};
$('download-paint').onclick=()=>{if(!loaded)return;finishStroke();const filename='coloring-studio-'+current.id+'.png';canvas.toBlob(blob=>{if(!blob){message('Could not save the picture. Please try again.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);message('Your full-resolution artwork is ready to keep.');},'image/png');};
$('print').onclick=()=>{if(loaded){finishStroke();hideInspiration();window.print();}};
const onWindowBlur=()=>{finishStroke();releasePointer();};
const onPageHide=()=>{finishStroke();releasePointer();examples.close();};
dialog.addEventListener('close',()=>{finishStroke();releasePointer();++request;examples.close();onClose?.();hover=false;keyboard=false;cursor();});window.addEventListener('blur',onWindowBlur);window.addEventListener('pagehide',onPageHide);

return{open,close:()=>dialog.close(),selectPage:id=>{const page=pages.find(p=>p.id===id);if(!page)return false;selectPage(page);return true;},showExample:()=>loaded&&dialog.open&&referenceReady?examples.show():false,hideExample:hideInspiration,get page(){return current;},get tool(){return tool;},get exampleState(){return examples.state;},get ready(){return loaded;},destroy(){examples.close();finishStroke();releasePointer();++request;resizeObserver.disconnect();window.removeEventListener('blur',onWindowBlur);window.removeEventListener('pagehide',onPageHide);if(dialog.open)dialog.close();}};
}

