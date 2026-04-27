import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

type LoginFormProps = {
  onLogin: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
};

export function LoginForm({ onLogin, isLoading, error }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onLogin(email, password);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg, #f5f5f5)' }}>
      <Card style={{ width: '100%', maxWidth: 400 }}>
        <CardHeader>
          <CardTitle>Prophetize Admin</CardTitle>
          <CardDescription>Sign in with your admin credentials</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <label>
                Email
                <Input type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginTop: 4 }} />
              </label>
              <label>
                Password
                <Input type="password" placeholder="••••••" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ marginTop: 4 }} />
              </label>
              <Button variant="default" type="submit" disabled={isLoading} style={{ width: '100%' }}>
                {isLoading ? 'Signing in...' : 'Sign in'}
              </Button>
            </div>
          </form>
          {error ? <div className="card card--error" style={{ marginTop: 16 }}>{error}</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}
