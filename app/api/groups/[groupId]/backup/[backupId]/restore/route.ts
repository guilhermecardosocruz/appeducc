import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

type Params = {
  params: Promise<{ groupId: string; backupId: string }>;
};

type BackupData = {
  schools: Array<{
    name: string;
    classes: Array<{
      name: string;
      teacherId?: string | null;
      students: Array<{
        name: string;
      }>;
      contents: Array<{
        title: string;
      }>;
      attendances: Array<{
        lessonDate: string;
        presences: Array<{
          present: boolean;
        }>;
      }>;
    }>;
  }>;
};

export async function POST(_req: Request, { params }: Params) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { groupId, backupId } = await params;

  const backup = await prisma.groupBackup.findUnique({
    where: { id: backupId },
  });

  if (!backup) {
    return NextResponse.json({ error: "Backup não encontrado" }, { status: 404 });
  }

  const data = backup.data as BackupData;

  try {
    await prisma.$transaction(async (tx) => {
      // 🔥 apagar dados atuais do grupo
      const schools = await tx.school.findMany({ where: { groupId } });

      for (const school of schools) {
        const classes = await tx.class.findMany({ where: { schoolId: school.id } });

        for (const cls of classes) {
          await tx.attendancePresence.deleteMany({
            where: {
              attendance: {
                classId: cls.id,
              },
            },
          });

          await tx.attendance.deleteMany({
            where: { classId: cls.id },
          });

          await tx.content.deleteMany({
            where: { classId: cls.id },
          });

          await tx.student.deleteMany({
            where: { classId: cls.id },
          });
        }

        await tx.class.deleteMany({
          where: { schoolId: school.id },
        });
      }

      await tx.school.deleteMany({
        where: { groupId },
      });

      // 🔥 recriar tudo
      for (const school of data.schools) {
        const newSchool = await tx.school.create({
          data: {
            name: school.name,
            groupId,
          },
        });

        for (const cls of school.classes) {
          const newClass = await tx.class.create({
            data: {
              name: cls.name,
              schoolId: newSchool.id,
              teacherId: cls.teacherId ?? null,
            },
          });

          // alunos
          const createdStudents = [];

          for (const student of cls.students) {
            const newStudent = await tx.student.create({
              data: {
                name: student.name,
                classId: newClass.id,
              },
            });
            createdStudents.push(newStudent);
          }

          // conteúdos
          for (const content of cls.contents) {
            await tx.content.create({
              data: {
                title: content.title,
                classId: newClass.id,
              },
            });
          }

          // chamadas + presenças
          for (const attendance of cls.attendances ?? []) {
            const newAttendance = await tx.attendance.create({
              data: {
                title: "Aula restaurada",
                lessonDate: new Date(attendance.lessonDate),
                classId: newClass.id,
              },
            });

            for (const presence of attendance.presences ?? []) {
              const student = createdStudents.shift();

              if (!student) continue;

              await tx.attendancePresence.create({
                data: {
                  attendanceId: newAttendance.id,
                  studentId: student.id,
                  present: presence.present,
                },
              });
            }
          }
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erro ao restaurar" }, { status: 500 });
  }
}
