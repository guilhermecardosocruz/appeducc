import Link from "next/link";
import { notFound } from "next/navigation";
import AttendanceDetailClient from "@/components/AttendanceDetailClient";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type PageProps = {
  params: Promise<{ classId: string; attendanceId: string }>;
};

function formatDateInput(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function canManageGroupRole(role: string | null | undefined) {
  const normalized = String(role ?? "").trim().toUpperCase();
  return normalized === "OWNER" || normalized === "MANAGER";
}

export default async function AttendanceDetailPage({ params }: PageProps) {
  const user = await getSessionUser();

  if (!user) {
    notFound();
  }

  const { classId, attendanceId } = await params;

  const attendanceBase = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      class: {
        include: {
          school: true,
          students: {
            where: {
              status: "ACTIVE",
            },
            select: {
              id: true,
              name: true,
            },
            orderBy: {
              name: "asc",
            },
          },
        },
      },
      presences: {
        select: {
          id: true,
          studentId: true,
          present: true,
        },
      },
    },
  });

  if (!attendanceBase || attendanceBase.classId !== classId) {
    notFound();
  }

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId: user.id,
          schoolId: attendanceBase.class.schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId: user.id,
          groupId: attendanceBase.class.school.groupId,
        },
      },
    }),
  ]);

  const isTeacherOfClass = attendanceBase.class.teacherId === user.id;
  const hasAccess =
    Boolean(schoolMembership) || Boolean(groupMembership) || isTeacherOfClass;
  const canManage =
    Boolean(schoolMembership) ||
    Boolean(groupMembership && canManageGroupRole(groupMembership.role)) ||
    isTeacherOfClass;

  if (!hasAccess) {
    notFound();
  }

  const existingStudentIds = new Set(
    attendanceBase.presences.map((item) => item.studentId)
  );

  const missingStudents = attendanceBase.class.students.filter(
    (student) => !existingStudentIds.has(student.id)
  );

  if (missingStudents.length > 0 && canManage) {
    await prisma.attendancePresence.createMany({
      data: missingStudents.map((student) => ({
        attendanceId,
        studentId: student.id,
        present: false,
      })),
      skipDuplicates: true,
    });
  }

  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      class: {
        include: {
          school: true,
        },
      },
      presences: {
        where: {
          student: {
            status: "ACTIVE",
          },
        },
        include: {
          student: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          student: {
            name: "asc",
          },
        },
      },
    },
  });

  if (!attendance || attendance.classId !== classId) {
    notFound();
  }

  const initialPresences = attendance.presences.map((item) => ({
    id: item.id,
    present: item.present,
    student: {
      id: item.student.id,
      name: item.student.name,
    },
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6">
          <Link
            href={`/classes/${classId}/chamadas`}
            className="text-sm font-medium text-sky-700 hover:text-sky-800"
          >
            ← Voltar para chamadas
          </Link>
        </div>

        {!canManage ? (
          <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Você está com acesso somente de visualização nesta chamada.
          </div>
        ) : null}

        <AttendanceDetailClient
          attendanceId={attendance.id}
          classId={classId}
          initialTitle={attendance.title}
          initialLessonDate={formatDateInput(attendance.lessonDate)}
          initialPresences={initialPresences}
        />
      </div>
    </main>
  );
}
