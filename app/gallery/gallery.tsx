"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import styles from "./gallery.module.css";

type Artwork = { id: string; src: string; width: number; height: number; title: string; medium: string; year: number; category: string; description: string };
const filters = ["All", "Digital", "Drawings", "Studies", "Class"];

export default function Gallery({ artworks }: { artworks: Artwork[] }) {
  const [filter, setFilter] = useState("All");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const visible = useMemo(() => filter === "All" ? artworks : artworks.filter((work) => work.category === filter), [artworks, filter]);
  const activeIndex = artworks.findIndex((work) => work.id === activeId);
  const active = activeIndex >= 0 ? artworks[activeIndex] : null;
  const years = artworks.map((work) => work.year);

  const openViewer = useCallback((id: string) => {
    history.pushState(null, "", `${location.pathname}${location.search}#work=${id}`);
    setActiveId(id);
  }, []);
  const closeViewer = useCallback(() => {
    history.pushState(null, "", `${location.pathname}${location.search}`);
    setActiveId(null);
  }, []);
  const move = useCallback((direction: number) => {
    const current = artworks.findIndex((work) => work.id === activeId);
    const next = (current + direction + artworks.length) % artworks.length;
    openViewer(artworks[next].id);
  }, [activeId, artworks, openViewer]);

  useEffect(() => {
    const syncHash = () => setActiveId(new URLSearchParams(window.location.hash.slice(1)).get("work"));
    syncHash(); window.addEventListener("hashchange", syncHash);
    return () => window.removeEventListener("hashchange", syncHash);
  }, []);

  useEffect(() => {
    if (!active) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [active, closeViewer, move]);

  return (
    <main className={styles.page} id="top">
      <header className={styles.header}>
        <Link href="/" className={styles.logo} aria-label="Mina Rahi home">MR<span>.</span></Link>
        <button className={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="main-nav">Menu</button>
        <nav id="main-nav" className={`${styles.nav} ${menuOpen ? styles.navOpen : ""}`} aria-label="Primary navigation">
          <Link href="/">Home</Link><a className={styles.activeNav} href="#works">Works</a><a href="#collection">Collections</a><Link href="/about">About</Link><a href="mailto:hello@example.com">Contact</a>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>Portfolio / 2023—2024</p>
          <h1>Selected<br />Works<span>.</span></h1>
          <p className={styles.dek}>An evolving collection of observation, color, and marks made across paper and digital space.</p>
          <dl className={styles.facts}>
            <div><dt>Works</dt><dd>{String(artworks.length).padStart(2, "0")}</dd></div>
            <div><dt>Years</dt><dd>{Math.min(...years)}—{Math.max(...years)}</dd></div>
            <div><dt>Media</dt><dd>{new Set(artworks.map((work) => work.category)).size} categories</dd></div>
          </dl>
        </div>
        <aside className={styles.collection} id="collection">
          <p className={styles.eyebrow}>For Lecturer</p>
          <div><span>Current collection</span><strong>Gesture &amp; Memory</strong></div>
          <p>{artworks.length} selected works tracing the relationship between figure, place, and improvised line.</p>
          <a href="#works">View collection <span aria-hidden="true">↗</span></a>
        </aside>
      </section>

      <section className={styles.works} id="works">
        <div className={styles.toolbar}>
          <div className={styles.filters} aria-label="Filter artworks">
            {filters.map((item) => <button key={item} className={filter === item ? styles.selected : ""} onClick={() => setFilter(item)}>{item}</button>)}
          </div>
          <span className={styles.resultCount}>{visible.length} {visible.length === 1 ? "work" : "works"}</span>
        </div>
        <div className={styles.grid}>
          {visible.map((work, index) => (
            <article className={styles.artwork} key={work.id}>
              <button className={styles.imageButton} onClick={() => openViewer(work.id)} aria-label={`View ${work.title}`}>
                <img src={`${basePath}/${work.src}`} alt={work.title} width={work.width} height={work.height} className={styles[`image${index % 3}`]} />
                <span className={styles.viewLabel}>View work ↗</span>
              </button>
              <div className={styles.caption}><h2>{work.title}</h2><p>{work.medium} · {work.year}</p></div>
            </article>
          ))}
        </div>
        {visible.length === 0 && <p className={styles.empty}>No works in this collection yet.</p>}
      </section>

      <footer className={styles.footer}><p>© {new Date().getFullYear()} Mina Rahi</p><div><a href="#">Instagram</a><a href="#">ArtStation</a><a href="mailto:hello@example.com">Email</a></div><a href="#top">Back to top ↑</a></footer>

      {active && <div className={styles.modal} role="dialog" aria-modal="true" aria-label={active.title} onMouseDown={(e) => e.target === e.currentTarget && closeViewer()}>
        <button className={styles.close} onClick={closeViewer} aria-label="Close viewer">Close ×</button>
        <button className={`${styles.viewerArrow} ${styles.previous}`} onClick={() => move(-1)} aria-label="Previous artwork">←</button>
        <figure><img src={`${basePath}/${active.src}`} alt={active.title} width={active.width} height={active.height} /><figcaption><div><h2>{active.title}</h2><p>{active.medium} · {active.year}</p></div><p>{active.description}</p><span>{String(activeIndex + 1).padStart(2, "0")} / {String(artworks.length).padStart(2, "0")}</span></figcaption></figure>
        <button className={`${styles.viewerArrow} ${styles.next}`} onClick={() => move(1)} aria-label="Next artwork">→</button>
      </div>}
    </main>
  );
}
