import { fireEvent, render, screen } from '@testing-library/react';
import Pagination from './Pagination';

const paginationMocks = vi.hoisted(() => ({ props: null }));

vi.mock('flowbite-react/components/Pagination', () => ({
  Pagination: (props) => {
    paginationMocks.props = props;
    return (
      <button type="button" onClick={() => props.onPageChange(3)}>
        Ke halaman 3
      </button>
    );
  },
}));

describe('Student Pagination', () => {
  beforeEach(() => {
    paginationMocks.props = null;
  });

  test('derives the current page from server data and delegates changes', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        data={{ page: 2, totalPages: 4 }}
        onPageChange={onPageChange}
      />
    );

    expect(screen.getByText('Halaman 2 dari 4')).toBeInTheDocument();
    expect(paginationMocks.props.currentPage).toBe(2);

    fireEvent.click(screen.getByRole('button', { name: 'Ke halaman 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });
  test('keeps legacy pagination usable when the payload has no current-page field', () => {
    const onPageChange = vi.fn();
    render(
      <Pagination
        data={{ totalPages: 4 }}
        onPageChange={onPageChange}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Ke halaman 3' }));
    expect(onPageChange).toHaveBeenCalledWith(3);
    expect(screen.getByText('Halaman 3 dari 4')).toBeInTheDocument();
  });

});
