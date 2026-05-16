import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const role = payload.role 
                || payload.Role 
                || payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];
      
      if (role === 'Admin') {
        return true;
      }
    } catch {
      // Ignore token parsing errors
    }
  }
  
  // Redirect to dashboard if not an admin
  router.navigate(['/dashboard']);
  return false;
};
