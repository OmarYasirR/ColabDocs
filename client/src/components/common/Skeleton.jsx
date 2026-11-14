import { cx } from '../../utils/helpers';

/**
 * Base skeleton primitive — an animated shimmer placeholder. Compose
 * with width/height utilities to build page-specific skeleton layouts
 * (e.g. DocumentCardSkeleton in Dashboard).
 */
const Skeleton = ({ className = '', rounded = 'rounded-md' }) => (
  <div
    aria-hidden="true"
    className={cx('animate-pulse bg-slate-200', rounded, className)}
  />
);

export default Skeleton;