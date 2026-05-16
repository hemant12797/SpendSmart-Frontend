import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.css'
})
export class ExpenseListComponent implements OnInit {
  expenses: any[] = [];
  filteredExpenses: any[] = [];
  loading = true;
  filter = 'all';

  get totalAmount(): number {
    return this.filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }

  get avgAmount(): number {
    if (this.filteredExpenses.length === 0) return 0;
    return this.totalAmount / this.filteredExpenses.length;
  }

  constructor(
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    const userId = this.authService.getUserId();

    forkJoin({
      expenses: this.expenseService.getExpenses(userId),
      categories: this.categoryService.getCategories(userId)
    }).subscribe({
      next: (res) => {
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

        this.expenses = (res.expenses || []).map(e => {
          const categories = res.categories || [];
          const cat = categories.find(c => {
            const cId = c.categoryId || c.CategoryId || c.id || c.Id;
            const eCatId = e.categoryId || e.CategoryId;
            return cId == eCatId;
          });
          const eCatId = e.categoryId || e.CategoryId || 0;
          let catName = cat ? cat.name : (eCatId === 0 ? 'Other' : 'General');

          // Add icon if matched
          const matchedLabel = Object.keys(quickIcons).find(k => 
            catName.toLowerCase().includes(k.toLowerCase())
          );
          if (matchedLabel) {
            catName = `${quickIcons[matchedLabel]} ${catName}`;
          } else if (catName === 'Other') {
            catName = `❓ ${catName}`;
          } else if (catName === 'General') {
            catName = `📊 ${catName}`;
          }

          return { ...e, categoryName: catName };
        });

        this.filteredExpenses = [...this.expenses];
        this.loading = false;
        this.setFilter(this.filter);
      },
      error: (err) => {
        console.error('Error loading expenses:', err);
        this.loading = false;
      }
    });
  }

  setFilter(f: string) {
    this.filter = f;
    const now = new Date();
    if (f === 'all') {
      this.filteredExpenses = this.expenses;
    } else if (f === 'today') {
      this.filteredExpenses = this.expenses.filter(e => {
        const d = new Date(e.date);
        return d.toDateString() === now.toDateString();
      });
    } else if (f === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      this.filteredExpenses = this.expenses.filter(e => new Date(e.date) >= weekAgo);
    } else if (f === 'month') {
      this.filteredExpenses = this.expenses.filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
  }

  deleteExpense(id: number) {
    if (confirm('Are you sure you want to delete this expense?')) {
      this.expenseService.deleteExpense(id).subscribe({
        next: () => {
          this.expenses = this.expenses.filter(e => {
            const eId = e.expenseId || e.ExpenseId || e.id || e.Id;
            return eId !== id;
          });
          this.setFilter(this.filter); // Re-apply the current filter
        },
        error: () => {
          alert('Failed to delete expense. Please try again.');
        }
      });
    }
  }
}
