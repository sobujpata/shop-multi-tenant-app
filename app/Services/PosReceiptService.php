<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Renders an 80 mm thermal-printer sales receipt as a single-page PDF.
 *
 * Completely independent from the A5 tenant order invoice: the page width is
 * the real 80 mm POS roll width, the page height grows with the content, and
 * every text row lives in its own fixed vertical slot with width-measured,
 * pre-trimmed text so columns and rows can never overlap.
 */
final class PosReceiptService
{
    private const ROLL_WIDTH = 226.8; // 80 mm at 72 dpi

    private const MARGIN_X = 16.0;

    private const BARCODE_HEIGHT = 28.0;

    /**
     * Adobe Helvetica (AFM) advance widths in 1/1000 em units.
     */
    private const CHAR_WIDTHS = [
        ' ' => 278, '!' => 278, '"' => 355, '#' => 556, '$' => 556, '%' => 889,
        '&' => 667, '\'' => 191, '(' => 333, ')' => 333, '*' => 389, '+' => 584,
        ',' => 278, '-' => 333, '.' => 278, '/' => 278, '0' => 556, '1' => 556,
        '2' => 556, '3' => 556, '4' => 556, '5' => 556, '6' => 556, '7' => 556,
        '8' => 556, '9' => 556, ':' => 278, ';' => 278, '<' => 584, '=' => 584,
        '>' => 584, '?' => 556, '@' => 1015, 'A' => 667, 'B' => 667, 'C' => 722,
        'D' => 722, 'E' => 667, 'F' => 611, 'G' => 778, 'H' => 722, 'I' => 278,
        'J' => 500, 'K' => 667, 'L' => 556, 'M' => 833, 'N' => 722, 'O' => 778,
        'P' => 667, 'Q' => 778, 'R' => 722, 'S' => 667, 'T' => 611, 'U' => 722,
        'V' => 667, 'W' => 944, 'X' => 667, 'Y' => 667, 'Z' => 611, '[' => 278,
        '\\' => 278, ']' => 278, '^' => 469, '_' => 556, '`' => 333, 'a' => 556,
        'b' => 556, 'c' => 500, 'd' => 556, 'e' => 556, 'f' => 278, 'g' => 556,
        'h' => 556, 'i' => 222, 'j' => 222, 'k' => 500, 'l' => 222, 'm' => 833,
        'n' => 556, 'o' => 556, 'p' => 556, 'q' => 556, 'r' => 333, 's' => 500,
        't' => 278, 'u' => 556, 'v' => 500, 'w' => 722, 'x' => 500, 'y' => 500,
        'z' => 500, '{' => 334, '|' => 260, '}' => 334, '~' => 584,
    ];

    private const BOLD_FACTOR = 1.09;

    /**
     * @param  array{
     *     store_name: string,
     *     branch_name: string,
     *     cashier: string,
     *     order_no: string,
     *     date: string,
     *     payment_label: string,
     *     items: array<int, array<string, mixed>>,
     *     subtotal: string,
     *     discount: string,
     *     total: string,
     *     paid: string,
     *     change?: string,
     * }  $data
     */
    public function toReceiptPdf(array $data): string
    {
        // Dry pass to measure the content; then the emit pass lays out the
        // same rows with absolute coordinates on the measured page height.
        $ops = [];
        $height = (int) ceil($this->layout($data, null, $ops));
        $ops = [];
        $this->layout($data, $height, $ops);

        return $this->pdfDocument($ops, self::ROLL_WIDTH, $height);
    }

    /**
     * The receipt body. When $pageHeight is null nothing is emitted and only
     * the content height is measured; otherwise operators are emitted at
     * absolute bottom-up coordinates.
     *
     * @param  array<string, mixed>  $data
     * @param  list<string>  $ops
     */
    private function layout(array $data, ?float $pageHeight, array &$ops): float
    {
        $pageWidth = self::ROLL_WIDTH;
        $marginX = self::MARGIN_X;
        $usableWidth = $pageWidth - $marginX * 2;
        $rightX = $pageWidth - $marginX;
        $rel = 16.0;

        $emitText = function (float $x, float $size, bool $bold, string $value) use (&$ops, $pageHeight, &$rel): void {
            if ($pageHeight !== null) {
                $ops[] = $this->pdfText($x, $pageHeight - $rel, $size, $bold, $this->sanitize($value));
            }
        };
        $emitTextRight = function (float $rightEdge, float $size, bool $bold, string $value) use (&$ops, $pageHeight, &$rel): void {
            if ($pageHeight !== null) {
                $ops[] = $this->pdfTextRight($rightEdge, $pageHeight - $rel, $size, $bold, $this->sanitize($value));
            }
        };
        $emitDashed = function () use (&$ops, $pageHeight, &$rel, $marginX, $usableWidth): void {
            if ($pageHeight !== null) {
                $y = $pageHeight - $rel;
                $ops[] = sprintf(
                    '[2 2] 0 d 0.35 G 0.5 w %.2f %.2f m %.2f %.2f l S [] 0 d 0 G',
                    $marginX,
                    $y,
                    $marginX + $usableWidth,
                    $y,
                );
            }
        };

        $centerRow = function (string $rawValue, float $size, bool $bold, float $maxWidth) use ($emitText, &$rel, $pageWidth): void {
            foreach ($this->pdfWrap($rawValue, $maxWidth, $size, $bold, 2) as $line) {
                $lineWidth = $this->textWidth($line, $size, $bold);
                $emitText(max($pageWidth / 2 - $lineWidth / 2, self::MARGIN_X), $size, $bold, $line);
                $rel += $size + 4.5;
            }
        };
        $pairRow = function (string $leftValue, string $rightValue, float $leftSize, bool $leftBold, float $leftWidth, float $rightWidth, ?float $rightSize = null, ?bool $rightBold = null) use ($emitText, $emitTextRight, &$rel, $marginX, $rightX): void {
            $usedRightSize = $rightSize ?? $leftSize;
            $usedRightBold = $rightBold ?? $leftBold;

            $emitText($marginX, $leftSize, $leftBold, $this->trimTo($leftValue, $leftWidth, $leftSize, $leftBold));
            $emitTextRight($rightX, $usedRightSize, $usedRightBold, $this->trimTo($rightValue, $rightWidth, $usedRightSize, $usedRightBold));
            $rel += max($leftSize, $usedRightSize) + 5.5;
        };

        // --- Header -------------------------------------------------------
        foreach ($this->pdfWrap($data['store_name'], $usableWidth * 0.92, 12.5, true, 2) as $storeLine) {
            $centerRow($storeLine, 12.5, true, $usableWidth * 0.92);
        }
        $rel += 2.0;

        $centerRow($data['branch_name'], 8.5, true, $usableWidth);
        $rel += 2.0;

        $pairRow('Date: '.$data['date'], '', 8.0, false, $usableWidth * 0.92, 0);
        $pairRow('Cashier: '.$data['cashier'], '', 8.0, false, $usableWidth * 0.92, 0);
        $rel += 2.0;

        $emitDashed();
        $rel += 8.0;

        // --- Items --------------------------------------------------------
        $pairRow('ITEM', 'AMOUNT', 8.0, true, $usableWidth * 0.6, $usableWidth * 0.3);
        $rel += 3.0;

        foreach ($data['items'] as $item) {
            $detail = $item['quantity'].' x '.strval($item['price']);

            foreach ($this->pdfWrap(strval($item['name']), $usableWidth, 8.0, false, 2) as $nameLine) {
                $emitText($marginX, 8.0, false, $nameLine);
                $rel += 11.5;
            }

            $emitText($marginX + 8.0, 8.0, false, $this->trimTo($detail, $usableWidth * 0.55, 8.0, false));
            $emitTextRight($rightX, 8.5, true, $this->trimTo(strval($item['total']), $usableWidth * 0.35, 8.5, true));
            $rel += 16.0;
        }

        $emitDashed();
        $rel += 8.0;

        // --- Totals -------------------------------------------------------
        $pairRow('Subtotal', $data['subtotal'], 8.0, false, $usableWidth * 0.6, $usableWidth * 0.35);

        $discountCents = (int) round((float) str_replace(',', '', $data['discount']) * 100);

        if ($discountCents > 0) {
            $pairRow('Discount', '-'.$data['discount'], 8.0, false, $usableWidth * 0.6, $usableWidth * 0.35);
        }

        $pairRow('TOTAL', $data['total'], 10.5, true, $usableWidth * 0.6, $usableWidth * 0.35);

        $pairRow('Paid ('.$data['payment_label'].')', $data['paid'], 8.0, false, $usableWidth * 0.6, $usableWidth * 0.35);

        $changeCents = (int) round((float) str_replace(',', '', strval($data['change'] ?? '0')) * 100);

        if ($changeCents > 0) {
            $pairRow('Change', $data['change'], 8.5, true, $usableWidth * 0.6, $usableWidth * 0.35);
        }

        $emitDashed();
        $rel += 10.0;

        // --- Footer -------------------------------------------------------
        $barcodeWidth = $usableWidth * 0.8;
        $barcodeX = $pageWidth / 2 - $barcodeWidth / 2;

        if ($pageHeight !== null) {
            $ops[] = $this->barcode(strval($data['order_no']), $barcodeX, $pageHeight - $rel - self::BARCODE_HEIGHT, $barcodeWidth);
        }
        $rel += self::BARCODE_HEIGHT + 10.0;

        $centerRow($data['order_no'], 9.0, true, $usableWidth);
        $rel += 3.0;

        $centerRow('Thank you for shopping!', 8.0, false, $usableWidth);
        $rel += 2.0;
        $centerRow('POS sale completed', 7.5, false, $usableWidth);
        $rel += 10.0;

        return $rel + 6.0;
    }

    /**
     * Assemble the single-page PDF objects, xref table, and trailer.
     *
     * @param  list<string>  $ops
     */
    private function pdfDocument(array $ops, float $pageWidth, float $pageHeight): string
    {
        $stream = implode("\n", $ops);
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Count 1 /Kids [5 0 R] >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '.$pageWidth.' '.$pageHeight.']'
                .' /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>'
                .' /Contents 6 0 R >>',
            '<< /Length '.strlen($stream).' >>'."\nstream\n".$stream."\nendstream",
        ];

        $pdf = '%PDF-1.4';
        $offsets = [];

        foreach ($objects as $index => $body) {
            $id = $index + 1;
            $pdf .= "\n";
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$body}\nendobj";
        }

        $xrefStart = strlen($pdf);
        $pdf .= "\nxref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";

        foreach ($offsets as $id => $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf."\ntrailer\n<< /Size ".(count($objects) + 1).' /Root 1 0 R >>'
            ."\nstartxref\n".$xrefStart."\n%%EOF\n";
    }

    /**
     * Exact advance width of a value in the embedded fonts, in points.
     */
    private function textWidth(string $value, float $size, bool $bold): float
    {
        $total = 0.0;

        foreach (mb_str_split($this->sanitize($value)) as $character) {
            $total += self::CHAR_WIDTHS[$character] ?? 556.0;
        }

        $width = ($total / 1000.0) * $size;

        return $bold ? $width * self::BOLD_FACTOR : $width;
    }

    /**
     * Shorten a value so it never exceeds the given width, with an ellipsis.
     */
    private function trimTo(string $value, float $width, float $size, bool $bold): string
    {
        $value = $this->sanitize($value);

        if ($this->textWidth($value, $size, $bold) <= $width) {
            return $value;
        }

        while ($value !== '' && $this->textWidth($value.'...', $size, $bold) > $width) {
            $value = mb_substr($value, 0, mb_strlen($value) - 1);
        }

        return $value.'...';
    }

    /**
     * @return list<string>
     */
    private function pdfWrap(string $value, float $width, float $size, bool $bold, int $maxLines): array
    {
        $lines = [];
        $current = '';

        foreach (preg_split('/\s+/u', trim($this->sanitize($value))) ?: [] as $word) {
            $candidate = $current === '' ? $word : $current.' '.$word;

            if ($current !== '' && $this->textWidth($candidate, $size, $bold) > $width) {
                $lines[] = $current;
                $current = $word;

                continue;
            }

            $current = $candidate;
        }

        if ($current !== '' || $lines === []) {
            $lines[] = $current;
        }

        if (count($lines) <= $maxLines) {
            return $lines;
        }

        $lines = array_slice($lines, 0, $maxLines);
        $lastIndex = count($lines) - 1;

        while ($lines[$lastIndex] !== '' && $this->textWidth($lines[$lastIndex].'...', $size, $bold) > $width) {
            $lines[$lastIndex] = mb_substr($lines[$lastIndex], 0, mb_strlen($lines[$lastIndex]) - 1);
        }

        return [...array_slice($lines, 0, $lastIndex), $lines[$lastIndex].'...'];
    }

    private function sanitize(string $value): string
    {
        $value = str_replace('৳', 'Tk ', $value);
        $converted = iconv('UTF-8', 'CP1252//TRANSLIT//IGNORE', $value);

        if ($converted !== false) {
            $value = $converted;
        }

        return preg_replace('/[^\x20-\x7E]/', '?', $value) ?? '';
    }

    private function barcode(string $value, float $x, float $y, float $maxWidth): string
    {
        $characters = '*'.mb_strtoupper(preg_replace('/[^0-9A-Z\-. $\/+%]/', '_', $value) ?? '').'*';
        $patterns = [];

        foreach (str_split($characters) as $character) {
            $pattern = OrderExportService::CODE39_PATTERNS[$character] ?? null;

            if ($pattern === null) {
                continue;
            }

            $patterns[] = array_map(
                fn (string $element): int => $element === 'w' ? 3 : 1,
                str_split($pattern),
            );
        }

        if ($patterns === []) {
            return '';
        }

        $totalUnits = (int) array_sum(array_map(fn (array $widths): int => array_sum($widths), $patterns))
            + count($patterns);
        $unit = $maxWidth / $totalUnits;
        $position = $x;
        $bars = '0 0 0 rg';
        $last = count($patterns) - 1;

        foreach ($patterns as $index => $widths) {
            foreach ($widths as $elementIndex => $width) {
                if ($elementIndex % 2 === 0) {
                    $bars .= sprintf(' %.2f %.2f %.2f %.2f re f', $position, $y, $width * $unit, self::BARCODE_HEIGHT);
                }

                $position += $width * $unit;
            }

            if ($index < $last) {
                $position += $unit;
            }
        }

        return $bars.' 0 g';
    }

    private function pdfTextRight(float $rightX, float $y, float $size, bool $bold, string $value): string
    {
        return $this->pdfText($rightX - $this->textWidth($value, $size, $bold), $y, $size, $bold, $value);
    }

    private function pdfText(float $x, float $y, float $size, bool $bold, string $value): string
    {
        // PDF string escaping happens exactly once, here at the emit point.
        $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $value);

        return sprintf(
            'BT %s %.2f Tf 1 0 0 1 %.2f %.2f Tm (%s) Tj ET',
            $bold ? '/F2' : '/F1',
            $size,
            $x,
            $y,
            $escaped,
        );
    }
}
