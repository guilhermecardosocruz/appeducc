import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "EDUCC",
    short_name: "EDUCC",
    description: "Plataforma de gestão educacional",
    start_url: "/login",
    display: "standalone",
    background_color: "#f8fafc",
    theme_color: "#0284c7",
    icons: [
      {
        src: "/globe.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
