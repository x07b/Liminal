import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'motion/react';

// A small, bounded canvas study. Static on touch/reduced-motion; suspended offscreen.
export default function SignalField({ strength = 1, paused = false, study = false }) {
  const canvas = useRef(null);
  const reduced = useReducedMotion();
  useEffect(() => {
    const el = canvas.current, ctx = el.getContext('2d');
    if (!ctx) return;
    let w=0,h=0,frame=0,last=0,visible=true,time=0;
    const pointer={x:0,y:0};
    const quiet = reduced || matchMedia('(pointer: coarse)').matches || (navigator.hardwareConcurrency || 8) <= 4;
    function draw() {
      ctx.clearRect(0,0,w,h);
      const dark = document.documentElement.dataset.theme === 'dark';
      const count=quiet?35:75;
      for(let i=0;i<count;i++) {
        const base=(i/count)*w;
        ctx.beginPath();
        for(let y=0;y<=h;y+=12) {
          const wave=Math.sin(y*.008+i*.16+time*.18)*32*strength;
          const swell=Math.sin(y*.003+i*.07+time*.12)*65;
          const x=base+wave+swell+pointer.x*12*Math.sin(y/h*Math.PI);
          y===0?ctx.moveTo(x,y):ctx.lineTo(x,y);
        }
        ctx.strokeStyle=i%19===0?'rgba(216,83,53,.12)':dark?'rgba(237,235,222,.09)':'rgba(40,43,34,.085)';
        ctx.lineWidth=.6;ctx.stroke();
      }
    }
    function tick(now) {
      if(now-last>42) {time+=.042;draw();last=now;}
      frame=requestAnimationFrame(tick);
    }
    function sync() {cancelAnimationFrame(frame);draw();if(visible&&!document.hidden&&!quiet&&!paused) frame=requestAnimationFrame(tick);}
    function resize() {const box=el.getBoundingClientRect();w=box.width;h=box.height;const ratio=Math.min(devicePixelRatio,1.5);el.width=w*ratio;el.height=h*ratio;ctx.setTransform(ratio,0,0,ratio,0,0);draw();}
    function move(e) {pointer.x=e.clientX/innerWidth-.5;pointer.y=e.clientY/innerHeight-.5;}
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});observer.observe(el);
    const size=new ResizeObserver(resize);size.observe(el);
    const theme=new MutationObserver(draw);theme.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    document.addEventListener('visibilitychange',sync);
    if(!quiet) window.addEventListener('pointermove',move,{passive:true});
    resize();sync();
    return()=>{cancelAnimationFrame(frame);observer.disconnect();size.disconnect();theme.disconnect();document.removeEventListener('visibilitychange',sync);window.removeEventListener('pointermove',move);};
  },[reduced,strength,paused]);
  return <canvas ref={canvas} className={'signal-field '+(study?'signal-study':'')} aria-hidden="true"/>;
}
