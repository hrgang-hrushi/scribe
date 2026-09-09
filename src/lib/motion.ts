/**
 * Centralized Motion & Spring Physics System
 *
 * Defines Apple-style fluid motion curves and critically damped spring
 * physics used uniformly across Scribe for buttery, natural transitions.
 */

export const fluidEase = [0.16, 1, 0.3, 1] as const;

/**
 * Critically damped fluid spring:
 * Fast initial acceleration, smooth deceleration, zero overshoot/bounce.
 */
export const fluidSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

/**
 * Snappy micro-spring:
 * High responsiveness for toolbars, buttons, icons, and quick toggles.
 */
export const snappySpring = {
  type: 'spring' as const,
  stiffness: 420,
  damping: 32,
  mass: 0.6,
};

/**
 * Gentle large-surface spring:
 * For broad canvas shifts, sheet openings, and split screens.
 */
export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 220,
  damping: 28,
  mass: 1.0,
};

/**
 * Modal & dialog overlay backdrop animation variants
 */
export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.28, ease: fluidEase },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2, ease: fluidEase },
  },
};

/**
 * Modal & dialog card content animation variants
 */
export const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.94, y: 14 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: fluidSpring,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 8,
    transition: { duration: 0.2, ease: fluidEase },
  },
};

/**
 * Dropdown & popover animation variants
 */
export const popoverVariants = {
  hidden: { opacity: 0, scale: 0.92, y: -8 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: snappySpring,
  },
  exit: {
    opacity: 0,
    scale: 0.94,
    y: -4,
    transition: { duration: 0.15, ease: fluidEase },
  },
};

/**
 * Slide-in sheet variants
 */
export const sheetVariants = {
  hidden: { opacity: 0, y: '100%' },
  visible: {
    opacity: 1,
    y: 0,
    transition: fluidSpring,
  },
  exit: {
    opacity: 0,
    y: '100%',
    transition: { duration: 0.25, ease: fluidEase },
  },
};
