import { useReducer, useCallback } from 'react';

function isImageValue(value) {
  return typeof value === 'string' && (/^data:image\//i.test(value) || /^https?:\/\//i.test(value));
}

const initialState = {
  jsonData: null,
  fileName: '',
  columns: [],
  worksheets: [],
  activeSheetIndex: 0,
  headerStyle: {
    fontName: 'Calibri',
    fontSize: 11,
    fontColor: '#FFFFFF',
    bold: true,
    fillColor: '#4472C4',
    borderStyle: 'thin',
    borderColor: '#000000',
  },
  cellStyle: {
    fontName: 'Calibri',
    fontSize: 11,
    fontColor: '#000000',
    fillColor: '#FFFFFF',
    borderStyle: 'thin',
    borderColor: '#000000',
  },
  alternateRow: false,
  alternateRowColor: '#D6E4F0',
  headerText: {
    text: '',
    fontName: 'Calibri',
    fontSize: 16,
    fontColor: '#000000',
    bold: true,
  },
  chartConfig: {
    enabled: false,
    type: 'column',
    title: 'Chart',
    xField: '',
    yField: '',
  },
  freezeHeader: false,
};

function columnsForData(data) {
  const keys = [...new Set(data.flatMap((item) => Object.keys(item)))];
  return keys.map((key) => ({
    field: key,
    header: key,
    enabled: true,
    format: data.some((item) => isImageValue(item[key])) ? 'image' : 'general',
  }));
}

function updateActiveSheet(state, update) {
  const current = state.worksheets[state.activeSheetIndex];
  const next = update(current);
  return {
    ...state,
    ...next,
    worksheets: state.worksheets.map((sheet, index) => index === state.activeSheetIndex ? next : sheet),
  };
}

function reduceState(state, action) {
  switch (action.type) {
    case 'SET_JSON_DATA': {
      const { sheets, fileName } = action.payload;
      const worksheets = sheets.map((sheet) => ({
        name: sheet.name,
        jsonData: sheet.data,
        columns: columnsForData(sheet.data),
        headerText: { ...state.headerText },
      }));
      const active = worksheets[0];
      return {
        ...state,
        jsonData: active.jsonData,
        fileName,
        columns: active.columns,
        headerText: active.headerText,
        worksheets,
        activeSheetIndex: 0,
      };
    }
    case 'SET_ACTIVE_SHEET': {
      const active = state.worksheets[action.payload];
      if (!active) return state;
      return {
        ...state,
        activeSheetIndex: action.payload,
        jsonData: active.jsonData,
        columns: active.columns,
        headerText: active.headerText,
      };
    }
    case 'TOGGLE_COLUMN': {
      const field = action.payload;
      return updateActiveSheet(state, (sheet) => ({
        ...sheet,
        columns: sheet.columns.map((col) => col.field === field ? { ...col, enabled: !col.enabled } : col),
      }));
    }
    case 'RENAME_COLUMN': {
      const { field, header } = action.payload;
      return updateActiveSheet(state, (sheet) => ({ ...sheet, columns: sheet.columns.map((col) => col.field === field ? { ...col, header } : col) }));
    }
    case 'SET_COLUMN_FORMAT':
      return updateActiveSheet(state, (sheet) => ({ ...sheet, columns: sheet.columns.map((col) => col.field === action.payload.field ? { ...col, format: action.payload.format } : col) }));
    case 'ADD_COLUMN': {
      const field = action.payload || `Column${state.columns.length + 1}`;
      const newColumn = { field, header: field, enabled: true, format: 'general' };
      return updateActiveSheet(state, (sheet) => ({ ...sheet, columns: [...sheet.columns, newColumn], jsonData: sheet.jsonData.map((row) => ({ ...row, [field]: '' })) }));
    }
    case 'DELETE_COLUMN': {
      const field = action.payload;
      return updateActiveSheet(state, (sheet) => ({
        ...sheet,
        columns: sheet.columns.filter((col) => col.field !== field),
        jsonData: sheet.jsonData.map((row) => {
          const next = { ...row };
          delete next[field];
          return next;
        }),
      }));
    }
    case 'UPDATE_CELL': {
      const { rowIndex, field, value } = action.payload;
      return updateActiveSheet(state, (sheet) => ({
        ...sheet,
        jsonData: sheet.jsonData.map((row, index) =>
          index === rowIndex ? { ...row, [field]: value } : row
        ),
      }));
    }
    case 'ADD_ROW': {
      const newRow = Object.fromEntries(state.columns.map((column) => [column.field, '']));
      return updateActiveSheet(state, (sheet) => ({ ...sheet, jsonData: [...sheet.jsonData, newRow] }));
    }
    case 'DELETE_ROW':
      return updateActiveSheet(state, (sheet) => ({ ...sheet, jsonData: sheet.jsonData.filter((_, index) => index !== action.payload) }));
    case 'SET_HEADER_STYLE':
      return { ...state, headerStyle: { ...state.headerStyle, ...action.payload } };
    case 'SET_CELL_STYLE':
      return { ...state, cellStyle: { ...state.cellStyle, ...action.payload } };
    case 'SET_ALTERNATE_ROW':
      return { ...state, ...action.payload };
    case 'SET_HEADER_TEXT': {
      const headerText = { ...state.headerText, ...action.payload };
      return updateActiveSheet(state, (sheet) => ({ ...sheet, headerText }));
    }
    case 'SET_CHART_CONFIG':
      return { ...state, chartConfig: { ...state.chartConfig, ...action.payload } };
    case 'SET_FREEZE_HEADER':
      return { ...state, freezeHeader: action.payload };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

function reducer(history, action) {
  if (action.type === 'UNDO') {
    if (history.past.length === 0) return history;
    const previous = history.past[history.past.length - 1];
    return {
      past: history.past.slice(0, -1),
      present: previous,
      future: [history.present, ...history.future],
    };
  }

  if (action.type === 'REDO') {
    if (history.future.length === 0) return history;
    const next = history.future[0];
    return {
      past: [...history.past, history.present],
      present: next,
      future: history.future.slice(1),
    };
  }

  const next = reduceState(history.present, action);
  if (next === history.present) return history;

  return {
    past: [...history.past, history.present].slice(-50),
    present: next,
    future: [],
  };
}

export function useExcelConfig() {
  const [history, dispatch] = useReducer(reducer, {
    past: [],
    present: initialState,
    future: [],
  });

  const setJsonData = useCallback((sheets, fileName) => {
    dispatch({ type: 'SET_JSON_DATA', payload: { sheets, fileName } });
  }, []);

  const setActiveSheet = useCallback((index) => {
    dispatch({ type: 'SET_ACTIVE_SHEET', payload: index });
  }, []);

  const toggleColumn = useCallback((field) => {
    dispatch({ type: 'TOGGLE_COLUMN', payload: field });
  }, []);

  const renameColumn = useCallback((field, header) => {
    dispatch({ type: 'RENAME_COLUMN', payload: { field, header } });
  }, []);

  const setColumnFormat = useCallback((field, format) => {
    dispatch({ type: 'SET_COLUMN_FORMAT', payload: { field, format } });
  }, []);

  const addColumn = useCallback((field) => {
    dispatch({ type: 'ADD_COLUMN', payload: field });
  }, []);

  const deleteColumn = useCallback((field) => {
    dispatch({ type: 'DELETE_COLUMN', payload: field });
  }, []);

  const setFreezeHeader = useCallback((enabled) => {
    dispatch({ type: 'SET_FREEZE_HEADER', payload: enabled });
  }, []);

  const updateCell = useCallback((rowIndex, field, value) => {
    dispatch({ type: 'UPDATE_CELL', payload: { rowIndex, field, value } });
  }, []);

  const addRow = useCallback(() => {
    dispatch({ type: 'ADD_ROW' });
  }, []);

  const deleteRow = useCallback((rowIndex) => {
    dispatch({ type: 'DELETE_ROW', payload: rowIndex });
  }, []);

  const setHeaderStyle = useCallback((style) => {
    dispatch({ type: 'SET_HEADER_STYLE', payload: style });
  }, []);

  const setCellStyle = useCallback((style) => {
    dispatch({ type: 'SET_CELL_STYLE', payload: style });
  }, []);

  const setAlternateRow = useCallback((alternateRow, alternateRowColor) => {
    dispatch({ type: 'SET_ALTERNATE_ROW', payload: { alternateRow, alternateRowColor } });
  }, []);

  const setHeaderText = useCallback((headerText) => {
    dispatch({ type: 'SET_HEADER_TEXT', payload: headerText });
  }, []);

  const setChartConfig = useCallback((chartConfig) => {
    dispatch({ type: 'SET_CHART_CONFIG', payload: chartConfig });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  const undo = useCallback(() => dispatch({ type: 'UNDO' }), []);
  const redo = useCallback(() => dispatch({ type: 'REDO' }), []);

  return {
    state: history.present,
    setJsonData,
    setActiveSheet,
    toggleColumn,
    renameColumn,
    setColumnFormat,
    addColumn,
    deleteColumn,
    updateCell,
    addRow,
    deleteRow,
    setHeaderStyle,
    setCellStyle,
    setAlternateRow,
    setHeaderText,
    setChartConfig,
    setFreezeHeader,
    reset,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
  };
}
