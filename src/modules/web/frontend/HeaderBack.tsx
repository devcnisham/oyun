import BackButton from './BackButton';
import styles from './HeaderBack.module.css';

export default function HeaderBack() {
  return <BackButton className={styles.back} ariaLabel="Back"><svg viewBox="0 0 24 24" width="23" height="23" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></BackButton>;
}
