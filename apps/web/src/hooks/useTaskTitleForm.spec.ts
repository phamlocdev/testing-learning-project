import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTaskTitleForm } from "./useTaskTitleForm";

describe("useTaskTitleForm", () => {
  it("starts with an empty title and no error", () => {
    // Arrange & Act
    const { result } = renderHook(() => useTaskTitleForm());

    // Assert
    expect(result.current.title).toBe("");
    expect(result.current.error).toBeNull();
  });

  it("updates the title when setTitle is called", () => {
    // Arrange
    const { result } = renderHook(() => useTaskTitleForm());

    // Act
    act(() => {
      result.current.setTitle("Write report");
    });

    // Assert
    expect(result.current.title).toBe("Write report");
  });

  it("sets an error and returns false when validating an empty title", () => {
    // Arrange
    const { result } = renderHook(() => useTaskTitleForm());

    // Act
    let isValid = true;
    act(() => {
      isValid = result.current.validate();
    });

    // Assert
    expect(isValid).toBe(false);
    expect(result.current.error).toBe("Title is required");
  });

  it("sets an error and returns false when validating a whitespace-only title", () => {
    // Arrange
    const { result } = renderHook(() => useTaskTitleForm());
    act(() => {
      result.current.setTitle("   ");
    });

    // Act
    let isValid = true;
    act(() => {
      isValid = result.current.validate();
    });

    // Assert
    expect(isValid).toBe(false);
    expect(result.current.error).toBe("Title is required");
  });

  it("returns true and clears the error when validating a non-empty title", () => {
    // Arrange
    const { result } = renderHook(() => useTaskTitleForm());
    act(() => {
      result.current.setTitle("Write report");
    });

    // Act
    let isValid = false;
    act(() => {
      isValid = result.current.validate();
    });

    // Assert
    expect(isValid).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it("clears a previous error as soon as the title changes", () => {
    // Arrange
    const { result } = renderHook(() => useTaskTitleForm());
    act(() => {
      result.current.validate();
    });
    expect(result.current.error).toBe("Title is required");

    // Act
    act(() => {
      result.current.setTitle("Write report");
    });

    // Assert
    expect(result.current.error).toBeNull();
  });
});
