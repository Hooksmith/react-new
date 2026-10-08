import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { AppShell, Button, LoanStatusBadge, TextField } from "./index";

describe("TextField", () => {
  it("associates the label and announces errors", () => {
    render(<TextField label="Email" error="Enter a valid email address" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAccessibleDescription("Enter a valid email address");
    expect(screen.getByRole("alert")).toHaveTextContent("Enter a valid email address");
  });
});

describe("Button", () => {
  it("is disabled and busy while loading", () => {
    render(<Button loading>Submit</Button>);
    const button = screen.getByRole("button", { name: /submit/i });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });
});

describe("LoanStatusBadge", () => {
  it("conveys status as text, not colour alone", () => {
    render(<LoanStatusBadge status="UNDER_REVIEW" />);
    expect(screen.getByText("Under review")).toBeInTheDocument();
  });
});

describe("AppShell", () => {
  const FakeLink = ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} data-soft-nav="true" {...rest}>
      {children}
    </a>
  );

  it("uses soft navigation within a zone and hard links across zones", () => {
    render(
      <AppShell currentZone="shell" activeHref="/" LinkComponent={FakeLink}>
        content
      </AppShell>,
    );
    const nav = screen.getByRole("navigation", { name: "Primary" });
    const dashboard = nav.querySelector('a[href="/"]');
    const loans = nav.querySelector('a[href="/loans"]');
    expect(dashboard).toHaveAttribute("data-soft-nav", "true");
    expect(dashboard).toHaveAttribute("aria-current", "page");
    expect(loans).not.toHaveAttribute("data-soft-nav");
  });

  it("toggles the mobile menu with an accessible button", async () => {
    render(
      <AppShell currentZone="loans" activeHref="/loans" LinkComponent={FakeLink}>
        content
      </AppShell>,
    );
    const toggle = screen.getByRole("button", { name: "Open menu" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(toggle);
    expect(screen.getByRole("navigation", { name: "Primary mobile" })).toBeInTheDocument();
  });
});
