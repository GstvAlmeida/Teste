// ═══════════════════════════════════════
//  CONFIGURAÇÃO GOOGLE SHEETS
//  Cole aqui a URL do seu Apps Script:
// ═══════════════════════════════════════
const SHEETS_URL = 'https://script.google.com/u/0/home/projects/1XBi4w4wMk8k5Sstc723QJ-XXhJhRuMZmIMRJT_vMV0TRoV1tGjTZlBN4/edit';          // ex: 'https://script.google.com/macros/s/…/exec'
const SHEETS_TAB = 'Plantões';  // nome da aba na planilha

// ═══════════════════════════════════════
//  ESTADO
// ═══════════════════════════════════════
const DAYS = ['Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado','Domingo'];
const DAYS_SHORT = ['SEG','TER','QUA','QUI','SEX','SAB','DOM'];
const DAY_COLORS = [
  '#00BFA5','#2979FF','#EC407A','#FF8F00','#7C3AED','#16A34A','#F97316'
];

// DADOS CHUMBADOS (Hardcoded)
let data = {
  "Segunda-feira": [
    { "id": "id_1776460860535_vw7mf", "time": "06:00", "timeDisplay": "06:00 – 12:15", "desc": "Rua Açu", "local": "Unimed Eletivo", "category": "cat-unimed" },
    { "id": "id_1776460714004_fzqg1", "time": "19:00", "timeDisplay": "19:00 – 21:50", "desc": "Aula de Química Aplicada a Saúde", "local": "UNP", "category": "cat-faculdade" }
  ],
  "Terça-feira": [
    { "id": "id_1776460936174_fzpmc", "time": "06:00", "timeDisplay": "06:00 – 12:15", "desc": "Rua açu", "local": "Unimed eletivo", "category": "cat-unimed" },
    { "id": "id_1776460912911_sn7ku", "time": "18:00", "timeDisplay": "18:00 – 06:00", "desc": "CASA DE SAÚDE SÃO LUCAS", "local": "DNA/CSSL", "category": "cat-dna" },
    { "id": "id_1776460765212_ckkjw", "time": "19:00", "timeDisplay": "19:00 – 21:50", "desc": "AULA ON-LINE DE Gestão de Serviços Farmacêuticos", "local": "casa/trabalho", "category": "cat-faculdade" }
  ],
  "Quarta-feira": [
    { "id": "id_1776460973381_fjkce", "time": "06:00", "timeDisplay": "06:00 – 12:15", "desc": "Rua açu", "local": "Unimed eletivo", "category": "cat-unimed" },
    { "id": "id_1776460994637_nqnlb", "time": "19:00", "timeDisplay": "19:00 – 21:50", "desc": "Gestão de serviços farmacêuticos- prática", "local": "Unp", "category": "cat-faculdade" }
  ],
  "Quinta-feira": [
    { "id": "id_1776461026354_ussch", "time": "06:00", "timeDisplay": "06:00 – 12:15", "desc": "Rua açu", "local": "Unimed eletivo", "category": "cat-unimed" },
    { "id": "id_1776461074541_yr7lo", "time": "18:00", "timeDisplay": "18:00 – 06:00", "desc": "NTO", "local": "Cidade alta", "category": "cat-dna" },
    { "id": "id_1776461054558_04xll", "time": "19:00", "timeDisplay": "19:00 – 21:50", "desc": "Aula on-line de análises metabólicas", "local": "casa/trabalho", "category": "cat-faculdade" }
  ],
  "Sexta-feira": [
    { "id": "id_1776461109948_xsom1", "time": "06:00", "timeDisplay": "06:00 – 12:15", "desc": "Rua açu", "local": "Unimed eletivo", "category": "cat-unimed" },
    { "id": "id_1776437573090_gnavy", "time": "18:00", "timeDisplay": "18:00 – 06:00", "desc": "CASA DE SAÚDE SÃO LUCAS", "local": "DNA CSSL", "category": "cat-dna" },
    { "id": "id_1776461155919_ons9x", "time": "19:00", "timeDisplay": "19:00 – 21:50", "desc": "Aula prática de análises metabólicas", "local": "UNP/LABORATORIO", "category": "cat-faculdade" }
  ],
  "Sábado": [
    { "id": "id_1776461244625_gnck8", "time": "06:00", "timeDisplay": "06:00 – 12:15", "desc": "Rua açu", "local": "Unimed eletivo", "category": "cat-unimed" }
  ],
  "Domingo": [
    { "id": "id_1776460829360_t2run", "time": "18:00", "timeDisplay": "18:00 – 06:00", "desc": "CASA DE SAÚDE SÃO LUCAS", "local": "DNA/CSSL", "category": "cat-dna" }
  ]
};

let editingDay = null, editingId = null;

// ═══════════════════════════════════════
//  UTILITÁRIOS
// ═══════════════════════════════════════
const uid = () => 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2,7);

function toast(msg, type='') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// ═══════════════════════════════════════
//  PERSISTÊNCIA LOCAL (Atualizado para v6)
// ═══════════════════════════════════════
function saveLocal() {
  localStorage.setItem('plantoes_v6', JSON.stringify(data));
}

function loadLocal() {
  const raw = localStorage.getItem('plantoes_v6');
  if (raw) {
    const parsed = JSON.parse(raw);
    DAYS.forEach(d => {
      data[d] = (parsed[d] || []).map(t => ({ ...t, id: t.id || uid() }));
    });
  }
}

// ═══════════════════════════════════════
//  GOOGLE SHEETS
// ═══════════════════════════════════════
async function syncToSheets() {
  if (!SHEETS_URL) return;
  try {
    const rows = [];
    DAYS.forEach(day => {
      data[day].forEach(t => {
        rows.push([day, t.timeDisplay || t.time, t.desc, t.local || '', t.category || '', t.id]);
      });
    });
    await fetch(SHEETS_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save', tab: SHEETS_TAB, rows })
    });
  } catch (e) {
    // silencioso — dados já estão salvos no localStorage
  }
}

async function loadFromSheets() {
  if (!SHEETS_URL) return false;
  try {
    const res = await fetch(`${SHEETS_URL}?action=get&tab=${encodeURIComponent(SHEETS_TAB)}`);
    const json = await res.json();
    if (json.rows && json.rows.length) {
      DAYS.forEach(d => data[d] = []);
      json.rows.forEach(r => {
        const [day, timeDisplay, desc, local, category, id] = r;
        if (data[day]) {
          data[day].push({
            id: id || uid(),
            time: timeDisplay ? timeDisplay.split(' - ')[0] : '',
            timeDisplay,
            desc,
            local: local || '',
            category: category || 'cat-outros',
          });
        }
      });
      saveLocal();
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

// ═══════════════════════════════════════
//  ADD / EDIT / DELETE
// ═══════════════════════════════════════
function addShift() {
  const timeStart = document.getElementById('timeStart').value;
  const timeEnd   = document.getElementById('timeEnd').value;
  const desc      = document.getElementById('desc').value.trim();
  const local     = document.getElementById('local').value.trim();
  const category  = document.getElementById('category').value;

  if (!timeStart || !desc) {
    toast('⚠️ Preencha o horário e a descrição!', 'err');
    return;
  }

  const timeDisplay = timeEnd ? `${timeStart} – ${timeEnd}` : timeStart;
  const shift = { id: uid(), time: timeStart, timeDisplay, desc, local, category };

  if (editingDay && editingId) {
    const idx = data[editingDay].findIndex(t => t.id === editingId);
    if (idx !== -1) {
      data[editingDay][idx] = { ...shift, id: editingId };
    }
    editingDay = editingId = null;
    document.getElementById('addBtn').textContent = '+ Adicionar';
    document.getElementById('daysRow').style.display = 'flex';
  } else {
    const targetDays = [...document.querySelectorAll('.day-check:checked')].map(c => c.value);
    if (!targetDays.length) {
      toast('⚠️ Selecione pelo menos um dia!', 'err');
      return;
    }
    targetDays.forEach(d => {
      data[d].push({ ...shift, id: uid() });
      data[d].sort((a, b) => a.time.localeCompare(b.time));
    });
  }

  // Limpa campos
  document.getElementById('timeStart').value = '';
  document.getElementById('timeEnd').value   = '';
  document.getElementById('desc').value      = '';
  document.getElementById('local').value     = '';
  document.querySelectorAll('.day-check').forEach(c => c.checked = false);

  saveLocal();
  syncToSheets();
  render();
  toast('✔️ Plantão adicionado!', 'ok');
}

function deleteShift(day, id) {
  if (!confirm('Excluir este plantão?')) return;
  data[day] = data[day].filter(t => t.id !== id);
  saveLocal();
  syncToSheets();
  render();
  toast('🗑 Plantão removido.');
}

function editShift(day, id) {
  const t = data[day].find(t => t.id === id);
  if (!t) return;

  document.getElementById('timeStart').value  = t.time;
  document.getElementById('timeEnd').value    = (t.timeDisplay && t.timeDisplay.includes('–'))
    ? t.timeDisplay.split('–')[1].trim() : '';
  document.getElementById('desc').value       = t.desc;
  document.getElementById('local').value      = t.local || '';
  document.getElementById('category').value   = t.category || 'cat-outros';

  document.getElementById('daysRow').style.display = 'none';
  document.getElementById('addBtn').textContent = '💾 Salvar edição';

  editingDay = day;
  editingId  = id;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function resetAll() {
  if (!confirm('Limpar TODOS os plantões?')) return;
  DAYS.forEach(d => data[d] = []);
  saveLocal();
  syncToSheets();
  render();
  toast('✨ Cronograma limpo!');
}

// ═══════════════════════════════════════
//  BACKUP JSON
// ═══════════════════════════════════════
function exportJSON() {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `plantoes_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  toast('💾 Backup exportado!', 'ok');
}

function importJSON(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (parsed['Segunda-feira'] !== undefined) {
        DAYS.forEach(d => data[d] = (parsed[d] || []).map(t => ({ ...t, id: t.id || uid() })));
        saveLocal();
        syncToSheets();
        render();
        toast('📥 Dados importados!', 'ok');
      } else {
        toast('❌ Arquivo inválido.', 'err');
      }
    } catch {
      toast('❌ Erro ao ler o arquivo.', 'err');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

// ═══════════════════════════════════════
//  RENDER
// ═══════════════════════════════════════
function render() {
  const search  = document.getElementById('search').value.toLowerCase();
  const catFilt = document.getElementById('filterCat').value;
  const grid    = document.getElementById('calGrid');
  grid.innerHTML = '';

  DAYS.forEach((day, i) => {
    const color = DAY_COLORS[i];
    const col   = document.createElement('div');
    col.className = 'day-col';

    // Drag & drop
    col.ondragover  = e => { e.preventDefault(); col.classList.add('drag-over'); };
    col.ondragleave = ()=> col.classList.remove('drag-over');
    col.ondrop      = e => {
      e.preventDefault();
      col.classList.remove('drag-over');
      const srcId  = e.dataTransfer.getData('shiftId');
      const srcDay = e.dataTransfer.getData('srcDay');
      if (srcDay && srcDay !== day) {
        const idx = data[srcDay].findIndex(t => t.id === srcId);
        if (idx !== -1) {
          const [moved] = data[srcDay].splice(idx, 1);
          data[day].push(moved);
          data[day].sort((a, b) => a.time.localeCompare(b.time));
          saveLocal();
          syncToSheets();
          render();
          toast(`✈️ Plantão movido para ${DAYS_SHORT[i]}!`, 'ok');
        }
      }
    };

    const allShifts = data[day];
    const shifts = allShifts.filter(t => {
      const matchText = t.desc.toLowerCase().includes(search) || (t.local || '').toLowerCase().includes(search);
      const matchCat  = !catFilt || t.category === catFilt;
      return matchText && matchCat;
    });

    // Header
    col.innerHTML = `
      <div class="day-col-header">
        <div class="day-name-row">
          <span class="day-name">${DAYS_SHORT[i]}</span>
          <span class="day-count">${allShifts.length}</span>
        </div>
        <div class="day-color-bar" style="background:${color}"></div>
      </div>
    `;

    // Lista de plantões
    const ul = document.createElement('ul');
    ul.className = 'shifts-list';

    shifts.forEach(t => {
      const li = document.createElement('li');
      li.className = `shift-item ${t.category || 'cat-outros'}`;
      li.draggable = true;
      li.ondragstart = e => {
        e.dataTransfer.setData('shiftId', t.id);
        e.dataTransfer.setData('srcDay', day);
      };

      li.innerHTML = `
        <div class="shift-body">
          <div class="shift-time">
            <span class="shift-dot"></span>
            ${t.timeDisplay || t.time}
          </div>
          <div class="shift-name">${t.desc}</div>
          ${t.local ? `<div class="shift-local">📍 ${t.local}</div>` : ''}
        </div>
        <div class="shift-actions">
          <button class="shift-btn" onclick="editShift('${day}','${t.id}')" title="Editar">✏</button>
          <button class="shift-btn" onclick="deleteShift('${day}','${t.id}')" title="Excluir">🗑</button>
        </div>
      `;
      ul.appendChild(li);
    });

    col.appendChild(ul);

    // Botão "+" dentro da coluna
    const addBtn = document.createElement('button');
    addBtn.className = 'day-add-btn';
    addBtn.innerHTML = `<span>+</span> plantão`;
    addBtn.onclick = () => {
      document.getElementById('daysRow').style.display = 'flex';
      document.querySelectorAll('.day-check').forEach(c => c.checked = false);
      const ck = document.querySelector(`.day-check[value="${day}"]`);
      if (ck) ck.checked = true;
      document.getElementById('desc').focus();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    col.appendChild(addBtn);

    grid.appendChild(col);
  });
}

// ═══════════════════════════════════════
//  DATA NO HEADER
// ═══════════════════════════════════════
function setDateHeader() {
  const now  = new Date();
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  const str  = now.toLocaleDateString('pt-BR', opts);
  const cap  = str.charAt(0).toUpperCase() + str.slice(1);
  document.getElementById('headerDate').textContent = cap;

  const start = new Date(now.getFullYear(), 0, 1);
  const week  = Math.ceil((now.getDay() + 1 + Math.floor((now - start) / 86400000)) / 7);
  document.getElementById('headerWeek').textContent =
    `${week}ª semana de ${now.getFullYear()}`;
}

function formatTime(input) {
  // Remove tudo que não for número
  let val = input.value.replace(/\D/g, '');
  
  // Limita as horas até 23 e minutos até 59 (opcional, mas evita erros como "99:99")
  if (val.length >= 2) {
    let hours = parseInt(val.substring(0, 2));
    if (hours > 23) val = '23' + val.substring(2);
  }
  if (val.length >= 4) {
    let minutes = parseInt(val.substring(2, 4));
    if (minutes > 59) val = val.substring(0, 2) + '59';
  }

  // Adiciona os dois pontos no meio
  if (val.length > 2) {
    val = val.substring(0, 2) + ':' + val.substring(2, 4);
  }
  
  input.value = val;
}

// ═══════════════════════════════════════
//  ENTER para adicionar
// ═══════════════════════════════════════
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.activeElement.id === 'desc') addShift();
});

// ═══════════════════════════════════════
//  INIT
// ═══════════════════════════════════════
async function init() {
  setDateHeader();
  loadLocal();
  render();

  // Tenta carregar do Sheets (se URL configurada)
  if (SHEETS_URL) {
    const loaded = await loadFromSheets();
    if (loaded) render();
  }
}

init();