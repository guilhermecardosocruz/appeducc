import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Uso: node scripts/check-password.mjs "email" "senha"');
    process.exit(1);
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: {
      id: true,
      name: true,
      email: true,
      passwordHash: true,
      isTeacher: true,
    },
  });

  if (!user) {
    console.error("Usuário não encontrado.");
    process.exit(1);
  }

  const ok = await bcrypt.compare(password, user.passwordHash);

  console.log({
    id: user.id,
    name: user.name,
    email: user.email,
    isTeacher: user.isTeacher,
    passwordMatches: ok,
  });
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
