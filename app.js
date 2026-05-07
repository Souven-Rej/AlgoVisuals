'use strict';

// ── 1. State & DOM ─────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
let array = [], originalArray = [];
let isSorting = false, stopRequested = false, isPaused = false, stepMode = false, stepProceed = false;
let comparisons = 0, swapCount = 0, sortedCount = 0;
let startTime = null, timerInterval = null, sortHistory = [];
let currentAlgo = 'bubble', currentPreset = 'random';
let audioCtx = null, soundEnabled = false;

const visualizer = $('visualizer'), vizContainer = $('vizContainer'), sortProgress = $('sortProgress');
const generateBtn = $('generateBtn'), sortBtn = $('sortBtn'), stopBtn = $('stopBtn'), pauseBtn = $('pauseBtn');
const stepModeBtn = $('stepModeBtn'), nextStepBtn = $('nextStepBtn'), shareBtn = $('shareBtn'), exportCsvBtn = $('exportCsvBtn');
const arraySizeEl = $('arraySize'), speedEl = $('speed'), arraySizeVal = $('arraySizeValue'), speedVal = $('speedValue');
const comparisonsEl = $('comparisons'), swapsEl = $('swaps'), elapsedEl = $('elapsed'), complexityEl = $('complexity');
const statusMsg = $('statusMessage'), infoCard = $('infoCard'), livePill = $('livePill'), confCanvas = $('confettiCanvas');
const historyBody = $('historyBody'), historyEmpty = $('historyEmpty'), historyTable = $('historyTable');
const customInputRow = $('customInputRow'), customArrayInput = $('customArrayInput'), applyCustomBtn = $('applyCustomBtn');
const soundBtn = $('soundBtn');

// ── 2. Themes System ───────────────────────────────────────────────────────
const themes = ['dark', 'cyberpunk', 'ocean', 'light'];
let currentTheme = localStorage.getItem('theme') || 'dark';

function setTheme(theme) {
  if (!themes.includes(theme)) theme = 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.theme === theme);
  });
  currentTheme = theme;
}

document.querySelectorAll('.theme-btn').forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.theme));
});
setTheme(currentTheme);

// ── 3. Audio System ────────────────────────────────────────────────────────
function initAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') audioCtx.resume();
}

function playTone(freq, type = 'sine', vol = 0.1, duration = 0.1) {
  if (!soundEnabled || !audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
  gain.gain.setValueAtTime(vol, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playCompareTone(val) { playTone(200 + (val * 5), 'sine', 0.05, 0.05); }
function playSwapTone(val) { playTone(300 + (val * 8), 'triangle', 0.1, 0.1); }
function playSortedTone(val) { playTone(400 + (val * 10), 'sine', 0.08, 0.15); }

soundBtn.addEventListener('click', () => {
  soundEnabled = !soundEnabled;
  soundBtn.setAttribute('aria-pressed', soundEnabled);
  soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
  if (soundEnabled) initAudio();
});

// ── 4. Algorithm Registry (8 Algorithms) ──────────────────────────────────
const ALGORITHMS = {
  bubble: { name: 'Bubble Sort', icon: '🫧', complexity: 'O(n²)', desc: 'Repeatedly steps through, swapping adjacent items.', progressive: true },
  insertion: { name: 'Insertion Sort', icon: '📥', complexity: 'O(n²)', desc: 'Builds sorted array one element at a time.', progressive: true },
  selection: { name: 'Selection Sort', icon: '🎯', complexity: 'O(n²)', desc: 'Repeatedly finds minimum from unsorted part.', progressive: true },
  merge: { name: 'Merge Sort', icon: '🔀', complexity: 'O(n log n)', desc: 'Divide and conquer approach (split, sort, merge).', progressive: true },
  quick: { name: 'Quick Sort', icon: '⚡', complexity: 'O(n log n)', desc: 'Picks a pivot, partitions array, and sorts sides.', progressive: true },
  heap: { name: 'Heap Sort', icon: '🌲', complexity: 'O(n log n)', desc: 'Builds max-heap and extracts maximum repeatedly.', progressive: true },
  counting: { name: 'Counting Sort', icon: '🧮', complexity: 'O(n+k)', desc: 'Counts element occurrences (integer arrays).', progressive: false },
  radix: { name: 'Radix Sort', icon: '📡', complexity: 'O(nk)', desc: 'Sorts by processing digits from least significant.', progressive: false }
};

// ── 5. Core Rendering & Utilities ──────────────────────────────────────────
const SPEED = { 1: 300, 2: 90, 3: 35, 4: 8, 5: 1 };
const getDelay = () => SPEED[speedEl.value] || 35;
const valToHue = v => Math.round(200 - (v / 100) * 190);
const getBar = i => document.getElementById(`bar-${i}`);

function renderBars(arr = array) {
  visualizer.innerHTML = '';
  arr.forEach((val, i) => {
    const b = document.createElement('div');
    b.className = 'bar'; b.id = `bar-${i}`; b.dataset.val = val;
    b.style.height = `${val}%`; b.style.setProperty('--hue', valToHue(val));
    visualizer.appendChild(b);
  });
}

function setBarClass(i, cls) {
  const b = getBar(i); if (!b) return;
  b.className = 'bar' + (cls ? ` ${cls}` : '');
}

async function wait() {
  if (getDelay() > 0 && !stepMode) await new Promise(r => setTimeout(r, getDelay()));
  else if (!stepMode) await new Promise(r => setTimeout(r, 0));
  
  while (isPaused && !stopRequested && !stepProceed) {
    await new Promise(r => setTimeout(r, 50));
  }
  if (stepProceed) stepProceed = false;
}

async function animSwap(i, j) {
  setBarClass(i, 'swapping'); setBarClass(j, 'swapping');
  playSwapTone(array[i]);
  await wait();
  const bi = getBar(i), bj = getBar(j);
  if (bi && bj) {
    let t = bi.style.height; bi.style.height = bj.style.height; bj.style.height = t;
    let tv = bi.dataset.val; bi.dataset.val = bj.dataset.val; bj.dataset.val = tv;
    bi.style.setProperty('--hue', valToHue(+bi.dataset.val));
    bj.style.setProperty('--hue', valToHue(+bj.dataset.val));
  }
  [array[i], array[j]] = [array[j], array[i]];
  swapCount++; updates();
  setBarClass(i, ''); setBarClass(j, '');
}

async function animCompare(i, j) {
  setBarClass(i, 'comparing'); setBarClass(j, 'comparing');
  playCompareTone(array[i] || 50);
  comparisons++; updates();
  await wait();
  setBarClass(i, ''); setBarClass(j, '');
}

async function animSet(i, val) {
  array[i] = val;
  const b = getBar(i);
  if (b) {
    b.style.height = `${val}%`; b.dataset.val = val;
    b.style.setProperty('--hue', valToHue(val));
  }
  setBarClass(i, 'swapping');
  playSwapTone(val);
  swapCount++; updates();
  await wait();
  setBarClass(i, '');
}

function updates() {
  comparisonsEl.textContent = comparisons.toLocaleString();
  swapsEl.textContent = swapCount.toLocaleString();
}

// ── 6. Algorithms ────────────────────────────────────────────────────────────

async function alg_bubble() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    let sw = false;
    for (let j = 0; j < n - i - 1; j++) {
      if (stopRequested) return;
      await animCompare(j, j + 1);
      if (array[j] > array[j + 1]) { await animSwap(j, j + 1); sw = true; }
    }
    setBarClass(n - i - 1, 'sorted'); playSortedTone(array[n - i - 1]);
    if (!sw) break;
  }
  for (let i = 0; i < n; i++) { setBarClass(i, 'sorted'); }
}

async function alg_insertion() {
  const n = array.length; setBarClass(0, 'sorted');
  for (let i = 1; i < n; i++) {
    if (stopRequested) return;
    let key = array[i], j = i - 1;
    await animCompare(i, j);
    while (j >= 0 && array[j] > key) {
      if (stopRequested) return;
      await animSet(j + 1, array[j]); j--;
      if (j >= 0) await animCompare(j + 1, j);
    }
    await animSet(j + 1, key);
    for (let k = 0; k <= i; k++) setBarClass(k, 'sorted');
    playSortedTone(key);
  }
}

async function alg_selection() {
  const n = array.length;
  for (let i = 0; i < n - 1; i++) {
    if (stopRequested) return;
    let min = i; setBarClass(i, 'pivot');
    for (let j = i + 1; j < n; j++) {
      if (stopRequested) return;
      await animCompare(j, min);
      if (array[j] < array[min]) { setBarClass(min, ''); min = j; setBarClass(min, 'pivot'); }
    }
    if (min !== i) await animSwap(i, min);
    setBarClass(min, ''); setBarClass(i, 'sorted'); playSortedTone(array[i]);
  }
  setBarClass(n - 1, 'sorted');
}

async function alg_merge() { await mergeHelper(0, array.length - 1); }
async function mergeHelper(l, r) {
  if (stopRequested || l >= r) return;
  const m = Math.floor((l + r) / 2);
  await mergeHelper(l, m); await mergeHelper(m + 1, r); await mergeRun(l, m, r);
}
async function mergeRun(l, m, r) {
  const L = array.slice(l, m + 1), R = array.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < L.length && j < R.length) {
    if (stopRequested) return;
    await animCompare(l + i, m + 1 + j);
    if (L[i] <= R[j]) { await animSet(k++, L[i++]); } else { await animSet(k++, R[j++]); }
  }
  while (i < L.length) { if (stopRequested) return; await animSet(k++, L[i++]); }
  while (j < R.length) { if (stopRequested) return; await animSet(k++, R[j++]); }
  for (let x = l; x <= r; x++) setBarClass(x, 'sorted');
}

async function alg_quick() { await quickHelper(0, array.length - 1); }
async function quickHelper(lo, hi) {
  if (stopRequested || lo >= hi) return;
  let pi = await quickPart(lo, hi);
  if (pi === null) return;
  setBarClass(pi, 'sorted'); playSortedTone(array[pi]);
  await quickHelper(lo, pi - 1); await quickHelper(pi + 1, hi);
}
async function quickPart(lo, hi) {
  let pivot = array[hi], i = lo - 1; setBarClass(hi, 'pivot');
  for (let j = lo; j < hi; j++) {
    if (stopRequested) return null;
    await animCompare(j, hi);
    if (array[j] <= pivot) { i++; await animSwap(i, j); }
  }
  setBarClass(hi, ''); await animSwap(i + 1, hi);
  return i + 1;
}

async function alg_heap() {
  const n = array.length;
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) { if (stopRequested) return; await heapify(n, i); }
  for (let i = n - 1; i > 0; i--) {
    if (stopRequested) return;
    await animSwap(0, i); setBarClass(i, 'sorted'); playSortedTone(array[i]);
    await heapify(i, 0);
  }
  setBarClass(0, 'sorted');
}
async function heapify(n, i) {
  let lg = i, l = 2 * i + 1, r = 2 * i + 2;
  if (l < n) { await animCompare(l, lg); if (array[l] > array[lg]) lg = l; }
  if (r < n) { await animCompare(r, lg); if (array[r] > array[lg]) lg = r; }
  if (lg !== i) { await animSwap(i, lg); if (!stopRequested) await heapify(n, lg); }
}

async function alg_counting() {
  const n = array.length;
  let max = Math.max(...array);
  let count = new Array(max + 1).fill(0), output = new Array(n);
  for (let i = 0; i < n; i++) { if (stopRequested) return; count[array[i]]++; await animCompare(i, i); }
  for (let i = 1; i <= max; i++) count[i] += count[i - 1];
  for (let i = n - 1; i >= 0; i--) { output[count[array[i]] - 1] = array[i]; count[array[i]]--; }
  for (let i = 0; i < n; i++) { if (stopRequested) return; await animSet(i, output[i]); setBarClass(i, 'sorted'); playSortedTone(array[i]); }
}

async function alg_radix() {
  const n = array.length, max = Math.max(...array);
  for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
    if (stopRequested) return;
    let output = new Array(n), count = new Array(10).fill(0);
    for (let i = 0; i < n; i++) { await animCompare(i, i); count[Math.floor(array[i] / exp) % 10]++; }
    for (let i = 1; i < 10; i++) count[i] += count[i - 1];
    for (let i = n - 1; i >= 0; i--) { output[count[Math.floor(array[i] / exp) % 10] - 1] = array[i]; count[Math.floor(array[i] / exp) % 10]--; }
    for (let i = 0; i < n; i++) await animSet(i, output[i]);
  }
  for (let i = 0; i < n; i++) setBarClass(i, 'sorted');
}

const ALGO_FNS = { bubble:alg_bubble, insertion:alg_insertion, selection:alg_selection, merge:alg_merge, quick:alg_quick, heap:alg_heap, counting:alg_counting, radix:alg_radix };

// ── 7. Core Logic & Events ─────────────────────────────────────────────────
function generateArray(preset = currentPreset) {
  if (isSorting) return;
  const n = parseInt(arraySizeEl.value);
  array = [];
  if (preset === 'custom') {
    const vals = customArrayInput.value.split(',').map(v=>parseInt(v.trim())).filter(v=>!isNaN(v));
    if(vals.length > 0) array = vals; else array = Array.from({length: n}, () => Math.floor(Math.random() * 95) + 5);
  } else if (preset === 'reversed') {
    array = Array.from({length: n}, (_, i) => Math.floor(100 - (i/n)*90));
  } else if (preset === 'nearly') {
    array = Array.from({length: n}, (_, i) => Math.floor(5 + (i/n)*90));
    for(let i=0; i<Math.max(1, n/10); i++) {
      let a=Math.floor(Math.random()*n), b=Math.floor(Math.random()*n);
      [array[a], array[b]] = [array[b], array[a]];
    }
  } else if (preset === 'few') {
    const vals = [25, 50, 75, 100];
    array = Array.from({length: n}, () => vals[Math.floor(Math.random()*vals.length)]);
  } else {
    array = Array.from({length: n}, () => Math.floor(Math.random() * 95) + 5);
  }
  originalArray = [...array];
  renderBars();
  comparisons = 0; swapCount = 0; updates(); elapsedEl.textContent = '0.00s';
  updateInfo();
}

function updateInfo() {
  const m = ALGORITHMS[currentAlgo];
  complexityEl.textContent = m.complexity;
  infoCard.innerHTML = `<div class="info-card-header"><span class="info-card-icon">${m.icon}</span><h2 class="info-card-title">${m.name}</h2></div><p class="info-card-desc">${m.desc}</p><div class="complexity-grid"><div class="complexity-item"><span class="complexity-label">Time</span><span class="complexity-val">${m.complexity}</span></div></div>`;
  document.getElementById('algoButtons').innerHTML = Object.entries(ALGORITHMS).map(([k,v])=>`<button class="algo-btn ${k===currentAlgo?'active':''}" data-algo="${k}">${v.icon} ${v.name}</button>`).join('');
  document.querySelectorAll('.algo-btn').forEach(b => b.addEventListener('click', e => { if(!isSorting) { currentAlgo = e.target.dataset.algo; updateInfo(); }}));
  
  const rc = document.getElementById('raceChallenger');
  if (rc) {
    Array.from(rc.options).forEach(opt => {
      opt.disabled = opt.value === currentAlgo;
    });
    if (rc.value === currentAlgo) {
      const firstAvailable = Array.from(rc.options).find(o => !o.disabled);
      if (firstAvailable) rc.value = firstAvailable.value;
    }
  }
}

async function runSort() {
  if (isSorting || array.length === 0) return;
  isSorting = true; stopRequested = false; isPaused = false; stepProceed = false;
  generateBtn.disabled = sortBtn.disabled = true; stopBtn.disabled = pauseBtn.disabled = false;
  startTime = performance.now();
  timerInterval = setInterval(() => { if(!isPaused) elapsedEl.textContent = ((performance.now() - startTime) / 1000).toFixed(2) + 's'; }, 50);
  
  await ALGO_FNS[currentAlgo]();
  
  clearInterval(timerInterval);
  isSorting = false; generateBtn.disabled = sortBtn.disabled = false; stopBtn.disabled = pauseBtn.disabled = true;
  if (!stopRequested) {
    sortHistory.unshift({ algo: ALGORITHMS[currentAlgo].name, preset: currentPreset, size: array.length, comps: comparisons, swaps: swapCount, time: elapsedEl.textContent });
    if(sortHistory.length > 10) sortHistory.pop();
    renderHistory();
  }
}

function renderHistory() {
  if (sortHistory.length === 0) { historyEmpty.style.display = 'block'; historyTable.style.display = 'none'; return; }
  historyEmpty.style.display = 'none'; historyTable.style.display = 'table';
  historyBody.innerHTML = sortHistory.map((h, i) => `<tr><td><span class="history-rank">${i+1}</span></td><td class="algo-name">${h.algo}</td><td>${h.preset}</td><td class="mono">${h.size}</td><td class="mono">${h.comps}</td><td class="mono">${h.swaps}</td><td>${h.time}</td></tr>`).join('');
}

// Events
generateBtn.addEventListener('click', () => generateArray());
sortBtn.addEventListener('click', runSort);
stopBtn.addEventListener('click', () => { stopRequested = true; isPaused = false; stepProceed = true; });
pauseBtn.addEventListener('click', () => { if(isSorting && !stepMode) { isPaused = !isPaused; pauseBtn.classList.toggle('paused', isPaused); }});
arraySizeEl.addEventListener('input', () => { arraySizeVal.textContent = arraySizeEl.value; if(!isSorting) generateArray(); });
speedEl.addEventListener('input', () => { speedVal.textContent = SPEED[speedEl.value] || 'Medium'; });
stepModeBtn.addEventListener('click', () => { stepMode = !stepMode; stepModeBtn.classList.toggle('active', stepMode); isPaused = stepMode; nextStepBtn.disabled = !stepMode; });
nextStepBtn.addEventListener('click', () => { stepProceed = true; });

document.querySelectorAll('.preset-btn').forEach(btn => btn.addEventListener('click', (e) => {
  if(isSorting) return;
  document.querySelectorAll('.preset-btn').forEach(b=>b.classList.remove('active'));
  e.target.classList.add('active'); currentPreset = e.target.dataset.preset;
  customInputRow.style.display = currentPreset === 'custom' ? 'flex' : 'none';
  if(currentPreset !== 'custom') generateArray();
}));

applyCustomBtn.addEventListener('click', () => { if(!isSorting) generateArray('custom'); });

exportCsvBtn.addEventListener('click', () => {
  if(sortHistory.length === 0) return;
  let csv = 'Rank,Algorithm,Preset,Size,Comparisons,Swaps/Writes,Time\n' + sortHistory.map((h,i) => `${i+1},${h.algo},${h.preset},${h.size},${h.comps},${h.swaps},${h.time}`).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'sort_history.csv'; a.click();
});

shareBtn.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('algo', currentAlgo); url.searchParams.set('preset', currentPreset);
  if(currentPreset === 'custom') url.searchParams.set('arr', array.join(','));
  navigator.clipboard.writeText(url.toString()).then(()=>alert('URL copied!'));
});

// ── 8. Race Mode ───────────────────────────────────────────────────────────
const raceToggle = $('raceToggle'), raceBody = $('raceBody'), raceChallenger = $('raceChallenger'), raceBtn = $('raceBtn'), raceResult = $('raceResult');
raceToggle.addEventListener('click', () => {
  const isOpen = raceBody.style.display === 'block';
  raceBody.style.display = isOpen ? 'none' : 'block';
  raceToggle.parentElement.classList.toggle('open', !isOpen);
});

Object.entries(ALGORITHMS).forEach(([k, v]) => {
  const opt = document.createElement('option');
  opt.value = k; opt.textContent = `${v.icon} ${v.name}`;
  raceChallenger.appendChild(opt);
});

async function runHeadlessSort(algoKey, arr) {
  let swaps = 0, comps = 0;
  const data = [...arr];
  const t0 = performance.now();
  
  const oldArray = array, oldCompare = window.animCompare, oldSwap = window.animSwap, oldSet = window.animSet, oldStop = stopRequested;
  array = data; stopRequested = false;
  window.animCompare = async (i,j) => { comps++; };
  window.animSwap = async (i,j) => { let t=array[i]; array[i]=array[j]; array[j]=t; swaps++; };
  window.animSet = async (i,v) => { array[i]=v; swaps++; };
  
  await ALGO_FNS[algoKey]();
  
  const t1 = performance.now();
  
  array = oldArray; window.animCompare = oldCompare; window.animSwap = oldSwap; window.animSet = oldSet; stopRequested = oldStop;
  return { time: t1 - t0, comps, swaps };
}

raceBtn.addEventListener('click', async () => {
  if (isSorting || array.length === 0) return;
  const p1Algo = currentAlgo;
  const p2Algo = raceChallenger.value;
  
  if (p1Algo === p2Algo) {
    raceResult.style.display = 'block';
    raceResult.innerHTML = '⚠️ <b>Please select a different algorithm to race against!</b>';
    return;
  }
  
  raceResult.style.display = 'block';
  raceResult.textContent = '🏎️ Racing...';
  
  const p1Res = await runHeadlessSort(p1Algo, originalArray);
  const p2Res = await runHeadlessSort(p2Algo, originalArray);
  
  let winner = p1Res.time <= p2Res.time ? p1Algo : p2Algo;
  let diff = Math.abs(p1Res.time - p2Res.time).toFixed(2);
  
  raceResult.innerHTML = `🏁 <b>Winner: ${ALGORITHMS[winner].name}</b><br>
  <small>${ALGORITHMS[p1Algo].name}: ${p1Res.time.toFixed(2)}ms | ${ALGORITHMS[p2Algo].name}: ${p2Res.time.toFixed(2)}ms<br>Difference: ${diff}ms</small>`;
});

exportCsvBtn.addEventListener('click', () => {
  if(sortHistory.length === 0) return;
  let csv = 'Rank,Algorithm,Preset,Size,Comparisons,Swaps/Writes,Time\n' + sortHistory.map((h,i) => `${i+1},${h.algo},${h.preset},${h.size},${h.comps},${h.swaps},${h.time}`).join('\n');
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'sort_history.csv'; a.click();
});

shareBtn.addEventListener('click', () => {
  const url = new URL(window.location.href);
  url.searchParams.set('algo', currentAlgo); url.searchParams.set('preset', currentPreset);
  if(currentPreset === 'custom') url.searchParams.set('arr', originalArray.join(','));
  navigator.clipboard.writeText(url.toString()).then(()=>alert('URL copied!'));
});

const params = new URLSearchParams(window.location.search);
if(params.has('algo') && ALGORITHMS[params.get('algo')]) currentAlgo = params.get('algo');
if(params.has('preset')) {
  currentPreset = params.get('preset');
  document.querySelectorAll('.preset-btn').forEach(b=>{ b.classList.toggle('active', b.dataset.preset === currentPreset); });
  if(currentPreset === 'custom' && params.has('arr')) {
    customArrayInput.value = params.get('arr'); customInputRow.style.display = 'flex';
  }
}
updateInfo(); generateArray(); renderHistory();
