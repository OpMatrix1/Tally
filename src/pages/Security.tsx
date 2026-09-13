import { FormEvent, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function Security() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [verifiedFactors, setVerifiedFactors] = useState(0);
  const [message, setMessage] = useState<string | null>(null);

  async function loadFactors() {
    const { data } = await supabase.auth.mfa.listFactors();
    setVerifiedFactors(data?.totp.filter((factor) => factor.status === 'verified').length ?? 0);
  }

  useEffect(() => {
    void loadFactors();
  }, []);

  async function enroll() {
    setMessage(null);
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp' });
    if (error) {
      setMessage(error.message);
      return;
    }
    setFactorId(data.id);
    setQr(data.totp.qr_code);
  }

  async function verify(event: FormEvent) {
    event.preventDefault();
    if (!factorId) return;
    const challenge = await supabase.auth.mfa.challenge({ factorId });
    if (challenge.error) {
      setMessage(challenge.error.message);
      return;
    }
    const result = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code
    });
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    setQr(null);
    setCode('');
    setFactorId(null);
    setMessage('Two-factor authentication is enabled.');
    await loadFactors();
  }

  return (
    <section className="page-stack">
      <div className="page-heading">
        <div>
          <p className="eyebrow">Account</p>
          <h1>Security</h1>
        </div>
      </div>
      <section className="panel security-panel">
        <div>
          <h2>Two-factor authentication</h2>
          <p>
            Add an authenticator app code to protect sign-ins. Supabase manages enrollment, challenges, and verified
            factors for this account.
          </p>
        </div>
        <div className="status-pill">{verifiedFactors > 0 ? 'Enabled' : 'Not enabled'}</div>
        {!qr && (
          <button className="primary-button" onClick={() => void enroll()}>
            Set up 2FA
          </button>
        )}
        {qr && (
          <form className="mfa-grid" onSubmit={verify}>
            <img src={qr} alt="Authenticator QR code" className="qr-code" />
            <label>
              Verification code
              <input value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" required />
            </label>
            <button className="primary-button">Verify and enable</button>
          </form>
        )}
        {message && <p className="notice">{message}</p>}
      </section>
    </section>
  );
}
