import { Children, isValidElement, cloneElement, useRef } from 'react';
import { useInView, useReducedMotion } from 'motion/react';

// Preserve complete words (and Arabic joining), while fading Latin letters in sequence.
export default function TypedReveal({ children }) {
  const ref = useRef(null), reduce = useReducedMotion();
  const visible = useInView(ref, { once: true, amount: .25 });
  let index = 0;
  function render(nodes) {
    return Children.map(nodes, child => {
      if (typeof child === 'string' || typeof child === 'number') {
        return String(child).split(/(\s+)/).map((word, w) => {
          if (/^\s+$/.test(word)) return word;
          if (/[\u0600-\u06ff]/.test(word)) return <span key={w} className="typed-word typed-letter" style={{ '--order': index++ }}>{word}</span>;
          return <span key={w} className="typed-word">{Array.from(word).map((char, c) => <span key={c} className="typed-letter" style={{ '--order': index++ }}>{char}</span>)}</span>;
        });
      }
      return isValidElement(child) && child.props.children ? cloneElement(child, {}, render(child.props.children)) : child;
    });
  }
  return <span ref={ref} className={'typed-reveal ' + (visible || reduce ? 'is-visible' : '')}><span className="typed-accessible">{children}</span><span aria-hidden="true">{render(children)}</span></span>;
}
export function AnimatedHeading({ as: Tag = 'h2', children, ...props }) {
  return <Tag {...props}><TypedReveal>{children}</TypedReveal></Tag>;
}
