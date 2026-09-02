// Backend sets HttpOnly cookies, frontend doesn't store tokens
export const auth = {
  // No token storage - relies on HttpOnly cookies
  getSession: async () => {
    // Fetch session from backend (cookies sent automatically)
    const response = await fetch('/api/auth/me', {
      credentials: 'include'
    });
    if (response.ok) {
      return response.json();
    }
    return null;
  },
  
  signOut: async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include'
    });
  }
};
