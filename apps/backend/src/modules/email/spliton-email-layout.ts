import { SPLITON_BRAND } from '../../common/export/report-data.types';

export function buildSplitonEmailHtml(params: {
  title: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const cta =
    params.ctaLabel && params.ctaUrl
      ? `<p style="margin:24px 0 0;">
        <a href="${params.ctaUrl}" style="display:inline-block;padding:12px 18px;background:#84cc16;color:#18181b;font-weight:600;text-decoration:none;border-radius:8px;">
          ${params.ctaLabel}
        </a>
      </p>`
      : '';

  return `<!DOCTYPE html>
<html lang="ru">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Segoe UI,Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr><td align="center" style="padding:32px 16px;">
      <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e4e4e7;" cellpadding="0" cellspacing="0">
        <tr><td style="background:#84cc16;padding:20px 24px;">
          <div style="font-size:20px;font-weight:700;color:#18181b;">${SPLITON_BRAND.name}</div>
          <div style="font-size:12px;color:#3f3f46;margin-top:4px;">${SPLITON_BRAND.tagline}</div>
        </td></tr>
        <tr><td style="padding:24px;color:#18181b;font-size:15px;line-height:1.5;">
          <h1 style="margin:0 0 12px;font-size:18px;">${params.title}</h1>
          ${params.bodyHtml}
          ${cta}
        </td></tr>
        <tr><td style="padding:16px 24px 24px;font-size:12px;color:#71717a;border-top:1px solid #e4e4e7;">
          ${SPLITON_BRAND.disclaimer}<br/>
          Поддержка: <a href="mailto:${SPLITON_BRAND.supportEmail}" style="color:#65a30d;">${SPLITON_BRAND.supportEmail}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
