/**
 * HTML sanitization utilities using DOMPurify.
 *
 * Use these utilities when handling user-provided HTML content to prevent XSS attacks.
 * For most cases, prefer using the SafeHtml component instead.
 */

import DOMPurify, { Config } from "isomorphic-dompurify";

/**
 * Default DOMPurify configuration for rich text content.
 * Allows common formatting tags while stripping potentially dangerous content.
 */
export const DEFAULT_SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: [
    "p",
    "br",
    "b",
    "i",
    "em",
    "strong",
    "u",
    "s",
    "strike",
    "sub",
    "sup",
    "span",
    "div",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "ul",
    "ol",
    "li",
    "a",
    "blockquote",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "class", "id"],
  ADD_ATTR: ["target", "rel"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

/**
 * Strict configuration that only allows basic text formatting.
 * Use this for comments or user input where minimal HTML is expected.
 */
export const STRICT_SANITIZE_CONFIG: Config = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "br"],
  ALLOWED_ATTR: [],
};

/**
 * Configuration that strips all HTML, returning only text content.
 */
export const TEXT_ONLY_CONFIG: Config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
};

/**
 * Sanitize HTML content to prevent XSS attacks.
 *
 * @param html - The HTML string to sanitize
 * @param config - Optional DOMPurify configuration
 * @returns Sanitized HTML string
 *
 * @example
 * const clean = sanitizeHtml('<script>alert("xss")</script><p>Safe content</p>');
 * // Result: '<p>Safe content</p>'
 */
export function sanitizeHtml(
  html: string,
  config: Config = DEFAULT_SANITIZE_CONFIG
): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, config) as string;
}

/**
 * Sanitize HTML content and ensure all links open in new tabs securely.
 *
 * @param html - The HTML string to sanitize
 * @param config - Optional DOMPurify configuration
 * @returns Sanitized HTML string with secure link attributes
 */
export function sanitizeHtmlWithSecureLinks(
  html: string,
  config: Config = DEFAULT_SANITIZE_CONFIG
): string {
  const sanitized = sanitizeHtml(html, config);
  return sanitized.replace(
    /<a([^>]*)>/gi,
    '<a$1 target="_blank" rel="noopener noreferrer">'
  );
}

/**
 * Strip all HTML tags and return only text content.
 *
 * @param html - The HTML string to strip
 * @returns Plain text content
 *
 * @example
 * const text = stripHtml('<p><strong>Hello</strong> world!</p>');
 * // Result: 'Hello world!'
 */
export function stripHtml(html: string): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, TEXT_ONLY_CONFIG) as string;
}

/**
 * Check if a string contains any HTML tags.
 *
 * @param str - String to check
 * @returns True if string contains HTML tags
 */
export function containsHtml(str: string): boolean {
  if (!str) return false;
  return /<[a-z][\s\S]*>/i.test(str);
}
