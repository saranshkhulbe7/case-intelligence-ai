import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@agent-platform/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@agent-platform/ui/components/card";
import { Input } from "@agent-platform/ui/components/input";
import { Label } from "@agent-platform/ui/components/label";
import { useForm } from "react-hook-form";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { z } from "zod";
import { trpc } from "../../lib/trpc";

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const me = trpc.authRouter.me.useQuery(undefined, { retry: false });
  const login = trpc.authRouter.login.useMutation({
    async onSuccess() {
      await utils.authRouter.me.invalidate();
      navigate("/");
    },
  });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "saranshkhulbe7@gmail.com",
      password: "password123",
    },
  });

  if (me.isLoading) {
    return <main className="mx-auto max-w-md p-6">Loading session...</main>;
  }

  if (me.data?.user) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center p-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Use your Agent Platform account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => login.mutate(values))}
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
              {form.formState.errors.email && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
              />
              {form.formState.errors.password && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.password.message}
                </p>
              )}
            </div>

            {login.error && (
              <p className="text-sm text-destructive">{login.error.message}</p>
            )}

            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? "Logging in..." : "Login"}
            </Button>
          </form>

          <p className="mt-4 text-sm text-muted-foreground">
            No account?{" "}
            <Link className="text-foreground underline" to="/signup">
              Signup
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
