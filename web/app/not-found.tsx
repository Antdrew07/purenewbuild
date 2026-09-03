import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import { StarDivider } from "@/components/ui/Chrome";

export default function NotFound() {
  return (
    <div className="grid min-h-[70vh] place-items-center px-5 pt-32 text-center">
      <div>
        <p className="font-display text-8xl font-black leading-none text-red">404</p>
        <div className="mt-6"><StarDivider /></div>
        <h1 className="mt-6 font-display text-3xl font-black uppercase text-text-primary">
          Nothing on this bench
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm text-text-secondary">
          That page has been moved or never existed. The catalog is still where you left it.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <ButtonLink href="/products">Browse catalog</ButtonLink>
          <ButtonLink href="/" variant="outline">Go home</ButtonLink>
        </div>
      </div>
    </div>
  );
}
