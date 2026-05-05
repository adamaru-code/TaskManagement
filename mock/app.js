'use strict';

// ===== データ管理 =====

const STORAGE_KEY = 'taskmanager_tasks';

const PRIORITY_LABEL = { high: '🔴 高', medium: '🟡 中', low: '🟢 低' };
const PRIORITY_CLASS = { high: 'high', medium: 'medium', low: 'low' };

const SAMPLE_TASKS = [
  { id: 'sample-1', title: '要件定義書のレビュー', description: '画面設計のフィードバックをまとめる', priority: 'high',   status: 'todo',        dueDate: '2026-05-10' },
  { id: 'sample-2', title: 'モックアップ作成',     description: 'HTML/CSS/JS でプロトタイプを実装する', priority: 'medium', status: 'in-progress', dueDate: '2026-05-05' },
  { id: 'sample-3', title: 'GitHubリポジトリ作成', description: '',                                    priority: 'low',    status: 'done',        dueDate: null },
];

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

let tasks = loadTasks() || [...SAMPLE_TASKS];

function generateId() {
  return `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ===== ソート（純関数） =====

const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 };

function sortedTasks(list, sortKey) {
  if (!sortKey) return list;
  return [...list].sort((a, b) => {
    if (sortKey === 'priority') {
      return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
    }
    if (sortKey === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    }
    return 0;
  });
}

// ===== ボード描画 =====

function renderBoard() {
  ['todo', 'in-progress', 'done'].forEach(status => {
    const container = document.getElementById(`cards-${status}`);
    const count = document.getElementById(`count-${status}`);
    const filtered = tasks.filter(t => t.status === status);
    count.textContent = filtered.length;
    container.innerHTML = '';
    filtered.forEach(task => container.appendChild(createCardEl(task)));
  });
}

function createCardEl(task) {
  const card = document.createElement('div');
  card.className = `card card--${PRIORITY_CLASS[task.priority]}`;
  card.dataset.id = task.id;
  card.draggable = true;

  const titleEl = document.createElement('div');
  titleEl.className = 'card__title';
  titleEl.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'card__meta';

  const badges = document.createElement('div');
  badges.className = 'card__badges';

  const prioBadge = document.createElement('span');
  prioBadge.className = `badge badge--${PRIORITY_CLASS[task.priority]}`;
  prioBadge.textContent = PRIORITY_LABEL[task.priority];
  badges.appendChild(prioBadge);

  if (task.dueDate) {
    const dueBadge = document.createElement('span');
    const today = new Date().toISOString().split('T')[0];
    dueBadge.className = `badge ${task.dueDate < today && task.status !== 'done' ? 'badge--overdue' : 'badge--due'}`;
    dueBadge.textContent = `📅 ${task.dueDate}`;
    badges.appendChild(dueBadge);
  }

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'card__delete';
  deleteBtn.textContent = '🗑';
  deleteBtn.title = '削除';
  deleteBtn.addEventListener('click', e => {
    e.stopPropagation();
    deleteTask(task.id);
  });

  meta.appendChild(badges);
  meta.appendChild(deleteBtn);

  card.appendChild(titleEl);
  card.appendChild(meta);

  card.addEventListener('click', () => openEditModal(task.id));
  card.addEventListener('dragstart', onDragStart);
  card.addEventListener('dragend', onDragEnd);

  return card;
}

// ===== ドラッグ＆ドロップ =====

let draggedId = null;

function onDragStart(e) {
  draggedId = e.currentTarget.dataset.id;
  e.currentTarget.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

function onDragEnd(e) {
  e.currentTarget.classList.remove('dragging');
  removePlaceholder();
}

function getDropIndex(container, mouseY) {
  const cards = [...container.querySelectorAll('.card:not(.dragging)')];
  for (let i = 0; i < cards.length; i++) {
    const rect = cards[i].getBoundingClientRect();
    if (mouseY < rect.top + rect.height / 2) return i;
  }
  return cards.length;
}

function removePlaceholder() {
  document.querySelectorAll('.drop-placeholder').forEach(el => el.remove());
}

function showPlaceholder(container, index) {
  removePlaceholder();
  const placeholder = document.createElement('div');
  placeholder.className = 'drop-placeholder';
  const cards = [...container.querySelectorAll('.card:not(.dragging)')];
  if (index >= cards.length) {
    container.appendChild(placeholder);
  } else {
    container.insertBefore(placeholder, cards[index]);
  }
}

function moveTaskTo(taskId, targetStatus, dropIndexInColumn) {
  const dragged = tasks.find(t => t.id === taskId);
  if (!dragged) return;
  dragged.status = targetStatus;

  const others = tasks.filter(t => t.id !== taskId);
  const colTasks = others.filter(t => t.status === targetStatus);
  const insertBefore = colTasks[dropIndexInColumn];
  const globalIdx = insertBefore ? others.indexOf(insertBefore) : others.length;

  others.splice(globalIdx, 0, dragged);
  tasks = others;
  saveTasks();
  renderBoard();
}

document.querySelectorAll('.column').forEach(col => {
  const container = col.querySelector('.column__cards');

  col.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const index = getDropIndex(container, e.clientY);
    showPlaceholder(container, index);
  });

  col.addEventListener('dragleave', e => {
    if (!col.contains(e.relatedTarget)) {
      removePlaceholder();
    }
  });

  col.addEventListener('drop', e => {
    e.preventDefault();
    const index = getDropIndex(container, e.clientY);
    removePlaceholder();
    const newStatus = col.dataset.status;
    if (draggedId) {
      moveTaskTo(draggedId, newStatus, index);
    }
    draggedId = null;
  });
});

// ===== タスク CRUD =====

function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderBoard();
}

// ===== 作成モーダル =====

const createModal  = document.getElementById('createModal');
const overlay      = document.getElementById('overlay');

function openCreateModal() {
  document.getElementById('createTitle').value    = '';
  document.getElementById('createDesc').value     = '';
  document.getElementById('createPriority').value = '';
  document.getElementById('createDueDate').value  = '';
  clearErrors('create');
  showModal(createModal);
}

function closeCreateModal() {
  hideModal(createModal);
}

document.getElementById('openCreateModal').addEventListener('click', openCreateModal);
document.getElementById('closeCreateModal').addEventListener('click', closeCreateModal);
document.getElementById('cancelCreate').addEventListener('click', closeCreateModal);

document.getElementById('saveCreate').addEventListener('click', () => {
  const title    = document.getElementById('createTitle').value.trim();
  const priority = document.getElementById('createPriority').value;
  const desc     = document.getElementById('createDesc').value.trim();
  const dueDate  = document.getElementById('createDueDate').value;

  if (!validateForm(title, priority, 'create')) return;

  tasks.push({ id: generateId(), title, description: desc, priority, status: 'todo', dueDate: dueDate || null });
  saveTasks();
  renderBoard();
  closeCreateModal();
});

// ===== 編集モーダル =====

const editModal = document.getElementById('editModal');

function openEditModal(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  document.getElementById('editTaskId').value     = task.id;
  document.getElementById('editTitle').value      = task.title;
  document.getElementById('editDesc').value       = task.description;
  document.getElementById('editPriority').value   = task.priority;
  document.getElementById('editDueDate').value    = task.dueDate || '';
  clearErrors('edit');
  showModal(editModal);
}

function closeEditModal() {
  hideModal(editModal);
}

document.getElementById('closeEditModal').addEventListener('click', closeEditModal);
document.getElementById('cancelEdit').addEventListener('click', closeEditModal);

document.getElementById('saveEdit').addEventListener('click', () => {
  const id       = document.getElementById('editTaskId').value;
  const title    = document.getElementById('editTitle').value.trim();
  const priority = document.getElementById('editPriority').value;
  const desc     = document.getElementById('editDesc').value.trim();
  const dueDate  = document.getElementById('editDueDate').value;

  if (!validateForm(title, priority, 'edit')) return;

  const task = tasks.find(t => t.id === id);
  if (!task) return;

  task.title       = title;
  task.description = desc;
  task.priority    = priority;
  task.dueDate     = dueDate || null;
  saveTasks();
  renderBoard();
  closeEditModal();
});

document.getElementById('deleteTask').addEventListener('click', () => {
  const id = document.getElementById('editTaskId').value;
  deleteTask(id);
  closeEditModal();
});

// ===== モーダル共通 =====

function showModal(modal) {
  modal.classList.remove('hidden');
  overlay.classList.remove('hidden');
  modal.querySelector('input[type="text"], input[type="date"]')?.focus();
}

function hideModal(modal) {
  modal.classList.add('hidden');
  overlay.classList.add('hidden');
}

overlay.addEventListener('click', () => {
  hideModal(createModal);
  hideModal(editModal);
});

// ===== バリデーション =====

function validateForm(title, priority, prefix) {
  clearErrors(prefix);
  let valid = true;

  if (!title) {
    showError(`${prefix}TitleError`, `${prefix}Title`);
    valid = false;
  }
  if (!priority) {
    showError(`${prefix}PriorityError`, `${prefix}Priority`);
    valid = false;
  }
  return valid;
}

function showError(errorId, inputId) {
  document.getElementById(errorId)?.classList.remove('hidden');
  document.getElementById(inputId)?.classList.add('error');
}

function clearErrors(prefix) {
  [`${prefix}TitleError`, `${prefix}PriorityError`].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
  [`${prefix}Title`, `${prefix}Priority`].forEach(id => {
    document.getElementById(id)?.classList.remove('error');
  });
}

// ===== ソートボタン（破壊的アクション） =====

function applySort(status, sortKey) {
  const inColumn = tasks.filter(t => t.status === status);
  const sorted = sortedTasks(inColumn, sortKey);
  let i = 0;
  tasks = tasks.map(t => t.status === status ? sorted[i++] : t);
  saveTasks();
  renderBoard();
}

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    applySort(btn.dataset.status, btn.dataset.sort);
  });
});

// ===== 初期描画 =====

renderBoard();
