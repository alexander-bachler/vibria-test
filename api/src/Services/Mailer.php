<?php
declare(strict_types=1);

namespace Vibria\Services;

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

class Mailer
{
    private array $config;

    public function __construct(array $smtpConfig)
    {
        $this->config = $smtpConfig;
    }

    /**
     * @param list<array{cid: string, data: string, filename?: string, mime?: string}> $embeddedImages
     *        Inline images for HTML (CID). Required for clients like Gmail that block data: URIs in img src.
     */
    public function send(string $to, string $subject, string $htmlBody, string $replyTo = '', array $embeddedImages = []): bool
    {
        $tempFiles = [];
        try {
            if (!class_exists(PHPMailer::class)) {
                error_log('[VIBRIA Mailer] PHPMailer not installed — run composer update');
                return false;
            }

            $mail = new PHPMailer(true);

            $mail->isSMTP();
            $mail->Host       = $this->config['host'];
            $mail->SMTPAuth   = true;
            $mail->Username   = $this->config['username'];
            $mail->Password   = $this->config['password'];
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port       = (int) $this->config['port'];
            $mail->CharSet    = 'UTF-8';

            $mail->setFrom(
                $this->config['from_email'] ?? 'noreply@vibria.art',
                $this->config['from_name'] ?? 'VIBRIA'
            );
            $mail->addAddress($to);

            if ($replyTo !== '') {
                $mail->addReplyTo($replyTo);
            }

            foreach ($embeddedImages as $emb) {
                $tmp = tempnam(sys_get_temp_dir(), 'vibria_emb_');
                if ($tmp === false) {
                    continue;
                }
                file_put_contents($tmp, $emb['data']);
                $tempFiles[] = $tmp;
                $mail->addEmbeddedImage(
                    $tmp,
                    $emb['cid'],
                    $emb['filename'] ?? 'image.png',
                    PHPMailer::ENCODING_BASE64,
                    $emb['mime'] ?? 'image/png'
                );
            }

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body    = $htmlBody;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $htmlBody));

            $mail->send();
            return true;
        } catch (\Throwable $e) {
            error_log('[VIBRIA Mailer] Failed to send to ' . $to . ': ' . $e->getMessage());
            return false;
        } finally {
            foreach ($tempFiles as $f) {
                @unlink($f);
            }
        }
    }
}
