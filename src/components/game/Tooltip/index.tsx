import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';

interface Props {
  children: React.ReactNode;
  x: number;
  y: number;
  visible: boolean;
}

const Tooltip: React.FC<Props> = ({ children, x, y, visible }) => {
  const [container] = useState(() => document.createElement('div'));

  useEffect(() => {
    document.body.appendChild(container);
    return () => {
      document.body.removeChild(container);
    };
  }, [container]);

  if (!visible) return null;

return ReactDOM.createPortal(
  <div
    style={{
      position: 'fixed',
      left: x,
      top: y,
      zIndex: 9999,
      pointerEvents: 'none',
    }}
  >
    {children}
  </div>,
  container
);
};

export default Tooltip;
