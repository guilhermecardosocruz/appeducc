import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth";

function parseStartDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseEndDate(value: string | null) {
  if (!value) return null;
  const parsed = new Date(`${value}T23:59:59.999`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const url = new URL(req.url);
  const startDate = parseStartDate(url.searchParams.get("startDate"));
  const endDate = parseEndDate(url.searchParams.get("endDate"));

  const groups = await prisma.group.findMany({
    where: {
      OR: [
        { members: { some: { userId: user.id } } },
        {
          schools: {
            some: {
              members: { some: { userId: user.id } },
            },
          },
        },
        {
          schools: {
            some: {
              classes: { some: { teacherId: user.id } },
            },
          },
        },
      ],
    },
    include: {
      schools: {
        include: {
          classes: {
            include: {
              students: {
                where: { status: "ACTIVE", deletedAt: null },
              },
              attendances: {
                include: {
                  presences: {
                    include: {
                      student: {
                        select: {
                          id: true,
                          status: true,
                          deletedAt: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const result = groups.map((group) => {
    let students = 0;
    let presences = 0;
    let absences = 0;
    let attendances = 0;
    let classes = 0;

    group.schools.forEach((school) => {
      school.classes.forEach((cls) => {
        students += cls.students.length;
        classes += 1;

        cls.attendances.forEach((attendance) => {
          const lessonDate = new Date(attendance.lessonDate);

          if (startDate && lessonDate < startDate) return;
          if (endDate && lessonDate > endDate) return;

          attendances += 1;

          attendance.presences.forEach((p) => {
            if (p.student?.deletedAt || p.student?.status !== "ACTIVE") return;

            if (p.present) presences += 1;
            else absences += 1;
          });
        });
      });
    });

    const total = presences + absences;

    return {
      groupId: group.id,
      groupName: group.name,
      schools: group.schools.length,
      classes,
      students,
      totalAttendances: attendances,
      presences,
      absences,
      presenceRate: total > 0 ? Number(((presences / total) * 100).toFixed(2)) : 0,
    };
  });

  return NextResponse.json(result.sort((a, b) => b.presenceRate - a.presenceRate));
}
