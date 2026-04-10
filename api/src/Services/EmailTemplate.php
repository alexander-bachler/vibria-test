<?php
declare(strict_types=1);

namespace Vibria\Services;

class EmailTemplate
{
    private const PRIMARY = '#002633';
    private const ACCENT = '#00394d';
    private const RING = '#006080';
    private const BG = '#f6f4f4';
    private const TEXT = '#0d0d0d';
    private const MUTED = '#666666';
    private const BORDER = '#c5d0d4';
    private const WHITE = '#ffffff';

    private const FONT_STACK = "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif";
    private const FONT_HEADING = "'Barlow Condensed', 'Helvetica Neue', Helvetica, Arial, sans-serif";

    private string $siteUrl;
    private string $adminEmail;

    public function __construct(array $settings)
    {
        $this->siteUrl = rtrim($settings['site_url'] ?? 'https://vibria.art', '/');
        $this->adminEmail = $settings['admin_email'] ?? 'office@vibria.art';
    }

    private function colors(): array
    {
        return [
            'primary'     => self::PRIMARY,
            'accent'      => self::ACCENT,
            'ring'        => self::RING,
            'bg'          => self::BG,
            'text'        => self::TEXT,
            'muted'       => self::MUTED,
            'border'      => self::BORDER,
            'white'       => self::WHITE,
            'fontStack'   => self::FONT_STACK,
            'fontHeading' => self::FONT_HEADING,
        ];
    }

    public function render(string $title, string $content, bool $isAdmin = false): string
    {
        $c = $this->colors();
        $preheader = strip_tags(mb_substr($content, 0, 120));
        $year = date('Y');
        $logoUrl = $this->siteUrl . '/images/logos/vibria_logo_white.svg';
        $siteUrl = $this->siteUrl;

        return <<<HTML
<!DOCTYPE html>
<html lang="de" xmlns:v="urn:schemas-microsoft-com:vml">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>{$title}</title>
<!--[if mso]>
<style>table,td{font-family:Arial,Helvetica,sans-serif!important}</style>
<![endif]-->
</head>
<body style="margin:0;padding:0;background-color:{$c['bg']};font-family:{$c['fontStack']};-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;">
<span style="display:none;font-size:1px;color:{$c['bg']};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">{$preheader}</span>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:{$c['bg']};">
<tr><td style="padding:24px 16px;">

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:580px;margin:0 auto;">

  <!-- Header -->
  <tr>
    <td style="background-color:{$c['primary']};padding:28px 32px;border-radius:6px 6px 0 0;text-align:center;">
      <img src="{$logoUrl}" alt="VIBRIA" width="140" style="display:inline-block;height:auto;max-width:140px;border:0;" />
    </td>
  </tr>

  <!-- Title Bar -->
  <tr>
    <td style="background-color:{$c['accent']};padding:16px 32px;">
      <h1 style="margin:0;font-family:{$c['fontHeading']};font-size:18px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;color:{$c['white']};">{$title}</h1>
    </td>
  </tr>

  <!-- Content -->
  <tr>
    <td style="background-color:{$c['white']};padding:32px;border-left:1px solid {$c['border']};border-right:1px solid {$c['border']};">
      {$content}
    </td>
  </tr>

  <!-- Footer -->
  <tr>
    <td style="background-color:{$c['primary']};padding:24px 32px;border-radius:0 0 6px 6px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="color:rgba(255,255,255,0.6);font-family:{$c['fontStack']};font-size:11px;line-height:1.6;">
            VIBRIA | Kunst- und Kulturverein<br>
            Reichsapfelgasse 1/30, 1150 Wien<br>
            <a href="mailto:office@vibria.art" style="color:rgba(255,255,255,0.6);text-decoration:underline;">office@vibria.art</a>
            &nbsp;&middot;&nbsp;
            <a href="{$siteUrl}" style="color:rgba(255,255,255,0.6);text-decoration:underline;">vibria.art</a>
          </td>
        </tr>
        <tr>
          <td style="padding-top:12px;color:rgba(255,255,255,0.3);font-family:{$c['fontStack']};font-size:10px;">
            &copy; {$year} VIBRIA | Kunst- und Kulturverein Wien
          </td>
        </tr>
      </table>
    </td>
  </tr>

</table>

</td></tr>
</table>
</body>
</html>
HTML;
    }

    public function reservationConfirmation(array $event, array $data, string $zoneLabel, string $dateFormatted): string
    {
        $c = $this->colors();
        $name = htmlspecialchars($data['name']);
        $eventTitle = htmlspecialchars($event['title']);
        $time = htmlspecialchars($event['time']);
        $seats = (int)$data['seats'];
        $seatWord = $seats === 1 ? 'Platz' : 'Plätze';

        $content = <<<HTML
<p style="margin:0 0 20px;font-family:{$c['fontStack']};font-size:14px;line-height:1.7;color:{$c['text']};">
  Liebe/r {$name},
</p>
<p style="margin:0 0 24px;font-family:{$c['fontStack']};font-size:14px;line-height:1.7;color:{$c['text']};">
  Ihre Reservierung wurde erfolgreich entgegengenommen. Hier die Details:
</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background-color:{$c['bg']};border-radius:4px;border:1px solid {$c['border']};">
  <tr>
    <td style="padding:20px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:0 0 12px;">
            <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Veranstaltung</span>
            <span style="font-family:{$c['fontHeading']};font-size:16px;font-weight:700;color:{$c['primary']};">{$eventTitle}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 12px;border-top:1px solid {$c['border']};padding-top:12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="50%" style="vertical-align:top;">
                  <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Datum</span>
                  <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">{$dateFormatted}</span>
                </td>
                <td width="50%" style="vertical-align:top;">
                  <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Uhrzeit</span>
                  <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">{$time} Uhr</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0;border-top:1px solid {$c['border']};padding-top:12px;">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="50%" style="vertical-align:top;">
                  <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Plätze</span>
                  <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">{$seats} {$seatWord}</span>
                </td>
                <td width="50%" style="vertical-align:top;">
                  <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Sitzbereich</span>
                  <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">{$zoneLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;border-left:3px solid {$c['ring']};background-color:#f0f7fa;border-radius:0 4px 4px 0;">
  <tr>
    <td style="padding:14px 20px;">
      <p style="margin:0;font-family:{$c['fontStack']};font-size:13px;line-height:1.6;color:{$c['accent']};">
        Bitte nehmen Sie Ihren Platz spätestens 15&nbsp;Minuten vor Beginn ein. Nicht abgeholte Reservierungen werden danach freigegeben.
      </p>
    </td>
  </tr>
</table>

<p style="margin:0;font-family:{$c['fontStack']};font-size:14px;line-height:1.7;color:{$c['text']};">
  Mit freundlichen Grüßen<br>
  <strong style="font-family:{$c['fontHeading']};color:{$c['primary']};">VIBRIA | Kunst- und Kulturverein</strong>
</p>
HTML;

        return $this->render('Reservierungsbestätigung', $content);
    }

    public function reservationAdminNotification(array $event, array $data, string $zoneLabel, string $dateFormatted): string
    {
        $c = $this->colors();
        $name = htmlspecialchars($data['name']);
        $email = htmlspecialchars($data['email']);
        $phone = isset($data['phone']) && trim((string)$data['phone']) !== '' ? htmlspecialchars($data['phone']) : '–';
        $eventTitle = htmlspecialchars($event['title']);
        $time = htmlspecialchars($event['time']);
        $seats = (int)$data['seats'];
        $adminUrl = $this->siteUrl . '/admin/reservations';

        $content = <<<HTML
<p style="margin:0 0 20px;font-family:{$c['fontStack']};font-size:14px;line-height:1.7;color:{$c['text']};">
  Es liegt eine neue Platzreservierung vor:
</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background-color:{$c['bg']};border-radius:4px;border:1px solid {$c['border']};">
  <tr>
    <td style="padding:20px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:0 0 12px;">
            <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Veranstaltung</span>
            <span style="font-family:{$c['fontHeading']};font-size:16px;font-weight:700;color:{$c['primary']};">{$eventTitle}</span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0;border-top:1px solid {$c['border']};">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td width="50%">
                  <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Datum</span>
                  <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">{$dateFormatted}, {$time} Uhr</span>
                </td>
                <td width="50%">
                  <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Plätze</span>
                  <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">{$seats} &middot; {$zoneLabel}</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid {$c['border']};">
            <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:4px;">Kontaktdaten</span>
            <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">
              {$name}<br>
              <a href="mailto:{$email}" style="color:{$c['ring']};text-decoration:none;">{$email}</a><br>
              {$phone}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
  <tr>
    <td style="display:inline-block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['white']};background-color:#b45309;padding:4px 10px;border-radius:3px;font-weight:600;">
      Status: Ausstehend
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0">
  <tr>
    <td style="border-radius:4px;background-color:{$c['primary']};">
      <a href="{$adminUrl}" target="_blank" style="display:inline-block;font-family:{$c['fontHeading']};font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:{$c['white']};text-decoration:none;padding:12px 24px;">
        Reservierungen verwalten &rarr;
      </a>
    </td>
  </tr>
</table>
HTML;

        return $this->render('Neue Reservierung', $content, true);
    }

    public function contactAdminNotification(array $data): string
    {
        $c = $this->colors();
        $name = htmlspecialchars($data['name']);
        $email = htmlspecialchars($data['email']);
        $subject = htmlspecialchars($data['subject'] ?? 'Kein Betreff');
        $message = nl2br(htmlspecialchars($data['message']));

        $content = <<<HTML
<p style="margin:0 0 20px;font-family:{$c['fontStack']};font-size:14px;line-height:1.7;color:{$c['text']};">
  Neue Kontaktanfrage über das Website-Formular:
</p>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;background-color:{$c['bg']};border-radius:4px;border:1px solid {$c['border']};">
  <tr>
    <td style="padding:20px 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td style="padding:0 0 12px;">
            <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Von</span>
            <span style="font-family:{$c['fontStack']};font-size:14px;color:{$c['text']};">
              {$name} &middot;
              <a href="mailto:{$email}" style="color:{$c['ring']};text-decoration:none;">{$email}</a>
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:12px 0 0;border-top:1px solid {$c['border']};">
            <span style="display:block;font-family:{$c['fontStack']};font-size:10px;text-transform:uppercase;letter-spacing:1px;color:{$c['muted']};margin-bottom:2px;">Betreff</span>
            <span style="font-family:{$c['fontHeading']};font-size:15px;font-weight:600;color:{$c['primary']};">{$subject}</span>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 24px;">
  <tr>
    <td style="padding:20px 24px;background-color:{$c['white']};border:1px solid {$c['border']};border-radius:4px;">
      <p style="margin:0;font-family:{$c['fontStack']};font-size:14px;line-height:1.7;color:{$c['text']};">
        {$message}
      </p>
    </td>
  </tr>
</table>

<table role="presentation" cellpadding="0" cellspacing="0">
  <tr>
    <td style="border-radius:4px;background-color:{$c['primary']};">
      <a href="mailto:{$email}" style="display:inline-block;font-family:{$c['fontHeading']};font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;color:{$c['white']};text-decoration:none;padding:12px 24px;">
        Direkt antworten &rarr;
      </a>
    </td>
  </tr>
</table>
HTML;

        return $this->render('Neue Kontaktanfrage', $content, true);
    }

    public function getHtmlHeaders(string $from, string $replyTo = ''): string
    {
        $headers = "MIME-Version: 1.0\r\n";
        $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
        $headers .= "From: {$from}\r\n";
        if ($replyTo) {
            $headers .= "Reply-To: {$replyTo}\r\n";
        }
        return $headers;
    }
}
