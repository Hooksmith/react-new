import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { ZoneLink } from "./loans-chrome";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href} data-next-href={href}>
      {children}
    </a>
  ),
}));

describe("ZoneLink", () => {
  it("strips the zone basePath before handing the href to next/link", () => {
    render(<ZoneLink href="/loans/apply">Apply</ZoneLink>);
    expect(screen.getByText("Apply")).toHaveAttribute("data-next-href", "/apply");
  });

  it("maps the zone root to '/'", () => {
    render(<ZoneLink href="/loans">Loans</ZoneLink>);
    expect(screen.getByText("Loans")).toHaveAttribute("data-next-href", "/");
  });
});
