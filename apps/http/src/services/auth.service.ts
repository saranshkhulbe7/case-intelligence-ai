import { AppError } from "../utils/app-error";
import { db } from "../utils/db";

export async function signupService(
  name: string,
  email: string,
  password: string,
) {
  const existingUser = !!(await db.user.findUnique({
    where: { email },
    select: { id: true },
  }));
  if (existingUser) {
    throw new AppError(409, "Account already exists with this email.");
  }
  const passwordHash = await Bun.password.hash(password);
  return db.user.create({
    data: {
      name,
      email,
      passwordHash,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });
}

export async function loginService(email: string, password: string) {
  const existingUser = await db.user.findUnique({
    where: { email },
  });
  if (!existingUser) {
    throw new AppError(401, "Incorrect credentials.");
  }
  const isValid = await Bun.password.verify(
    password,
    existingUser.passwordHash,
  );
  if (!isValid) {
    throw new AppError(401, "Incorrect credentials.");
  }
  return {
    id: existingUser.id,
    email: existingUser.email,
    name: existingUser.name,
  };
}
