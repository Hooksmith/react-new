import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useApplicationDraft } from "@/stores/application-draft-store";
import { ApplicationWizard } from "./application-wizard";

function renderWizard() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ApplicationWizard />
    </QueryClientProvider>,
  );
}

describe("ApplicationWizard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    useApplicationDraft.getState().clear();
  });

  it("blocks progress until the current step is valid", async () => {
    renderWizard();
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(await screen.findByText("Enter the applicant's full name")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /step 1 of 4/i })).toBeInTheDocument();
  });

  it("advances to employment once applicant details are valid", async () => {
    renderWizard();
    await userEvent.type(screen.getByLabelText(/full name/i), "Sokha Chan");
    await userEvent.type(screen.getByLabelText(/national id/i), "012345678");
    await userEvent.type(screen.getByLabelText(/email/i), "sokha@example.com");
    await userEvent.type(screen.getByLabelText(/phone/i), "+85512345678");
    await userEvent.type(screen.getByLabelText(/date of birth/i), "1990-05-01");
    await userEvent.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByRole("heading", { name: /step 2 of 4: employment/i }),
    ).toBeInTheDocument();
    expect(screen.getByText("(completed)")).toBeInTheDocument();
  });
});
