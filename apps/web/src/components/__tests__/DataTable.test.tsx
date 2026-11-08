import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataTable, type DataTableColumn } from '../DataTable';

interface TestRow {
  id: string;
  name: string;
}

const columns: DataTableColumn<TestRow>[] = [
  { key: 'id', header: 'ID' },
  { key: 'name', header: 'Nom' },
];

const data: TestRow[] = [
  { id: '1', name: 'Alpha' },
  { id: '2', name: 'Beta' },
];

describe('DataTable', () => {
  it('renders table headers and rows', () => {
    render(
      <DataTable<TestRow>
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
      />
    );
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Nom')).toBeInTheDocument();
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('renders custom column render function', () => {
    const customCols: DataTableColumn<TestRow>[] = [
      { key: 'id', header: 'ID', render: (r: TestRow) => <span>Custom-{r.id}</span> },
      { key: 'name', header: 'Nom', accessor: (r: TestRow) => `Nom: ${r.name}` },
    ];
    render(<DataTable<TestRow> columns={customCols} data={data} keyExtractor={(r) => r.id} />);
    expect(screen.getByText('Custom-1')).toBeInTheDocument();
    expect(screen.getByText('Nom: Alpha')).toBeInTheDocument();
  });

  it('renders empty message when data is empty', () => {
    render(
      <DataTable<TestRow>
        columns={columns}
        data={[]}
        keyExtractor={(r) => r.id}
        emptyMessage="Aucun enregistrement"
      />
    );
    expect(screen.getByText('Aucun enregistrement')).toBeInTheDocument();
  });

  it('triggers onRowClick when row is clicked', () => {
    const handleRowClick = vi.fn();
    render(
      <DataTable<TestRow>
        columns={columns}
        data={data}
        keyExtractor={(r) => r.id}
        onRowClick={handleRowClick}
      />
    );
    fireEvent.click(screen.getByText('Alpha'));
    expect(handleRowClick).toHaveBeenCalledWith(data[0], 0);
  });
});
