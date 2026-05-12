'use client';

import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material';
import styles from './DataTableDetail.module.css';

export type DataTableDetailColumn<T> = {
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  render: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: DataTableDetailColumn<T>[];
  rows: T[];
  rowKey: (row: T, index: number) => string;
  pageSize?: number;
};

function DataTableDetail<T>({ columns, rows, rowKey, pageSize = 10 }: Props<T>) {
  const [pageIndex, setPageIndex] = useState(0);

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  return (
    <div>
      <div className={styles.wrapper}>
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={i} style={col.width ? { width: col.width } : undefined}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={rowKey(row, pageIndex * pageSize + i)}>
                {columns.map((col, j) => (
                  <td key={j} style={col.align ? { textAlign: col.align } : undefined}>{col.render(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Box className={styles.paginationContainer}>
        <Box className={styles.paginationIcons}>
          <IconButton onClick={() => setPageIndex(0)} disabled={!canPrev}>
            <FirstPage />
          </IconButton>
          <IconButton onClick={() => setPageIndex(p => p - 1)} disabled={!canPrev}>
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton onClick={() => setPageIndex(p => p + 1)} disabled={!canNext}>
            <KeyboardArrowRight />
          </IconButton>
          <IconButton onClick={() => setPageIndex(pageCount - 1)} disabled={!canNext}>
            <LastPage />
          </IconButton>
        </Box>
        <Box>
          Página <strong>{pageIndex + 1}</strong> de <strong>{pageCount}</strong>
        </Box>
      </Box>
    </div>
  );
}

export default DataTableDetail;
