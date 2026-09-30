import { useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Camera,
  ImageUp,
  Compass,
  Trophy,
  Info,
  Menu,
  ChevronDown,
  Medal,
} from "lucide-react";
import type { ComponentType } from "react";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
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
 * CTA area), which is what caused the overlap — so the safe fix is to keep the
 * always-inline set fixed-width rather than trying to guess a breakpoint wide
 * enough to fit everything.
 */
const SECONDARY_NAV: NavItem[] = [
  { to: "/rating-game", label: "Rating Game", icon: Medal },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/about", label: "About", icon: Info },
];

const ALL_NAV = [...PRIMARY_NAV, ...SECONDARY_NAV];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (item: NavItem) => pathname === item.to;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="drip-aura" aria-hidden="true" />

      {/* Top navbar. Three fixed columns (logo / nav / CTA) — the nav
          column's content is capped so it can never outgrow its track and
          spill into the columns beside it. Solid Navy with a layered cast
          shadow (drip-navbar) on every route. */}
      <header className="drip-navbar sticky top-0 z-40">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-2 px-4 sm:px-6 lg:px-8">
          {/* LEFT: brand */}
          <Logo className="shrink-0" onDark />

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
                  className="flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-3 py-2 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-ivory/75 transition-colors duration-200 hover:bg-ivory/10 hover:text-ivory"
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

          {/* RIGHT: primary CTA (desktop + tablet) */}
          <div className="hidden min-w-0 shrink-0 items-center gap-3 md:flex">
            <Link
              to="/live"
              className="drip-btn-light shrink-0 whitespace-nowrap px-4 py-2 text-xs"
            >
              Check My Fit
            </Link>
          </div>

          {/* Mobile: compact CTA + hamburger trigger */}
          <div className="flex shrink-0 items-center gap-2 md:hidden">
            <Link to="/live" className="drip-btn-light whitespace-nowrap px-3.5 py-2 text-xs">
              Check My Fit
            </Link>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open menu"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ivory/25 text-ivory transition-colors duration-200 hover:border-ivory/45 hover:bg-ivory/10"
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

                    return (
                      <SheetClose asChild key={item.to}>
                        <Link
                          to={item.to}
                          aria-current={active ? "page" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                            active ? "bg-sand text-accent" : "text-foreground hover:bg-sand",
                          )}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    );
                  })}
                </nav>
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
  return (
    <Link
      to={item.to}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-2 text-[0.7rem] uppercase tracking-[0.12em] transition-colors duration-200 lg:px-3",
        active ? "text-champagne" : "text-ivory/75 hover:bg-ivory/10 hover:text-ivory",
      )}
    >
      <item.icon className="hidden h-[13px] w-[13px] shrink-0 lg:block" />
      {item.label}
      <span
        aria-hidden="true"
        className={cn(
          "absolute -bottom-[1px] left-3 right-3 h-[1.5px] origin-left scale-x-0 bg-champagne transition-transform duration-300 ease-out group-hover:scale-x-100",
          active && "scale-x-100",
        )}
      />
    </Link>
  );
}

function DropdownMenuNavItem({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <DropdownMenuItem asChild>
      <Link
        to={item.to}
        aria-current={active ? "page" : undefined}
        className={cn("flex w-full items-center gap-2.5 text-sm", active && "text-accent")}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {item.label}
      </Link>
    </DropdownMenuItem>
  );
}
