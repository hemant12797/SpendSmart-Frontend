import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BudgetService } from '../../../core/services/budget.service';
import { CategoryService } from '../../../core/services/category.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-add-budget',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-budget.component.html',
  styleUrl: './add-budget.component.css'
})
export class AddBudgetComponent implements OnInit {
  budgetForm!: FormGroup;
  categories: any[] = [];
  submitting = false;
  successMsg = '';
  errorMsg = '';
  displayCategories: any[] = [];

  constructor(
    private fb: FormBuilder,
    private budgetService: BudgetService,
    private categoryService: CategoryService,
    private authService: AuthService,
    private router: Router
  ) {
    this.budgetForm = this.fb.group({
      name: ['', Validators.required],
      limitAmount: ['', [Validators.required, Validators.min(0.01)]],
      categoryId: [''], // Optional
      period: ['MONTHLY', Validators.required]
    });
  }

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    this.categoryService.getCategories(userId).subscribe({
      next: (data) => {
        this.categories = data;
        this.prepareCategoryOptions();
      },
      error: () => {
        this.prepareCategoryOptions();
      }
    });
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
    
    const getCatId = (c: any) => c.categoryId !== undefined ? c.categoryId : c.CategoryId;

    // Add quick categories — use real DB id if matched, else a unique placeholder id
    quickOnes.forEach((qc, index) => {
      const match = this.categories.find(c => 
        c.name.toLowerCase().includes(qc.label.toLowerCase()) || 
        qc.label.toLowerCase().includes(c.name.toLowerCase())
      );
      
      this.displayCategories.push({
        // Use real category id if matched from DB; otherwise unique placeholder (negative index)
        id: match ? String(getCatId(match)) : `__quick_${index}`,
        label: qc.label, // keep original label for budget name
        name: `${qc.icon} ${qc.label}`
      });
    });

    // Add remaining categories from DB (excluding already-added and 'hem')
    this.categories.forEach(c => {
      const isHem = c.name.toLowerCase() === 'hem';
      const cId = String(getCatId(c));
      const type = c.type || c.Type;
      const isExpense = !type || type.toUpperCase() === 'EXPENSE';
      const isDefault = c.isDefault || c.IsDefault;

      const alreadyAdded = this.displayCategories.some(dc => dc.id === cId);
      
      if (!alreadyAdded && !isHem && isExpense && !isDefault) {
        this.displayCategories.push({
          id: cId,
          label: c.name,
          name: c.name
        });
      }
    });
  }

  onCategoryChange(event: any) {
    const selectedId = String(event.target.value);
    const selectedCat = this.displayCategories.find(c => c.id === selectedId);
    
    if (selectedCat) {
      const nameControl = this.budgetForm.get('name');
      // Use label (plain text without icon) as the budget name
      nameControl?.setValue(selectedCat.label || selectedCat.name.replace(/^[^a-zA-Z0-9]+\s*/, ''));
    }
  }

  resetForm() {
    this.budgetForm.reset({
      period: 'MONTHLY'
    });
    this.successMsg = '';
    this.errorMsg = '';
  }

  onSubmit() {
    if (this.budgetForm.valid) {
      this.submitting = true;
      this.errorMsg = '';
      const formValue = this.budgetForm.value;
      
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const budget = {
        ...formValue,
        userId: this.authService.getUserId(),
        // If id is a real numeric DB id, use it; if it's a placeholder or empty, send null
        categoryId: (formValue.categoryId && !formValue.categoryId.startsWith('__quick_') && formValue.categoryId !== '0' && formValue.categoryId !== '')
          ? parseInt(formValue.categoryId, 10)
          : null,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      };

      this.budgetService.createBudget(budget).subscribe({
        next: () => {
          this.submitting = false;
          this.successMsg = 'Budget saved successfully!';
          setTimeout(() => this.router.navigate(['/dashboard']), 1200);
        },
        error: (err) => {
          this.submitting = false;
          const backendMsg = err?.error;
          this.errorMsg = (typeof backendMsg === 'string' && backendMsg.length > 0)
            ? backendMsg
            : 'Failed to save budget. Please try again.';
        }
      });
    } else {
      this.budgetForm.markAllAsTouched();
    }
  }
}
