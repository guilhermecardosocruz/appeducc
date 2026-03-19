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

  const membership = await prisma.schoolMember.findUnique({
    where: {
      userId_schoolId: {
        userId: user.id,
        schoolId: attendanceBase.class.schoolId,
      },
    },
  });

  if (!membership) {
    notFound();
  }

  const existingStudentIds = new Set(
    attendanceBase.presences.map((item) => item.studentId)
  );

  const missingStudents = attendanceBase.class.students.filter(
    (student) => !existingStudentIds.has(student.id)
  );

  if (missingStudents.length > 0) {
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
