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

const INTENTS = [
  { id:'greeting', keys:['hi','hello','hey','yo','sup','gday','good boy','woof'], reply:"Hey! I'm Scrappy Coco, the Red Envelope mascot. Ask me about services, pricing, how we work, or just tell me what you're stuck on." },
  { id:'name', keys:['your name','what are you called','who are you','name is'], reply:"I'm Scrappy Coco — the Red Envelope NZ mascot. I fetch business cards, guard the till, and apparently answer chat questions too now." },
  { id:'pricing', keys:['price','cost','pricing','budget','how much','rate','fee','expensive','afford','quote'], reply:"It depends on scope, so we keep pricing honest and specific to you rather than selling fixed packages. Tell us a bit about your business at theredenvelopenz@gmail.com and we'll put a real number to it." },
  { id:'services', keys:['service','services','offer','do you do','help with','what do you do'], reply:"Five things, mainly: NFC review cards, booking-ready websites, video ads, print & branding, and private review audits. Want detail on one of those?" },
  { id:'nfc', keys:['nfc','tap to review','review card','tap card','counter stand','table talker','google review'], reply:"Custom-branded tap-to-review NFC cards, counter displays or table talkers. A customer taps their phone at checkout and your 5-star Google review page opens — no typing, no searching." },
  { id:'website', keys:['website','web design','booking engine','online booking','deposit','landing page','upgrade my site'], reply:"We build fast, mobile-friendly websites — or upgrade an outdated one — with instant online scheduling and deposit collection built in. A booking engine, not a static brochure." },
  { id:'video', keys:['video','commercial','ad campaign','reels','tiktok','meta ads','advertising','local seo'], reply:"Studio-quality video commercials for Reels, TikTok and Meta, plus targeted local ad campaigns built to put paying clients on your calendar." },
  { id:'print', keys:['print','business card','qr code','flyer','loyalty card','appointment card','branding'], reply:"Premium designed business cards, QR flyers, loyalty and appointment cards — integrated with your online booking QR codes so every touchpoint leads somewhere." },
  { id:'audit', keys:['review audit','bad review','analytics','staff performance','consulting','1-on-1','feedback'], reply:"Private 1-on-1 review audits. We catch unhappy customers before they post publicly, then sit down with you to find the root cause and handle service recovery." },
  { id:'process', keys:['how does it work','how it works','process','what are the steps','get started','begin','onboarding','first step'], reply:"It usually starts with a conversation about where reviews or bookings are falling through the cracks — email theredenvelopenz@gmail.com and we'll take it from there." },
  { id:'timeline', keys:['how long','timeline','turnaround','duration','when can'], reply:"Depends on scope — NFC cards ship fast, a full website build takes longer. Happy to give a real timeline once we know what you need." },
  { id:'results', keys:['results','guarantee','proof','case study','portfolio','examples','past clients'], reply:"We'd rather show you than tell you — email us and we can walk through examples relevant to your kind of business." },
  { id:'differentiator', keys:['why you','why should i','what makes you different','unique','competitors','better than'], reply:"Mostly this: we catch unhappy customers privately before they post, and make leaving a good review effortless for everyone else. Most businesses only do one of those, not both." },
  { id:'solo', keys:['solo','entrepreneur','freelance','one person business','myself','small business','startup','side hustle'], reply:"Solo operators and small local businesses are exactly who this is built for — you don't need a marketing team to run this system." },
  { id:'location', keys:['location','based','where are you','auckland','new zealand','nz','country'], reply:"We're based in New Zealand and work with local businesses across the country — and beyond, if the fit's right." },
  { id:'contact', keys:['contact','email','reach you','talk to someone','phone call','get in touch','message you','real human'], reply:"Easiest is theredenvelopenz@gmail.com — say hello and what you're working on, and a real human (not just me) will get back to you." },
  { id:'thanks', keys:['thanks','thank you','cheers','appreciate it'], reply:"Anytime. Good luck out there!" },
  { id:'goodbye', keys:['bye','goodbye','see ya','talk later','all done'], reply:"Catch you later — the inbox is always open if something comes up." },
];

const FOLLOW_UPS = {
  services: "The one most people start with is the NFC review cards — cheap to produce, high perceived value, and it starts paying off on day one. Want me to go deeper on any of the five?",
  pricing: "If it helps to have a starting point in mind before you email: most engagements scope around a specific problem (more reviews, fewer no-shows, more bookings) rather than a flat monthly fee.",
  nfc: "These pair naturally with the website booking engine — a review page is great, but sending that same customer straight into a booking slot is even better.",
  website: "This is usually where the review cards and print materials plug in too, since the QR codes and NFC taps all point back to one place.",
  video: "This is usually paired with the website upgrade, since there's no point running ads to a site that can't actually book the client in.",
  print: "These are usually ordered alongside the NFC cards, since both point back to the same booking QR code.",
  audit: "This runs monthly once it's set up — a standing 1-on-1 session rather than a one-off review.",
  contact: "theredenvelopenz@gmail.com — genuinely the fastest path, faster than this chat.",
};
const FALLBACKS = [
  "I'm just a friendly mascot, not the full team — but drop that to theredenvelopenz@gmail.com and someone will actually answer it properly.",
  "That one's above my pay grade (I'm a dog). theredenvelopenz@gmail.com will get you a real answer.",
  "Good question — better asked to a human. Try theredenvelopenz@gmail.com.",
];
const CONTINUERS = ['yes','yeah','yep','sure','ok','okay','more','tell me more','go on','please','why not'];
let lastTopic = null, fallbackCount = 0;

function normalize(text) {
  return ' ' + text.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
}

function scoreIntents(norm) {
  let best = null, bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const k of intent.keys) {
      if (norm.includes(' ' + k + ' ')) score += k.split(' ').length;
    }
    if (score > bestScore) { bestScore = score; best = intent; }
  }
  return bestScore > 0 ? best : null;
}

function getBotReply(rawText) {
  const norm = normalize(rawText);
  const match = scoreIntents(norm);
  if (match) {
    lastTopic = match.id;
    return match.reply;
  }
  const trimmed = rawText.trim().toLowerCase();
  if (lastTopic && CONTINUERS.some(c => trimmed === c || trimmed.includes(c))) {
    const followUp = FOLLOW_UPS[lastTopic];
    if (followUp) return followUp;
  }
  fallbackCount++;
  return FALLBACKS[Math.min(fallbackCount - 1, FALLBACKS.length - 1)];
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
const QUICK_REPLIES = [
  { label: 'Services', text: 'What services do you offer?' },
  { label: 'Pricing', text: 'How much does it cost?' },
  { label: 'How it works', text: 'How does it work?' },
  { label: 'Contact', text: 'How do I contact you?' },
];

function renderQuickReplies() {
  const wrap = document.createElement('div');
  wrap.className = 'chat-chips';
  QUICK_REPLIES.forEach(q => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chat-chip';
    btn.textContent = q.label;
    btn.addEventListener('click', () => {
      wrap.remove();
      handleUserMessage(q.text);
    });
    wrap.appendChild(btn);
  });
  chatMessages.appendChild(wrap);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleUserMessage(text) {
  addMessage(text, 'user');
  const typingEl = showTyping();
  const delay = reduceMotion ? 150 : 550 + Math.random() * 500;
  setTimeout(() => {
    typingEl.remove();
    addMessage(getBotReply(text), 'bot');
  }, delay);
}

function openChat() {
  chatOpen = true;
  chatPanel.hidden = false;
  requestAnimationFrame(() => chatPanel.classList.add('open'));
  mascotToggle.setAttribute('aria-expanded', 'true');
  mascot.classList.add('chat-open');
  mascot.classList.remove('show-message');
  if (!greeted) {
    greeted = true;
    setTimeout(() => addMessage("Hi there! I'm Scrappy Coco, the Red Envelope mascot. Ask me about services, pricing, or how we work — or tap one below.", 'bot'), 300);
    setTimeout(renderQuickReplies, reduceMotion ? 300 : 700);
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
    chatInput.value = '';
    const existingChips = chatMessages.querySelector('.chat-chips');
    if (existingChips) existingChips.remove();
    handleUserMessage(text);
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

document.querySelectorAll('.service-card,.intro>div,.section-head>*,.manifesto-card,.contact-inner,.game-head>*').forEach(el=>{
  el.style.opacity='0';
  el.style.transform='translateY(22px)';
  el.style.transition='opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1)';
  reveal.observe(el);
});

/* ---- Preloader ---- */
(function preloader(){
  const el = document.querySelector('#preloader');
  const pctEl = document.querySelector('#preloaderPct');
  if (!el) return;
  document.body.style.overflow = 'hidden';
  const duration = reduceMotion ? 300 : 1200;
  const start = performance.now();
  function tick(now){
    const t = Math.min(1, (now - start) / duration);
    const pct = Math.round(t * 100);
    if (pctEl) pctEl.textContent = pct;
    if (t < 1) {
      requestAnimationFrame(tick);
    } else {
      el.classList.add('preloader-hide');
      document.body.style.overflow = '';
      setTimeout(() => el.remove(), 500);
    }
  }
  requestAnimationFrame(tick);
})();
