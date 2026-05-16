import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

declare var google: any;

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  successMessage: string = '';
  isLoading = false;
  showPassword = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  ngOnInit() {
    if (typeof google !== 'undefined') {
      google.accounts.id.initialize({
        client_id: environment.googleClientId,
        callback: this.handleGoogleResponse.bind(this)
      });
      google.accounts.id.renderButton(
        document.getElementById("google-btn-register"),
        { theme: "filled_black", size: "large", width: "100%", shape: "rectangular", text: "signup_with" }
      );
    }
  }

  handleGoogleResponse(response: any) {
    if (response.credential) {
      this.isLoading = true;
      this.errorMessage = '';
      this.authService.googleLogin(response.credential).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 0) {
            this.errorMessage = 'Backend server is unreachable. Please ensure the microservices are running.';
          } else {
            this.errorMessage = err.error?.message || 'Google registration failed. Please try again.';
          }
        }
      });
    }
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  get passwordStrength(): number {
    const pw = this.registerForm.get('password')?.value || '';
    if (pw.length === 0) return 0;
    let score = 0;
    if (pw.length >= 6) score += 25;
    if (pw.length >= 10) score += 25;
    if (/[A-Z]/.test(pw)) score += 25;
    if (/[0-9!@#$%^&*]/.test(pw)) score += 25;
    return score;
  }

  get strengthColor(): string {
    const s = this.passwordStrength;
    if (s <= 25) return '#ef4444';
    if (s <= 50) return '#f59e0b';
    if (s <= 75) return '#10b981';
    return '#34d399';
  }

  get strengthLabel(): string {
    const s = this.passwordStrength;
    if (s <= 25) return 'Weak';
    if (s <= 50) return 'Fair';
    if (s <= 75) return 'Good';
    return 'Strong';
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.authService.register(this.registerForm.value).subscribe({
        next: () => {
          this.successMessage = 'Account created! Redirecting to login...';
          setTimeout(() => this.router.navigate(['/login']), 1500);
        },
        error: (err) => {
          this.isLoading = false;
          if (err.status === 0) {
            this.errorMessage = 'Backend server is unreachable. Please ensure the microservices are running.';
          } else {
            this.errorMessage = 'Registration failed. Email may already be in use or data is invalid.';
          }
        }
      });
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

  navigateToLogin() {
    this.router.navigate(['/login']);
  }
}
