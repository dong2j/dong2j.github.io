/* Stretch: a desk-break timer with a Three.js physicist coach.
   Load it from a page that already has an import map for "three" (r186), then:
     <div id="stretch"></div>
     <script src="threejs/stretch.js"></script>
   If there is no #stretch element, the script makes one where the script tag is. */
(function(){'use strict';
const host=document.getElementById('stretch')||(function(){const d=document.createElement('div');d.id='stretch';(document.currentScript||document.body.lastChild).before(d);return d})();
(function(){try{const t=document.createElement('h2');t.textContent='x';t.style.cssText='position:absolute;visibility:hidden;pointer-events:none';(host.parentNode||document.body).appendChild(t);const cs=getComputedStyle(t);if(parseFloat(cs.borderBottomWidth)>0&&cs.borderBottomStyle!=='none')host.style.setProperty('--line',cs.borderBottomColor);t.remove()}catch(e){}})();
const style=document.createElement('style');style.textContent="#stretch{color-scheme:light;container:stretch/inline-size;display:block;\n--bg:#ffffff;--ink:#111111;--mute:#767676;--line:#e2e2e2;--hover:#f2f2f2;\n--st:#f4cd3c;--mat:#2346a8;\n--stInk:#191a2e;--stMute:rgba(25,26,46,.72)}\n#stretch *{box-sizing:border-box;min-width:0}\n#stretch{margin:0;background:transparent;color:var(--ink);font-family:inherit;font-size:inherit;line-height:1.3;overflow-x:clip}\n#stretch .wrap{max-width:1180px;margin:0 auto;padding-inline:max(4vw,16px)}\n#stretch .fig{position:relative;min-height:340px}\n#stretch .fig>canvas{position:absolute;inset:0;width:100%;height:100%;z-index:1}\n#stretch a{color:inherit;text-decoration:underline;text-underline-offset:3px}\n#stretch h2.sec{font-size:125%;font-weight:700;line-height:1.0;text-wrap:balance;overflow-wrap:break-word;min-width:0;border-top:1px solid var(--line);padding-top:12px;margin:0 0 8px}\n#stretch .live{border-top:1px solid var(--line);padding-top:16px}\n#stretch main.wrap{margin-top:clamp(16px,2.5vw,28px);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(20px,4vw,56px);align-items:start}\n#stretch .stage{min-height:clamp(380px,64vh,600px);background:var(--st);color:var(--stInk);overflow:hidden;touch-action:pan-y;cursor:grab}\n#stretch .stage:active{cursor:grabbing}\n#stretch .hint{position:absolute;right:14px;bottom:12px;font-size:small;color:var(--stMute);z-index:2;pointer-events:none;text-shadow:0 0 3px var(--st),0 0 6px var(--st)}\n#stretch .cap{position:absolute;left:14px;top:12px;right:14px;display:flex;flex-direction:column;gap:1px;pointer-events:none;z-index:2;text-shadow:0 0 3px var(--st),0 0 6px var(--st)}\n#stretch .tag{font-size:small;font-weight:700}\n#stretch #topStatus{font-size:small;color:var(--stMute);font-variant-numeric:tabular-nums}\n#stretch .fallback{display:none;position:absolute;inset:0;place-items:center;text-align:center;padding:24px}\n#stretch .stage.off .fallback{display:grid}\n#stretch .stage.off .hint,#stretch .stage.off .tag{display:none}\n#stretch .kicker{font-size:small;color:var(--mute);margin:0}\n#stretch #big{margin:4px 0 8px;font-weight:700;line-height:1.0;font-size:165%}\n#stretch #big.time{font-size:clamp(72px,10vw,120px);font-variant-numeric:tabular-nums;font-weight:400;letter-spacing:-.02em}\n#stretch #big.name{text-wrap:balance}\n#stretch #quip{margin:0 0 16px;font-style:italic;color:var(--mute)}\n#stretch #quip:empty{display:none}\n#stretch #cue{margin:0 0 8px;max-width:46ch}\n#stretch #sub{margin:-4px 0 12px;color:var(--mute);font-size:small;font-variant-numeric:tabular-nums}\n#stretch #sub:empty{display:none}\n#stretch .bar{height:2px;background:var(--line);margin-bottom:16px}\n#stretch .bar i{display:block;height:100%;width:100%;background:var(--ink);transform:scaleX(0);transform-origin:0 50%;transition:transform .25s linear}\n#stretch #steps{margin:0 0 24px;padding:0;list-style:none;font-size:small;line-height:1.5;color:var(--mute)}\n#stretch #steps li{display:inline}\n#stretch #steps li:not(:last-child)::after{content:\"/\";display:inline-block;margin:0 .55em;color:var(--mute)}\n#stretch #steps li.on{color:var(--ink);font-weight:700}\n#stretch #steps li.ok{text-decoration:line-through}\n#stretch #actions{display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;min-height:44px}\n#stretch .btn{font:inherit;min-height:44px;padding:0 2px;border:0;background:none;color:var(--ink);cursor:pointer;text-decoration:underline;text-underline-offset:4px;text-decoration-color:var(--line)}\n#stretch .btn:hover{text-decoration-color:currentColor}\n#stretch .btn.pri{border:1px solid var(--ink);color:var(--ink);padding:0 24px;text-decoration:none;font-weight:700}\n#stretch .btn.pri:hover{background:var(--hover)}\n#stretch button:active{transform:translateY(1px)}\n#stretch button:disabled,#stretch input:disabled{opacity:.45;cursor:not-allowed}\n#stretch button:focus-visible,#stretch input:focus-visible{outline:2px solid var(--ink);outline-offset:3px}\n#stretch .lower{padding-bottom:clamp(40px,6vw,72px);display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:clamp(20px,4vw,56px);margin-top:clamp(40px,6vw,72px)}\n#stretch .row{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:8px 16px;padding:12px 0;border-bottom:1px solid var(--line)}\n#stretch .row small{display:block;color:var(--mute);font-size:small;max-width:42ch}\n#stretch .seg{display:flex;flex-wrap:wrap;gap:0;align-items:center}\n#stretch .seg button{font:inherit;min-width:44px;min-height:44px;padding:0 12px;border:0;background:none;color:var(--mute);cursor:pointer}\n#stretch .seg button[aria-pressed=true]{color:var(--ink);font-weight:700;text-decoration:underline;text-underline-offset:5px}\n#stretch .seg span{color:var(--mute);font-size:small;padding:0 8px}\n#stretch input[type=number]{font:inherit;min-height:40px;padding:0 8px;border:0;border-bottom:1px solid var(--mute);background:none;color:var(--ink);width:4.5em}\n#stretch .sw{width:20px;height:20px;accent-color:var(--ink);margin:12px}\n#stretch .msg{font-size:small;color:var(--mute);margin:0;width:100%}\n#stretch .msg:empty{display:none}\n#stretch .stats{display:flex;gap:32px;margin-bottom:24px}\n#stretch .stats b{display:block;font-size:165%;line-height:1.0;font-weight:400;font-variant-numeric:tabular-nums}\n#stretch .stats span{color:var(--mute);font-size:small}\n#stretch #week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;margin-bottom:24px}\n#stretch .wk{display:flex;flex-direction:column;align-items:center;gap:8px;font-size:small;color:var(--mute)}\n#stretch .trk{position:relative;height:72px;width:6px;border-bottom:1px solid var(--line)}\n#stretch .trk i{position:absolute;left:0;right:0;bottom:0;background:var(--ink)}\n#stretch .wk.now .d{color:var(--ink);font-weight:700}\n#stretch #todayList{list-style:none;margin:0;padding:0}\n#stretch #todayList li{display:flex;justify-content:space-between;gap:12px;padding:12px 0;border-bottom:1px solid var(--line);font-variant-numeric:tabular-nums}\n#stretch #todayList li span:first-child{white-space:nowrap}\n#stretch #todayList .empty{color:var(--mute)}\n@container stretch (max-width:760px){#stretch main.wrap,#stretch .lower{grid-template-columns:minmax(0,1fr)}\n#stretch .stage{min-height:440px}}\n@container stretch (min-width:761px){#stretch .stage[data-mode=working] #topStatus,#stretch .stage[data-mode=paused] #topStatus{display:none}}\n#stretch .probe{position:absolute;width:0;height:0;overflow:hidden;color:var(--mat)}\n@media(prefers-reduced-motion:reduce){#stretch .bar i{transition:none}}\n#stretch .wrap{max-width:none;padding-inline:0}\n#stretch main.wrap{margin-top:0}\n#stretch p,#stretch ul{margin-left:0;margin-right:0}\n#stretch li{margin:0;padding:0}\n#stretch h2.sec{border-bottom:0;font-family:inherit;color:inherit}\n#stretch button,#stretch input{font-family:inherit}";document.head.appendChild(style);
host.innerHTML="<main class=\"wrap\">\n  <div class=\"fig stage\" id=\"stage\" aria-label=\"3D physicist coach demonstrating the current stretch\">\n    <span class=\"probe\" id=\"matProbe\"></span>\n    <div class=\"fallback\"><p>The 3D coach couldn\u2019t load here.<br>The timer, sound and log still work.</p></div>\n    <span class=\"hint\">Drag to turn the figure</span>\n    <div class=\"cap\"><span class=\"tag\" id=\"tag\"></span><span id=\"topStatus\"></span></div>\n  </div>\n  <section class=\"live\" aria-live=\"polite\">\n    <p class=\"kicker\" id=\"kicker\">Not started</p>\n    <div id=\"big\" class=\"time\">30:00</div>\n    <p id=\"quip\"></p>\n    <p id=\"cue\"></p>\n    <p id=\"sub\"></p>\n    <div class=\"bar\"><i></i></div>\n    <ul id=\"steps\"></ul>\n    <div id=\"actions\"></div>\n  </section>\n</main>\n\n<div class=\"wrap lower\">\n  <section>\n    <h2 class=\"sec\">Settings</h2>\n    <div class=\"row\"><span>Remind me every<small>Minutes between breaks. Changing it restarts the countdown.</small></span>\n      <div class=\"seg\" id=\"ivSeg\"><button data-iv=\"20\">20</button><button data-iv=\"30\">30</button><button data-iv=\"45\">45</button><button data-iv=\"60\">60</button><input type=\"number\" id=\"iv\" min=\"1\" max=\"180\" aria-label=\"Custom minutes\"></div></div>\n    <div class=\"row\"><span>Break style<small>The full routine follows the moves in MedStar Georgetown\u2019s <a href=\"https://www.youtube.com/watch?v=QVssIUSjMvM\">10 Minute Stretch Break</a> video, all standing.</small></span>\n      <div class=\"seg\" id=\"stSeg\"><button data-st=\"quick\">Quick</button><button data-st=\"full\">Full routine</button></div></div>\n    <div class=\"row\"><span>Stretches per quick break<small>About 30 seconds each.</small></span>\n      <div class=\"seg\" id=\"perSeg\"><button data-per=\"2\">2</button><button data-per=\"3\">3</button><button data-per=\"4\">4</button><button data-per=\"5\">5</button></div></div>\n    <div class=\"row\"><span>Chime<small>Plays when a break is due and repeats every 2 minutes until you respond. Choose one to hear it.<span id=\"chNow\"></span></small></span>\n      <div class=\"seg\" id=\"chSeg\"><button data-ch=\"random\" title=\"A different sound each time\">Random</button><button data-ch=\"tingsha\" title=\"Tibetan hand cymbals\">Tingsha</button><button data-ch=\"bowl\" title=\"Himalayan singing bowl\">Singing bowl</button><button data-ch=\"rin\" title=\"Japanese Buddhist bowl-bell\">Rin</button><button data-ch=\"temple\" title=\"Japanese bonsh\u014d\">Temple bell</button><button data-ch=\"church\" title=\"Western tower bell\">Church bell</button><button data-ch=\"sanctus\" title=\"Catholic altar bells\">Sanctus bells</button><button data-ch=\"fish\" title=\"Buddhist mokugyo\">Wooden fish</button><button data-ch=\"gong\" title=\"Chinese gong\">Gong</button><button data-ch=\"off\">Off</button></div></div>\n    <div class=\"row\"><span>Desktop alerts<small>A system notification, even when this tab is hidden.</small></span>\n      <button class=\"btn\" id=\"alerts\">Turn on</button><p class=\"msg\" id=\"alertMsg\"></p></div>\n  </section>\n  <section>\n    <h2 class=\"sec\">Movement log</h2>\n    <div class=\"stats\"><div><b id=\"todayN\">0</b><span>breaks today</span></div><div><b id=\"todayM\">0</b><span>minutes moving</span></div></div>\n    <div id=\"week\"></div>\n    <ul id=\"todayList\"></ul>\n  </section>\n</div>";

const $=s=>host.querySelector(s);
const TITLE=document.title;
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- poses: joint -> [x,y,z] Euler radians. L = figure's left (+x) ---------- */
const Z=[0,0,0];
const base=()=>({shL:[0,0,.1],shR:[0,0,-.1],elL:[-.15,0,0],elR:[-.15,0,0]});
const arms=(p,x,y,z)=>{p.shL=[x,y,z];p.shR=[x,-y,-z];return p};
const elb=(p,x,y,z)=>{p.elL=[x,y,z];p.elR=[x,-y,-z];return p};
const hold=v=>Math.max(-1,Math.min(1,Math.sin(v)*1.5));
const sm=x=>x*x*(3-2*x);
const env=(t,d,r=2.5)=>sm(Math.max(0,Math.min(1,t/r,(d-t)/r)));

const LIB=[
 {name:'Reach for the sky',dur:30,cue:'Stand tall and stretch both arms overhead. Reach up through your fingertips and breathe slowly.',
  pose:t=>{const p=elb(arms(base(),0,0,2.75),0,0,0),l=.5-.5*Math.cos(t*1.3);p.y=.03*l;p.anL=p.anR=[.35*l,0,0];p.chest=[-.08,0,0];p.head=[-.25,0,0];return p}},
 {name:'Neck release',dur:30,cue:'Let one ear drop toward your shoulder, hold, then switch. Keep your shoulders soft and low.',
  pose:t=>{const s=hold(t*.45),p=arms(base(),0,0,.06);p.neck=[.08,0,.42*s];p.head=[.05,0,.1*s];return p}},
 {name:'Torso twist',dur:30,cue:'Feet planted, elbows up. Turn gently from your waist to look over each shoulder.',
  pose:t=>{const s=hold(t*.6),p=elb(arms(base(),0,0,1.35),-1.9,0,0);p.spine=[0,.55*s,0];p.chest=[0,.3*s,0];p.head=[0,.35*s,0];return p}},
 {name:'March in place',dur:30,cue:'Lift your knees one at a time and swing your arms. Get the blood moving again.',
  pose:t=>{const ph=t*4.2,s=Math.sin(ph),a=Math.max(0,s),b=Math.max(0,-s),p=elb(base(),-.7,0,0);
   p.hipL=[-1.15*a,0,0];p.knL=[1.8*a,0,0];p.hipR=[-1.15*b,0,0];p.knR=[1.8*b,0,0];p.shL=[.55*s,0,.08];p.shR=[-.55*s,0,-.08];p.y=.012*Math.abs(s);return p}},
 {name:'Side bend',dur:30,cue:'Arms overhead. Lean slowly to one side, then the other. Keep your hips steady.',
  pose:t=>{const s=hold(t*.55),p=elb(arms(base(),0,0,2.7),0,0,.1);p.spine=[0,0,.3*s];p.chest=[0,0,.16*s];p.head=[0,0,.1*s];return p}},
 {name:'Arm circles',dur:25,cue:'Arms out wide. Draw small circles forward, then reverse halfway through.',
  pose:t=>{const ph=t*3.2*(t<12.5?1:-1);return elb(arms(base(),.25*Math.sin(ph),0,1.45+.25*Math.cos(ph)),0,0,0)}},
 {name:'Chest opener',dur:25,cue:'Clasp your hands behind your back, draw your shoulders down and lift your chest.',
  pose:t=>{const e=env(t,25),p=elb(arms(base(),.7*e,0,.28),-.15,0,0);p.chest=[-.22*e,0,0];p.head=[-.18*e,0,0];p.spine=[-.05*e,0,0];return p}},
 {name:'Forward fold',dur:30,cue:'Soften your knees, hinge at the hips and let your upper body hang. Roll up slowly.',
  pose:t=>{const e=env(t,30,3),p=base();p.spine=[.95*e+.05*Math.sin(t*1.2)*e,0,0];p.chest=[.35*e,0,0];p.neck=[.2*e,0,0];
   arms(p,-1.4*e,0,.06);elb(p,-.1,0,0);p.hipL=p.hipR=[-.18*e,0,0];p.knL=p.knR=[.32*e,0,0];p.anL=p.anR=[-.14*e,0,0];p.y=-.012*e;return p}},
 {name:'Quad stretch',dur:30,cue:'Hold a chair if you need to. Bend one knee and hold your foot behind you. Switch legs halfway.',
  pose:t=>{const L=t<15;return quadP(L?'L':'R',env(L?t:t-15,15,2))}},
];
const QN=LIB.length;
const ramp=(t,a,b)=>sm(Math.max(0,Math.min(1,(t-a)/(b-a))));
const LG=.42,drop=(hp,kn)=>2*LG-LG*Math.cos(hp)-LG*Math.cos(hp+kn);
const quadP=(s,e)=>{const o=s==='L'?'R':'L',g=s==='L'?1:-1,p=base();
 p['kn'+s]=[2.3*e,0,0];p['hip'+s]=[.12*e,0,0];p['an'+s]=[.5*e,0,0];p['sh'+s]=[.85*e,0,.15*g];p['el'+s]=Z;p['sh'+o]=[0,0,-(1.25*e+.1)*g];return p};
const balance=s=>t=>{const g=s==='L'?1:-1,ph=t*3*(t<17.5?1:-1),p=elb(arms(base(),0,0,1.15),-.2,0,0);
 p['hip'+s]=[-.7,0,0];p['kn'+s]=[.9,0,0];p['an'+s]=[.35*Math.sin(ph),0,.35*Math.cos(ph)];p.spine=[0,0,.05*g];return p};
const lunge=s=>t=>{const o=s==='L'?'R':'L',e=env(t,27,2.5),p=elb(arms(base(),-.6*e,0,.15),-.3,0,0);
 p['hip'+s]=[.66*e,0,0];p['kn'+s]=Z;p['an'+s]=[-.66*e,0,0];p['hip'+o]=[-.9*e,0,0];p['kn'+o]=[1.2*e,0,0];p['an'+o]=[-.3*e,0,0];
 p.y=-drop(-.9*e,1.2*e)+.01*Math.sin(t*1.5)*e;p.spine=[.12*e,0,0];return p};
/* full routine: the move sequence from MedStar Georgetown's "10 Minute Stretch Break" video, cues written fresh */
LIB.push(
 {name:'Reach, push and side bend',dur:68,cue:'Reach both arms up and clasp your hands. Push them forward and round your upper back, then lift again and lean to each side.',
  pose:t=>{const p=base();
   if(t<14){elb(arms(p,0,0,2.75),0,0,0);p.y=.02;p.anL=p.anR=[.25,0,0];p.head=[-.2,0,0]}
   else if(t<28){elb(arms(p,-1.5,0,-.25),0,0,0);p.spine=[.06,0,0];p.chest=[.2,0,0];p.head=[.18,0,0]}
   else{const s=hold((t-28)*.55);elb(arms(p,0,0,2.7),0,0,.1);p.spine=[0,0,.3*s];p.chest=[0,0,.16*s];p.head=[0,0,.1*s]}return p}},
 {name:'Lift and curl',dur:32,cue:'Breathe in and lift your chest. Breathe out, round your spine and draw one knee up to meet your elbows. Alternate legs.',
  pose:t=>{const c=t%8,s=Math.floor(t/8)%2?'R':'L',p=base();
   if(c<4){arms(p,.35,0,.6);p.spine=[-.05,0,0];p.chest=[-.25,0,0];p.head=[-.3,0,0]}
   else{elb(arms(p,-1.1,0,-.2),-1.3,0,0);p.spine=[.3,0,0];p.chest=[.3,0,0];p.head=[.35,0,0];p['hip'+s]=[-1.4,0,0];p['kn'+s]=[1.5,0,0]}return p}},
 {name:'Squats with arm circles',dur:35,cue:'Sit back into an easy squat while your arms swing forward and around in big circles. Keep your knees soft.',
  pose:t=>{const s=.5-.5*Math.cos(t*1.6),p=elb(arms(base(),-t*2.6,0,.25),0,0,0);
   p.hipL=p.hipR=[-s,0,0];p.knL=p.knR=[1.6*s,0,0];p.anL=p.anR=[-.6*s,0,0];p.spine=[.35*s,0,0];p.y=-drop(-s,1.6*s);return p}},
 {name:'Balance and ankle circles, left',dur:35,cue:'Stand on one leg, lift the other foot and circle the ankle. Reverse the circles halfway. A chair nearby helps.',pose:balance('L')},
 {name:'Lunge stretch, left',dur:27,cue:'Step one foot back into a lunge. Press the back heel toward the floor and feel the front of that hip open.',pose:lunge('L')},
 {name:'Quad stretch, left',dur:32,cue:'Reach back for your foot or pant leg and hold it behind you. Stand tall with your knees close together.',pose:t=>quadP('L',env(t,32,2))},
 {name:'Balance and ankle circles, right',dur:35,cue:'Now the other leg. Lift the foot and circle the ankle, then reverse.',pose:balance('R')},
 {name:'Lunge stretch, right',dur:27,cue:'Step the other foot back. Press the heel down and breathe into the front of the hip.',pose:lunge('R')},
 {name:'Quad stretch, right',dur:32,cue:'Hold the other foot behind you. Stand tall and keep breathing.',pose:t=>quadP('R',env(t,32,2))},
 {name:'Wide-stance twist',dur:50,cue:'Step your feet wide. Circle one arm up and back and let your spine turn with it. Switch arms halfway.',
  pose:t=>{const h=t<25,g=h?1:-1,tt=h?t:t-25,e=env(tt,25,2.5),ph=tt*1.3,s=h?'L':'R',o=h?'R':'L',p=base();
   p.hipL=[0,0,.25];p.hipR=[0,0,-.25];p.anL=[0,0,-.25];p.anR=[0,0,.25];p.y=-.026;
   p['sh'+s]=[-ph,0,.6*g];p['el'+s]=[0,0,0];p['sh'+o]=[-.6,0,.2*g];p['el'+o]=[-.6,0,0];
   const y=-g*.55*Math.sin(ph)*e;p.spine=[0,y,0];p.chest=[0,y*.5,0];p.head=[0,y*.6,0];return p}},
 {name:'Upper back stretch',dur:28,cue:'Bring your elbows together in front of you, then lift them slowly. Feel the stretch across the top of your back.',
  pose:t=>{const l=.5-.5*Math.cos(t*1.1),p=elb(arms(base(),-1.4-.6*l,0,-.3),-1.9,0,0);p.chest=[.18,0,0];p.head=[.3,0,0];return p}},
 {name:'Chest opener and roll up',dur:49,cue:'Clasp your hands behind you and open your chest. Fold forward, then roll up slowly, one part of your spine at a time, head last.',
  pose:t=>{const c=ramp(t,1,4),f=ramp(t,14,20),fs=f*(1-ramp(t,32,40)),fc=f*(1-ramp(t,36,43)),fh=f*(1-ramp(t,40,46)),p=base();
   arms(p,.7*c+.9*fs,0,.25);elb(p,-.15,0,0);p.spine=[.95*fs,0,0];p.chest=[-.22*c*(1-fc)+.4*fc,0,0];p.head=[-.18*c*(1-fh)+.3*fh,0,0];
   p.hipL=p.hipR=[-.18*fs,0,0];p.knL=p.knR=[.32*fs,0,0];p.anL=p.anR=[-.14*fs,0,0];p.y=-.011*fs;return p}});
const FULL=LIB.map((_,i)=>i).slice(QN);
const COACH={galileo:{name:'Galileo Galilei',short:'Galileo',yrs:'1564–1642'},kepler:{name:'Johannes Kepler',short:'Kepler',yrs:'1571–1630'},
 newton:{name:'Isaac Newton',short:'Newton',yrs:'1643–1727'},maxwell:{name:'James Clerk Maxwell',short:'Maxwell',yrs:'1831–1879'},
 kelvin:{name:'Lord Kelvin',short:'Kelvin',yrs:'1824–1907'},gibbs:{name:'J. Willard Gibbs',short:'Gibbs',yrs:'1839–1903'}};
[['galileo','Eppur si muove: and yet it moves. The Earth never stops moving, so do not stop either.'],['kelvin','Relax your neck toward its lowest energy state, like a system cooled toward absolute zero.'],['maxwell','Twist like a rigid rotation. The motion has curl but zero divergence.'],
 ['newton','First law: a body at rest stays at rest unless a net force acts on it. Be that force.'],['gibbs','Lean to one side, then the other. A stable equilibrium pulls you back to the center.'],['kepler','A circle is an ellipse with zero eccentricity. At a steady speed, your arm sweeps equal areas in equal times.'],
 ['kelvin','Open your chest. Heat flows from your warm body into the cooler room.'],['newton','Let gravity do the work on the way down. On the way up, the work is yours.'],['gibbs','Find your equilibrium on one leg.'],
 ['galileo','Reach toward the sky. Galileo found four moons of Jupiter up there.'],['maxwell','Inhale, then exhale, at a steady rhythm. Every wave starts with an oscillation like this.'],['galileo','In free fall, all masses have the same acceleration. In a squat, you control the speed.'],
 ['gibbs','A stable equilibrium returns after a small disturbance. Let each wobble settle.'],['newton','Third law: push on the floor, and the floor pushes on you with an equal and opposite force.'],['kelvin','Hold the stretch and change it slowly. A slow, quasi-static change keeps you near equilibrium.'],
 ['gibbs','This is the same system on the other leg.'],['newton','Do it again on the other side. The forces stay equal and opposite.'],['kelvin','Do the other side. By the second law, an isolated system moves toward equilibrium.'],
 ['kepler','Sweep your arm like a planet. Move it more slowly at the far end, as a planet does at aphelion.'],['gibbs','Put your elbows together and lift them as one. Gibbs helped create vector analysis: two parallel vectors add to one.'],['newton','Fold toward the floor, like the apple. The same gravity keeps the Moon in its orbit.']
].forEach(([w,q],i)=>{LIB[i].who=w;LIB[i].quip=q});
let CUR='galileo';
const coachOf=()=>LIB[(S.mode==='break'||S.mode==='done')?S.routine[Math.min(S.step,S.routine.length-1)]:plan()[0]].who;
const idle=t=>{const p=base();if(RM)return p;p.chest=[.025*Math.sin(t*1.5),0,0];p.spine=[0,0,.02*Math.sin(t*.45)];p.head=[0,.3*Math.sin(t*.23)*Math.max(0,Math.sin(t*.11)),0];return p};
const wave=t=>{const p=idle(t);p.shL=[-.15,0,2.55];p.elL=[0,0,RM?.4:.45+.45*Math.sin(t*9)];p.head=[0,0,.12];return p};
const cheer=t=>{const p=elb(arms(base(),-.1,0,2.5+(RM?0:.12*Math.sin(t*7))),0,0,.2);p.y=RM?0:.03*Math.abs(Math.sin(t*5));p.head=[-.2,0,0];return p};

/* ---------- state, settings, log ---------- */
const S={mode:'idle',endAt:0,full:0,remain:0,routine:[],step:0,stepAt:0,breakAt:0,doneAt:0,lastChime:0,next:0};
const C={interval:30,per:3,style:'quick',chime:'random',notify:false};
let LOG={};
try{Object.assign(C,JSON.parse(localStorage.getItem('ss-set')||'{}'));LOG=JSON.parse(localStorage.getItem('ss-log')||'{}')||{};S.next=(+localStorage.getItem('ss-next')||0)%QN}catch(e){}
try{if(C.sound===false&&!('chime' in JSON.parse(localStorage.getItem('ss-set')||'{}')))C.chime='off'}catch(e){}delete C.sound;
try{if(!localStorage.getItem('ss-chime-v2')){if(C.chime!=='off')C.chime='random';localStorage.setItem('ss-chime-v2','1')}}catch(e){}
const save=()=>{try{localStorage.setItem('ss-set',JSON.stringify(C));localStorage.setItem('ss-log',JSON.stringify(LOG));localStorage.setItem('ss-next',String(S.next))}catch(e){}};
const pad=n=>String(n).padStart(2,'0');
const dk=d=>{const x=new Date(d);return x.getFullYear()+'-'+pad(x.getMonth()+1)+'-'+pad(x.getDate())};
const fmt=ms=>{const s=Math.max(0,Math.ceil(ms/1000));return Math.floor(s/60)+':'+pad(s%60)};
const pick=i=>Array.from({length:C.per},(_,k)=>(i+k)%QN);
const plan=(st=C.style)=>st==='full'?FULL:pick(S.next);
const mins=r=>{const m=Math.max(.5,Math.round(r.reduce((a,i)=>a+LIB[i].dur,0)/30)/2);return `${m} minute${m===1?'':'s'}`};

/* ---------- sound + alerts ---------- */
let AC=null,OUT=null;
function audio(){try{if(!AC){AC=new (window.AudioContext||window.webkitAudioContext)();const cp=AC.createDynamicsCompressor();OUT=AC.createGain();OUT.gain.value=.55;OUT.connect(cp).connect(AC.destination)}if(AC.state==='suspended')AC.resume()}catch(e){}}
/* each sound: sine partials at bell-like ratios, each with its own decay, plus a short filtered-noise strike */
function ring(t,f,parts,v,detune=0){for(const[r,g,d]of parts)for(const k of detune?[1,1+detune]:[1]){const o=AC.createOscillator(),a=AC.createGain();o.frequency.value=f*r*k;
 a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(.22*v*g/(detune?1.6:1),t+.004);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a).connect(OUT);o.start(t);o.stop(t+d+.05)}}
function hit(t,len,type,f,q,v){const n=Math.ceil(AC.sampleRate*len),b=AC.createBuffer(1,n,AC.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*(1-i/n)**3;
 const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),a=AC.createGain();s.buffer=b;fl.type=type;fl.frequency.value=f;fl.Q.value=q;a.gain.value=v;s.connect(fl).connect(a).connect(OUT);s.start(t)}
const SOUNDS={
 tingsha:{name:'Tingsha',from:'Tibetan hand cymbals',strike:(t,v)=>{ring(t,2240,[[1,1,6],[2.76,.3,2.5],[5.4,.12,1.2]],v,.006);hit(t,.02,'highpass',5000,.7,.25*v)},due:[0,1.8]},
 bowl:{name:'Singing bowl',from:'Himalayan bowl',strike:(t,v)=>{ring(t,210,[[1,1,10],[2.82,.45,6],[5.4,.2,3],[8.6,.08,1.5]],v,.003);hit(t,.06,'lowpass',400,.7,.3*v)},due:[0]},
 rin:{name:'Rin',from:'Japanese Buddhist bowl-bell',strike:(t,v)=>{ring(t,1180,[[1,1,7],[2.68,.4,3],[5,.15,1.5]],v,.002);hit(t,.015,'bandpass',3000,1,.2*v)},due:[0,2.4]},
 temple:{name:'Temple bell',from:'Japanese bonsho',strike:(t,v)=>{ring(t,98,[[1,1,12],[2,.6,9],[2.4,.5,8],[3,.4,6],[4.2,.25,4],[5.4,.15,3]],v*1.3,.004);hit(t,.15,'lowpass',200,.7,.6*v)},due:[0]},
 church:{name:'Church bell',from:'Western tower bell',strike:(t,v)=>{ring(t,330,[[.5,.6,8],[1,.8,5],[1.2,.6,4],[1.5,.3,3],[2,1,4],[2.5,.3,2],[3,.25,1.5],[4,.15,1]],v*.8);hit(t,.04,'bandpass',2000,1,.25*v)},due:[0,1.9]},
 sanctus:{name:'Sanctus bells',from:'Catholic altar bells',strike:(t,v)=>{const fs=[2637,3136,3520,3951];for(let i=0;i<10;i++){const tt=t+i*.11+Math.random()*.03;ring(tt,fs[(i*3+Math.floor(Math.random()*2))%4],[[1,1,1.2],[2.4,.25,.5]],v*.75)}},due:[0,1.8]},
 fish:{name:'Wooden fish',from:'Buddhist mokugyo',strike:(t,v)=>{ring(t,520,[[1,1,.18],[2.73,.35,.07]],v*1.4);hit(t,.05,'bandpass',800,3,.5*v)},due:[0,.35,.7]},
 gong:{name:'Gong',from:'Chinese gong',strike:(t,v)=>{ring(t,140,[[1,1,9],[1.48,.7,8],[2.1,.55,7],[2.9,.4,6],[3.7,.3,5],[4.6,.2,4],[5.8,.12,3]],v);hit(t,.3,'lowpass',600,.7,.4*v)},due:[0]}};
function play(kind,mode){if(!AC||!SOUNDS[kind])return;try{const s=SOUNDS[kind],t=AC.currentTime+.02;
 if(mode==='due')for(const d of s.due)s.strike(t+d,1);else s.strike(t,.45)}catch(e){}}
const KINDS=Object.keys(SOUNDS);let LAST='';
const showNow=()=>{const e=$('#chNow');if(e)e.textContent=C.chime!=='random'?'':LAST?` Just played: ${SOUNDS[LAST].name}.`:' A different sound each time.'};
const cur=()=>{if(C.chime!=='random')return C.chime;let k;do k=KINDS[Math.floor(Math.random()*KINDS.length)];while(k===LAST&&KINDS.length>1);LAST=k;showNow();return k};
function chime(){S.lastChime=Date.now();play(cur(),'due')}
function notify(){try{if(C.notify&&'Notification'in window&&Notification.permission==='granted'){
 const n=new Notification('Time to stand up and stretch',{body:'Up next: '+pick(S.next).map(i=>LIB[i].name).join(', '),tag:'stand-stretch',requireInteraction:true});
 n.onclick=()=>{window.focus();n.close()}}}catch(e){}}

/* ---------- flow ---------- */
function start(ms){S.full=ms??C.interval*60000;S.endAt=Date.now()+S.full;S.mode='working';draw(true)}
function due(){S.mode='due';chime();notify();draw(true)}
function go(st=C.style){S.routine=plan(st);if(st!=='full')S.next=(S.next+C.per)%QN;save();S.mode='break';S.step=0;S.stepAt=S.breakAt=Date.now();play(cur(),'soft');draw(true)}
function nextStep(){S.step++;if(S.step>=S.routine.length)return finish();S.stepAt=Date.now();play(cur(),'soft');draw(true)}
function finish(){const now=Date.now(),k=dk(now);(LOG[k]=LOG[k]||[]).push({t:now,n:Math.max(1,S.step),s:Math.round((now-S.breakAt)/1000)});
 const cut=dk(now-30*864e5);for(const d of Object.keys(LOG))if(d<cut)delete LOG[d];save();renderLog();
 S.mode='done';S.doneAt=now;play(cur(),'soft');draw(true)}
function endBreak(){if(S.step>0||Date.now()-S.stepAt>10000)finish();else start()}
const ACT={idle:[['start','Start',1]],working:[['now','Stretch now',1],['pause','Pause']],paused:[['resume','Resume',1],['reset','Reset']],
 due:[['go','Start stretching',1],['alt','alt'],['snooze','Snooze 5 min'],['skip','Skip this one']],break:[['next','Next stretch',1],['end','End break']],done:[]};
const DO={start:()=>start(),now:()=>go(),go:()=>go(),alt:()=>go(C.style==='full'?'quick':'full'),pause:()=>{S.remain=S.endAt-Date.now();S.mode='paused';draw(true)},
 resume:()=>{S.endAt=Date.now()+S.remain;S.mode='working';draw(true)},reset:()=>{S.mode='idle';draw(true)},
 snooze:()=>start(5*60000),skip:()=>start(),next:nextStep,end:endBreak};

/* ---------- panel ---------- */
const K=$('#kicker'),B=$('#big'),Q=$('#cue'),U=$('#sub'),BAR=$('.bar i'),A=$('#actions'),ST=$('#steps');
let lastMode='';
const QP=$('#quip'),TG=$('#tag'),TS=$('#topStatus'),STG=$('#stage');
function draw(full){const n=Date.now(),m=S.mode;let k,b,q='',u='',p=0,big=true;const w=coachOf(),co=COACH[w];CUR=w;let qp='';
 if(m==='idle'){k='Not started';b=fmt(C.interval*60000);q=`Press Start. A break comes every ${C.interval} minutes.`}
 else if(m==='working'||m==='paused'){const r=m==='paused'?S.remain:S.endAt-n;k=m==='paused'?'Paused':'Next stretch break in';b=fmt(r);p=1-r/S.full;
  q=C.style==='full'?`Up next: the full routine, ${FULL.length} moves, about ${mins(FULL)}.`:'Up next: '+pick(S.next).map(i=>LIB[i].name).join(', ')+'.'}
 else if(m==='due'){k='Time to stand up';b='Stretch break';big=false;const r=plan();q=`${r.length} stretches, about ${mins(r)}. Stand up, then press start.`}
 else if(m==='break'){const L=LIB[S.routine[S.step]],e=n-S.stepAt;k=`Stretch ${S.step+1} of ${S.routine.length}`;b=L.name;qp=L.quip;big=false;q=L.cue;u=fmt(L.dur*1000-e)+' left';p=e/(L.dur*1000)}
 else{k='Logged';b='Break done';big=false;q=`Next break in ${C.interval} minutes.`;p=1}
 K.textContent=k;if(B.textContent!==b)B.textContent=b;if(QP.textContent!==qp)QP.textContent=qp;const tg=`${co.name}, ${co.yrs}`;if(STG.dataset.mode!==m)STG.dataset.mode=m;const ts=m==='working'?`Next break in ${b}`:m==='paused'?`Paused at ${b}`:(m==='due'||m==='done'||m==='idle')?'':`${fmt(S.routine.slice(S.step).reduce((a,i)=>a+LIB[i].dur*1000,0)-(n-S.stepAt))} left in this break`;if(TS.textContent!==ts)TS.textContent=ts;if(TG.textContent!==tg)TG.textContent=tg;B.className=big?'time':'name';if(Q.textContent!==q)Q.textContent=q;U.textContent=u;
 BAR.style.transform='scaleX('+Math.max(0,Math.min(1,p))+')';
 if(full||m!==lastMode){const had=A.contains(document.activeElement);lastMode=m;
  A.innerHTML=ACT[m].map(([id,l,pr])=>`<button class="btn${pr?' pri':''}" data-a="${id}">${id==='alt'?(C.style==='full'?'Just a quick one':'Full routine instead'):l}</button>`).join('');
  if(had&&A.firstElementChild)A.firstElementChild.focus();
  const list=m==='break'||m==='done'?S.routine:m==='due'?plan():[];
  ST.innerHTML=list.map((i,j)=>`<li class="${m==='break'&&j===S.step?'on':''}${(m==='break'&&j<S.step)||m==='done'?' ok':''}">${LIB[i].name}</li>`).join('')}}
A.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;audio();DO[b.dataset.a]()});

/* ---------- tick ---------- */
let lastLogMin=-1;
function tick(){const n=Date.now(),m=S.mode;
 if(m==='working'&&n>=S.endAt)due();
 else if(m==='break'&&n-S.stepAt>=LIB[S.routine[S.step]].dur*1000)nextStep();
 else if(m==='done'&&n-S.doneAt>4500)start();
 else if(m==='due'&&n-S.lastChime>120000)chime();
 const t=S.mode==='due'?(Math.floor(n/1000)%2?'Stand up!':'Time to stretch'):S.mode==='break'?'Stretching, '+TITLE:TITLE;
 if(document.title!==t)document.title=t;
 const mm=Math.floor(n/60000);if(mm!==lastLogMin){lastLogMin=mm;renderLog()}
 draw(false)}

/* ---------- settings ---------- */
function sync(){for(const b of document.querySelectorAll('[data-iv]'))b.setAttribute('aria-pressed',+b.dataset.iv===C.interval);
 for(const b of document.querySelectorAll('[data-st]'))b.setAttribute('aria-pressed',b.dataset.st===C.style);
 for(const b of document.querySelectorAll('[data-per]'))b.setAttribute('aria-pressed',+b.dataset.per===C.per);
 $('#iv').value=C.interval;for(const b of document.querySelectorAll('[data-ch]'))b.setAttribute('aria-pressed',b.dataset.ch===C.chime);showNow();
 let ok=false;try{ok=C.notify&&Notification.permission==='granted'}catch(e){}$('#alerts').textContent=ok?'On':'Turn on'}
function setIv(v){v=Math.round(+v);if(!(v>=1))return;C.interval=Math.min(180,v);save();sync();
 if(S.mode==='working')start();else if(S.mode==='paused'){S.remain=S.full=C.interval*60000}draw(true)}
$('#ivSeg').addEventListener('click',e=>{const b=e.target.closest('[data-iv]');if(b)setIv(b.dataset.iv)});
$('#iv').addEventListener('change',e=>setIv(e.target.value));
$('#stSeg').addEventListener('click',e=>{const b=e.target.closest('[data-st]');if(!b)return;C.style=b.dataset.st;save();sync();draw(true)});
$('#perSeg').addEventListener('click',e=>{const b=e.target.closest('[data-per]');if(!b)return;C.per=+b.dataset.per;save();sync();draw(true)});
$('#chSeg').addEventListener('click',e=>{const b=e.target.closest('[data-ch]');if(!b)return;audio();C.chime=b.dataset.ch;save();sync();play(cur(),'due')});
$('#alerts').addEventListener('click',async()=>{audio();const M=$('#alertMsg');
 try{if(!('Notification'in window))throw 0;const r=await Notification.requestPermission();C.notify=r==='granted';save();
  M.textContent=C.notify?"Desktop alerts are on. You'll get one even when this tab is in the background.":'Alerts were blocked. Open this page in its own browser tab and try again; the chime and the flashing tab title still work.'}
 catch(e){M.textContent="This view doesn't allow desktop alerts. Open the page in its own browser tab to turn them on; the chime and tab title still work."}
 sync()});

/* ---------- log ---------- */
function renderLog(){const today=LOG[dk(Date.now())]||[],sec=today.reduce((a,b)=>a+(b.s||0),0);
 $('#todayN').textContent=today.length;$('#todayM').textContent=Math.round(sec/60);
 $('#todayList').innerHTML=today.length?today.slice().reverse().map(x=>`<li><span>${new Date(x.t).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}</span><span>${x.n} stretch${x.n===1?'':'es'} in ${fmt(x.s*1000)}</span></li>`).join('')
  :'<li class="empty">No breaks yet today.</li>';
 const days=[...Array(7)].map((_,i)=>{const d=new Date();d.setDate(d.getDate()-6+i);return d}),c=days.map(d=>(LOG[dk(d)]||[]).length),mx=Math.max(4,...c);
 $('#week').innerHTML=days.map((d,i)=>`<div class="wk${i===6?' now':''}"><span>${c[i]||'&nbsp;'}</span><span class="trk"><i style="height:${c[i]/mx*100}%"></i></span><span class="d">${d.toLocaleDateString([],{weekday:'short'})}</span></div>`).join('')}

/* ---------- 3D stage ---------- */
function poseNow(t){if(S.mode==='break'){const L=LIB[S.routine[S.step]];return L.pose(Math.min(L.dur,(Date.now()-S.stepAt)/1000))}
 if(S.mode==='due')return wave(t);if(S.mode==='done')return cheer(t);return idle(t)}
async function stage(){const el=$('#stage');let T;
 try{T=await import('three')}catch(e){el.classList.add('off');return}
 try{
  const R=new T.WebGLRenderer({antialias:true,alpha:true});R.setPixelRatio(Math.min(devicePixelRatio,2));R.setClearColor(0,0);
  R.shadowMap.enabled=true;R.toneMapping=T.NeutralToneMapping;el.prepend(R.domElement);
  const scene=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.1,50);
  scene.add(new T.HemisphereLight(0xfff6e6,0x3a4a8a,1.7));
  const sun=new T.DirectionalLight(0xffffff,2.4);sun.position.set(1.2,5,2.6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
  Object.assign(sun.shadow.camera,{left:-1.6,right:1.6,top:2.6,bottom:-1,near:.5,far:12});sun.shadow.normalBias=.02;scene.add(sun);
  const rim=new T.DirectionalLight(0xffc6a0,1.3);rim.position.set(-3,2.5,-2.5);scene.add(rim);
  const floor=new T.Mesh(new T.CircleGeometry(3,64),new T.ShadowMaterial({opacity:.2}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;scene.add(floor);
  const mat=new T.Mesh(new T.CylinderGeometry(.82,.82,.03,72),new T.MeshStandardMaterial({color:0xf0b27e,roughness:.95}));mat.position.y=.006;mat.receiveShadow=true;scene.add(mat);
  const ring=new T.Mesh(new T.TorusGeometry(.82,.006,8,96),new T.MeshStandardMaterial({color:0xe2553c,roughness:.5}));ring.rotation.x=Math.PI/2;ring.position.y=.022;scene.add(ring);

  /* the cast as paper cut-outs: flat Matisse-coloured cards hinged at the joints, unlit, each physicist told apart by cut-paper hair, beard, collar and prop */
  const RY=.95,HC=.14,INK=0x1c1b1a,WHITE=0xf6f1e6,SKIN=0xf5c2a8,NOSE=0xe39b7c,LIP=0xc8513f;
  const XO={depth:.008,bevelEnabled:false,curveSegments:18};
  const MB={},mb=c=>MB[c]||(MB[c]=Object.assign(new T.MeshBasicMaterial({color:c}),{toneMapped:false}));
  const SH=()=>new T.Shape();
  const rr=(w,h,r)=>{const s=SH(),x=-w/2,y=-h/2;s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);return s};
  const ov=(rx,ry)=>{const s=SH();s.absellipse(0,0,rx,ry,0,Math.PI*2,false,0);return s};
  const pg=p=>{const s=SH();s.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)s.lineTo(p[i],p[i+1]);s.closePath();return s};
  const star=(n,r1,r2,hole)=>{const s=SH();for(let i=0;i<=2*n;i++){const a=i/(2*n)*Math.PI*2,r=i%2?r2:r1;i?s.lineTo(Math.cos(a)*r,Math.sin(a)*r):s.moveTo(r,0)}const hp=new T.Path();hp.absellipse(0,0,hole,hole,0,Math.PI*2,true);s.holes.push(hp);return s};
  const sector=(r,a0,a1)=>{const s=SH();s.moveTo(0,0);s.absarc(0,0,r,a0,a1,false);s.closePath();return s};
  const cut=(par,s,c,x,y,z,rz=0)=>{const m=new T.Mesh(new T.ExtrudeGeometry(s,XO),mb(c));m.position.set(x,y,z);m.rotation.z=rz;m.castShadow=true;par.add(m);return m};
  const STYLE={
   galileo:{coat:INK,front:INK,legs:INK,sock:INK,shoe:0x5a3a1c,hair:0x8d8378,top:'bald',beard:'full',bs:1,collar:'band',tails:.62,prop:'telescope'},
   kepler:{coat:0x2346a8,front:0x1d3a8f,legs:0x2346a8,sock:INK,shoe:INK,hair:0x3a281e,top:'cap',beard:'goatee',collar:'ruff',tails:0,prop:'orbit'},
   newton:{coat:0xc8352e,front:WHITE,legs:0xc8352e,sock:WHITE,shoe:INK,hair:0xece5d6,top:'wig',beard:'',collar:'cravat',tails:.42,prop:'apple'},
   maxwell:{coat:INK,front:0xe98a2b,legs:0x4a4f57,sock:0x4a4f57,shoe:INK,hair:0x3a281e,top:'parted',beard:'full',bs:1.18,collar:'bow',tails:.38,prop:'wheel'},
   kelvin:{coat:INK,front:0xc2185b,legs:0x3d3a3a,sock:0x3d3a3a,shoe:INK,hair:WHITE,top:'bald',beard:'full',bs:1.18,collar:'high',tails:.42,prop:'thermo'},
   gibbs:{coat:0x2f8f4e,front:WHITE,legs:0x2f8f4e,sock:0x2f8f4e,shoe:0x3a281e,hair:0x7a5a3a,top:'parted',beard:'trim',collar:'tie',tie:0xe2553c,tails:0,prop:'flask'}};
  const holder=new T.Group();scene.add(holder);const figs={},anim=[];
  function person(id){const o=STYLE[id],J={},fig=new T.Group(),eyes=[];
   const grp=(n,par,x,y,z)=>{const g=new T.Group();g.position.set(x,y,z);par.add(g);J[n]=g;return g};
   const root=grp('root',fig,0,RY,0);cut(root,rr(.32,.18,.06),o.legs,0,-.03,.004);
   if(o.tails)cut(root,pg([-.16,.04,.16,.04,.21,-o.tails,-.21,-o.tails]),o.coat,0,0,-.012);
   const spine=grp('spine',root,0,.05,0);cut(spine,pg([-.15,0,.15,0,.16,.26,-.16,.26]),o.coat,0,0,.008);
   const chest=grp('chest',spine,0,.24,0);
   cut(chest,pg([-.16,-.02,.16,-.02,.23,.24,.18,.31,-.18,.31,-.23,.24]),o.coat,0,0,.01);
   cut(chest,pg([-.075,.31,.075,.31,.05,-.02,-.05,-.02]),o.front,0,0,.014);
   const C2=o.collar;
   if(C2==='band'){cut(chest,rr(.22,.05,.02),WHITE,0,.29,.02);for(const s of[1,-1])cut(chest,rr(.05,.1,.012),WHITE,.03*s,.22,.022)}
   if(C2==='cravat'){cut(chest,pg([-.06,.31,.06,.31,0,.12]),WHITE,0,0,.02);cut(chest,ov(.04,.032),WHITE,0,.28,.022)}
   if(C2==='ruff')cut(chest,star(20,.16,.125,.045),WHITE,0,.31,.016);
   if(C2==='bow'||C2==='high'||C2==='tie')cut(chest,rr(.12,C2==='high'?.09:.05,.015),WHITE,0,.3,.016);
   if(C2==='bow')for(const s of[1,-1])cut(chest,pg([0,0,.055*s,.028,.055*s,-.028]),INK,0,.27,.022);
   if(C2==='high')cut(chest,ov(.042,.03),INK,0,.255,.022);
   if(C2==='tie')cut(chest,pg([-.02,.28,.02,.28,.032,.08,0,.035,-.032,.08]),o.tie,0,0,.022);
   const neck=grp('neck',chest,0,.3,0);cut(neck,rr(.07,.1,.02),SKIN,0,.04,.012);
   const head=grp('head',neck,0,.09,0),H=o.hair;
   if(o.top==='cap'||o.top==='parted')cut(head,ov(.13,.13),H,0,HC+.05,.016);
   if(o.top==='parted')cut(head,ov(.085,.035),H,.035,HC+.125,.028,-.25);
   if(o.top==='bald')for(const s of[1,-1])cut(head,ov(.05,.075),H,.125*s,HC+.02,.016);
   if(o.top==='wig'){cut(head,ov(.18,.22),H,0,HC-.03,.012);cut(head,ov(.13,.075),H,0,HC+.15,.016);
    for(const s of[1,-1])for(const[a,b]of[[.1,.25],[.15,.17],[.17,.07],[.17,-.03],[.15,-.13],[.12,-.21]])cut(head,ov(.062,.058),H,a*s,HC+b,.016)}
   cut(head,ov(.115,.14),SKIN,0,HC,.02);
   for(const s of[1,-1]){cut(head,ov(.025,.035),SKIN,.115*s,HC,.018);
    eyes.push(cut(head,ov(.016,.02),INK,.045*s,HC+.025,.03));
    cut(head,rr(.05,.013,.006),o.top==='wig'?0x8d8378:H===WHITE?0xbdb6aa:H,.047*s,HC+.062,.03,-.12*s)}
   cut(head,pg([0,.032,.024,-.022,-.008,-.022]),NOSE,0,HC-.005,.032);
   if(o.beard==='full')cut(head,ov(.12*o.bs,.1*o.bs),H,0,HC-.09-(o.bs-1)*.15,.028);
   if(o.beard==='trim')cut(head,ov(.115,.065),H,0,HC-.085,.028);
   if(o.beard==='goatee'){cut(head,pg([-.035,0,.035,0,0,-.11]),H,0,HC-.075,.028);for(const s of[1,-1])cut(head,ov(.042,.011),H,.032*s,HC-.045,.031,.35*s)}
   if(!o.beard)cut(head,ov(.028,.009),LIP,0,HC-.075,.03);
   for(const[s,n]of[[1,'L'],[-1,'R']]){
    const sh=grp('sh'+n,chest,.2*s,.22,0);cut(sh,rr(.11,.34,.05),o.coat,0,-.14,.03);
    const e2=grp('el'+n,sh,0,-.3,0);cut(e2,rr(.095,.28,.045),o.coat,0,-.11,.032);cut(e2,rr(.1,.035,.012),WHITE,0,-.235,.034);cut(e2,ov(.05,.06),SKIN,0,-.29,.033);
    const hp=grp('hip'+n,root,.09*s,-.05,0);cut(hp,rr(.13,.46,.06),o.legs,0,-.2,.002);
    const kn=grp('kn'+n,hp,0,-.42,0);cut(kn,rr(.11,.44,.05),o.sock,0,-.2,.001);
    const an=grp('an'+n,kn,0,-.42,0);cut(an,ov(.075,.04),o.shoe,.02*s,-.03,.003)}
   const hand=J.elR;
   if(o.prop==='telescope'){const g=new T.Group();g.position.set(0,-.3,.04);g.rotation.z=.9;hand.add(g);cut(g,rr(.045,.38,.01),0xe98a2b,0,.12,0);cut(g,rr(.06,.04,.01),0x5a3a1c,0,.3,.002)}
   if(o.prop==='apple'){cut(head,ov(.045,.042),0xc8242f,0,HC+.25,.03);cut(head,rr(.008,.03,.003),0x5a3a1c,0,HC+.295,.029);cut(head,ov(.022,.009),0x2f8f4e,.022,HC+.297,.03,.4)}
   if(o.prop==='orbit'){const g=new T.Group();g.position.set(0,HC+.02,0);g.rotation.set(Math.PI/2-.45,0,.2);head.add(g);
    const A0=.32,B0=.26,E0=Math.sqrt(1-(B0/A0)**2),ring=ov(A0,B0),hp=new T.Path();hp.absellipse(0,0,A0-.01,B0-.01,0,Math.PI*2,true);ring.holes.push(hp);
    const rg=cut(g,ring,0xe2553c,-A0*E0,0,0);rg.castShadow=false;const pl=cut(g,ov(.03,.03),0x2f8f4e,0,0,.004);
    anim.push(t=>{const M=t*1.5;let E=M;for(let i=0;i<5;i++)E=M+E0*Math.sin(E);pl.position.set(A0*(Math.cos(E)-E0),B0*Math.sin(E),.004)})}
   if(o.prop==='wheel'){const g=new T.Group();g.position.set(0,-.33,.045);hand.add(g);[0xe2553c,0x2f8f4e,0x2346a8].forEach((c,i)=>cut(g,sector(.09,i*2*Math.PI/3,(i+1)*2*Math.PI/3),c,0,0,0));anim.push(t=>{g.rotation.z=-t*9})}
   if(o.prop==='thermo'){const g=new T.Group();g.position.set(0,-.3,.045);g.rotation.z=.3;hand.add(g);cut(g,rr(.028,.28,.012),WHITE,0,.1,0);cut(g,ov(.026,.026),0xd0312d,0,-.04,.002);cut(g,rr(.009,.14,.004),0xd0312d,0,.03,.002)}
   if(o.prop==='flask'){const g=new T.Group();g.position.set(0,-.3,.045);hand.add(g);cut(g,rr(.035,.08,.008),0xdcebf5,0,-.02,0);cut(g,ov(.068,.068),0xdcebf5,0,-.11,0);cut(g,ov(.054,.036),0xc2185b,0,-.13,.002)}
   fig.visible=false;holder.add(fig);figs[id]={fig,J,eyes}}
  for(const id in STYLE)person(id);
  let shown='';
  const NAMES=Object.keys(figs.galileo.J),ad=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));

  const fit=()=>{const w=el.clientWidth||1,h=el.clientHeight||1,a=w/h;R.setSize(w,h,false);cam.aspect=a;
   const d=Math.max(4.6,2/(2*Math.tan(T.MathUtils.degToRad(15))*a));cam.position.set(0,1.55,d);cam.lookAt(0,.97,0);cam.updateProjectionMatrix()};
  const ro=new ResizeObserver(fit);ro.observe(el);fit();
  const mp=$('#matProbe'),tint=()=>{try{mat.material.color.set(getComputedStyle(mp).color)}catch(e){}};tint();setInterval(tint,1000);

  let yaw=-.45,drag=null,y0=0;holder.rotation.y=yaw;
  el.addEventListener('pointerdown',e=>{drag=e.clientX;y0=yaw;el.setPointerCapture(e.pointerId)});
  el.addEventListener('pointermove',e=>{if(drag!==null)yaw=y0+(e.clientX-drag)*.01});
  const up=()=>{drag=null};el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);

  const tm=new T.Timer();tm.connect(document);
  R.setAnimationLoop(()=>{tm.update();const dt=Math.min(tm.getDelta(),.1),t=tm.getElapsed(),p=poseNow(t),k=1-Math.exp(-dt*6);
   const w=figs[CUR]?CUR:'galileo';
   if(w!==shown){const prev=figs[shown],nx=figs[w];if(prev){prev.fig.visible=false;for(const n of NAMES)nx.J[n].rotation.copy(prev.J[n].rotation);nx.J.root.position.y=prev.J.root.position.y}
    nx.fig.visible=true;nx.fig.scale.setScalar(RM?1:.75);shown=w}
   const F=figs[w],J=F.J;F.fig.scale.setScalar(F.fig.scale.x+(1-F.fig.scale.x)*Math.min(1,dt*8));
   for(const n of NAMES){const g=J[n],v=p[n]||Z;g.rotation.x+=ad(v[0],g.rotation.x)*k;g.rotation.y+=ad(v[1],g.rotation.y)*k;g.rotation.z+=ad(v[2],g.rotation.z)*k}
   J.root.position.y+=(RY+(p.y||0)-J.root.position.y)*k;const bl=(t%3.7)<.13?.12:1;for(const e of F.eyes)e.scale.y=bl;for(const a of anim)a(t);
   holder.rotation.y+=(yaw-holder.rotation.y)*Math.min(1,dt*10);
   R.render(scene,cam)});
 }catch(e){el.classList.add('off')}}

sync();renderLog();draw(true);setInterval(tick,250);stage();

})();
