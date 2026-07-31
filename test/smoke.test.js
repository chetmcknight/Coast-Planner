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

assertTrue(document.querySelectorAll('.park-card').length > 60, 'all parks rendered');
assertTrue(filters.children.length === 4, '4 filter chips');
assertTrue(document.querySelectorAll('.spine-dot').length > 60, 'spine dots rendered');

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

console.log('ALL SMOKE TESTS PASSED');
window.close();
