import Link from "next/link";
import { Code2, Eye, User } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-(--color-border)/60 bg-(--color-background)/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-5 text-sm sm:flex-row sm:items-center">
        <div className="flex items-center gap-2 text-(--color-muted-foreground)">
          <span className="font-mono">web-tools</span>
          <span aria-hidden="true">·</span>
          <span>browser-based tools by donjor</span>
        </div>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <FooterLink href="/metadata-preview" internal icon={<Eye className="h-3.5 w-3.5" />}>
            Metadata preview
          </FooterLink>
          <FooterLink
            href="https://github.com/donjor/web-tools"
            icon={<Code2 className="h-3.5 w-3.5" />}
          >
            Source
          </FooterLink>
          <FooterLink
            href="https://github.com/donjor"
            icon={<User className="h-3.5 w-3.5" />}
          >
            @donjor
          </FooterLink>
        </nav>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  internal,
  icon,
  children,
}: {
  href: string;
  internal?: boolean;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  const cls =
    "flex items-center gap-1.5 text-(--color-muted-foreground) transition-colors hover:text-(--color-foreground)";
  if (internal) {
    return (
      <Link href={href} className={cls}>
        {icon}
        {children}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {icon}
      {children}
    </a>
  );
}
