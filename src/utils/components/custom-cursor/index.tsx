import React, { useEffect, useState } from 'react';
import styles from './cursor.module.scss';

export default function CustomCursor() {
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);
  const [overScrollbar, setOverScrollbar] = useState(false);

  // util: find nearest scrollable ancestor
  function getScrollableAncestor(el: HTMLElement | null): HTMLElement | null {
    let cur: HTMLElement | null = el;
    while (cur && cur !== document.body) {
      const cs = window.getComputedStyle(cur);
      const oy = cs.overflowY;
      const ox = cs.overflowX;
      const vert = (oy === 'auto' || oy === 'scroll') && cur.scrollHeight > cur.clientHeight;
      const horz = (ox === 'auto' || ox === 'scroll') && cur.scrollWidth > cur.clientWidth;
      if (vert || horz) return cur;
      cur = cur.parentElement;
    }
    return null;
  }

  // util: is pointer inside the scrollbar gutter of that element?
  function inScrollbarZone(el: HTMLElement, clientX: number, clientY: number): boolean {
    const rect = el.getBoundingClientRect();

    let vSW = el.offsetWidth - el.clientWidth;
    let hSW = el.offsetHeight - el.clientHeight; 

    if (vSW <= 0) vSW = 14;
    if (hSW <= 0) hSW = 14;

    const inRight = clientX >= rect.right - vSW && clientX <= rect.right;
    const inBottom = clientY >= rect.bottom - hSW && clientY <= rect.bottom;

    const cs = window.getComputedStyle(el);
    const vertPossible = (cs.overflowY === 'auto' || cs.overflowY === 'scroll') && el.scrollHeight > el.clientHeight;
    const horzPossible = (cs.overflowX === 'auto' || cs.overflowX === 'scroll') && el.scrollWidth > el.clientWidth;

    return (vertPossible && inRight) || (horzPossible && inBottom);
  }

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;
      setCoords({ x, y });

      // Detect interactive tags - check element and its parents
      let target = e.target as HTMLElement | null;
      const interactive = ['a', 'button', 'input', 'label', 'select', 'textarea', 'summary'];
      let isInteractive = false;

      for (let i = 0; i < 5 && target; i++) {
        const tag = target.tagName?.toLowerCase();
        if (tag && interactive.includes(tag)) {
          isInteractive = true;
          break;
        }
        target = target.parentElement;
      }

      setHovered(isInteractive);

      const el = document.elementFromPoint(x, y) as HTMLElement | null;
      const scrollable = getScrollableAncestor(el);
      if (scrollable && inScrollbarZone(scrollable, x, y)) {
        setOverScrollbar(true);
      } else {
        setOverScrollbar(false);
      }
    };

    const down = () => setClicked(true);
    const up   = () => setClicked(false);

    document.addEventListener('mousemove', move);
    document.addEventListener('mousedown', down);
    document.addEventListener('mouseup',   up);

    return () => {
      document.removeEventListener('mousemove', move);
      document.removeEventListener('mousedown', down);
      document.removeEventListener('mouseup',   up);
    };
  }, []);

  const classes = [
    styles.cursor,
    'customCursor',
    hovered ? styles.hovered : '',
    clicked ? styles.clicked : '',
    overScrollbar ? styles.hidden : '' 
  ].join(' ');

  return <div className={classes} style={{ left: coords.x, top: coords.y }} />;
}
