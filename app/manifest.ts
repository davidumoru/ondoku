import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ondoku",
    short_name: "ondoku",
    description: "Read anything, beautifully.",
    start_url: "/",
    display: "standalone",
    background_color: "#141413",
    theme_color: "#141413",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
