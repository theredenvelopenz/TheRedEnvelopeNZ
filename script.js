const stage = document.querySelector('#stage');
const card = document.querySelector('#card');
const dog = document.querySelector('#dog');
const mascot = document.querySelector('.mascot-hud');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let chatOpen = false;

/* ---- Mascot chatbot ---- */
const mascotToggle = document.querySelector('#mascotToggle');
const chatPanel = document.querySelector('#chatPanel');
const chatClose = document.querySelector('#chatClose');
const chatMessages = document.querySelector('#chatMessages');
const chatForm = document.querySelector('#chatForm');
const chatInput = document.querySelector('#chatInput');

const BOT_REPLIES = [
  { keys: ['price','cost','pricing','budget','how much'], reply: "It depends on scope, so we keep pricing conversations honest and specific to you. Tell us a bit about your business and we'll put a number to it — theredenvelopenz@gmail.com is the fastest way in." },
  { keys: ['service','services','offer','do you do','help with'], reply: "We cover marketing strategy, brand & creative, digital marketing, and ongoing marketing support — take a look at the Services section above, or tell me what you're trying to fix and I'll point you the right way." },
  { keys: ['contact','email','reach','talk','call'], reply: "Easiest is theredenvelopenz@gmail.com — say hello and what you're working on, and a real human (not just me) will get back to you." },
  { keys: ['solo','entrepreneur','freelance','one person','myself'], reply: "Solo operators are half of who we work with. You don't need a big budget to get a clear plan — just tell us where you're stuck." },
  { keys: ['location','based','where are you','auckland','new zealand','nz'], reply: "We're based in New Zealand and work with businesses across the country (and beyond, if the fit's right)." },
  { keys: ['hi','hello','hey','woof','good boy','gday'], reply: "Hey! I'm the office dog — I fetch business cards and I can point you toward the right part of the site. What are you working on?" },
  { keys: ['thanks','thank you','cheers','ta'], reply: "Anytime. Good luck out there!" }
];
const FALLBACK_REPLY = "I'm just a friendly mascot, not the full team — but if you drop your question to theredenvelopenz@gmail.com, someone will actually answer it properly.";

function getBotReply(text) {
  const lower = text.toLowerCase();
  for (const entry of BOT_REPLIES) {
    if (entry.keys.some(k => lower.includes(k))) return entry.reply;
  }
  return FALLBACK_REPLY;
}

function addMessage(text, who) {
  const el = document.createElement('div');
  el.className = `chat-msg ${who}`;
  el.textContent = text;
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'chat-msg bot typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return el;
}

let greeted = false;
function openChat() {
  chatOpen = true;
  chatPanel.hidden = false;
  requestAnimationFrame(() => chatPanel.classList.add('open'));
  mascotToggle.setAttribute('aria-expanded', 'true');
  mascot.classList.add('chat-open');
  mascot.classList.remove('show-message');
  if (!greeted) {
    greeted = true;
    setTimeout(() => addMessage("Hi there! I'm the Red Envelope mascot. Ask me about services, pricing, or how to reach the team.", 'bot'), 300);
  }
  setTimeout(() => chatInput.focus(), reduceMotion ? 0 : 260);
}
function closeChat() {
  chatOpen = false;
  chatPanel.classList.remove('open');
  mascotToggle.setAttribute('aria-expanded', 'false');
  mascot.classList.remove('chat-open');
  setTimeout(() => { if (!chatOpen) chatPanel.hidden = true; }, reduceMotion ? 0 : 260);
}

if (mascotToggle && chatPanel) {
  mascotToggle.addEventListener('click', () => { chatOpen ? closeChat() : openChat(); });
  chatClose.addEventListener('click', closeChat);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && chatOpen) closeChat(); });
  chatForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    addMessage(text, 'user');
    chatInput.value = '';
    const typingEl = showTyping();
    const delay = reduceMotion ? 150 : 550 + Math.random()*500;
    setTimeout(() => {
      typingEl.remove();
      addMessage(getBotReply(text), 'bot');
    }, delay);
  });
}

if (stage && card && dog && !reduceMotion) {
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    if (!document.body.classList.contains('dragging-card')) {
      card.style.transform = `translate(${35 + x*18}px,${-20 + y*12}px) rotate(${-7 + x*2}deg)`;
    }
    dog.style.transform = `translate(${x*-12}px,${y*-6}px)`;
  });
  stage.addEventListener('pointerleave', () => {
    if (!document.body.classList.contains('dragging-card')) card.style.transform = '';
    dog.style.transform = '';
  });
}

/* A tiny interactive "fetch" game: click the card, then move the pointer.
   The dog chases the card; click again to let go. */
if (card && dog && !reduceMotion) {
  let grabbed = false;
  card.addEventListener('click', (e) => {
    e.stopPropagation();
    grabbed = !grabbed;
    document.body.classList.toggle('dragging-card', grabbed);
    card.classList.toggle('grabbed', grabbed);
    dog.classList.toggle('grabbing', grabbed);
    if (chatOpen) return;
    mascot.classList.toggle('show-message', grabbed);
    if (grabbed) {
      mascot.querySelector('.hud-bubble').textContent = 'FETCH!';
      mascot.classList.add('pounce');
      setTimeout(()=>mascot.classList.remove('pounce'),700);
    } else {
      mascot.querySelector('.hud-bubble').textContent = 'Good boy.';
      mascot.classList.add('show-message');
      setTimeout(()=>mascot.classList.remove('show-message'),1300);
    }
  });
}

/* Scroll choreography: the dog runs between "chapters". */
const scenes = [
  {id:'top', msg:'I found the idea.'},
  {id:'idea', msg:'Let me carry that.'},
  {id:'services', msg:'Pick your mission.'},
  {id:'approach', msg:'This way.'},
  {id:'contact', msg:'Let’s do this.'}
];
let lastScene = '';

function updateMascot() {
  if (!mascot || reduceMotion || chatOpen) return;
  const y = window.scrollY + window.innerHeight * .42;
  let active = scenes[0];
  for (const s of scenes) {
    const el = document.getElementById(s.id);
    if (el && y >= el.offsetTop) active = s;
  }
  if (active.id !== lastScene) {
    lastScene = active.id;
    mascot.querySelector('.hud-bubble').textContent = active.msg;
    mascot.classList.add('pounce','show-message');
    setTimeout(()=>mascot.classList.remove('pounce'),700);
    setTimeout(()=>mascot.classList.remove('show-message'),1800);
  }
}
window.addEventListener('scroll', updateMascot, {passive:true});
updateMascot();

/* The mid-page dog runs in with the envelope as its section enters view. */
const runner = document.querySelector('.dog-runner');
const miniStage = document.querySelector('.mini-dog-stage');
if (runner && miniStage && !reduceMotion) {
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        runner.animate(
          [{left:'-140px',transform:'rotate(-3deg)'},{left:'32%',transform:'rotate(4deg)'},{left:'32%',transform:'rotate(-2deg)'}],
          {duration:1700,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}
        );
        io.unobserve(entry.target);
      }
    });
  },{threshold:.35});
  io.observe(miniStage);
}

/* Services become little "dog reactions" on hover. */
document.querySelectorAll('.service-card').forEach((service)=>{
  service.addEventListener('mouseenter',()=>{
    if (!mascot || reduceMotion || chatOpen) return;
    mascot.querySelector('.hud-bubble').textContent = service.dataset.dogMessage || 'Woof.';
    mascot.classList.add('show-message','pounce');
    setTimeout(()=>mascot.classList.remove('pounce'),700);
  });
});

/* Reveal elements as they enter the viewport. */
const reveal = new IntersectionObserver((entries)=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.style.opacity='1';
      entry.target.style.transform='translateY(0)';
      reveal.unobserve(entry.target);
    }
  });
},{threshold:.12});

document.querySelectorAll('.service-card,.intro>div,.section-head>*,.manifesto-card,.contact-inner').forEach(el=>{
  el.style.opacity='0';
  el.style.transform='translateY(22px)';
  el.style.transition='opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)';
  reveal.observe(el);
});
