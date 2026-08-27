'use client';

import { pdf } from '@react-pdf/renderer';
import { AlertTriangle, Award, Download, ShieldCheck, XCircle } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import type { Locale } from '@repo/contracts';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { CertificateDocument } from '@/components/certificate/CertificateDocument';
import { pickLocalized } from '@/lib/localized';
import { LEVEL_BADGE_VARIANT } from '@/lib/utils';
import { useCertificate } from '@/hooks/use-certificates';

export function CertificateDetailView({ certificateId }: { certificateId: string }) {
  const t = useTranslations('certificate');
  const tLevel = useTranslations('attempts.result.level');
  const locale = useLocale() as Locale;
  const { data: certificate, isError } = useCertificate(certificateId);
  const [verifyUrl, setVerifyUrl] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    setVerifyUrl(window.location.href);
  }, []);

  if (isError) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3 px-4 py-20 text-center">
        <XCircle className="size-10 text-destructive" />
        <p className="text-lg font-semibold">{t('notFound')}</p>
      </div>
    );
  }

  if (!certificate) return null;

  const specialtyName = pickLocalized(certificate.specialtyName, locale);
  const levelLabel = tLevel(certificate.level);
  const invalid = certificate.revoked || certificate.expired;

  const onDownload = async () => {
    setDownloading(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(verifyUrl || certificateId, { margin: 1 });

      const blob = await pdf(
        <CertificateDocument
          certificate={certificate}
          specialtyName={specialtyName}
          levelLabel={levelLabel}
          qrDataUrl={qrDataUrl}
          issuedAtFormatted={new Date(certificate.issuedAt).toLocaleDateString(locale)}
          labels={{
            brand: t('pdf.brand'),
            title: t('pdf.title'),
            subtitle: t('pdf.subtitle'),
            bodyText: t('pdf.bodyText'),
            specialtyLabel: t('specialty'),
            scoreLabel: t('score'),
            dateLabel: t('issuedAt'),
            idLabel: t('certificateId'),
            levelLabel: t('level'),
          }}
        />,
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.certificateId}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error(t('downloadFailed'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-10">
      {invalid && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="size-4 shrink-0" />
          {certificate.revoked ? t('revokedNotice') : t('expiredNotice')}
        </div>
      )}

      <Card className="overflow-hidden border-2 border-primary/20">
        <div className="bg-gradient-to-br from-primary/5 to-transparent p-1">
          <CardContent className="flex flex-col items-center gap-5 rounded-lg border border-dashed border-primary/30 py-10 text-center">
            <div className="flex items-center gap-2 text-primary">
              <Award className="size-6" />
              <span className="text-xs font-bold tracking-widest uppercase">{t('pdf.brand')}</span>
            </div>

            <div>
              <p className="text-2xl font-extrabold tracking-tight">{t('pdf.title')}</p>
              <p className="text-sm text-muted-foreground">{t('pdf.subtitle')}</p>
            </div>

            <p className="text-3xl font-bold">{certificate.userFullName}</p>

            <div className="flex items-center gap-2">
              <span className="font-semibold text-primary">{specialtyName}</span>
              <Badge variant={LEVEL_BADGE_VARIANT[certificate.level]}>{levelLabel}</Badge>
            </div>

            <div className="grid w-full max-w-md grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xs text-muted-foreground">{t('score')}</p>
                <p className="font-semibold">{certificate.score}%</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('issuedAt')}</p>
                <p className="font-semibold">{new Date(certificate.issuedAt).toLocaleDateString(locale)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('expiresAt')}</p>
                <p className="font-semibold">{new Date(certificate.expiresAt).toLocaleDateString(locale)}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              {t('certificateId')}: <span className="font-mono">{certificate.certificateId}</span>
            </p>

            {verifyUrl && (
              <div className="rounded-lg border border-border bg-card p-3">
                <QRCodeSVG value={verifyUrl} size={112} />
              </div>
            )}

            {!invalid && (
              <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="size-4" />
                {t('valid')}
              </div>
            )}
          </CardContent>
        </div>
      </Card>

      <Button onClick={onDownload} disabled={downloading || !verifyUrl} className="self-center">
        <Download className="size-4" />
        {downloading ? t('downloading') : t('downloadPdf')}
      </Button>
    </div>
  );
}
