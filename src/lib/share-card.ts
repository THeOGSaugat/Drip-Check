import type { PhotoAnalysis } from "./photo-types";
import { PHOTO_BREAKDOWN_LABELS } from "./photo-types";

/** Renders the shareable DripCheck result card on a canvas and returns a PNG blob. */
export async function renderShareCard(analysis: PhotoAnalysis): Promise<Blob | null> {
  const W = 1080;
  const H = 1350;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#faf8f4";
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = "rgba(30,28,26,0.16)";
  ctx.lineWidth = 2;
  ctx.strokeRect(56, 56, W - 112, H - 112);

  const ink = "#221f1c";
  const muted = "#807a72";
  const accent = "#b4562f";

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.font = "700 44px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText("DRIPCHECK", W / 2, 180);

  ctx.fillStyle = muted;
  ctx.font = "500 26px 'DM Sans', system-ui, sans-serif";
  ctx.fillText("YOUR DRIP SCORE", W / 2, 250);

  ctx.fillStyle = accent;
  ctx.font = "700 260px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(analysis.dripScore.toFixed(1), W / 2, 500);

  ctx.fillStyle = ink;
  ctx.font = "600 46px 'Space Grotesk', system-ui, sans-serif";
  ctx.fillText(analysis.styleLabel.toUpperCase(), W / 2, 590);

  // palette dots
  const dots = analysis.palette.slice(0, 5);
  const gap = 90;
  const startX = W / 2 - ((dots.length - 1) * gap) / 2;
  dots.forEach((c, i) => {
    ctx.beginPath();
    ctx.arc(startX + i * gap, 680, 30, 0, Math.PI * 2);
    ctx.fillStyle = c.hex;
    ctx.fill();
    ctx.strokeStyle = "rgba(30,28,26,0.2)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // breakdown rows
  const rows = PHOTO_BREAKDOWN_LABELS.filter(
    ({ key }) => analysis.breakdown[key].visible,
  ).slice(0, 4);
  let y = 810;
  rows.forEach(({ key, label }) => {
    const score = analysis.breakdown[key].score;
    ctx.textAlign = "left";
    ctx.fillStyle = muted;
    ctx.font = "500 34px 'DM Sans', system-ui, sans-serif";
    ctx.fillText(label, 160, y);
    ctx.textAlign = "right";
    ctx.fillStyle = ink;
    ctx.font = "600 34px 'Space Grotesk', system-ui, sans-serif";
    ctx.fillText(score === null ? "—" : score.toFixed(1), W - 160, y);
    ctx.beginPath();
    ctx.moveTo(160, y + 22);
    ctx.lineTo(W - 160, y + 22);
    ctx.strokeStyle = "rgba(30,28,26,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();
    y += 78;
  });

  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.font = "italic 40px Georgia, serif";
  ctx.fillText("“Check the fit. Own the vibe.”", W / 2, H - 170);

  ctx.fillStyle = muted;
  ctx.font = "500 24px 'DM Sans', system-ui, sans-serif";
  ctx.fillText(
    analysis.source === "ai" ? "Analyzed by DripCheck AI" : "Demo analysis",
    W / 2,
    H - 110,
  );

  return new Promise((resolve) => canvas.toBlob((b) => resolve(b), "image/png"));
}

export async function shareOrDownloadCard(analysis: PhotoAnalysis): Promise<"shared" | "downloaded" | "failed"> {
  const blob = await renderShareCard(analysis);
  if (!blob) return "failed";
  const file = new File([blob], `dripcheck-${analysis.dripScore.toFixed(1)}.png`, {
    type: "image/png",
  });

  const nav = navigator as Navigator & {
    canShare?: (data: ShareData) => boolean;
    share?: (data: ShareData) => Promise<void>;
  };

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: "My DripCheck score" });
      return "shared";
    } catch {
      /* fall through to download */
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  a.click();
  URL.revokeObjectURL(url);
  return "downloaded";
}
