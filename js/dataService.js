// ============================================================================
// dataService.js — Data / Logic Layer (Subject)
// ============================================================================
//
// LAYER RULES — read this before writing a single line of code.
//
//   1. This file MUST NOT touch the DOM. No `document`, no `window`,
//      no `querySelector`. If you need the DOM, you are in the wrong layer.
//
//   2. The outside world sees this service only through:
//        - the method calls it makes (load, setSearch, setFilter, ...)
//        - the events it emits via the injected event bus
//      Nothing else. Do not expose state.
//
//   3. State is mutated only inside this file. The UI layer reads the
//      service's state by listening to event payloads.
//
//   4. THE CRITICAL DISCIPLINE:
//      The SERVICE filters, searches, sorts, and paginates the rows.
//      The UI only renders what the service gives it in the event payload.
//      If you do any filtering/sorting/slicing inside ui.js, you have
//      broken the pattern and will lose points.
//
// ============================================================================
// EVENT CONTRACT (exact names — do not invent new ones)
// ----------------------------------------------------------------------------
//
//   'data:loading'     payload: null
//     Emitted when load() is called, before fetch completes.
//
//   'data:loaded'      payload: { totalAll }
//     Emitted ONCE after the fetch resolves and allRows is populated.
//     After this the UI knows the raw data is ready. The service also
//     immediately emits a 'view:changed' after this so the table renders.
//
//   'data:loadFailed'  payload: { message }
//     Emitted if fetch fails or JSON parsing fails.
//
//   'view:changed'     payload: see "View Payload Shape" below
//     Emitted whenever the visible rows change — after any search,
//     filter, sort, or page change.
//
//   --- EXTRA CREDIT events (only if implementing row detail) ---
//
//   'row:selected'     payload: { row }
//     Emitted when selectRow(id) finds a matching row.
//
//   'row:deselected'   payload: null
//     Emitted when clearSelection() is called.
//
// ============================================================================
// STATE SHAPE (maintain exactly this)
// ----------------------------------------------------------------------------
//
//   {
//     status:  'idle' | 'loading' | 'ready' | 'error',
//     allRows: Array<Row>,        // full dataset, NEVER mutated after load
//
//     view: {
//       searchTerm:    string,    // matched against the `country` field
//       filters: {                // each key: '' means "no filter on this field"
//         district:  string,
//         purpose:   string,
//         year:      string,      // NOTE: stored as string from <select>
//       },
//       sortColumn:    string | null,       // e.g. 'arrivals'
//       sortDirection: 'asc' | 'desc',
//       page:          number,    // 1-based
//       pageSize:      number,    // fixed at PAGE_SIZE
//     },
//
//     // --- EXTRA CREDIT field (add only if implementing row detail) ---
//     selectedRowId: number | null,
//   }
//
//   Row = { id, year, month, country, district, purpose, arrivals, avgStayNights }
//
// ============================================================================
// VIEW PAYLOAD SHAPE (emitted with 'view:changed')
// ----------------------------------------------------------------------------
//
//   {
//     visibleRows:    Row[],        // already filtered, sorted, paginated
//     totalAll:       number,       // rows in the full dataset
//     totalFiltered:  number,       // rows after search+filter (before pagination)
//     page:           number,       // current page (1-based), CLAMPED to valid range
//     pageCount:      number,       // total pages (at least 1, even if 0 rows)
//     pageSize:       number,
//     sortColumn:     string | null,
//     sortDirection:  'asc' | 'desc',
//   }
//
// ============================================================================

const PAGE_SIZE = 20;

/**
 * @param {object} eventBus   from createEventEmitter()
 * @param {string} dataUrl    relative path to the JSON file
 * @returns {object} public API
 */
export function createDataService(eventBus, dataUrl) {
  if (!eventBus || typeof eventBus.emit !== 'function') {
    throw new TypeError('createDataService requires an event bus.');
  }
  if (typeof dataUrl !== 'string') {
    throw new TypeError('createDataService requires a dataUrl string.');
  }

  // -------------------------------------------------------------------------
  // Private state — sealed in closure. Never expose.
  // -------------------------------------------------------------------------
  let state = createInitialState();

  function createInitialState() {
    return {
      status: 'idle',
      allRows: [],
      view: {
        searchTerm: '',
        filters: {
          district: '',
          purpose: '',
          year: '',
        },
        sortColumn: null,
        sortDirection: 'asc',
        page: 1,
        pageSize: PAGE_SIZE,
      },
      selectedRowId: null, // used only by extra-credit row detail feature
    };
  }

  // -------------------------------------------------------------------------
  // Pure helpers — no state mutation, no side effects.
  // -------------------------------------------------------------------------

  /**
   * Apply the current search term to `rows`. Returns a NEW array.
   * Search matches against the `country` field, case-insensitively.
   * Empty search returns rows unchanged.
   */
  function applySearch(rows, searchTerm) {
    // TODO (1):
    //   - If searchTerm is empty (after trimming), return rows as-is.
    //     (Returning the same reference is fine — it's a read.)
    //   - Otherwise return rows.filter(...) where the row's `country`
    //     (lowercased) includes the searchTerm (lowercased and trimmed).

    const term = searchTerm.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter(row => row.country.toLowerCase().includes(term));
  }

  /**
   * Apply the current filters to `rows`. Returns a NEW array.
   * A filter value of '' means "no filter on this field" — skip it.
   * All non-empty filters must match (AND logic).
   *
   * Note: `filters.year` is a STRING from the <select>, so when comparing
   *        to row.year (a number), convert as needed.
   */
  function applyFilters(rows, filters) {
    // TODO (2):
    //   - Return rows.filter(row => every non-empty filter matches).
    //   - Check filters.district: if non-empty, row.district must equal it.
    //   - Check filters.purpose:  if non-empty, row.purpose must equal it.
    //   - Check filters.year:     if non-empty, String(row.year) must equal it.
    //                             (Because the select emits strings.)

    return rows.filter(row => {
      if (filters.district && row.district !== filters.district) return false;
      if (filters.purpose  && row.purpose  !== filters.purpose)  return false;
      if (filters.year     && String(row.year) !== filters.year)  return false;
      return true;
    });
  }

  /**
   * Sort `rows` by the given column. Returns a NEW array.
   * If sortColumn is null, return rows unchanged.
   * Direction is 'asc' or 'desc'.
   *
   * Sort behavior:
   *   - Numeric columns (year, arrivals, avgStayNights): numeric comparison.
   *   - String columns (month, country, district, purpose): localeCompare.
   *
   * For MONTH specifically: sort by calendar order (January < February < ...),
   * NOT alphabetical. A MONTH_ORDER constant is provided below.
   */
  const MONTH_ORDER = {
    January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
    July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
  };

  function applySort(rows, sortColumn, sortDirection) {
    // TODO (3):
    //   - If sortColumn is null, return rows as-is.
    //   - Clone rows first (never mutate input): `rows.slice()`.
    //   - Call .sort() on the clone with a comparator that:
    //       * If sortColumn is 'month', uses MONTH_ORDER[row.month] on both sides.
    //       * If the values are numbers, subtracts them.
    //       * Otherwise uses String(a).localeCompare(String(b)).
    //   - If sortDirection is 'desc', reverse the result.
    //   - Return the sorted clone.

    if (sortColumn === null) return rows;

    const clone = rows.slice();
    clone.sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];

      let result;
      if (sortColumn === 'month') {
        // Calendar order — use MONTH_ORDER lookup
        result = MONTH_ORDER[aVal] - MONTH_ORDER[bVal];
      } else if (typeof aVal === 'number' && typeof bVal === 'number') {
        // Numeric comparison
        result = aVal - bVal;
      } else {
        // String comparison
        result = String(aVal).localeCompare(String(bVal));
      }
      return result;
    });

    // Reverse in place for descending direction
    if (sortDirection === 'desc') clone.reverse();
    return clone;
  }

  /**
   * Paginate `rows` — slice out the chunk for the current page.
   * Pages are 1-based. Returns a NEW array.
   */
  function applyPagination(rows, page, pageSize) {
    // TODO (4):
    //   - startIndex = (page - 1) * pageSize
    //   - return rows.slice(startIndex, startIndex + pageSize)

    const startIndex = (page - 1) * pageSize;
    return rows.slice(startIndex, startIndex + pageSize);
  }

  /**
   * Count the number of pages given a row count and page size.
   * At least 1 (so "Page 1 of 1" displays even when there are 0 rows).
   */
  function computePageCount(rowCount, pageSize) {
    // TODO (5):
    //   - Math.max(1, Math.ceil(rowCount / pageSize))

    return Math.max(1, Math.ceil(rowCount / pageSize));
  }

  /**
   * Clamp `page` into the valid range [1, pageCount].
   * Used after filters/search change to avoid showing "page 7 of 3".
   */
  function clampPage(page, pageCount) {
    // TODO (6):
    //   - Math.min(pageCount, Math.max(1, page))

    return Math.min(pageCount, Math.max(1, page));
  }

  // -------------------------------------------------------------------------
  // Core computation — called after any view-parameter change.
  // -------------------------------------------------------------------------

  /**
   * Recompute the derived view from current state and emit 'view:changed'.
   * This is THE central method. Every setter below ends by calling this.
   *
   * Pipeline:
   *   allRows → search → filter → (count totalFiltered) → sort → paginate
   *
   * Do NOT mutate state.allRows. Every helper returns a new array.
   */
  function recomputeAndEmit() {
    // TODO (7):
    //   - If state.status !== 'ready', return (nothing to compute yet).
    //   - searched   = applySearch(state.allRows, state.view.searchTerm)
    //   - filtered   = applyFilters(searched,   state.view.filters)
    //   - totalFiltered = filtered.length
    //   - pageCount  = computePageCount(totalFiltered, state.view.pageSize)
    //   - state.view.page = clampPage(state.view.page, pageCount)   // ← mutate
    //   - sorted     = applySort(filtered, state.view.sortColumn, state.view.sortDirection)
    //   - paginated  = applyPagination(sorted, state.view.page, state.view.pageSize)
    //   - Emit 'view:changed' with the full payload shape documented at the top.

    if (state.status !== 'ready') return;

    const searched      = applySearch(state.allRows, state.view.searchTerm);
    const filtered      = applyFilters(searched, state.view.filters);
    const totalFiltered = filtered.length;
    const pageCount     = computePageCount(totalFiltered, state.view.pageSize);

    // Clamp page — must mutate state so pagination buttons reflect reality
    state.view.page = clampPage(state.view.page, pageCount);

    const sorted    = applySort(filtered, state.view.sortColumn, state.view.sortDirection);
    const paginated = applyPagination(sorted, state.view.page, state.view.pageSize);

    eventBus.emit('view:changed', {
      visibleRows:   paginated,
      totalAll:      state.allRows.length,
      totalFiltered,
      page:          state.view.page,
      pageCount,
      pageSize:      state.view.pageSize,
      sortColumn:    state.view.sortColumn,
      sortDirection: state.view.sortDirection,
    });
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Fetch the JSON and populate allRows. Emits 'data:loading',
   * then 'data:loaded' + 'view:changed' on success, or 'data:loadFailed' on error.
   */
  async function load() {
    // TODO (8):
    //   - Set state.status = 'loading' and emit 'data:loading' with null payload.
    //   - Try: fetch(dataUrl), check response.ok, parse as JSON.
    //     * If not ok, throw new Error(`HTTP ${response.status}`).
    //   - On success:
    //       * state.allRows = the parsed array
    //       * state.status  = 'ready'
    //       * emit 'data:loaded' with { totalAll: state.allRows.length }
    //       * call recomputeAndEmit()  // so the table renders immediately
    //   - On failure:
    //       * state.status = 'error'
    //       * emit 'data:loadFailed' with { message: err.message }
    
    state.status = 'loading';
    eventBus.emit('data:loading', null);

    try {
      const response = await fetch(dataUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();

      state.allRows = data;
      state.status  = 'ready';

      eventBus.emit('data:loaded', { totalAll: state.allRows.length });
      recomputeAndEmit(); // renders the table immediately after load
    } catch (err) {
      state.status = 'error';
      eventBus.emit('data:loadFailed', { message: err.message });
    }
  }

  /**
   * Update the search term. Resets to page 1 (a new search shouldn't
   * leave you stranded on page 5 of old results).
   */
  function setSearch(term) {
    // TODO (9):
    //   - state.view.searchTerm = String(term) (defensive)
    //   - state.view.page = 1
    //   - recomputeAndEmit()

    state.view.searchTerm = String(term);
    state.view.page = 1;
    recomputeAndEmit();
  }

  /**
   * Update a single filter. Resets to page 1.
   * @param {'district'|'purpose'|'year'} key
   * @param {string} value   empty string means "clear this filter"
   */
  function setFilter(key, value) {
    // TODO (10):
    //   - Guard: if key is not one of the three allowed keys, return.
    //     (Fail loud is fine — throw a TypeError.)
    //   - state.view.filters[key] = String(value)
    //   - state.view.page = 1
    //   - recomputeAndEmit()

    const allowed = ['district', 'purpose', 'year'];
    if (!allowed.includes(key)) {
      throw new TypeError(`setFilter: invalid key "${key}". Must be one of: ${allowed.join(', ')}.`);
    }
    state.view.filters[key] = String(value);
    state.view.page = 1;
    recomputeAndEmit();
  }

  /**
   * Toggle or set the sort column.
   *   - If the SAME column is clicked, flip direction ('asc' <-> 'desc').
   *   - If a DIFFERENT column is clicked, set it with direction 'asc'.
   *
   * Does NOT reset the page (users expect their page to stick on re-sort).
   */
  function setSort(column) {
    // TODO (11):
    //   - If state.view.sortColumn === column:
    //       * flip direction
    //   - Else:
    //       * state.view.sortColumn = column
    //       * state.view.sortDirection = 'asc'
    //   - recomputeAndEmit()

    if (state.view.sortColumn === column) {
      // Same column — toggle direction
      state.view.sortDirection = state.view.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // New column — reset to ascending
      state.view.sortColumn    = column;
      state.view.sortDirection = 'asc';
    }
    recomputeAndEmit();
  }

  /**
   * Set the page directly. Clamping happens in recomputeAndEmit.
   */
  function setPage(page) {
    // TODO (12):
    //   - state.view.page = Number(page) || 1
    //   - recomputeAndEmit()

    state.view.page = Number(page) || 1;
    recomputeAndEmit();
  }

  /**
   * Reset search, filters, sort to defaults. Keeps the loaded data.
   */
  function resetView() {
    // TODO (13):
    //   - Reset state.view to a fresh default object (same shape as in
    //     createInitialState, but do NOT reset allRows or status).
    //   - recomputeAndEmit()

    state.view = {
      searchTerm: '',
      filters: {
        district: '',
        purpose: '',
        year: '',
      },
      sortColumn: null,
      sortDirection: 'asc',
      page: 1,
      pageSize: PAGE_SIZE,
    };
    recomputeAndEmit();
  }

  // ==========================================================================
  //  EXTRA CREDIT: Row Selection (+10 points)
  // --------------------------------------------------------------------------
  //  Implement selectRow() and clearSelection() to support a row-detail modal.
  //  If you skip this section, remove the two methods from the return object
  //  below as well. Do NOT leave stubs that emit nothing — that will cause
  //  the UI to subscribe to events that never fire.
  // ==========================================================================

  /**
   * Mark a row as selected and emit 'row:selected' with the full row object.
   * If the id doesn't match any row, do nothing (no emit, no error).
   *
   * Note: search allRows, not just the visible page. The row might be off-screen.
   */
  function selectRow(id) {
    // TODO (BONUS-1):
    //   - Coerce id to a number (may come in as a string from dataset).
    //   - Find the row in state.allRows where row.id === id.
    //   - If not found, return silently.
    //   - state.selectedRowId = id
    //   - Emit 'row:selected' with { row }.

    const numericId = Number(id);
    const row = state.allRows.find(r => r.id === numericId);
    if (!row) return; // unknown id — silent no-op

    state.selectedRowId = numericId;
    eventBus.emit('row:selected', { row });
  }

  /**
   * Clear the current selection. Safe to call when nothing is selected.
   * Emits 'row:deselected' only if something was actually selected.
   */
  function clearSelection() {
    // TODO (BONUS-2):
    //   - If state.selectedRowId is null, return (nothing to do).
    //   - state.selectedRowId = null
    //   - Emit 'row:deselected' with null payload.
    
    if (state.selectedRowId === null) return; // nothing selected — silent no-op

    state.selectedRowId = null;
    eventBus.emit('row:deselected', null);
  }

  return Object.freeze({
    load,
    setSearch,
    setFilter,
    setSort,
    setPage,
    resetView,
    // --- EXTRA CREDIT (remove these two if not implementing bonus) ---
    selectRow,
    clearSelection,
  });
}
