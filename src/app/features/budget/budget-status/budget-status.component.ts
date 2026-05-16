import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { BudgetService } from '../../../core/services/budget.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { BudgetAlertService } from '../../../core/services/budget-alert.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-budget-status',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DecimalPipe],
  templateUrl: './budget-status.component.html',
  styleUrl: './budget-status.component.css'
})
export class BudgetStatusComponent implements OnInit {
  budgets: any[] = [];
  loading = true;

  get totalSpent(): number {
    return this.budgets.reduce((sum, b) => sum + (b.spentAmount || 0), 0);
  }

  get totalBudget(): number {
    return this.budgets.reduce((sum, b) => sum + (b.limitAmount || 0), 0);
  }

  constructor(
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private budgetAlertService: BudgetAlertService
  ) {}

  ngOnInit(): void {
    this.loadData();
    
    // Listen for refresh triggers (e.g. when a budget is added in another component)
    this.budgetService.refresh$.subscribe(() => {
      this.loadData();
    });
  }

  loadData() {
    this.loading = true;
    const userId = this.authService.getUserId();
    
    forkJoin({
      budgets: this.budgetService.getBudgets(userId),
      categories: this.categoryService.getCategories(userId)
    }).subscribe({
      next: (res) => {
        const budgets = res.budgets || [];
        const categories = res.categories || [];
        console.log('Fetched Budgets:', budgets);
        console.log('Fetched Categories:', categories);

        const quickIcons: { [key: string]: string } = {
          'Food': '🍕',
          'Transport': '🚗',
          'Shopping': '🛍️',
          'Health': '💊',
          'Entertainment': '🎬',
          'Education': '📚',
          'Rent': '🏠',
          'Utilities': '⚡'
        };

        this.budgets = budgets
          .filter(b => {
            // Only look up category if categoryId is actually set (avoid null == null false match)
            if (b.categoryId == null || b.categoryId === 0 || b.categoryId === '0') return true;
            const cat = categories.find(c => c.id == b.categoryId || c.Id == b.categoryId);
            return !cat || !cat.name || cat.name.toLowerCase() !== 'hem';
          })
          .map(b => {
            // Only look up category if categoryId is actually set
            const cat = (b.categoryId != null && b.categoryId !== 0 && b.categoryId !== '0')
              ? categories.find(c => c.id == b.categoryId || c.Id == b.categoryId)
              : undefined;
            // If a DB category is found use its name, else use the budget's own name (set during creation from category label), fallback to 'General'
            let catName = cat?.name || b.name || 'General';
            
            // Add icon if matched
            const matchedLabel = Object.keys(quickIcons).find(k => 
              catName && catName.toLowerCase().includes(k.toLowerCase())
            );
            if (matchedLabel) {
              catName = `${quickIcons[matchedLabel]} ${catName}`;
            } else if (catName === 'Other') {
              catName = `❓ ${catName}`;
            } else if (catName === 'General') {
              catName = `📊 ${catName}`;
            }

            return { 
              ...b, 
              id: b.budgetId || b.BudgetId || b.id || b.BudgetID, 
              categoryName: catName 
            };
          });
        
        console.log('Processed Budgets:', this.budgets);
        this.loading = false;
        // Check thresholds on every data refresh (alerts deduplicated inside the service)
        this.budgetAlertService.checkBudgetThresholds();
      },
      error: (err) => {
        console.error('Error loading budget data:', err);
        this.loading = false;
      }
    });
  }

  onDelete(id: any) {
    console.log('Attempting to delete budget with ID:', id);
    if (!id) {
      alert('Could not find budget ID');
      return;
    }

    if (confirm('Are you sure you want to delete this budget?')) {
      this.budgetService.deleteBudget(id).subscribe({
        next: () => {
          console.log('Delete successful');
          this.loadData();
        },
        error: (err) => {
          console.error('Delete failed:', err);
          alert('Failed to delete budget. Please try again.');
        }
      });
    }
  }

  getPercentage(spent: number, limit: number): number {
    if (!limit || limit <= 0) return 0;
    return Math.min((spent / limit) * 100, 100);
  }

  getProgressBarColor(spent: number, limit: number): string {
    const p = this.getPercentage(spent, limit);
    if (p >= 100) return 'linear-gradient(90deg, #ef4444, #dc2626)';
    if (p >= 80) return 'linear-gradient(90deg, #f59e0b, #d97706)';
    return 'linear-gradient(90deg, var(--primary), var(--accent))';
  }
}
