gsap.registerPlugin(ScrollTrigger);

const intro = gsap.timeline({defaults:{ease:'power3.out'}});
intro.to('.intro-rule',{width:150,duration:.7})
  .from('.intro-logo',{scale:.72,opacity:0,duration:.6},0)
  .from('.intro small',{y:12,opacity:0,duration:.5},.25)
  .to('.intro',{yPercent:-100,duration:1,delay:.35,ease:'power4.inOut'});

const cursor = document.querySelector('.cursor-light');
window.addEventListener('pointermove',e=>{if(cursor){cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'}});

const device = document.getElementById('device');
if(device){
  device.addEventListener('pointermove',e=>{
    const r=device.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5;
    const y=(e.clientY-r.top)/r.height-.5;
    gsap.to(device,{rotateY:x*13,rotateX:-y*10,x:x*8,y:y*8,duration:.35,ease:'power2.out'});
  });
  device.addEventListener('pointerleave',()=>gsap.to(device,{rotateY:0,rotateX:0,x:0,y:0,duration:.7,ease:'power3.out'}));
}

document.querySelectorAll('.magnetic').forEach(el=>{
  el.addEventListener('pointermove',e=>{
    const r=el.getBoundingClientRect();
    gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.16,y:(e.clientY-r.top-r.height/2)*.16,duration:.25});
  });
  el.addEventListener('pointerleave',()=>gsap.to(el,{x:0,y:0,duration:.5,ease:'elastic.out(1,.45)'}));
});

gsap.from('.hero-copy>*',{y:34,opacity:0,stagger:.09,duration:.9,delay:1.15,ease:'power3.out'});
gsap.from('.stage',{x:70,opacity:0,rotate:2,duration:1.2,delay:1.05,ease:'power3.out'});
gsap.to('.orbit-a',{rotate:360,duration:28,repeat:-1,ease:'none'});
gsap.to('.orbit-b',{rotate:342,duration:36,repeat:-1,ease:'none'});
gsap.to('.ping',{y:-12,duration:2.4,repeat:-1,yoyo:true,ease:'sine.inOut'});
gsap.to('.state',{y:10,duration:2.8,repeat:-1,yoyo:true,ease:'sine.inOut'});

gsap.utils.toArray('.title-row,.story,.network-copy,.globe-wrap,.plan-table article,.download>div').forEach(el=>{
  gsap.from(el,{scrollTrigger:{trigger:el,start:'top 84%'},y:45,opacity:0,duration:.9,ease:'power3.out'});
});
gsap.to('.manifest p:first-child',{scrollTrigger:{trigger:'.manifest',start:'top bottom',end:'bottom top',scrub:1},x:-100});
gsap.to('.manifest .red',{scrollTrigger:{trigger:'.manifest',start:'top bottom',end:'bottom top',scrub:1},x:170});
gsap.to('#device',{scrollTrigger:{trigger:'.product',start:'top bottom',end:'top 20%',scrub:1},rotateZ:-5,y:90,scale:.9});

document.querySelectorAll('[data-count]').forEach(el=>{
  ScrollTrigger.create({trigger:el,start:'top 85%',once:true,onEnter:()=>{
    const target=Number(el.dataset.count);const obj={n:0};
    gsap.to(obj,{n:target,duration:1.4,ease:'power3.out',onUpdate:()=>el.textContent=Math.round(obj.n)});
  }});
});

document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href');
  if(id==='#')return;
  const target=document.querySelector(id);
  if(target){e.preventDefault();target.scrollIntoView({behavior:'smooth'})}
}));

(function background(){
  const canvas=document.getElementById('webgl');
  if(!canvas||!window.THREE)return;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(55,innerWidth/innerHeight,.1,100);
  camera.position.z=5;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
  renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  renderer.setSize(innerWidth,innerHeight);
  const count=900;
  const positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    positions[i*3]=(Math.random()-.5)*12;
    positions[i*3+1]=(Math.random()-.5)*9;
    positions[i*3+2]=(Math.random()-.5)*6;
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const material=new THREE.PointsMaterial({color:0x6a2b20,size:.012,transparent:true,opacity:.55});
  const points=new THREE.Points(geometry,material);scene.add(points);
  let mx=0,my=0;
  window.addEventListener('pointermove',e=>{mx=(e.clientX/innerWidth-.5)*.12;my=(e.clientY/innerHeight-.5)*.12});
  function tick(){points.rotation.y+=.0006;points.rotation.x+=(my-points.rotation.x)*.01;points.rotation.y+=(mx-points.rotation.y)*.004;renderer.render(scene,camera);requestAnimationFrame(tick)}tick();
  addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
})();

(function globe(){
  const canvas=document.getElementById('globe');
  if(!canvas||!window.THREE)return;
  const scene=new THREE.Scene();
  const camera=new THREE.PerspectiveCamera(42,1,.1,100);camera.position.z=3.2;
  const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));
  const globe=new THREE.Group();scene.add(globe);
  const sphere=new THREE.Mesh(new THREE.SphereGeometry(1,42,42),new THREE.MeshBasicMaterial({color:0x111215,wireframe:true,transparent:true,opacity:.42}));globe.add(sphere);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.22,.004,8,160),new THREE.MeshBasicMaterial({color:0xff4325,transparent:true,opacity:.42}));ring.rotation.x=1.1;ring.rotation.z=.35;globe.add(ring);
  const pts=[[.35,.72,.58],[-.72,.25,.62],[.72,.12,.6],[-.1,-.65,.72],[.55,-.5,.65]];
  pts.forEach(p=>{const n=new THREE.Mesh(new THREE.SphereGeometry(.025,12,12),new THREE.MeshBasicMaterial({color:0xff4325}));n.position.set(...p);globe.add(n)});
  function size(){const r=canvas.getBoundingClientRect();renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix()}size();
  function tick(){globe.rotation.y+=.0024;renderer.render(scene,camera);requestAnimationFrame(tick)}tick();
  addEventListener('resize',size);
})();