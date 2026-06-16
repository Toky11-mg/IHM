<?php
 
namespace App\Controller;
 
use App\Service\StatistiqueService;
use Dompdf\Dompdf;
use Dompdf\Options;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;
 
#[Route('/api/statistiques', name: 'api_statistiques_')]
class StatistiqueExportController extends AbstractController
{
    public function __construct(
        private StatistiqueService $statistiqueService
    ) {}
 
    // =====================
    // GET /api/statistiques/export/pdf
    // =====================
    #[Route('/export/pdf', name: 'export_pdf', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function exportPdf(): Response
    {
        $data = $this->statistiqueService->getStatistiquesGlobales();
 
        $options = new Options();
        $options->set('defaultFont', 'DejaVu Sans');
        $options->set('isRemoteEnabled', false);
 
        $dompdf = new Dompdf($options);
        $dompdf->loadHtml($this->buildPdfHtml($data), 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();
 
        $filename = 'statistiques_' . date('Y-m-d') . '.pdf';
 
        return new Response(
            $dompdf->output(),
            Response::HTTP_OK,
            [
                'Content-Type'        => 'application/pdf',
                'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            ]
        );
    }
 
    // =====================
    // GET /api/statistiques/export/excel
    // =====================
    #[Route('/export/excel', name: 'export_excel', methods: ['GET'])]
    #[IsGranted('IS_AUTHENTICATED_FULLY')]
    public function exportExcel(): StreamedResponse
    {
        $data = $this->statistiqueService->getStatistiquesGlobales();
 
        $spreadsheet = new Spreadsheet();
        $spreadsheet->getProperties()
            ->setTitle('Statistiques ENI')
            ->setCreator('Système ENI');
 
        $this->buildExcel($spreadsheet, $data);
 
        $filename = 'statistiques_' . date('Y-m-d') . '.xlsx';
 
        $response = new StreamedResponse(function () use ($spreadsheet) {
            $writer = new Xlsx($spreadsheet);
            $writer->save('php://output');
        });
 
        $response->headers->set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        $response->headers->set('Content-Disposition', "attachment; filename=\"{$filename}\"");
        $response->headers->set('Cache-Control', 'max-age=0');
 
        return $response;
    }
 
    // =====================
    // BUILD HTML POUR PDF
    // =====================
    private function buildPdfHtml(array $data): string
    {
        $dateGen     = date('d/m/Y à H:i');
        $nbEtu       = $data['nb_etudiants'];
        $nbEns       = $data['nb_enseignants'];
        $nbMat       = $data['nb_matieres'];
        $taux        = $data['taux_reussite'];
        $tauxColor   = $taux >= 70 ? '#065f46' : ($taux >= 50 ? '#854d0e' : '#991b1b');
        $tauxBg      = $taux >= 70 ? '#d1fae5' : ($taux >= 50 ? '#fef9c3' : '#fee2e2');
 
        // Lignes filières
        $lignesFilieres = '';
        foreach ($data['notes_par_filiere'] as $row) {
            $moy      = $row['moyenne'] ?? '—';
            $moyStr   = $moy !== null ? number_format((float)$moy, 2) . '/20' : '—';
            $moyColor = ($moy !== null && (float)$moy >= 10) ? '#065f46' : '#991b1b';
            $nb       = (int)($row['nb_notes'] ?? 0);
            $reussis  = (int)($row['nb_reussis'] ?? 0);
            $echoues  = (int)($row['nb_echoues'] ?? 0);
            $txF      = $nb > 0 ? round($reussis / $nb * 100, 1) : 0;
            $filiere  = htmlspecialchars($row['filiere'] ?? '—');
 
            $lignesFilieres .= <<<HTML
            <tr>
              <td>{$filiere}</td>
              <td style="text-align:center">{$nb}</td>
              <td style="text-align:center;color:{$moyColor};font-weight:600">{$moyStr}</td>
              <td style="text-align:center;color:#065f46">{$reussis}</td>
              <td style="text-align:center;color:#991b1b">{$echoues}</td>
              <td style="text-align:center;font-weight:600">{$txF}%</td>
            </tr>
HTML;
        }
 
        // Lignes délibérations
        $lignesDelib = '';
        foreach ($data['deliberations_par_decision'] as $row) {
            $decision = htmlspecialchars($row['decision'] ?? '—');
            $total    = (int)$row['total'];
            $lignesDelib .= <<<HTML
            <tr>
              <td>{$decision}</td>
              <td style="text-align:center;font-weight:600">{$total}</td>
            </tr>
HTML;
        }
 
        if (!$lignesDelib) {
            $lignesDelib = '<tr><td colspan="2" style="text-align:center;color:#9ca3af">Aucune délibération enregistrée.</td></tr>';
        }
 
        return <<<HTML
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: DejaVu Sans, sans-serif; font-size:11px; color:#1a1a1a; }
 
  .header { background:#064e3b; color:#fff; padding:20px 24px; }
  .header h1 { font-size:20px; font-weight:bold; }
  .header p  { font-size:10px; opacity:0.8; margin-top:3px; }
 
  .content { padding:20px 24px; }
 
  .kpi-grid { display:table; width:100%; border-collapse:separate; border-spacing:8px; margin-bottom:4px; }
  .kpi-row  { display:table-row; }
  .kpi-cell { display:table-cell; width:25%; background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; padding:12px; text-align:center; vertical-align:middle; }
  .kpi-val  { font-size:24px; font-weight:bold; color:#064e3b; }
  .kpi-lbl  { font-size:10px; color:#6b7280; margin-top:3px; }
 
  .section-title { font-size:10px; font-weight:bold; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin:20px 0 8px; border-bottom:1px solid #e5e7eb; padding-bottom:4px; }
 
  table { width:100%; border-collapse:collapse; font-size:10px; }
  thead tr { background:#f0fdf4; }
  th { padding:7px 8px; text-align:left; font-weight:600; color:#374151; border-bottom:2px solid #047857; }
  td { padding:6px 8px; border-bottom:1px solid #f3f4f6; }
  tr:last-child td { border-bottom:none; }
  tr:nth-child(even) { background:#f9fafb; }
 
  .taux-badge { display:inline-block; padding:4px 12px; border-radius:99px; font-size:14px; font-weight:bold; background:{$tauxBg}; color:{$tauxColor}; }
 
  .footer { margin-top:30px; padding:10px 24px; background:#f9fafb; border-top:1px solid #e5e7eb; display:flex; justify-content:space-between; font-size:9px; color:#9ca3af; }
</style>
</head>
<body>
 
<div class="header">
  <h1>📊 Rapport Statistiques</h1>
  <p>École Nationale d'Informatique — Généré le {$dateGen}</p>
</div>
 
<div class="content">
 
  <!-- KPI -->
  <div class="section-title">Indicateurs clés</div>
  <div class="kpi-grid">
    <div class="kpi-row">
      <div class="kpi-cell"><div class="kpi-val">{$nbEtu}</div><div class="kpi-lbl">Étudiants actifs</div></div>
      <div class="kpi-cell"><div class="kpi-val">{$nbEns}</div><div class="kpi-lbl">Enseignants actifs</div></div>
      <div class="kpi-cell"><div class="kpi-val">{$nbMat}</div><div class="kpi-lbl">Matières actives</div></div>
      <div class="kpi-cell"><div class="kpi-val"><span class="taux-badge">{$taux}%</span></div><div class="kpi-lbl">Taux de réussite global</div></div>
    </div>
  </div>
 
  <!-- PAR FILIÈRE -->
  <div class="section-title">Résultats par filière</div>
  <table>
    <thead>
      <tr>
        <th>Filière</th>
        <th style="text-align:center">Nb Notes</th>
        <th style="text-align:center">Moyenne</th>
        <th style="text-align:center">Réussis</th>
        <th style="text-align:center">Échecs</th>
        <th style="text-align:center">Taux</th>
      </tr>
    </thead>
    <tbody>
      {$lignesFilieres}
    </tbody>
  </table>
 
  <!-- DÉLIBÉRATIONS -->
  <div class="section-title">Délibérations par décision</div>
  <table>
    <thead>
      <tr>
        <th>Décision</th>
        <th style="text-align:center">Total</th>
      </tr>
    </thead>
    <tbody>
      {$lignesDelib}
    </tbody>
  </table>
 
</div>
 
<div class="footer">
  <span>Généré le {$dateGen}</span>
  <span>ENI — Système de gestion des notes</span>
  <span>Document officiel</span>
</div>
 
</body>
</html>
HTML;
    }
 
    // =====================
    // BUILD EXCEL
    // =====================
    private function buildExcel(Spreadsheet $spreadsheet, array $data): void
    {
        $green  = '064e3b';
        $green2 = 'f0fdf4';
        $gray   = 'f9fafb';
 
        // ── Feuille 1 : Résumé ──────────────────────────────────────────
        $sheet = $spreadsheet->getActiveSheet();
        $sheet->setTitle('Résumé');
 
        // Titre
        $sheet->mergeCells('A1:D1');
        $sheet->setCellValue('A1', 'STATISTIQUES ENI — ' . date('d/m/Y'));
        $sheet->getStyle('A1')->applyFromArray([
            'font'      => ['bold' => true, 'size' => 14, 'color' => ['rgb' => 'FFFFFF']],
            'fill'      => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $green]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
        $sheet->getRowDimension(1)->setRowHeight(30);
 
        // KPI
        $kpis = [
            ['Étudiants actifs',    $data['nb_etudiants']],
            ['Enseignants actifs',  $data['nb_enseignants']],
            ['Matières actives',    $data['nb_matieres']],
            ['Taux de réussite (%)',$data['taux_reussite']],
        ];
 
        $sheet->setCellValue('A3', 'Indicateur');
        $sheet->setCellValue('B3', 'Valeur');
        $sheet->getStyle('A3:B3')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $green]],
        ]);
 
        foreach ($kpis as $i => [$label, $val]) {
            $row = 4 + $i;
            $sheet->setCellValue("A{$row}", $label);
            $sheet->setCellValue("B{$row}", $val);
            if ($i % 2 === 0) {
                $sheet->getStyle("A{$row}:B{$row}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('f3f4f6');
            }
        }
 
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(18);
        $sheet->getColumnDimension('C')->setWidth(18);
        $sheet->getColumnDimension('D')->setWidth(18);
 
        // ── Feuille 2 : Par filière ──────────────────────────────────────
        $sheet2 = $spreadsheet->createSheet();
        $sheet2->setTitle('Par filière');
 
        $headers = ['Filière', 'Nb Notes', 'Moyenne /20', 'Réussis', 'Échecs', 'Taux de réussite (%)'];
        foreach ($headers as $col => $h) {
            $cell = chr(65 + $col) . '1';
            $sheet2->setCellValue($cell, $h);
        }
        $sheet2->getStyle('A1:F1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $green]],
            'alignment' => ['horizontal' => Alignment::HORIZONTAL_CENTER],
        ]);
 
        foreach ($data['notes_par_filiere'] as $i => $row) {
            $r   = $i + 2;
            $nb  = (int)($row['nb_notes'] ?? 0);
            $ok  = (int)($row['nb_reussis'] ?? 0);
            $ko  = (int)($row['nb_echoues'] ?? 0);
            $tx  = $nb > 0 ? round($ok / $nb * 100, 1) : 0;
            $moy = $row['moyenne'] !== null ? round((float)$row['moyenne'], 2) : null;
 
            $sheet2->setCellValue("A{$r}", $row['filiere'] ?? '—');
            $sheet2->setCellValue("B{$r}", $nb);
            $sheet2->setCellValue("C{$r}", $moy);
            $sheet2->setCellValue("D{$r}", $ok);
            $sheet2->setCellValue("E{$r}", $ko);
            $sheet2->setCellValue("F{$r}", $tx);
 
            if ($i % 2 === 0) {
                $sheet2->getStyle("A{$r}:F{$r}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('f9fafb');
            }
 
            // Coloration taux
            $txColor = $tx >= 70 ? '065f46' : ($tx >= 50 ? '854d0e' : '991b1b');
            $sheet2->getStyle("F{$r}")->getFont()->getColor()->setRGB($txColor);
            $sheet2->getStyle("F{$r}")->getFont()->setBold(true);
        }
 
        foreach (['A' => 22, 'B' => 12, 'C' => 14, 'D' => 12, 'E' => 12, 'F' => 20] as $col => $w) {
            $sheet2->getColumnDimension($col)->setWidth($w);
        }
        $sheet2->getStyle('B1:F1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);
 
        // ── Feuille 3 : Délibérations ────────────────────────────────────
        $sheet3 = $spreadsheet->createSheet();
        $sheet3->setTitle('Délibérations');
 
        $sheet3->setCellValue('A1', 'Décision');
        $sheet3->setCellValue('B1', 'Total');
        $sheet3->getStyle('A1:B1')->applyFromArray([
            'font' => ['bold' => true, 'color' => ['rgb' => 'FFFFFF']],
            'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['rgb' => $green]],
        ]);
 
        foreach ($data['deliberations_par_decision'] as $i => $row) {
            $r = $i + 2;
            $sheet3->setCellValue("A{$r}", $row['decision'] ?? '—');
            $sheet3->setCellValue("B{$r}", (int)$row['total']);
            if ($i % 2 === 0) {
                $sheet3->getStyle("A{$r}:B{$r}")->getFill()
                    ->setFillType(Fill::FILL_SOLID)
                    ->getStartColor()->setRGB('f9fafb');
            }
        }
 
        $sheet3->getColumnDimension('A')->setWidth(28);
        $sheet3->getColumnDimension('B')->setWidth(12);
 
        // Active la première feuille
        $spreadsheet->setActiveSheetIndex(0);
    }
}