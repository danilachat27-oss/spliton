"use client";



import { LocalizedErrorScreen } from "@/components/i18n/localized-error-screen";



type ErrorPageProps = {

  error: Error & { digest?: string };

  reset: () => void;

};



export default function GlobalError({ error, reset }: ErrorPageProps) {

  return <LocalizedErrorScreen error={error} reset={reset} />;

}

