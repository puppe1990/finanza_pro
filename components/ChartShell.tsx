import React, { useEffect, useRef, useState } from 'react';

interface ChartShellProps {
  className?: string;
  children: React.ReactNode;
}

const ChartShell: React.FC<ChartShellProps> = ({ className, children }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    if (typeof ResizeObserver === 'undefined') {
      setIsReady(true);
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) {
        setIsReady(true);
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} className={className}>
      {isReady ? children : null}
    </div>
  );
};

export default ChartShell;
