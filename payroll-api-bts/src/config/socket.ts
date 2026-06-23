import { Server as SocketIOServer, Socket as IOSocket } from "socket.io";
import http from "http";
import * as jwt from "jsonwebtoken";
import User from "../model/account/user";
import Department from "../model/rrhh/department";

let io: SocketIOServer;

function pickCode(v: any): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v.code || v?.[0]?.code || "";
}

function pickId(v: any): string {
  if (!v) return "";
  // soporta: ObjectId directo, objeto populate, o string
  return String(v?._id ?? v);
}

export const initializeSocket = (server: http.Server) => {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket) => {
    try {
      const token =
        socket.handshake.auth?.token || socket.handshake.query?.token || null;

      if (!token || typeof token !== "string") {
        socket.disconnect(true);
        return;
      }

      const payload: any = jwt.verify(token, process.env.SECRETORPRIVATEKEY!);

      const userId = payload?.uid;
      if (!userId) {
        socket.disconnect(true);
        return;
      }

      // Usuario real en DB (rol/departamento pueden haber cambiado)
      const user: any = await User.findById(userId)
        .select("_id rol department jobPosition project isActive isDeleted")
        .populate({ path: "rol", select: "code name" })
        .populate({ path: "department", select: "code name managers" }) // managers opcional
        .populate({ path: "jobPosition", select: "code name" })
        .populate({ path: "project", select: "code name" })
        .lean();

      if (!user || user.isDeleted || user.isActived === false) {
        socket.disconnect(true);
        return;
      }

      const uid = String(user._id);

      // 1) Room por usuario
      socket.join(`user:${uid}`);
      socket.data.userId = uid;

      // 2) Room por rol
      const roleCode = pickCode(user.rol) || pickCode(payload?.role);
      if (roleCode) {
        socket.join(`role:${roleCode}`);
        socket.data.role = roleCode;
      }

      // 3) Room por department (del usuario)
      const deptId = pickId(user.department);
      const deptCode = pickCode(user.department);
      if (deptId) {
        socket.join(`department:${deptId}`);
        socket.data.departmentId = deptId;
      }
      if (deptCode) {
        socket.join(`departmentCode:${deptCode}`); // opcional, útil si trabajas por códigos
        socket.data.departmentCode = deptCode;
      }

      // 4) Room por jobPosition
      const jobPositionId = pickId(user.jobPosition);
      const jobPositionCode = pickCode(user.jobPosition);
      if (jobPositionId) {
        socket.join(`jobPosition:${jobPositionId}`);
        socket.data.jobPositionId = jobPositionId;
      }
      if (jobPositionCode) {
        socket.join(`jobPositionCode:${jobPositionCode}`); // opcional
        socket.data.jobPositionCode = jobPositionCode;
      }

      // 5) Room por project
      const projectId = pickId(user.project);
      const projectCode = pickCode(user.project);
      if (projectId) {
        socket.join(`project:${projectId}`);
        socket.data.projectId = projectId;
      }
      if (projectCode) {
        socket.join(`projectCode:${projectCode}`); // opcional
        socket.data.projectCode = projectCode;
      }

      // 6) Managers (global) y Managers por departamento
      // Si solo quieres boolean: Department.exists(...)
      // Pero como también quieres "managers de un departamento", traemos la lista:
      const managedDepts = await Department.find({
        isDeleted: false,
        isActive: true,
        managers: user._id,
      })
        .select("_id code name")
        .lean();

      if (managedDepts?.length) {
        // sala global: todos los managers
        socket.join("managers");
        socket.data.isManager = true;

        // salas por dept: managers de ese dept específico
        for (const d of managedDepts) {
          const mid = String(d._id);
          socket.join(`departmentManagers:${mid}`);
        }
      } else {
        socket.data.isManager = false;
      }
    } catch (err) {
      socket.disconnect(true);
    }
  });
};

// Exportar el objeto io para uso en toda la aplicación
export const getSocketIO = () => {
  if (!io) {
    throw new Error("SocketIO not initialized. Call initializeSocket first.");
  }
  return io;
};
