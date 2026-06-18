/* =============================================================
   tables.js — Reusable table sorting, search and pagination
   ============================================================= */

function makeTableSortable(tableId) {
  const table = document.getElementById(tableId);
  if (!table) return;
  const headers = table.querySelectorAll('thead th');

  headers.forEach((th, colIndex) => {
    th.style.cursor = 'pointer';
    const icon = document.createElement('span');
    icon.className = 'sort-icon';
    icon.textContent = ' ⇅';
    th.appendChild(icon);

    th.addEventListener('click', function () {
      const isAsc = th.classList.contains('asc');
      headers.forEach(h => { h.classList.remove('asc', 'desc'); h.querySelector('.sort-icon').textContent = ' ⇅'; });
      th.classList.add(isAsc ? 'desc' : 'asc');
      th.querySelector('.sort-icon').textContent = isAsc ? ' ▼' : ' ▲';

      const tbody = table.querySelector('tbody');
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aText = (a.cells[colIndex] ? a.cells[colIndex].textContent : '').trim();
        const bText = (b.cells[colIndex] ? b.cells[colIndex].textContent : '').trim();
        const aNum = parseFloat(aText.replace(/[^0-9.-]/g, ''));
        const bNum = parseFloat(bText.replace(/[^0-9.-]/g, ''));
        if (!isNaN(aNum) && !isNaN(bNum)) return isAsc ? bNum - aNum : aNum - bNum;
        return isAsc ? bText.localeCompare(aText) : aText.localeCompare(bText);
      });
      rows.forEach(r => tbody.appendChild(r));
    });
  });
}

function makePaginated(tableId, rowsPerPage) {
  rowsPerPage = rowsPerPage || 4;
  const table = document.getElementById(tableId);
  if (!table) return;
  const tbody = table.querySelector('tbody');
  if (!tbody) return;

  /* Find or create pagination container */
  let paginationEl = document.getElementById(tableId + '-pagination');
  if (!paginationEl) {
    paginationEl = document.createElement('div');
    paginationEl.id = tableId + '-pagination';
    paginationEl.className = 'pagination';
    const wrap = table.closest('.table-wrap');
    if (wrap) wrap.after(paginationEl);
    else table.after(paginationEl);
  }

  let currentPage = 1;

  function getAllRows() {
    return Array.from(tbody.querySelectorAll('tr'));
  }

  function render() {
    const rows = getAllRows();
    const total = rows.length;
    const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
    if (currentPage > totalPages) currentPage = totalPages;

    rows.forEach((row, i) => {
      const start = (currentPage - 1) * rowsPerPage;
      row.style.display = (i >= start && i < start + rowsPerPage) ? '' : 'none';
    });

    const start = (currentPage - 1) * rowsPerPage + 1;
    const end = Math.min(currentPage * rowsPerPage, total);

    paginationEl.innerHTML = '';

    const info = document.createElement('span');
    info.className = 'pagination-info';
    info.textContent = `Mostrando ${total === 0 ? 0 : start} a ${end} de ${total} registros`;
    paginationEl.appendChild(info);

    const controls = document.createElement('div');
    controls.className = 'pagination-controls';

    const prev = document.createElement('button');
    prev.className = 'page-btn';
    prev.textContent = '‹';
    if (currentPage === 1) prev.disabled = true;
    prev.addEventListener('click', () => { currentPage--; render(); });
    controls.appendChild(prev);

    for (let p = 1; p <= totalPages; p++) {
      const btn = document.createElement('button');
      btn.className = 'page-btn' + (p === currentPage ? ' active' : '');
      btn.textContent = p;
      btn.addEventListener('click', (function(page){ return function() { currentPage = page; render(); }; })(p));
      controls.appendChild(btn);
    }

    const next = document.createElement('button');
    next.className = 'page-btn';
    next.textContent = '›';
    if (currentPage === totalPages) next.disabled = true;
    next.addEventListener('click', () => { currentPage++; render(); });
    controls.appendChild(next);

    paginationEl.appendChild(controls);
  }

  render();

  /* Return a function to re-render (useful after search filtering) */
  return { refresh: render };
}

function makeTableSearchable(tableId, inputId) {
  const table = document.getElementById(tableId);
  const input = document.getElementById(inputId);
  if (!table || !input) return;

  input.addEventListener('input', function () {
    const term = this.value.toLowerCase();
    const rows = Array.from(table.querySelectorAll('tbody tr'));
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(term) ? '' : 'none';
    });
    /* Re-trigger pagination if available */
    const paginationEl = document.getElementById(tableId + '-pagination');
    if (paginationEl) {
      /* Reset visible pagination by re-calling makePaginated is complex,
         so here we just hide the pagination when filtering */
      paginationEl.style.display = term ? 'none' : '';
    }
  });
}
