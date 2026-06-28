"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";

// Tell TypeScript that p5 will exist globally once the CDN loads
declare global {
  interface Window {
    p5: any;
  }
}

export default function P5ExamplePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    // Only initialize if the CDN script is loaded and the container div exists
    if (!scriptLoaded || !containerRef.current || !window.p5) return;

    // This is your p5 sketch converted to "Instance Mode"
    const sketch = (p: any) => {
      p.setup = () => {
        // Create the canvas and attach it to our React div container
        p.createCanvas(400, 400).parent(containerRef.current);
      };

      p.draw = () => {
        p.background(220);
        
        // Let's add a quick interactive circle so you can see it working dynamically!
        p.fill(34, 197, 94); // Green color matching Tailwind
        p.noStroke();
        p.ellipse(p.mouseX, p.mouseY, 50, 50);
      };
    };

    // Instantiate the p5 project runtime
    const myP5Instance = new window.p5(sketch);

    // CRITICAL: Cleanup the canvas instance when the user clicks away or navigates back
    return () => {
      myP5Instance.remove();
    };
  }, [scriptLoaded]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-900">
      {/* 1. External CDN loader */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          p5.js CDN Script Runner
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {!scriptLoaded ? "Fetching p5 from CDN..." : "Moving your mouse over the canvas below"}
        </p>
      </div>

      {/* 2. The targeted Canvas Mount Point Container */}
      <div 
        ref={containerRef} 
        className="overflow-hidden rounded-lg border border-zinc-200 shadow-md bg-white dark:border-zinc-700"
        style={{ width: "400px", height: "400px" }}
      />

      <Link
        href="/"
        className="mt-8 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 underline"
      >
        ← Back to Home
      </Link>
    </div>
  );
}