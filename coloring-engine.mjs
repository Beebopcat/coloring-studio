// Regions are derived once from the original ink, never from painted colors.
// Painting a shape black therefore cannot turn it into an unpaintable outline.
export function buildRegions(rgba, width, height) {
  const size = width * height, labels = new Uint32Array(size);
  const ink = new Uint8Array(size), queue = new Uint32Array(size);
  for (let p=0;p<size;p++) ink[p] = Math.max(rgba[p*4],rgba[p*4+1],rgba[p*4+2]) < 190 ? 1 : 0;
  // Close single-pixel breaks in contours without thickening all the artwork.
  const sealed = ink.slice();
  for (let y=1;y<height-1;y++) for (let x=1;x<width-1;x++) {
    const p=y*width+x;
    if ((ink[p-1]&&ink[p+1]) || (ink[p-width]&&ink[p+width])) sealed[p]=1;
  }
  let count=0;
  const sizes=[0];
  for (let start=0;start<size;start++) {
    if (sealed[start] || labels[start]) continue;
    const region=++count; let head=0,tail=1; queue[0]=start; labels[start]=region;
    while(head<tail) {
      const p=queue[head++],x=p%width;
      if(x && !sealed[p-1] && !labels[p-1]) {labels[p-1]=region;queue[tail++]=p-1;}
      if(x<width-1 && !sealed[p+1] && !labels[p+1]) {labels[p+1]=region;queue[tail++]=p+1;}
      if(p>=width && !sealed[p-width] && !labels[p-width]) {labels[p-width]=region;queue[tail++]=p-width;}
      if(p<size-width && !sealed[p+width] && !labels[p+width]) {labels[p+width]=region;queue[tail++]=p+width;}
    }
    sizes[region]=tail;
  }
  return {labels,sizes,count,width,height};
}
export function renderColors(original, regions, colors) {
  const result = new Uint8ClampedArray(original);
  const rgb = new Map(Object.entries(colors).filter(([,c])=>/^#[0-9a-f]{6}$/i.test(c))
    .map(([id,c])=>[Number(id),[1,3,5].map(i=>parseInt(c.slice(i,i+2),16))]));
  for(let p=0;p<regions.labels.length;p++) {
    const color=rgb.get(regions.labels[p]); if(!color) continue;
    const i=p*4;
    result[i]=original[i]*color[0]/255;result[i+1]=original[i+1]*color[1]/255;result[i+2]=original[i+2]*color[2]/255;
  }
  return result;
}
export function regionAt(regions, x, y) {
  x=Math.floor(x);y=Math.floor(y);
  if(x<0||y<0||x>=regions.width||y>=regions.height)return 0;
  return regions.labels[y*regions.width+x];
}
