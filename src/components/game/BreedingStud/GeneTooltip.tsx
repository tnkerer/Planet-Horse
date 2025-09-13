import React from 'react';
import styles from './geneTooltip.module.scss';

type Props = { visible: boolean; x: number; y: number; title: string; desc: string };

const GeneTooltip: React.FC<Props> = ({ visible, x, y, title, desc }) => {
  if (!visible) return null;
  return (
    <div
      className={styles.tooltip}
      style={{ left: x, top: y }}
      role="tooltip"
      aria-hidden={!visible}
    >
      <div className={styles.title}>{title}</div>
      <div className={styles.desc}>{desc}</div>
    </div>
  );
};

export default GeneTooltip;
