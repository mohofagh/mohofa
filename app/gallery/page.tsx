import type { Metadata } from "next";
import Gallery from "./gallery";
import artworks from "./gallery-manifest.json";

export const metadata: Metadata = {
  title: "Selected Works — Mina Rahi",
  description: "Drawings, studies, and mixed-media work by Mina Rahi.",
};

export default function GalleryPage() {
  return <Gallery artworks={artworks} />;
}
