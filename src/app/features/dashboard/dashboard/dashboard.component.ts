import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';
import { BudgetAlertService, BudgetAlert } from '../../../core/services/budget-alert.service';
import { BudgetStatusComponent } from '../../budget/budget-status/budget-status.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, BudgetStatusComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  notifications: any[] = [];
  showNotifications = false;
  toasts: (BudgetAlert & { id: number })[] = [];
  private toastCounter = 0;
  
  serviceStatus: { [key: string]: 'online' | 'offline' | 'checking' } = {
    auth: 'checking',
    expense: 'checking',
    budget: 'checking',
    notification: 'checking'
  };

  constructor(
    public authService: AuthService, 
    private notificationService: NotificationService,
    private budgetAlertService: BudgetAlertService,
    private router: Router
  ) {}

  ngOnInit() {
    // Role-based redirection if at root dashboard
    if (this.router.url === '/dashboard' || this.router.url === '/dashboard/') {
      if (this.authService.isAdmin()) {
        this.router.navigate(['/dashboard/admin']);
      }
    }

    const token = localStorage.getItem('token');
    if (token) {
      this.notificationService.startConnection(token);
      this.notificationService.notifications$.subscribe(notification => {
        this.notifications.unshift(notification);
      });
    }

    // Subscribe to budget threshold alerts
    this.budgetAlertService.alert$.subscribe(alert => {
      this.showBudgetToast(alert);
    });

    this.checkApiHealth();
  }

  checkApiHealth() {
    const apis = [
      { name: 'auth', url: this.authService.getApiUrl() },
      { name: 'expense', url: environment.expenseApi },
      { name: 'budget', url: environment.budgetApi },
      { name: 'notification', url: environment.notificationApi.replace('/notificationHub', '') }
    ];

    apis.forEach(api => {
      // Simple ping (might need adjustment if CORS/Options fails)
      fetch(api.url).then(res => {
        this.serviceStatus[api.name] = res.ok || res.status < 500 ? 'online' : 'offline';
      }).catch(() => {
        this.serviceStatus[api.name] = 'offline';
      });
    });
  }

  showBudgetToast(alert: BudgetAlert) {
    const id = ++this.toastCounter;
    this.toasts.push({ ...alert, id });
    // Also add to notification bell
    const icon = alert.type === 'danger' ? '🚨' : '⚠️';
    const title = alert.type === 'danger'
      ? `Budget Exceeded! ${alert.categoryName}`
      : `Budget Warning! ${alert.categoryName}`;
    const message = alert.type === 'danger'
      ? `You have exceeded your ${alert.categoryName} budget limit (${alert.percent}% used). No budget remaining!`
      : `You have used ${alert.percent}% of your ${alert.categoryName} budget. Spending is high!`;
    this.notifications.unshift({ title: `${icon} ${title}`, message });
    // Auto-dismiss after 6 seconds
    setTimeout(() => this.removeToast(id), 6000);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  logout() {
    this.notificationService.stopConnection();
    this.authService.logout();
  }
}
