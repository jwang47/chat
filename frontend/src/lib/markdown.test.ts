import { describe, it, expect } from "vitest";
import { addCustomStyling } from "./markdown";

describe("Markdown sanitization", () => {
  it("should sanitize malicious HTML", () => {
    const maliciousHtml =
      '<p>Safe content</p><script>alert("XSS")</script><img src="x" onerror="alert(1)">';
    const sanitized = addCustomStyling(maliciousHtml);

    // Should remove script tags and dangerous attributes
    expect(sanitized).not.toContain("<script>");
    expect(sanitized).not.toContain("onerror");
    expect(sanitized).toContain("Safe content");
  });

  it("should preserve allowed HTML tags and attributes", () => {
    const safeHtml =
      '<p class="test">Safe <strong>content</strong></p><a href="https://example.com">link</a>';
    const sanitized = addCustomStyling(safeHtml);

    // Should preserve safe content
    expect(sanitized).toContain('<p class="');
    expect(sanitized).toContain("<strong");
    expect(sanitized).toContain('<a href="https://example.com"');
    expect(sanitized).toContain("Safe");
    expect(sanitized).toContain("content");
  });

  it("should add custom styling classes", () => {
    const html = "<p>Test paragraph</p><h1>Test heading</h1>";
    const sanitized = addCustomStyling(html);

    // Should add custom classes
    expect(sanitized).toContain('class="mb-4 last:mb-0 whitespace-pre-line"');
    expect(sanitized).toContain(
      'class="text-xl font-semibold mb-3 mt-6 first:mt-0"'
    );
  });

  it("should handle user message styling differently", () => {
    const html = "<code>test code</code>";
    const assistantSanitized = addCustomStyling(html, false);
    const userSanitized = addCustomStyling(html, true);

    // Should have different background colors
    expect(assistantSanitized).toContain("rgba(45, 44, 40, 0.4)");
    expect(userSanitized).toContain("rgba(25, 24, 21, 0.6)");
  });

  it("should sanitize dangerous URLs", () => {
    const dangerousHtml = '<a href="javascript:alert(1)">Click me</a>';
    const sanitized = addCustomStyling(dangerousHtml);

    // Should remove dangerous javascript: URLs
    expect(sanitized).not.toContain("javascript:");
  });
});
