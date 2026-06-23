import Role from "../model/role";

export type SystemRoleCode = "SUPER_ADMIN" | "ADMIN" | "EMPLOYEE";

const roles: Array<{
  code: SystemRoleCode;
  name: string;
  description: string;
}> = [
  {
    code: "SUPER_ADMIN",
    name: "Super Admin",
    description: "Usuario con acceso total al sistema.",
  },
  {
    code: "ADMIN",
    name: "Admin",
    description: "Usuario administrador de recursos humanos y operaciones.",
  },
  {
    code: "EMPLOYEE",
    name: "Employee",
    description: "Usuario empleado con acceso a sus módulos personales.",
  },
];

export const seedRoles = async () => {
  for (const role of roles) {
    await Role.findOneAndUpdate(
      { code: role.code },
      {
        $set: {
          code: role.code,
          name: role.name,
          description: role.description,
          isActive: true,
          isDeleted: false,
        },
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      },
    );
  }

  console.log("[seedRoles]: Seed completado");
};