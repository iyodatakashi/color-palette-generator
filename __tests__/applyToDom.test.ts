import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { applyColorPaletteToDom } from "../src/applyToDom";
import type { Palette } from "../src/types";

// Mock document for testing
const mockDocument = {
  documentElement: {
    style: {
      setProperty: vi.fn(),
    },
  },
};

describe("applyToDom", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock document if it doesn't exist (for Node.js environment)
    if (typeof document === "undefined") {
      Object.defineProperty(global, "document", {
        value: mockDocument,
        writable: true,
      });
    }
  });

  afterEach(() => {
    // Clean up after each test
    vi.restoreAllMocks();
  });

  describe("applyColorPaletteToDom", () => {
    it("should apply palette to DOM when document is available", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-600": "#2563eb",
        "--secondary-500": "#ef4444",
      };

      applyColorPaletteToDom(palette);

      // Check that setProperty was called for each palette entry
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(3);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-600", "#2563eb");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--secondary-500", "#ef4444");
    });

    it("should handle empty palette", () => {
      const palette: Palette = {};

      applyColorPaletteToDom(palette);

      // Should not call setProperty for empty palette
      expect(
        mockDocument.documentElement.style.setProperty
      ).not.toHaveBeenCalled();
    });

    it("should handle palette with single color", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(1);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
    });

    it("should handle palette with many colors", () => {
      const palette: Palette = {
        "--primary-50": "#eff6ff",
        "--primary-100": "#dbeafe",
        "--primary-200": "#bfdbfe",
        "--primary-300": "#93c5fd",
        "--primary-400": "#60a5fa",
        "--primary-500": "#3b82f6",
        "--primary-600": "#2563eb",
        "--primary-700": "#1d4ed8",
        "--primary-800": "#1e40af",
        "--primary-900": "#1e3a8a",
        "--primary-950": "#172554",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(11);

      // Check a few specific calls
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-50", "#eff6ff");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-950", "#172554");
    });

    it("should handle palette with CSS variable references", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-color": "var(--primary-500)",
        "--primary-light": "var(--primary-400)",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(3);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-color", "var(--primary-500)");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-light", "var(--primary-400)");
    });

    it("should handle palette with transparent colors", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-500-10": "rgba(59, 130, 246, 0.1)",
        "--primary-500-20": "rgba(59, 130, 246, 0.2)",
        "--primary-500-30": "rgba(59, 130, 246, 0.3)",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(4);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500-10", "rgba(59, 130, 246, 0.1)");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500-20", "rgba(59, 130, 246, 0.2)");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500-30", "rgba(59, 130, 246, 0.3)");
    });

    it("should handle palette with text colors", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-text-color-on-light": "var(--primary-900)",
        "--primary-text-color-on-dark": "var(--primary-100)",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(3);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith(
        "--primary-text-color-on-light",
        "var(--primary-900)"
      );
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith(
        "--primary-text-color-on-dark",
        "var(--primary-100)"
      );
    });

    it("should handle palette with different color formats", () => {
      const palette: Palette = {
        "--color-hex": "#3b82f6",
        "--color-rgb": "rgb(59, 130, 246)",
        "--color-hsl": "hsl(217, 91%, 60%)",
        "--color-rgba": "rgba(59, 130, 246, 0.5)",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(4);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--color-hex", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--color-rgb", "rgb(59, 130, 246)");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--color-hsl", "hsl(217, 91%, 60%)");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--color-rgba", "rgba(59, 130, 246, 0.5)");
    });

    it("should handle palette with special characters in keys", () => {
      const palette: Palette = {
        "--color-with-dashes": "#3b82f6",
        "--color_with_underscores": "#ef4444",
        "--color.with.dots": "#10b981",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(3);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--color-with-dashes", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--color_with_underscores", "#ef4444");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--color.with.dots", "#10b981");
    });

    it("should handle palette with undefined values gracefully", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-600": undefined as any,
        "--primary-700": "#1d4ed8",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(3);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-600", undefined);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-700", "#1d4ed8");
    });

    it("should handle palette with null values gracefully", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-600": null as any,
        "--primary-700": "#1d4ed8",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(3);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-600", null);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-700", "#1d4ed8");
    });

    it("should not throw error when document is undefined", () => {
      // Temporarily remove document
      const originalDocument = global.document;
      (global as any).document = undefined;

      const palette: Palette = {
        "--primary-500": "#3b82f6",
      };

      expect(() => applyColorPaletteToDom(palette)).not.toThrow();

      // Restore document
      global.document = originalDocument;
    });

    it("should handle palette with very long property names", () => {
      const palette: Palette = {
        "--very-long-property-name-that-might-cause-issues": "#3b82f6",
        "--another-very-long-property-name-with-many-characters": "#ef4444",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(2);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith(
        "--very-long-property-name-that-might-cause-issues",
        "#3b82f6"
      );
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith(
        "--another-very-long-property-name-with-many-characters",
        "#ef4444"
      );
    });

    it("should handle palette with very long color values", () => {
      const palette: Palette = {
        "--primary-500": "#3b82f6",
        "--primary-500-very-long":
          "rgba(59, 130, 246, 0.123456789012345678901234567890)",
      };

      applyColorPaletteToDom(palette);

      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledTimes(2);
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith("--primary-500", "#3b82f6");
      expect(
        mockDocument.documentElement.style.setProperty
      ).toHaveBeenCalledWith(
        "--primary-500-very-long",
        "rgba(59, 130, 246, 0.123456789012345678901234567890)"
      );
    });
  });
});
