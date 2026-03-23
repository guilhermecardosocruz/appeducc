import { prisma } from "@/lib/prisma";

function normalizeRole(role: string | null | undefined) {
  return String(role ?? "").trim().toUpperCase();
}

function isGroupManagerRole(role: string | null | undefined) {
  const r = normalizeRole(role);
  return r === "OWNER" || r === "MANAGER";
}

export async function canAccessSchool(userId: string, schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { group: true },
  });

  if (!school) return false;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: school.groupId,
        },
      },
    }),
  ]);

  if (schoolMembership) return true;

  if (
    groupMembership &&
    (isGroupManagerRole(groupMembership.role) ||
      groupMembership.canManageSchools)
  ) {
    return true;
  }

  return false;
}

export async function canManageSchool(userId: string, schoolId: string) {
  const school = await prisma.school.findUnique({
    where: { id: schoolId },
    include: { group: true },
  });

  if (!school) return false;

  const [schoolMembership, groupMembership] = await Promise.all([
    prisma.schoolMember.findUnique({
      where: {
        userId_schoolId: {
          userId,
          schoolId,
        },
      },
    }),
    prisma.groupMember.findUnique({
      where: {
        userId_groupId: {
          userId,
          groupId: school.groupId,
        },
      },
    }),
  ]);

  if (schoolMembership) return true;

  if (
    groupMembership &&
    (isGroupManagerRole(groupMembership.role) ||
      groupMembership.canManageSchools)
  ) {
    return true;
  }

  return false;
}

export async function canAccessClass(userId: string, classId: string) {
  const foundClass = await prisma.class.findUnique({
    where: { id: classId },
    include: {
      school: true,
    },
  });

  if (!foundClass) return false;

  return canAccessSchool(userId, foundClass.schoolId);
}

export async function canAccessAttendance(
  userId: string,
  attendanceId: string
) {
  const attendance = await prisma.attendance.findUnique({
    where: { id: attendanceId },
    include: {
      class: {
        include: {
          school: true,
        },
      },
    },
  });

  if (!attendance) return false;

  return canAccessSchool(userId, attendance.class.schoolId);
}

export async function isGroupManager(userId: string, groupId: string) {
  const groupMembership = await prisma.groupMember.findUnique({
    where: {
      userId_groupId: {
        userId,
        groupId,
      },
    },
  });

  if (!groupMembership) return false;

  return isGroupManagerRole(groupMembership.role);
}
