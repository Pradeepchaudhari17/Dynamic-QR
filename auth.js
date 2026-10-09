const AUTH_STORAGE_KEYS = {
  CURRENT_USER: 'omniqr_current_user_v1',
  REMEMBER: 'omniqr_remember_session'
};

class AuthService {
  constructor() {}

  getCurrentUser() {
    try {
      const rawLocal = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (rawLocal) return JSON.parse(rawLocal);

      const rawSession = sessionStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      if (rawSession) return JSON.parse(rawSession);

      return null;
    } catch (e) {
      return null;
    }
  }

  setCurrentUser(user, remember = true) {
    try {
      if (user) {
        if (remember) {
          localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
          sessionStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
        } else {
          sessionStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
          localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
        }
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
        sessionStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      }
      window.dispatchEvent(new CustomEvent('omniqr:auth-change', { detail: { user } }));
    } catch (e) {
      console.error('Error updating auth session cache:', e);
    }
  }

  async register({ name, email, password, role = 'pro' }) {
    name = (name || '').trim();
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!name) throw new Error('Please provide your full name.');
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Please enter a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    this.setCurrentUser(data.user, true);
    return data.user;
  }

  async login(email, password, remember = true) {
    email = (email || '').trim().toLowerCase();
    password = (password || '').trim();

    if (!email || !password) {
      throw new Error('Please enter both your email address and password.');
    }

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Invalid credentials.');
    }

    this.setCurrentUser(data.user, remember);
    return data.user;
  }

  async quickDemoLogin(type = 'pro') {
    const targetEmail = type === 'pro' ? 'alex@omniqr.pro' : 'demo@omniqr.pro';
    return await this.login(targetEmail, 'password123', true);
  }

  async socialLogin(provider = 'google') {
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const mockEmail = `${provider}.user${randomSuffix}@gmail.com`;
    const mockName = `${provider.toUpperCase()} User ${randomSuffix}`;

    return await this.register({
      name: mockName,
      email: mockEmail,
      password: 'social_pass_' + randomSuffix,
      role: 'pro'
    });
  }

  logout() {
    this.setCurrentUser(null, true);
  }

  async updateProfile({ name, avatarBg }) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('No user currently signed in.');

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id, name, avatarBg })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile.');

    this.setCurrentUser(data.user, true);
    return data.user;
  }

  async changePassword(oldPassword, newPassword) {
    const current = this.getCurrentUser();
    if (!current) throw new Error('No user currently signed in.');

    const res = await fetch('/api/auth/password', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: current.id, oldPassword, newPassword })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to change password.');
    return true;
  }

  calculatePasswordStrength(password) {
    if (!password) {
      return { score: 0, label: 'Empty', color: '#64748B', percent: 0, rules: { length: false, upper: false, number: false, special: false } };
    }

    const rules = {
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[^A-Za-z0-9]/.test(password)
    };

    let score = 0;
    if (password.length >= 6) score += 1;
    if (rules.length) score += 1;
    if (rules.upper) score += 1;
    if (rules.number) score += 1;
    if (rules.special) score += 1;

    if (score <= 1) {
      return { score: 1, label: 'Weak', color: '#F43F5E', percent: 25, rules };
    } else if (score === 2 || score === 3) {
      return { score: 2, label: 'Fair', color: '#F59E0B', percent: 50, rules };
    } else if (score === 4) {
      return { score: 3, label: 'Good', color: '#06B6D4', percent: 75, rules };
    } else {
      return { score: 4, label: 'Strong', color: '#10B981', percent: 100, rules };
    }
  }
}

window.OmniAuth = new AuthService();