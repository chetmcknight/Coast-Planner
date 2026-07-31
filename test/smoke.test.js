const { readFileSync } = require('fs');
const { JSDOM } = require('jsdom');
const assert = require('assert');

const html = readFileSync(__dirname + '/../index.html', 'utf8');
const dom = new JSDOM(html, { runScripts: 'dangerously', pretendToBeVisual: true });
const { window } = dom;
const { document } = window;
const { Event } = window;

const click = el => el.dispatchEvent(new Event('click', { bubbles: true }));
const change = el => el.dispatchEvent(new Event('change', { bubbles: true }));

const assertTrue = (cond, msg) => { assert.ok(cond, msg); };

const tripBody = document.getElementById('tripBody');
const filters = document.getElementById('filters');
const cardList = document.getElementById('cardList');
const spineSvg = document.getElementById('spineSvg');

assertTrue(document.querySelectorAll('.park-card').length === 73, 'all 73 parks rendered');
assertTrue(filters.children.length === 4, '4 filter chips');
assertTrue(document.querySelectorAll('.spine-dot').length === 73, '73 spine dots rendered');
assertTrue(document.querySelectorAll('.legend-item').length === 3, '3 legend items');

assertTrue(!!document.getElementById('card-marina-dunes'), 'Marina Dunes RV Park card present');
assertTrue(!!document.getElementById('card-tt-marina-dunes'), 'Thousand Trails Marina Dunes card present');
assertTrue(
  document.querySelectorAll('#cardList .park-card').length ===
  document.querySelectorAll('#cardList .park-card .park-name').length,
  'every card has a name'
);
assertTrue(
  [...document.querySelectorAll('.type-badge')].every(b =>
    /badge-(state|tt|private)/.test(b.className) && b.textContent.trim().length > 0
  ),
  'every card has a typed badge'
);

const privateIds = ['tillamook-bay-city', 'dew-valley-ranch', 'oceanside-rv', 'atrivers-edge'];
privateIds.forEach(id => {
  assertTrue(!!document.getElementById('card-' + id), 'private park card present: ' + id);
  assertTrue(
    document.getElementById('card-' + id).querySelector('.type-badge').classList.contains('badge-private'),
    'private park badge colored: ' + id
  );
});
assertTrue(
  document.querySelectorAll('.spine-dot.dot-state').length === 18 &&
  document.querySelectorAll('.spine-dot.dot-tt').length === 46 &&
  document.querySelectorAll('.spine-dot.dot-private').length === 9,
  'spine dots colored by type'
);
assertTrue(
  document.querySelector('#card-tillamook-bay-city').querySelector('.type-badge').classList.contains('badge-private'),
  'tillamook bay city is private'
);

const firstCard = document.querySelector('.park-card');
const firstId = firstCard.querySelector('[data-action="plus"]').dataset.id;
const plus = firstCard.querySelector('[data-action="plus"]');
const minus = firstCard.querySelector('[data-action="minus"]');

click(plus);
assertTrue(minus.disabled === false, 'minus enabled after +');
assertTrue(firstCard.querySelector('.nights-count').textContent === '1', 'count shows 1');
assertTrue(tripBody.querySelector('.stop-name'), 'trip panel shows stop');
assertTrue(document.getElementById('card-' + firstId).classList.contains('park-card'), 'card id present');
const dot = spineSvg.querySelector(`circle[data-id="${firstId}"]`);
assertTrue(dot.classList.contains('active'), 'spine dot active');

click(minus);
assertTrue(firstCard.querySelector('.nights-count').textContent === '0', 'count back to 0');
assertTrue(minus.disabled === true, 'minus disabled at 0');

for (let i = 0; i < 15; i++) click(plus);
assertTrue(firstCard.querySelector('.nights-count').textContent === '14', 'capped at 14');

click(plus);
const regChip = [...filters.children].find(c => c.dataset.region === 'Oregon');
click(regChip);
assertTrue(document.querySelectorAll('.park-card').length > 15, 'Oregon filter applied');
assertTrue([...filters.children].find(c => c.dataset.region === 'Oregon').classList.contains('active'), 'chip active');

const caChip = [...filters.children].find(c => c.dataset.region === 'California');
click(caChip);
assertTrue(!!document.getElementById('card-marina-dunes'), 'Marina Dunes RV Park shows under California filter');
assertTrue(!!document.getElementById('card-tt-marina-dunes'), 'Thousand Trails Marina Dunes shows under California filter');
const ttDunesPlus = document.getElementById('card-tt-marina-dunes').querySelector('[data-action="plus"]');
click(ttDunesPlus);
assertTrue(document.getElementById('card-tt-marina-dunes').querySelector('.nights-count').textContent === '1', 'delegated stepper works after re-render');

const itinTab = document.querySelector('.tab[data-view="itinerary"]');
click(itinTab);
assertTrue(document.getElementById('itineraryView').classList.contains('active'), 'itinerary view shown');
const stops = document.getElementById('itineraryView').querySelectorAll('.itin-stop');
assertTrue(stops.length >= 1, 'itinerary stops rendered');

const startInput = document.getElementById('tripStart');
startInput.value = '2026-08-15';
change(startInput);
assertTrue(tripBody.querySelector('.stop-dates'), 'dates computed after start date');

click(document.querySelector('.tab[data-view="browse"]'));
click(document.getElementById('resetBtn'));
assertTrue(document.querySelector('.nights-count').textContent === '0', 'reset clears nights');
assertTrue(tripBody.querySelector('.empty-trip'), 'empty trip message after reset');

const todayLocal = document.getElementById('tripStart').min;
const local = new Date();
const expect = `${local.getFullYear()}-${String(local.getMonth()+1).padStart(2,'0')}-${String(local.getDate()).padStart(2,'0')}`;
assertTrue(todayLocal === expect, `min date is local today (${todayLocal})`);

assertTrue(spineSvg.viewBox.baseVal.height >= 600, `spine viewBox height matches container (${spineSvg.viewBox.baseVal.height})`);
assertTrue(Math.abs(spineSvg.viewBox.baseVal.width - 64) < 0.1, 'spine viewBox width 64');

const scrollCalls = [];
const origScrollTo = window.scrollTo;
window.scrollTo = opts => scrollCalls.push(opts);
const mDown = new window.MouseEvent('mousedown', { bubbles: true, button: 1, clientX: 100, clientY: 100 });
const mMove = new window.MouseEvent('mousemove', { bubbles: true, button: 1, clientX: 140, clientY: 170 });
const mMoveSmall = new window.MouseEvent('mousemove', { bubbles: true, button: 1, clientX: 101, clientY: 101 });
const mUp = new window.MouseEvent('mouseup', { bubbles: true, button: 1, clientX: 140, clientY: 170 });
document.dispatchEvent(mDown);
window.dispatchEvent(mMoveSmall);
assertTrue(scrollCalls.length === 0, 'no scroll below drag threshold');
window.dispatchEvent(mMove);
assertTrue(scrollCalls.length === 1, 'scroll starts after threshold');
assertTrue(scrollCalls[0].left === -40 && scrollCalls[0].top === -70, 'content follows cursor (left -40, top -70)');
assertTrue(scrollCalls[0].behavior === 'instant', 'drag scroll is instant (ignores smooth)');
assertTrue(document.documentElement.classList.contains('middle-drag'), 'grabbing cursor class applied');
window.dispatchEvent(mUp);
assertTrue(!document.documentElement.classList.contains('middle-drag'), 'grabbing cursor class removed on release');
window.scrollTo = origScrollTo;

console.log('ALL SMOKE TESTS PASSED');
window.close();
