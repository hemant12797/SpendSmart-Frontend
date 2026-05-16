import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { BudgetService } from './budget.service';
import { CategoryService } from './category.service';
import { AuthService } from './auth.service';
import { forkJoin } from 'rxjs';

export interface BudgetAlert {
  type: 'warning' | 'danger';   // 80% = warning, 100% = danger
  categoryName: string;
  percent: number;
  spent: number;
  limit: number;
}

@Injectable({
  providedIn: 'root'
})
export class BudgetAlertService {
  private alertSubject = new Subject<BudgetAlert>();
  public alert$ = this.alertSubject.asObservable();

  // Track which budgets we already alerted for this session
  // key = `${budgetId}_${threshold}` e.g. "5_80" or "5_100"
  private alerted = new Set<string>();

  constructor(
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private authService: AuthService
  ) {}

  /** Call this after every expense is saved */
  checkBudgetThresholds(categoryId?: number | null): void {
    const userId = this.authService.getUserId();

    const quickIcons: { [key: string]: string } = {
      'Food': '🍕', 'Transport': '🚗', 'Shopping': '🛍️',
      'Health': '💊', 'Entertainment': '🎬', 'Education': '📚',
      'Rent': '🏠', 'Utilities': '⚡'
    };

    forkJoin({
      budgets: this.budgetService.getBudgets(userId),
      categories: this.categoryService.getCategories(userId)
    }).subscribe({
      next: ({ budgets, categories }) => {
        (budgets || []).forEach(b => {
          const spent = b.spentAmount || 0;
          const limit = b.limitAmount || 0;
          if (limit <= 0) return;

          // Only alert for the category just added (or all if no specific category)
          const budgetCatId = b.categoryId ?? null;
          if (categoryId != null && budgetCatId != null && String(budgetCatId) !== String(categoryId)) return;

          const pct = (spent / limit) * 100;
          const budgetId = b.budgetId || b.BudgetId || b.id || b.BudgetID || b.Id;

          // Resolve friendly name
          const cat = budgetCatId != null
            ? categories.find((c: any) => c.id == budgetCatId)
            : undefined;
          let catName = cat?.name || b.name || 'General';
          const iconKey = Object.keys(quickIcons).find(k => catName.toLowerCase().includes(k.toLowerCase()));
          if (iconKey) catName = `${quickIcons[iconKey]} ${catName}`;

          // 100% threshold
          const key100 = `${budgetId}_100`;
          if (pct >= 100 && !this.alerted.has(key100)) {
            this.alerted.add(key100);
            this.alertSubject.next({
              type: 'danger',
              categoryName: catName,
              percent: Math.round(pct),
              spent,
              limit
            });
          }

          // 80% threshold (only if not already at 100%)
          const key80 = `${budgetId}_80`;
          if (pct >= 80 && pct < 100 && !this.alerted.has(key80)) {
            this.alerted.add(key80);
            this.alertSubject.next({
              type: 'warning',
              categoryName: catName,
              percent: Math.round(pct),
              spent,
              limit
            });
          }

          // Reset alert if user goes below 80% (e.g. after deleting an expense)
          if (pct < 80) {
            this.alerted.delete(key80);
            this.alerted.delete(key100);
          }
        });
      }
    });
  }

  /** Manually emit an alert (e.g. called from outside) */
  emit(alert: BudgetAlert) {
    this.alertSubject.next(alert);
  }
}
