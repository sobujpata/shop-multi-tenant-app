<?php

declare(strict_types=1);

namespace App\Services;

use ZipArchive;

final class OrderExportService
{
    public const CODE39_PATTERNS = [
        '0' => 'nnnwwnwnn', '1' => 'wnnwnnnnw', '2' => 'nnwwnnnnw', '3' => 'wnwwnnnnn',
        '4' => 'nnnwwnnnw', '5' => 'wnnwwnnnn', '6' => 'nnwwwnnnn', '7' => 'nnnwnnwnw',
        '8' => 'wnnwnnwnn', '9' => 'nnwwnnwnn', 'A' => 'wnnnnwnnw', 'B' => 'nnwnnwnnw',
        'C' => 'wnwnnwnnn', 'D' => 'nnnnwwnnw', 'E' => 'wnnnwwnnn', 'F' => 'nnwnwwnnn',
        'G' => 'nnnnnwwnw', 'H' => 'wnnnnwwnn', 'I' => 'nnwnnwwnn', 'J' => 'nnnnwwwnn',
        'K' => 'wnnnnnnww', 'L' => 'nnwnnnnww', 'M' => 'wnwnnnnwn', 'N' => 'nnnnwnnww',
        'O' => 'wnnnwnnwn', 'P' => 'nnwnwnnwn', 'Q' => 'nnnnnnwwn', 'R' => 'wnnnnnwwn',
        'S' => 'nnwnnnwwn', 'T' => 'nnnnwnwwn', 'U' => 'wwnnnnnnw', 'V' => 'nwwnnnnnw',
        'W' => 'wwwnnnnnn', 'X' => 'nwnnwnnnw', 'Y' => 'wwnnwnnnn', 'Z' => 'nwwnwnnnn',
        '-' => 'nwnnnnwnw', '.' => 'wwnnnwnnn', ' ' => 'nwwnnnwnn', '$' => 'nwnwnwnnn',
        '/' => 'nwnwnnnwn', '+' => 'nwnnnwnwn', '%' => 'nnnwnwnwn', '*' => 'nwnnwnwnn',
    ];

    /**
     * Build a minimal .xlsx workbook (Excel 2007+) without external packages.
     *
     * @param  list<string>  $headings
     * @param  list<list<string>>  $rows
     */
    public function toXlsx(array $headings, array $rows): string
    {
        $columns = max(count($headings), 1);
        $widths = $this->columnWidths($headings, $rows, 10, 60, 4);
        $tempPath = (string) tempnam(sys_get_temp_dir(), 'xlsx-');
        $workbook = new ZipArchive;

        if ($workbook->open($tempPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            unlink($tempPath);

            throw new \RuntimeException('Unable to create the temporary workbook file.');
        }

        foreach ([
            '[Content_Types].xml' => implode('', [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                    .'<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                    .'<Default Extension="xml" ContentType="application/xml"/>'
                    .'<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
                    .'<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
                    .'<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
                .'</Types>',
            ]),
            '_rels/.rels' => implode('', [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                    .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>'
                .'</Relationships>',
            ]),
            'xl/workbook.xml' => implode('', [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
                    .'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
                    .'<sheets><sheet name="Orders" sheetId="1" r:id="rId1"/></sheets>'
                .'</workbook>',
            ]),
            'xl/_rels/workbook.xml.rels' => implode('', [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                    .'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>'
                    .'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>'
                .'</Relationships>',
            ]),
            'xl/styles.xml' => implode('', [
                '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
                '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                    .'<fonts count="2">'
                    .'<font><sz val="11"/><name val="Calibri"/></font>'
                    .'<font><b/><sz val="11"/><name val="Calibri"/></font>'
                    .'</fonts>'
                    .'<fills count="2">'
                    .'<fill><patternFill patternType="none"/></fill>'
                    .'<fill><patternFill patternType="gray125"/></fill>'
                    .'</fills>'
                    .'<borders count="1"><border/></borders>'
                    .'<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
                    .'<cellXfs count="2">'
                    .'<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
                    .'<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>'
                    .'</cellXfs>'
                    .'<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>'
                .'</styleSheet>',
            ]),
        ] as $name => $content) {
            $workbook->addFromString($name, $content);
        }

        $colsXml = '';

        foreach ($widths as $index => $width) {
            $colsXml .= '<col min="'.($index + 1).'" max="'.($index + 1)
                .'" width="'.$width.'" customWidth="1"/>';
        }

        $rowsXml = $this->xlsxRow($headings, 1, $columns, true);

        foreach ($rows as $index => $cells) {
            $rowsXml .= $this->xlsxRow($cells, $index + 2, $columns, false);
        }

        $workbook->addFromString('xl/worksheets/sheet1.xml', implode('', [
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
                .'<cols>'.$colsXml.'</cols>'
                .'<sheetData>'.$rowsXml.'</sheetData>'
            .'</worksheet>',
        ]));
        $workbook->close();

        $content = (string) file_get_contents($tempPath);
        unlink($tempPath);

        return $content;
    }

    /**
     * Build a printable invoice PDF (A5 portrait).
     *
     * Layout:
     * - Row 1: tenant logo (top left) | branch information (top right)
     * - Row 2: customer info (left)   | order date, invoice no, barcode (right)
     * - Products table with a dark header band and zebra rows
     * - Totals: subtotal, shipping charge (excluded from the total when paid)
     *
     * @param  array{
     *     order_no: string,
     *     date: string,
     *     logo_path: string|null,
     *     branch_name: string,
     *     branch_address: string,
     *     branch_city: string,
     *     tenant_email: string,
     *     branch_phone: string,
     *     customer_name: string,
     *     customer_email: string,
     *     customer_phone: string,
     *     customer_address: string,
     *     items: list<array{name: string, rate: string, quantity: int}>,
     *     subtotal: string,
     *     shipping_fee: string,
     *     shipping_paid: bool,
     *     total: string,
     *     payment_method: string,
     * }  $data
     */
    public function toInvoicePdf(array $data): string
    {
        $pageWidth = 421.0;
        $pageHeight = 595.0;
        $marginX = 28.0;
        $usableWidth = $pageWidth - $marginX * 2;
        $fontSize = 8.0;
        $charWidth = $fontSize * 0.55;
        $rowHeight = 14.0;
        $rowsBottomLimit = 150.0;
        $rightColumnX = $marginX + $usableWidth * 0.55;
        $rightColumnWidth = $usableWidth - $usableWidth * 0.55 - 4.0;
        $logo = $this->pdfImage($data['logo_path'], 150.0, 48.0);
        $xobject = $logo === null ? null : ['name' => 'Im1', ...$logo];

        $items = $data['items'];
        $pages = [];
        $contentLines = [];
        $rowIndex = 0;
        $rowCount = count($items);

        do {
            $isFirstPage = $pages === [];

            if ($isFirstPage) {
                $this->drawInvoiceHeader(
                    $contentLines,
                    $data,
                    $logo,
                    $marginX,
                    $usableWidth,
                    $pageWidth,
                    $rightColumnX,
                    $rightColumnWidth,
                    $charWidth,
                );

                $headerBandTop = 404.0;
            } else {
                $contentLines[] = $this->pdfText(
                    $marginX,
                    578.0,
                    9.0,
                    true,
                    $this->pdfSanitize('Invoice '.$data['order_no'].' - continued'),
                );

                $headerBandTop = 566.0;
            }

            $descriptionWidth = $usableWidth * 0.54;
            $rateX = $marginX + $descriptionWidth;
            $qtyX = $rateX + $usableWidth * 0.17;
            $totalX = $marginX + $usableWidth;
            $bandBottom = $headerBandTop - 16.0;

            $contentLines[] = sprintf(
                '0.13 0.13 0.15 rg %.2f %.2f %.2f 16.0 re f 1 1 1 rg',
                $marginX,
                $bandBottom,
                $usableWidth,
            );
            $contentLines[] = $this->pdfText($marginX + 3.0, $bandBottom + 5.0, 7.5, true, 'DESCRIPTION');
            $contentLines[] = $this->pdfTextRight($rateX, $bandBottom + 5.0, 7.5, true, 'RATE');
            $contentLines[] = $this->pdfTextRight($qtyX, $bandBottom + 5.0, 7.5, true, 'QTY');
            $contentLines[] = $this->pdfTextRight($totalX - 3.0, $bandBottom + 5.0, 7.5, true, 'TOTAL');
            $contentLines[] = '0 g';

            $y = $bandBottom - 15.0;

            while ($rowIndex < $rowCount && $y >= $rowsBottomLimit) {
                $item = $items[$rowIndex];
                $descriptionLines = $this->pdfWrap(
                    (string) $item['name'],
                    $descriptionWidth,
                    $charWidth,
                    2,
                );
                $isTall = count($descriptionLines) > 1;
                $rowSpan = $rowHeight * ($isTall ? 1.6 : 1.0);
                $bandBottom = $y - $rowSpan + 4.0;

                if ($rowIndex % 2 === 1) {
                    $contentLines[] = sprintf(
                        '0.955 0.965 0.965 rg %.2f %.2f %.2f %.2f re f 0 g',
                        $marginX,
                        $bandBottom,
                        $usableWidth,
                        $rowSpan,
                    );
                }

                foreach ($descriptionLines as $lineIndex => $descriptionLine) {
                    $contentLines[] = $this->pdfText(
                        $marginX + 3.0,
                        $y - $lineIndex * 10.0,
                        $fontSize,
                        false,
                        $descriptionLine,
                    );
                }

                $contentLines[] = $this->pdfTextRight($rateX, $y, $fontSize, false, (string) $item['rate']);
                $contentLines[] = $this->pdfTextRight($qtyX, $y, $fontSize, false, (string) $item['quantity']);
                $contentLines[] = $this->pdfTextRight($totalX - 3.0, $y, $fontSize, false, $this->pdfItemTotal($item));
                $contentLines[] = $this->pdfHairline($marginX, $bandBottom, $usableWidth, 0.86);

                $y -= $rowSpan;
                $rowIndex++;
            }

            if ($rowIndex < $rowCount) {
                $pages[] = implode("\n", [
                    ...$contentLines,
                    ...$this->invoiceFooter($marginX, $pageWidth),
                ]);
                $contentLines = [];

                continue;
            }

            if ($y < $rowsBottomLimit + 40.0) {
                $pages[] = implode("\n", [
                    ...$contentLines,
                    ...$this->invoiceFooter($marginX, $pageWidth),
                ]);
                $contentLines = [];
                $y = 548.0;
            }

            $this->drawInvoiceTotals($contentLines, $data, $marginX, $usableWidth, $y - 8.0);

            $pages[] = implode("\n", [
                ...$contentLines,
                ...$this->invoiceFooter($marginX, $pageWidth),
            ]);
            $contentLines = [];

            break;
        } while ($rowIndex < $rowCount);

        return $this->pdfDocument($pages, $pageWidth, $pageHeight, $xobject);
    }

    /**
     * Row 1: tenant logo (left) and branch information (right).
     * Row 2: customer info (left) and order date, invoice no, barcode (right).
     *
     * @param  list<string>  $contentLines
     * @param  array<string, mixed>  $data
     * @param  array{width: float, height: float, stream: string}|null  $logo
     */
    private function drawInvoiceHeader(
        array &$contentLines,
        array $data,
        ?array $logo,
        float $marginX,
        float $usableWidth,
        float $pageWidth,
        float $rightColumnX,
        float $rightColumnWidth,
        float $charWidth,
    ): void {
        $charWidth8 = $this->charWidthFor(8.0);

        if ($logo !== null) {
            $logoX = $marginX;
            $logoTopY = 566.0;
            $contentLines[] = sprintf(
                'q %.2f 0 0 %.2f %.2f %.2f cm /Im1 Do Q',
                $logo['width'],
                $logo['height'],
                $logoX,
                $logoTopY - $logo['height'],
            );
        }

        $branchY = 558.0;
        $contentLines[] = $this->pdfText($rightColumnX, $branchY, 10.0, true, $this->pdfTrim($data['branch_name'], $rightColumnWidth, $this->charWidthFor(10.0)));
        $branchY -= 13.0;

        foreach ($this->pdfWrap($data['branch_address'].', '.$data['branch_city'], $rightColumnWidth, $charWidth8, 2) as $line) {
            $contentLines[] = $this->pdfText($rightColumnX, $branchY, 8.0, false, $line);
            $branchY -= 10.0;
        }

        foreach ([
            'Phone: '.$data['branch_phone'],
            $this->pdfWrapLine($data['tenant_email'], $rightColumnWidth, $charWidth8),
        ] as $line) {
            $contentLines[] = $this->pdfText($rightColumnX, $branchY, 8.0, false, $line);
            $branchY -= 10.0;
        }

        $contentLines[] = $this->pdfText($marginX, 490.0, 7.5, true, 'BILL TO:');

        $customerY = 476.0;
        $contentLines[] = $this->pdfText($marginX, $customerY, 9.5, true, $this->pdfTrim($data['customer_name'], $usableWidth * 0.5, $this->charWidthFor(9.5)));
        $customerY -= 13.0;

        foreach ($this->pdfWrap($data['customer_address'], $usableWidth * 0.5, $charWidth8, 4) as $line) {
            $contentLines[] = $this->pdfText($marginX, $customerY, 8.0, false, $line);
            $customerY -= 10.0;
        }

        foreach ([
            $this->pdfWrapLine($data['customer_phone'], $usableWidth * 0.5, $charWidth8),
            $this->pdfWrapLine($data['customer_email'], $usableWidth * 0.5, $charWidth8),
        ] as $line) {
            $contentLines[] = $this->pdfText($marginX, $customerY, 8.0, false, $line);
            $customerY -= 10.0;
        }

        $contentLines[] = $this->pdfText($rightColumnX, 490.0, 8.0, false, 'Order Date: '.$data['date']);
        $contentLines[] = $this->pdfText($rightColumnX, 476.0, 8.5, true, 'Order #: '.$data['order_no']);
        $contentLines[] = $this->pdfBarcode(
            $data['order_no'],
            $rightColumnX,
            428.0,
            $pageWidth - $rightColumnX - 8.0,
        );
    }

    /**
     * Totals block: subtotal, shipping charge (excluded from the total when
     * paid), and grand total, plus the date and payment method lines.
     *
     * @param  list<string>  $contentLines
     * @param  array<string, mixed>  $data
     */
    private function drawInvoiceTotals(
        array &$contentLines,
        array $data,
        float $marginX,
        float $usableWidth,
        float $topY,
    ): void {
        $labelX = $marginX + $usableWidth * 0.45;
        $valueX = $marginX + $usableWidth - 3.0;
        $totalsStart = max($topY, 118.0);

        $contentLines[] = $this->pdfHairline($labelX, $totalsStart + 7.0, $valueX - $labelX, 0.55);
        $contentLines[] = $this->pdfText($labelX, $totalsStart, 8.0, false, 'Subtotal');
        $contentLines[] = $this->pdfTextRight($valueX, $totalsStart, 8.0, false, $data['subtotal']);

        $shippingY = $totalsStart - 15.0;
        $shippingLabel = 'Shipping charge'.($data['shipping_paid'] ? ' (Paid)' : '');

        $contentLines[] = $this->pdfText($labelX, $shippingY, 8.0, false, $shippingLabel);
        $contentLines[] = $this->pdfTextRight($valueX, $shippingY, 8.0, false, $data['shipping_fee']);

        $totalY = $shippingY - 20.0;
        $contentLines[] = sprintf(
            '0.25 G 0.9 w %.2f %.2f m %.2f %.2f l S 0 G',
            $labelX,
            $totalY + 6.0,
            $valueX,
            $totalY + 6.0,
        );
        $contentLines[] = $this->pdfText($labelX, $totalY, 9.5, true, 'Total');
        $contentLines[] = $this->pdfTextRight($valueX, $totalY, 9.5, true, $data['total']);

        $contactY = $totalY - 24.0;
        $contentLines[] = $this->pdfText($marginX, $contactY, 8.0, false, $this->pdfSanitize('Date: '.$data['date']));
        $contentLines[] = $this->pdfText($marginX, $contactY - 11.0, 8.0, false, $this->pdfSanitize('Payment: '.$data['payment_method']));
    }

    /**
     * @return list<string>
     */
    private function invoiceFooter(float $marginX, float $pageWidth): array
    {
        $centerX = $pageWidth / 2 - (mb_strlen('Thank you for your order.') * 3.0);

        return [
            sprintf('0.8 G 0.4 w %.2f 44.0 m %.2f 44.0 l S 0 G', $marginX, $pageWidth - $marginX),
            $this->pdfText($centerX, 32.0, 7.5, false, 'Thank you for your order.'),
        ];
    }

    /**
     * Decode a logo image into an RGB XObject stream for the PDF.
     *
     * @return array{width: float, height: float, stream: string}|null
     */
    private function pdfImage(?string $path, float $maxWidth, float $maxHeight): ?array
    {
        if ($path === null || $path === '' || ! is_file($path)) {
            return null;
        }

        $source = null;

        foreach (['imagecreatefrompng', 'imagecreatefromjpeg', 'imagecreatefromwebp'] as $loader) {
            if (! function_exists($loader)) {
                continue;
            }

            $candidate = @$loader($path);

            if ($candidate !== false) {
                $source = $candidate;

                break;
            }
        }

        if ($source === null) {
            return null;
        }

        $sourceWidth = imagesx($source);
        $sourceHeight = imagesy($source);

        $scale = min($maxWidth / $sourceWidth, $maxHeight / $sourceHeight);
        $targetWidth = max((int) round($sourceWidth * $scale), 1);
        $targetHeight = max((int) round($sourceHeight * $scale), 1);
        $canvas = imagecreatetruecolor($targetWidth, $targetHeight);

        if ($canvas === false) {
            imagedestroy($source);

            return null;
        }

        $white = (int) imagecolorallocate($canvas, 255, 255, 255);
        imagefill($canvas, 0, 0, $white);
        imagecopyresampled($canvas, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $sourceWidth, $sourceHeight);
        imagedestroy($source);

        $raw = '';

        for ($y = 0; $y < $targetHeight; $y++) {
            for ($x = 0; $x < $targetWidth; $x++) {
                $rgb = imagecolorat($canvas, $x, $y);
                $raw .= chr(($rgb >> 16) & 0xFF).chr(($rgb >> 8) & 0xFF).chr($rgb & 0xFF);
            }
        }

        imagedestroy($canvas);

        return [
            'width' => (float) $targetWidth,
            'height' => (float) $targetHeight,
            'stream' => (string) gzcompress($raw),
        ];
    }

    /**
     * Build a minimal PDF (landscape A4, Helvetica) without external packages.
     *
     * Long text is truncated to fit its column; rows flow across pages when needed.
     *
     * @param  list<string>  $headings
     * @param  list<list<string>>  $rows
     */
    public function toPdf(string $title, string $subtitle, array $headings, array $rows): string
    {
        $pageWidth = 842.0;
        $pageHeight = 595.0;
        $marginX = 24.0;
        $usableWidth = $pageWidth - $marginX * 2;
        $fontSize = 8.0;
        $charWidth = $fontSize * 0.55;
        $rowHeight = 16.0;
        $bottomLimit = 50.0;
        $columns = max(count($headings), 1);

        $lengths = array_fill(0, $columns, 0);

        foreach ([$headings, ...$rows] as $cells) {
            foreach (array_pad($cells, $columns, '') as $index => $value) {
                $lengths[$index] = max($lengths[$index], mb_strlen((string) $value));
            }
        }

        $widths = array_map(
            fn (int $length): float => min(max($length * $charWidth + 10.0, 34.0), 170.0),
            $lengths,
        );
        $totalWidth = (float) array_sum($widths);

        if ($totalWidth > $usableWidth) {
            $scale = $usableWidth / $totalWidth;
            $widths = array_map(fn (float $width): float => round($width * $scale, 2), $widths);
        }

        $starts = [];
        $start = $marginX;

        foreach ($widths as $width) {
            $starts[] = $start;
            $start += $width;
        }

        $lastCellX = $starts[$columns - 1] + $widths[$columns - 1];
        $pages = [];
        $contentLines = [];
        $rowCount = count($rows);
        $rowIndex = 0;

        do {
            $isFirstPage = $pages === [];
            $headerY = $isFirstPage ? 540.0 : 578.0;
            $y = $headerY - 14.0;

            if ($isFirstPage) {
                $contentLines[] = $this->pdfText($starts[0], 572.0, 14.0, true, $this->pdfSanitize($title));

                if ($subtitle !== '') {
                    $contentLines[] = $this->pdfText(
                        $starts[0],
                        556.0,
                        9.0,
                        false,
                        $this->pdfSanitize($subtitle),
                    );
                }
            }

            foreach ($headings as $index => $heading) {
                $contentLines[] = $this->pdfText(
                    $starts[$index] + 3.0,
                    $headerY,
                    $fontSize,
                    true,
                    $this->pdfTrim((string) $heading, $widths[$index], $charWidth),
                );
            }

            $contentLines[] = sprintf(
                '0.62 G 0.6 w %.2f %.2f m %.2f %.2f l S 0 G',
                $marginX,
                $headerY - 3.0,
                $lastCellX,
                $headerY - 3.0,
            );

            if ($rowCount === 0) {
                $contentLines[] = $this->pdfText($starts[0], $y, $fontSize, false, 'No orders found.');
                $y -= $rowHeight * 2;
            }

            while ($rowIndex < $rowCount && $y >= $bottomLimit) {
                $cells = array_pad($rows[$rowIndex], $columns, '');

                if ($rowIndex % 2 === 1) {
                    $contentLines[] = sprintf(
                        '0.95 0.97 0.96 rg %.2f %.2f %.2f %.2f re f 0 g',
                        $marginX,
                        $y - 3.0,
                        $usableWidth,
                        12.0,
                    );
                }

                foreach ($cells as $index => $value) {
                    $contentLines[] = $this->pdfText(
                        $starts[$index] + 3.0,
                        $y,
                        $fontSize,
                        false,
                        $this->pdfTrim((string) $value, $widths[$index], $charWidth),
                    );
                }

                $y -= $rowHeight;
                $rowIndex++;
            }

            $pages[] = $contentLines;
            $contentLines = [];
        } while ($rowIndex < $rowCount);

        $pageCount = count($pages);

        foreach ($pages as $index => $lines) {
            $lines[] = sprintf(
                'BT /F2 8 Tf 1 0 0 1 %.2f %.2f Tm (Page %d of %d) Tj ET',
                $pageWidth - $marginX - 60.0,
                30.0,
                $index + 1,
                $pageCount,
            );
            $pages[$index] = implode("\n", $lines);
        }

        return $this->pdfDocument($pages, $pageWidth, $pageHeight);
    }

    /**
     * @param  list<string>  $headings
     * @param  list<list<string>>  $rows
     * @return list<float>
     */
    private function columnWidths(array $headings, array $rows, int $min, int $max, int $padding): array
    {
        $widths = [];

        foreach ($headings as $index => $heading) {
            $length = mb_strlen($heading);

            foreach ($rows as $row) {
                $length = max($length, mb_strlen(strval($row[$index] ?? '')));
            }

            $widths[] = floatval(max($min, min($max, $length + $padding)));
        }

        return $widths;
    }

    private function columnLetter(int $index): string
    {
        $letters = '';

        while ($index > 0) {
            $remainder = ($index - 1) % 26;
            $letters = chr(65 + $remainder).$letters;
            $index = intdiv($index - 1, 26);
        }

        return $letters;
    }

    /**
     * @param  list<string>  $cells
     */
    private function xlsxRow(array $cells, int $rowNumber, int $columns, bool $bold): string
    {
        $cells = array_pad($cells, $columns, '');
        $xml = '<row r="'.$rowNumber.'">';

        foreach ($cells as $index => $value) {
            $reference = $this->columnLetter($index + 1).$rowNumber;

            if ($value !== '' && is_numeric($value) && str_contains($value, 'e') === false) {
                $xml .= '<c r="'.$reference.'" t="n"><v>'.$value.'</v></c>';

                continue;
            }

            $style = $bold ? ' s="1"' : '';
            $xml .= '<c r="'.$reference.'" t="inlineStr"'.$style.'><is><t xml:space="preserve">'
                .$this->xmlEscape($value)
                .'</t></is></c>';
        }

        return $xml.'</row>';
    }

    private function xmlEscape(string $value): string
    {
        return htmlspecialchars($value, ENT_XML1 | ENT_COMPAT, 'UTF-8');
    }

    private function pdfTrim(string $value, float $width, float $charWidth): string
    {
        $value = $this->pdfSanitize($value);
        $available = max((int) floor(($width - 6.0) / $charWidth), 1);

        if (mb_strlen($value) <= $available) {
            return $value;
        }

        return trim(mb_strimwidth($value, 0, max($available - 1, 1))).'...';
    }

    private function charWidthFor(float $fontSize): float
    {
        return $fontSize * 0.55;
    }

    /**
     * Word-wrap a value to the column width, at most `$maxLines` lines.
     *
     * @return list<string>
     */
    private function pdfWrap(string $value, float $width, float $charWidth, int $maxLines = 2): array
    {
        $value = $this->pdfSanitize($value);
        $available = max((int) floor(($width - 6.0) / $charWidth), 1);
        $words = explode(' ', $value);
        $lines = [];
        $current = '';
        $truncated = false;

        foreach ($words as $word) {
            $candidate = $current === '' ? $word : $current.' '.$word;

            if (mb_strlen($candidate) <= $available) {
                $current = $candidate;

                continue;
            }

            if ($current !== '') {
                $lines[] = $current;
                $current = '';
            }

            if (count($lines) >= $maxLines) {
                $truncated = true;

                break;
            }

            if (mb_strlen($word) > $available) {
                $lines[] = $this->pdfTrim($word, $width, $charWidth);
                $current = '';

                if (count($lines) >= $maxLines) {
                    $truncated = true;

                    break;
                }

                continue;
            }

            $current = $word;
        }

        if ($current !== '') {
            if (count($lines) >= $maxLines) {
                $truncated = true;
            } else {
                $lines[] = $current;
            }
        }

        if ($truncated && count($lines) === $maxLines) {
            $lastLine = $lines[$maxLines - 1];

            if (! str_ends_with($lastLine, '...')) {
                $lines[$maxLines - 1] = rtrim(mb_strimwidth($lastLine, 0, $available - 3)).'...';
            }
        }

        if ($lines === []) {
            $lines = [''];
        }

        return array_values($lines);
    }

    /**
     * Single-line version of pdfWrap: fits to one line, truncating with an
     * ellipsis when too long.
     */
    private function pdfWrapLine(string $value, float $width, float $charWidth): string
    {
        $lines = $this->pdfWrap($value, $width, $charWidth, 1);

        return $lines[0];
    }

    /**
     * Row total for an invoice item: rate * quantity, two decimals.
     *
     * @param  array{name: string, rate: string, quantity: int}  $item
     */
    private function pdfItemTotal(array $item): string
    {
        $rate = (float) str_replace(['৳', 'Tk', ','], '', $item['rate']);
        $quantity = $item['quantity'];

        return number_format($rate * $quantity, 2, '.', '');
    }

    private function pdfTextRight(float $rightX, float $y, float $size, bool $bold, string $value): string
    {
        $width = mb_strlen($value) * $this->charWidthFor($size);

        return $this->pdfText($rightX - $width, $y, $size, $bold, $value);
    }

    private function pdfHairline(float $x, float $y, float $width, string|float $gray): string
    {
        return sprintf(
            '%s G 0.4 w %.2f %.2f m %.2f %.2f l S 0 G',
            $gray,
            $x,
            $y,
            $x + $width,
            $y,
        );
    }

    /**
     * Draw a Code 39 barcode scaled to fit the given width.
     */
    private function pdfBarcode(string $value, float $x, float $y, float $maxWidth): string
    {
        $characters = '*'.mb_strtoupper(preg_replace('/[^0-9A-Z\-. $\/+%]/', '_', $value) ?? '').'*';
        $patterns = [];

        foreach (str_split($characters) as $character) {
            $pattern = self::CODE39_PATTERNS[$character] ?? null;

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
                    $bars .= sprintf(' %.2f %.2f %.2f 26.0 re f', $position, $y, $width * $unit);
                }

                $position += $width * $unit;
            }

            if ($index < $last) {
                $position += $unit;
            }
        }

        return $bars.' 0 g';
    }

    private function pdfSanitize(string $value): string
    {
        $value = str_replace('৳', 'Tk ', $value);
        $converted = iconv('UTF-8', 'CP1252//TRANSLIT//IGNORE', $value);

        if ($converted !== false) {
            $value = $converted;
        }

        $ascii = preg_replace('/[^\x20-\x7E]/', '?', $value) ?? '';

        return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $ascii);
    }

    private function pdfText(float $x, float $y, float $size, bool $bold, string $value): string
    {
        return sprintf(
            'BT %s %.2f Tf 1 0 0 1 %.2f %.2f Tm (%s) Tj ET',
            $bold ? '/F2' : '/F1',
            $size,
            $x,
            $y,
            $value,
        );
    }

    /**
     * Assemble the PDF objects, xref table, and trailer.
     *
     * @param  list<string>  $pageStreams
     * @param  array{name: string, width: float, height: float, stream: string}|null  $xobject
     */
    private function pdfDocument(array $pageStreams, float $pageWidth, float $pageHeight, ?array $xobject = null): string
    {
        $objects = [];
        $objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
        $objects[2] = '<< /Type /Pages /Count '.count($pageStreams);
        $objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
        $objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
        $resources = ' /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >>';

        if ($xobject !== null) {
            $imageStream = strval($xobject['stream']);
            $objects[5] = '<< /Type /XObject /Subtype /Image'
                .' /Width '.(int) $xobject['width']
                .' /Height '.(int) $xobject['height']
                .' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /FlateDecode'
                .' /Length '.strlen($imageStream)
                .' >>'
                ."\nstream\n".$imageStream."\nendstream";
            $resources = ' /Resources << /Font << /F1 3 0 R /F2 4 0 R >>'
                .' /XObject << /'.$xobject['name'].' 5 0 R >> >>';
        }

        $kids = [];
        $nextId = $xobject === null ? 5 : 6;

        foreach ($pageStreams as $stream) {
            $pageId = $nextId;
            $kids[] = $pageId.' 0 R';
            $objects[$pageId] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '
                .$pageWidth.' '.$pageHeight.']'
                .$resources
                .' /Contents '.($pageId + 1).' 0 R >>';
            $objects[$pageId + 1] = '<< /Length '.strlen($stream).' >>'
                ."\nstream\n".$stream."\nendstream";
            $nextId += 2;
        }

        $objects[2] .= ' /Kids ['.implode(' ', $kids).'] >>';

        $pdf = '%PDF-1.4';
        $offsets = [];

        foreach ($objects as $id => $body) {
            $pdf .= "\n";
            $offsets[$id] = strlen($pdf);
            $pdf .= "{$id} 0 obj\n{$body}\nendobj";
        }

        $xrefStart = strlen($pdf);
        $pdf .= "\nxref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";

        foreach ($objects as $id => $body) {
            $pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
        }

        $pdf .= "trailer\n<< /Size ".(count($objects) + 1).' /Root 1 0 R >>'
            ."\nstartxref\n".$xrefStart."\n%%EOF\n";

        return $pdf;
    }
}
