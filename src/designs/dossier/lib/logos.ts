/**
 * Logos drawn in white on a transparent ground, made for the old dark theme. On paper they
 * vanish, so the dossier prints them on an ink plate instead. Measured from the logo files
 * (light pixels only, no dark ones); add a file here when a new white logo appears.
 */
const WHITE_LOGOS = ["/jengai.logo.png", "/jengai.app.png", "/DarkRoom.png"];

export function isWhiteLogo(src?: string): boolean {
  return !!src && WHITE_LOGOS.some((name) => src.endsWith(name));
}
