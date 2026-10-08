import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm, safeNextPath } from "./login-form";

vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams("next=/loans") }));

describe("safeNextPath", () => {
  it.each([
    ["/loans/apply", "/loans/apply"],
    [null, "/"],
    ["https://evil.example", "/"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
  ])("%s → %s", (input, expected) => {
    expect(safeNextPath(input)).toBe(expected);
  });
});

describe("LoginForm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("shows inline validation errors without calling the API", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    render(<LoginForm />);

    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText("Username is required")).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toHaveAttribute("aria-invalid", "true");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("shows the server error on invalid credentials", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: { message: "Incorrect username or password" } }), {
          status: 401,
        }),
      ),
    );
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/username/i), "officer");
    await userEvent.type(screen.getByLabelText(/password/i), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Incorrect username or password");
  });
});
