// Onboarding flow removed — profile completion is now done inline via the
// dashboard "Set up your account" checklist. This file is kept as a redirect
// so any stale links don't 404.
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/dashboard', { replace: true });
  }, []);
  return null;
}
