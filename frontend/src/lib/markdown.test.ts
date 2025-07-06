import { describe, it, expect } from "vitest";
import { renderMarkdown } from "./markdown";
import { render } from "@testing-library/react";

describe("Markdown rendering", () => {
  it("should render basic markdown content", () => {
    const markdown =
      "# Heading\n\nThis is a **bold** text with *italic* content.";
    const result = renderMarkdown(markdown);

    // Render the component to test
    const { container } = render(result);

    // Should contain heading and formatted text
    expect(container.innerHTML).toContain("Heading");
    expect(container.innerHTML).toContain("bold");
    expect(container.innerHTML).toContain("italic");
  });

  it("should render code blocks", () => {
    const markdown = "```javascript\nconst x = 1;\nconsole.log(x);\n```";
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain code content (may be wrapped in syntax highlighting tokens)
    expect(container.innerHTML).toContain("const");
    expect(container.innerHTML).toContain("x");
    expect(container.innerHTML).toContain("1");
    expect(container.innerHTML).toContain("console");
    expect(container.innerHTML).toContain("log");
    expect(container.innerHTML).toContain("language-javascript");
  });

  it("should render inline code", () => {
    const markdown = "This is `inline code` in a sentence.";
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain inline code
    expect(container.innerHTML).toContain("inline code");
  });

  it("should render lists", () => {
    const markdown = "- Item 1\n- Item 2\n- Item 3";
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain list items
    expect(container.innerHTML).toContain("Item 1");
    expect(container.innerHTML).toContain("Item 2");
    expect(container.innerHTML).toContain("Item 3");
  });

  it("should render nested lists", () => {
    const markdown = `- Item 1
  - Nested item 1
  - Nested item 2
- Item 2
  1. Nested ordered item 1
  2. Nested ordered item 2
- Item 3`;
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain all list items
    expect(container.innerHTML).toContain("Item 1");
    expect(container.innerHTML).toContain("Nested item 1");
    expect(container.innerHTML).toContain("Nested item 2");
    expect(container.innerHTML).toContain("Item 2");
    expect(container.innerHTML).toContain("Nested ordered item 1");
    expect(container.innerHTML).toContain("Nested ordered item 2");
    expect(container.innerHTML).toContain("Item 3");
  });

  it("should render links", () => {
    const markdown = "[Example Link](https://example.com)";
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain link with proper attributes
    expect(container.innerHTML).toContain('href="https://example.com"');
    expect(container.innerHTML).toContain('target="_blank"');
    expect(container.innerHTML).toContain("Example Link");
  });

  it("should handle different styling for user messages", () => {
    const markdown = "`code`";
    const assistantResult = renderMarkdown(markdown, false);
    const userResult = renderMarkdown(markdown, true);

    const { container: assistantContainer } = render(assistantResult);
    const { container: userContainer } = render(userResult);

    // Both should render code, but styling may differ
    expect(assistantContainer.innerHTML).toContain("code");
    expect(userContainer.innerHTML).toContain("code");
  });

  it("should render blockquotes", () => {
    const markdown = "> This is a blockquote\n> with multiple lines";
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain blockquote content
    expect(container.innerHTML).toContain("This is a blockquote");
    expect(container.innerHTML).toContain("with multiple lines");
  });
});
