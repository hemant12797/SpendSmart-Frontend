import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IncomeService } from '../../../core/services/income.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-income-list',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe, RouterLink],
  templateUrl: './income-list.component.html',
  styleUrl: './income-list.component.css'
})
export class IncomeListComponent implements OnInit {
  incomes: any[] = [];
  filteredIncomes: any[] = [];
  loading = true;
  filter = 'all';

  get totalAmount(): number {
    return this.filteredIncomes.reduce((sum, i) => sum + i.amount, 0);
  }

  constructor(
    private incomeService: IncomeService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    this.incomeService.getIncomes(userId).subscribe({
      next: (data) => {
        this.incomes = data;
        this.filteredIncomes = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  setFilter(f: string) {
    this.filter = f;
    const now = new Date();
    if (f === 'all') {
      this.filteredIncomes = this.incomes;
    } else if (f === 'today') {
      this.filteredIncomes = this.incomes.filter(i => {
        const d = new Date(i.date);
        return d.toDateString() === now.toDateString();
      });
    } else if (f === 'month') {
      this.filteredIncomes = this.incomes.filter(i => {
        const d = new Date(i.date);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    }
  }

  deleteIncome(id: number) {
    if (confirm('Are you sure you want to delete this income?')) {
      this.incomeService.deleteIncome(id).subscribe({
        next: () => {
          this.incomes = this.incomes.filter(i => i.incomeId !== id);
          this.setFilter(this.filter);
        },
        error: () => {
          alert('Failed to delete income. Please try again.');
        }
      });
    }
  }
}
