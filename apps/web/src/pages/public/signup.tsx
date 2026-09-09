import { Link } from "react-router-dom";

export default function SignupPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold">Signup</h1>
      <p className="text-muted-foreground">Account signup is coming soon.</p>
      <Link className="text-foreground underline" to="/login">
        Back to login
      </Link>
    </section>
  );
}
