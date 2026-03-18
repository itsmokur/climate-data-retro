import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics, isSupported as analyticsSupported } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, ref, set, update, onValue, serverTimestamp, onDisconnect } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

console.log('Test is running')
const firebaseConfig = {
    apiKey: "AIzaSyDaQWhQ6s0dZYxMjbmBBsdZ5fLjSqC_qQY",
    authDomain: "climate-data-retro.firebaseapp.com",
    databaseURL: "https://climate-data-retro-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "climate-data-retro",
    storageBucket: "climate-data-retro.firebasestorage.app",
    messagingSenderId: "938718488174",
    appId: "1:938718488174:web:d73ca62395e302c900e87f",
    measurementId: "G-WM0NN6VJCF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);
try { if (await analyticsSupported()) getAnalytics(app); } catch (_) { }


// ============================================================
// STATE
// ============================================================
const COLUMNS = [
    { id: 'hifi', title: '🙌 Hi Five', dotColor: '#22c55e' },
    { id: 'complaints', title: '😬 Complaints', dotColor: '#ef4444' },
    { id: 'ideas', title: '💡 Ideas', dotColor: '#6366f1' },
    { id: 'shoutouts', title: '🏆 Shout Outs', dotColor: '#f59e0b' },
];

let state = {
    cards: {}, groups: {},
    title: 'Sprint Retrospective #1',
    discussed: {}, activeDiscuss: null,
    actions: {}
};

// Phase is local-only — each person controls their own view
let localPhase = 0;

let currentUser = '';
let boardId = '';
let addingTo = null;

let boardStateRef = null;
let timerRef = null;
let presenceMeRef = null;
let presenceListRef = null;

const clientId = (crypto?.randomUUID?.() || (Date.now() + '_' + Math.random().toString(36).slice(2, 10)));

// ============================================================
// HELPERS
// ============================================================
function setSyncStatus(mode) {
    const dot = document.getElementById('syncDot');
    const label = document.getElementById('syncLabel');
    if (!dot || !label) return;
    if (mode === 'syncing') { dot.classList.add('syncing'); label.textContent = 'Syncing…'; }
    else if (mode === 'offline') { dot.classList.add('syncing'); label.textContent = 'Offline'; }
    else { dot.classList.remove('syncing'); label.textContent = 'Live'; }
}

function toast(msg, duration = 2500) {
    const container = document.getElementById('toastContainer');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => el.remove(), duration);
}
window.toast = toast;

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// ============================================================
// BOARD ID
// ============================================================
function initBoardId() {
    if (window.location.hash && window.location.hash.length > 2) boardId = window.location.hash.slice(1);
    else { boardId = Math.random().toString(36).slice(2, 10); window.location.hash = boardId; }
    boardStateRef = ref(db, `boards/${boardId}/state`);
    timerRef = ref(db, `boards/${boardId}/timer`);
    presenceMeRef = ref(db, `presence/${boardId}/${clientId}`);
    presenceListRef = ref(db, `presence/${boardId}`);
}

// ============================================================
// PRESENCE
// ============================================================
function initPresence() {
    set(presenceMeRef, { name: currentUser, online: true, joinedAt: serverTimestamp() });
    onDisconnect(presenceMeRef).remove();
    onValue(presenceListRef, (snap) => {
        const val = snap.val() || {};
        const users = Object.values(val).filter(u => u && u.online);
        const label = document.getElementById('presenceLabel');
        if (label) {
            label.textContent = `${users.length} online`;
            label.title = users.map(u => u.name).filter(Boolean).join(', ');
        }
    });
}

// ============================================================
// BOARD STATE SYNC
// ============================================================
function subscribeBoardState() {
    setSyncStatus('syncing');
    onValue(boardStateRef, async (snap) => {
        if (snap.exists()) {
            const remote = snap.val() || {};
            state = {
                cards: remote.cards || {},
                groups: remote.groups || {},
                title: remote.title || 'Sprint Retrospective #1',
                discussed: remote.discussed || {},
                activeDiscuss: remote.activeDiscuss || null,
                actions: remote.actions || {},
            };
        } else {
            await set(boardStateRef, state);
        }
        setSyncStatus('live');
        render();
    }, (err) => {
        console.error(err);
        setSyncStatus('offline');
        toast('Connection error — check Firebase rules.', 5000);
    });
}

let saveDebounce = null;
function saveState(immediate = true) {
    if (!boardStateRef) return;
    setSyncStatus('syncing');
    if (!immediate) {
        clearTimeout(saveDebounce);
        saveDebounce = setTimeout(() => saveState(true), 250);
        return;
    }
    set(boardStateRef, state)
        .then(() => setSyncStatus('live'))
        .catch((e) => { console.error(e); setSyncStatus('offline'); toast('Save failed.', 4000); });
}

// ============================================================
// SHARED TIMER
// ============================================================
let timerModel = { durationSec: 5 * 60, running: false, endsAtMs: null, remainingSec: 5 * 60 };

function subscribeTimer() {
    onValue(timerRef, async (snap) => {
        if (snap.exists()) timerModel = snap.val() || timerModel;
        else await set(timerRef, timerModel);
        updateTimerDisplayFromModel();
    }, (err) => { console.error(err); });
}

function nowMs() { return Date.now(); }

function computeRemainingSec() {
    if (timerModel.running && timerModel.endsAtMs) {
        return Math.max(0, Math.ceil((timerModel.endsAtMs - nowMs()) / 1000));
    }
    return Math.max(0, timerModel.remainingSec ?? timerModel.durationSec ?? 0);
}

function formatTime(s) {
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function updateTimerDisplayFromModel() {
    const remaining = computeRemainingSec();
    const el = document.getElementById('timerDisplay');
    const btn = document.getElementById('timerStartBtn');
    if (!el) return;
    el.textContent = formatTime(remaining);
    el.classList.toggle('warning', remaining <= 30 && timerModel.running);
    if (btn) { btn.textContent = timerModel.running ? '⏸' : '▶'; btn.classList.toggle('running', timerModel.running); }
    if (timerModel.running && remaining <= 0) {
        update(timerRef, { running: false, remainingSec: 0, endsAtMs: null }).catch(() => { });
        toast('⏰ Time is up!', 4000);
    }
}

setInterval(() => { if (timerRef) updateTimerDisplayFromModel(); }, 1000);

window.setTimer = function (minutes) {
    const dur = Math.max(1, minutes) * 60;
    update(timerRef, { durationSec: dur, running: false, remainingSec: dur, endsAtMs: null }).catch(console.error);
};
window.toggleTimer = function () {
    if (!timerModel.running) {
        const remaining = computeRemainingSec();
        update(timerRef, { running: true, endsAtMs: nowMs() + remaining * 1000, remainingSec: remaining }).catch(console.error);
    } else {
        update(timerRef, { running: false, endsAtMs: null, remainingSec: computeRemainingSec() }).catch(console.error);
    }
};
window.resetTimer = function () {
    const dur = timerModel.durationSec ?? (5 * 60);
    update(timerRef, { running: false, remainingSec: dur, endsAtMs: null }).catch(console.error);
};

// ============================================================
// RENDER
// ============================================================
function render() {
    const board = document.getElementById('board');
    board.innerHTML = '';
    board.style.display = '';
    board.style.gridTemplateColumns = '';

    if (localPhase === 3) renderActionsView(board);
    else if (localPhase === 2) renderDiscussView(board);
    else renderBoardView(board);

    document.querySelectorAll('.phase-btn').forEach((btn, i) => btn.classList.toggle('active', i === localPhase));
    document.getElementById('retroTitle').value = state.title || '';
}

// ============================================================
// BOARD VIEW
// ============================================================
function renderBoardView(board) {
    board.style.display = 'grid';
    board.style.gridTemplateColumns = 'repeat(4, 1fr)';

    COLUMNS.forEach(col => {
        const cards = Object.values(state.cards || {}).filter(c => c.col === col.id).sort((a, b) => (b.ts || 0) - (a.ts || 0));
        const groupedMap = {};
        cards.forEach(c => { if (c.groupId) { if (!groupedMap[c.groupId]) groupedMap[c.groupId] = []; groupedMap[c.groupId].push(c); } });

        const renderedIds = new Set();
        const contentParts = [];
        cards.forEach(c => {
            if (renderedIds.has(c.id)) return;
            if (c.groupId && groupedMap[c.groupId]) {
                groupedMap[c.groupId].forEach(gc => renderedIds.add(gc.id));
                contentParts.push(renderGroup(c.groupId, groupedMap[c.groupId]));
            } else {
                renderedIds.add(c.id);
                contentParts.push(renderCard(c, 0));
            }
        });

        const colEl = document.createElement('div');
        colEl.className = 'column';
        colEl.dataset.col = col.id;
        colEl.addEventListener('dragover', e => { e.preventDefault(); colEl.querySelector('.column-body').classList.add('drag-over'); });
        colEl.addEventListener('dragleave', () => colEl.querySelector('.column-body').classList.remove('drag-over'));
        colEl.addEventListener('drop', e => {
            e.preventDefault();
            colEl.querySelector('.column-body').classList.remove('drag-over');
            const cardId = e.dataTransfer.getData('cardId');
            if (cardId && state.cards[cardId]) { state.cards[cardId].col = col.id; saveState(true); render(); }
        });

        colEl.innerHTML = `
    <div class="column-header">
    <div class="col-dot" style="background:${col.dotColor}"></div>
    <div class="col-title">${col.title}</div>
    <div class="col-count">${cards.length}</div>
    </div>
    <div class="column-body" id="body-${col.id}">
    ${cards.length === 0 ? `<div class="empty-card">No cards yet.<br>Add the first one! 👇</div>` : ''}
    ${contentParts.join('')}
    <div class="add-card-area" id="addArea-${col.id}" style="display:${addingTo === col.id ? 'flex' : 'none'};flex-direction:column;gap:8px">
        <textarea class="add-card-textarea" id="textarea-${col.id}" placeholder="Share your thoughts..." rows="3"></textarea>
        <div class="add-card-actions">
        <button class="btn-ghost" onclick="cancelAdd('${col.id}')">Cancel</button>
        <button class="btn-primary" onclick="addCard('${col.id}')">Add</button>
        </div>
    </div>
    <button class="add-card-trigger" onclick="showAdd('${col.id}')">
        <span style="font-size:16px">+</span> Add card
    </button>
    </div>`;
        board.appendChild(colEl);
    });

    document.querySelectorAll('.card[data-id]').forEach(el => {
        el.addEventListener('dragstart', e => { e.dataTransfer.setData('cardId', el.dataset.id); el.classList.add('dragging'); });
        el.addEventListener('dragend', () => el.classList.remove('dragging'));
        el.addEventListener('dragover', e => e.preventDefault());
        el.addEventListener('drop', e => {
            e.preventDefault(); e.stopPropagation();
            const src = e.dataTransfer.getData('cardId');
            const tgt = el.dataset.id;
            if (src && tgt && src !== tgt) groupCards(src, tgt);
        });
    });
}

function renderGroup(groupId, cardsInGroup) {
    const group = state.groups?.[groupId];
    const title = group?.title || 'Grouped cards';
    return `
<div class="group-card" style="background:var(--bg);border:1px dashed var(--border);border-radius:8px;padding:12px;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:10px;">
    <input value="${escHtml(title)}" onchange="updateGroupTitle('${groupId}', this.value)"
        style="width:100%;border:none;outline:none;background:transparent;font-weight:700;font-size:13px;color:var(--text);"/>
    <span class="rank-badge">${cardsInGroup.length} cards</span>
    </div>
    <div style="display:flex;flex-direction:column;gap:8px;">
    ${cardsInGroup.map((c, i) => `
        <div style="background:white;border:1px solid var(--border);border-radius:8px;padding:10px;">
        ${renderCard(c, i, true)}
        <div style="margin-top:6px;display:flex;justify-content:flex-end;">
            <button class="btn-ghost" style="font-size:11px;padding:4px 8px;" onclick="ungroupCard('${c.id}')">Ungroup</button>
        </div>
        </div>`).join('')}
    </div>
</div>`;
}

function renderCard(c, rank, compact = false) {
    const votes = Array.isArray(c.votes) ? c.votes : [];
    const myVote = votes.includes(clientId);
    const voteCount = votes.length;
    const uid = auth.currentUser?.uid || null;
    const isOwner = (c.ownerUid && uid) ? (c.ownerUid === uid) : (c.author === currentUser);
    const showRank = localPhase === 2 && voteCount > 0;
    const isTop = showRank && rank === 0;
    const cardStyle = compact ? 'style="margin:0;box-shadow:none;"' : '';
    return `<div class="card" ${cardStyle} draggable="true" data-id="${c.id}">
${showRank ? `<div style="margin-bottom:6px"><span class="rank-badge ${isTop ? 'top' : ''}">${isTop ? '🥇' : ''} ${voteCount} vote${voteCount !== 1 ? 's' : ''}</span></div>` : ''}
<div class="card-text">${escHtml(c.text)}</div>
<div class="card-footer">
    <span></span>
    <div style="display:flex;gap:4px;align-items:center">
    ${localPhase >= 1 ? `<button class="vote-btn ${myVote ? 'voted' : ''}" onclick="toggleVote('${c.id}')">${myVote ? '❤️' : '🤍'} ${voteCount}</button>` : ''}
    ${isOwner ? `<div class="card-actions"><button class="card-action-btn" title="Delete" onclick="deleteCard('${c.id}')">✕</button></div>` : ''}
    </div>
</div>
</div>`;
}

// ============================================================
// DISCUSS VIEW
// ============================================================
function getVoteCount(c) {
    if (!c.votes) return 0;
    if (Array.isArray(c.votes)) return c.votes.length;
    return 0;
}

function renderDiscussView(board) {
    board.style.display = 'block';
    const allCards = Object.values(state.cards || {}).sort((a, b) => getVoteCount(b) - getVoteCount(a));
    const discussed = state.discussed || {};
    const doneCount = Object.keys(discussed).filter(id => discussed[id] && state.cards[id]).length;
    const totalCount = allCards.length;
    const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

    let sidebarItems = '';
    COLUMNS.forEach(col => {
        const colCards = allCards.filter(c => c.col === col.id);
        if (!colCards.length) return;
        sidebarItems += `<div class="discuss-section-label">${col.title}</div>`;
        colCards.forEach(c => {
            const votes = getVoteCount(c);
            const done = discussed[c.id];
            const isActive = state.activeDiscuss === c.id;
            const globalRank = allCards.indexOf(c);
            sidebarItems += `
    <div class="discuss-item ${done ? 'done' : ''} ${isActive ? 'active' : ''}" onclick="setActiveDiscuss('${c.id}')">
        <div class="discuss-rank-num ${globalRank === 0 ? 'top' : ''}">${globalRank + 1}</div>
        <div class="discuss-item-body">
        <div class="discuss-item-text">${escHtml(c.text)}</div>
        <div class="discuss-item-meta">${votes > 0 ? `<span class="discuss-vote-pill">❤️ ${votes}</span>` : ''}</div>
        </div>
        <div class="discuss-check" onclick="event.stopPropagation();toggleDiscussed('${c.id}')">${done ? '✓' : ''}</div>
    </div>`;
        });
    });

    let boardColsHtml = '';
    COLUMNS.forEach(col => {
        const cards = allCards.filter(c => c.col === col.id);
        boardColsHtml += `
    <div class="column">
    <div class="column-header">
        <div class="col-dot" style="background:${col.dotColor}"></div>
        <div class="col-title">${col.title}</div>
        <div class="col-count">${cards.length}</div>
    </div>
    <div class="column-body">
        ${cards.length === 0 ? '<div class="empty-card">No cards</div>' : ''}
        ${cards.map((c, i) => renderCard(c, i)).join('')}
    </div>
    </div>`;
    });

    board.innerHTML = `
<div class="discuss-layout">
    <div class="discuss-sidebar">
    <div class="discuss-sidebar-header">
        <h3>💬 Discussion Queue</h3>
        <span class="discuss-progress">${doneCount}/${totalCount}</span>
    </div>
    <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
    <div class="discuss-list">${sidebarItems || '<div style="padding:16px;font-size:12px;color:var(--muted)">No cards yet.</div>'}</div>
    </div>
    <div class="discuss-board">${boardColsHtml}</div>
</div>`;

    if (state.activeDiscuss) {
        const activeEl = board.querySelector(`.card[data-id="${state.activeDiscuss}"]`);
        if (activeEl) { activeEl.style.boxShadow = '0 0 0 2px var(--accent), 0 4px 16px rgba(0,0,0,0.12)'; activeEl.style.transform = 'translateY(-2px)'; }
    }
}

// ============================================================
// ACTIONS VIEW
// ============================================================
function renderActionsView(board) {
    board.style.display = 'block';
    const actions = Object.values(state.actions || {}).sort((a, b) => (a.ts || 0) - (b.ts || 0));
    const doneCount = actions.filter(a => a.done).length;
    const today = new Date().toISOString().split('T')[0];

    const actionItems = actions.length === 0
        ? `<div class="actions-empty"><div class="emoji">✅</div><p>No action items yet.<br>Add one below to track what needs to happen next sprint.</p></div>`
        : actions.map(a => {
            const isOverdue = a.dueDate && !a.done && a.dueDate < today;
            return `
        <div class="action-item ${a.done ? 'done-item' : ''}">
        <div class="action-check" onclick="toggleAction('${a.id}')">${a.done ? '✓' : ''}</div>
        <div class="action-body">
            <div class="action-text">${escHtml(a.text)}</div>
            <div class="action-meta">
            ${a.assignee ? `<span class="action-assignee">👤 ${escHtml(a.assignee)}</span>` : ''}
            ${a.dueDate ? `<span class="action-due ${isOverdue ? 'overdue' : ''}">📅 ${a.dueDate}${isOverdue ? ' · overdue' : ''}</span>` : ''}
            </div>
        </div>
        <button class="action-delete-btn" onclick="deleteAction('${a.id}')">✕</button>
        </div>`;
        }).join('');

    // Discussion queue sidebar (same as discuss view but read-only)
    const allCards = Object.values(state.cards || {}).sort((a, b) => getVoteCount(b) - getVoteCount(a));
    const discussed = state.discussed || {};
    const discussedCount = Object.keys(discussed).filter(id => discussed[id] && state.cards[id]).length;
    const totalCount = allCards.length;
    const pct = totalCount > 0 ? Math.round((discussedCount / totalCount) * 100) : 0;

    let sidebarItems = '';
    COLUMNS.forEach(col => {
        const colCards = allCards.filter(c => c.col === col.id);
        if (!colCards.length) return;
        sidebarItems += `<div class="discuss-section-label">${col.title}</div>`;
        colCards.forEach((c, i) => {
            const votes = getVoteCount(c);
            const done = discussed[c.id];
            const globalRank = allCards.indexOf(c);
            sidebarItems += `
    <div class="discuss-item ${done ? 'done' : ''}" style="cursor:default">
        <div class="discuss-rank-num ${globalRank === 0 ? 'top' : ''}">${globalRank + 1}</div>
        <div class="discuss-item-body">
        <div class="discuss-item-text">${escHtml(c.text)}</div>
        <div class="discuss-item-meta">
            ${votes > 0 ? `<span class="discuss-vote-pill">❤️ ${votes}</span>` : ''}
            ${done ? `<span style="font-size:10px;color:var(--green);font-weight:600">✓ discussed</span>` : ''}
        </div>
        </div>
    </div>`;
        });
    });

    board.innerHTML = `
<div class="discuss-layout">
    <div class="discuss-sidebar">
    <div class="discuss-sidebar-header">
        <h3>💬 Discussion Summary</h3>
        <span class="discuss-progress">${discussedCount}/${totalCount}</span>
    </div>
    <div class="progress-bar-wrap"><div class="progress-bar-fill" style="width:${pct}%"></div></div>
    <div class="discuss-list">${sidebarItems || '<div style="padding:16px;font-size:12px;color:var(--muted)">No cards discussed yet.</div>'}</div>
    </div>
    <div style="flex:1;min-width:0">
    <div class="actions-header" style="margin-bottom:20px">
        <div>
        <h2>✅ Action Items</h2>
        <p>${doneCount} of ${actions.length} completed</p>
        </div>
    </div>
    <div class="action-list">${actionItems}</div>
    <div class="add-action-form">
        <textarea id="actionText" placeholder="What needs to happen? e.g. 'Set up weekly sync with Igor'" rows="2"></textarea>
        <div class="add-action-fields">
        <input id="actionAssignee" placeholder="👤 Assignee (optional)" />
        <input id="actionDue" type="date" title="Due date (optional)" />
        </div>
        <div class="add-action-btns">
        <button class="btn-primary" onclick="addAction()">+ Add Action</button>
        </div>
    </div>
    </div>
</div>`;
}

// ============================================================
// CARD ACTIONS
// ============================================================
window.showAdd = function (colId) {
    addingTo = colId; render();
    setTimeout(() => { const ta = document.getElementById('textarea-' + colId); if (ta) ta.focus(); }, 50);
};
window.cancelAdd = function () { addingTo = null; render(); };

window.addCard = function (colId) {
    const ta = document.getElementById('textarea-' + colId);
    if (!ta) return;
    const text = ta.value.trim();
    if (!text) return;
    const id = Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    const uid = auth.currentUser?.uid || null;
    state.cards = state.cards || {};
    state.cards[id] = { id, text, author: currentUser, ownerUid: uid, col: colId, groupId: null, votes: [], ts: Date.now() };
    saveState(true); addingTo = null; render(); toast('Card added!');
};

window.deleteCard = function (id) {
    const uid = auth.currentUser?.uid || null;
    if (!confirm('Delete this card?')) return;
    if (!state.cards?.[id]) return;
    const card = state.cards[id];
    const isOwner = (card.ownerUid && uid) ? (card.ownerUid === uid) : (card.author === currentUser);
    if (!isOwner) { toast('You can only delete your own cards.'); return; }
    delete state.cards[id];
    saveState(true); render();
};

window.toggleVote = function (id) {
    if (!state.cards?.[id]) return;
    let votes = state.cards[id].votes;
    // normalize to array
    if (!votes || typeof votes === 'object' && !Array.isArray(votes)) votes = [];
    const idx = votes.indexOf(clientId);
    if (idx === -1) votes.push(clientId); else votes.splice(idx, 1);
    state.cards[id].votes = votes;
    saveState(true); render();
};

window.toggleDiscussed = function (id) {
    state.discussed = state.discussed || {};
    state.discussed[id] = !state.discussed[id];
    saveState(true); render();
};

window.setActiveDiscuss = function (id) {
    state.activeDiscuss = state.activeDiscuss === id ? null : id;
    saveState(true); render();
    setTimeout(() => { const el = document.querySelector(`.card[data-id="${id}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
};

// ============================================================
// ACTION ITEM FUNCTIONS
// ============================================================
window.addAction = function () {
    const text = document.getElementById('actionText')?.value.trim();
    if (!text) { toast('Please write an action item first.'); return; }
    const assignee = document.getElementById('actionAssignee')?.value.trim() || '';
    const dueDate = document.getElementById('actionDue')?.value || '';
    const id = 'a_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
    state.actions = state.actions || {};
    state.actions[id] = { id, text, assignee, dueDate, done: false, createdBy: currentUser, ts: Date.now() };
    saveState(true); render(); toast('Action item added!');
};

window.toggleAction = function (id) {
    if (!state.actions?.[id]) return;
    state.actions[id].done = !state.actions[id].done;
    saveState(true); render();
};

window.deleteAction = function (id) {
    if (!confirm('Delete this action item?')) return;
    if (!state.actions?.[id]) return;
    delete state.actions[id];
    saveState(true); render();
};

// ============================================================
// GROUPING
// ============================================================
window.groupCards = function (sourceCardId, targetCardId) {
    if (!state.cards[sourceCardId] || !state.cards[targetCardId]) return;
    if (sourceCardId === targetCardId) return;
    if (!state.groups) state.groups = {};
    const source = state.cards[sourceCardId];
    const target = state.cards[targetCardId];
    if (source.col !== target.col) return;
    let groupId = target.groupId || source.groupId;
    if (!groupId) { groupId = 'g_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6); state.groups[groupId] = { id: groupId, title: 'Grouped cards' }; }
    source.groupId = groupId; target.groupId = groupId;
    saveState(true); render(); toast('Cards grouped');
};

window.ungroupCard = function (cardId) {
    if (!state.cards[cardId]) return;
    const groupId = state.cards[cardId].groupId;
    if (!groupId) return;
    state.cards[cardId].groupId = null;
    const remaining = Object.values(state.cards).filter(c => c.groupId === groupId);
    if (remaining.length <= 1) { remaining.forEach(c => c.groupId = null); if (state.groups?.[groupId]) delete state.groups[groupId]; }
    saveState(true); render();
};

window.updateGroupTitle = function (groupId, title) {
    if (!state.groups) state.groups = {};
    if (!state.groups[groupId]) return;
    state.groups[groupId].title = title.trim() || 'Grouped cards';
    saveState(true);
};

// ============================================================
// PHASE
// ============================================================
window.setPhase = function (p) {
    localPhase = p; render();
    const labels = ['Reflect phase', 'Voting phase', 'Discussion phase', 'Actions phase'];
    const el = document.getElementById('timerPhaseLabel');
    if (el) el.textContent = labels[p];
};

// ============================================================
// SHARE & TITLE
// ============================================================
window.openShare = function () { document.getElementById('shareUrlDisplay').textContent = window.location.href; document.getElementById('shareModal').style.display = 'flex'; };
window.closeShare = function () { document.getElementById('shareModal').style.display = 'none'; };
window.copyShareUrl = async function () { await navigator.clipboard.writeText(window.location.href); toast('Link copied! 🎉'); closeShare(); };

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('retroTitle').addEventListener('input', e => { state.title = e.target.value; saveState(false); });
});

// INIT
initBoardId();
setSyncStatus('live');

document.getElementById('joinBtn').addEventListener('click', async () => {
    const name = document.getElementById('welcomeNameInput').value.trim();
    if (!name) return;
    await signInAnonymously(auth);
    currentUser = name;
    document.getElementById('userAvatarEl').textContent = name[0].toUpperCase();
    document.getElementById('welcomeModal').style.display = 'none';
    initPresence();
    subscribeBoardState();
    subscribeTimer();
});

document.getElementById('welcomeNameInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('joinBtn').click();
});