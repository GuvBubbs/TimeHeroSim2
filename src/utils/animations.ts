/**
 * Animation Configuration for Phase 7 Polish
 * Enhanced transitions and visual feedback
 */

export const ANIMATION_CONFIG = {
  // Timing presets
  timing: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    veryLow: 800
  },

  // Easing curves for different scenarios
  easing: {
    // Standard material design easing
    standard: 'cubic-bezier(0.4, 0.0, 0.2, 1)',
    
    // Deceleration for entrances
    decelerate: 'cubic-bezier(0.0, 0.0, 0.2, 1)',
    
    // Acceleration for exits
    accelerate: 'cubic-bezier(0.4, 0.0, 1, 1)',
    
    // Spring bounce for playful interactions
    spring: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    
    // Smooth for continuous animations
    smooth: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
  },

  // Stagger delays for cascading effects
  stagger: {
    highlight: 50,     // Delay between cascading highlights
    connection: 25,    // Delay between connection animations
    modal: 100,        // Delay for modal elements
    tooltip: 75        // Delay for tooltip reveals
  },

  // Animation states
  states: {
    node: {
      default: {
        scale: 1,
        opacity: 1,
        transform: 'translateY(0px)'
      },
      hover: {
        scale: 1.02,
        opacity: 1,
        transform: 'translateY(-2px)'
      },
      selected: {
        scale: 1.05,
        opacity: 1,
        transform: 'translateY(-3px)'
      },
      dimmed: {
        scale: 0.98,
        opacity: 0.3,
        transform: 'translateY(0px)'
      }
    },
    connection: {
      default: {
        opacity: 0.6,
        strokeWidth: 2
      },
      highlighted: {
        opacity: 1,
        strokeWidth: 3
      },
      dimmed: {
        opacity: 0.2,
        strokeWidth: 1
      }
    }
  }
}

// CSS custom properties generator
export function generateAnimationCSS(): string {
  return `
    :root {
      --animation-fast: ${ANIMATION_CONFIG.timing.fast}ms;
      --animation-normal: ${ANIMATION_CONFIG.timing.normal}ms;
      --animation-slow: ${ANIMATION_CONFIG.timing.slow}ms;
      
      --easing-standard: ${ANIMATION_CONFIG.easing.standard};
      --easing-decelerate: ${ANIMATION_CONFIG.easing.decelerate};
      --easing-accelerate: ${ANIMATION_CONFIG.easing.accelerate};
      --easing-spring: ${ANIMATION_CONFIG.easing.spring};
      
      --stagger-highlight: ${ANIMATION_CONFIG.stagger.highlight}ms;
      --stagger-connection: ${ANIMATION_CONFIG.stagger.connection}ms;
    }
  `
}

// Animation utility functions
export function createStaggerDelay(index: number, baseDelay: number = ANIMATION_CONFIG.stagger.highlight): string {
  return `${index * baseDelay}ms`
}

export function getAnimationClasses(state: 'default' | 'hover' | 'selected' | 'dimmed'): string {
  const baseClasses = 'transition-all duration-300'
  
  switch (state) {
    case 'hover':
      return `${baseClasses} ease-out transform scale-102 -translate-y-0.5`
    case 'selected':
      return `${baseClasses} ease-out transform scale-105 -translate-y-1`
    case 'dimmed':
      return `${baseClasses} ease-in-out opacity-30 scale-98`
    default:
      return `${baseClasses} ease-in-out`
  }
}

// Progressive connection drawing
export function animateConnectionDraw(pathElement: SVGPathElement, duration: number = 500): Promise<void> {
  return new Promise((resolve) => {
    const pathLength = pathElement.getTotalLength()
    
    // Set up initial state
    pathElement.style.strokeDasharray = `${pathLength}`
    pathElement.style.strokeDashoffset = `${pathLength}`
    
    // Animate the drawing
    const animation = pathElement.animate([
      { strokeDashoffset: pathLength },
      { strokeDashoffset: 0 }
    ], {
      duration,
      easing: ANIMATION_CONFIG.easing.decelerate,
      fill: 'forwards'
    })
    
    animation.addEventListener('finish', () => {
      // Clean up dash styles after animation
      pathElement.style.strokeDasharray = ''
      pathElement.style.strokeDashoffset = ''
      resolve()
    })
  })
}

// Staggered highlight animation
export function createHighlightSequence(
  nodeIds: string[], 
  callback: (nodeId: string, delay: number) => void
): void {
  nodeIds.forEach((nodeId, index) => {
    const delay = index * ANIMATION_CONFIG.stagger.highlight
    setTimeout(() => callback(nodeId, delay), delay)
  })
}

// Smooth modal transitions
export function modalEnterTransition(): string {
  return `
    transition: all ${ANIMATION_CONFIG.timing.normal}ms ${ANIMATION_CONFIG.easing.decelerate};
    transform: translateY(-20px) scale(0.95);
    opacity: 0;
  `
}

export function modalEnterActiveTransition(): string {
  return `
    transform: translateY(0) scale(1);
    opacity: 1;
  `
}

export function modalLeaveTransition(): string {
  return `
    transition: all ${ANIMATION_CONFIG.timing.fast}ms ${ANIMATION_CONFIG.easing.accelerate};
    transform: translateY(-10px) scale(0.98);
    opacity: 0;
  `
}
