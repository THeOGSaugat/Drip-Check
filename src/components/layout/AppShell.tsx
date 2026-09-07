import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Camera,
  ImageUp,
  Compass,
  Trophy,
  Bookmark,
  User,
  LogOut,
  Info,
  Menu,
  Shirt,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import type { ComponentType } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useUser } from "@/hooks/use-user";
import { signOut } from "@/lib/auth-actions";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  /** True for links that leave the app (a different deployed site). Rendered as <a>, not router <Link>. */
  external?: boolean;
};

/**
 * Always visible inline from md up. Kept short and FIXED — this list's total
 * width is what the nav track is sized around, so it must never grow without
 * re-checking that it still fits at 768px (the narrowest desktop width).
 */
const PRIMARY_NAV: NavItem[] = [
  { to: "/", label: "Home", icon: Home },
  { to: "/live", label: "Live Check", icon: Camera },
  { to: "/check", label: "Photo Check", icon: ImageUp },
  { to: "/discover", label: "Discover", icon: Compass },
];

/**
 * Always lives behind the "More" dropdown on every desktop breakpoint —
 * intentionally never unfolds inline. A centered flex row that overflows its
 * grid track spills into BOTH neighboring columns at once (the logo and the
 * auth/CTA area), which is what caused the overlap — so the safe fix is to
 * keep the always-inline set fixed-width rather than trying to guess a
 * breakpoint wide enough to fit everything.
 */
const SECONDARY_NAV: NavItem[] = [
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/saved", label: "Saved", icon: Bookmark },
  {
    to: "https://dripcheck-outfit-changer.lovable.app/",
    label: "Outfit Changer",
    icon: Shirt,
    external: true,
  },
  { to: "/profile", label: "Profile", icon: User },
  { to: "/about", label: "About", icon: Info },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (item: NavItem) => !item.external && pathname === item.to;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="drip-aura" aria-hidden="true" />

      {/* Top navbar. Three fixed columns (logo / nav / auth+CTA) — the nav
          column's content is capped so it can never outgrow its track and
          spill into the columns beside it. */}
      <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          {/* LEFT: brand */}
          <Logo className="shrink-0" />

          {/* CENTER: primary navigation — hidden below md. Fixed-width set
              plus a "More" trigger; never grows past what fits at 768px. */}
          <nav
            aria-label="Primary"
            className="hidden shrink-0 items-center gap-0.5 md:flex lg:gap-1"
          >
            {PRIMARY_NAV.map((item) => (
              <NavLink key={item.to} item={item} active={isActive(item)} />
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:bg-sand hover:text-foreground"
                >
                  More
                  <ChevronDown className="h-3 w-3" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-52">
                {SECONDARY_NAV.map((item) => (
                  <DropdownMenuNavItem key={item.to} item={item} active={isActive(item)} />
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* RIGHT: auth + primary CTA (desktop + tablet) */}
          <div className="hidden min-w-0 shrink-0 items-center gap-3 md:flex">
            <AuthStatusInline />
            <Link
              to="/live"
              className="drip-btn-primary shrink-0 whitespace-nowrap px-4 py-2 text-xs"
            >
              Check My Fit
            </Link>
          </div>

          {/* Mobile: compact CTA + hamburger trigger */}
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Link to="/live" className="drip-btn-primary whitespace-nowrap px-3.5 py-2 text-xs">
              Check My Fit
            </Link>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-sand"
                >
                  <Menu className="h-4 w-4" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="flex w-[82%] flex-col gap-0 p-0 sm:max-w-xs">
                <SheetHeader className="border-b border-border px-5 py-5 text-left">
                  <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                  <Logo />
                </SheetHeader>

                <nav aria-label="Mobile" className="flex flex-col gap-1 overflow-y-auto px-3 py-4">
                  {ALL_NAV.map((item) => {
                    const active = isActive(item);
                    const itemClassName = cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active ? "bg-sand text-accent" : "text-foreground hover:bg-sand",
                    );

                    if (item.external) {
                      return (
                        <a
                          key={item.to}
                          href={item.to}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={itemClassName}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        </a>
                      );
                    }

                    return (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to}
                          aria-current={active ? "page" : undefined}
                          className={itemClassName}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>

                <div className="mt-auto border-t border-border px-5 py-5">
                  <AuthStatusMobile onNavigate={() => setMenuOpen(false)} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="pb-10">{children}</main>
    </div>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const className = cn(
    "group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[0.7rem] uppercase tracking-[0.12em] transition-colors duration-200 lg:px-3",
    active ? "text-accent" : "text-muted-foreground hover:bg-sand hover:text-foreground",
  );

  if (item.external) {
    return (
      <a href={item.to} target="_blank" rel="noopener noreferrer" className={className}>
        <item.icon className="hidden h-[13px] w-[13px] shrink-0 lg:block" />
        {item.label}
      </a>
    );
  }

  return (
    <Link to={item.to} aria-current={active ? "page" : undefined} className={className}>
      <item.icon className="hidden h-[13px] w-[13px] shrink-0 lg:block" />
      {item.label}
      <span
        aria-hidden="true"
        className={cn(
          "absolute -bottom-[1px] left-3 right-3 h-[1.5px] origin-left scale-x-0 bg-accent transition-transform duration-200 group-hover:scale-x-100",
          active && "scale-x-100",
        )}
      />
    </Link>
  );
}

function DropdownMenuNavItem({ item, active }: { item: NavItem; active: boolean }) {
  const className = cn("flex w-full items-center gap-2.5 text-sm", active && "text-accent");

  if (item.external) {
    return (
      <DropdownMenuItem asChild>
        <a href={item.to} target="_blank" rel="noopener noreferrer" className={className}>
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
          <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </a>
      </DropdownMenuItem>
    );
  }

  return (
    <DropdownMenuItem asChild>
      <Link to={item.to} aria-current={active ? "page" : undefined} className={className}>
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    </DropdownMenuItem>
  );
}

function AuthStatusInline() {
  const { user, loading } = useUser();

  if (loading) return <div className="h-8 w-16" aria-hidden="true" />;

  if (!user) {
    return (
      <Link
        to="/auth"
        className="whitespace-nowrap text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        Sign in
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        to="/profile"
        className="flex max-w-[110px] items-center gap-1.5 truncate text-[0.72rem] text-muted-foreground hover:text-foreground lg:max-w-[140px]"
      >
        <User className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{user.email}</span>
      </Link>
      <button
        type="button"
        onClick={() => void signOut()}
        title="Sign out"
        className="shrink-0 rounded-full border border-border p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function AuthStatusMobile({ onNavigate }: { onNavigate: () => void }) {
  const { user, loading } = useUser();

  if (loading) return <div className="h-9" aria-hidden="true" />;

  if (!user) {
    return (
      <SheetClose asChild>
        <Link
          to="/auth"
          onClick={onNavigate}
          className="flex items-center justify-center rounded-xl border border-border py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-sand"
        >
          Sign in
        </Link>
      </SheetClose>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <SheetClose asChild>
        <Link
          to="/profile"
          onClick={onNavigate}
          className="flex min-w-0 items-center gap-2 truncate text-sm text-foreground"
        >
          <User className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate">{user.email}</span>
        </Link>
      </SheetClose>
      <button
        type="button"
        onClick={() => void signOut()}
        title="Sign out"
        className="shrink-0 rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}