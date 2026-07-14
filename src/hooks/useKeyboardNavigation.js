import { useEffect, useRef } from 'react';

/**
 * Custom hook for keyboard navigation in dropdowns
 * Supports ArrowUp, ArrowDown, Enter, Escape
 */
export const useKeyboardNavigation = (
  isOpen,
  onClose,
  items = [],
  onSelect,
  disabled = false
) => {
  const containerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (!isOpen || disabled) return;

    const handleKeyDown = (e) => {
      if (!containerRef.current) return;

      const focusableItems = itemRefs.current.filter(ref => ref && !ref.disabled);
      const currentIndex = focusableItems.findIndex(ref => ref === document.activeElement);

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          const nextIndex = currentIndex < focusableItems.length - 1 ? currentIndex + 1 : 0;
          focusableItems[nextIndex]?.focus();
          break;

        case 'ArrowUp':
          e.preventDefault();
          const prevIndex = currentIndex > 0 ? currentIndex - 1 : focusableItems.length - 1;
          focusableItems[prevIndex]?.focus();
          break;

        case 'Enter':
          e.preventDefault();
          if (currentIndex >= 0 && items[currentIndex] && onSelect) {
            onSelect(items[currentIndex]);
            onClose();
          }
          break;

        case 'Escape':
          e.preventDefault();
          onClose();
          break;

        default:
          break;
      }
    };

    const container = containerRef.current;
    if (!container) return;
    
    container.addEventListener('keydown', handleKeyDown);

    // Focus first item when dropdown opens
    if (itemRefs.current.length > 0) {
      setTimeout(() => {
        const firstFocusable = itemRefs.current.find(ref => ref && !ref.disabled);
        firstFocusable?.focus();
      }, 0);
    }

    return () => {
      if (container) {
        container.removeEventListener('keydown', handleKeyDown);
      }
    };
  }, [isOpen, disabled, items, onSelect, onClose]);

  return { containerRef, itemRefs };
};

export default useKeyboardNavigation;

