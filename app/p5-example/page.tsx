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

function sketch() {
    const images = [
    //{path: 'bg.jpg', x: 0, y: 0, z: 0, width: 500, height: 500, ins: null, layer: null},
    {path: 'pic1.png', x: 50, y: 50, z: 50, width: 150, height: 200, ins: null, layer: null},
    {path: 'pic1.png', x: 50, y: 50, z: 100, width: 50, height: 100, ins: null, layer: null}
    // Add more images with x, y, z positions and sizes as needed
    ];

    function preload() {
    images.forEach((item) => {
        item.ins = loadImage(item.path);
    });
    }

    function setup() {
    createCanvas(400, 400, WEBGL);
    
    // Initialize layers with images
    images.forEach((item) => {
        item.layer = new Layer(item.x, item.y, item.z, item.width, item.height, item.ins);
    });

    
    cameraPos = camera(width/2, height/2, (height / 2) / tan(PI / 6), 0, 0, 0, 0, 1, 0);
    }

    function draw() {
    background(220);
    //drawAxis();
    
    let camX = (width / 2 + 50 * sin(frameCount * 0.01)) - 200;
    camera(camX, -camX, (height / 2) / tan(PI / 6), 0, 0, 0, 0, 1, 0);

    images.forEach(item => {
        item.layer.display();
    });
    }

    class Layer {
    constructor(x, y, z, imgWidth, imgHeight, img) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.img = img;
    }

    display() {
        push();
        translate(this.x, this.y, this.z);
        imageMode(CENTER);
        image(this.img, 0, 0, this.imgWidth, this.imgHeight);
        pop();
    }
    }

    function drawAxis() {
    // Drawing axes
    strokeWeight(2);
    stroke(255, 0, 0);  // X-axis
    line(-width/2, 0, 0, width/2, 0, 0);
    stroke(0, 255, 0);  // Y-axis
    line(0, -height/2, 0, 0, height/2, 0);
    stroke(0, 0, 255);  // Z-axis
    line(0, 0, -width, 0, 0, width); 
    }


}