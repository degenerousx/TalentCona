import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ApiError } from "@/lib/api";
import { ErrorState } from "./States";

describe("ErrorState", () => {
  it("shows the backend's message and a Try again button that retries", async () => {
    const onRetry = vi.fn();
    render(<ErrorState error={new ApiError(400, "BAD", "Rate must be 0–100")} onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("Rate must be 0–100");

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it("explains a 403 and offers no retry", () => {
    render(<ErrorState error={new ApiError(403, "FORBIDDEN", "Forbidden")} onRetry={() => {}} />);

    expect(screen.getByText("You don't have access")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Try again" })).not.toBeInTheDocument();
  });
});
