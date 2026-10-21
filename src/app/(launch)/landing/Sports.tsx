import { IconArrow } from '../_ui/icons';
import { BROWSE_URL } from '../_ui/links';
import { BadmintonArt, CricketArt, FootballArt, PickleballArt } from './CourtArt';
import styles from './sections.module.css';
import TiltCard from './TiltCard';

const GAMES = [
  { name: 'Football', sport: 'Football', place: 'Turfs', line: 'Five-a-side and seven-a-side, by the hour.', Art: FootballArt },
  { name: 'Box cricket', sport: 'Box Cricket', place: 'Turfs', line: 'Net-enclosed, built for quick evening games.', Art: CricketArt },
  { name: 'Badminton', sport: 'Badminton', place: 'Courts', line: 'Indoor courts for the hour you want.', Art: BadmintonArt },
  { name: 'Pickleball', sport: 'Pickleball', place: 'Courts', line: 'New courts opening across the city.', Art: PickleballArt },
];

export default function Sports() {
  return (
    <section id="sports" className={`${styles.section} ${styles.night}`} aria-labelledby="sports-title">
      <div className={styles.wrap}>
        <div className={styles.head}>
          <p className={styles.eyebrow}>Four games</p>
          <h2 id="sports-title" className={styles.display}>Pick a game.<br /><span className={styles.redText}>We find the floor.</span></h2>
        </div>
        <ul className={styles.games}>
          {GAMES.map(({ name, sport, place, line, Art }, i) => (
            <li key={name} className={styles.game} style={{ '--i': i } as React.CSSProperties}>
              <TiltCard>
                <a href={`${BROWSE_URL}?sport=${encodeURIComponent(sport)}`} className={styles.gameLink}>
                  <span className={`${styles.gameArt} ${styles.depthFar}`}><Art /></span>
                  <span className={`${styles.gameMeta} ${styles.depthNear}`}>
                    <span className={styles.gamePlace}>{place}</span>
                    <span className={styles.gameName}>{name}</span>
                    <span className={styles.gameLine}>{line}</span>
                    <span className={styles.gameGo}>Browse <IconArrow size={16} /></span>
                  </span>
                </a>
              </TiltCard>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
