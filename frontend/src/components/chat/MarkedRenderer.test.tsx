import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { MarkedRenderer } from "./MarkedRenderer";

// Mock the useCodeBlockManager hook
vi.mock("../../hooks/useCodeBlockManager", () => ({
  useCodeBlockManager: () => ({
    isExpanded: () => false,
    toggle: vi.fn(),
  }),
}));

describe("MarkedRenderer - Center Tag Handling", () => {
  it("should render center tags as text-center divs", () => {
    const content = "<center>MILITARY ADVISOR 2</center>";
    const { container } = render(
      <MarkedRenderer content={content} messageId="test-1" />
    );

    // Should render with text-center class
    expect(container.innerHTML).toContain("text-center");
    expect(container.innerHTML).toContain("MILITARY ADVISOR 2");
    
    // Should not contain actual center tags
    expect(container.innerHTML).not.toContain("<center>");
    expect(container.innerHTML).not.toContain("</center>");
  });

  it("should handle multiple center tags", () => {
    const content = `<center>MILITARY ADVISOR 2</center>
> Sir, intelligence reports from global monitoring stations indicate a significant uptick in public anxiety.

<center>GENERAL THORNE</center>
> I *know* what we need, Advisor.`;

    const { container } = render(
      <MarkedRenderer content={content} messageId="test-2" />
    );

    // Should render both centered elements
    expect(container.innerHTML).toContain("MILITARY ADVISOR 2");
    expect(container.innerHTML).toContain("GENERAL THORNE");
    
    // Should have text-center class for both
    const centerDivs = container.querySelectorAll(".text-center");
    expect(centerDivs).toHaveLength(2);
    expect(centerDivs[0]).toHaveTextContent("MILITARY ADVISOR 2");
    expect(centerDivs[1]).toHaveTextContent("GENERAL THORNE");
  });

  it("should sanitize dangerous attributes in center tags", () => {
    const content = `<center onclick="alert('xss')" style="color: red;">Safe Content</center>`;
    const { container } = render(
      <MarkedRenderer content={content} messageId="test-3" />
    );

    // Should contain the text content
    expect(container.innerHTML).toContain("Safe Content");
    expect(container.innerHTML).toContain("text-center");
    
    // Should not contain dangerous attributes
    expect(container.innerHTML).not.toContain("onclick");
    expect(container.innerHTML).not.toContain("alert");
    expect(container.innerHTML).not.toContain("style=");
  });

  it("should sanitize other HTML tags while preserving center tags", () => {
    const content = `<center>Safe centered content</center>
<script>alert('xss')</script>
<img src="x" onerror="alert('xss')">`;

    const { container } = render(
      <MarkedRenderer content={content} messageId="test-4" />
    );

    // Should contain safe centered content
    expect(container.innerHTML).toContain("Safe centered content");
    expect(container.innerHTML).toContain("text-center");
    
    // Should not contain script tags or dangerous img attributes
    expect(container.innerHTML).not.toContain("<script>");
    expect(container.innerHTML).not.toContain("onerror");
    expect(container.innerHTML).not.toContain("alert('xss')");
  });

  it("should handle empty center tags", () => {
    const content = "<center></center>";
    const { container } = render(
      <MarkedRenderer content={content} messageId="test-5" />
    );

    // Should render a div with text-center class but empty content
    const centerDiv = container.querySelector(".text-center");
    expect(centerDiv).toBeTruthy();
    expect(centerDiv?.textContent).toBe("");
  });

  it("should handle center tags with nested markdown", () => {
    const content = "<center>**BOLD CHARACTER**</center>";
    const { container } = render(
      <MarkedRenderer content={content} messageId="test-6" />
    );

    // Should render centered content (markdown within center tags gets stripped by DOMPurify)
    expect(container.innerHTML).toContain("text-center");
    expect(container.innerHTML).toContain("**BOLD CHARACTER**");
  });

  it("should handle mixed content with center tags and other elements", () => {
    const content = `# Dialogue Scene

<center>MILITARY ADVISOR 2</center>
> Sir, intelligence reports indicate unusual activity.

Normal paragraph text.

<center>GENERAL THORNE</center>
> What's your assessment?

- List item 1
- List item 2`;

    const { container } = render(
      <MarkedRenderer content={content} messageId="test-7" />
    );

    // Should render all content types
    expect(container.innerHTML).toContain("Dialogue Scene"); // heading
    expect(container.innerHTML).toContain("MILITARY ADVISOR 2"); // center
    expect(container.innerHTML).toContain("intelligence reports"); // blockquote
    expect(container.innerHTML).toContain("Normal paragraph text"); // paragraph
    expect(container.innerHTML).toContain("GENERAL THORNE"); // center
    expect(container.innerHTML).toContain("List item 1"); // list

    // Should have two centered elements
    const centerDivs = container.querySelectorAll(".text-center");
    expect(centerDivs).toHaveLength(2);
  });

  it("should handle self-closing center tags", () => {
    const content = "<center/>Character Name<center/>";
    const { container } = render(
      <MarkedRenderer content={content} messageId="test-8" />
    );

    // DOMPurify should handle self-closing tags appropriately
    expect(container.innerHTML).toContain("Character Name");
  });
});