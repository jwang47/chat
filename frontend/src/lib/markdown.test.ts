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
    // Check for syntax highlighting - should have language class and colored tokens
    expect(container.innerHTML).toContain('class="language-javascript"');
    expect(container.innerHTML).toContain('class="token"');
  });

  it("should preserve newlines in code blocks", () => {
    const markdown =
      "```python\ndef hello():\n    print('hello')\n\ndef world():\n    print('world')\n```";
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain the code content (broken into syntax-highlighted tokens)
    expect(container.innerHTML).toContain("def");
    expect(container.innerHTML).toContain("hello");
    expect(container.innerHTML).toContain("print");
    expect(container.innerHTML).toContain("'hello'");
    expect(container.innerHTML).toContain("world");
    expect(container.innerHTML).toContain("'world'");

    // Should NOT convert newlines to <br /> tags within code blocks
    expect(container.innerHTML).not.toContain("<br />");

    // Should have syntax highlighting for Python
    expect(container.innerHTML).toContain('class="language-python"');
    expect(container.innerHTML).toContain('class="token"');
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

  it("should render center tags with flex justify-center", () => {
    const markdown = "<center>This text should be centered</center>";
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain centered content with flex justify-center class
    expect(container.innerHTML).toContain("This text should be centered");
    expect(container.innerHTML).toContain("justify-center");
  });

  it("should sanitize dangerous HTML while preserving center tags", () => {
    const markdown = `
<center>Safe centered content</center>
<script>alert('XSS')</script>
<img src=x onerror=alert('XSS')>
<iframe src="javascript:alert('XSS')"></iframe>
`;
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain safe centered content
    expect(container.innerHTML).toContain("Safe centered content");
    expect(container.innerHTML).toContain("justify-center");

    // Should NOT contain dangerous elements
    expect(container.innerHTML).not.toContain("<script>");
    expect(container.innerHTML).not.toContain("alert");
    expect(container.innerHTML).not.toContain("onerror");
    expect(container.innerHTML).not.toContain("<iframe>");
    expect(container.innerHTML).not.toContain("javascript:");
  });

  it("should sanitize HTML attributes that could be dangerous", () => {
    const markdown = `<center onclick="alert('XSS')" style="background: red;">Centered text</center>`;
    const result = renderMarkdown(markdown);

    const { container } = render(result);

    // Should contain the text content
    expect(container.innerHTML).toContain("Centered text");
    expect(container.innerHTML).toContain("justify-center");

    // Should NOT contain dangerous attributes
    expect(container.innerHTML).not.toContain("onclick");
    expect(container.innerHTML).not.toContain("alert");
    // Note: style attribute might be allowed by default schema, but onclick should be blocked
  });
});

describe("Standalone newline conversion", () => {
  it("should convert standalone newlines to <br /> tags", () => {
    const content = `Line 1

Line 3

Line 5`;

    const result = renderMarkdown(content);

    // The result should contain <br /> tags for standalone newlines
    expect(result.props.children).toContain(
      "Line 1\n<br />\nLine 3\n<br />\nLine 5"
    );
  });

  it("should not convert newlines within paragraphs", () => {
    const content = `This is a paragraph
with a regular line break.

This is another paragraph.`;

    const result = renderMarkdown(content);

    // Should only convert the empty line between paragraphs
    expect(result.props.children).toContain(
      "This is a paragraph\nwith a regular line break.\n<br />\nThis is another paragraph."
    );
  });
});
