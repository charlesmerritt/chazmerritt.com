/*
 * Which repo files the deployed site serves. An allowlist, so a new tooling
 * file or a draft post stays private unless a rule here names it.
 */
const PUBLIC = [
  /^[^/]+\.html$/,                      // top-level pages, 404.html
  /^(robots\.txt|favicon\.ico|site\.webmanifest|feed\.xml|sitemap\.xml)$/,
  /^assets\//,
  /^data\/[^/]+\.json$/,
  /^posts\/[^/]+\.html$/,               // pre-rendered published posts, never the .md sources
  /^posts\/images\//,
];

export function isPublic(file) {
  return PUBLIC.some(rule => rule.test(file));
}
