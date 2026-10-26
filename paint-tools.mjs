// Local painting tools. The original line art and region engine stay unchanged.
export const strokeTools=['round','flat','crayon','spray'];
export const validColor=color=>typeof color==='string'&&/^#[0-9a-f]{6}$/i.test(color);
const rgb=color=>[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function randomFrom(seed){let state=seed>>>0||1;return ()=>{state^=state<<13;state^=state>>>17;state^=state<<5;return (state>>>0)/4294967296;};}
export function whiteSurface(width,height){const pixels=new Uint8ClampedArray(width*height*4);pixels.fill(255);return {pixels,width,height};}
export function mergeBounds(a,b){if(!a)return b;if(!b)return a;return {left:Math.min(a.left,b.left),top:Math.min(a.top,b.top),right:Math.max(a.right,b.right),bottom:Math.max(a.bottom,b.bottom)};}
function blend(surface,x,y,color,opacity){
 const {width,height,pixels}=surface;if(x<0||y<0||x>=width||y>=height)return false;
 const p=(y*width+x)*4;let changed=false;
 for(let c=0;c<3;c++){const next=Math.round(pixels[p+c]+(color[c]-pixels[p+c])*opacity);if(next!==pixels[p+c])changed=true;pixels[p+c]=next;}
 return changed;
}
function hash(x,y,seed){let h=Math.imul(x+1,374761393)^Math.imul(y+1,668265263)^seed;h=Math.imul(h^(h>>>13),1274126177);return (h>>>0)/4294967296;}
function disk(surface,cx,cy,radius,color,opacity=1,seed=null){
 const left=clamp(Math.floor(cx-radius-1),0,surface.width-1),right=clamp(Math.ceil(cx+radius+1),0,surface.width-1),top=clamp(Math.floor(cy-radius-1),0,surface.height-1),bottom=clamp(Math.ceil(cy+radius+1),0,surface.height-1);
 let changed=false;
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
  const coverage=clamp(radius+.5-Math.hypot(x+.5-cx,y+.5-cy),0,1);if(!coverage)continue;
  const grain=seed===null?1:hash(x,y,seed);if(seed!==null&&grain<.12)continue;
  changed=blend(surface,x,y,color,coverage*opacity*(seed===null?1:.3+.7*grain))||changed;
 }
 return changed?{left,top,right,bottom}:null;
}
function stamp(surface,operation,point,random){
 const color=rgb(operation.color),radius=operation.size/2;
 if(operation.tool==='spray'){
  let dirty=null;const particles=Math.max(12,Math.ceil(operation.size*.55));
  for(let i=0;i<particles;i++){const angle=random()*Math.PI*2,distance=Math.sqrt(random())*radius,r=.6+random()*.9;dirty=mergeBounds(dirty,disk(surface,point.x+Math.cos(angle)*distance,point.y+Math.sin(angle)*distance,r,color,.65));}
  return dirty;
 }
 if(operation.tool==='flat'){
  const left=clamp(Math.floor(point.x-radius),0,surface.width-1),right=clamp(Math.ceil(point.x+radius),0,surface.width-1),top=clamp(Math.floor(point.y-radius),0,surface.height-1),bottom=clamp(Math.ceil(point.y+radius),0,surface.height-1);let changed=false;
  for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){
   const dx=x+.5-point.x,dy=y+.5-point.y,u=(dx+dy)/Math.SQRT2,v=(dy-dx)/Math.SQRT2;
   const coverage=clamp(Math.min(radius-Math.abs(u),radius*.3-Math.abs(v))+.5,0,1);
   if(coverage)changed=blend(surface,x,y,color,coverage)||changed;
  }
  return changed?{left,top,right,bottom}:null;
 }
 return disk(surface,point.x,point.y,radius,color,operation.tool==='crayon' ? .82 : 1,operation.tool==='crayon'?operation.seed:null);
}
export function strokeSegment(surface,operation,from,to,random=randomFrom(operation.seed)){
 if(!strokeTools.includes(operation.tool)||!validColor(operation.color)||!Number.isFinite(operation.size)||operation.size<8||operation.size>180)return null;
 const distance=Math.hypot(to.x-from.x,to.y-from.y),steps=Math.max(1,Math.ceil(distance/Math.max(1,operation.size/(operation.tool==='spray'?2:4))));let dirty=null;
 for(let i=1;i<=steps;i++){const t=i/steps;dirty=mergeBounds(dirty,stamp(surface,operation,{x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t},random));}
 return dirty;
}
export function fillRegion(surface,regions,region,color){
 if(!Number.isInteger(region)||region<1||region>regions.count||!validColor(color))return null;
 const value=rgb(color);let left=surface.width,top=surface.height,right=-1,bottom=-1;
 for(let p=0;p<regions.labels.length;p++)if(regions.labels[p]===region){const x=p%surface.width,y=Math.floor(p/surface.width);if(blend(surface,x,y,value,1)){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}}
 return right>=0?{left,top,right,bottom}:null;
}
export function applyOperation(surface,regions,operation){
 if(operation.tool==='bucket')return fillRegion(surface,regions,operation.region,operation.color);
 const random=randomFrom(operation.seed);let dirty=null;
 for(let i=0;i<operation.points.length;i++)dirty=mergeBounds(dirty,strokeSegment(surface,operation,operation.points[Math.max(0,i-1)],operation.points[i],random));
 return dirty;
}
export function compositeInk(original,surface,result=new Uint8ClampedArray(original),bounds=null){
 const {width,height,pixels}=surface,{left=0,top=0,right=width-1,bottom=height-1}=bounds||{};
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++){const p=(y*width+x)*4;for(let c=0;c<3;c++)result[p+c]=original[p+c]*pixels[p+c]/255;result[p+3]=original[p+3];}
 return result;
}
export function extractPatch(pixels,width,bounds){const columns=bounds.right-bounds.left+1,rows=bounds.bottom-bounds.top+1,result=new Uint8ClampedArray(columns*rows*4);for(let y=0;y<rows;y++){const start=((bounds.top+y)*width+bounds.left)*4;result.set(pixels.subarray(start,start+columns*4),y*columns*4);}return result;}
export function restorePatch(surface,bounds,patch){const columns=bounds.right-bounds.left+1,rows=bounds.bottom-bounds.top+1;for(let y=0;y<rows;y++)surface.pixels.set(patch.subarray(y*columns*4,(y+1)*columns*4),((bounds.top+y)*surface.width+bounds.left)*4);}
export function validOperation(operation,regions){
 if(!operation||!validColor(operation.color))return false;
 if(operation.tool==='bucket')return Number.isInteger(operation.region)&&operation.region>0&&operation.region<=regions.count;
 return strokeTools.includes(operation.tool)&&Number.isInteger(operation.size)&&operation.size>=8&&operation.size<=180&&Number.isInteger(operation.seed)&&Array.isArray(operation.points)&&operation.points.length>0&&operation.points.length<=20000&&operation.points.every(p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&p.x>=0&&p.y>=0&&p.x<regions.width&&p.y<regions.height);
}
