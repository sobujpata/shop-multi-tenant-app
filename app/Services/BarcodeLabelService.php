<?php

declare(strict_types=1);

namespace App\Services;

/**
 * Renders printable product barcode label sheets for a branch.
 *
 * Each label shows the variant's scanner code as a CODE 39 barcode plus
 * configurable text lines. The sheet layout is dynamic: the paper format,
 * the label size and the content lines are caller-provided, and labels
 * automatically flow across as many pages as needed.
 */
final class BarcodeLabelService
{
    /**
     * Paper formats in points [width, height].
     *
     * @var array<string, array{0: float, 1: float}>
     */
    private const PAPERS = [
        'a4' => [595.28, 841.89],
        'a5' => [419.53, 595.28],
        'letter' => [612.0, 792.0],
    ];

    /**
     * Label size presets in points [width, height, barcodeHeight] (1 mm = 2.8346 pt).
     *
     * @var array<string, array{0: float, 1: float, 2: float}>
     */
    private const LABEL_SIZES = [
        '50x25' => [141.73, 70.87, 20.0],
        '40x30' => [113.39, 85.04, 25.0],
        '38x21' => [107.72, 59.53, 15.0],
        '38x19' => [107.72, 53.86, 13.0],
        '57x50' => [161.57, 141.73, 25.0],
        '57x40' => [161.57, 113.39, 25.0],
        '56x38' => [158.74, 107.72, 25.0],
        '56x30' => [158.74, 85.04, 20.0],
    ];

    /** 1 millimetre in PDF points (72 / 25.4). */
    private const MM_TO_PT = 2.83464567;

    /** Sheet grid spacing in points: page margin and inter-label gutter. */
    private const GRID_MARGIN = 14.0;

    private const GRID_GUTTER = 10.0;

    /** Valid label size keys including the custom override. */
    public const SIZE_OPTIONS = ['50x25', '40x30', '38x21', '38x19', '57x50', '57x40', '56x38', '56x30', 'custom'];

    public const CONTENT_OPTIONS = ['branch', 'name', 'barcode', 'serial', 'code', 'sku', 'price'];

    /**
     * Right slot shows the serial number unless SKU is explicitly requested.
     */
    public const DEFAULT_CONTENT = ['branch', 'name', 'barcode', 'serial', 'code', 'price'];

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
     * Resolve a sheet paper code to its point dimensions.
     *
     * @return array{0: float, 1: float}
     */
    private static function paperPoints(string $paper): array
    {
        return self::PAPERS[$paper] ?? self::PAPERS['a4'];
    }

    /**
     * Resolve a label size code (or a custom millimetre override when
     * $size is "custom") to [width, height, barcodeHeight] in points.
     *
     * @return array{0: float, 1: float, 2: float}
     */
    private static function sizePoints(string $size, float $customWidth = 0.0, float $customHeight = 0.0): array
    {
        $custom = $size === 'custom' && $customWidth > 0.0 && $customHeight > 0.0;
        [$width, $height, $barcodeHeight] = $custom
            ? [round(min(250.0, max(10.0, $customWidth)) * self::MM_TO_PT, 2), round(min(180.0, max(10.0, $customHeight)) * self::MM_TO_PT, 2), 0.0]
            : (self::LABEL_SIZES[$size] ?? self::LABEL_SIZES['50x25']);

        if ($custom) {
            $barcodeHeight = match (true) {
                $height >= 120.0 => 25.0,
                $height >= 80.0 => 20.0,
                $height >= 55.0 => 15.0,
                default => 12.0,
            };
        }

        return [$width, $height, $barcodeHeight];
    }

    /**
     * How many labels of the given size fill one full page of the given
     * sheet paper (or a single label per page for thermal paper).
     */
    public static function labelsPerPage(
        string $paper = 'a4',
        string $size = '50x25',
        float $customWidth = 0.0,
        float $customHeight = 0.0,
    ): int {
        if ($paper === 'thermal') {
            return 1;
        }

        [$pageWidth, $pageHeight] = self::paperPoints($paper);
        [$labelWidth, $labelHeight] = self::sizePoints($size, $customWidth, $customHeight);

        $columns = max(1, (int) floor(($pageWidth - self::GRID_MARGIN * 2 + self::GRID_GUTTER) / ($labelWidth + self::GRID_GUTTER)));
        $rows = max(1, (int) floor(($pageHeight - self::GRID_MARGIN * 2 + self::GRID_GUTTER) / ($labelHeight + self::GRID_GUTTER)));

        return $columns * $rows;
    }

    /**
     * @param  array<int, array<string, string>>  $labels  each: branch, name, size, sku, barcode, price, regular_price
     * @param  string  $paper  a4|a5|letter|thermal (thermal: page = exact label size, one label per page, no border)
     * @param  string  $size  50x25|40x30|38x21|38x19|57x50|57x40|56x38|56x30|custom
     * @param  array<int, string>  $show  subset of self::CONTENT_OPTIONS
     * @param  float  $customWidth  label width in millimetres when $size is custom
     * @param  float  $customHeight  label height in millimetres when $size is custom
     */
    public function toLabelPdf(
        array $labels,
        string $paper = 'a4',
        string $size = '50x25',
        array $show = self::DEFAULT_CONTENT,
        float $customWidth = 0.0,
        float $customHeight = 0.0,
    ): string {
        [$pageWidth, $pageHeight] = self::paperPoints($paper);
        [$labelWidth, $labelHeight, $barcodeHeight] = self::sizePoints($size, $customWidth, $customHeight);

        $show = array_values(array_intersect(self::CONTENT_OPTIONS, $show));
        $small = $labelHeight < 62.0;

        // Thermal label printers print on stickers whose paper IS the label:
        // one label per page at exactly the label dimensions, no grid/border.
        $thermal = $paper === 'thermal';

        if ($thermal) {
            $pageWidth = $labelWidth;
            $pageHeight = $labelHeight;
            $pages = $labels === [] ? [[]] : array_map(
                static fn ($label): array => [$label],
                array_values($labels),
            );
        } else {
            $columns = max(1, (int) floor(($pageWidth - self::GRID_MARGIN * 2 + self::GRID_GUTTER) / ($labelWidth + self::GRID_GUTTER)));
            $rows = max(1, (int) floor(($pageHeight - self::GRID_MARGIN * 2 + self::GRID_GUTTER) / ($labelHeight + self::GRID_GUTTER)));
            $perPageLabels = $columns * $rows;

            $pages = $labels === [] ? [[]] : array_chunk($labels, $perPageLabels);
        }

        $pageStreams = [];

        foreach ($pages as $pageLabels) {
            $ops = [];

            foreach ($pageLabels as $index => $label) {
                $ops = [...$ops, ...$this->labelOps(
                    $label,
                    (int) $index,
                    $small,
                    $show,
                    $labelWidth,
                    $labelHeight,
                    $barcodeHeight,
                    $thermal ? 1 : $columns,
                    $thermal ? 1 : $rows,
                    $thermal ? 0.0 : self::GRID_MARGIN,
                    $thermal ? 0.0 : self::GRID_GUTTER,
                    $pageHeight,
                    $pageWidth,
                    $thermal,
                )];
            }

            if ($ops === []) {
                $ops[] = $this->pdfText(
                    $pageWidth / 2 - $this->textWidth('No product variants', 9.0, false) / 2,
                    $pageHeight / 2,
                    9.0,
                    false,
                    'No product variants',
                );
            }

            $pageStreams[] = implode("\n", $ops);
        }

        return $this->pdfDocument($pageStreams, $pageWidth, $pageHeight);
    }

    /**
     * Render the operators for one label inside its grid slot.
     *
     * @param  array<string, string>  $label
     * @param  array<int, string>  $show
     * @return list<string>
     */
    private function labelOps(
        array $label,
        int $index,
        bool $small,
        array $show,
        float $labelWidth,
        float $labelHeight,
        float $barcodeHeight,
        int $columns,
        int $rows,
        float $margin,
        float $gutter,
        float $pageHeight,
        float $pageWidth,
        bool $thermal = false,
    ): array {
        $gridX = $index % $columns;
        $gridY = intdiv($index, $columns);
        $labelLeft = $margin + $gridX * ($labelWidth + $gutter);
        $labelTop = $pageHeight - $margin - $gridY * ($labelHeight + $gutter);
        $labelBottom = $labelTop - $labelHeight;

        $ops = [];

        if (! $thermal) {
            $ops[] = sprintf(
                '0.55 G 0.4 w %.2f %.2f %.2f %.2f re S 0 G',
                $labelLeft,
                $labelBottom,
                $labelWidth,
                $labelHeight,
            );
        }

        $pad = $thermal ? 3.5 : 5.0;
        $centerX = $labelLeft + $labelWidth / 2;
        $innerWidth = $labelWidth - $pad * 2.0;

        $branchOn = in_array('branch', $show, true);
        $nameOn = in_array('name', $show, true);
        $barcodeOn = in_array('barcode', $show, true);
        $priceOn = in_array('price', $show, true);
        $rowOn = in_array('code', $show, true)
            || in_array('sku', $show, true)
            || in_array('serial', $show, true);

        // Name lines are wrapped once and reused for the height estimate.
        $nameLines = [];

        if ($nameOn) {
            $fullName = strval($label['name']);

            if (strval($label['size']) !== '') {
                $fullName .= ' - '.strval($label['size']);
            }

            $nameLines = $this->pdfWrap($fullName, $innerWidth, 8.0, true, $small ? 1 : 2);
        }

        // The whole content block flows downwards and is then vertically
        // centred: the barcode sits a small fixed distance below the last
        // text baseline (no wide stretch), the outer white stays balanced,
        // and nothing — not even the branch name — escapes the label edge.
        $baselines = ($branchOn ? 1 : 0) + count($nameLines);
        $lastDepth = ($baselines > 0 ? $baselines - 1 : 0) * 9.0;
        $barDepth = $barcodeOn ? $lastDepth + 4.0 + $barcodeHeight : 0.0;
        $rowDepth = $rowOn
            ? ($barcodeOn ? $barDepth + 8.0 : $lastDepth + 12.0)
            : 0.0;
        $priceDepth = $priceOn
            ? ($rowOn ? $rowDepth + 6.5 : ($barcodeOn ? $barDepth + 14.5 : $lastDepth + 18.5))
            : 0.0;
        $stackH = max($lastDepth, $barDepth, $rowDepth, $priceDepth) + 2.5;
        $topPad = max(6.5, ($labelHeight - $stackH) / 2.0);

        $cursor = $labelTop - $topPad;
        $lastBaselineY = $cursor;
        $barcodeBottom = 0.0;

        if ($branchOn) {
            $branch = $this->trimTo(strval($label['branch']), $innerWidth, 7.5, true);
            $lastBaselineY = $cursor;
            $ops[] = $this->pdfText(
                $centerX - $this->textWidth($branch, 7.5, true) / 2,
                $cursor,
                7.5,
                true,
                $branch,
            );
            $cursor -= 9.0;
        }

        foreach ($nameLines as $line) {
            $lastBaselineY = $cursor;
            $ops[] = $this->pdfText(
                $centerX - $this->textWidth($line, 8.0, true) / 2,
                $cursor,
                8.0,
                true,
                $line,
            );
            $cursor -= 9.0;
        }

        // --- CODE 39 barcode, a small gap under the last text baseline ---
        $code = strtoupper(preg_replace('/[^0-9A-Z]/', '', strval($label['barcode'])) ?? '');
        $barcodeWidth = $innerWidth * 0.86;
        $barcodeX = $labelLeft + ($labelWidth - $barcodeWidth) / 2;

        if ($barcodeOn) {
            $barcodeBottom = $lastBaselineY - 4.0 - $barcodeHeight;
            $ops[] = $this->barcode($code, $barcodeX, $barcodeBottom, $barcodeWidth, $barcodeHeight);
        }

        // --- Code/serial/SKU row below the barcode ---
        if ($rowOn) {
            $rowY = max(
                $barcodeOn ? $barcodeBottom - 8.0 : $lastBaselineY - 12.0,
                $labelBottom + 4.0,
            );

            if (in_array('code', $show, true)) {
                $ops[] = $this->pdfText(
                    $labelLeft + $pad,
                    $rowY,
                    6.5,
                    true,
                    strtoupper(strval($label['barcode'])),
                );
            }

            $rightValue = match (true) {
                in_array('sku', $show, true) => strval($label['sku']),
                in_array('serial', $show, true) => sprintf('SL-%02d', $index + 1),
                default => '',
            };

            if ($rightValue !== '') {
                $ops[] = $this->pdfTextRight($labelLeft + $labelWidth - $pad, $rowY, 6.5, true, $rightValue);
            }
        }

        // --- Price, centred at the bottom of the block, with discount ---
        if ($priceOn) {
            $priceBaseline = max(
                $rowOn
                    ? $rowY - 6.5
                    : ($barcodeOn ? $barcodeBottom - 14.5 : $lastBaselineY - 18.5),
                $labelBottom + 2.5,
            );
            $price = 'Tk '.strval($label['price']);
            $regular = strval($label['regular_price']);
            $parsePrice = static fn (string $value): float => (float) str_replace(',', '', $value);
            $discounted = $regular !== '' && $parsePrice($regular) > $parsePrice($label['price']);

            if ($discounted) {
                $regularText = 'Tk '.$regular;
                $regularWidth = $this->textWidth($regularText, 7.5, false);
                $priceWidth = $this->textWidth($price, 8.5, true);
                $gap = 6.0;
                $x = $centerX - ($regularWidth + $gap + $priceWidth) / 2;

                $ops[] = $this->pdfText($x, $priceBaseline, 7.5, false, $regularText);
                $ops[] = $this->strikeLine($x, $priceBaseline - 2.2, $regularWidth);
                $ops[] = $this->pdfText($x + $regularWidth + $gap, $priceBaseline, 8.5, true, $price);
            } else {
                $ops[] = $this->pdfText(
                    $centerX - $this->textWidth($price, 8.5, true) / 2,
                    $priceBaseline,
                    8.5,
                    true,
                    $price,
                );
            }
        }

        return $ops;
    }

    /**
     * Strike-through rule used to mark the regular price as superseded.
     */
    private function strikeLine(float $x, float $y, float $width): string
    {
        return sprintf('0.35 G 0.5 w %.2f %.2f m %.2f %.2f l S 0 G', $x, $y, $x + $width, $y);
    }

    /**
     * Assemble the PDF document: one font pair, then two objects per page
     * (page descriptor + content stream) with a shared MediaBox format.
     *
     * @param  list<string>  $pageStreams
     */
    private function pdfDocument(array $pageStreams, float $pageWidth, float $pageHeight): string
    {
        $pageCount = max(1, count($pageStreams));

        $kids = [];
        $objectBodies = [];
        $nextId = 5; // 1 catalog, 2 pages, 3-4 fonts

        foreach ($pageStreams as $stream) {
            $kids[] = $nextId.' 0 R';
            $objectBodies[] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '.$pageWidth.' '.$pageHeight.']'
                .' /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>'
                .' /Contents '.($nextId + 1).' 0 R >>';

            $objectBodies[] = '<< /Length '.strlen($stream).' >>'."\nstream\n".$stream."\nendstream";

            $nextId += 2;
        }

        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Count '.$pageCount.' /Kids ['.implode(' ', $kids).'] >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
            ...$objectBodies,
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

        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf."\ntrailer\n<< /Size ".(count($objects) + 1).' /Root 1 0 R >>'
            ."\nstartxref\n".$xrefStart."\n%%EOF\n";
    }

    /**
     * Advance width of a value in the embedded fonts, in points.
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

    private function pdfTextRight(float $rightX, float $y, float $size, bool $bold, string $value): string
    {
        return $this->pdfText($rightX - $this->textWidth($value, $size, $bold), $y, $size, $bold, $value);
    }

    /**
     * CODE 39 barcode bars (pattern data shared with the order exports).
     */
    private function barcode(string $value, float $x, float $y, float $maxWidth, float $height): string
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
                    $bars .= sprintf(' %.2f %.2f %.2f %.2f re f', $position, $y, $width * $unit, $height);
                }

                $position += $width * $unit;
            }

            if ($index < $last) {
                $position += $unit;
            }
        }

        return $bars.' 0 g';
    }
}
