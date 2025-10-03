// Placeholder component for cooldown test
export default function AuthCooldownTest() {
  return (
    <div>
      <input type="email" placeholder="Email" aria-label="Email" />
      <button>Send Magic Link</button>
      <button disabled>Resend</button>
    </div>
  );
}