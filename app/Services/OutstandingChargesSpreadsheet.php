<?php

namespace App\Services;

use PhpOffice\PhpSpreadsheet\Cell\DataType;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use RuntimeException;

class OutstandingChargesSpreadsheet
{
    public function build(array $charges): string
    {
        $workbook = new Spreadsheet;
        $sheet = $workbook->getActiveSheet();
        $sheet->setTitle('Cobros pendientes');
        $sheet->fromArray(['Deportista', 'Disciplina', 'Período', 'Vencimiento', 'Valor (COP)', 'Estado'], null, 'A1');
        $header = $sheet->getStyle('A1:F1');
        $header->getFont()->setBold(true)->getColor()->setRGB('FFFFFF');
        $header->getFill()->setFillType(Fill::FILL_SOLID)->getStartColor()->setRGB('151E2E');
        $sheet->getRowDimension(1)->setRowHeight(21);
        $sheet->setShowGridLines(false);
        $sheet->freezePane('A2');

        foreach (['A' => 32, 'B' => 24, 'C' => 14, 'D' => 14, 'E' => 16, 'F' => 14] as $column => $width) {
            $sheet->getColumnDimension($column)->setWidth($width);
        }

        foreach ($charges as $index => $charge) {
            $row = $index + 2;
            $sheet->setCellValueExplicit("A{$row}", $charge['athlete'], DataType::TYPE_STRING);
            $sheet->setCellValueExplicit("B{$row}", $charge['discipline'], DataType::TYPE_STRING);
            $sheet->setCellValue("C{$row}", Date::PHPToExcel($charge['period']));
            $sheet->setCellValue("D{$row}", Date::PHPToExcel($charge['due_date']));
            $sheet->setCellValue("E{$row}", $charge['amount']);
            $sheet->setCellValue("F{$row}", $charge['status']);
        }

        $lastRow = count($charges) + 1;
        $sheet->setAutoFilter("A1:F{$lastRow}");
        if ($lastRow > 1) {
            $sheet->getStyle("A2:B{$lastRow}")->getAlignment()->setWrapText(true);
            $sheet->getStyle("C2:D{$lastRow}")->getNumberFormat()->setFormatCode('dd/mm/yyyy');
            $sheet->getStyle("E2:E{$lastRow}")->getNumberFormat()->setFormatCode('#,##0');
        }

        $file = tmpfile();
        if ($file === false) {
            throw new RuntimeException('No se pudo crear el archivo temporal del reporte de cobros.');
        }

        try {
            (new Xlsx($workbook))->save($file);
            rewind($file);
            $contents = stream_get_contents($file);
            if ($contents === false) {
                throw new RuntimeException('No se pudo leer el reporte de cobros.');
            }

            return $contents;
        } finally {
            fclose($file);
            $workbook->disconnectWorksheets();
        }
    }
}
