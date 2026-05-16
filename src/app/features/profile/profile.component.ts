import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {
  userProfile: any = null;
  loading = true;
  error = '';

  currencies = ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'];
  isSavingCurrency = false;
  currencyMessage = '';

  passwordData = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
  isSavingPassword = false;
  passwordMessage = '';
  passwordError = '';

  constructor(
    public authService: AuthService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const userId = this.authService.getUserId();
    if (userId > 0) {
      this.http.get<any>(`${environment.authApi}/${userId}`).subscribe({
        next: (data) => {
          this.userProfile = data;
          if (this.userProfile.currency) {
            this.userProfile.currency = this.userProfile.currency.toUpperCase();
          } else {
            this.userProfile.currency = 'INR';
          }
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load profile details.';
          this.loading = false;
        }
      });
    } else {
      this.error = 'User not found.';
      this.loading = false;
    }
  }

  updateCurrency() {
    this.isSavingCurrency = true;
    this.currencyMessage = '';
    
    this.authService.updateCurrency(this.userProfile.userId, this.userProfile.currency).subscribe({
      next: () => {
        this.isSavingCurrency = false;
        this.currencyMessage = 'Currency updated successfully!';
        setTimeout(() => this.currencyMessage = '', 3000);
      },
      error: () => {
        this.isSavingCurrency = false;
        this.currencyMessage = 'Failed to update currency.';
      }
    });
  }

  changePassword() {
    this.passwordError = '';
    this.passwordMessage = '';

    if (this.passwordData.newPassword !== this.passwordData.confirmPassword) {
      this.passwordError = 'New passwords do not match!';
      return;
    }
    if (this.passwordData.newPassword.length < 6) {
      this.passwordError = 'New password must be at least 6 characters.';
      return;
    }

    this.isSavingPassword = true;
    this.authService.changePassword(this.userProfile.userId, {
      currentPassword: this.passwordData.currentPassword,
      newPassword: this.passwordData.newPassword
    }).subscribe({
      next: () => {
        this.isSavingPassword = false;
        this.passwordMessage = 'Password changed successfully!';
        this.passwordData = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => this.passwordMessage = '', 3000);
      },
      error: (err) => {
        this.isSavingPassword = false;
        this.passwordError = err.error?.message || 'Failed to change password.';
      }
    });
  }

  logout() {
    this.authService.logout();
  }
}
