import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ExpenseService } from '../../../core/services/expense.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';
import { BudgetAlertService } from '../../../core/services/budget-alert.service';
import { BudgetService } from '../../../core/services/budget.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-add-expense',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-expense.component.html',
  styleUrl: './add-expense.component.css'
})
export class AddExpenseComponent implements OnInit {
  expenseForm: FormGroup;
  categories: any[] = [];
  budgets: any[] = [];
  submitting = false;
  successMsg = '';
  errorMsg = '';

  /** Budget info shown below the category dropdown */
  selectedBudget: any = null;

  displayCategories: any[] = [];

  /** Expose Math to template */
  Math = Math;

  constructor(
    private fb: FormBuilder,
    private expenseService: ExpenseService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private budgetAlertService: BudgetAlertService,
    private budgetService: BudgetService,
    private router: Router
  ) {
    this.expenseForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      categoryId: ['', Validators.required],
      description: ['', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      paymentMode: ['CASH', Validators.required]
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();

    forkJoin({
      categories: this.categoryService.getCategories(userId),
      budgets: this.budgetService.getBudgets(userId)
    }).subscribe({
      next: ({ categories, budgets }) => {
        this.categories = categories;
        this.budgets = budgets || [];
        this.prepareCategoryOptions();
      },
      error: () => {
        this.prepareCategoryOptions();
      }
    });

    // Listen for category change to update budget info
    this.expenseForm.get('categoryId')?.valueChanges.subscribe(catId => {
      this.updateSelectedBudget(catId);
      this.errorMsg = '';
    });
  }

  updateSelectedBudget(catId: string) {
    if (!catId || catId === '0' || catId === '') {
      this.selectedBudget = null;
      return;
    }
    const numId = parseInt(catId, 10);
    const getCatId = (b: any) => b.categoryId !== undefined ? b.categoryId : b.CategoryId;

    // Find category-specific budget
    const catBudget = this.budgets.find(b =>
      getCatId(b) != null && Number(getCatId(b)) === numId
    );
    // Fallback to overall budget (categoryId = null)
    const overallBudget = this.budgets.find(b => getCatId(b) == null);
    this.selectedBudget = catBudget || overallBudget || null;
  }

  prepareCategoryOptions() {
    const quickOnes = [
      { icon: '🍕', label: 'Food' },
      { icon: '🚗', label: 'Transport' },
      { icon: '🛍️', label: 'Shopping' },
      { icon: '💊', label: 'Health' },
      { icon: '🎬', label: 'Entertainment' },
      { icon: '📚', label: 'Education' },
      { icon: '🏠', label: 'Rent' },
      { icon: '⚡', label: 'Utilities' },
    ];

    this.displayCategories = [];

    quickOnes.forEach(qc => {
      const match = this.categories.find(c =>
        c.name.toLowerCase().includes(qc.label.toLowerCase()) ||
        qc.label.toLowerCase().includes(c.name.toLowerCase())
      );

      if (match) {
        this.displayCategories.push({
          id: match.categoryId || match.CategoryId || match.id || match.Id,
          name: `${qc.icon} ${qc.label}`
        });
      }
    });

    this.categories.forEach(c => {
      const isHem = c.name.toLowerCase() === 'hem';
      const cId = c.categoryId || c.CategoryId || c.id || c.Id;
      const type = c.type || c.Type;
      const isExpense = !type || type.toUpperCase() === 'EXPENSE';
      const isDefault = c.isDefault || c.IsDefault;
      
      const alreadyAdded = this.displayCategories.some(dc => dc.id === cId && dc.id !== '0');

      if (!alreadyAdded && !isHem && isExpense && !isDefault) {
        this.displayCategories.push({
          id: cId,
          name: c.name
        });
      }
    });

    if (!this.displayCategories.some(dc => dc.id === '0')) {
      this.displayCategories.push({ id: '0', name: '❓ Other' });
    }
  }

  get budgetRemaining(): number | null {
    if (!this.selectedBudget) return null;
    return (this.selectedBudget.limitAmount ?? this.selectedBudget.LimitAmount ?? 0)
         - (this.selectedBudget.spentAmount ?? this.selectedBudget.SpentAmount ?? 0);
  }

  get budgetLimit(): number | null {
    if (!this.selectedBudget) return null;
    return this.selectedBudget.limitAmount ?? this.selectedBudget.LimitAmount ?? null;
  }

  get budgetSpent(): number | null {
    if (!this.selectedBudget) return null;
    return this.selectedBudget.spentAmount ?? this.selectedBudget.SpentAmount ?? null;
  }

  onCategoryChange(event: any) {
    // handled via valueChanges subscription
  }

  resetForm() {
    this.expenseForm.reset({
      date: new Date().toISOString().substring(0, 10),
      paymentMode: 'CASH'
    });
    this.successMsg = '';
    this.errorMsg = '';
    this.selectedBudget = null;
  }

  onSubmit() {
    if (this.expenseForm.valid) {
      // ── Client-side budget guard ──────────────────────────────────────────
      const enteredAmount = parseFloat(this.expenseForm.value.amount);
      if (this.selectedBudget !== null) {
        const remaining = this.budgetRemaining ?? 0;
        if (enteredAmount > remaining) {
          this.errorMsg = `❌ Budget limit exceeded! Remaining budget: ₹${remaining.toFixed(2)}. You tried to add ₹${enteredAmount.toFixed(2)}.`;
          return;
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      this.submitting = true;
      this.errorMsg = '';
      const formValue = this.expenseForm.value;
      const expense = {
        ...formValue,
        categoryId: parseInt(formValue.categoryId, 10) || 0,
        amount: parseFloat(formValue.amount),
        userId: this.authService.getUserId()
      };

      this.expenseService.addExpense(expense).subscribe({
        next: () => {
          this.submitting = false;
          this.successMsg = 'Expense saved successfully!';
          const catId = this.expenseForm.value.categoryId;
          const numericCatId = (catId && catId !== '0') ? parseInt(catId, 10) : null;
          this.budgetAlertService.checkBudgetThresholds(numericCatId);
          setTimeout(() => this.router.navigate(['/dashboard/expenses']), 1200);
        },
        error: (err) => {
          this.submitting = false;
          // Try to parse server-side budget error
          const serverMsg = err?.error?.message;
          if (serverMsg) {
            this.errorMsg = `❌ ${serverMsg}`;
          } else {
            this.errorMsg = 'Failed to save expense. Please try again.';
          }
        }
      });
    } else {
      this.expenseForm.markAllAsTouched();
    }
  }
}
