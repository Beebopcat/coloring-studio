// 100% fits the complete sheet. Explicit zoom remains relative to that fit.
export function paperLayout({viewportWidth,viewportHeight,paddingLeft=0,paddingRight=0,paddingTop=0,paddingBottom=0,nativeWidth,nativeHeight,zoom=1}){
 const dimensions=[viewportWidth,viewportHeight,nativeWidth,nativeHeight].map(Number);
 if(dimensions.some(n=>!Number.isFinite(n)||n<=0))throw new RangeError('Positive finite paper and viewport dimensions required');
 const [vw,vh,nw,nh]=dimensions;
 const width=Math.max(1,vw-Number(paddingLeft)-Number(paddingRight)-3);
 const height=Math.max(1,vh-Number(paddingTop)-Number(paddingBottom)-3);
 const factor=Math.min(width/nw,height/nh)*Math.max(1,Math.min(4,Number(zoom)||1));
 return{width:Math.max(1,Math.floor(nw*factor)),height:Math.max(1,Math.floor(nh*factor)),scale:factor};
}
