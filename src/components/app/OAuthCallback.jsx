import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [hasProcessed, setHasProcessed] = React.useState(false);

  useEffect(() => {
    if (hasProcessed) return;
    try {
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      if (!token) return;
      const firstName = params.get('firstName') || '';
      const lastName = params.get('lastName') || '';
      const email = params.get('email') || '';
      const role = params.get('role') || 'client';
      const userId = params.get('userId') || '';
      const user = userId
        ? { _id: userId, firstName, lastName, email, role, token }
        : { firstName, lastName, email, role, token };
      localStorage.setItem('user', JSON.stringify(user));
      setHasProcessed(true);
      navigate('/home', { state: { user }, replace: true });
    } catch (error) {
      console.error('Error in OAuthCallback:', error);
      try {
        const testKey = 'test-storage';
        localStorage.setItem(testKey, testKey);
        localStorage.removeItem(testKey);
      } catch (e) {
        console.error('localStorage not available:', e);
      }
    }
  }, []);

  return (
    <div style={{maxWidth:560, margin:'24px auto', padding:'0 12px'}}>
      <h2>Signing you in...</h2>
    </div>
  );
}
