import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {
  users: any[] = [];
  loading = true;
  error = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.authService.getAllUsers().subscribe({
      next: (data) => {
        this.users = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load users. You might not have permission.';
        this.loading = false;
      }
    });
  }

  onDeleteUser(userIdOrObj: any): void {
    const id = typeof userIdOrObj === 'object' ? (userIdOrObj.userId || userIdOrObj.UserId || userIdOrObj.id) : userIdOrObj;
    if (!id) {
      alert('Error: User ID is missing.');
      return;
    }
    if (confirm(`Are you sure you want to delete user #${id}? This action cannot be undone.`)) {
      this.authService.deleteUser(id).subscribe({
        next: () => {
          this.users = this.users.filter(u => (u.userId || u.UserId || u.id) !== id);
        },
        error: (err) => {
          const msg = err.error?.message || err.error?.title || err.message || JSON.stringify(err.error) || 'Unknown error';
          alert('Failed to delete user: ' + msg);
        }
      });
    }
  }

  onToggleStatus(user: any): void {
    const action = user.isActive ? 'disable' : 'enable';
    const id = user.userId || user.UserId || user.id;
    if (!id) {
      alert('Error: User ID is missing.');
      return;
    }
    if (confirm(`Are you sure you want to ${action} ${user.fullName || user.FullName || user.email || user.Email}?`)) {
      this.authService.toggleUserStatus(id, !!user.isActive).subscribe({
        next: () => {
          user.isActive = !user.isActive;
        },
        error: (err) => {
          const msg = err.error?.message || err.error?.title || err.message || JSON.stringify(err.error) || 'Unknown error';
          alert(`Failed to ${action} user: ` + msg);
        }
      });
    }
  }

  onDeleteAllUsers(): void {
    if (confirm('⚠️ WARNING: This will delete ALL users except admins. Are you absolutely sure?')) {
      const input = prompt('Type "DELETE ALL" to confirm:');
      if (input === 'DELETE ALL') {
        this.authService.deleteAllUsers().subscribe({
          next: () => {
            this.loadUsers();
            alert('All non-admin users have been deleted.');
          },
          error: (err) => {
            const msg = err.error?.message || err.error?.title || err.message || JSON.stringify(err.error) || 'Unknown error';
            alert('Failed to delete all users: ' + msg);
          }
        });
      }
    }
  }
}
