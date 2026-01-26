/**
 * Animation utilities for interactive proof mode.
 * Provides smooth transitions for tactic application and goal completion.
 */

/**
 * Animate an element's appearance with a fade and scale effect.
 */
export function animateAppear(element: HTMLElement | SVGElement, duration = 300): Promise<void> {
  return new Promise((resolve) => {
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';
    element.style.transition = `opacity ${duration}ms ease-out, transform ${duration}ms ease-out`;

    // Force reflow
    if (element instanceof HTMLElement) {
      element.offsetHeight;
    } else {
      element.getBoundingClientRect();
    }

    element.style.opacity = '1';
    element.style.transform = 'scale(1)';

    setTimeout(() => {
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Animate an element's disappearance with a fade and scale effect.
 */
export function animateDisappear(element: HTMLElement | SVGElement, duration = 300): Promise<void> {
  return new Promise((resolve) => {
    element.style.transition = `opacity ${duration}ms ease-in, transform ${duration}ms ease-in`;
    element.style.opacity = '0';
    element.style.transform = 'scale(0.8)';

    setTimeout(() => {
      element.style.display = 'none';
      element.style.transition = '';
      resolve();
    }, duration);
  });
}

/**
 * Animate a success completion effect (green pulse).
 */
export function animateSuccess(element: HTMLElement | SVGElement, duration = 500): Promise<void> {
  return new Promise((resolve) => {
    const rect = element.querySelector('rect') || element;
    const originalFill = rect.getAttribute?.('fill') || (rect as HTMLElement).style.backgroundColor;

    // Add pulse class
    element.classList.add('success-pulse');

    setTimeout(() => {
      element.classList.remove('success-pulse');
      resolve();
    }, duration);
  });
}

/**
 * Animate an error feedback effect (red shake).
 */
export function animateError(element: HTMLElement | SVGElement, duration = 400): Promise<void> {
  return new Promise((resolve) => {
    element.classList.add('error-shake');

    setTimeout(() => {
      element.classList.remove('error-shake');
      resolve();
    }, duration);
  });
}

/**
 * Animate connecting line between parent and child node.
 */
export function animateEdge(
  svg: SVGSVGElement,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  duration = 400
): Promise<SVGPathElement> {
  return new Promise((resolve) => {
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    // Calculate control points for bezier curve
    const midY = (fromY + toY) / 2;
    const d = `M ${fromX} ${fromY} C ${fromX} ${midY}, ${toX} ${midY}, ${toX} ${toY}`;

    path.setAttribute('d', d);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke', '#475569');
    path.setAttribute('stroke-width', '2');

    // Animate stroke
    const length = path.getTotalLength();
    path.setAttribute('stroke-dasharray', String(length));
    path.setAttribute('stroke-dashoffset', String(length));

    svg.appendChild(path);

    // Trigger animation
    requestAnimationFrame(() => {
      path.style.transition = `stroke-dashoffset ${duration}ms ease-out`;
      path.setAttribute('stroke-dashoffset', '0');
    });

    setTimeout(() => {
      path.style.transition = '';
      resolve(path);
    }, duration);
  });
}

/**
 * Create a ghost element for drag preview.
 */
export function createDragGhost(tacticName: string, color: string): HTMLElement {
  const ghost = document.createElement('div');
  ghost.className = 'tactic-drag-ghost';
  ghost.textContent = tacticName;
  ghost.style.cssText = `
    position: fixed;
    padding: 8px 16px;
    background: ${color};
    color: white;
    border-radius: 6px;
    font-family: Menlo, 'Fira Code', monospace;
    font-size: 13px;
    font-weight: 600;
    pointer-events: none;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transform: translate(-50%, -50%);
    opacity: 0.9;
  `;
  return ghost;
}

/**
 * Highlight a drop zone as valid or invalid.
 */
export function highlightDropZone(element: SVGElement, valid: boolean): void {
  element.classList.remove('drop-zone--valid', 'drop-zone--invalid');
  element.classList.add(valid ? 'drop-zone--valid' : 'drop-zone--invalid');
}

/**
 * Clear drop zone highlighting.
 */
export function clearDropZoneHighlight(element: SVGElement): void {
  element.classList.remove('drop-zone--valid', 'drop-zone--invalid');
}

/**
 * Animate a subgoal appearing after tactic application.
 */
export function animateSubgoalAppear(
  container: SVGGElement,
  delay = 0
): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      animateAppear(container as SVGElement, 300).then(resolve);
    }, delay);
  });
}

/**
 * Create staggered animation for multiple subgoals.
 */
export async function animateSubgoalsAppear(
  containers: SVGGElement[],
  staggerDelay = 100
): Promise<void> {
  const promises = containers.map((container, index) =>
    animateSubgoalAppear(container, index * staggerDelay)
  );
  await Promise.all(promises);
}

/**
 * Animate proof completion celebration.
 */
export function animateProofComplete(container: HTMLElement): Promise<void> {
  return new Promise((resolve) => {
    // Add celebration class
    container.classList.add('proof-complete-celebration');

    // Create confetti-like particles
    for (let i = 0; i < 20; i++) {
      createConfettiParticle(container, i * 50);
    }

    setTimeout(() => {
      container.classList.remove('proof-complete-celebration');
      resolve();
    }, 2000);
  });
}

/**
 * Create a single confetti particle.
 */
function createConfettiParticle(container: HTMLElement, delay: number): void {
  const particle = document.createElement('div');
  particle.className = 'confetti-particle';
  particle.style.cssText = `
    position: absolute;
    width: 8px;
    height: 8px;
    background: hsl(${Math.random() * 360}, 70%, 60%);
    border-radius: 2px;
    pointer-events: none;
    left: 50%;
    top: 50%;
    animation: confetti-fall 1.5s ease-out ${delay}ms forwards;
    transform: translate(-50%, -50%);
  `;

  container.appendChild(particle);

  setTimeout(() => {
    particle.remove();
  }, 2000 + delay);
}
