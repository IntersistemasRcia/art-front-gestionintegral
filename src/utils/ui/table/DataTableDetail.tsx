 'use client';

import React, { useState } from 'react';
import { Box, IconButton } from '@mui/material';
import { FirstPage, KeyboardArrowLeft, KeyboardArrowRight, LastPage } from '@mui/icons-material';
import styles from './DataTableDetail.module.css';
import { DataTableDetailProps } from './types';

function DataTableDetail<T>({ columns, rows, rowKey, pageSize = 10, title, groupBy, groupOrder, onRowClick, manualPagination, pageCount: pageCountProp, onPageChange }: DataTableDetailProps<T>) {
  const [pageIndex, setPageIndex] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const pageCount = manualPagination ? (pageCountProp ?? 1) : Math.max(1, Math.ceil(rows.length / pageSize));
  const pageRows = manualPagination ? rows : rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);

  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pageCount - 1;

  const handlePageChange = (next: number) => {
    setPageIndex(next);
    if (manualPagination) onPageChange?.(next + 1);
  };

  const renderRows = () => {
    if (!groupBy) {
      return pageRows.map((row, i) => {
        const key = rowKey(row, pageIndex * pageSize + i);
        return (
          <tr
            key={key}
            onClick={onRowClick ? () => { setSelectedKey(key); onRowClick(row); } : undefined}
            className={`${i % 2 === 0 ? styles.rowOdd : styles.rowEven}${onRowClick ? ` ${styles.rowClickable}` : ""}${selectedKey === key ? ` ${styles.rowSelected}` : ""}`}
          >
          {columns.map((col, j) => (
            <td key={j} style={col.align ? { textAlign: col.align } : undefined}>{col.render(row)}</td>
          ))}
        </tr>
      );
      });
    }

    const groups: Record<string, T[]> = {};
    const orderMap: Record<string, number> = {};
    for (const row of pageRows) {
      const key = groupBy(row);
      if (!groups[key]) groups[key] = [];
      groups[key].push(row);
      if (groupOrder) orderMap[key] = groupOrder(row);
    }
    const titles = Object.keys(groups).sort((a, b) =>
      groupOrder ? (orderMap[a] ?? 0) - (orderMap[b] ?? 0) : 0
    );
    return titles.map(groupTitle => (
      <React.Fragment key={groupTitle}>
        <tr>
          <td colSpan={columns.length} className={styles.groupHeader}>{groupTitle}</td>
        </tr>
        {groups[groupTitle].map((row, i) => (
          <tr key={rowKey(row, i)} className={i % 2 === 0 ? styles.rowOdd : styles.rowEven}>
            {columns.map((col, j) => (
              <td key={j} style={col.align ? { textAlign: col.align } : undefined}>{col.render(row)}</td>
            ))}
          </tr>
        ))}
      </React.Fragment>
    ));
  };

  return (
    <div>
      {title && <div className={styles.tableTitle}>{title}</div>}
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
            {renderRows()}
          </tbody>
        </table>
      </div>

      <Box className={styles.paginationContainer}>
        <Box className={styles.paginationIcons}>
          <IconButton onClick={() => handlePageChange(0)} disabled={!canPrev}>
            <FirstPage />
          </IconButton>
          <IconButton onClick={() => handlePageChange(pageIndex - 1)} disabled={!canPrev}>
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton onClick={() => handlePageChange(pageIndex + 1)} disabled={!canNext}>
            <KeyboardArrowRight />
          </IconButton>
          <IconButton onClick={() => handlePageChange(pageCount - 1)} disabled={!canNext}>
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
