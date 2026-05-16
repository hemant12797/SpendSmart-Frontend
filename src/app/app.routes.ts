import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard/dashboard.component';
import { ExpenseListComponent } from './features/expenses/expense-list/expense-list.component';
import { AddExpenseComponent } from './features/expenses/add-expense/add-expense.component';
import { AddBudgetComponent } from './features/budget/add-budget/add-budget.component';
import { IncomeListComponent } from './features/income/income-list/income-list.component';
import { AddIncomeComponent } from './features/income/add-income/add-income.component';
import { ReportListComponent } from './features/reports/report-list/report-list.component';
import { ProfileComponent } from './features/profile/profile.component';
import { AdminComponent } from './features/admin/admin.component';
import { authGuard } from './core/guards/auth.guard';
import { adminGuard } from './core/guards/admin.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'expenses', pathMatch: 'full' },
      { path: 'expenses', component: ExpenseListComponent },
      { path: 'add-expense', component: AddExpenseComponent },
      { path: 'incomes', component: IncomeListComponent },
      { path: 'add-income', component: AddIncomeComponent },
      { path: 'add-budget', component: AddBudgetComponent },
      { path: 'reports', component: ReportListComponent },
      { path: 'profile', component: ProfileComponent },
      { path: 'admin', component: AdminComponent, canActivate: [adminGuard] }
    ]
  },
  { path: '**', redirectTo: '/dashboard' }
];
