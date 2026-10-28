import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "seed-assets");

const kinds = {
  maison: ["#1a4d8f", "#2d6a4f", "#6d4c41", "#1b4332"],
  appartement: ["#3d5a80", "#577590", "#4a6fa5", "#293241"],
  villa: ["#9b2226", "#ae2012", "#bb3e03", "#ca6702"],
  terrain: ["#588157", "#3a5a40", "#344e41", "#40916c"],
};

const services = {
  electricite: "#f4a261",
  plomberie: "#457b9d",
  menuiserie: "#bc6c25",
  peinture: "#e9c46a",
  decoration: "#c77dff",
  demenagement: "#2a9d8f",
  batiment: "#6c757d",
  mecanique: "#495057",
  ameublement: "#a98467",
};

const labels = {
  maison: "Maison",
  appartement: "Appartement",
  villa: "Villa",
  terrain: "Terrain",
  electricite: "Électricité",
  plomberie: "Plomberie",
  menuiserie: "Menuiserie",
  peinture: "Peinture",
  decoration: "Décoration",
  demenagement: "Déménagement",
  batiment: "Bâtiment",
  mecanique: "Mécanique",
  ameublement: "Ameublement",
};

async function make(file, color, label) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="720">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${color}"/>
        <stop offset="100%" stop-color="#0B2A8A"/>
      </linearGradient>
    </defs>
    <rect width="960" height="720" fill="url(#g)"/>
    <rect x="40" y="40" width="880" height="640" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="2"/>
    <text x="480" y="340" text-anchor="middle" font-family="Georgia, serif" font-size="42" fill="#ffffff">${label}</text>
    <text x="480" y="400" text-anchor="middle" font-family="Arial" font-size="22" fill="rgba(255,255,255,0.85)">IREDUC · Kinshasa</text>
  </svg>`;
  await sharp(Buffer.from(svg)).jpeg({ quality: 85 }).toFile(file);
}

for (const [kind, colors] of Object.entries(kinds)) {
  for (let i = 0; i < colors.length; i++) {
    await make(
      path.join(root, kind, `${i + 1}.jpg`),
      colors[i],
      labels[kind]
    );
  }
}

for (const [slug, color] of Object.entries(services)) {
  await make(path.join(root, "services", slug, "1.jpg"), color, labels[slug]);
  await make(path.join(root, "services", slug, "2.jpg"), color, labels[slug]);
}

for (let i = 1; i <= 12; i++) {
  await make(path.join(root, "providers", `${i}.jpg`), "#0B2A8A", "Partenaire");
}

console.log("seed-assets générés dans", root);
