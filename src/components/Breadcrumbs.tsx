"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Breadcrumbs.module.css';

const Breadcrumbs = () => {
  const pathname = usePathname();
  const pathnames = pathname.split('/').filter(x => x);

  return (
    <nav aria-label="Breadcrumb" className={styles.breadcrumbs}>
      <ul>
        <li>
          <Link href="/"></Link>
        </li>
        {pathnames.map((value, index) => {
          const to = `/${pathnames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathnames.length - 1;
          const displayName = formatBreadcrumbLabel(value);

          return (
            <li key={to}>
              <span className={styles.separator}>/</span>
              {isLast ? (
                <span>{displayName}</span>
              ) : (
                <Link href={to}>{displayName}</Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

const formatBreadcrumbLabel = (segment: string) =>
  decodeURIComponent(segment)
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_]+/g, ' ')
    .toLowerCase()
    .trim();

export default Breadcrumbs;