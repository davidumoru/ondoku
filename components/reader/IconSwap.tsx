const SWAP_EASE = "cubic-bezier(0.2, 0, 0, 1)";

function swapStyle(visible: boolean): React.CSSProperties {
  return {
    opacity: visible ? 1 : 0,
    transform: `scale(${visible ? 1 : 0.25})`,
    filter: `blur(${visible ? 0 : 4}px)`,
    transition: `opacity 200ms ${SWAP_EASE}, transform 200ms ${SWAP_EASE}, filter 200ms ${SWAP_EASE}`,
  };
}

interface Props {
  base: React.ReactNode;
  alt: React.ReactNode;
  showAlt: boolean;
}

export function IconSwap({ base, alt, showAlt }: Props) {
  return (
    <span className="relative inline-flex w-4 h-4 items-center justify-center">
      <span
        className="absolute inset-0 inline-flex items-center justify-center"
        style={swapStyle(!showAlt)}
      >
        {base}
      </span>
      <span
        className="absolute inset-0 inline-flex items-center justify-center"
        style={swapStyle(showAlt)}
      >
        {alt}
      </span>
    </span>
  );
}
