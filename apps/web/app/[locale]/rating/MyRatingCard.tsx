import { Trophy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { MyRatingOutput } from '@repo/contracts';
import { Card, CardContent } from '@/components/ui/Card';

export function MyRatingCard({ rating }: { rating: MyRatingOutput }) {
  const t = useTranslations('rating');

  if (!rating.eligible) {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 py-4 text-sm text-muted-foreground">
          <Trophy className="size-5 shrink-0 text-primary" />
          {t('notEligible')}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardContent className="flex flex-wrap items-center gap-6 py-4">
        <div className="flex items-center gap-2">
          <Trophy className="size-5 text-primary" />
          <span className="text-lg font-bold">
            {rating.rank} / {rating.total}
          </span>
          <span className="text-sm text-muted-foreground">{t('myRank')}</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {t('avgScore')}: <span className="font-semibold text-foreground">{rating.avgScore}%</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {t('bestScore')}: <span className="font-semibold text-foreground">{rating.bestScore}%</span>
        </div>
        <div className="text-sm text-muted-foreground">
          {t('attemptCount')}: <span className="font-semibold text-foreground">{rating.attemptCount}</span>
        </div>
      </CardContent>
    </Card>
  );
}
