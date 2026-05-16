import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ReportService } from '../../../core/services/report.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-report-list',
  standalone: true,
  imports: [CommonModule, DatePipe, CurrencyPipe],
  templateUrl: './report-list.component.html',
  styleUrl: './report-list.component.css'
})
export class ReportListComponent implements OnInit {
  reports: any[] = [];
  generating = false;

  constructor(private reportService: ReportService, private authService: AuthService) {}

  ngOnInit(): void {
    this.loadReports();
  }

  loadReports() {
    const userId = this.authService.getUserId();
    this.reportService.getReports(userId).subscribe(data => {
      this.reports = data;
    });
  }

  generateMonthlyReport() {
    this.generating = true;
    const userId = this.authService.getUserId();
    const request = {
      userId: userId,
      reportType: 'MONTHLY',
      title: `Monthly Spending Report - ${new Date().toLocaleString('default', { month: 'long' })}`,
      parameters: JSON.stringify({ month: new Date().getMonth() + 1, year: new Date().getFullYear() })
    };

    this.reportService.generateReport(request).subscribe({
      next: () => {
        this.generating = false;
        this.loadReports();
      },
      error: () => {
        this.generating = false;
        alert('Failed to generate report');
      }
    });
  }

  downloadReport(reportId: number) {
    this.reportService.getDownloadUrl(reportId).subscribe(data => {
      window.open(data.url, '_blank');
    });
  }

  deleteReport(reportId: number) {
    if (confirm('Are you sure you want to delete this report?')) {
      this.reportService.deleteReport(reportId).subscribe({
        next: () => {
          this.reports = this.reports.filter(r => (r.id || r.reportId || r.ReportId) !== reportId);
          this.loadReports();
        },
        error: (err) => alert('Failed to delete report: ' + (err.error?.Message || err.message))
      });
    }
  }

  clearHistory() {
    if (confirm('Are you sure you want to clear your entire download history? This action cannot be undone.')) {
      this.reportService.clearHistory().subscribe({
        next: () => {
          this.reports = [];
        },
        error: (err) => alert('Failed to clear history: ' + (err.error?.Message || err.message))
      });
    }
  }
}
