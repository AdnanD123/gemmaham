---
name: motion
description: Add animations and micro-interactions using Framer Motion (motion). Use when adding page transitions, card animations, loading effects, hover interactions, scroll animations, or any motion to the UI. Produces smooth, performant animations that match the neobrutalism design system.
argument-hint: <what to animate>
---

# Framer Motion (Motion) Animation Skill for Gemmaham

You are an expert at adding animations and micro-interactions to React applications using **Motion** (formerly Framer Motion). You create smooth, purposeful animations that enhance UX without being distracting.

**Install**: `npm install motion` (or `npm install framer-motion` for older API)

## Import

```tsx
import { motion, AnimatePresence } from "motion/react";
// or for older framer-motion:
// import { motion, AnimatePresence } from "framer-motion";
```

## Animation Patterns for Gemmaham

### 1. Page Transitions

Wrap route content with AnimatePresence for smooth page enter/exit:

```tsx
// In layout or route wrapper
import { motion, AnimatePresence } from "motion/react";
import { useLocation } from "react-router";

export function AnimatedOutlet({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

### 2. Property Card Grid — Staggered Entrance

Cards appear one by one when the page loads or filters change:

```tsx
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: "easeOut" },
  },
};

// Usage
<motion.div
  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
  variants={containerVariants}
  initial="hidden"
  animate="show"
  key={filterKey} // Re-trigger animation when filters change
>
  {properties.map((property) => (
    <motion.div key={property.id} variants={cardVariants}>
      <PropertyCard property={property} />
    </motion.div>
  ))}
</motion.div>
```

### 3. Card Hover — Neobrutalism Lift

Cards lift and shadow grows on hover (matches neobrutalism aesthetic):

```tsx
<motion.div
  whileHover={{
    y: -4,
    boxShadow: "6px 6px 0px 0px rgba(0, 0, 0, 1)",
    transition: { duration: 0.15 },
  }}
  whileTap={{
    y: 0,
    boxShadow: "2px 2px 0px 0px rgba(0, 0, 0, 1)",
    transition: { duration: 0.1 },
  }}
  className="bg-surface rounded-3xl shadow-neobrutalism cursor-pointer"
>
  {/* Card content */}
</motion.div>
```

### 4. Dashboard Stat Counter — Animated Numbers

Numbers count up when the dashboard loads:

```tsx
import { useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useState } from "react";

export function AnimatedCounter({ value, duration = 1 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return controls.stop;
  }, [value, duration]);

  return <span>{display.toLocaleString()}</span>;
}

// Usage
<h2 className="text-3xl font-serif font-bold">
  <AnimatedCounter value={totalRevenue} />€
</h2>
```

### 5. Modal / Dialog — Spring Open/Close

Smooth spring animation instead of instant show/hide:

```tsx
<AnimatePresence>
  {isOpen && (
    <>
      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      {/* Content */}
      <motion.div
        className="fixed inset-0 flex items-center justify-center z-50"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
      >
        {children}
      </motion.div>
    </>
  )}
</AnimatePresence>
```

### 6. Notification Bell — Shake + Badge Pop

Bell icon shakes when new notification arrives, badge pops in:

```tsx
<motion.button
  animate={hasNew ? { rotate: [0, -10, 10, -10, 10, 0] } : {}}
  transition={{ duration: 0.4 }}
>
  <BellIcon />
  <AnimatePresence>
    {unreadCount > 0 && (
      <motion.span
        className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        transition={{ type: "spring", damping: 15, stiffness: 400 }}
      >
        {unreadCount}
      </motion.span>
    )}
  </AnimatePresence>
</motion.button>
```

### 7. Toast Notifications — Slide In/Out

Toasts slide in from the right and out:

```tsx
<motion.div
  initial={{ opacity: 0, x: 100, scale: 0.9 }}
  animate={{ opacity: 1, x: 0, scale: 1 }}
  exit={{ opacity: 0, x: 100, scale: 0.9 }}
  transition={{ type: "spring", damping: 20, stiffness: 300 }}
  className="bg-surface shadow-neobrutalism rounded-xl p-4"
>
  {/* Toast content */}
</motion.div>
```

### 8. Progress Bar — Animated Fill

Progress bars animate smoothly when value changes:

```tsx
<div className="h-2 bg-surface-highlight rounded-full overflow-hidden">
  <motion.div
    className="h-full bg-primary rounded-full"
    initial={{ width: 0 }}
    animate={{ width: `${percent}%` }}
    transition={{ duration: 0.6, ease: "easeOut" }}
  />
</div>
```

### 9. Skeleton Shimmer — Loading Effect

Upgrade from basic pulse to shimmer:

```tsx
export function Shimmer({ className }: { className?: string }) {
  return (
    <motion.div
      className={`bg-surface-highlight rounded-xl overflow-hidden relative ${className}`}
      initial={{ backgroundPosition: "-200% 0" }}
      animate={{ backgroundPosition: "200% 0" }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      style={{
        backgroundImage:
          "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)",
        backgroundSize: "200% 100%",
      }}
    />
  );
}
```

### 10. List Item — Swipe to Delete / Drag to Reorder

For Kanban cards or list items:

```tsx
<motion.div
  layout // Smooth reflow when items change
  initial={{ opacity: 0, height: 0 }}
  animate={{ opacity: 1, height: "auto" }}
  exit={{ opacity: 0, height: 0, x: -100 }}
  transition={{ duration: 0.2 }}
>
  {/* List item content */}
</motion.div>
```

### 11. Scroll-Triggered Reveal

Elements fade in as they enter the viewport (great for landing page):

```tsx
import { motion, useInView } from "motion/react";
import { useRef } from "react";

export function ScrollReveal({ children }: { children: React.ReactNode }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}
```

### 12. Tab Content — Slide Between Tabs

Content slides left/right when switching tabs:

```tsx
const [direction, setDirection] = useState(0);

<AnimatePresence mode="wait" custom={direction}>
  <motion.div
    key={activeTab}
    custom={direction}
    initial={{ opacity: 0, x: direction > 0 ? 100 : -100 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: direction > 0 ? -100 : 100 }}
    transition={{ duration: 0.2 }}
  >
    {tabContent}
  </motion.div>
</AnimatePresence>
```

## Animation Guidelines for Gemmaham

### DO:
- **Entrance animations**: Stagger cards on grid load (0.05-0.08s between)
- **Hover states**: Lift + shadow grow on cards (neobrutalism press effect)
- **Page transitions**: Subtle fade + slide (200-300ms)
- **Number counters**: Count up on dashboard load
- **Progress bars**: Smooth fill animation
- **Modals**: Spring open, fade close
- **Notifications**: Slide in, badge pop
- **Loading**: Shimmer effect instead of pulse

### DON'T:
- No animations longer than 500ms (feels sluggish)
- No bouncy springs on data-heavy pages (distracting)
- No animation on every single element (overwhelming)
- No blocking animations (user should never wait for animation to finish)
- No animation that hides content or delays interaction
- Reduce motion for `prefers-reduced-motion` users:

```tsx
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

// Use simpler transitions or disable animations
transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
```

### Performance:
- Use `layout` prop sparingly (expensive on large lists)
- Prefer `opacity` and `transform` animations (GPU-accelerated)
- Avoid animating `width`, `height`, `top`, `left` (triggers layout reflow)
- Use `will-change: transform` for frequently animated elements
- Wrap AnimatePresence around conditionally rendered elements only

## Workflow

When asked to add animations:

1. Install motion if not already: `npm install motion`
2. Identify the right pattern from above
3. Apply with Gemmaham theme tokens (shadow-neobrutalism, bg-primary, etc.)
4. Respect `prefers-reduced-motion`
5. Keep durations short (150-300ms for interactions, 300-500ms for page transitions)
6. Test that animations don't block user interaction
