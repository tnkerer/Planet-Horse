// src/components/Tooltip/index.tsx
import React, { ReactNode, useLayoutEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
import styles from './styles.module.scss';

interface TooltipProps {
  anchorRect: DOMRect | null; // the bounding‐box of the slot we're hovering
  children: ReactNode;
}

const Tooltip: React.FC<TooltipProps> = ({ anchorRect, children }) => {
  const [container] = useState(() => {
    // create a div under document.body for all tooltips
    const div = document.createElement('div');
    document.body.appendChild(div);
    return div;
  });

  // Clean up after ourselves if this Tooltip is ever unmounted
  useLayoutEffect(() => {
    return () => {
      if (container.parentNode) {
        container.parentNode.removeChild(container);
      }
    };
  }, [container]);

  if (!anchorRect) {
    return null;
  }

  // Position the tooltip above the anchorRect
  // You can tweak offsets here (e.g. 6px above, center horizontally)
  const tooltipStyle: React.CSSProperties = {
    position: 'absolute',
    top: anchorRect.top - 6, // 6px above the slot
    left: anchorRect.left + anchorRect.width / 2,
    transform: 'translateX(-50%) translateY(-100%)',
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div className={styles.tooltip} style={tooltipStyle}>
      {children}
    </div>,
    container
  );
};

export default Tooltip;
