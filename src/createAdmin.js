import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

(async () => {
  const hash = await bcrypt.hash("123456", 10);

  await prisma.usuario.create({
    data: {
      correo: "manuelcotonio9@gmail.com",
      password: hash,
      role: "Administrador"
    }
  });

  console.log("Admin creado");
  process.exit();
})();