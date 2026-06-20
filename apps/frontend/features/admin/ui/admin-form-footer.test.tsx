import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AdminDrawerCancelButton,
  AdminDrawerPrimaryButton,
} from "@/features/admin/components/admin-drawer-buttons";
import { AdminFormFooter } from "@/features/admin/ui/admin-form-footer";
import { AdminReferenceFieldHint } from "@/features/admin/ui/admin-reference-field-hint";
import { ROUTES } from "@/constants/routes";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/features/admin/hooks/use-admin-i18n", () => ({
  useAdminI18n: () => ({
    t: (key: string) =>
      (
        {
          "admin.reference.hint.genre": "Не нашли нужный жанр?",
          "admin.reference.action.openDictionary": "Открыть справочник",
        } as Record<string, string>
      )[key] ?? key,
  }),
}));

describe("admin form footer layout", () => {
  it("renders actions in a single aligned row", () => {
    render(
      <AdminFormFooter
        right={
          <>
            <AdminDrawerCancelButton>Отмена</AdminDrawerCancelButton>
            <AdminDrawerPrimaryButton>Подтвердить</AdminDrawerPrimaryButton>
          </>
        }
      />,
    );

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(buttons[0]).toHaveTextContent("Отмена");
    expect(buttons[1]).toHaveTextContent("Подтвердить");
    expect(buttons[0]?.className).toMatch(/h-9/);
    expect(buttons[1]?.className).toMatch(/h-9/);
  });

  it("renders reference hint with dictionary route", () => {
    render(<AdminReferenceFieldHint href={ROUTES.adminGenres} kind="genre" />);

    const link = screen.getByRole("link", { name: /Открыть справочник/i });
    expect(link).toHaveAttribute("href", ROUTES.adminGenres);
    expect(screen.getByText(/Не нашли нужный жанр/i)).toBeInTheDocument();
  });
});
