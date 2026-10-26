// A preview session starts when a sheet opens or the reader explicitly asks
// for its example again. Repeated canvas clicks never restart its first timer.
export function createExamplePreview({onChange=()=>{},setTimer=setTimeout,clearTimer=clearTimeout,delay=3000}={}){
 let page=null,available=false,visible=false,clicked=false,timer=null,generation=0;
 const state=()=>({page,available,visible,clicked,glowing:available&&visible&&!clicked});
 function cancelTimer(){generation++;if(timer!==null)clearTimer(timer);timer=null;}
 function notify(){onChange(state());}
 function resetPage(id,{hasExample=false}={}){cancelTimer();page=id;available=hasExample;visible=hasExample;clicked=false;notify();}
 function show(){if(!available)return false;cancelTimer();visible=true;clicked=false;notify();return true;}
 function hide(){cancelTimer();visible=false;notify();}
 function firstPointer(){
  if(!available||!visible||clicked)return false;
  clicked=true;const expected=generation;
  timer=setTimer(()=>{timer=null;if(expected!==generation)return;visible=false;notify();},delay);
  notify();return true;
 }
 function close(){cancelTimer();visible=false;clicked=false;notify();}
 return{resetPage,show,hide,firstPointer,close,get state(){return state();}};
}
