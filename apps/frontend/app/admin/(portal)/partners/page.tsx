import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/routes";

/** Legacy URL — партнёры управляются в разделе рефералов. */
export default function AdminPartnersRedirectPage() {
  redirect(ROUTES.adminReferrals);
}
