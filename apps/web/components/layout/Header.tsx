'use client';

import { LayoutGrid, Menu, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useSession, useSignOut } from '@/hooks/use-auth';

export function Header() {
  const t = useTranslations('nav');
  const { user, isAuthenticated } = useSession();
  const signOut = useSignOut();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2.5 font-bold tracking-tight" onClick={closeMenu}>
          <span className="flex size-8.5 shrink-0 items-center justify-center rounded-[9px] bg-primary">
            <LayoutGrid className="size-4.5 text-primary-foreground" />
          </span>
          <span className="truncate">{t('brand')}</span>
        </Link>

        <div className="hidden items-center gap-3 sm:flex">
          <LanguageSwitcher />
          <ThemeToggle />

          {isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm">
                    {t('admin')}
                  </Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={signOut}>
                {t('signOut')}
              </Button>
            </>
          ) : (
            <>
              <Link href="/sign-in">
                <Button variant="ghost" size="sm">
                  {t('signIn')}
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">{t('signUp')}</Button>
              </Link>
            </>
          )}
        </div>

        <div className="flex items-center gap-1 sm:hidden">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            className="size-9 px-0"
            aria-label={menuOpen ? t('closeMenu') : t('openMenu')}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-background px-4 py-4 sm:hidden">
          <nav className="flex flex-col gap-1">
            {isAuthenticated ? (
              <>
                {user?.role === 'ADMIN' && (
                  <Link href="/admin" onClick={closeMenu}>
                    <Button variant="ghost" size="sm" className="w-full justify-start">
                      {t('admin')}
                    </Button>
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link href="/sign-in" onClick={closeMenu}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    {t('signIn')}
                  </Button>
                </Link>
                <Link href="/sign-up" onClick={closeMenu}>
                  <Button variant="ghost" size="sm" className="w-full justify-start">
                    {t('signUp')}
                  </Button>
                </Link>
              </>
            )}
          </nav>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <LanguageSwitcher />
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  closeMenu();
                  signOut();
                }}
              >
                {t('signOut')}
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
