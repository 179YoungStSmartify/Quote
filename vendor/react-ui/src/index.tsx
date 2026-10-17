import React from "react";
import { Dialog } from "radix-ui";
const links = [
  ["Overview", "#overview"],
  ["Scope", "#scope"],
  ["Details", "#terms"],
];
export function Shell({ children }: { children: React.ReactNode }) {
  const navigationTarget = React.useRef<string | null>(null);
  const [showBackToTop, setShowBackToTop] = React.useState(false);
  React.useEffect(() => {
    const update = () => {
      const visible = window.scrollY > 480;
      if (
        !visible &&
        document.activeElement?.classList.contains("back-to-top")
      ) {
        document.getElementById("main")?.focus({ preventScroll: true });
      }
      setShowBackToTop(visible);
    };
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="topbar">
        <a className="brand" href="#top">
          <span className="brand-mark">P</span>
          <span>
            Perspective Living<small>SMART HOME & NETWORKS</small>
          </span>
        </a>
        <nav className="nav" aria-label="Main navigation">
          {links.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>
        <Dialog.Root>
          <Dialog.Trigger asChild>
            <button
              className="menu-trigger"
              type="button"
              aria-label="Open navigation"
            >
              Menu
            </button>
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="mobile-overlay" />
            <Dialog.Content
              className="mobile-panel"
              aria-describedby={undefined}
              onCloseAutoFocus={(event) => {
                const id = navigationTarget.current;
                navigationTarget.current = null;
                if (!id) return; // Escape/Close restores focus to the trigger normally.
                event.preventDefault();
                const target = document.getElementById(id);
                if (target) {
                  target.tabIndex = -1;
                  target.focus({ preventScroll: true });
                  target.scrollIntoView({ block: "start" });
                }
              }}
            >
              <Dialog.Title>Navigate this page</Dialog.Title>
              <nav aria-label="Mobile navigation">
                {links.map(([label, href]) => (
                  <Dialog.Close asChild key={href}>
                    <a
                      href={href}
                      onClick={() => {
                        navigationTarget.current = href.slice(1);
                      }}
                    >
                      {label}
                    </a>
                  </Dialog.Close>
                ))}
              </nav>
              <Dialog.Close asChild>
                <button className="mobile-close" type="button">
                  Close navigation
                </button>
              </Dialog.Close>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>
      <div className="shell" id="top">
        <main id="main" tabIndex={-1}>
          {children}
        </main>
        <footer className="footer">Thoughtfully connected living.</footer>
      </div>
      <BackToTop visible={showBackToTop} />
    </>
  );
}
export function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  const sectionRef = React.useRef<HTMLElement>(null);
  const [entered, setEntered] = React.useState(false);
  React.useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let observer: IntersectionObserver | undefined;
    const syncMotion = () => {
      observer?.disconnect();
      observer = undefined;
      if (motion.matches || !("IntersectionObserver" in window)) return;
      observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setEntered(true);
            observer?.disconnect();
            observer = undefined;
          }
        },
        { threshold: 0.08 },
      );
      observer.observe(section);
    };
    syncMotion();
    motion.addEventListener("change", syncMotion);
    return () => {
      motion.removeEventListener("change", syncMotion);
      observer?.disconnect();
    };
  }, []);
  return (
    <section
      ref={sectionRef}
      className={`section${entered ? " section-entered" : ""}`}
      id={id}
    >
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function BackToTop({ visible }: { visible: boolean }) {
  return (
    <button
      className="back-to-top"
      type="button"
      aria-label="Back to top"
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => {
        document.getElementById("main")?.focus({ preventScroll: true });
        window.scrollTo({
          top: 0,
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
      }}
    >
      ↑ Top
    </button>
  );
}
export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <article className={`card ${className}`}>{children}</article>;
}
export function Badge({ children }: { children: React.ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Button({
  children,
  variant = "primary",
  ...props
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "light";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`button ${variant === "primary" ? "" : variant}`}
      {...props}
    >
      {children}
    </button>
  );
}
export function TableFrame({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="table-wrap" role="region" aria-label={label} tabIndex={0}>
      {children}
    </div>
  );
}
