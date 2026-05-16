import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IncomeService } from '../../../core/services/income.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-add-income',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './add-income.component.html',
  styleUrl: './add-income.component.css'
})
export class AddIncomeComponent implements OnInit {
  incomeForm: FormGroup;
  submitting = false;
  successMsg = '';
  errorMsg = '';

  constructor(
    private fb: FormBuilder,
    private incomeService: IncomeService,
    private authService: AuthService,
    private router: Router
  ) {
    this.incomeForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]],
      source: ['SALARY', Validators.required],
      description: ['', Validators.required],
      date: [new Date().toISOString().substring(0, 10), Validators.required],
      isRecurring: [false]
    });
  }

  ngOnInit(): void {
  }

  resetForm() {
    this.incomeForm.reset({
      date: new Date().toISOString().substring(0, 10),
      source: 'SALARY',
      isRecurring: false
    });
    this.successMsg = '';
    this.errorMsg = '';
  }

  onSubmit() {
    if (this.incomeForm.valid) {
      this.submitting = true;
      this.errorMsg = '';
      const income = {
        ...this.incomeForm.value,
        userId: this.authService.getUserId()
      };

      this.incomeService.addIncome(income).subscribe({
        next: () => {
          this.submitting = false;
          this.successMsg = 'Income saved successfully!';
          setTimeout(() => this.router.navigate(['/dashboard']), 1200);
        },
        error: () => {
          this.submitting = false;
          this.errorMsg = 'Failed to save income. Please try again.';
        }
      });
    } else {
      this.incomeForm.markAllAsTouched();
    }
  }
}
