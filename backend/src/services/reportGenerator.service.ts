import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';

export class ReportGeneratorService {
  private static prisma = new PrismaClient();

  public static async generateReport(
    runId: string,
    type: 'reconciliation' | 'exceptions' | 'settlements',
    format: 'csv' | 'xlsx' | 'html'
  ): Promise<{ data: Buffer | string; contentType: string; fileName: string }> {
    const run = await this.prisma.reconciliationRun.findUnique({
      where: { id: runId },
      include: {
        cases: {
          include: { sourceRecords: true, exception: true },
          orderBy: { createdAt: 'asc' },
        },
        exceptions: {
          include: { reconciledCase: true },
          orderBy: { difference: 'desc' },
        },
        settlementInsights: true,
      },
    });

    if (!run) {
      throw new Error(`Reconciliation run ${runId} not found.`);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (type === 'reconciliation') {
      const rows = run.cases.map((c, i) => ({
        '#': i + 1,
        'Case Number': c.caseNumber,
        'Primary Reference': c.primaryReference || 'N/A',
        'Classification': c.classification,
        'Confidence Score (%)': c.confidenceScore,
        'Matching Method': c.matchingMethod,
        'Bank Amount ($)': c.bankAmount !== null ? c.bankAmount.toFixed(2) : '',
        'Merchant Amount ($)': c.merchantAmount !== null ? c.merchantAmount.toFixed(2) : '',
        'Settlement Amount ($)': c.settlementAmount !== null ? c.settlementAmount.toFixed(2) : '',
        'Fee Deducted ($)': c.feeAmount ? c.feeAmount.toFixed(2) : '0.00',
        'Financial Difference ($)': c.financialDifference.toFixed(2),
        'Date': c.transactionDate ? c.transactionDate.toISOString().split('T')[0] : '',
        'Customer': c.customer || '',
        'Payment Method': c.paymentMethod || '',
        'Status': c.status,
        'Explanation': c.explanation,
      }));

      if (format === 'csv') {
        const csvStr = this.convertToCsv(rows);
        return {
          data: csvStr,
          contentType: 'text/csv',
          fileName: `reconx_reconciliation_report_${timestamp}.csv`,
        };
      } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Reconciliation');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return {
          data: buf,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileName: `reconx_reconciliation_report_${timestamp}.xlsx`,
        };
      } else {
        const html = this.renderHtmlReport(
          `Reconciliation Report — ${run.name}`,
          `Generated on ${new Date().toLocaleString()} | Run ID: ${run.id}`,
          [
            { label: 'Total Cases', value: run.totalCases },
            { label: 'Match Rate', value: `${run.matchRate}%` },
            { label: 'Matched', value: run.matchedCount },
            { label: 'Exceptions', value: run.amountMismatchCount + run.missingCount + run.missingSettlementCount + run.duplicateCount + run.partialSettlementCount + run.reviewRequiredCount },
            { label: 'Total Difference', value: `$${run.totalDifference.toFixed(2)}` },
          ],
          rows
        );
        return {
          data: html,
          contentType: 'text/html',
          fileName: `reconx_reconciliation_report_${timestamp}.html`,
        };
      }
    } else if (type === 'exceptions') {
      const rows = run.exceptions.map((e, i) => ({
        '#': i + 1,
        'Type': e.type,
        'Severity': e.severity,
        'Reference': e.reconciledCase.primaryReference || 'N/A',
        'Affected Sources': e.affectedSources,
        'Financial Difference ($)': e.difference.toFixed(2),
        'Status': e.status,
        'Explanation': e.explanation,
        'Recommended Action': e.recommendedAction,
      }));

      if (format === 'csv') {
        return {
          data: this.convertToCsv(rows),
          contentType: 'text/csv',
          fileName: `reconx_exceptions_report_${timestamp}.csv`,
        };
      } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Exceptions');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return {
          data: buf,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileName: `reconx_exceptions_report_${timestamp}.xlsx`,
        };
      } else {
        const html = this.renderHtmlReport(
          `Exceptions Command Report — ${run.name}`,
          `Generated on ${new Date().toLocaleString()} | Total Open Exceptions: ${run.exceptions.length}`,
          [
            { label: 'Total Exceptions', value: run.exceptions.length },
            { label: 'Amount Mismatches', value: run.amountMismatchCount },
            { label: 'Missing Settlements', value: run.missingSettlementCount },
            { label: 'Duplicates', value: run.duplicateCount },
            { label: 'Total Exposure', value: `$${run.totalDifference.toFixed(2)}` },
          ],
          rows
        );
        return {
          data: html,
          contentType: 'text/html',
          fileName: `reconx_exceptions_report_${timestamp}.html`,
        };
      }
    } else {
      // SETTLEMENTS
      const insight = run.settlementInsights[0];
      const rows = run.cases
        .filter(c => c.settlementAmount !== null || c.classification === 'MISSING_SETTLEMENT')
        .map((c, i) => ({
          '#': i + 1,
          'Reference': c.primaryReference || 'N/A',
          'Merchant Order ($)': c.merchantAmount ? c.merchantAmount.toFixed(2) : '',
          'Settlement Payout ($)': c.settlementAmount ? c.settlementAmount.toFixed(2) : 'MISSING',
          'Gateway Fee ($)': c.feeAmount ? c.feeAmount.toFixed(2) : '0.00',
          'Classification': c.classification,
          'Delay (Days)': c.dateDifferenceDays !== null ? c.dateDifferenceDays : 'N/A',
          'Status': c.status,
        }));

      if (format === 'csv') {
        return {
          data: this.convertToCsv(rows),
          contentType: 'text/csv',
          fileName: `reconx_settlements_report_${timestamp}.csv`,
        };
      } else if (format === 'xlsx') {
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, 'Settlements');
        const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
        return {
          data: buf,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          fileName: `reconx_settlements_report_${timestamp}.xlsx`,
        };
      } else {
        const html = this.renderHtmlReport(
          `Settlement Intelligence Report — ${run.name}`,
          `Generated on ${new Date().toLocaleString()} | Run: ${run.id}`,
          [
            { label: 'Gross Volume', value: `$${insight ? insight.grossCollections.toFixed(2) : run.grossMerchantAmount.toFixed(2)}` },
            { label: 'Net Settlements', value: `$${insight ? insight.netSettlements.toFixed(2) : run.netSettlementAmount.toFixed(2)}` },
            { label: 'Gateway Fees', value: `$${insight ? insight.totalFees.toFixed(2) : run.totalFees.toFixed(2)}` },
            { label: 'Avg Delay', value: `${insight ? insight.averageDelayDays : 0} days` },
            { label: 'Pending Payouts', value: `$${insight ? insight.pendingSettlements.toFixed(2) : 0}` },
          ],
          rows
        );
        return {
          data: html,
          contentType: 'text/html',
          fileName: `reconx_settlements_report_${timestamp}.html`,
        };
      }
    }
  }

  private static convertToCsv(rows: Record<string, any>[]): string {
    if (rows.length === 0) return '';
    const headers = Object.keys(rows[0]);
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headerLine = headers.map(escapeCsv).join(',');
    const dataLines = rows.map(r => headers.map(h => escapeCsv(r[h])).join(','));
    return [headerLine, ...dataLines].join('\n');
  }

  private static renderHtmlReport(
    title: string,
    subtitle: string,
    kpis: { label: string; value: any }[],
    rows: Record<string, any>[]
  ): string {
    const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} | RECONX AI</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 32px; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { border-bottom: 1px solid #334155; padding-bottom: 20px; margin-bottom: 24px; }
    .brand { font-size: 14px; font-weight: 700; color: #38bdf8; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
    h1 { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; color: #ffffff; }
    .subtitle { font-size: 14px; color: #94a3b8; margin: 0; }
    .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 16px; margin-bottom: 32px; }
    .kpi-card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; }
    .kpi-label { font-size: 12px; color: #94a3b8; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
    .kpi-value { font-size: 22px; font-weight: 700; color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; background: #1e293b; border: 1px solid #334155; border-radius: 8px; overflow: hidden; font-size: 13px; }
    th { background: #0f172a; color: #cbd5e1; font-weight: 600; text-align: left; padding: 12px 14px; border-bottom: 1px solid #334155; }
    td { padding: 10px 14px; border-bottom: 1px solid #1e293b; color: #e2e8f0; border-top: 1px solid #334155; }
    tr:nth-child(even) td { background: #162032; }
    .footer { margin-top: 32px; font-size: 12px; color: #64748b; text-align: center; border-top: 1px solid #334155; padding-top: 16px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">RECONX AI — Financial Reconciliation Workspace</div>
      <h1>${title}</h1>
      <p class="subtitle">${subtitle}</p>
    </div>

    <div class="kpi-grid">
      ${kpis.map(k => `<div class="kpi-card"><div class="kpi-label">${k.label}</div><div class="kpi-value">${k.value}</div></div>`).join('')}
    </div>

    <table>
      <thead>
        <tr>
          ${headers.map(h => `<th>${h}</th>`).join('')}
        </tr>
      </thead>
      <tbody>
        ${rows.map(r => `<tr>${headers.map(h => `<td>${r[h] !== undefined ? String(r[h]) : ''}</td>`).join('')}</tr>`).join('')}
      </tbody>
    </table>

    <div class="footer">
      Generated automatically by RECONX AI. Turn payment chaos into financial clarity.
    </div>
  </div>
</body>
</html>`;
  }
}
