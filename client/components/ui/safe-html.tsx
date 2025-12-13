"use client";

import DOMPurify, { Config } from "isomorphic-dompurify";
import { memo, useMemo, ElementType } from "react";

interface SafeHtmlProps {
  /** The HTML content to sanitize and render */
  html: string;
  /** HTML element to use as container. Defaults to 'div' */
  as?: ElementType;
  /** Additional class names to apply to the container */
  className?: string;
  /** DOMPurify configuration options */
  sanitizeOptions?: Config;
}

/**
 * SafeHtml component for rendering user-provided HTML content safely.
 *
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks.
 * Only use this component when you need to render actual HTML content
 * (e.g., from a rich text editor). For plain text, use regular React text rendering.
 *
 * @example
 * // Basic usage
 * <SafeHtml html={product.description} />
 *
 * @example
 * // With custom element and class
 * <SafeHtml html={content} as="article" className="prose" />
 *
 * @example
 * // With custom sanitization options (allow only specific tags)
 * <SafeHtml
 *   html={content}
 *   sanitizeOptions={{ ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'] }}
 * />
 */
export const SafeHtml = memo(function SafeHtml({
  html,
  as: Component = "div",
  className,
  sanitizeOptions,
}: SafeHtmlProps) {
  const sanitizedHtml = useMemo(() => {
    if (!html) return "";

    // Default configuration: allow common formatting tags, strip dangerous content
    const defaultOptions: Config = {
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
      // Force all links to open in new tab with security attributes
      ADD_ATTR: ["target", "rel"],
      // Strip potentially dangerous protocols
      ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    };

    const mergedOptions = { ...defaultOptions, ...sanitizeOptions };
    const clean = DOMPurify.sanitize(html, mergedOptions) as string;

    // Add security attributes to links
    return clean.replace(
      /<a([^>]*)>/gi,
      '<a$1 target="_blank" rel="noopener noreferrer">'
    );
  }, [html, sanitizeOptions]);

  return (
    <Component
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
});

SafeHtml.displayName = "SafeHtml";
