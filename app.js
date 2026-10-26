import {coloringTemplate} from './coloring-template.js';
import {createColoringStudio} from './coloring.js';
import {createTour} from './tour.js';

export function createStudioApp({root=document,storage=localStorage,studioFactory=createColoringStudio,tourFactory=createTour}={}){
 const $=id=>root.querySelector('#'+id);
 root.body.insertAdjacentHTML('beforeend',coloringTemplate);
 const studio=studioFactory({root,opener:$('open-studio'),onClose:()=>{$('open-studio').focus();}});
 const options=$('paint-options');
 $('close-options').onclick=()=>{options.open=false;options.querySelector?.('summary')?.focus();};
 const help=root.createElement('button');help.className='studio-help';help.textContent='Show me how';help.id='frame-tour';
 root.querySelector('.studio-header-actions').prepend(help);
 const steps=[
  {id:'pictures',title:'Choose your picture',text:'Pictures opens 22 illustrated pages. Choose Halloween or Adventures, then tap a picture.'},
  {id:'tools',title:'Pick a drawing tool',text:'Round brush starts selected. You can try a flat brush, crayon, spray, or fill a shape with the bucket.'},
  {id:'colors',title:'Your paint box',text:'Tap a color in the frame. Scroll to find all 60 colors, or mix your own paint.'},
  {id:'size',title:'Make a little mark or a big one',text:'Size & more opens these brush and spray settings. Choose a size, then tap Done. Undo takes back a whole stroke.'},
  {id:'example',title:'A picture for inspiration',text:'Color example shows a finished picture. Tap the sheet once and it disappears three seconds later. Your own painting stays safe.'},
  {id:'keep',title:'Keep your artwork',text:'Save picture makes a full-size copy. Print picture is inside Size & more. You can come back to your saved painting here.'}
 ];
 const tour=tourFactory({root,storage,key:'casey.coloring-studio.tour.v1',steps,targets:{pictures:()=>$('library-toggle'),tools:()=>root.querySelector('.brush-tools'),colors:()=>root.querySelector('.paint-box'),size:()=>$('tool-settings'),example:()=>$('show-inspiration'),keep:()=>root.querySelector('.keep-tools')},beforeStep:async id=>{if(!$('color-dialog').open)await studio.open();options.open=id==='size';}});
 const show=()=>tour.start();help.onclick=show;$('studio-tour').onclick=show;
 let destroyed=false;
 void studio.open().then(()=>{if(!destroyed)tour.startIfFirstVisit();});
 return{studio,tour,destroy(){destroyed=true;tour.destroy();studio.destroy();}};
}
if(typeof document!=='undefined')createStudioApp();
