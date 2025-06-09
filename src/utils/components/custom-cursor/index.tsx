import { useEffect, useState } from 'react';
import styles from './cursor.module.scss';

export default function CustomCursor() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useEffect(() => {
    const move = e => setCoords({ x: e.clientX, y: e.clientY });
    const down = () => setClicked(true);
    const up   = () => setClicked(false);
    const over = e => {
      const tag = e.target.tagName?.toLowerCase();
      const interactive = [
        'a', 'button', 'input', 'label',
        'select', 'textarea', 'summary'
      ];
      setHovered(interactive.includes(tag));
    };

    document.addEventListener('mousemove', move);
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup',   up);
    document.addEventListener('mouseover', over);

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup',   up);
      document.removeEventListener('mouseover', over);
    };
  }, []);

  const classes = [
    styles.cursor,
    hovered  ? styles.hovered  : '',
    clicked  ? styles.clicked  : ''
  ].join(' ');

  return (
    <div
      className={classes}
      style={{ left: coords.x, top: coords.y }}
    />
  );
}
