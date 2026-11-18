// 3D models are plain files in public/models so the site works on any host
// (Lovable, Vercel, Netlify...). Kenney CC0 — see public/models/CREDITS.md.
const glb = (file: string) => ({ url: `/models/${file}.glb` });

export const tentModel = glb("tent");
export const stonesModel = glb("campfire-stones");
export const logsModel = glb("campfire-logs");
export const pineA = glb("pine-tall-a");
export const pineB = glb("pine-tall-b");
export const pineRound = glb("pine-round");
export const pineDefault = glb("pine-default");
export const rockLarge = glb("rock-large");
export const rockSmall = glb("rock-small");
export const logSeat = glb("log-round");
export const stumpModel = glb("stump");
export const mushroomsModel = glb("mushrooms");
export const chestModel = glb("chest");
export const axeModel = glb("axe");
export const grassModel = glb("grass");
export const logStackModel = glb("log-stack");
export const bedrollModel = glb("bedroll");
export const bucketModel = glb("bucket");
export const signpostModel = glb("signpost");
export const stumpOldModel = glb("stump-old");
export const rockTallModel = glb("rock-tall");
