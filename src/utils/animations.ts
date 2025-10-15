/**
 * Framer Motion Animation Variants
 * Reusable animation configurations for consistent motion design
 */

import { Variants } from 'framer-motion';

// Standard timing (300ms - noticeable but not aggressive)
const standardDuration = 0.3;
const slowDuration = 0.4;
const fastDuration = 0.2;

/**
 * Fade In - Element appears with opacity
 */
export const fadeIn: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Fade In Up - Element fades in while moving up
 */
export const fadeInUp: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: slowDuration, ease: 'easeOut' } },
  exit: { opacity: 0, y: -20, transition: { duration: fastDuration, ease: 'easeIn' } },
};

/**
 * Fade In Down - Element fades in while moving down
 */
export const fadeInDown: Variants = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0, transition: { duration: slowDuration, ease: 'easeOut' } },
  exit: { opacity: 0, y: 20, transition: { duration: fastDuration, ease: 'easeIn' } },
};

/**
 * Scale In - Element scales from 95% to 100%
 */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: standardDuration, ease: 'easeOut' } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: fastDuration, ease: 'easeIn' } },
};

/**
 * Slide In Right - Element slides in from right
 */
export const slideInRight: Variants = {
  initial: { x: 100, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: standardDuration, ease: 'easeOut' } },
  exit: { x: -100, opacity: 0, transition: { duration: standardDuration, ease: 'easeIn' } },
};

/**
 * Slide In Left - Element slides in from left
 */
export const slideInLeft: Variants = {
  initial: { x: -100, opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: standardDuration, ease: 'easeOut' } },
  exit: { x: 100, opacity: 0, transition: { duration: standardDuration, ease: 'easeIn' } },
};

/**
 * Slide Up - Element slides up from bottom
 */
export const slideUp: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { duration: slowDuration, ease: [0.32, 0.72, 0, 1] } },
  exit: { y: '100%', transition: { duration: standardDuration, ease: [0.32, 0.72, 0, 1] } },
};

/**
 * Stagger Container - Parent container for staggered children
 */
export const staggerContainer: Variants = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

/**
 * Stagger Item - Child element in stagger sequence
 */
export const staggerItem: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: slowDuration, ease: 'easeOut' } },
};

/**
 * Hover Scale - Subtle scale on hover
 */
export const hoverScale = {
  whileHover: { scale: 1.02, transition: { duration: fastDuration } },
  whileTap: { scale: 0.98, transition: { duration: 0.1 } },
};

/**
 * Hover Lift - Card lift effect
 */
export const hoverLift = {
  whileHover: {
    y: -8,
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
    transition: { duration: standardDuration, ease: 'easeOut' },
  },
};

/**
 * Modal Backdrop - Backdrop animation for modals
 */
export const modalBackdrop: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: standardDuration } },
  exit: { opacity: 0, transition: { duration: fastDuration } },
};

/**
 * Modal Content - Modal content animation
 */
export const modalContent: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: standardDuration, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: { duration: fastDuration, ease: 'easeIn' },
  },
};

/**
 * Drawer - Slide up from bottom (mobile modals)
 */
export const drawer: Variants = {
  initial: { y: '100%' },
  animate: { y: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
  exit: { y: '100%', transition: { duration: standardDuration, ease: 'easeInOut' } },
};

/**
 * Page Transition - Page-level transitions
 */
export const pageTransition: Variants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0, transition: { duration: slowDuration, ease: 'easeOut' } },
  exit: { opacity: 0, x: 20, transition: { duration: standardDuration, ease: 'easeIn' } },
};

/**
 * Dropdown Menu - Dropdown animation
 */
export const dropdownMenu: Variants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { duration: fastDuration, ease: 'easeOut' } },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15, ease: 'easeIn' } },
};

/**
 * Toast - Toast notification animation
 */
export const toast: Variants = {
  initial: { opacity: 0, y: -20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 500, damping: 30 } },
  exit: { opacity: 0, scale: 0.95, transition: { duration: fastDuration } },
};

/**
 * Number Count Up - For animated number displays
 */
export const numberCountUp = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1, transition: { duration: standardDuration } },
};

/**
 * Skeleton Pulse - Loading skeleton animation
 */
export const skeletonPulse = {
  initial: { opacity: 0.6 },
  animate: {
    opacity: [0.6, 1, 0.6],
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' },
  },
};

/**
 * Icon Bounce - Subtle bounce for icons
 */
export const iconBounce = {
  whileHover: {
    y: [0, -5, 0],
    transition: { duration: 0.5, ease: 'easeInOut' },
  },
};

/**
 * Icon Rotate - Rotation on hover
 */
export const iconRotate = {
  whileHover: {
    rotate: 15,
    transition: { duration: fastDuration },
  },
};

/**
 * Pulse - Subtle pulse animation
 */
export const pulse = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [1, 0.8, 1],
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
};

/**
 * Tab Switch - Tab content switching
 */
export const tabSwitch: Variants = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0, transition: { duration: standardDuration } },
  exit: { opacity: 0, x: -20, transition: { duration: fastDuration } },
};

/**
 * Expand - Height expand animation
 */
export const expand: Variants = {
  initial: { height: 0, opacity: 0 },
  animate: { height: 'auto', opacity: 1, transition: { duration: standardDuration, ease: 'easeOut' } },
  exit: { height: 0, opacity: 0, transition: { duration: fastDuration, ease: 'easeIn' } },
};

/**
 * Spring Configs - Reusable spring configurations
 */
export const springConfigs = {
  gentle: { type: 'spring' as const, stiffness: 300, damping: 30 },
  snappy: { type: 'spring' as const, stiffness: 500, damping: 30 },
  bouncy: { type: 'spring' as const, stiffness: 400, damping: 20 },
};

