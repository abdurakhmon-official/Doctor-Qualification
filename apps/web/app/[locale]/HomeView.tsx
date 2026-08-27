'use client';

import {
  Award,
  BadgeCheck,
  ClipboardList,
  Clock3,
  FileCheck2,
  ListChecks,
  Search,
  ShieldCheck,
  Stethoscope,
  Trophy,
  UserPlus,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import type { Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { StatCard } from '@/components/ui/StatCard';
import { Link, useRouter } from '@/i18n/navigation';
import { pickLocalized } from '@/lib/localized';
import { useSpecialties } from '@/hooks/use-specialties';
import { usePublicStats } from '@/hooks/use-dashboard';

export function HomeView() {
  const t = useTranslations('home');
  const tAuth = useTranslations('auth');
  const locale = useLocale() as Locale;
  const router = useRouter();

  const { data: specialties } = useSpecialties();
  const { data: stats } = usePublicStats();

  const [certificateId, setCertificateId] = useState('');

  const onVerify = (event: React.FormEvent) => {
    event.preventDefault();
    const id = certificateId.trim();
    if (id) router.push({ pathname: '/certificates/[certificateId]', params: { certificateId: id } });
  };

  return (
    <div className="flex flex-1 flex-col">
      {/* Hero */}
      <section className="border-b border-border bg-linear-to-b from-primary/5 to-transparent">
        <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2 lg:items-center lg:py-24">
          <div className="flex flex-col items-start gap-5">
            <Badge className="gap-1.5 px-3 py-1.5 text-xs">
              <BadgeCheck className="size-3.5" />
              {t('badge')}
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">{t('title')}</h1>
            <p className="max-w-xl text-lg text-muted-foreground">{t('subtitle')}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/exams">
                <Button size="lg">{t('ctaPrimary')}</Button>
              </Link>
              <a href="#how-it-works">
                <Button size="lg" variant="outline">
                  {t('ctaSecondary')}
                </Button>
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="border-primary/20">
              <CardContent className="flex flex-col items-center gap-3 py-6 text-center">
                <Award className="size-8 text-primary" />
                <p className="text-lg font-bold tracking-widest">{t('verify.title')}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-5">
                <form onSubmit={onVerify} className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    value={certificateId}
                    onChange={(event) => setCertificateId(event.target.value)}
                    placeholder={t('verify.placeholder')}
                    className="flex-1"
                  />
                  <Button type="submit" className="gap-1.5">
                    <Search className="size-4" />
                    {t('verify.button')}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <FeatureCard
          icon={Users}
          title={t('features.specialties.title')}
          subtitle={t('features.specialties.subtitle', { count: specialties?.length ?? 0 })}
        />
        <FeatureCard icon={ShieldCheck} title={t('features.certificate.title')} subtitle={t('features.certificate.subtitle')} />
        <FeatureCard icon={Trophy} title={t('features.levels.title')} subtitle={t('features.levels.subtitle')} />
        <FeatureCard icon={Clock3} title={t('features.timed.title')} subtitle={t('features.timed.subtitle')} />
      </section>

      {/* Stats + popular specialties */}
      <section className="border-y border-border bg-accent/30">
        <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 lg:grid-cols-3">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <h2 className="text-xl font-bold">{t('stats.title')}</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={Users} label={t('stats.userCount')} value={stats?.userCount ?? 0} accent="primary" />
              <StatCard icon={ListChecks} label={t('stats.attemptCount')} value={stats?.attemptCount ?? 0} accent="warning" />
              <StatCard icon={Award} label={t('stats.certificateCount')} value={stats?.certificateCount ?? 0} accent="success" />
              <StatCard icon={Trophy} label={t('stats.avgScore')} value={`${stats?.avgScore ?? 0}%`} accent="primary" />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">{t('popularSpecialties.title')}</h2>
              <Link href="/exams" className="text-sm text-primary hover:underline">
                {t('popularSpecialties.viewAll')}
              </Link>
            </div>
            <Card>
              <CardContent className="flex flex-col divide-y divide-border py-2">
                {!stats?.popularSpecialties.length ? (
                  <p className="py-3 text-sm text-muted-foreground">{t('popularSpecialties.empty')}</p>
                ) : (
                  stats.popularSpecialties.map((specialty) => (
                    <div key={specialty.id} className="flex items-center justify-between gap-3 py-2.5">
                      <span className="flex items-center gap-2 truncate text-sm font-medium">
                        <Stethoscope className="size-4 shrink-0 text-primary" />
                        {pickLocalized(specialty.name, locale)}
                      </span>
                      <span className="shrink-0 text-sm text-muted-foreground">
                        {t('popularSpecialties.count', { count: specialty.attemptCount })}
                      </span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto w-full max-w-6xl px-4 py-14">
        <h2 className="mb-8 text-center text-2xl font-bold">{t('howItWorks.title')}</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Step icon={UserPlus} index={1} title={t('howItWorks.steps.1.title')} description={t('howItWorks.steps.1.description')} />
          <Step icon={Stethoscope} index={2} title={t('howItWorks.steps.2.title')} description={t('howItWorks.steps.2.description')} />
          <Step icon={ClipboardList} index={3} title={t('howItWorks.steps.3.title')} description={t('howItWorks.steps.3.description')} />
          <Step icon={FileCheck2} index={4} title={t('howItWorks.steps.4.title')} description={t('howItWorks.steps.4.description')} />
          <Step icon={Award} index={5} title={t('howItWorks.steps.5.title')} description={t('howItWorks.steps.5.description')} />
        </div>
      </section>

      {/* CTA band */}
      <section className="bg-primary">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-5 px-4 py-10 text-center sm:flex-row sm:text-start">
          <div>
            <p className="text-xl font-bold text-primary-foreground">{t('ctaBand.title')}</p>
            <p className="text-primary-foreground/80">{t('ctaBand.subtitle')}</p>
          </div>
          <div className="flex shrink-0 flex-wrap justify-center gap-3">
            <Link href="/exams">
              <Button size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                {t('ctaPrimary')}
              </Button>
            </Link>
            <Link href="/sign-up">
              <Button size="lg" className="bg-primary-foreground text-primary hover:opacity-90">
                {tAuth('signUp.title')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, subtitle }: { icon: typeof Users; title: string; subtitle: string }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 py-5">
        <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function Step({ icon: Icon, index, title, description }: { icon: typeof Users; index: number; title: string; description: string }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="relative flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="size-6" />
        <span className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
          {index}
        </span>
      </span>
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
