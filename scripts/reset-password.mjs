import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  const newPassword = process.argv[3];

  if (!email || !newPassword) {
    console.error('Uso: node scripts/reset-password.mjs "email" "nova_senha"');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);

  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { passwordHash },
    select: {
      id: true,
      name: true,
      email: true,
      isTeacher: true,
    },
  });

  console.log("Senha atualizada com sucesso:");
  console.log(user);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
