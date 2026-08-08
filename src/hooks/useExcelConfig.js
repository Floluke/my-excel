import { useReducer, useCallback } from 'react';

const initialState = {
  jsonData: null,
  fileName: '',
  columns: [],
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
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_JSON_DATA': {
      const { data, fileName } = action.payload;
      const keys = [...new Set(data.flatMap((item) => Object.keys(item)))];
      const fields = data.length > 0
        ? keys.map((key) => ({
            field: key,
            header: key,
            enabled: true,
          }))
        : [];
      return {
        ...state,
        jsonData: data,
        fileName,
        columns: fields,
      };
    }
    case 'TOGGLE_COLUMN': {
      const field = action.payload;
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.field === field ? { ...col, enabled: !col.enabled } : col
        ),
      };
    }
    case 'RENAME_COLUMN': {
      const { field, header } = action.payload;
      return {
        ...state,
        columns: state.columns.map((col) =>
          col.field === field ? { ...col, header } : col
        ),
      };
    }
    case 'UPDATE_CELL': {
      const { rowIndex, field, value } = action.payload;
      return {
        ...state,
        jsonData: state.jsonData.map((row, index) =>
          index === rowIndex ? { ...row, [field]: value } : row
        ),
      };
    }
    case 'ADD_ROW': {
      const newRow = Object.fromEntries(state.columns.map((column) => [column.field, '']));
      return { ...state, jsonData: [...state.jsonData, newRow] };
    }
    case 'DELETE_ROW':
      return {
        ...state,
        jsonData: state.jsonData.filter((_, index) => index !== action.payload),
      };
    case 'SET_HEADER_STYLE':
      return { ...state, headerStyle: { ...state.headerStyle, ...action.payload } };
    case 'SET_CELL_STYLE':
      return { ...state, cellStyle: { ...state.cellStyle, ...action.payload } };
    case 'SET_ALTERNATE_ROW':
      return { ...state, ...action.payload };
    case 'SET_HEADER_TEXT':
      return { ...state, headerText: { ...state.headerText, ...action.payload } };
    case 'SET_CHART_CONFIG':
      return { ...state, chartConfig: { ...state.chartConfig, ...action.payload } };
    case 'RESET':
      return { ...initialState };
    default:
      return state;
  }
}

export function useExcelConfig() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const setJsonData = useCallback((data, fileName) => {
    dispatch({ type: 'SET_JSON_DATA', payload: { data, fileName } });
  }, []);

  const toggleColumn = useCallback((field) => {
    dispatch({ type: 'TOGGLE_COLUMN', payload: field });
  }, []);

  const renameColumn = useCallback((field, header) => {
    dispatch({ type: 'RENAME_COLUMN', payload: { field, header } });
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

  return {
    state,
    setJsonData,
    toggleColumn,
    renameColumn,
    updateCell,
    addRow,
    deleteRow,
    setHeaderStyle,
    setCellStyle,
    setAlternateRow,
    setHeaderText,
    setChartConfig,
    reset,
  };
}
