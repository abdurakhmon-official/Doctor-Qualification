'use client';

import { Award, BookOpen, ClipboardList, HelpCircle, TrendingUp, Users, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { StatCard } from '@/components/ui/StatCard';
import { useAdminDashboard } from '@/hooks/use-dashboard';

const BAR_COLOR = 'var(--color-primary)';

export function AdminDashboardView() {
  const t = useTranslations('dashboard.admin');
  const { data } = useAdminDashboard();

  if (!data) return <DashboardSkeleton />;

  const growthData = data.userGrowth.map((point) => ({ name: point.date.slice(5), count: point.count }));
  const submissionsData = data.submissionsPerDay.map((point) => ({ name: point.date.slice(5), count: point.count }));
  const specialtyData = data.scoresBySpecialty.map((row) => ({ name: row.label, score: row.avgScore }));

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold">{t('title')}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label={t('stats.userCount')} value={data.userCount} accent="primary" />
        <StatCard icon={BookOpen} label={t('stats.specialtyCount')} value={data.specialtyCount} accent="success" />
        <StatCard icon={ClipboardList} label={t('stats.examCount')} value={data.examCount} accent="warning" />
        <StatCard icon={HelpCircle} label={t('stats.questionCount')} value={data.questionCount} accent="primary" />
        <StatCard icon={Award} label={t('stats.certificateCount')} value={data.certificateCount} accent="success" />
        <StatCard icon={Zap} label={t('stats.todaySubmissions')} value={data.todaySubmissions} accent="warning" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('userGrowthTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={growthData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} width={28} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke={BAR_COLOR} strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('submissionsTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={submissionsData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} />
                  <YAxis allowDecimals={false} fontSize={12} tickLine={false} width={28} />
                  <Tooltip />
                  <Bar dataKey="count" fill={BAR_COLOR} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('scoresBySpecialtyTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            {specialtyData.length === 0 ? (
              <p className="text-muted-foreground">{t('chartEmpty')}</p>
            ) : (
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={specialtyData} layout="vertical" margin={{ left: 16 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" domain={[0, 100]} fontSize={12} tickLine={false} />
                    <YAxis type="category" dataKey="name" fontSize={12} tickLine={false} width={90} />
                    <Tooltip />
                    <Bar dataKey="score" fill={BAR_COLOR} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
