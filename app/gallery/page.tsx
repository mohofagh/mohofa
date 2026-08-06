import type { Metadata } from "next";
import Gallery from "./gallery";
import artworks from "./gallery-manifest.json";

export const metadata: Metadata = {
  title: "Selected Works",
  description: "Drawings, studies, and mixed-media work",
};

export default function GalleryPage() {
  return <Gallery artworks={artworks} />;
}
