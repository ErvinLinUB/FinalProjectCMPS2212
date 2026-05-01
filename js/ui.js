// ============================================================================
// ui.js — View Layer (Observer)
// ============================================================================
//
// LAYER RULES
//
//   1. This file is the ONLY place allowed to touch the DOM.
//
//   2. This file MUST NOT filter, search, sort, or paginate anything.
//      That is the service's job. You only render the array the service
//      hands you in each `view:changed` payload. If you call .filter(),
//      .sort(), or .slice() on the visible rows here, you have broken
//      the pattern.
//
//   3. Communicate with the service ONLY by calling its public methods
//      (setSearch, setFilter, setSort, setPage, resetView). Never read
//      service state directly.
//
// ============================================================================
// EVENT SUBSCRIPTIONS YOU WILL WIRE UP
//
//   'data:loading'     → showStatus('Loading…')
//   'data:loaded'      → (typically no-op; view:changed follows immediately)
//   'data:loadFailed'  → showStatus(message, { error: true })
//   'view:changed'     → renderTable(visibleRows),
//                         renderPagination(page, pageCount),
//                         renderSortIndicators(sortColumn, sortDirection),
//                         renderStatus(totalFiltered, totalAll)
//
// ============================================================================

export function createUI(eventBus, dataService, rootEl) {
  // -------------------------------------------------------------------------
  // DOM element cache — resolved on mount.
  // -------------------------------------------------------------------------
  const els = {
    tbody:           null,
    search:          null,
    filterDistrict:  null,
    filterPurpose:   null,
    filterYear:      null,
    resetBtn:        null,
    status:          null,
    statusText:      null,
    pageFirst:       null,
    pagePrev:        null,
    pageNext:        null,
    pageLast:        null,
    pageInfo:        null,
    sortHeaders:     null,  // NodeList

    // --- EXTRA CREDIT: row detail modal ---
    detail:          null,  // the backdrop + panel container
    detailClose:     null,
    detailYear:      null,
    detailMonth:     null,
    detailCountry:   null,
    detailDistrict:  null,
    detailPurpose:   null,
    detailArrivals: null,
    detailStay:      null,
    detailId:        null,
  };

  const subscriptions = [];

  // -------------------------------------------------------------------------
  // Formatting helpers (pure, safe to keep here — not business logic).
  // -------------------------------------------------------------------------
  function formatNumber(n) {
    // 12345 → "12,345"
    return Number(n).toLocaleString('en-US');
  }

  // -------------------------------------------------------------------------
  // RENDERERS
  // -------------------------------------------------------------------------

  /**
   * Build a single table row for a data row. Returns a <tr> element.
   *
   * Expected structure:
   *   <tr>
   *     <td>2024</td>
   *     <td>March</td>
   *     <td>United States</td>
   *     <td>Cayo</td>
   *     <td><span class="purpose-badge">Leisure</span></td>
   *     <td class="num">4,523</td>
   *     <td class="num">6.2</td>
   *   </tr>
   *
   * Security note: use textContent, never innerHTML.
   */
  function buildRowElement(row) {
    // TODO (1):
    //   - Create a <tr>.
    //   - Create 7 <td> cells in this order:
    //       year, month, country, district, purpose (wrapped in
    //       a <span class="purpose-badge">), arrivals, avgStayNights.
    //   - The last two cells must have class "num" (right-aligned monospace).
    //   - Use formatNumber() on arrivals for thousands separators.
    //   - avgStayNights can be displayed as-is (already a decimal).
    //   - Return the <tr>.
    //
    //   EXTRA CREDIT: set data-row-id="<row.id>" on the <tr> so the
    //   row-click handler can read it via event delegation, and so
    //   showDetail() can find the selected tr to highlight.

  }

  /**
   * Replace tbody contents with rows from the given array.
   * If the array is empty, render a single "no results" row.
   */
  function renderTable(visibleRows) {
    // TODO (2):
    //   - Clear els.tbody (replaceChildren() is idiomatic).
    //   - If visibleRows.length === 0:
    //       * Create <tr class="empty-row"><td colspan="7">No results match
    //         your search and filters.</td></tr> and append.
    //       * Return early.
    //   - Otherwise build all rows into a DocumentFragment, then append once.

  }

  /**
   * Update the sort indicator arrows on the <th> elements.
   * Remove .is-sort-asc / .is-sort-desc from ALL headers, then add
   * the correct class to the active header.
   */
  function renderSortIndicators(sortColumn, sortDirection) {
    // TODO (3):
    //   - For every header in els.sortHeaders:
    //       * Remove 'is-sort-asc' and 'is-sort-desc'.
    //   - If sortColumn is null, return (nothing is sorted).
    //   - Find the header whose data-sort-column === sortColumn.
    //   - Add 'is-sort-asc' or 'is-sort-desc' based on sortDirection.

  }

  /**
   * Update the pagination controls.
   *   - Page info: "Page X of Y"
   *   - First/Prev: disabled when on page 1
   *   - Next/Last:  disabled when on last page
   */
  function renderPagination(page, pageCount) {
    // TODO (4):
    //   - els.pageInfo.textContent = `Page ${page} of ${pageCount}`
    //   - els.pageFirst.disabled = page <= 1
    //   - els.pagePrev.disabled  = page <= 1
    //   - els.pageNext.disabled  = page >= pageCount
    //   - els.pageLast.disabled  = page >= pageCount

  }

  /**
   * Update the status bar above the table.
   * Example: "Showing 20 of 142 rows (filtered from 276 total)"
   */
  function renderStatus(totalFiltered, totalAll, visibleCount) {
    // TODO (5):
    //   - Remove 'is-error' class from els.status (in case previous state was error).
    //   - Build message:
    //       * If totalFiltered === totalAll: `Showing ${visibleCount} of ${totalAll} rows`
    //       * Else: `Showing ${visibleCount} of ${totalFiltered} rows (filtered from ${totalAll} total)`
    //   - Use formatNumber() for each count.
    //   - els.statusText.textContent = message

  }

  function showStatus(message, opts = {}) {
    els.statusText.textContent = message;
    els.status.classList.toggle('is-error', Boolean(opts.error));
  }

  // ==========================================================================
  //  EXTRA CREDIT: Row Detail Modal Renderers (+5 of the 10 bonus points)
  // --------------------------------------------------------------------------
  //  These render the modal open/closed and populate its fields.
  //  Also highlight the selected row in the table body.
  //
  //  If you skip extra credit, remove these functions AND the bonus
  //  subscriptions below. Leaving empty stubs causes silent bugs.
  // ==========================================================================

  /**
   * Populate the modal fields from a row and make it visible.
   * Also add .is-selected to the corresponding table row (if visible).
   */
  function showDetail(row) {
    // TODO (BONUS-UI-1):
    //   - Set textContent on each detail-* field:
    //       detailYear, detailMonth, detailCountry, detailDistrict,
    //       detailPurpose, detailId
    //   - detailArrivals:   use formatNumber(row.arrivals)
    //   - detailStay:       `${row.avgStayNights} nights`
    //   - Add 'is-visible' class to els.detail.
    //   - Set aria-hidden="false" on els.detail.
    //   - Find the <tr> in the tbody with matching data-row-id (see
    //     buildRowElement bonus TODO below) and add 'is-selected'.

  }

  /**
   * Close the modal and clear any row highlight.
   */
  function hideDetail() {
    // TODO (BONUS-UI-2):
    //   - Remove 'is-visible' class from els.detail.
    //   - Set aria-hidden="true" on els.detail.
    //   - Remove 'is-selected' from whichever tbody tr currently has it.

  }

  // -------------------------------------------------------------------------
  // DOM EVENT HANDLERS — user input → service method calls
  // -------------------------------------------------------------------------

  function onSearchInput(domEvent) {
    // TODO (6): call dataService.setSearch(domEvent.target.value).
    //
    //   Note on debouncing: for a 276-row dataset this is fine to fire
    //   on every keystroke. In production you'd debounce; keeping it
    //   simple here keeps the pattern the focus.

  }

  function onFilterChange(domEvent) {
    // TODO (7):
    //   - Read domEvent.target.dataset.role (it will be one of
    //     'filter-district', 'filter-purpose', 'filter-year').
    //   - Map the role to the filter key ('district', 'purpose', 'year').
    //   - Call dataService.setFilter(key, domEvent.target.value).

  }

  function onSortHeaderClick(domEvent) {
    // TODO (8):
    //   - Find the closest <th> ancestor with data-sort-column.
    //   - Read the column name from its dataset.
    //   - Call dataService.setSort(column).

  }

  function onResetClick() {
    // TODO (9):
    //   - Clear all input/select values in the DOM:
    //       els.search.value = '';
    //       els.filterDistrict.value = '';
    //       els.filterPurpose.value = '';
    //       els.filterYear.value = '';
    //   - Call dataService.resetView().

  }

  // Pagination handlers — each calls setPage with the right number.
  // `currentPage` and `pageCount` are captured in module-level vars
  // that update on every view:changed. See wireSubscriptions().
  let currentPage = 1;
  let currentPageCount = 1;

  function onPageFirst() { dataService.setPage(1); }
  function onPagePrev()  { dataService.setPage(Math.max(1, currentPage - 1)); }
  function onPageNext()  { dataService.setPage(Math.min(currentPageCount, currentPage + 1)); }
  function onPageLast()  { dataService.setPage(currentPageCount); }

  // ==========================================================================
  //  EXTRA CREDIT: Detail Handlers (+5 of the 10 bonus points)
  // ==========================================================================

  /**
   * Click on the table body — open detail for the clicked row.
   * Uses event delegation on els.tbody (already wired in mount).
   */
  function onRowClick(domEvent) {
    // TODO (BONUS-UI-3):
    //   - Find the closest <tr> ancestor of domEvent.target.
    //   - If none, or if the tr has class 'empty-row', return.
    //   - Read data-row-id from its dataset and convert to Number.
    //   - Call dataService.selectRow(id).

  }

  /**
   * Click the close button, or click outside the panel (on the backdrop),
   * or press Escape — any of these should close the modal.
   */
  function onDetailClose() {
    dataService.clearSelection();
  }

  function onDetailBackdropClick(domEvent) {
    // Only close if the click was on the backdrop itself, not the panel.
    if (domEvent.target === els.detail) {
      dataService.clearSelection();
    }
  }

  function onEscapeKey(domEvent) {
    if (domEvent.key === 'Escape' && els.detail.classList.contains('is-visible')) {
      dataService.clearSelection();
    }
  }

  // -------------------------------------------------------------------------
  // SUBSCRIPTION WIRING
  // -------------------------------------------------------------------------

  function subscribe(eventName, handler) {
    eventBus.on(eventName, handler);
    subscriptions.push({ event: eventName, handler });
  }

  function wireSubscriptions() {
    // TODO (10): wire all four event types.
    //
    //   - 'data:loading'    → showStatus('Loading tourism data…')
    //
    //   - 'data:loadFailed' → showStatus(`Failed to load data: ${message}`, { error: true })
    //
    //   - 'view:changed' with payload { visibleRows, totalFiltered, totalAll,
    //                                   page, pageCount, sortColumn, sortDirection }:
    //       * renderTable(visibleRows)
    //       * renderSortIndicators(sortColumn, sortDirection)
    //       * renderPagination(page, pageCount)
    //       * renderStatus(totalFiltered, totalAll, visibleRows.length)
    //       * update currentPage and currentPageCount (needed by pagination handlers)
    //
    //   'data:loaded' can be skipped — 'view:changed' fires right after.
    //
    //   EXTRA CREDIT — also subscribe to:
    //   - 'row:selected'   → showDetail(row)
    //   - 'row:deselected' → hideDetail()

  }

  // -------------------------------------------------------------------------
  // LIFECYCLE
  // -------------------------------------------------------------------------

  function mount() {
    els.tbody          = rootEl.querySelector('[data-role="tbody"]');
    els.search         = rootEl.querySelector('[data-role="search"]');
    els.filterDistrict = rootEl.querySelector('[data-role="filter-district"]');
    els.filterPurpose  = rootEl.querySelector('[data-role="filter-purpose"]');
    els.filterYear     = rootEl.querySelector('[data-role="filter-year"]');
    els.resetBtn       = rootEl.querySelector('[data-role="reset"]');
    els.status         = rootEl.querySelector('[data-role="status"]');
    els.statusText     = rootEl.querySelector('[data-role="status-text"]');
    els.pageFirst      = rootEl.querySelector('[data-role="page-first"]');
    els.pagePrev       = rootEl.querySelector('[data-role="page-prev"]');
    els.pageNext       = rootEl.querySelector('[data-role="page-next"]');
    els.pageLast       = rootEl.querySelector('[data-role="page-last"]');
    els.pageInfo       = rootEl.querySelector('[data-role="page-info"]');
    els.sortHeaders    = rootEl.querySelectorAll('[data-role="sort-header"]');

    // --- EXTRA CREDIT: modal elements ---
    els.detail         = rootEl.querySelector('[data-role="row-detail"]');
    els.detailClose    = rootEl.querySelector('[data-role="detail-close"]');
    els.detailYear     = rootEl.querySelector('[data-role="detail-year"]');
    els.detailMonth    = rootEl.querySelector('[data-role="detail-month"]');
    els.detailCountry  = rootEl.querySelector('[data-role="detail-country"]');
    els.detailDistrict = rootEl.querySelector('[data-role="detail-district"]');
    els.detailPurpose  = rootEl.querySelector('[data-role="detail-purpose"]');
    els.detailArrivals = rootEl.querySelector('[data-role="detail-arrivals"]');
    els.detailStay     = rootEl.querySelector('[data-role="detail-stay"]');
    els.detailId       = rootEl.querySelector('[data-role="detail-id"]');

    // Attach DOM listeners.
    els.search.addEventListener('input',   onSearchInput);
    els.filterDistrict.addEventListener('change', onFilterChange);
    els.filterPurpose.addEventListener('change',  onFilterChange);
    els.filterYear.addEventListener('change',     onFilterChange);
    els.resetBtn.addEventListener('click', onResetClick);

    // Event delegation on the table head for sort clicks.
    const thead = rootEl.querySelector('.data-table thead');
    thead.addEventListener('click', onSortHeaderClick);

    // Event delegation on the tbody for row clicks (extra credit).
    els.tbody.addEventListener('click', onRowClick);

    els.pageFirst.addEventListener('click', onPageFirst);
    els.pagePrev.addEventListener('click',  onPagePrev);
    els.pageNext.addEventListener('click',  onPageNext);
    els.pageLast.addEventListener('click',  onPageLast);

    // --- EXTRA CREDIT: modal listeners ---
    els.detailClose.addEventListener('click', onDetailClose);
    els.detail.addEventListener('click',      onDetailBackdropClick);
    document.addEventListener('keydown',      onEscapeKey);

    // Subscribe to service events.
    wireSubscriptions();
  }

  function unmount() {
    els.search.removeEventListener('input',   onSearchInput);
    els.filterDistrict.removeEventListener('change', onFilterChange);
    els.filterPurpose.removeEventListener('change',  onFilterChange);
    els.filterYear.removeEventListener('change',     onFilterChange);
    els.resetBtn.removeEventListener('click', onResetClick);

    const thead = rootEl.querySelector('.data-table thead');
    thead.removeEventListener('click', onSortHeaderClick);

    els.tbody.removeEventListener('click', onRowClick);

    els.pageFirst.removeEventListener('click', onPageFirst);
    els.pagePrev.removeEventListener('click',  onPagePrev);
    els.pageNext.removeEventListener('click',  onPageNext);
    els.pageLast.removeEventListener('click',  onPageLast);

    els.detailClose.removeEventListener('click', onDetailClose);
    els.detail.removeEventListener('click',      onDetailBackdropClick);
    document.removeEventListener('keydown',      onEscapeKey);

    subscriptions.forEach(({ event, handler }) => eventBus.off(event, handler));
    subscriptions.length = 0;
  }

  return Object.freeze({ mount, unmount });
}
