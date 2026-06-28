
"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import Link from "next/link";

import pic1 from '@/public/pic1.png'
// ==========================================
// PASTE YOUR COPIED CODE FROM THE P5 WEBSITE HERE
// ==========================================
declare global {
  interface Window {
    p5: any;
  }
}
const MY_RAW_P5_CODE = `
  const images = [
    //{path: 'bg.jpg', x: 0, y: 0, z: 0, width: 500, height: 500, ins: null, layer: null},
    {path: '${pic1.src}', x: 10, y: 0, z: 1, width: 150, height: 200, ins: null, layer: null},
    {path: '${pic1.src}', x: 50, y: 5, z: 5, width: 50, height: 100, ins: null, layer: null}
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


`;
// ==========================================

export default function P5SandboxPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (!scriptLoaded || !containerRef.current) return;

    // 1. Inject the copied global functions directly into the browser context window
    const executeGlobalSketch = new Function(
      `${MY_RAW_P5_CODE}
       window.setup = setup;
       window.draw = draw;
       if (typeof preload !== 'undefined') window.preload = preload;
      `
    );

    try {
      executeGlobalSketch();
    } catch (error) {
      console.error("Error evaluating your custom p5 script: ", error);
    }

    // 2. Instantiate p5 in standard global targeting mode
    // Passing the containerRef node forces p5 to append the canvas inside our layout box
    const myP5Instance = new (window as any).p5(null, containerRef.current);

    // 3. CRITICAL CLEANUP: Wipe out the global window registers when navigating away 
    // This stops scripts from leaking into other pages of your Next.js app
    return () => {
      myP5Instance.remove();
      delete (window as any).setup;
      delete (window as any).draw;
      delete (window as any).preload;
    };
  }, [scriptLoaded]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-900">
      {/* Load the p5 CDN runtime */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"
        strategy="afterInteractive"
        onLoad={() => setScriptLoaded(true)}
      />

      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Global Web-Editor Sandbox
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Running raw web-editor code on a dynamic canvas mount point
        </p>
      </div>

      {/* The Target Mount Box */}
      <div 
        ref={containerRef} 
        className="overflow-hidden rounded-lg border border-zinc-200 shadow-md bg-zinc-100 dark:border-zinc-700"
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