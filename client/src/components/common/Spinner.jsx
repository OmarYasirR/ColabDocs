// src/components/common/Spinner.jsx
import { cx } from '../../utils/helpers';

const SIZE_CLASSES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-9 w-9 border-[3px]',
};

const Spinner = ({ size = 'md', className = '' }) => {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cx(
        'animate-spin rounded-full border-slate-200 border-t-indigo-600',
        SIZE_CLASSES[size],
        className
      )}
    />
  );
};

export default Spinner;