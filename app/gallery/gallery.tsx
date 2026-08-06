"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import styles from "./gallery.module.css";

type Artwork = {
  id: string;
  src: string;
  width: number;
  height: number;
  title: string;
  medium: string;
  year: number;
  createdAt: string;
  category: string;
  description: string;
};

type SortMode = "newest" | "oldest";

const filters = [
  "All",
  "Digital",
  "Drawings",
  "Studies",
  "Class",
];

const PAGE_SIZE = 24;

export default function Gallery({
  artworks,
}: {
  artworks: Artwork[];
}) {
  const [filter, setFilter] = useState("All");
  const [sort, setSort] = useState<SortMode>("newest");
  const [visibleCount, setVisibleCount] =
    useState(PAGE_SIZE);

  const [activeId, setActiveId] = useState<
    string | null
  >(null);

  const [menuOpen, setMenuOpen] = useState(false);

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const basePath =
    process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  // ---------------------------------------------------------------------------
  // FILTER + SORT
  // ---------------------------------------------------------------------------

  const ordered = useMemo(() => {
    const filtered =
      filter === "All"
        ? artworks
        : artworks.filter(
            (work) => work.category === filter,
          );

    return [...filtered].sort((a, b) => {
      const aTime = Date.parse(a.createdAt);
      const bTime = Date.parse(b.createdAt);

      const difference =
        (Number.isNaN(bTime) ? 0 : bTime) -
        (Number.isNaN(aTime) ? 0 : aTime);

      if (difference !== 0) {
        return sort === "newest"
          ? difference
          : -difference;
      }

      // Deterministic ordering if timestamps are identical.
      return sort === "newest"
        ? b.id.localeCompare(a.id)
        : a.id.localeCompare(b.id);
    });
  }, [artworks, filter, sort]);

  // ---------------------------------------------------------------------------
  // INFINITE SCROLL
  // ---------------------------------------------------------------------------

  const visible = useMemo(
    () => ordered.slice(0, visibleCount),
    [ordered, visibleCount],
  );

  const hasMore = visible.length < ordered.length;

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [filter, sort]);

  const loadMore = useCallback(() => {
    setVisibleCount((current) =>
      Math.min(
        current + PAGE_SIZE,
        ordered.length,
      ),
    );
  }, [ordered.length]);

  useEffect(() => {
    const target = loadMoreRef.current;

    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setVisibleCount((current) =>
          Math.min(
            current + PAGE_SIZE,
            ordered.length,
          ),
        );
      },
      {
        rootMargin: "600px 0px",
      },
    );

    observer.observe(target);

    return () => observer.disconnect();
  }, [hasMore, ordered.length]);

  // ---------------------------------------------------------------------------
  // PAGE METADATA
  // ---------------------------------------------------------------------------

  const years = artworks.map(
    (work) => work.year,
  );

  const currentYear = new Date().getFullYear();

  const minYear =
    years.length > 0
      ? Math.min(...years)
      : currentYear;

  const maxYear =
    years.length > 0
      ? Math.max(...years)
      : currentYear;

  const categoryCount = new Set(
    artworks.map((work) => work.category),
  ).size;

  // ---------------------------------------------------------------------------
  // ARTWORK VIEWER
  //
  // Navigation deliberately uses `ordered`, NOT `visible`.
  //
  // This means:
  // - current filter is respected
  // - current sort is respected
  // - navigation can continue into works that infinite scroll has not
  //   rendered yet
  // ---------------------------------------------------------------------------

  const viewerArtworks = ordered;

  const activeIndex =
    viewerArtworks.findIndex(
      (work) => work.id === activeId,
    );

  const active =
    activeIndex >= 0
      ? viewerArtworks[activeIndex]
      : null;

  const openViewer = useCallback(
    (id: string) => {
      const hash = `#work=${encodeURIComponent(
        id,
      )}`;

      window.history.pushState(
        null,
        "",
        `${window.location.pathname}${window.location.search}${hash}`,
      );

      setActiveId(id);
    },
    [],
  );

  const closeViewer = useCallback(() => {
    window.history.pushState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );

    setActiveId(null);
  }, []);

  // Original gallery navigation restored here.
  const move = useCallback(
    (direction: number) => {
      if (
        viewerArtworks.length === 0 ||
        activeId === null
      ) {
        return;
      }

      const currentIndex =
        viewerArtworks.findIndex(
          (work) => work.id === activeId,
        );

      if (currentIndex < 0) {
        return;
      }

      const nextIndex =
        (
          currentIndex +
          direction +
          viewerArtworks.length
        ) % viewerArtworks.length;

      openViewer(
        viewerArtworks[nextIndex].id,
      );
    },
    [
      activeId,
      viewerArtworks,
      openViewer,
    ],
  );

  // ---------------------------------------------------------------------------
  // HASH / BROWSER NAVIGATION
  // ---------------------------------------------------------------------------

  useEffect(() => {
    const syncLocation = () => {
      const params = new URLSearchParams(
        window.location.hash.slice(1),
      );

      setActiveId(params.get("work"));
    };

    syncLocation();

    window.addEventListener(
      "hashchange",
      syncLocation,
    );

    window.addEventListener(
      "popstate",
      syncLocation,
    );

    return () => {
      window.removeEventListener(
        "hashchange",
        syncLocation,
      );

      window.removeEventListener(
        "popstate",
        syncLocation,
      );
    };
  }, []);

  // ---------------------------------------------------------------------------
  // VIEWER KEYBOARD NAVIGATION
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!active) {
      return;
    }

    const onKey = (
      event: KeyboardEvent,
    ) => {
      if (event.key === "Escape") {
        closeViewer();
      }

      if (event.key === "ArrowLeft") {
        move(-1);
      }

      if (event.key === "ArrowRight") {
        move(1);
      }
    };

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    window.addEventListener(
      "keydown",
      onKey,
    );

    return () => {
      document.body.style.overflow =
        previousOverflow;

      window.removeEventListener(
        "keydown",
        onKey,
      );
    };
  }, [active, closeViewer, move]);

  return (
    <main id="top" className={styles.page}>
      <header className={styles.header}>
        <Link
          href="/"
          className={styles.logo}
        >
          MR<span>.</span>
        </Link>

        <button
          type="button"
          className={styles.menuButton}
          onClick={() =>
            setMenuOpen(
              (current) => !current,
            )
          }
          aria-expanded={menuOpen}
          aria-controls="main-nav"
        >
          Menu
        </button>

        <nav
          id="main-nav"
          className={`${styles.nav} ${
            menuOpen
              ? styles.navOpen
              : ""
          }`}
          aria-label="Primary navigation"
        >
          <Link href="/">Home</Link>

          <Link
            href="/gallery"
            className={styles.activeNav}
          >
            Works
          </Link>

          <Link href="/collections">
            Collections
          </Link>

          <Link href="/about">
            About
          </Link>

          <Link href="/contact">
            Contact
          </Link>
        </nav>
      </header>

      <section className={styles.hero}>
        <div className={styles.intro}>
          <p className={styles.eyebrow}>
            Portfolio / {minYear}—
            {maxYear}
          </p>

          <h1>
            Selected
            <br />
            Works<span>.</span>
          </h1>

          <p className={styles.dek}>
            An evolving collection of
            observation, color, and marks
            made across paper and digital
            space.
          </p>

          <dl className={styles.facts}>
            <div>
              <dt>Works</dt>

              <dd>
                {String(
                  artworks.length,
                ).padStart(2, "0")}
              </dd>
            </div>

            <div>
              <dt>Years</dt>

              <dd>
                {minYear}—{maxYear}
              </dd>
            </div>

            <div>
              <dt>Media</dt>

              <dd>
                {categoryCount}{" "}
                {categoryCount === 1
                  ? "category"
                  : "categories"}
              </dd>
            </div>
          </dl>
        </div>

        <aside
          className={styles.collection}
          id="collection"
        >
          <p className={styles.eyebrow}>
            For Lecturer
          </p>

          <div>
            <span>
              Current collection
            </span>

            <strong>
              Gesture &amp; Memory
            </strong>
          </div>

          <p>
            Selected works tracing the
            relationship between figure,
            place, and improvised line.
          </p>

          <Link href="/collections">
            View collection{" "}
            <span aria-hidden="true">
              ↗
            </span>
          </Link>
        </aside>
      </section>

      <section
        className={styles.works}
        id="works"
      >
        <div
          className={styles.toolbar}
        >
          <div
            className={styles.filters}
            aria-label="Filter artworks"
          >
            {filters.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={
                  filter === item
                }
                className={
                  filter === item
                    ? styles.selected
                    : ""
                }
                onClick={() =>
                  setFilter(item)
                }
              >
                {item}
              </button>
            ))}
          </div>

          <div
            className={
              styles.toolbarMeta
            }
          >
            <span
              className={
                styles.resultCount
              }
            >
              {ordered.length}{" "}
              {ordered.length === 1
                ? "work"
                : "works"}
            </span>

            <label
              className={
                styles.sortControl
              }
            >
              <select
                value={sort}
                onChange={(event) =>
                  setSort(
                    event.target
                      .value as SortMode,
                  )
                }
                aria-label="Sort artworks"
              >
                <option value="newest">
                  Latest
                </option>

                <option value="oldest">
                  Oldest
                </option>
              </select>
            </label>
          </div>
        </div>

        <div className={styles.grid}>
          {visible.map(
            (work, index) => (
              <article
                className={
                  styles.artwork
                }
                key={work.id}
              >
                <button
                  type="button"
                  className={
                    styles.imageButton
                  }
                  onClick={() =>
                    openViewer(work.id)
                  }
                  aria-label={`View ${work.title}`}
                >
                  <img
                    src={`${basePath}/${work.src}`}
                    alt={work.title}
                    width={work.width}
                    height={work.height}
                    className={
                      styles[
                        `image${
                          index % 3
                        }`
                      ]
                    }
                    loading={
                      index < 6
                        ? "eager"
                        : "lazy"
                    }
                  />

                  <span
                    className={
                      styles.viewLabel
                    }
                  >
                    View work ↗
                  </span>
                </button>

                <div
                  className={
                    styles.caption
                  }
                >
                  <h2>
                    {work.title}
                  </h2>

                  <p>
                    {work.medium} ·{" "}
                    {work.year}
                  </p>
                </div>
              </article>
            ),
          )}
        </div>

        {ordered.length === 0 && (
          <p className={styles.empty}>
            No works in this collection
            yet.
          </p>
        )}

        {hasMore && (
          <div
            className={
              styles.loadMore
            }
          >
            <button
              type="button"
              onClick={loadMore}
            >
              Load more
            </button>

            <div
              ref={loadMoreRef}
              aria-hidden="true"
            />
          </div>
        )}
      </section>

      <footer
        className={styles.footer}
      >
        <p>
          © {new Date().getFullYear()}{" "}
          Mina Rahi
        </p>

        <div>
          <a href="#">
            Instagram
          </a>

          <a href="#">
            ArtStation
          </a>

          <a href="mailto:hello@example.com">
            Email
          </a>
        </div>

        <a href="#top">
          Back to top ↑
        </a>
      </footer>

      {/* ---------------------------------------------------------------
          ARTWORK VIEWER
          Original previous / next gallery navigation restored.
         --------------------------------------------------------------- */}

      {active && (
        <div
          className={styles.modal}
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              closeViewer();
            }
          }}
        >
          <button
            type="button"
            className={styles.close}
            onClick={closeViewer}
            aria-label="Close viewer"
          >
            Close ×
          </button>

          {viewerArtworks.length > 1 && (
            <button
              type="button"
              className={`${styles.viewerArrow} ${styles.previous}`}
              onClick={() => move(-1)}
              aria-label="Previous artwork"
            >
              ←
            </button>
          )}

          <figure>
            <img
              src={`${basePath}/${active.src}`}
              alt={active.title}
              width={active.width}
              height={active.height}
            />

            <figcaption>
              <div>
                <h2>
                  {active.title}
                </h2>

                <p>
                  {active.medium} ·{" "}
                  {active.year}
                </p>
              </div>

              {active.description && (
                <p>
                  {active.description}
                </p>
              )}

              <span>
                {String(
                  activeIndex + 1,
                ).padStart(2, "0")}
                {" / "}
                {String(
                  viewerArtworks.length,
                ).padStart(2, "0")}
              </span>
            </figcaption>
          </figure>

          {viewerArtworks.length > 1 && (
            <button
              type="button"
              className={`${styles.viewerArrow} ${styles.next}`}
              onClick={() => move(1)}
              aria-label="Next artwork"
            >
              →
            </button>
          )}
        </div>
      )}
    </main>
  );
}