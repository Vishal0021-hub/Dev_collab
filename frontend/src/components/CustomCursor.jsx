import { useEffect, useState } from "react";

const CustomCursor = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [isHidden, setIsHidden] = useState(true);

  useEffect(() => {
    const handleMouseMove = (e) => {
      setPosition({ x: e.clientX, y: e.clientY });
      if (isHidden) setIsHidden(false);

      const target = e.target;
      const clickable = target.closest('button, a, input, select, textarea, [role="button"]');
      setIsHovering(!!clickable);
    };

    const handleMouseLeave = () => setIsHidden(true);
    const handleMouseEnter = () => setIsHidden(false);

    window.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("mouseenter", handleMouseEnter);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, [isHidden]);

  if (isHidden) return null;

  return (
    <>
      <div 
        className={`dc-custom-cursor ${isHovering ? 'hover' : ''}`}
        style={{ left: position.x, top: position.y }} 
      />
      <div 
        className={`dc-custom-cursor-ring ${isHovering ? 'hover' : ''}`}
        style={{ left: position.x, top: position.y }} 
      />
    </>
  );
};

export default CustomCursor;
